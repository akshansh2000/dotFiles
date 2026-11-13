#!/bin/sh
# Open a path from the Control centre (2026-11-13): what clicking a file entry
# does. Every window is foot via river/term.sh (no startup flash):
#   folder                   yazi, started in that folder
#   file you can write       nvim in a new tmux session
#   file only root can edit  sudoedit with nvim (sudo asks for the password
#                            first, in that window). sudoedit, not `sudo nvim`:
#                            nvim runs as YOU on a temp copy - your config, no
#                            root editor - and sudo writes it back on :wq.
#   doesn't exist            nothing (exit 1), unless its folder is unreadable
#                            to you - then it's probably root's (sudoedit).
# Tests: sh ~/.config/quickshell/control/test-open-path.sh
#   usage: open-path.sh PATH
p=$1
term=$HOME/.config/river/term.sh

if [ -z "$p" ]; then
	echo "open-path: usage: open-path.sh PATH" >&2
	exit 2
fi

root_edit() {
	exec foot "$term" tmux new-session env SUDO_EDITOR=nvim sudoedit -- "$p"
}

if [ -d "$p" ]; then
	exec foot --working-directory="$p" "$term" yazi
elif [ -e "$p" ]; then
	[ -w "$p" ] || root_edit
	exec foot "$term" tmux new-session nvim -- "$p"
elif [ ! -x "$(dirname "$p")" ]; then
	root_edit
else
	echo "open-path: $p does not exist" >&2
	exit 1
fi
