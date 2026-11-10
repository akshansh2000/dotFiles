pragma Singleton
// Screen backlight level, 0-1. Event-driven, no polling: sysfs files don't
// raise inotify events, but every write to a backlight's `brightness` makes
// the kernel send a `change` uevent (checked 2026-11-11 by writing the same
// value back), so a long-running `udevadm monitor` tells us when to re-read.
// Catches every source of change - brillo from the keys, or anything else.
import Quickshell
import Quickshell.Io
import QtQuick

Singleton {
	id: root

	// The laptop panel. External monitors have no sysfs backlight.
	readonly property string device: "/sys/class/backlight/amdgpu_bl0"
	property real level: 0

	FileView {
		id: maxFile
		path: root.device + "/max_brightness"
		blockLoading: true
	}

	// `brightness` is what was asked for (and what brillo sets);
	// actual_brightness lags behind while the panel fades to it.
	FileView {
		id: current
		path: root.device + "/brightness"
		onLoaded: {
			const max = parseInt(maxFile.text());
			const now = parseInt(text());
			if (max > 0 && !isNaN(now))
				root.level = now / max;
		}
	}

	Process {
		id: monitor
		command: ["udevadm", "monitor", "--kernel", "--subsystem-match=backlight"]
		running: true
		stdout: SplitParser {
			onRead: line => {
				if (line.startsWith("KERNEL["))
					current.reload();
			}
		}
		// udevadm shouldn't exit; if it does, start it again after a second.
		onExited: restart.start()
	}

	Timer {
		id: restart
		interval: 1000
		onTriggered: monitor.running = true
	}
}
