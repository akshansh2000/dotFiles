#!/usr/bin/env fish
# Reads ~/.config/path/path.list and prepends its active entries to PATH.
# Sourced from config.fish. See also build-path.sh for river/init (things
# river spawns directly, which don't go through any shell rc).
#
# Skips entries already present in PATH rather than blindly prepending -
# river's own init also sources the same path.list via build-path.sh, and
# river is normally launched from this already-initialized fish shell, so
# this has to be safe to apply more than once without stacking duplicates.

set -l path_list "$HOME/.config/path/path.list"

if test -r "$path_list"
	for dir in (grep -E '^/' "$path_list")
		if not contains -- "$dir" $PATH
			set -gx PATH "$dir" $PATH
		end
	end
end
