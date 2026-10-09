#!/bin/sh
# waybar custom/bluetooth module: emits status JSON on each poll.
#
# Icon-only as of 2026-09-18, same scheme as wifi-status.sh: one glyph, dim
# (surface2) unless something is actually connected. ICON is a literal Nerd
# Font glyph (U+F00AF, the bare Material rune). The filled Font Awesome badge
# U+F293 was tried as an alternative and rejected - it reads as a solid blob
# next to the wifi arcs' line art. The rune is instead nudged to 15px in
# style.css.tmpl to even out the weight. An empty text makes waybar hide the
# module outright.
#
# bluez can hold several connections at once (a headset and a mouse, say), so
# the tooltip lists every connected device, one per line. jq's @html escapes
# them because waybar renders tooltips as Pango markup - a device named
# "AirPods & Case" would otherwise break it.

ICON="󰂯"

if ! bluetoothctl show | grep -q "Powered: yes"; then
	jq -nc --arg icon "$ICON" '{text: $icon, tooltip: "Bluetooth off", class: "disconnected"}'
	exit 0
fi

connected=$(bluetoothctl devices Connected | sed -n 's/^Device [0-9A-Fa-f:]* //p')

if [ -z "$connected" ]; then
	jq -nc --arg icon "$ICON" '{text: $icon, tooltip: "No device connected", class: "disconnected"}'
else
	jq -nc --arg icon "$ICON" --arg devices "$connected" '{text: $icon, tooltip: ($devices | @html), class: "connected"}'
fi
