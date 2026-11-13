// The ? overlay: every binding in KeyMap, and nothing else - it is generated
// from the same table that handles the keys.
import qs
import "widgets"
import QtQuick

Rectangle {
	id: overlay

	property var bindings: []

	color: Qt.rgba(Theme.crust.r, Theme.crust.g, Theme.crust.b, 0.85)

	MouseArea {
		anchors.fill: parent   // swallow clicks behind the card
	}

	Rectangle {
		anchors.centerIn: parent
		width: 560
		height: list.implicitHeight + 56
		radius: 10
		color: Theme.mantle
		border.width: 2
		border.color: Theme.mauve

		Column {
			id: list
			anchors.fill: parent
			anchors.margins: 28
			spacing: 12

			Caption {
				text: "Keys"
				bottomPadding: 4
			}

			Repeater {
				model: overlay.bindings

				delegate: Row {
					required property var modelData
					spacing: 16

					Text {
						width: 120
						text: modelData.keys.join("  /  ")
						color: Theme.mauve
						font.family: "monospace"
						font.pixelSize: 13
					}
					Text {
						width: 360
						wrapMode: Text.Wrap
						text: modelData.help
						color: Theme.text
						font.family: Theme.fontSans
						font.pixelSize: 13
					}
				}
			}
		}
	}
}
