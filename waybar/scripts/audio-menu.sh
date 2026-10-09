#!/bin/sh
# rofi audio menu, launched by waybar's pulseaudio module on click (detached
# with `setsid -f`, or the module freezes while the menu is open). Same
# "build a list -> rofi -dmenu -> act" pattern as bt-menu.sh / wifi-menu.sh.
# Agreed 2026-09-03, built 2026-10-09, reworked the same day:
#
#   main menu    every output device, ✓ on the current default; each
#                bluetooth output gets its own indented "↳ codec: X" line
#                right under it (one per device when several are connected)
#   codec menu   that card's available profiles, ✓ on the active one.
#                Escape here goes BACK to the main menu; Escape on the main
#                menu closes. Picking something applies it and closes.
#
# Persistence, per device - picking here IS setting that device's default:
#   output  pactl set-default-sink  -> WirePlumber's default-nodes state
#   codec   wpctl set-profile       -> sends the profile WITH save=true, so
#           WirePlumber records it per card in default-profile (survives
#           reconnects and reboots). wpctl gained set-profile in WirePlumber
#           0.5; set by the device's PipeWire id + profile index (pw-dump).
# Outputs go by NAME through pactl: pactl's sink indices differ from wpctl's
# node ids, so never mix the two.
# The XM4 runs SBC-XQ + multipoint on purpose (memory: void-rice-audio-stack).

menu() {   # menu PROMPT -> prints the chosen LINE INDEX (0-based), empty on escape
	rofi -dmenu -i -p "$1" -format i
}

# Profile description -> short label, e.g. "SBC-XQ  (music)".
short() {
	sed -E 's/^High Fidelity Playback \(A2DP Sink, codec ([^)]*)\)$/\1  (music)/
		s/^Headset Head Unit \(HSP\/HFP, codec ([^)]*)\)$/\1  (headset, with mic)/'
}

set_codec() {   # set_codec CARD_NAME PROFILE_NAME
	dev=$(pw-dump 2>/dev/null | jq -r --arg c "$1" '
		.[] | select(.type == "PipeWire:Interface:Device" and .info.props["device.name"] == $c) | .id' | head -1)
	[ -n "$dev" ] || return 1
	idx=$(pw-dump "$dev" 2>/dev/null | jq -r --arg p "$2" '
		.[0].info.params.EnumProfile[]? | select(.name == $p) | .index' | head -1)
	[ -n "$idx" ] && wpctl set-profile "$dev" "$idx"
}

# codec_menu CARD -> 0 = something was picked (close), 1 = escape (back to main)
codec_menu() {
	cards=$(pactl --format=json list cards 2>/dev/null) || return 1
	active=$(printf '%s' "$cards" | jq -r --arg c "$1" '.[] | select(.name == $c) | .active_profile')
	# name<TAB>description, skipping "off" and unavailable profiles.
	profiles=$(printf '%s' "$cards" | jq -r --arg c "$1" '
		.[] | select(.name == $c) | .profiles | to_entries[]
		| select(.key != "off" and .value.available) | "\(.key)\t\(.value.description)"')
	[ -n "$profiles" ] || return 1
	i=$(printf '%s\n' "$profiles" | while IFS='	' read -r name desc; do
		label=$(printf '%s' "$desc" | short)
		[ "$name" = "$active" ] && printf '✓ %s\n' "$label" || printf '  %s\n' "$label"
	done | menu "codec")
	[ -n "$i" ] || return 1
	choice=$(printf '%s\n' "$profiles" | sed -n "$((i + 1))p" | cut -f1)
	[ -n "$choice" ] && [ "$choice" != "$active" ] && set_codec "$1" "$choice"
	return 0
}

while :; do
	sinks=$(pactl --format=json list sinks 2>/dev/null) || exit 0
	cards=$(pactl --format=json list cards 2>/dev/null)
	default=$(pactl get-default-sink 2>/dev/null)

	# One row per menu line: kind<TAB>target<TAB>label
	#   sink<TAB>sink_name   or   codec<TAB>card_name
	rows=$(printf '%s' "$sinks" | jq -r --arg d "$default" --argjson cards "${cards:-[]}" '
		.[] as $s
		| ( "sink\t\($s.name)\t" + (if $s.name == $d then "✓ " else "  " end) + $s.description ),
		  ( $s.properties["device.name"] // "" ) as $card
		  | select($s.name | startswith("bluez_output."))
		  | ( $cards[] | select(.name == $card) ) as $c
		  | ($c.profiles[$c.active_profile].description // $c.active_profile) as $desc
		  | "codec\t\($card)\t      ↳ codec: \(($desc | capture("codec (?<x>[^)]*)").x) // $desc)\(if ($desc | test("^Headset")) then " (headset)" else "" end)"')
	[ -n "$rows" ] || exit 0

	i=$(printf '%s\n' "$rows" | cut -f3 | menu "audio")
	[ -n "$i" ] || exit 0
	row=$(printf '%s\n' "$rows" | sed -n "$((i + 1))p")
	kind=$(printf '%s' "$row" | cut -f1)
	target=$(printf '%s' "$row" | cut -f2)

	case "$kind" in
	sink)
		[ "$target" != "$default" ] && pactl set-default-sink "$target"
		exit 0
		;;
	codec)
		codec_menu "$target" && exit 0
		;;   # escape in the submenu: loop back to the main menu
	esac
done
