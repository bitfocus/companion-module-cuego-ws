import { InstanceBase, runEntrypoint, InstanceStatus } from '@companion-module/base'
import WebSocket from 'ws'
import objectPath from 'object-path'
import { upgradeScripts } from './upgrade.js'
import { CueGO } from './src/cuego.js'
import { createActionDefinitions } from './src/actions.js'
import { createFeedbackDefinitions } from './src/feedback.js'

class WebsocketInstance extends InstanceBase {
	isInitialized = false

	subscriptions = new Map()
	wsRegex = '^wss?:\\/\\/([\\da-z\\.-]+)(:\\d{1,5})?(?:\\/(.*))?$'
	apiKeyRegex = '^[a-zA-Z0-9]{1,32}$'

	displayTimer = null

	async init(config) {
		this.config = config
		this.cuego = new CueGO(this)

		this.initWebSocket()
		this.isInitialized = true
		this.isCueGOInitialized = false

		this.test = false
	}

	updateCompanionState() {
		this.updateVariables()
		this.initActions()
		this.initFeedbacks()
		this.subscribeFeedbacks()
		this.checkFeedbacks()
	}

	async destroy() {
		this.isInitialized = false
		this.methodId = 0

		if (this.reconnect_timer) {
			clearTimeout(this.reconnect_timer)
			this.reconnect_timer = null
		}
		if (this.ws) {
			this.ws.close(1000)
			delete this.ws
		}
	}

	async configUpdated(config) {
		this.config = config
		this.initWebSocket()
	}

	updateVariables(callerId = null) {
		// load variables
		this.setVariableDefinitions(this.cuego.generateTimerVariableDefinitions())
	}

	scheduleReconnection() {
		if (this.isInitialized && this.config.reconnect) {
			if (this.reconnect_timer) {
				clearTimeout(this.reconnect_timer)
			}
			this.reconnect_timer = setTimeout(() => {
				this.initWebSocket()
			}, 5000)
		}
	}

	initWebSocket() {
		if (this.reconnect_timer) {
			clearTimeout(this.reconnect_timer)
			this.reconnect_timer = null
		}

		const url = this.config.url
		if (!url || url.match(new RegExp(this.wsRegex)) === null) {
			this.updateStatus(InstanceStatus.BadConfig, `WS URL is not defined or invalid`)
			return
		}

		this.updateStatus(InstanceStatus.Connecting)

		if (this.ws) {
			this.ws.close(1000)
			delete this.ws
		}
		this.ws = new WebSocket(url)

		this.ws.on('open', () => {
			this.updateStatus(InstanceStatus.Ok)
			this.log('debug', `Connection opened`)

			this.connect()

			this.subscribeToWorkspaces()

			if (this.config.reset_variables) {
				// this.updateVariables()
			}
		})
		this.ws.on('close', (code) => {
			this.log('debug', `Connection closed with code ${code}`)
			this.updateStatus(InstanceStatus.Disconnected, `Connection closed with code ${code}`)
			this.scheduleReconnection()
		})

		this.ws.on('message', (data) => {
			this.messageReceivedFromWebSocket(data)
			this.handlePingPong(data)
		})

		this.ws.on('error', (data) => {
			this.log('error', `WebSocket error: ${data}`)
		})
	}

	connect() {
		try {
			this.ws.send(JSON.stringify(this.cuego.connect()))
		} catch (err) {
			this.log('error', `Error sending connect command: ${err.message}`)
		}
	}

	subscribeToWorkspaces() {
		this.cuego.subscribeTo('ws.user.workspaces', [this.config.api_key])
	}

	messageReceivedFromWebSocket(data) {
		if (this.config.debug_messages) {
			this.log('debug', `Message received: ${data}`)
		}

		let msgValue = null

		try {
			msgValue = JSON.parse(data)
		} catch (e) {
			msgValue = data
		}

		// no sub
		if (msgValue.msg === 'nosub') {
			this.log('debug', `Subscription failed: ${msgValue.error.reason}`)

			if (msgValue.error.error === '403') {
				this.updateStatus(InstanceStatus.BadConfig, `API Key invalid`)
			}
		}

		// update collection
		if (msgValue.msg === 'added') {
			// process workspaces
			if (msgValue.collection === 'workspaces') {
				// add id to fields
				msgValue.fields.id = msgValue.id

				// add workspace
				this.cuego.addWorkspace(msgValue.fields)

				if (this.isCueGOInitialized) {
					this.updateCompanionState()
				}
			}
		}

		// update collection
		if (msgValue.msg === 'changed') {
			// process workspaces
			if (msgValue.collection === 'workspaces') {
				// add id to fields
				msgValue.fields.id = msgValue.id

				// add workspace
				this.cuego.updateWorkspace(msgValue.id, msgValue.fields)

				if (this.isCueGOInitialized) {
					this.updateCompanionState()
				}
			}
		}

		// update subscription on ready
		if (msgValue.msg === 'ready') {
			this.log('debug', `Subscription ready: ${msgValue.subs}`)

			// for each subs update subscription status
			msgValue.subs.forEach((sub) => {
				this.cuego.updateSubscription(sub, {
					ready: true,
				})
			})

			this.isCueGOInitialized = true
		}

		// check if 'api.user.workspaces' is subscribed
		if (msgValue.msg === 'ready') {
			if (this.cuego.isInitSubscriptionsComplete()) {
				this.log('debug', `Lets goooooooo!`)

				this.updateCompanionState()
			}
		}

	}

	handlePingPong(data) {
		let msg = JSON.parse(data)

		if (msg.msg && msg.msg === 'ping') {
			this.log('debug', `Message sent: {"msg": "pong"}`)

			this.ws.send(JSON.stringify(this.cuego.pong()))
		}
	}

	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: '',
			},
			{
				type: 'textinput',
				id: 'url',
				label: 'Target URL',
				tooltip: 'The URL of the WebSocket server (ws[s]://domain[:port][/path])',
				width: 12,
				regex: '/' + this.wsRegex + '/',
			},
			{
				type: 'textinput',
				id: 'api_key',
				label: 'API Key',
				tooltip: 'Connects to the WebSocket server with the given API key',
				width: 12,
				regex: '/' + this.apiKeyRegex + '/',
			},
			{
				type: 'checkbox',
				id: 'reconnect',
				label: 'Reconnect',
				tooltip: 'Reconnect on WebSocket error (after 5 secs)',
				width: 6,
				default: true,
			},
			{
				type: 'checkbox',
				id: 'append_new_line',
				label: 'Append new line',
				tooltip: 'Append new line (\\r\\n) to cuego',
				width: 6,
				default: true,
			},
			{
				type: 'checkbox',
				id: 'debug_messages',
				label: 'Debug messages',
				tooltip: 'Log incomming and outcomming messages',
				width: 6,
			},
			{
				type: 'checkbox',
				id: 'reset_variables',
				label: 'Reset variables',
				tooltip: 'Reset variables on init and on connect',
				width: 6,
				default: true,
			},
		]
	}

	initFeedbacks() {
		this.setFeedbackDefinitions(createFeedbackDefinitions(this))
	}

	initActions() {
		this.setActionDefinitions(createActionDefinitions(this))
	}

}

runEntrypoint(WebsocketInstance, upgradeScripts)
