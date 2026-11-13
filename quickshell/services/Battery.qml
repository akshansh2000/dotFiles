pragma Singleton
// Battery, charge limit and power profile, read from sysfs (2026-11-13).
// No polling unless something sets `active` (the Control centre's Power
// section does, while it's open): then every 5 s, plus refresh() on demand.
// One `sh` reads every value at once; a missing file reads as "" and its
// property falls back to "unknown" (-1 / ""), never an error.
// "Discharging" = AC0/online is 0, the same rule as river/battery-notify.py
// (BAT0/status says "Not charging" at the charge limit).
import Quickshell
import Quickshell.Io
import QtQuick

Singleton {
	id: battery

	property string batDir: "/sys/class/power_supply/BAT0"
	property string acDir: "/sys/class/power_supply/AC0"
	property string profileDir: "/sys/firmware/acpi"
	property bool active: false

	property var raw: ({})

	readonly property bool present: (raw.capacity ?? "") !== ""
	readonly property int percent: present ? parseInt(raw.capacity) : -1
	readonly property string status: raw.status ?? ""
	readonly property bool onAc: raw.online === "1"
	readonly property real powerW: num(raw.power_now) / 1e6
	readonly property real energyNowWh: num(raw.energy_now) / 1e6
	readonly property real energyFullWh: num(raw.energy_full) / 1e6
	readonly property real energyDesignWh: num(raw.energy_full_design) / 1e6
	readonly property int healthPct: energyDesignWh > 0 ? Math.round(energyFullWh / energyDesignWh * 100) : -1
	readonly property int chargeLimit: (raw.charge_control_end_threshold ?? "") !== "" ? parseInt(raw.charge_control_end_threshold) : -1
	readonly property string profile: raw.platform_profile ?? ""
	readonly property var profiles: (raw.platform_profile_choices ?? "").split(" ").filter(p => p !== "")
	// Minutes to empty (on battery) or to the charge limit (on AC); -1 = unknown.
	readonly property int minutesLeft: {
		if (powerW <= 0.1 || !present)
			return -1;
		if (!onAc)
			return Math.round(energyNowWh / powerW * 60);
		const target = energyFullWh * (chargeLimit > 0 ? chargeLimit : 100) / 100;
		return target > energyNowWh ? Math.round((target - energyNowWh) / powerW * 60) : -1;
	}

	function num(s): real {
		const n = parseFloat(s);
		return isNaN(n) ? 0 : n;
	}

	function refresh() {
		reader.running = true;
	}

	Process {
		id: reader
		command: ["sh", "-c",
			'for f in capacity status power_now energy_now energy_full energy_full_design charge_control_end_threshold; do ' +
			'printf "%s=%s\\n" "$f" "$(cat "$1/$f" 2>/dev/null)"; done; ' +
			'printf "online=%s\\n" "$(cat "$2/online" 2>/dev/null)"; ' +
			'for f in platform_profile platform_profile_choices; do printf "%s=%s\\n" "$f" "$(cat "$3/$f" 2>/dev/null)"; done',
			"sh", battery.batDir, battery.acDir, battery.profileDir]
		stdout: StdioCollector {
			onStreamFinished: {
				const r = {};
				for (const line of text.split("\n")) {
					const i = line.indexOf("=");
					if (i > 0)
						r[line.slice(0, i)] = line.slice(i + 1).trim();
				}
				battery.raw = r;
			}
		}
	}

	Timer {
		interval: 5000
		running: battery.active
		repeat: true
		triggeredOnStart: true
		onTriggered: battery.refresh()
	}
}
