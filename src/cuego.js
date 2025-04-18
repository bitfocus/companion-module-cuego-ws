import { InstanceStatus } from '@companion-module/base'

export class CueGO {
	constructor(instance) {
		this.instance = instance
		this.id = ''
		this.workspaces = new Map()
		this.presenters = new Map()
		this.subscriptions = new Map()

		this.timer = null
		this.serverTimeOffset = 0
		this.methodId = 0

		this.initTimer()
	}

	// method function
	triggerMethod(method, params) {
		this.methodId++

		let args = [this.instance.config.api_key, method, params]

		console.log('debug', `triggerMethod: ${method}`, args)

		let payload = JSON.stringify({
			msg: 'method',
			method: 'ws.method',
			params: args,
			id: this.methodId.toString(),
		})

		this.instance.ws.send(payload)
	}

	// subscribe to data feed function
	subscribeTo(name, params = []) {
		let newSubId = Math.random().toString(36).slice(2)

		// add to internal subscription
		this.addSubscription({
			id: newSubId,
			name: name,
			params: params,
		})

		let payload = JSON.stringify({
			msg: 'sub',
			id: newSubId,
			name: name,
			params: params,
		})

		this.instance.ws.send(payload)
	}

	//add subscription
	addSubscription(subscription) {
		this.subscriptions.set(subscription.id, subscription)
	}

	// update subscription
	updateSubscription(subscriptionId, data) {
		let sub = this.subscriptions.get(subscriptionId)

		if (sub) {
			let updatedSub = { ...sub, ...data }
			this.subscriptions.set(subscriptionId, updatedSub)
		}
	}

	// return true if 'api.user.workspaces' is subscribed
	isInitSubscriptionsComplete() {
		let workspacesSubInitiated = false
		let presentersSubInitiated = true
		let templatesSubInitiated = true

		this.subscriptions.forEach((sub) => {
			if (sub.name === 'ws.user.workspaces' && sub.ready === true) {
				workspacesSubInitiated = true
			}
		})

		if (workspacesSubInitiated && presentersSubInitiated && templatesSubInitiated) {
			return true
		}

		return false
	}

	// add workspace
	addWorkspace(workspace) {
		this.workspaces.set(workspace.id, workspace)
	}

	// remove workspace
	removeWorkspace(workspace) {
		this.workspaces.delete(workspace.id)
	}

	// update workspace data
	updateWorkspace(workspaceId, data) {
		let workspace = this.workspaces.get(workspaceId)

		if (workspace) {
			let updatedWorkspace = { ...workspace, ...data }
			this.workspaces.set(workspaceId, updatedWorkspace)
		}
	}

	// get workspace
	getWorkspaceById(workspaceId) {
		return this.workspaces.get(workspaceId)
	}

	// get workspaces
	listWorkspaces() {
		return this.workspaces
	}

	// format workspace for options
	getWorkspaceOptionSet() {
		let defaultOption = {
			id: '',
			label: 'Select a workspace',
		}

		let options = []

		this.workspaces.forEach((w) => {
			options.push({
				id: w.id,
				label: w.name,
			})
		})

		let optionSet = [defaultOption, ...options]

		return optionSet
	}

	// format workspace for options
	getWorkspaceVariableOptionSet(variable) {
		let defaultOption = {
			id: '',
			label: 'Select a workspace',
		}

		let options = []

		this.workspaces.forEach((w) => {
			// construct full variable path
			let fullPath = '$(CueGo:cuego-' + this.getWorkspaceSlug(w.name) + '-' + variable + ')'

			options.push({
				id: fullPath,
				label: w.name,
			})
		})

		let optionSet = [defaultOption, ...options]

		return optionSet
	}

	// init timer
	initTimer() {
		if (this.timer) {
			clearInterval(this.timer)
		}

		this.timer = setInterval(() => {
			this.updateTimerVariables()
			this.updateSubscribedFeedbacks()
		}, 500)

		this.getServerTimeOffset()
	}

	// calculate server offset from http://localhost:3000/_timesync
	async getServerTimeOffset() {
		let response = await fetch('https://api.cuego.live/_timesync')
		let now = new Date()
		let serverTime = await response.json()

		let serverTimeOffset = serverTime - now.getTime()
		console.log('debug', 'serverTimeOffsetMs', serverTimeOffset)
		this.serverTimeOffset = serverTimeOffset
		// this.serverTimeOffset = data;
	}

	generateTimerVariableDefinitions() {
		let timers = this.getWorkspaceTimers()
		let variableDefinitions = []

		timers.forEach((timer) => {
			let workspaceName = this.getWorkspaceSlug(timer.name)

			variableDefinitions.push({
				name: timer.name + ' Timer String',
				variableId: 'cuego-' + workspaceName + '-timer-string',
			})

			variableDefinitions.push({
				name: timer.name + ' Timer String (Hours)',
				variableId: 'cuego-' + workspaceName + '-timer-string-hours',
			})

			variableDefinitions.push({
				name: timer.name + ' Timer String (Minutes)',
				variableId: 'cuego-' + workspaceName + '-timer-string-minutes',
			})

			variableDefinitions.push({
				name: timer.name + ' Timer String (Seconds)',
				variableId: 'cuego-' + workspaceName + '-timer-string-seconds',
			})

			variableDefinitions.push({
				name: timer.name + ' Timer Overrunning',
				variableId: 'cuego-' + workspaceName + '-timer-overrunning',
			})
		})

		return variableDefinitions
	}

