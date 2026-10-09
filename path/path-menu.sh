#!/bin/sh
# rofi-driven PATH manager. Lists ~/.config/path/path.list entries, lets you
# add/toggle/reorder/remove them. Bound to Super+Shift+D. Same
# "script builds a list -> rofi -dmenu -> act" pattern as bin/monitors from
# the old dotfiles.

PATH_LIST="$HOME/.config/path/path.list"

rofi_menu() {
	rofi -dmenu -p "$1"
}

# `rofi -e` cannot be styled under the full-screen rofi theme - it renders
# through the error-message widget, which ignores the layout and drops the text
# at default size near the top-left corner. A one-entry dmenu with -mesg shows
# the same text inside the normal, themed block instead. See rofi/config.rasi.
note() {
	printf 'ok\n' | rofi -dmenu -p note -no-show-icons -mesg "$1" >/dev/null
}

list_entries() {
	grep -nE '^#?/' "$PATH_LIST"
}

display_entries() {
	list_entries | sed -E 's/^([0-9]+):#(\/.*)/\1  [off] \2/; s/^([0-9]+):(\/.*)/\1  [on]  \2/'
}

line_for_choice() {
	printf '%s\n' "$1" | awk '{print $1}'
}

swap_lines() {
	a="$1"; b="$2"
	awk -v a="$a" -v b="$b" '
		{ lines[NR] = $0 }
		END {
			tmp = lines[a]; lines[a] = lines[b]; lines[b] = tmp
			for (i = 1; i <= NR; i++) print lines[i]
		}
	' "$PATH_LIST" > "$PATH_LIST.tmp" && mv "$PATH_LIST.tmp" "$PATH_LIST"
}

entry_submenu() {
	n="$1"
	path="$2"
	action=$(printf 'toggle enable/disable\nmove up\nmove down\nremove\n' | rofi_menu "$path")

	case "$action" in
		"toggle enable/disable")
			line=$(sed -n "${n}p" "$PATH_LIST")
			case "$line" in
				"#"*) sed -i "${n}s/^#//" "$PATH_LIST" ;;
				*)    sed -i "${n}s/^/#/" "$PATH_LIST" ;;
			esac
			;;
		"move up")
			prev=$((n - 1))
			[ "$prev" -ge 1 ] && swap_lines "$prev" "$n"
			;;
		"move down")
			next=$((n + 1))
			total=$(wc -l < "$PATH_LIST")
			[ "$next" -le "$total" ] && swap_lines "$n" "$next"
			;;
		remove)
			sed -i "${n}d" "$PATH_LIST"
			note "removed $path - opens a new terminal/app to take effect, not already-running ones"
			;;
	esac
}

main_menu() {
	entries=$(display_entries)
	options="add new entry
$entries"
	choice=$(printf '%s\n' "$options" | rofi_menu "PATH entries")

	case "$choice" in
		"")
			exit 0
			;;
		"add new entry")
			newpath=$(rofi_menu "new absolute path")
			case "$newpath" in
				/*)
					printf '%s\n' "$newpath" >> "$PATH_LIST"
					note "added $newpath - opens a new terminal/app to take effect, not already-running ones"
					;;
				*)
					[ -n "$newpath" ] && note "must be an absolute path (starting with /), not added"
					;;
			esac
			;;
		*)
			n=$(line_for_choice "$choice")
			p=$(printf '%s\n' "$choice" | sed -E 's/^[0-9]+ +\[(on|off)\] +//')
			entry_submenu "$n" "$p"
			;;
	esac

	main_menu
}

main_menu
