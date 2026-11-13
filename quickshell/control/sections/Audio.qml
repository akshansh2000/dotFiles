// Audio controls (Control centre): pick the default output and input, set
// their volume and mute. Uses the same Audio service as the OSD, so the OSD
// pops up for changes made here too. Every control shows the wpctl command it
// is equivalent to - the change itself goes through the PipeWire API.
import qs
import qs.services
import "../widgets"
import Quickshell.Services.Pipewire
import QtQuick

Column {
	id: audio

	// Real devices only: not app streams.
	readonly property var sinks: Pipewire.nodes.values.filter(n => n.isSink && !n.isStream && n.audio)
	readonly property var sources: Pipewire.nodes.values.filter(n => !n.isSink && !n.isStream && n.audio)
	readonly property string codec: Audio.sink?.properties?.["api.bluez5.codec"] ?? ""

	spacing: 28

	PwObjectTracker {
		objects: audio.sinks.concat(audio.sources)
	}

	component Command: Text {
		color: Theme.overlay0
		font.family: "monospace"
		font.pixelSize: 11
	}

	component DeviceList: Column {
		id: devices
		property var nodes: []
		property var current: null
		property bool output: true
		width: parent.width
		spacing: 6

		Repeater {
			model: devices.nodes
			delegate: Rectangle {
				id: row
				required property var modelData
				readonly property bool isDefault: modelData === devices.current
				width: devices.width
				height: 40
				radius: 6
				color: isDefault ? Theme.surface0 : (hover.containsMouse ? Theme.crust : "transparent")
				border.width: isDefault ? 1 : 0
				border.color: Theme.mauve

				Text {
					anchors.left: parent.left
					anchors.leftMargin: 14
					anchors.verticalCenter: parent.verticalCenter
					text: (row.isDefault ? "●  " : "○  ") + Audio.displayName(row.modelData)
					color: row.isDefault ? Theme.text : Theme.subtext0
					font.family: Theme.fontSans
					font.pixelSize: 14
				}
				MouseArea {
					id: hover
					anchors.fill: parent
					hoverEnabled: true
					onClicked: {
						if (devices.output)
							Pipewire.preferredDefaultAudioSink = row.modelData;
						else
							Pipewire.preferredDefaultAudioSource = row.modelData;
					}
				}
			}
		}

		Text {
			visible: devices.nodes.length === 0
			text: "No devices right now (is wireplumber restarting?)"
			color: Theme.overlay0
			font.family: Theme.fontSans
			font.pixelSize: 13
			font.italic: true
		}

		Command {
			visible: devices.nodes.length > 1
			text: "click = wpctl set-default <id>"
		}
	}

	// ---- output ----
	Column {
		width: parent.width
		spacing: 10

		Caption { text: "Output" }

		DeviceList {
			nodes: audio.sinks
			current: Audio.sink
			output: true
		}

		Text {
			visible: audio.codec !== ""
			text: "Bluetooth codec: " + audio.codec
			color: Theme.subtext0
			font.family: Theme.fontSans
			font.pixelSize: 13
		}

		Row {
			spacing: 16
			MochaSlider {
				id: volume
				width: 300
				from: 0
				to: 1.3
				stepSize: 0.01
				markAt: 1
				enabled: !!Audio.sink
				value: Audio.volume
				fillColor: Math.round(value * 100) > 100 ? Theme.yellow : Theme.mauve
				onMoved: if (Audio.sink) Audio.sink.audio.volume = value
			}
			Text {
				anchors.verticalCenter: parent.verticalCenter
				text: Math.round(Audio.volume * 100) + "%"
				color: Theme.text
				font.family: Theme.fontSans
				font.pixelSize: 13
			}
			MochaToggle {
				anchors.verticalCenter: parent.verticalCenter
				text: "Mute"
				enabled: !!Audio.sink
				checked: Audio.muted
				onToggled: if (Audio.sink) Audio.sink.audio.muted = checked
			}
		}
		Command {
			text: "wpctl set-volume @DEFAULT_AUDIO_SINK@ " + Audio.volume.toFixed(2)
				+ "    wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle"
		}
	}

	// ---- input ----
	Column {
		width: parent.width
		spacing: 10

		Caption { text: "Input" }

		DeviceList {
			nodes: audio.sources
			current: Audio.source
			output: false
		}

		Row {
			spacing: 16
			MochaSlider {
				width: 300
				from: 0
				to: 1
				stepSize: 0.01
				enabled: !!Audio.source
				value: Audio.micVolume
				onMoved: if (Audio.source) Audio.source.audio.volume = value
			}
			Text {
				anchors.verticalCenter: parent.verticalCenter
				text: Math.round(Audio.micVolume * 100) + "%"
				color: Theme.text
				font.family: Theme.fontSans
				font.pixelSize: 13
			}
			MochaToggle {
				anchors.verticalCenter: parent.verticalCenter
				text: "Mute"
				enabled: !!Audio.source
				checked: Audio.micMuted
				onToggled: if (Audio.source) Audio.source.audio.muted = checked
			}
		}
		Command {
			text: "wpctl set-volume @DEFAULT_AUDIO_SOURCE@ " + Audio.micVolume.toFixed(2)
				+ "    wpctl set-mute @DEFAULT_AUDIO_SOURCE@ toggle"
		}
	}
}
