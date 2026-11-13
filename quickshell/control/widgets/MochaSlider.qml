// Control centre slider, built on QtQuick.Templates so no Qt style shows.
// Use `value` and the built-in `moved()` signal. `markAt` draws a tick at that
// value (the 100% line on a 0-130% volume slider, like the OSD).
import qs
import QtQuick
import QtQuick.Templates as T

T.Slider {
	id: s

	property real markAt: -1
	property color fillColor: Theme.mauve

	implicitWidth: 280
	implicitHeight: 26

	background: Rectangle {
		x: s.leftPadding
		y: s.topPadding + s.availableHeight / 2 - height / 2
		width: s.availableWidth
		height: 6
		radius: 3
		color: Theme.surface0

		Rectangle {
			width: s.visualPosition * parent.width
			height: parent.height
			radius: parent.radius
			color: s.enabled ? s.fillColor : Theme.overlay0
		}

		Rectangle {
			visible: s.markAt >= s.from && s.markAt <= s.to
			width: 2
			height: 16
			radius: 1
			anchors.verticalCenter: parent.verticalCenter
			x: parent.width * (s.markAt - s.from) / (s.to - s.from) - width / 2
			color: Theme.red
		}
	}

	handle: Rectangle {
		x: s.leftPadding + s.visualPosition * (s.availableWidth - width)
		y: s.topPadding + s.availableHeight / 2 - height / 2
		width: 16
		height: 16
		radius: 8
		color: s.pressed ? Theme.text : (s.enabled ? s.fillColor : Theme.overlay0)
		border.width: 2
		border.color: Theme.mantle
	}
}
