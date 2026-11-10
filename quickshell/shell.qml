// Quickshell root (2026-11-11): lists what runs. Started by the supervised
// service in ~/.local/sv/quickshell. Layout:
//   Theme.qml   generated from Theme.qml.tmpl by theme/apply-theme.sh
//   services/   one singleton per data source, no visuals (Audio, ...)
//   osd/        the volume/brightness popup
// Quickshell reloads itself when any of these files change.
import qs.osd
import Quickshell

ShellRoot {
	Osd {}
}
