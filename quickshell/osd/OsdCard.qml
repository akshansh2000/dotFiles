// The OSD's card: icon on the left; device label above a level bar on the
// right. No number, by choice. Looks like a mako popup (mantle, 2 px mauve
// border, radius 8, padding 12) so the two read as one family.
import qs
import QtQuick

Rectangle {
	id: card

	property string icon
	property color iconColor: Theme.text
	property string label
	property real value: 0          // 0-1; volume can go above 1
	property real maxValue: 1       // what a full bar means (1.3 for volume)
	property real markAt: -1        // value to draw a divider at; <0 = none
	property color barColor: Theme.mauve

	implicitWidth: 300
	implicitHeight: 64
	radius: 8
	color: Theme.mantle
	border.width: 2
	border.color: Theme.mauve

	Text {
		id: iconText
		anchors.left: parent.left
		anchors.leftMargin: 14
		anchors.verticalCenter: parent.verticalCenter
		width: 32
		horizontalAlignment: Text.AlignHCenter
		text: card.icon
		color: card.iconColor
		font.family: Theme.fontIcons
		font.pixelSize: 26
	}

	Column {
		anchors.left: iconText.right
		anchors.leftMargin: 12
		anchors.right: parent.right
		anchors.rightMargin: 16
		anchors.verticalCenter: parent.verticalCenter
		spacing: 8

		Text {
			width: parent.width
			text: card.label
			elide: Text.ElideRight
			color: Theme.subtext0
			font.family: Theme.fontSans
			font.pixelSize: 13
		}

		Rectangle {
			id: track
			width: parent.width
			height: 6
			radius: 3
			color: Theme.surface0

			Rectangle {
				height: parent.height
				radius: parent.radius
				width: parent.width * Math.max(0, Math.min(card.maxValue, card.value)) / card.maxValue
				color: card.barColor
				Behavior on width {
					NumberAnimation { duration: 80 }
				}
			}

			// Divider (the 100% line on the 0-130% volume bar): taller than
			// the bar so it reads over both the filled and empty parts.
			Rectangle {
				visible: card.markAt >= 0
				width: 2
				height: parent.height + 6
				radius: 1
				anchors.verticalCenter: parent.verticalCenter
				x: parent.width * card.markAt / card.maxValue - width / 2
				color: Theme.subtext0
			}
		}
	}
}
