#!/bin/sh
# Open or copy URLs shown in a tmux pane (2026-10-17). foot can't open a link
# on click by itself, and inside tmux its own URL mode (Ctrl+Shift+O) sees only
# tmux's screen, so tmux does it:
#   urls.sh click X xLINK xLINE  Ctrl+click: open the OSC 8 hyperlink under
#                                the mouse if there is one, else the plain-text
#                                URL that spans column X of LINE
#   urls.sh pick [PANE]          prefix u (in a popup): every URL in PANE's
#                                scrollback, newest first, in fzf - Enter
#                                opens, Ctrl+Y copies (Tab marks several).
#                                PANE defaults to $TMUX_PANE, which tmux sets
#                                in a popup to the pane it opened over -
#                                display-popup expands no formats in its
#                                command (nor in -e), so #{pane_id} can't be
#                                passed (tested 2026-10-17, tmux 3.7c)
# Everything opens through xdg-open (-> zen-link.desktop for http).
# A URL wrapped across two screen rows is only found whole by `pick`.

# Every URL in stdin, in order, one per line. Trailing punctuation is the
# sentence's, not the URL's; a closing bracket stays only if the URL opened
# one (wikipedia's Foo_(bar)). With X, print only the URL spanning column X
# (0-based, counted in characters - gawk in a UTF-8 locale; a double-width
# character before the URL would shift it by one).
extract() {
	awk -v x="${1:--1}" '
	function trim(u,   c) {
		while (1) {
			c = substr(u, length(u))
			if (c ~ /[.,;:!?'"'"'"]/) { u = substr(u, 1, length(u) - 1); continue }
			if (c == ")" && gsub(/\(/, "(", u) < gsub(/\)/, ")", u)) { u = substr(u, 1, length(u) - 1); continue }
			if (c == "]" && gsub(/\[/, "[", u) < gsub(/\]/, "]", u)) { u = substr(u, 1, length(u) - 1); continue }
			return u
		}
	}
	{
		s = $0; off = 0
		while (match(s, /(https?|ftp|file):\/\/[^][:space:]<>"'"'"'`{}|\\^]+/)) {
			u = trim(substr(s, RSTART, RLENGTH))
			st = off + RSTART - 1
			if (x < 0) print u
			else if (x >= st && x < st + length(u)) { print u; exit }
			off += RSTART + RLENGTH - 1
			s = substr(s, RSTART + RLENGTH)
		}
	}'
}

open() {
	for u; do setsid -f xdg-open "$u" >/dev/null 2>&1; done
}

case $1 in
click)
	# tmux passes LINK and LINE through #{q:...}, which backslash-escapes them
	# as ONE unquoted shell word - quoting them again would keep the
	# backslashes (a?b&c -> a\?b\&c). The x prefix keeps an empty LINK from
	# vanishing. Only a tab isn't escaped, so it splits LINE: rejoin the rest.
	x=$2 link=${3#x}; shift 3; line=${*#x}
	if [ -n "$link" ]; then
		# An OSC 8 target is whatever the program printed, not what is shown -
		# open only ordinary schemes, never e.g. a file:// .desktop launcher.
		case $link in
		http://*|https://*|ftp://*|mailto:*) url=$link ;;
		file://*) case $link in *.desktop) exit 0 ;; esac; url=$link ;;
		*) exit 0 ;;
		esac
	else
		url=$(printf '%s\n' "$line" | extract "$x")
	fi
	[ -n "$url" ] && open "$url"
	;;
pick)
	# -J joins wrapped lines, so a long URL comes out whole.
	tmux capture-pane -p -J -S - -t "${2:-$TMUX_PANE}" | extract | tac | awk '!seen[$0]++' |
		fzf -m --no-sort --reverse --prompt 'url> ' \
			--header 'enter: open   ctrl-y: copy   tab: mark' --expect ctrl-y |
		{
			read -r key
			urls=$(cat)
			[ -n "$urls" ] || exit 0
			if [ "$key" = ctrl-y ]; then
				printf '%s' "$urls" | wl-copy
				tmux display-message "copied $(printf '%s\n' "$urls" | wc -l) url(s)"
			else
				# shellcheck disable=SC2086 - one URL per line, no spaces in them
				IFS='
'
				open $urls
			fi
		}
	;;
*) echo "usage: urls.sh click X xLINK xLINE... | pick [PANE]" >&2; exit 2 ;;
esac
