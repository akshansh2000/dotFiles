#!/bin/sh
# Idle-ladder actions, driven by ~/.local/sv/swayidle. Split out of the service
# so the ladder stays readable there and the save/restore logic lives in one
# place:
#
#   dim   / undim   5 min   screen backlight down, then back
#   off   / on      10 min  screen AND keyboard backlight off, then back
#   lid-off / lid-on        internal panel + keyboard backlight only, for
#                           river/lid.sh (lid closed on AC, or docked)
#
# `on` respects a CLOSED lid (2026-10-09): it turns every output on, then the
# internal panel back off and leaves the keyboard dark. Without that, an idle
# resume while docked (external keyboard/mouse) lit up the panel inside the lid.
#
# Both halves save the current value into a state file and restore from it,
# rather than restoring to a fixed level - so whatever you had set is what you
# get back.
#
# The guard matters: each save is skipped if a state file already exists. Without
# it, a second `dim` before an `undim` would record the *dimmed* value as the
# level to return to, and the real brightness would be gone.
#
# Screen brightness deliberately uses `brillo -G`/`-S` and our own state file,
# NOT `brillo -O`/`-I`. Those two share one cache with the boot-time restore in
# river/init, and writing a dimmed value there would persist it across reboots.
set -eu

STATE_DIR=${XDG_RUNTIME_DIR:-$HOME/.cache}
SCREEN_STATE="$STATE_DIR/idle-screen-brightness"
KBD_STATE="$STATE_DIR/idle-kbd-backlight"
KBD="$HOME/.config/river/kbd-backlight"

DIM_LEVEL=10   # percent

# The built-in panel: whatever eDP-* output wlopm reports (eDP-1 here).
internal() { wlopm 2>/dev/null | awk '$1 ~ /^eDP/ { print $1; exit }'; }
lid_closed() { grep -qs closed /proc/acpi/button/lid/*/state; }

case "${1:-}" in
dim)
	[ -f "$SCREEN_STATE" ] || brillo -G > "$SCREEN_STATE"
	brillo -S "$DIM_LEVEL" -u 300000
	;;
undim)
	if [ -f "$SCREEN_STATE" ]; then
		brillo -S "$(cat "$SCREEN_STATE")" -u 300000
		rm -f "$SCREEN_STATE"
	fi
	;;
off)
	# Keyboard first: turning the panel off last means the keyboard going dark
	# is not visible as a separate step.
	[ -f "$KBD_STATE" ] || "$KBD" get > "$KBD_STATE" 2>/dev/null || true
	"$KBD" set 0 >/dev/null 2>&1 || true
	wlopm --off '*'
	;;
on)
	wlopm --on '*'
	if lid_closed; then
		p=$(internal); [ -n "$p" ] && wlopm --off "$p"
		exit 0   # keyboard stays dark under the lid; lid-on restores it
	fi
	if [ -f "$KBD_STATE" ]; then
		"$KBD" set "$(cat "$KBD_STATE")" >/dev/null 2>&1 || true
		rm -f "$KBD_STATE"
	fi
	;;
lid-off)
	[ -f "$KBD_STATE" ] || "$KBD" get > "$KBD_STATE" 2>/dev/null || true
	"$KBD" set 0 >/dev/null 2>&1 || true
	p=$(internal); [ -n "$p" ] && wlopm --off "$p"
	;;
lid-on)
	p=$(internal); [ -n "$p" ] && wlopm --on "$p"
	if [ -f "$KBD_STATE" ]; then
		"$KBD" set "$(cat "$KBD_STATE")" >/dev/null 2>&1 || true
		rm -f "$KBD_STATE"
	fi
	;;
kbd-restore)
	# The ASUS firmware brings the keyboard backlight back at FULL after a
	# resume, regardless of what it was before suspending (observed
	# 2026-09-18: level 1 going in, level 3 coming out). The driver's "get" is
	# only ever a cached value, so nothing restores it on its own - same reason
	# /etc/rc.local has to set a level at boot. kbd-backlight's state file still
	# holds the real level, so re-applying it is the whole fix.
	"$KBD" set "$("$KBD" get)" >/dev/null 2>&1 || true
	;;
*)
	echo "usage: $(basename "$0") {dim|undim|off|on|lid-off|lid-on|kbd-restore}" >&2
	exit 2
	;;
esac
