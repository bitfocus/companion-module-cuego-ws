# CueGO WebSocket Module for Companion

This module allows you to control CueGO workspaces via WebSocket protocol.

## Configuration

In the module configuration you need to:

1. Enter the WebSocket URL (ws[s]://domain[:port][/path]) default = wss://api.cuego.live/websocket
2. Provide your API Key
3. Optional settings:
   - Reconnect on error
   - Append new line to commands
   - Enable debug messages
   - Reset variables on connect

## Available Actions

- **Set Workspace Status** - Change workspace status (Clear/Connecting/Live)
- **Timer Controls:**
  - Set Timer (with direction and duration)
  - Start Timer
  - Stop Timer
  - Add Time
  - Subtract Time
- **Cue Controls:**
  - Trigger Next Cue
  - Trigger Previous Cue
- **Clicker Controls:**
  - Toggle All Clickers (On/Off)

## Available Feedbacks

- **Workspace Status** - Changes button color based on workspace status
- **Timer Overrun** - Indicates when a workspace timer is overrunning

## Variables

The following variables are available for each workspace:

- $(CueGo:cuego-[workspace]-timer-string)
- $(CueGo:cuego-[workspace]-timer-string-hours)
- $(CueGo:cuego-[workspace]-timer-string-minutes)
- $(CueGo:cuego-[workspace]-timer-string-seconds)
- $(CueGo:cuego-[workspace]-timer-overrunning)

## Version History

### Version 0.9.0

- Initial release with basic workspace control
- Timer functionality
- Status updates
- WebSocket connectivity

## License

See [LICENSE](LICENSE)

## Issues & Feature Requests

Please submit issues and feature requests on the [GitHub repository](https://github.com/bitfocus/companion-module-cuego-ws/issues)
