#!/bin/sh
# The one definition of "lock this session" - called by the Super+Control+Q
# keybinding, by swayidle's 30-minute timeout, and by its before-sleep hook, so
# the lock looks and behaves identically however it is triggered.
#
# waylock draws nothing but a solid colour: no clock, no wallpaper, no text,
# ever. That was the deliberate choice over swaylock (which can do a wallpaper
# but has no clock either - `--clock` is a swaylock-effects feature and that is
# not packaged in Void) and gtklock (which has both, but is a whole GTK app
# running as the session locker).
#
# Colours come from colors.sh rather than a generated file: this is already a
# shell script, so it can just read the palette, and apply-theme.sh chmods
# everything it generates to 644 - a generated script would land unexecutable.
#
#   -fork-on-lock         returns only once the session is actually locked,
#                         which is what makes the before-sleep hook race-free:
#                         swayidle holds the sleep inhibitor until we exit.
#   -ignore-empty-password a stray Enter on wake is not a failed attempt.
#
# If waylock ever crashes the session stays locked at a blank screen - that is
# ext-session-lock working as designed. Ctrl+Alt+F2, log in, `pkill waylock`.
. "$HOME/.config/theme/colors.sh"

exec waylock \
	-fork-on-lock \
	-ignore-empty-password \
	-init-color "0x$THEME_BASE" \
	-input-color "0x$THEME_MAUVE" \
	-input-alt-color "0x$THEME_LAVENDER" \
	-fail-color "0x$THEME_RED"
