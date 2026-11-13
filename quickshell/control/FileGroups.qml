// A topic's files, grouped by role as written in its front matter. Each entry:
// a kind icon (detected by topics.py), the path, its note, and - when
// `showNotes` - the folder's NOTES.md. Clicking an entry opens it via
// open-path.sh: a folder in yazi, a file in nvim (sudoedit if it's root's).
// The right panel's file list, and the centre's content for topics without
// their own controls.
import qs
import qs.services
import "."
import "widgets"
import Quickshell
import QtQuick

Column {
	id: fg

	property var groups: []
	property bool showNotes: false

	LinkOpener {
		id: links
	}

	spacing: 18

	function glyph(kind) {
		switch (kind) {
		case "folder": return String.fromCodePoint(0xF0256);   // folder-outline
		case "script": return String.fromCodePoint(0xF018D);   // console
		case "doc": return String.fromCodePoint(0xF0354);      // language-markdown
		case "missing": return String.fromCodePoint(0xF0028);  // alert-circle
		default: return String.fromCodePoint(0xF0224);         // file-outline
		}
	}

	Repeater {
		model: fg.groups

		delegate: Column {
			id: group
			required property var modelData
			width: fg.width
			spacing: 7

			Text {
				text: group.modelData.name
				color: Theme.mauve
				font.family: Theme.fontSans
				font.pixelSize: 13
				font.bold: true
				bottomPadding: 4
			}

			Repeater {
				model: group.modelData.entries

				delegate: Column {
					id: entry
					required property var modelData
					width: group.width
					spacing: 4

					// The whole row (icon, path, note) is the click target.
					MouseArea {
						id: open
						width: entryRow.width
						height: entryRow.height
						hoverEnabled: true
						cursorShape: Qt.PointingHandCursor
						onClicked: Quickshell.execDetached([Topics.root + "/quickshell/control/open-path.sh", entry.modelData.full])

						Row {
							id: entryRow
							spacing: 10
							Text {
								width: 18
								text: fg.glyph(entry.modelData.kind)
								color: entry.modelData.kind === "missing" ? Theme.red : Theme.subtext0
								font.family: Theme.fontIcons
								font.pixelSize: 15
							}
							Column {
								Text {
									text: entry.modelData.path
									color: entry.modelData.kind === "missing" ? Theme.red
										: open.containsMouse ? Theme.mauve : Theme.text
									font.underline: open.containsMouse
									font.family: "monospace"
									font.pixelSize: 13
								}
								Text {
									visible: entry.modelData.note !== ""
									text: entry.modelData.note
									color: Theme.overlay0
									font.family: Theme.fontSans
									font.pixelSize: 12
									font.italic: true
									topPadding: 2
								}
							}
						}
					}

					Text {
						visible: fg.showNotes && entry.modelData.notes !== ""
						width: entry.width - 28
						x: 28
						text: entry.modelData.notes
						textFormat: Text.MarkdownText
						wrapMode: Text.Wrap
						color: Theme.subtext0
						linkColor: Theme.mauve
						font.family: Theme.fontSans
						font.pixelSize: 13
						lineHeight: 1.3
						// relative links resolve from the NOTES.md's own folder
						onLinkActivated: link => links.open(link, entry.modelData.kind === "folder"
							? entry.modelData.full : entry.modelData.full.replace(/\/[^\/]*$/, ""))
						HoverHandler {
							cursorShape: parent.hoveredLink ? Qt.PointingHandCursor : Qt.ArrowCursor
						}
					}
				}
			}
		}
	}
}
