// Opens a link clicked in rendered Markdown (topic docs, folder NOTES.md).
// Web links go to the browser; anything else is a path, relative to the
// Markdown file it was written in (as on GitHub), opened like a file entry -
// yazi for a folder, nvim for a file (open-path.sh).
import qs.services
import Quickshell
import QtQuick

QtObject {
	function open(link: string, baseDir: string) {
		if (/^(https?|mailto):/.test(link)) {
			Qt.openUrlExternally(link);
			return;
		}
		let path = link.replace(/^file:\/\//, "").replace(/#.*$/, "");
		if (path === "")
			return;   // an in-page anchor: nothing to open
		if (path.startsWith("~"))
			path = Quickshell.env("HOME") + path.slice(1);
		else if (!path.startsWith("/"))
			path = baseDir + "/" + path;
		Quickshell.execDetached([Topics.root + "/quickshell/control/open-path.sh", path]);
	}
}
