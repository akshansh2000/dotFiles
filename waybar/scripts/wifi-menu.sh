#!/bin/sh
# rofi-driven wifi control menu, launched by waybar's custom/wifi module on
# click. Same "script builds a list -> rofi -dmenu -> act" pattern as
# bin/monitors from the old dotfiles.

. "$HOME/.config/waybar/scripts/iwctl-lib.sh"

IFACE=wlp2s0

rofi_menu() {
	rofi -dmenu -p "$1"
}

# Force waybar's custom/wifi module to re-run its exec now, instead of waiting
# for its poll interval. Paired with "signal": 8 in config.jsonc.
#
# Matched on process name, NOT `pkill -f` - this script's own command line
# contains "waybar" (it lives under ~/.config/waybar/scripts), so -f would
# match and kill the menu itself.
refresh() {
	pkill -RTMIN+8 waybar 2>/dev/null || true
}

powered_state() {
	iwctl device "$IFACE" show 2>/dev/null | iwctl_field "Powered"
}

network_list() {
	# Anchor on the known security-column values (open/psk/8021x/wep) rather
	# than fixed column widths, so multi-word SSIDs parse correctly. Emits
	# "ssid<TAB>security" per line.
	iwctl station "$IFACE" get-networks 2>/dev/null \
		| strip_ansi \
		| sed -n 's/^[>[:space:]]*\(.*[^[:space:]]\)[[:space:]]\+\(open\|psk\|8021x\|wep\)[[:space:]].*/\1\t\2/p'
}

known_list() {
	# Networks iwd already holds credentials for. Read over D-Bus rather than
	# from /var/lib/iwd, which is root-only. Anchored on the security column
	# for the same reason network_list() is - SSIDs contain spaces
	# ("Airtel_Hidden Leaf"), so fixed column offsets do not work.
	iwctl known-networks list 2>/dev/null \
		| strip_ansi \
		| sed -n 's/^[[:space:]>*]*\(.*[^[:space:]]\)[[:space:]]\+\(open\|psk\|8021x\|wep\)[[:space:]].*/\1/p'
}

is_known() {
	known_list | grep -Fxq "$1"
}

connect_new() {
	# First-time connect: iwd has no credentials, so one has to be supplied.
	ssid="$1"
	security="$2"

	if [ "$security" = "open" ]; then
		iwctl station "$IFACE" connect "$ssid"
		return
	fi

	psk=$(rofi -dmenu -password -p "passphrase for $ssid")
	[ -z "$psk" ] && return
	# --passphrase puts the secret in this process's argv, briefly visible in
	# /proc. Acceptable on a single-user laptop; the alternative is driving
	# iwd's interactive agent over a pty, which is a lot of machinery for it.
	iwctl --passphrase="$psk" station "$IFACE" connect "$ssid"
}

network_submenu() {
	ssid="$1"
	security="$2"
	connected="$3"

	# Nothing to offer for a network iwd does not know yet - connect is the
	# only possible action, and it needs a passphrase. Go straight there
	# rather than showing a submenu whose other entries would all fail.
	if ! is_known "$ssid"; then
		connect_new "$ssid" "$security"
		return
	fi

	# Offer only the transition that applies. Showing both "connect" and
	# "disconnect" for every network means one of them is always a no-op, and
	# on the connected network "connect" in particular looks like it might do
	# something useful when it would not.
	if [ "$ssid" = "$connected" ]; then
		actions='disconnect
forget'
	else
		actions='connect
forget'
	fi

	action=$(printf '%s\n' "$actions" | rofi_menu "$ssid")
	case "$action" in
		connect)
			# No passphrase: iwd has the credentials. This also re-arms
			# autoconnect, which an explicit disconnect switches off.
			iwctl station "$IFACE" connect "$ssid"
			;;
		disconnect)
			# iwd's disconnect is station-wide, not per-network - this drops
			# whatever is currently connected, which for a known network in
			# this menu is normally this one.
			iwctl station "$IFACE" disconnect
			;;
		forget)
			iwctl known-networks "$ssid" forget
			;;
	esac
}

main_menu() {
	powered=$(powered_state)

	if [ "$powered" != "on" ]; then
		choice=$(printf 'power: off (toggle)\n' | rofi_menu "wifi")
		# Escape gives an empty choice. Without this the menu re-opened itself
		# forever - nothing was selected, so nothing changed, so main_menu was
		# called again and showed the same one-entry menu, and there was no way
		# out of rofi at all. The powered-on branch has always had this as its
		# `""` case; this branch did not.
		[ -z "$choice" ] && exit 0
		[ "$choice" = "power: off (toggle)" ] && iwctl device "$IFACE" set-property Powered on
		refresh
		main_menu
		return
	fi

	networks=$(network_list)
	connected_ssid=$(iwctl station "$IFACE" show 2>/dev/null | iwctl_field "Connected network")

	names=$(printf '%s\n' "$networks" | cut -f1 | while IFS= read -r ssid; do
		if [ -n "$connected_ssid" ] && [ "$ssid" = "$connected_ssid" ]; then
			printf '✓ %s\n' "$ssid"
		else
			printf '%s\n' "$ssid"
		fi
	done)

	options="rescan
power: on (toggle)
disconnect
$names"
	choice=$(printf '%s\n' "$options" | rofi_menu "wifi")

	case "$choice" in
		rescan)
			iwctl station "$IFACE" scan >/dev/null 2>&1 &
			main_menu
			;;
		"power: on (toggle)")
			iwctl device "$IFACE" set-property Powered off
			refresh
			main_menu
			;;
		disconnect)
			iwctl station "$IFACE" disconnect
			refresh
			main_menu
			;;
		"")
			exit 0
			;;
		*)
			ssid=$(printf '%s\n' "$choice" | sed 's/^✓ //')
			security=$(printf '%s\n' "$networks" | awk -F'\t' -v n="$ssid" '$1==n {print $2; exit}')
			network_submenu "$ssid" "$security" "$connected_ssid"
			refresh
			main_menu
			;;
	esac
}

main_menu
