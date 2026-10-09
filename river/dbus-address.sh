#!/bin/sh
# Print a usable D-Bus session bus address, starting a bus if there isn't one.
#
# This is the single implementation of the bootstrap that used to live inline
# in config.fish. Two callers need it now and they must agree, or river ends
# up on a different bus depending on how it was started:
#
#   config.fish        - when river is launched by hand from a tty
#   session-wrapper.sh - when river is launched by greetd/tuigreet
#
# The address is cached so that restarting river reuses the same bus instead
# of leaking a fresh orphaned one each time. The cached address is pinged
# before being trusted, since a stale file survives the daemon it points at.
set -eu

addr_file="${XDG_CACHE_HOME:-$HOME/.cache}/river-dbus-session-bus-address"
mkdir -p "$(dirname "$addr_file")"

if [ -r "$addr_file" ]; then
	addr=$(cat "$addr_file")
	if [ -n "$addr" ] && dbus-send --bus="$addr" --print-reply \
		--dest=org.freedesktop.DBus /org/freedesktop/DBus \
		org.freedesktop.DBus.Peer.Ping >/dev/null 2>&1; then
		printf '%s\n' "$addr"
		exit 0
	fi
fi

addr=$(dbus-daemon --session --fork --print-address)
printf '%s\n' "$addr" >"$addr_file"
printf '%s\n' "$addr"
