// actions.js

export const createActionDefinitions = (self) => {
	return {
		// set workspace status
		workspace_status: {
			name: 'Set workspace status',
			options: [
				{
					type: 'dropdown',
					label: 'Workspace',
					id: 'workspaceId',
					default: '',
					choices: self.cuego.getWorkspaceOptionSet(),
				},
				{
					type: 'dropdown',
					label: 'Status',
					id: 'status',
					default: '',
					choices: self.cuego.getWorkspaceStatusOptionSet(),
				},
			],
			callback: async (action, context) => {
				// log workspaces
				console.log('debug', `workspace status trigger:', ${action.options.workspaceId}, ${action.options.status}`)

				let params = {
					status: action.options.status,
				}

				// set workspace status
				self.cuego.triggerMethod('workspaces.status.set', [action.options.workspaceId, params])
			},
		},

		// set workspace timer direction
		workspace_set_timer: {
			name: 'Set workspace timer',
			options: [
				{
					type: 'dropdown',
					label: 'Workspace',
					id: 'workspaceId',
					default: '',
					choices: self.cuego.getWorkspaceOptionSet(),
				},
				{
					type: 'dropdown',
					label: 'Direction',
					id: 'direction',
					default: 'down',
					choices: self.cuego.getDirectionOptionSet(),
				},
				{
					type: 'textinput',
					label: 'Interval (HH:MM:SS)',
					id: 'time',
					default: '00:00:00',
					regex: '^[0-9]{2}:[0-9]{2}:[0-9]{2}$',
					placeholder: 'HH:MM:SS',
				},
				{
					type: 'checkbox',
					label: 'Start Timer',
					id: 'startTimer',
					default: true,
				},
			],
			callback: async (action, context) => {
				// log workspaces
				console.log(
					'debug',
					`workspace set timer trigger:', ${action.options.workspaceId}, ${action.options.direction}, ${action.options.time}, ${action.options.startTimer}`
				)

				let params = {
					time: action.options.time,
					direction: action.options.direction,
					startTimer: action.options.startTimer,
				}

				// set workspace status
				self.cuego.triggerMethod('workspaces.timer.set', [action.options.workspaceId, params])
			},
		},

		// set workspace timer direction
		workspace_start_timer: {
			name: 'Start workspace timer',
			options: [
				{
					type: 'dropdown',
					label: 'Workspace',
					id: 'workspaceId',
					default: '',
					choices: self.cuego.getWorkspaceOptionSet(),
				},
			],
			callback: async (action, context) => {
				// log workspaces
				console.log('debug', `workspace start timer trigger:', ${action.options.workspaceId}`)

				// set workspace status
				self.cuego.triggerMethod('workspaces.timer.start', [action.options.workspaceId])
			},
		},

		// set workspace timer direction
		workspace_stop_timer: {
			name: 'Stop workspace timer',
			options: [
				{
					type: 'dropdown',
					label: 'Workspace',
					id: 'workspaceId',
					default: '',
					choices: self.cuego.getWorkspaceOptionSet(),
				},
			],
			callback: async (action, context) => {
				// log workspaces
				console.log('debug', `workspace stop timer trigger:', ${action.options.workspaceId}`)

				// set workspace status
				self.cuego.triggerMethod('workspaces.timer.stop', [action.options.workspaceId])
			},
		},

		// add time to workspace timer
		workspace_add_to_timer: {
			name: 'Add time to workspace timer',
			options: [
				{
					type: 'dropdown',
					label: 'Workspace',
					id: 'workspaceId',
					default: '',
					choices: self.cuego.getWorkspaceOptionSet(),
				},
				{
					type: 'dropdown',
					label: 'Time Unit',
					id: 'unit',
					default: 'second',
					choices: self.cuego.getTimerModifierOptionSet(),
				},
				{
					type: 'number',
					label: 'Quantity',
					id: 'time',
					default: '1',
					min: 1,
				},
			],
			callback: async (action, context) => {
				// log workspaces
				console.log('debug', `workspace add time trigger:', ${action.options.workspaceId}`)

				let params = {
					time: parseInt(action.options.time),
					unit: action.options.unit,
				}

				// set workspace status
				self.cuego.triggerMethod('workspaces.timer.add', [action.options.workspaceId, params])
			},
		},

		// set workspace timer direction
		workspace_subtract_to_timer: {
			name: 'Subtract time to workspace timer',
			options: [
				{
					type: 'dropdown',
					label: 'Workspace',
					id: 'workspaceId',
					default: '',
					choices: self.cuego.getWorkspaceOptionSet(),
				},
				{
					type: 'dropdown',
					label: 'Time Unit',
					id: 'unit',
					default: 'second',
					choices: self.cuego.getTimerModifierOptionSet(),
				},
				{
					type: 'number',
					label: 'Quantity',
					id: 'time',
					default: '1',
					min: 1,
				},
			],
			callback: async (action, context) => {
				// log workspaces
				console.log('debug', `workspace add time trigger:', ${action.options.workspaceId}`)

				let params = {
					time: parseInt(action.options.time),
					unit: action.options.unit,
				}

				// set workspace status
				self.cuego.triggerMethod('workspaces.timer.subtract', [action.options.workspaceId, params])
			},
		},

		workspace_toggle_all_clickers: {
			name: 'Toggle all clickers on workspace',
			options: [
				{
					type: 'dropdown',
					label: 'Workspace',
					id: 'workspaceId',
					default: '',
					choices: self.cuego.getWorkspaceOptionSet(),
				},
				{
					type: 'dropdown',
					label: 'Clicker Status',
					id: 'clickerStatus',
					default: 'on',
					choices: self.cuego.getOnOffOptionSet(),
				},
			],
			callback: async (action, context) => {
				// log workspaces
				console.log(
					'debug',
					`workspace clicker toggle trigger:', ${action.options.workspaceId}, ${action.options.clickerStatus}`
				)

				// chck if clicker status is not null
				if (action.options.clickerStatus == 'null') {
					console.log('error', `Clicker status cannot be null`)
					return
				}

				let params = {}

				// set workspace status
				self.ws.send(
					self.cuego.triggerMethod('workspaces.clickers.' + action.options.clickerStatus, [
						action.options.workspaceId,
						params,
					]),
					(err) => {
						if (err) {
							console.log('error', `Error sending workspace status command: ${err}`)
						}
					}
				)
			},
		},

		// set workspace status
		cue_trigger_prev: {
			name: 'Trigger Previous Cue',
			options: [
				{
					type: 'dropdown',
					label: 'Workspace',
					id: 'workspaceId',
					default: '',
					choices: self.cuego.getWorkspaceOptionSet(),
				},
			],
			callback: async (action, context) => {
				// log workspaces
				console.log('debug', `workspace trigger prev cue:', ${action.options.workspaceId}`)

				// set workspace status
				self.ws.send(self.cuego.triggerMethod('workspaces.trigger.back', [action.options.workspaceId]), (err) => {
					if (err) {
						console.log('error', `Error sending workspace trigger cue command: ${err}`)
					}
				})
			},
		},

		// set workspace status
		cue_trigger_next: {
			name: 'Trigger Next Cue',
			options: [
				{
					type: 'dropdown',
					label: 'Workspace',
					id: 'workspaceId',
					default: '',
					choices: self.cuego.getWorkspaceOptionSet(),
				},
			],
			callback: async (action, context) => {
				// log workspaces
				console.log('debug', `workspace trigger next cue:', ${action.options.workspaceId}`)

				// set workspace status
				self.ws.send(self.cuego.triggerMethod('workspaces.trigger.next', [action.options.workspaceId]), (err) => {
					if (err) {
						console.log('error', `Error sending workspace trigger cue command: ${err}`)
					}
				})
			},
		},
	}
}
