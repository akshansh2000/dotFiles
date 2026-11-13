// Control centre on/off switch (QtQuick.Templates, no Qt style). Use
// `checked` and the built-in `toggled()` signal; `text` is the label.
import qs
import QtQuick
import QtQuick.Templates as T

T.Switch {
	id: t

	implicitWidth: indicator.width + (text ? label.implicitWidth + 12 : 0)
	implicitHeight: 26

	indicator: Rectangle {
		width: 40
		height: 22
		radius: 11
		y: (t.height - height) / 2
		color: t.checked ? Theme.mauve : Theme.surface0
		border.width: 1
		border.color: t.checked ? Theme.mauve : Theme.surface1

		Rectangle {
			width: 16
			height: 16
			radius: 8
			y: 3
			x: t.checked ? parent.width - width - 3 : 3
			color: t.checked ? Theme.mantle : Theme.overlay0
			Behavior on x {
				NumberAnimation { duration: 100 }
			}
		}
	}

	contentItem: Text {
		id: label
		leftPadding: t.indicator.width + 12
		text: t.text
		color: Theme.text
		font.family: Theme.fontSans
		font.pixelSize: 13
		verticalAlignment: Text.AlignVCenter
	}
}
