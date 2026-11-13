// Display controls (Control centre): brightness, the wallpaper, and the
// outputs (read-only, from wlr-randr). Every control shows its command.
import qs
import qs.services
import "../widgets"
import Quickshell
import Quickshell.Io
import Qt.labs.folderlistmodel
import QtQuick

Column {
	id: display

	readonly property string home: Quickshell.env("HOME")
	readonly property string wallDir: home + "/Pictures/wallpapers"
	readonly property string link: home + "/.local/state/wallpaper/current"
	property string current: ""   // the image swaybg shows now (link target or the fallback)
	property var outputs: []

	spacing: 28

	component Command: Text {
		color: Theme.overlay0
		font.family: "monospace"
		font.pixelSize: 11
		width: parent.width
		wrapMode: Text.WrapAnywhere
	}

	function setWallpaper(path: string) {
		// The path goes in as $1, never spliced into the script, so any file
		// name is safe.
		Quickshell.execDetached(["sh", "-c",
			'mkdir -p "$(dirname "$2")" && ln -sfn "$1" "$2" && sv restart "$HOME/.local/sv/swaybg"',
			"sh", path, link]);
		current = path;
	}

	function useDefault() {
		Quickshell.execDetached(["sh", "-c", 'rm -f "$1" && sv restart "$HOME/.local/sv/swaybg"', "sh", link]);
		current = home + "/Pictures/wallpaper.png";
	}

	// Re-read what swaybg shows on `r` (Topics reload), e.g. after the link
	// was changed by hand.
	Connections {
		target: Topics
		function onReloadsChanged() { currentReader.running = true; }
	}

	// What swaybg shows now: the link's target, or ~/Pictures/wallpaper.png.
	Process {
		id: currentReader
		running: true
		// readlink -f prints a path even for a missing link, so test it exists first.
		command: ["sh", "-c", '[ -e "$1" ] && readlink -f "$1" || echo "$HOME/Pictures/wallpaper.png"', "sh", display.link]
		stdout: StdioCollector {
			onStreamFinished: display.current = text.trim()
		}
	}

	Process {
		running: true
		command: ["wlr-randr", "--json"]
		stdout: StdioCollector {
			onStreamFinished: {
				try {
					display.outputs = JSON.parse(text);
				} catch (e) {
					display.outputs = [];
				}
			}
		}
	}

	// ---- brightness ----
	Column {
		width: parent.width
		spacing: 10

		Caption { text: "Brightness" }

		Row {
			spacing: 16
			MochaSlider {
				id: bright
				width: 300
				from: 0.01
				to: 1
				stepSize: 0.01
				value: Brightness.level
				// brillo per drag step would spawn dozens of processes; wait
				// for the drag to pause.
				onMoved: settle.restart()
				Timer {
					id: settle
					interval: 80
					onTriggered: Brightness.set(bright.value)
				}
			}
			Text {
				anchors.verticalCenter: parent.verticalCenter
				text: Math.round(Brightness.level * 100) + "%"
				color: Theme.text
				font.family: Theme.fontSans
				font.pixelSize: 13
			}
		}
		Command {
			text: "brillo -S " + Math.round(bright.value * 100) + " && brillo -O"
		}
	}

	// ---- wallpaper ----
	Column {
		width: parent.width
		spacing: 10

		Caption { text: "Wallpaper" }

		GridView {
			id: grid
			width: parent.width
			height: 300
			clip: true
			// At least two columns, ~200 px each, filling the centre panel (it's
			// only ~400 px wide in the 1200 px floating window).
			cellWidth: width / Math.max(2, Math.floor(width / 200))
			cellHeight: Math.round(cellWidth * 9 / 16) + 8

			model: FolderListModel {
				folder: "file://" + display.wallDir
				nameFilters: ["*.png", "*.jpg", "*.jpeg", "*.webp"]
				showDirs: false
				sortField: FolderListModel.Name
			}

			delegate: Item {
				id: cell
				required property string filePath
				width: grid.cellWidth
				height: grid.cellHeight

				Rectangle {
					anchors.fill: parent
					anchors.margins: 4
					radius: 6
					color: Theme.crust
					border.width: 2
					border.color: cell.filePath === display.current ? Theme.mauve
						: (hover.containsMouse ? Theme.surface1 : "transparent")

					Image {
						anchors.fill: parent
						anchors.margins: 3
						source: "file://" + cell.filePath
						sourceSize.width: 400     // ~2x the cell: sharp at scale 1.3
						sourceSize.height: 225
						fillMode: Image.PreserveAspectCrop
						asynchronous: true
					}
				}

				MouseArea {
					id: hover
					anchors.fill: parent
					hoverEnabled: true
					onClicked: display.setWallpaper(cell.filePath)
				}
			}
		}

		Row {
			spacing: 12
			MochaButton {
				text: "Use default"
				active: display.current === display.home + "/Pictures/wallpaper.png"
				onClicked: display.useDefault()
			}
			Text {
				anchors.verticalCenter: parent.verticalCenter
				text: "~/Pictures/wallpaper.png" + (display.current === display.home + "/Pictures/wallpaper.png" ? "  (showing)" : "")
				color: Theme.subtext0
				font.family: "monospace"
				font.pixelSize: 12
			}
		}

		Command {
			text: "click = ln -sfn <image> ~/.local/state/wallpaper/current && sv restart ~/.local/sv/swaybg\n"
				+ "Use default = rm ~/.local/state/wallpaper/current && sv restart ~/.local/sv/swaybg"
		}
	}

	// ---- outputs (read-only) ----
	Column {
		width: parent.width
		spacing: 10

		Caption { text: "Outputs" }

		Repeater {
			model: display.outputs
			delegate: Text {
				required property var modelData
				readonly property var mode: (modelData.modes || []).find(m => m.current)
				text: modelData.name + "   " + (mode ? mode.width + "x" + mode.height + "  " + Math.round(mode.refresh) + " Hz" : "off")
					+ "   scale " + Number(modelData.scale).toFixed(2) + (modelData.enabled ? "" : "   (disabled)")
				color: Theme.text
				font.family: "monospace"
				font.pixelSize: 13
			}
		}

		Command {
			text: "wlr-randr --json   (profiles: kanshi/config)"
		}
	}
}
