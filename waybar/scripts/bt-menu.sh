#!/bin/sh
# rofi-driven bluetooth control menu, launched by waybar's custom/bluetooth
# module on click. Same "script builds a list -> rofi -dmenu -> act" pattern
# as bin/monitors from the old dotfiles.

rofi_menu() {
	rofi -dmenu -p "$1"
}

# Force waybar's custom/bluetooth module to re-run its exec now, instead of waiting
# for its poll interval. Paired with "signal": 9 in config.jsonc.
#
# Matched on process name, NOT `pkill -f` - this script's own command line
# contains "waybar" (it lives under ~/.config/waybar/scripts), so -f would
# match and kill the menu itself.
refresh() {
	pkill -RTMIN+9 waybar 2>/dev/null || true
}

device_list() {
	bluetoothctl devices | while IFS= read -r line; do
		mac=$(printf '%s\n' "$line" | awk '{print $2}')
		name=$(printf '%s\n' "$line" | sed -E 's/^Device [0-9A-Fa-f:]+ //')
		# bluez falls back to the MAC (dash-separated) as a device's "name"
		# until it actually resolves one during discovery - that's not a
		# parsing bug, just an unnamed device. Label it clearly instead of
		# showing what looks like the same ID twice.
		mac_dash=$(printf '%s' "$mac" | tr ':' '-')
		[ "$name" = "$mac_dash" ] && name="(unnamed)"
		tick=""
		bluetoothctl info "$mac" | grep -q "Connected: yes" && tick="✓ "
		flags=""
		bluetoothctl info "$mac" | grep -q "Paired: yes" && flags="[paired]"
		printf '%s  %s%s %s\n' "$mac" "$tick" "$name" "$flags"
	done
}

device_submenu() {
	mac="$1"
	name="$2"
	action=$(printf 'connect\ndisconnect\npair (+ trust + connect)\ntrust\nremove\n' | rofi_menu "$name")
	case "$action" in
		connect)    bluetoothctl connect "$mac" ;;
		disconnect) bluetoothctl disconnect "$mac" ;;
		"pair (+ trust + connect)")
			# `pair` alone only establishes the bond - bluez deliberately drops
			# the connection right after (a normal "Reason.Local" disconnect,
			# not a failure), so trust+connect has to follow to actually get a
			# usable link. Small pause lets the post-pairing teardown settle at
			# the controller before we bring the link back up.
			#
			# NOTE: if `connect` ever fails with `br-connection-unknown` for
			# *every* device, the cause is almost certainly missing profiles,
			# not this chain - bluez only ships AVRCP itself, and A2DP/HFP come
			# from pipewire's bluez5 SPA plugin (`libspa-bluetooth`). Check
			# `bluetoothctl show` lists Audio Sink / Handsfree UUIDs.
			bluetoothctl pair "$mac"
			bluetoothctl trust "$mac"
			sleep 2
			bluetoothctl connect "$mac"
			;;
		trust)      bluetoothctl trust "$mac" ;;
		remove)     bluetoothctl remove "$mac" ;;
	esac
}

main_menu() {
	powered=off
	bluetoothctl show | grep -q "Powered: yes" && powered=on

	options="scan for devices
power: $powered (toggle)
$(device_list)"
	choice=$(printf '%s\n' "$options" | rofi_menu "bluetooth")

	case "$choice" in
		"scan for devices")
			# Background it - blocking here for the full timeout would leave
			# no menu on screen for that whole time. New devices show up on
			# a later reopen once bluez's cache picks them up.
			bluetoothctl --timeout 5 scan on >/dev/null 2>&1 &
			main_menu
			;;
		power:*)
			if [ "$powered" = on ]; then
				bluetoothctl power off
			else
				bluetoothctl power on
			fi
			refresh
			main_menu
			;;
		"")
			exit 0
			;;
		*)
			mac=$(printf '%s\n' "$choice" | cut -c1-17)
			name=$(printf '%s\n' "$choice" | cut -c20-)
			device_submenu "$mac" "$name"
			refresh
			main_menu
			;;
	esac
}

main_menu
