#!/bin/sh
# Super+Shift+U and the waybar hidden count's click (2026-10-30): bring back
# the most recently hidden window (see hide.sh for tags 31/32).
# River commands act on the FOCUSED window, and a hidden one can't be focused
# where it is - so show both hidden tags for an instant (river focuses the
# most recently focused window there = the last one hidden), send it back to
# the tags we came from, and return. A window from tag 32 (was fullscreen)
# comes back as a normal window - see hide.sh for why it isn't re-fullscreened.
# Cost: river records the detour as the "previous tags", so the first
# Super+Tab after an unhide lands on the empty hidden tags - press it again.
# River has no command to set previous tags.
HIDDEN=$((1 << 30))
HIDDEN_FS=$((1 << 31))
riverctl set-focused-tags $((HIDDEN | HIDDEN_FS))
riverctl send-to-previous-tags
riverctl focus-previous-tags
