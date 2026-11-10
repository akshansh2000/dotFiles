pragma Singleton
// The default output (sink) and input (source) from PipeWire: volume, mute
// and a display name. No visuals - the OSD and anything later read these.
// Follows the default device: plugging in or connecting Bluetooth headphones
// swaps `sink` and every property below follows it.
import Quickshell
import Quickshell.Services.Pipewire
import QtQuick

Singleton {
	id: root

	readonly property PwNode sink: Pipewire.defaultAudioSink
	readonly property PwNode source: Pipewire.defaultAudioSource

	readonly property real volume: sink?.audio?.volume ?? 0
	readonly property bool muted: sink?.audio?.muted ?? false
	readonly property string sinkName: displayName(sink)

	readonly property real micVolume: source?.audio?.volume ?? 0
	readonly property bool micMuted: source?.audio?.muted ?? false
	readonly property string sourceName: displayName(source)

	// node.description is what wpctl shows ("Laptop Speakers", set by
	// wireplumber/wireplumber.conf.d/51-laptop-speakers.conf).
	function displayName(node) {
		return node ? (node.description || node.nickname || node.name) : "";
	}

	// A node's audio properties stay empty until it is bound; the tracker
	// binds whichever nodes are the defaults right now.
	PwObjectTracker {
		objects: [root.sink, root.source]
	}
}
