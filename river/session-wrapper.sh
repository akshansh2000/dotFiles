#!/bin/sh
# Session wrapper for greetd/tuigreet. Receives the session command as its
# arguments and execs it - see `--session-wrapper` in tuigreet(1).
#
# WHY THIS IS NEEDED
# ------------------
# /usr/share/wayland-sessions/river.desktop is just `Exec=river`, so without a
# wrapper greetd execs the compositor directly. No login shell runs, config.fish
# is never read, and DBUS_SESSION_BUS_ADDRESS is never set - which silently
# breaks everything downstream of the session bus (portals, notifications,
# bluetooth) while river itself still comes up fine.
#
# river and everything it spawns via riverctl inherit river's environment as it
# was at exec time, so the bus has to exist *before* the exec below, not be set
# from inside river/init.
#
# tuigreet applies this wrapper to both --cmd and picker-selected sessions, and
# when a wrapper is used it deliberately leaves the XDG_* variables to the
# wrapper ("assume that it is able to set up the required environment"), so
# they are set here rather than inherited.
set -eu

export XDG_SESSION_TYPE=wayland
export XDG_CURRENT_DESKTOP=river

if [ -z "${DBUS_SESSION_BUS_ADDRESS:-}" ]; then
	DBUS_SESSION_BUS_ADDRESS=$("$(dirname "$0")/dbus-address.sh")
	export DBUS_SESSION_BUS_ADDRESS
fi

# Same reasoning for PATH. river/init sources this too, but that only reaches
# init's own children (waybar, runsvdir and its services); anything spawned later by a riverctl
# keybinding inherits river's environment instead. Launched from a fish login
# shell that was already covered, because build-path.fish had run first - under
# greetd nothing has. build-path.sh skips entries already in PATH, so sourcing
# it here and again from river/init does not stack duplicates.
. "$HOME/.config/path/build-path.sh"

# --- Compositor log, one file per session, last 5 sessions kept (2026-10-09) --
# river's stdout/stderr used to go nowhere, so an unexplained logout ("it logged
# me out when I closed the lid on AC") left no trace. Each login now rotates
#   river.log -> .1 -> .2 -> ... -> .5 (the old .5 is dropped)
# so the session that crashed is river.log.1 right after you log back in. The
# session is the natural unit here - time/size rotation would split or mix
# sessions. River's own lines carry no wall-clock time, hence the header.
# NOTHING here may abort the wrapper (set -e is on, and a failed wrapper means
# no login): every step tolerates failure, and without a log dir river simply
# starts unlogged.
RIVER_LOG_DIR="${RIVER_LOG_DIR:-${XDG_STATE_HOME:-$HOME/.local/state}/river}"
if mkdir -p "$RIVER_LOG_DIR" 2>/dev/null; then
	rm -f "$RIVER_LOG_DIR/river.log.5" 2>/dev/null || true
	for i in 4 3 2 1; do
		[ -e "$RIVER_LOG_DIR/river.log.$i" ] &&
			mv -f "$RIVER_LOG_DIR/river.log.$i" "$RIVER_LOG_DIR/river.log.$((i + 1))" 2>/dev/null || true
	done
	[ -e "$RIVER_LOG_DIR/river.log" ] &&
		mv -f "$RIVER_LOG_DIR/river.log" "$RIVER_LOG_DIR/river.log.1" 2>/dev/null || true
	if { printf '=== session start %s\n' "$(date '+%F %T %z')"
	     printf '=== cmd: %s\n' "$*"
	     printf '=== kernel %s, %s\n' "$(uname -r)" "$(river -version 2>/dev/null || echo 'river ?')"
	     printf '=== AC online: %s\n' "$(cat /sys/class/power_supply/AC0/online 2>/dev/null || echo '?')"
	   } >"$RIVER_LOG_DIR/river.log" 2>/dev/null; then
		exec >>"$RIVER_LOG_DIR/river.log" 2>&1
	fi
fi

# river logs only errors by default; an unexpected but CLEAN exit would leave
# nothing. Ask for info - per-session file, so the size stays small. Only when
# the session is river itself and no level was given.
if [ "${1:-}" = river ]; then
	case " $* " in *" -log-level "*) ;; *) set -- "$@" -log-level info ;; esac
fi

exec "$@"
