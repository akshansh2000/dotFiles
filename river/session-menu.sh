#!/bin/sh
# Session menu (rofi), bound to Super+Shift+Q (2026-10-10; that key used to be
# a bare `riverctl exit`). Same "list -> rofi -dmenu -> act" pattern as the
# waybar menus.
#
#   Screen off  panels + keyboard backlight off, back at the first input
#   Suspend     loginctl suspend (swayidle-sleep's before-sleep hook locks)
#   Log out     riverctl exit - river IS the session under greetd, so ending
#               it drops back to the tuigreet login screen; "exit river" and
#               "log out" are the same thing here
#   Restart     loginctl reboot
#   Shut down   loginctl poweroff
#
# Power actions go through elogind (loginctl), which answers CanPowerOff /
# CanReboot / CanSuspend = "yes" for this active session - no password, no
# sudo. (The greeter has its own polkit rule for the same actions; see memory
# void-rice-login-logging.)
# The three that end the session ask yes/no first - a stray Enter in a fuzzy
# menu shouldn't kill the session. Escape there returns to the main menu;
# Escape on the main menu closes.

IDLE="$HOME/.config/river/idle.sh"

menu() {   # menu PROMPT -> chosen line text, empty on escape
	rofi -dmenu -i -p "$1"
}

confirm() {   # confirm WHAT -> 0 = yes
	[ "$(printf 'no\nyes\n' | menu "$1?")" = yes ]
}

screen_off() {
	# A one-shot swayidle: `off` after 1 s without input (so the keypress
	# that picked this entry doesn't wake it straight back), `on` at the
	# first input, then it kills itself. swayidle double-forks its commands,
	# so the resume command can't find swayidle as $PPID (tested 2026-10-10:
	# that tried to kill PID 1). Instead the wrapper shell bakes its own $$
	# into the resume command and then execs swayidle, so that pid IS
	# swayidle. The pid file lets a second screen-off replace one still
	# waiting; swayidle runs its resume command
	# when killed too (seen in the test), so resume removes the pid file only
	# if it is still its own. idle.sh's `on` keeps the internal panel dark if
	# the lid is closed.
	pidf="${XDG_RUNTIME_DIR:-/tmp}/screen-off.pid"
	# Only if that pid is still a swayidle - a stale file's pid may be reused.
	old=$(cat "$pidf" 2>/dev/null)
	[ -n "$old" ] && [ "$(cat "/proc/$old/comm" 2>/dev/null)" = swayidle ] && kill "$old"
	setsid -f sh -c 'echo $$ > "$0"; exec swayidle timeout 1 "$1 off" resume "$1 on; grep -qx $$ $0 && rm -f $0; kill $$"' \
		"$pidf" "$IDLE" >/dev/null 2>&1
}

while :; do
	choice=$(printf '%s\n' "screen off" "suspend" "log out" "restart" "shut down" | menu "session")
	case "$choice" in
	"")          exit 0 ;;
	"screen off") screen_off; exit 0 ;;
	"suspend")   loginctl suspend; exit 0 ;;
	"log out")   confirm "log out" && { riverctl exit; exit 0; } ;;
	"restart")   confirm "restart" && { loginctl reboot; exit 0; } ;;
	"shut down") confirm "shut down" && { loginctl poweroff; exit 0; } ;;
	esac
	# a "no" or Escape at a confirm: back to the main menu
done
