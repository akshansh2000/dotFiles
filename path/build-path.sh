#!/bin/sh
# Reads ~/.config/path/path.list and prepends its active entries to PATH.
# Sourced from river/init, so anything river spawns directly (rofi, GUI
# apps) sees custom PATH entries too, even though those never go through a
# shell rc. See also build-path.fish for interactive fish shells.
#
# river is normally launched *from* an already-logged-in fish shell, which
# has already run build-path.fish itself - so this has to skip entries
# already present in PATH rather than blindly prepending, or a plain
# fish-login -> river workflow ends up with every entry duplicated.

path_list="$HOME/.config/path/path.list"

if [ -r "$path_list" ]; then
	for dir in $(grep -E '^/' "$path_list"); do
		case ":$PATH:" in
			*":$dir:"*) ;;
			*) PATH="$dir:$PATH" ;;
		esac
	done
	export PATH
fi
