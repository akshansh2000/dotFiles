// Right panel: the topic's front-matter error (if any - first, so a typo is
// seen), its Markdown, then its files with any folder NOTES.md. Spacing as
// approved on the spike (2026-11-13): 32 px padding, 15 px text, 1.35 line
// height. Links in the Markdown are clickable (LinkOpener).
import qs
import qs.services
import "."
import "widgets"
import QtQuick
import QtQuick.Controls

Rectangle {
	id: panel

	property var topic: null
	property bool focused: false

	// Back to the top when the TOPIC changes - not when the same topic is
	// re-read (saving the doc you're reading shouldn't jump you to the top).
	readonly property string topicId: topic ? topic.id : ""
	onTopicIdChanged: scroll.contentItem.contentY = 0

	function scrollBy(px: real) {
		const f = scroll.contentItem;   // the ScrollView's Flickable
		f.contentY = Math.max(0, Math.min(f.contentHeight - f.height, f.contentY + px));
	}

	LinkOpener {
		id: links
	}

	color: Theme.mantle

	ScrollView {
		id: scroll
		anchors.fill: parent
		anchors.margins: 32
		anchors.topMargin: 36
		contentWidth: availableWidth
		clip: true

		Column {
			width: scroll.availableWidth
			spacing: 22

			Text {
				visible: panel.topic && panel.topic.error !== ""
				width: parent.width
				wrapMode: Text.Wrap
				text: panel.topic ? "Front matter: " + panel.topic.error : ""
				color: Theme.red
				font.family: Theme.fontSans
				font.pixelSize: 13
			}

			Text {
				width: parent.width
				wrapMode: Text.Wrap
				textFormat: Text.MarkdownText
				text: panel.topic ? panel.topic.body : ""
				color: Theme.text
				linkColor: Theme.mauve
				lineHeight: 1.35
				font.family: Theme.fontSans
				font.pixelSize: 15
				// relative links resolve from the doc's own folder, docs/
				onLinkActivated: link => links.open(link, Topics.docsDir)
				HoverHandler {
					cursorShape: parent.hoveredLink ? Qt.PointingHandCursor : Qt.ArrowCursor
				}
			}

			Rectangle {
				visible: files.groups.length > 0
				width: parent.width
				height: 1
				color: Theme.surface0
			}

			Caption {
				visible: files.groups.length > 0
				text: "Files"
			}

			FileGroups {
				id: files
				width: parent.width
				groups: panel.topic ? panel.topic.groups : []
				showNotes: true
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
