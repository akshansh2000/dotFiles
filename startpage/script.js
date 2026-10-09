"use strict";

// Deliberately no page-level key bindings. Tridactyl owns the keyboard here
// (that is the whole reason this page is served over http rather than being a
// newtab-override extension), so anything bound below would fight it:
//   gi   focus the search box
//   f    hint the links
//   o/t  open in this / a new tab
// Escape is handled inside the input only, which Tridactyl also does - having
// both is harmless and keeps the page usable with Tridactyl disabled.

const clockEl = document.getElementById("clock");
const dateEl = document.getElementById("date");

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
	"Jan", "Feb", "Mar", "Apr", "May", "Jun",
	"Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function render() {
	const now = new Date();
	const hh = String(now.getHours()).padStart(2, "0");
	const mm = String(now.getMinutes()).padStart(2, "0");

	clockEl.textContent = `${hh}:${mm}`;
	dateEl.textContent =
		`${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
}

// Tick on the minute boundary rather than every second: the display only has
// minute resolution, so a 1s interval would be 59 wasted repaints out of 60.
function scheduleTick() {
	const now = new Date();
	const msToNextMinute =
		(60 - now.getSeconds()) * 1000 - now.getMilliseconds();

	setTimeout(() => {
		render();
		scheduleTick();
	}, msToNextMinute);
}

render();
scheduleTick();

// A backgrounded tab has its timers throttled, so the clock can be stale by
// the time the tab is looked at again. Re-render on wake.
document.addEventListener("visibilitychange", () => {
	if (!document.hidden) {
		render();
	}
});

document.getElementById("q").addEventListener("keydown", (e) => {
	if (e.key === "Escape") {
		e.target.blur();
	}
});
