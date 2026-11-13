// Left panel: one row per topic, in the order Topics gives them. The row's
// icon is the topic's front-matter `icon` (an MDI codepoint in hex).
import qs
import "widgets"
import QtQuick

Rectangle {
	id: list

	property var topics: []
	property int current: 0
	property bool focused: false
	signal picked(int index)

	color: Theme.mantle

	Column {
		anchors.fill: parent
		anchors.margins: 12
		anchors.topMargin: 20
		spacing: 4

		Caption {
			text: "Sections"
			leftPadding: 10
			bottomPadding: 8
		}

		Repeater {
			model: list.topics

			delegate: Rectangle {
				id: row
				required property var modelData
				required property int index
				readonly property bool selected: index === list.current

				width: parent.width
				height: 36
				radius: 6
				color: selected ? Theme.surface0 : (hover.containsMouse ? Theme.crust : "transparent")

				Rectangle {
					visible: row.selected
					width: 3
					height: 18
					radius: 2
					anchors.left: parent.left
					anchors.leftMargin: 2
					anchors.verticalCenter: parent.verticalCenter
					color: Theme.mauve
				}

				Row {
					anchors.left: parent.left
					anchors.leftMargin: 14
					anchors.verticalCenter: parent.verticalCenter
					spacing: 10

					Text {
						width: 18
						visible: row.modelData.icon !== ""
						text: row.modelData.icon ? String.fromCodePoint(parseInt(row.modelData.icon, 16)) : ""
						color: row.selected ? Theme.mauve : Theme.overlay0
						font.family: Theme.fontIcons
						font.pixelSize: 15
						anchors.verticalCenter: parent.verticalCenter
					}
					Text {
						text: row.modelData.title
						color: row.selected ? Theme.text : Theme.subtext0
						font.family: Theme.fontSans
						font.pixelSize: 14
						anchors.verticalCenter: parent.verticalCenter
					}
				}

				MouseArea {
					id: hover
					anchors.fill: parent
					hoverEnabled: true
					onClicked: list.picked(row.index)
				}
			}
		}
	}

	Rectangle {
		visible: parent.focused
		anchors.top: parent.top
		anchors.left: parent.left
		anchors.right: parent.right
		height: 2
		color: Theme.mauve
	}
}
