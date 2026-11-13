// Quickshell root (2026-11-11): lists what runs. Started by the supervised
// service in ~/.local/sv/quickshell. Layout:
//   Theme.qml   generated from Theme.qml.tmpl by theme/apply-theme.sh
//   services/   one singleton per data source, no visuals (Audio, ...)
//   osd/        the volume/brightness popup
//   control/    the Control centre window (control/DESIGN.md), docs in ~/.config/docs
// Quickshell reloads itself when any of these files change.
import qs.osd
import Quickshell
import Quickshell.Io
import QtQuick

ShellRoot {
	id: shell
	Osd {}

	// Control centre (2026-11-13): built on first open, then kept (hidden,
	// not destroyed) so reopening is instant. Opened by the Armoury Crate
	// button: `qs ipc call control toggle` (river/keybindings.conf).
	// Loaded by URL, NOT imported: an error anywhere in control/ then only
	// breaks that window when it opens - importing it made one typo stop
	// this whole shell, OSD included (tested 2026-11-13). The cost: edits
	// under control/ need `sv restart ~/.local/sv/quickshell`, no hot reload.
	LazyLoader {
		id: control
		// A plain file:// URL, not qs:@/ - Quickshell only lists folders that
		// imports reach, so under qs: the control/ folder's own types weren't
		// found; file:// gets Qt's normal folder lookup.
		source: "file://" + Quickshell.shellDir + "/control/ControlCentre.qml"
	}

	// Loading by URL is asynchronous: the window may not exist yet when a
	// call arrives, so remember what was asked and apply it once it does.
	// If control/ is broken the item never appears and nothing happens.
	property bool wantShown: false
	property string wantTopic: ""

	function applyControl() {
		if (!control.item)
			return;
		if (wantTopic !== "")
			control.item.openTopic(wantTopic);
		wantTopic = "";
		control.item.shown = wantShown;
	}

	Connections {
		target: control
		function onItemChanged() { applyControl(); }
	}

	IpcHandler {
		target: "control"
		function toggle(): void {
			wantShown = control.item ? !control.item.shown : true;
			control.active = true;
			applyControl();
		}
		function open(id: string): void {
			wantShown = true;
			wantTopic = id;
			control.active = true;
			applyControl();
		}
	}
}
