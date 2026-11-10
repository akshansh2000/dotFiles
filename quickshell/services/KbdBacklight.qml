pragma Singleton
// Keyboard backlight level, 0-1. There is no sysfs LED on this machine:
// river/kbd-backlight talks to the keyboard over hidraw and keeps the level
// (0-3) in a state file, rewritten in place on every step - so watching
// that file (inotify) is the whole mechanism.
import Quickshell
import Quickshell.Io
import QtQuick

Singleton {
	id: root

	readonly property int maxLevel: 3   // kbd-backlight's MAX
	property real level: 0

	FileView {
		path: "/run/asus-kbd-backlight"
		watchChanges: true
		onFileChanged: reload()
		onLoaded: {
			// The file is truncated, then written: skip the empty read.
			const n = parseInt(text());
			if (!isNaN(n))
				root.level = Math.max(0, Math.min(root.maxLevel, n)) / root.maxLevel;
		}
	}
}
