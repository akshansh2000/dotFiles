// Power controls (Control centre): battery stats, the charge limit and the
// power profile. The last two need root: they run the allow-listed helper
// through pkexec, and polkit's agent asks for the password (kept for a few
// minutes). Every action shows its exact command. See docs/power.md.
import qs
import qs.services
import "../widgets"
import Quickshell.Io
import QtQuick
import QtQuick.Templates as T

Column {
	id: power

	readonly property string helper: "/usr/local/libexec/control-centre-helper"
	property bool helperInstalled: false
	property string lastCommand: ""
	property string lastResult: ""

	spacing: 28

	Component.onCompleted: Battery.active = true
	Component.onDestruction: Battery.active = false

	function fmtMinutes(m: int): string {
		if (m < 0)
			return "—";
		return Math.floor(m / 60) + " h " + (m % 60) + " min";
	}

	function runHelper(action: string, value: string) {
		lastCommand = "pkexec " + helper + " " + action + " " + value;
		lastResult = "waiting for the password dialog…";
		job.command = ["pkexec", helper, action, value];
		job.running = true;
	}

	// Is the helper installed? (system/install.sh puts it there.)
	Process {
		running: true
		command: ["test", "-x", power.helper]
		onExited: code => power.helperInstalled = code === 0
	}

	// The one root process at a time.
	Process {
		id: job
		onExited: code => {
			// pkexec: 126 = dialog dismissed / not authorised, 127 = not authorised or no such program.
			power.lastResult = code === 0 ? "done"
				: (code === 126 || code === 127) ? "cancelled"
				: "failed (exit " + code + ")";
			Battery.refresh();
			limit.value = Qt.binding(() => Battery.chargeLimit > 0 ? Battery.chargeLimit : 100);
		}
	}

	component Command: Text {
		color: Theme.overlay0
		font.family: "monospace"
		font.pixelSize: 11
		width: parent.width
		wrapMode: Text.WrapAnywhere
	}

	component Stat: Rectangle {
		property string label
		property string value
		width: 130
		height: 64
		radius: 8
		color: Theme.mantle
		Column {
			anchors.fill: parent
			anchors.margins: 10
			spacing: 4
			Caption { text: label }
			Text {
				text: value
				color: Theme.text
				font.family: Theme.fontSans
				font.pixelSize: 17
			}
		}
	}

	// ---- stats ----
	Column {
		width: parent.width
		spacing: 10

		Caption { text: "Battery" }

		Text {
			visible: !Battery.present
			text: "No battery found"
			color: Theme.overlay0
			font.family: Theme.fontSans
			font.pixelSize: 13
			font.italic: true
		}

		Flow {
			visible: Battery.present
			width: parent.width
			spacing: 10
			Stat { label: "Charge"; value: Battery.percent >= 0 ? Battery.percent + "%" : "—" }
			Stat { label: "State"; value: Battery.onAc ? (Battery.status === "Charging" ? "Charging" : "On AC") : "On battery" }
			Stat { label: "Power"; value: Battery.powerW > 0 ? Battery.powerW.toFixed(1) + " W" : "—" }
			Stat { label: Battery.onAc ? "To limit" : "Left"; value: power.fmtMinutes(Battery.minutesLeft) }
			Stat { label: "Health"; value: Battery.healthPct >= 0 ? Battery.healthPct + "%" : "—" }
		}
		Command {
			visible: Battery.present
			text: "capacity " + Battery.energyFullWh.toFixed(1) + " / " + Battery.energyDesignWh.toFixed(1)
				+ " Wh (full / design)    " + Battery.batDir
		}
	}

	Text {
		visible: !power.helperInstalled
		width: parent.width
		wrapMode: Text.WrapAtWordBoundaryOrAnywhere
		text: "The root helper isn't installed, so the charge limit and power profile are read-only. Install it with: "
			+ "~/.config/system/install.sh usr/local/libexec/control-centre-helper etc/polkit-1/rules.d/50-control-centre.rules"
		color: Theme.yellow
		font.family: Theme.fontSans
		font.pixelSize: 13
	}

	// ---- charge limit ----
	Column {
		width: parent.width
		spacing: 10

		Caption { text: "Charge limit" }

		Text {
			visible: Battery.chargeLimit < 0
			text: "Not available on this machine"
			color: Theme.overlay0
			font.family: Theme.fontSans
			font.pixelSize: 13
			font.italic: true
		}

		Row {
			visible: Battery.chargeLimit >= 0
			spacing: 16
			MochaSlider {
				id: limit
				width: 300
				from: 60
				to: 100
				stepSize: 5
				snapMode: T.Slider.SnapAlways
				enabled: power.helperInstalled && !job.running
				value: Battery.chargeLimit > 0 ? Battery.chargeLimit : 100
				onPressedChanged: if (!pressed && Math.round(value) !== Battery.chargeLimit)
					power.runHelper("charge-limit", String(Math.round(value)))
			}
			Text {
				anchors.verticalCenter: parent.verticalCenter
				text: Math.round(limit.value) + "%"
				color: Theme.text
				font.family: Theme.fontSans
				font.pixelSize: 13
			}
		}
	}

	// ---- power profile ----
	Column {
		width: parent.width
		spacing: 10

		Caption { text: "Power profile" }

		Text {
			visible: Battery.profile === ""
			text: "Not available on this machine"
			color: Theme.overlay0
			font.family: Theme.fontSans
			font.pixelSize: 13
			font.italic: true
		}

		Row {
			visible: Battery.profile !== ""
			spacing: 8
			Repeater {
				model: Battery.profiles
				delegate: MochaButton {
					required property string modelData
					text: modelData
					active: modelData === Battery.profile
					enabled: power.helperInstalled && !job.running
					onClicked: if (modelData !== Battery.profile) power.runHelper("power-profile", modelData)
				}
			}
		}
	}

	Column {
		visible: power.lastCommand !== ""
		width: parent.width
		spacing: 4
		Command { text: power.lastCommand }
		Text {
			text: power.lastResult
			color: power.lastResult === "done" ? Theme.green : Theme.subtext0
			font.family: Theme.fontSans
			font.pixelSize: 12
		}
	}
}
