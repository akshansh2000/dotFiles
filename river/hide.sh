#!/bin/sh
# Super+U (2026-10-30): hide the focused window. River has no minimise, so
# "hidden" means moved to one of the last two tags - river has exactly 32,
# and these stay clear of any real workspace numbering:
#   tag 31 (1 << 30)  hidden
#   tag 32 (1 << 31)  hidden, and was fullscreen: un-fullscreened first.
#                     It comes back as a normal window (re-fullscreening on
#                     unhide was tried 2026-10-30 and dropped: it looked odd,
#                     and a page's own fullscreen - a YouTube video - doesn't
#                     return anyway, only the browser window does). The split
#                     is kept so it stays known which windows were fullscreen.
# Why a fullscreen window isn't hidden AS fullscreen: river gives focus to a
# fullscreen window whenever its tag is visible, so on unhide's brief visit to
# the hidden tags it would grab focus and always come back first, whatever the
# order things were hidden in (reproduced in a headless river). Parked as a
# normal window, unhide gets last-in-first-out. Cost: it leaves fullscreen
# (one resize) as it goes. Waybar counts both tags (custom/hidden, river-state hidden).
HIDDEN=$((1 << 30))
HIDDEN_FS=$((1 << 31))
if [ "$(python3 -I "$HOME/.config/river/fullscreen-focused.py" 2>/dev/null)" = fullscreen ]; then
	riverctl toggle-fullscreen && riverctl set-view-tags "$HIDDEN_FS"
else
	riverctl set-view-tags "$HIDDEN"
fi