	updateTimerVariables() {
		let timers = this.getWorkspaceTimers()

		let variables = {}

		timers.forEach((timer) => {
			// format workspace name to url friendly and only include alphanumeric characters
			let workspaceName = this.getWorkspaceSlug(timer.name)

			variables['cuego-' + workspaceName + '-timer-string'] = timer.timerString
			variables['cuego-' + workspaceName + '-timer-string-hours'] = timer.timerStringObject.hours
			variables['cuego-' + workspaceName + '-timer-string-minutes'] = timer.timerStringObject.minutes
			variables['cuego-' + workspaceName + '-timer-string-seconds'] = timer.timerStringObject.seconds
			variables['cuego-' + workspaceName + '-timer-overrunning'] = timer.overRunning
		})

		this.instance.setVariableValues(variables)
	}

	updateSubscribedFeedbacks() {
		this.instance.subscriptions.forEach((sub, key) => {
			if (sub.feedbackType === 'workspace_timer_overrunning') {
				this.instance.updateVariables()
			}
		})
	}

	// calculate workspace timers and add to array of objects with workspace id and time
	getWorkspaceTimers() {
		let timers = []

		this.workspaces.forEach((workspace) => {
			let timerSeconds = 0

			if (workspace == undefined) {
				return false
			}

			if (workspace.timerRunning) {
				// console.log('debug', workspace.countDownTo['$date'])

				var countDownTo = new Date(workspace.countDownTo['$date'])

				// add timezone offset in minutes
				// countDownTo.setMinutes(countDownTo.getMinutes() + workspace.timeZoneOffset);

				// generate utc date
				// Create a new Date object representing the current UTC time
				var utcDate = new Date()

				var currentTime = new Date(utcDate.toISOString())

				if (workspace.timerDirection == 'up') {
					var duration = currentTime - countDownTo
					if (duration < 0.1) {
					} else {
						timerSeconds = Math.floor(duration / 1000)
					}
				} else {
					var duration = countDownTo - currentTime

					timerSeconds = Math.floor(duration / 1000)
				}

				// fix it a bit
				timerSeconds++
			} else {
				if (workspace.forceDisplayInterval && workspace.timerInterval) {
					timerSeconds = workspace.timerInterval
				} else {
					if (workspace.timerStopPoint) {
						if (workspace.timerDirection == 'up') {
							timerSeconds = workspace.timerInterval - workspace.timerStopPoint
						} else {
							timerSeconds = workspace.timerStopPoint
						}
					}
				}
			}

			let overRunning = this.isOverRunning(timerSeconds)
			let formattedTime = timerSeconds

			// convert timer to positive
			if (overRunning) {
				formattedTime = Math.abs(timerSeconds)
			}

			timers.push({
				id: workspace.id,
				name: workspace.name,
				timerSeconds: timerSeconds,
				timerString: this.secondsToHms(formattedTime),
				timerStringObject: this.secondsToHmsObject(formattedTime),
				overRunning: this.isOverRunning(timerSeconds),
			})
		})

		return timers
	}

	// covert seconds to HH:MM:SS
	secondsToHms(timer) {
		let minutes = Math.floor(timer / 60)
		let seconds = timer % 60
		let hours = Math.floor(minutes / 60)
		minutes = minutes % 60

		if (this.pad(hours) == '00') {
			return `${this.pad(minutes)}:${this.pad(seconds)}`
		} else {
			return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`
		}
	}

	secondsToHmsObject(timer) {
		let minutes = Math.floor(timer / 60)
		let seconds = timer % 60
		let hours = Math.floor(minutes / 60)
		minutes = minutes % 60

		return {
			hours: this.pad(hours),
			minutes: this.pad(minutes),
			seconds: this.pad(seconds),
		}
	}

	// overRunning
	isOverRunning(seconds) {
		if (seconds < 0) {
			return true
		}

		return false
	}

	pad(num) {
		num = ('0' + num).slice(-2)
		num = num.replace(/-/g, '0')
		return num
	}

	// return pong
	pong() {
		return {
			msg: 'pong',
		}
	}

	// connect to websocket
	connect() {
		return {
			msg: 'connect',
			version: '1',
			support: ['1', 'pre2', 'pre1'],
		}
	}

	// workspace status
	getWorkspaceStatusOptionSet() {
		return [
			{
				id: 'clear',
				label: 'Clear',
			},
			{
				id: 'connecting',
				label: 'Connecting',
			},
			{
				id: 'live',
				label: 'Live',
			},
		]
	}

	// on off
	getOnOffOptionSet() {
		return [
			{
				id: 'on',
				label: 'On',
			},
			{
				id: 'off',
				label: 'Off',
			},
		]
	}

	// direction
	getDirectionOptionSet() {
		return [
			{
				id: 'up',
				label: 'Up',
			},
			{
				id: 'down',
				label: 'Down',
			},
		]
	}

	// timer modifier
	getTimerModifierOptionSet() {
		return [
			{
				id: 'seconds',
				label: 'Second(s)',
			},
			{
				id: 'hours',
				label: 'Hour(s)',
			},
			{
				id: 'minutes',
				label: 'Minute(s)',
			},
		]
	}

	// workspace name to string
	getWorkspaceSlug(name) {
		name = name.toLowerCase().replace(/ /g, '-')
		// remove special characters except alphanumeric and hyphen
		return name.replace(/[^a-zA-Z0-9-]/g, '')
	}
}
