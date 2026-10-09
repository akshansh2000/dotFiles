#!/bin/sh
# lid.sh close|open - river's own lid handling (2026-10-09). Bound with
# `riverctl map-switch {normal,locked} lid {close,open}` (see keybindings.conf,
# `raw` lines), so it also runs at the lock screen.
#
# Why river does this and not elogind: /etc/elogind/logind.conf has
# HandleLidSwitchExternalPower=ignore (the user's choice: no suspend on AC), and
# with the event ignored NOTHING reacted to the lid - the panel stayed lit inside
# a closed lid on AC. On battery elogind still suspends, and swayidle-sleep's
# before-sleep hook locks, so this script deliberately does nothing there.
#
#   close, external monitor on   internal panel + kbd backlight off, NO lock
#                                (you're working on the other screen)
#   close, on AC, no external    lock, then internal panel + kbd backlight off
#   close, on battery            nothing (elogind suspends; lock comes from
#                                the before-sleep hook)
#   open                         internal panel + kbd backlight back on (still
#                                locked if it was)
#
# Every event is logged (`logger -t river-lid`, into socklog) - elogind itself
# logs no lid events, which is why earlier lid trouble left no trace.
# Panel/keyboard actions live in idle.sh (lid-off/lid-on) so their save/restore
# state is shared with the idle ladder.

IDLE="$HOME/.config/river/idle.sh"
LOCK="$HOME/.config/waylock/lock.sh"

ac=$(cat /sys/class/power_supply/AC0/online 2>/dev/null || echo 0)
# Enabled outputs other than the built-in eDP panel.
ext=$(wlr-randr --json 2>/dev/null |
	jq '[.[] | select(.enabled and (.name | startswith("eDP") | not))] | length' 2>/dev/null)
ext=${ext:-0}

log() { logger -t river-lid "$*" 2>/dev/null || true; }

case "${1:-}" in
close)
	if [ "$ext" -gt 0 ]; then
		log "lid close: external output(s)=$ext -> internal panel off, no lock"
		"$IDLE" lid-off
	elif [ "$ac" = 1 ]; then
		log "lid close: on AC, no external output -> lock + internal panel off"
		# lock.sh uses waylock -fork-on-lock: it returns once the session is
		# actually locked. Skip if a locker is already up (lid closed at the
		# lock screen), or a second waylock would just fail.
		pgrep -xu "$(id -u)" waylock >/dev/null 2>&1 || "$LOCK"
		"$IDLE" lid-off
	else
		log "lid close: on battery -> nothing here (elogind suspends)"
	fi
	;;
open)
	log "lid open: ac=$ac external=$ext -> internal panel on"
	"$IDLE" lid-on
	;;
*)
	echo "usage: ${0##*/} close|open" >&2
	exit 2
	;;
esac
