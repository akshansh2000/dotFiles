// The Control centre's keys: ONE table that both handles key presses and
// fills the ? overlay, so the help can never drift from the behaviour.
// Not called Keys.qml: a component named Keys would shadow QtQuick's Keys
// attached property for every file in this folder.
import QtQuick

QtObject {
	// keys: what the overlay shows and what handle() matches ("1-9" = digits).
	readonly property var bindings: [
		{ keys: ["j", "Down"], action: "next", help: "Next section (scrolls the docs when the right panel has focus)" },
		{ keys: ["k", "Up"], action: "prev", help: "Previous section (scrolls the docs when the right panel has focus)" },
		{ keys: ["1-9"], action: "jump", help: "Jump to section 1-9" },
		{ keys: ["Tab"], action: "focus", help: "Move focus: sections → controls → docs" },
		{ keys: ["r"], action: "reload", help: "Re-read docs/ (editing a doc also reloads by itself)" },
		{ keys: ["?"], action: "help", help: "Show or hide this list" },
		{ keys: ["q", "Esc"], action: "close", help: "Close this list, or hide the window" }
	]

	function nameOf(event): string {
		switch (event.key) {
		case Qt.Key_Down: return "Down";
		case Qt.Key_Up: return "Up";
		case Qt.Key_Tab: return "Tab";
		case Qt.Key_Escape: return "Esc";
		}
		if (event.text >= "1" && event.text <= "9" && event.text.length === 1)
			return "1-9";
		return event.text;
	}

	// Runs the matching action on `cc` (the ControlCentre); true if handled.
	function handle(event, cc): bool {
		const name = nameOf(event);
		const b = bindings.find(b => b.keys.includes(name));
		if (!b)
			return false;
		switch (b.action) {
		case "next": cc.step(1); break;
		case "prev": cc.step(-1); break;
		case "jump": cc.jump(parseInt(event.text) - 1); break;
		case "focus": cc.focusPanel = (cc.focusPanel + 1) % 3; break;
		case "reload": cc.reload(); break;
		case "help": cc.helpShown = !cc.helpShown; break;
		case "close":
			if (cc.helpShown)
				cc.helpShown = false;
			else
				cc.shown = false;
			break;
		}
		return true;
	}
}
