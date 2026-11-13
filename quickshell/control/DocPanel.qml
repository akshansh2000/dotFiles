// Right panel (redesigned 2026-11-13): the topic as blocks from topics.py -
// a summary, "At a glance" key/value facts, one card per ## area with its
// points, coloured callouts (WHY mauve, WARNING red, CAUTION peach, TIP green,
// NOTE blue) and copyable commands, then known issues, then the files as
// compact chips per role (hover = full path + note, click = open). The doc
// conventions behind each block are in topics.py and docs/control-centre.md.
import qs
import qs.services
import "."
import "widgets"
import Quickshell
import QtQuick
import QtQuick.Controls

Rectangle {
	id: panel

	property var topic: null
	property bool focused: false
	property var selected: null        // the file chip under the mouse

	readonly property string topicId: topic ? topic.id : ""
	onTopicIdChanged: { scroll.contentItem.contentY = 0; selected = null; }

	function scrollBy(px: real) {
		const f = scroll.contentItem;
		f.contentY = Math.max(0, Math.min(f.contentHeight - f.height, f.contentY + px));
	}

	// ---- auto-fit width: the widest file chip in ANY topic ----
	FontMetrics { id: fm; font.family: "monospace"; font.pixelSize: 13 }
	function chipName(e): string {
		const p = e.path.replace(/\/$/, "");
		return p.split("/").pop() + (e.kind === "folder" ? "/" : "");
	}
	function neededWidth(topics): real {
		let w = 0;
		for (const t of topics)
			for (const g of t.groups)
				for (const e of g.entries) {
					w = Math.max(w, fm.advanceWidth(chipName(e)));
				}
		return 64 + 84 + 18 + 8 + w + 20;   // padding, group label, icon, gap, chip insets
	}

	function openLink(link: string) {
		if (link.startsWith("open:"))
			Quickshell.execDetached([Topics.root + "/quickshell/control/open-path.sh", link.slice(5)]);
		else
			links.open(link, Topics.docsDir);
	}

	LinkOpener { id: links }

	readonly property var calloutStyle: ({
		why: { label: "WHY", color: Theme.mauve, icon: 0xF0335 },
		warning: { label: "WARNING", color: Theme.red, icon: 0xF0026 },
		caution: { label: "CAUTION", color: Theme.peach, icon: 0xF0028 },
		tip: { label: "TIP", color: Theme.green, icon: 0xF0336 },
		note: { label: "NOTE", color: Theme.blue, icon: 0xF02FC }
	})

	color: Theme.mantle

	// Inline Markdown -> rich text for one paragraph: `code`, **bold**, *italic*,
	// [text](link). Qt's MarkdownText hard-codes the link colour (blue, unreadable
	// on Mocha), so links get their colour here.
	function inline(md: string): string {
		const esc = t => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		let h = esc(md || "");
		h = h.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) =>
			'<a href="' + u + '" style="color:' + Theme.mauve + ';text-decoration:none">' + t + '</a>');
		h = h.replace(/`([^`]+)`/g, '<code style="color:' + Theme.subtext0 + '">$1</code>');
		h = h.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<i>$2</i>");
		return h;
	}

	component Md: Text {
		property string md
		text: panel.inline(md)
		wrapMode: Text.Wrap
		textFormat: Text.RichText
		color: Theme.text
		font.family: Theme.fontSans
		font.pixelSize: 14
		lineHeight: 1.25
		onLinkActivated: link => panel.openLink(link)
		HoverHandler { cursorShape: parent.hoveredLink ? Qt.PointingHandCursor : Qt.ArrowCursor }
	}

	component Callout: Row {
		id: co
		property var item
		readonly property var st: panel.calloutStyle[item.kind] || panel.calloutStyle.note
		spacing: 10
		Rectangle { width: 3; height: cbody.height; radius: 1; color: co.st.color }
		Column {
			id: cbody
			width: co.width - 13
			spacing: 3
			Row {
				spacing: 6
				Text {
					text: String.fromCodePoint(co.st.icon)
					color: co.st.color
					font.family: Theme.fontIcons
					font.pixelSize: 13
				}
				Text {
					text: co.st.label
					color: co.st.color
					font.family: Theme.fontSans
					font.pixelSize: 11
					font.bold: true
					font.letterSpacing: 1
				}
			}
			Md { width: cbody.width; md: co.item.md; font.pixelSize: 13 }
		}
	}

	component Command: Rectangle {
		id: cm
		property string cmdText
		property bool copied: false
		height: cmd.implicitHeight + 12
		radius: 5
		color: Theme.crust
		Text {
			id: cmd
			x: 10
			y: 6
			width: cm.width - 44
			text: "$ " + cm.cmdText
			wrapMode: Text.WrapAnywhere
			color: Theme.subtext0
			font.family: "monospace"
			font.pixelSize: 12
		}
		Text {
			anchors.right: parent.right
			anchors.rightMargin: 8
			anchors.top: parent.top
			anchors.topMargin: 6
			text: cm.copied ? "copied" : String.fromCodePoint(0xF018F)
			color: cm.copied ? Theme.green : Theme.overlay0
			font.family: cm.copied ? Theme.fontSans : Theme.fontIcons
			font.pixelSize: 12
		}
		MouseArea {
			anchors.fill: parent
			cursorShape: Qt.PointingHandCursor
			onClicked: {
				Quickshell.execDetached(["wl-copy", cm.cmdText]);
				cm.copied = true;
			}
		}
	}

	component Items: Column {
		id: its
		property var items: []
		spacing: 8
		Repeater {
			model: its.items
			delegate: Loader {
				id: ld
				required property var modelData
				width: its.width
				sourceComponent: modelData.type === "callout" ? callout
					: modelData.type === "command" ? command
					: modelData.type === "point" ? point : plain
				Component { id: callout; Callout { width: ld.width; item: ld.modelData } }
				Component { id: command; Command { width: ld.width; cmdText: ld.modelData.text } }
				Component {
					id: point
					Row {
						width: ld.width
						spacing: 8
						Text { text: "•"; color: Theme.overlay0; font.pixelSize: 14 }
						Md { width: ld.width - 16; md: ld.modelData.md }
					}
				}
				Component { id: plain; Md { width: ld.width; md: ld.modelData.md } }
			}
		}
	}

	ScrollView {
		id: scroll
		anchors.fill: parent
		anchors.margins: 32
		anchors.topMargin: 36
		contentWidth: availableWidth
		clip: true

		Column {
			id: content
			width: scroll.availableWidth
			spacing: 18

			Text {
				visible: panel.topic && panel.topic.error !== ""
				width: content.width
				wrapMode: Text.Wrap
				text: panel.topic ? "Front matter: " + panel.topic.error : ""
				color: Theme.red
				font.family: Theme.fontSans
				font.pixelSize: 13
			}

			// ---- summary ----
			Md {
				visible: md !== ""
				width: content.width
				md: panel.topic ? panel.topic.summary : ""
				color: Theme.subtext0
				font.pixelSize: 16
				lineHeight: 1.3
			}

			// ---- blocks ----
			Repeater {
				model: panel.topic ? panel.topic.blocks : []
				delegate: Column {
					id: block
					required property var modelData
					width: content.width
					spacing: 10

					// At a glance: key / value rows
					Caption { visible: block.modelData.type === "facts"; text: "At a glance" }
					Column {
						visible: block.modelData.type === "facts"
						width: block.width
						spacing: 6
						Repeater {
							model: block.modelData.type === "facts" ? block.modelData.items : []
							delegate: Row {
								id: fact
								required property var modelData
								spacing: 14
								Text {
									width: 120
									text: fact.modelData.key
									color: Theme.overlay0
									font.family: Theme.fontSans
									font.pixelSize: 13
									elide: Text.ElideRight
								}
								Md { width: block.width - 134; md: fact.modelData.value; font.pixelSize: 13 }
							}
						}
					}

					// An area card
					Rectangle {
						visible: block.modelData.type === "card"
						width: block.width
						height: visible ? card.implicitHeight + 28 : 0
						radius: 8
						color: Theme.base
						border.width: 1
						border.color: Theme.surface0
						Column {
							id: card
							x: 14
							y: 14
							width: parent.width - 28
							spacing: 10
							Text {
								text: block.modelData.title || ""
								color: Theme.text
								font.family: Theme.fontSans
								font.pixelSize: 15
								font.bold: true
							}
							Items { width: card.width; items: block.modelData.type === "card" ? block.modelData.items : [] }
						}
					}

					// Known issues: callouts on their own
					Caption { visible: block.modelData.type === "issues"; text: "Known issues" }
					Items {
						visible: block.modelData.type === "issues"
						width: block.width
						items: block.modelData.type === "issues" ? block.modelData.items : []
					}
				}
			}

			// ---- files: one row of chips per role ----
			Rectangle { visible: chips.count > 0; width: content.width; height: 1; color: Theme.surface0 }
			Caption { visible: chips.count > 0; text: "Files" }
			Column {
				width: content.width
				spacing: 8
				Repeater {
					id: chips
					model: panel.topic ? panel.topic.groups : []
					delegate: Row {
						id: grow
						required property var modelData
						spacing: 8
						Text {
							width: 76
							text: grow.modelData.name
							color: Theme.mauve
							font.family: Theme.fontSans
							font.pixelSize: 12
							font.bold: true
							topPadding: 4
						}
						Flow {
							width: content.width - 84
							spacing: 6
							Repeater {
								model: grow.modelData.entries
								delegate: Rectangle {
									id: chip
									required property var modelData
									readonly property bool sel: panel.selected !== null && panel.selected.full === modelData.full
									width: chipRow.implicitWidth + 16
									height: 24
									radius: 5
									color: sel ? Theme.surface0 : (ma.containsMouse ? Theme.crust : Theme.base)
									border.width: 1
									border.color: modelData.kind === "missing" ? Theme.red : (sel ? Theme.mauve : Theme.surface0)
									Row {
										id: chipRow
										x: 8
										anchors.verticalCenter: parent.verticalCenter
										spacing: 6
										Text {
											text: String.fromCodePoint(chip.modelData.kind === "folder" ? 0xF0256
												: chip.modelData.kind === "script" ? 0xF018D
												: chip.modelData.kind === "doc" ? 0xF0354
												: chip.modelData.kind === "missing" ? 0xF0028 : 0xF0224)
											color: chip.modelData.kind === "missing" ? Theme.red : Theme.overlay0
											font.family: Theme.fontIcons
											font.pixelSize: 13
										}
										Text {
											text: panel.chipName(chip.modelData)
											color: chip.modelData.kind === "missing" ? Theme.red : Theme.text
											font.family: "monospace"
											font.pixelSize: 13
										}
									}
									MouseArea {
										id: ma
										anchors.fill: parent
										hoverEnabled: true
										cursorShape: Qt.PointingHandCursor
										onEntered: panel.selected = chip.modelData
										onClicked: Quickshell.execDetached([Topics.root + "/quickshell/control/open-path.sh", chip.modelData.full])
									}
								}
							}
						}
					}
				}
			}

			// Detail for the chip under the mouse: full path, note, folder notes
			Column {
				visible: panel.selected !== null
				width: content.width
				spacing: 3
				Text {
					width: parent.width
					text: panel.selected ? panel.selected.full : ""
					wrapMode: Text.WrapAnywhere
					color: Theme.subtext0
					font.family: "monospace"
					font.pixelSize: 12
				}
				Text {
					visible: panel.selected !== null && panel.selected.note !== ""
					width: parent.width
					wrapMode: Text.Wrap
					text: panel.selected ? panel.selected.note : ""
					color: Theme.overlay0
					font.family: Theme.fontSans
					font.pixelSize: 12
					font.italic: true
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
