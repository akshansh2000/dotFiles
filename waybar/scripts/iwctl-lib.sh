#!/bin/sh
# Shared helpers for parsing `iwctl ... show` tables (wifi-status.sh,
# wifi-menu.sh). iwctl always emits ANSI color codes, even when piped to a
# non-tty - has to be stripped before any field extraction works. Rows can
# also carry a leading "*" (the "settable" column marker, e.g. on Powered)
# or ">" (the currently-connected marker in get-networks) before the label.

strip_ansi() {
	sed -E 's/\x1b\[[0-9;]*m//g'
}

# iwctl_field LABEL: reads a `show` table on stdin, prints the value for
# the row whose label matches LABEL. Preserves internal spaces in the
# value (e.g. multi-word SSIDs), strips only the label + surrounding
# whitespace/markers and any trailing column padding.
iwctl_field() {
	label="$1"
	strip_ansi | sed -n -E "s/^[[:space:]]*[*>]?[[:space:]]*${label}[[:space:]]*//p" | sed 's/[[:space:]]*$//'
}
