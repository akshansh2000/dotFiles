// Control centre button (QtQuick.Templates, no Qt style). `active` marks the
// selected choice in a row of buttons (e.g. the current power profile).
import qs
import QtQuick
import QtQuick.Templates as T

T.Button {
	id: b

	property bool active: false

	implicitWidth: Math.max(96, contentItem.implicitWidth + 28)
	implicitHeight: 34

	contentItem: Text {
		text: b.text
		color: b.active ? Theme.mantle : (b.enabled ? Theme.text : Theme.overlay0)
		font.family: Theme.fontSans
		font.pixelSize: 13
		horizontalAlignment: Text.AlignHCenter
		verticalAlignment: Text.AlignVCenter
	}

	background: Rectangle {
		radius: 6
		color: b.active ? Theme.mauve
			: b.down ? Theme.surface1
			: b.hovered ? Theme.surface0 : Theme.crust
		border.width: 1
		border.color: b.active ? Theme.mauve : Theme.surface0
	}
}
