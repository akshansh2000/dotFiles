// The Control centre window (2026-11-13): sections on the left, the chosen
// topic's controls in the centre, its docs and files on the right. Topics
// come from docs/*.md through the Topics service; a topic gets controls when
// sections/<Id>.qml exists (topics.py reports it as `controls`). See DESIGN.md.
import qs
import qs.services
import "."
import "widgets"
import Quickshell
import QtQuick

FloatingWindow {
	id: cc

	property int current: 0
	property bool shown: false
	property bool helpShown: false
	property int focusPanel: 0          // 0 sections, 1 controls, 2 docs (Tab)
	readonly property var topic: Topics.topics.length ? Topics.topics[Math.min(current, Topics.topics.length - 1)] : null

	function step(delta: int) {
		if (focusPanel === 2)
			right.scrollBy(delta * 80);
		else
			jump(current + delta);
	}

	function jump(index: int) {
		if (index >= 0 && index < Topics.topics.length)
			current = index;
	}

	function reload() {
		Topics.reload();
	}

	// On a first open the topics may not be read yet: remember the request
	// and apply it when they arrive.
	property string pendingTopic: ""

	function openTopic(id: string) {
		const i = Topics.topics.findIndex(t => t.id === id);
		if (i >= 0) {
			current = i;
			pendingTopic = "";
		} else {
			pendingTopic = id;
		}
	}

	Connections {
		target: Topics
		function onTopicsChanged() {
			if (cc.pendingTopic !== "")
				cc.openTopic(cc.pendingTopic);
		}
	}

	title: "Control centre"
	implicitWidth: 1200
	implicitHeight: 760
	visible: shown
	color: Theme.base

	Item {
		id: content
		anchors.fill: parent
		focus: true

		KeyMap {
			id: keymap
		}

		Keys.onPressed: event => event.accepted = keymap.handle(event, cc)

		SectionList {
			id: left
			width: 230
			anchors.top: parent.top
			anchors.bottom: parent.bottom
			anchors.left: parent.left
			topics: Topics.topics
			current: cc.current
			focused: cc.focusPanel === 0
			onPicked: index => cc.current = index
		}

		DocPanel {
			id: right
			// Fit the widest file chip in ANY topic (so switching topics doesn't
			// shift the panels), at least 500 px, at most 40% of the window.
			width: Math.max(500, Math.min(cc.width * 0.4, right.neededWidth(Topics.topics)))
			anchors.top: parent.top
			anchors.bottom: parent.bottom
			anchors.right: parent.right
			topic: cc.topic
			focused: cc.focusPanel === 2
		}

		Item {
			id: centre
			anchors.top: parent.top
			anchors.bottom: parent.bottom
			anchors.left: left.right
			anchors.right: right.left
			anchors.margins: 32
			anchors.topMargin: 36

			Text {
				id: heading
				text: cc.topic ? cc.topic.title : ""
				color: Theme.text
				font.family: Theme.fontSans
				font.pixelSize: 22
				font.bold: true
			}

			// A topic's own controls, when sections/<Id>.qml exists ...
			Loader {
				anchors.top: heading.bottom
				anchors.topMargin: 26
				anchors.left: parent.left
				anchors.right: parent.right
				active: !!cc.topic && cc.topic.controls !== ""
				source: active ? Qt.resolvedUrl("sections/" + cc.topic.controls + ".qml") : ""
			}

			// ... otherwise its files, so every section is useful from day one.
			FileGroups {
				anchors.top: heading.bottom
				anchors.topMargin: 26
				anchors.left: parent.left
				anchors.right: parent.right
				visible: !!cc.topic && cc.topic.controls === ""
				groups: cc.topic ? cc.topic.groups : []
			}
		}

		// Focus marker for the centre panel (the side panels draw their own).
		Rectangle {
			visible: cc.focusPanel === 1
			anchors.top: parent.top
			anchors.left: left.right
			anchors.right: right.left
			height: 2
			color: Theme.mauve
		}

		HelpOverlay {
			anchors.fill: parent
			visible: cc.helpShown
			bindings: keymap.bindings
		}
	}
}
