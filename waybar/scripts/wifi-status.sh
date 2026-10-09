#!/bin/sh
# waybar custom/wifi module: emits status JSON on each poll.
#
# Icon-only as of 2026-09-18. The glyph never changes - only its colour does:
# style.css.tmpl paints the module surface2 by default and lifts it to the
# bar's own colour on `class: connected`. The SSID moved to the tooltip.
#
# ICON is a literal Nerd Font glyph (U+F1EB, from nerd-fonts-symbols-ttf via
# fontconfig fallback - the bar's font is Noto Sans). If it is ever lost in an
# edit, nothing errors: waybar silently HIDES a module whose text is empty, so
# the module just disappears. That is the first thing to check here.
#
# Tooltips are Pango markup, so the SSID goes through jq's @html - an SSID with
# & or < in it would otherwise break the tooltip instead of showing up.

. "$HOME/.config/waybar/scripts/iwctl-lib.sh"

IFACE=wlp2s0
ICON=""

powered=$(iwctl device "$IFACE" show 2>/dev/null | iwctl_field "Powered")

if [ "$powered" != "on" ]; then
	jq -nc --arg icon "$ICON" '{text: $icon, tooltip: "Wi-Fi off", class: "disconnected"}'
	exit 0
fi

ssid=$(iwctl station "$IFACE" show 2>/dev/null | iwctl_field "Connected network")

if [ -z "$ssid" ]; then
	jq -nc --arg icon "$ICON" '{text: $icon, tooltip: "Not connected", class: "disconnected"}'
else
	jq -nc --arg icon "$ICON" --arg ssid "$ssid" '{text: $icon, tooltip: ($ssid | @html), class: "connected"}'
fi
