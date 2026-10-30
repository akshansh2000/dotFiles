#!/bin/sh
# Super+J/K (2026-10-30): focus-view, but out of fullscreen first.
# River pins focus to a fullscreen window while its tag is visible:
# `focus-view` does nothing then (tested in a headless river). So if the
# focused window is fullscreen, drop it back to its tile and then move on.
# To put a fullscreen window away and get it back still fullscreen, hide it
# instead (Super+U / Super+Shift+U).
#   usage: focus-view.sh next|previous
[ "$(python3 -I "$HOME/.config/river/fullscreen-focused.py" 2>/dev/null)" = fullscreen ] &&
	riverctl toggle-fullscreen
exec riverctl focus-view "$1"
