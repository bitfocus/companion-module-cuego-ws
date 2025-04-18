import { combineRgb } from '@companion-module/base'

export const createFeedbackDefinitions = (self) => {
	return {
		workspace_status: {
			type: 'boolean',
			name: 'Workspace Status',
			description: 'Receive status changes for a specific workspace.',
			defaultStyle: {
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(220, 53, 69),
			},
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
					default: 'live',
					choices: self.cuego.getWorkspaceStatusOptionSet(),
				},
			],
			callback: (feedback) => {
				// get workspace
				let workspace = self.cuego.getWorkspaceById(feedback.options.workspaceId)

				if (workspace) {
					// return true if status is the same
					return workspace.status === feedback.options.status
				}
				return false
			},
			subscribe: (feedback) => {
				self.subscriptions.set(feedback.id, feedback.options)
			},
			unsubscribe: (feedback) => {
				self.subscriptions.delete(feedback.id)
			},
		},

		workspace_timer_overrunning: {
			type: 'boolean',
			name: 'Workspace Timer Overrunning',
			description: 'Trigger true when a workspace timer is overrunning.',
			defaultStyle: {
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(220, 53, 69),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Workspace Timer',
					id: 'workspaceVariable',
					default: '',
					choices: self.cuego.getWorkspaceVariableOptionSet('timer-overrunning'),
					useVariables: true,
				},
			],
			callback: async (feedback, context) => {
				const overRunning = await context.parseVariablesInString(feedback.options.workspaceVariable)

				// return true if timer is overrunning
				return overRunning === 'true'
			},
		},
	}
}
