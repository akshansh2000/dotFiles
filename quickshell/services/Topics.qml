pragma Singleton
// The Control centre's topics (2026-11-13): every docs/*.md, read by
// control/topics.py into JSON (front matter, resolved paths, kinds, folder
// notes, whether sections/<Id>.qml exists). Re-read live: inotifywait
// watches docs/, and a 200 ms debounce turns an editor's burst of events
// (swap file, write, rename) into one reload. See control/DESIGN.md §4.3.
import Quickshell
import Quickshell.Io
import QtQuick

Singleton {
	id: topics

	// The repo root (~/.config): the parent of the shell's own folder, so a
	// dev instance and the live shell both resolve paths the same way.
	readonly property string root: Quickshell.shellDir.replace(/\/[^\/]+\/?$/, "")
	readonly property string docsDir: root + "/docs"

	property var topics: []
	property string generated: ""
	property int reloads: 0      // finished loads; for tests and debugging

	property bool pending: false

	function reload() {
		if (reader.running)
			pending = true;
		else
			reader.running = true;
	}

	Process {
		id: reader
		command: ["python3", "-I", topics.root + "/quickshell/control/topics.py",
			"--root", topics.root, "--docs", topics.docsDir,
			"--sections", topics.root + "/quickshell/control/sections"]
		running: true
		stdout: StdioCollector {
			onStreamFinished: {
				try {
					const data = JSON.parse(text);
					topics.topics = data.topics;
					topics.generated = data.generated;
				} catch (e) {
					console.warn("topics.py gave unparsable output:", e);
				}
				topics.reloads++;
			}
		}
		onExited: if (topics.pending) {
			topics.pending = false;
			running = true;
		}
	}

	Process {
		id: watcher
		command: ["inotifywait", "-m", "-q", "-e", "close_write,create,delete,moved_to,moved_from",
			topics.docsDir]
		running: true
		stdout: SplitParser {
			onRead: debounce.restart()
		}
		// inotifywait shouldn't exit; if it does (docs/ missing?), retry in 1 s.
		onExited: restart.start()
	}

	Timer {
		id: debounce
		interval: 200
		onTriggered: topics.reload()
	}

	Timer {
		id: restart
		interval: 1000
		onTriggered: watcher.running = true
	}
}
