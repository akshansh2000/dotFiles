// OSD = on-screen display (2026-11-11): a short-lived card at the top
// centre, just under waybar's clock, whenever volume, output device, mic
// mute, screen brightness or keyboard backlight changes. It reacts to the
// VALUE changing (see services/), not to keypresses, so changes from
// headphone buttons, pwvucontrol or Bluetooth show too and no keybinding
// needs to know about it.
import qs
import qs.services
import Quickshell
import Quickshell.Wayland
import QtQuick

Scope {
	id: root

	property string kind: "volume"   // volume | mic | brightness | keyboard
	property bool shown: false

	// Every service starts at 0 and jumps to the real value once it has read
	// it - ignore that, and whatever else changes in the first two seconds.
	property bool armed: false
	Timer {
		interval: 2000
		running: true
		onTriggered: root.armed = true
	}

	Timer {
		id: hideTimer
		interval: 1500
		onTriggered: root.shown = false
	}

	function show(k) {
		if (!armed)
			return;
		kind = k;
		shown = true;
		hideTimer.restart();
	}

	// A new default output (headphones connected) changes sinkName, and
	// usually the volume too: either way the card shows the new device.
	Connections {
		target: Audio
		function onVolumeChanged() { root.show("volume"); }
		function onMutedChanged() { root.show("volume"); }
		function onSinkNameChanged() { root.show("volume"); }
		function onMicMutedChanged() { root.show("mic"); }
	}
	Connections {
		target: Brightness
		function onLevelChanged() { root.show("brightness"); }
	}
	Connections {
		target: KbdBacklight
		function onLevelChanged() { root.show("keyboard"); }
	}

	function glyph(cp) { return String.fromCodePoint(cp); }

	PanelWindow {
		// No `screen`: river puts the surface on the focused output.
		visible: root.shown || card.opacity > 0
		anchors.top: true
		// waybar is 28 px tall (waybar/config.jsonc); sit 8 px under it.
		margins.top: 36
		exclusionMode: ExclusionMode.Ignore
		// Overlay, like mako's critical notifications: above fullscreen windows.
		WlrLayershell.layer: WlrLayer.Overlay
		WlrLayershell.namespace: "quickshell-osd"
		// Click-through: an empty input region.
		mask: Region {}
		color: "transparent"
		implicitWidth: card.implicitWidth
		implicitHeight: card.implicitHeight

		OsdCard {
			id: card
			anchors.fill: parent
			opacity: root.shown ? 1 : 0
			Behavior on opacity {
				NumberAnimation { duration: 150 }
			}

			// Icons: Material Design Icons in Symbols Nerd Font, by codepoint.
			icon: {
				switch (root.kind) {
				case "mic":
					return root.glyph(Audio.micMuted ? 0xF036D : 0xF036C);   // microphone(-off)
				case "brightness":
					return root.glyph(0xF00E0);                               // brightness-7
				case "keyboard":
					return root.glyph(0xF030C);                               // keyboard
				default:
					// One static speaker; the bar carries the level.
					return root.glyph(Audio.muted ? 0xF0581 : 0xF057E);      // volume-off / volume-high
				}
			}
			iconColor: (root.kind === "volume" && Audio.muted)
				|| (root.kind === "mic" && Audio.micMuted) ? Theme.red : Theme.text

			label: root.kind === "mic" ? Audio.sourceName
				: root.kind === "brightness" ? "Display"
				: root.kind === "keyboard" ? "Keyboard"
				: Audio.sinkName

			value: root.kind === "mic" ? Audio.micVolume
				: root.kind === "brightness" ? Brightness.level
				: root.kind === "keyboard" ? KbdBacklight.level
				: Audio.volume

			// The volume bar runs 0-130% with a divider at 100%; above 130%
			// it just stays full. Volume itself is deliberately NOT capped
			// (2026-11-11): channelmix.max-volume in a WirePlumber rule was
			// tried and doesn't clamp this ALSA sink, and a `wpctl -l 1.3`
			// on the key was declined - going past 130% is sometimes wanted.
			maxValue: root.kind === "volume" ? 1.3 : 1
			markAt: root.kind === "volume" ? 1 : -1

			// Muted = grey bar. Yellow from 101% up: compare whole percent,
			// since PipeWire's float for "100%" can land a hair above 1.0.
			barColor: (root.kind === "volume" && Audio.muted)
				|| (root.kind === "mic" && Audio.micMuted) ? Theme.overlay0
				: root.kind === "volume" && Math.round(Audio.volume * 100) > 100 ? Theme.yellow
				: Theme.mauve
		}
	}
}
