#!/bin/sh
# Tests for open-path.sh (2026-11-13). A fake `foot` on PATH prints the command
# it would run, so nothing opens:
#   sh ~/.config/quickshell/control/test-open-path.sh
here=$(cd "$(dirname "$0")" && pwd)
tmp=$(mktemp -d)
trap 'chmod -R u+rwx "$tmp"; rm -r "$tmp"' EXIT
mkdir -p "$tmp/bin" "$tmp/dir" "$tmp/locked"
printf '#!/bin/sh\nprintf "%%s|" "$@"\n' > "$tmp/bin/foot"; chmod +x "$tmp/bin/foot"
: > "$tmp/mine.conf"; : > "$tmp/with space.conf"
chmod 000 "$tmp/locked"
term=$HOME/.config/river/term.sh
fails=0

check() {   # description, expected output, path
	out=$(PATH="$tmp/bin:$PATH" sh "$here/open-path.sh" "$3" 2>/dev/null)
	if [ "$out" = "$2" ]; then echo "PASS $1"; else echo "FAIL $1: got '$out', want '$2'"; fails=$((fails + 1)); fi
}

check "folder -> yazi there" "--working-directory=$tmp/dir|$term|yazi|" "$tmp/dir"
check "own file -> nvim in tmux" "$term|tmux|new-session|nvim|--|$tmp/mine.conf|" "$tmp/mine.conf"
check "spaces survive" "$term|tmux|new-session|nvim|--|$tmp/with space.conf|" "$tmp/with space.conf"
check "root file -> sudoedit" "$term|tmux|new-session|env|SUDO_EDITOR=nvim|sudoedit|--|/etc/rc.local|" /etc/rc.local
check "behind a locked dir -> sudoedit" "$term|tmux|new-session|env|SUDO_EDITOR=nvim|sudoedit|--|$tmp/locked/x.conf|" "$tmp/locked/x.conf"
err=$(PATH="$tmp/bin:$PATH" sh "$here/open-path.sh" "$tmp/nope.conf" 2>&1 >/dev/null); rc=$?
if [ $rc -eq 1 ] && printf '%s' "$err" | grep -q '^open-path: '; then echo "PASS missing in a readable dir -> nothing, exit 1"
else echo "FAIL missing in a readable dir: rc=$rc err='$err'"; fails=$((fails + 1)); fi

[ $fails -eq 0 ] && echo "all passed" || echo "$fails failed"
exit $fails
