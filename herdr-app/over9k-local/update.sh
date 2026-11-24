#!/bin/sh
# over9k-local/update.sh - install or update Over9k from its git clone, by hand,
# instead of upstream's install.sh (which also merges Over9k's keys into
# "global" on every run; this setup keeps them under "layout:over9k").
#
#   sh update.sh             fetch, fast-forward the clone, copy, patch, check
#   sh update.sh --install   copy what the clone has now (no fetch)
#
# Over9k's Help & options › Update runs this (apply.py points it here). Its
# footer finds updates through ~/.local/share/over9k/source.json, which this
# writes: the clone, its branch and the commit installed.
#
# What it copies: the layout (layouts/over9k.json + .svg) and each mods/over9k*
# folder, mirrored (files upstream dropped go), keeping servers.json (your model
# servers) and Herdr's *.error notes. Then apply.py re-applies this machine's
# patches and `herdr-app check` loads each mod. The result goes to stdout (the
# Update card shows it) and to a notification.
#
# A hand copy can't do what a newer install.sh might start doing, so changes to
# install.sh, keys.json or setup.sh are listed for review (not acted on).
set -eu
SRC=${OVER9K_SRC:-$HOME/.local/src/herdr-over9k}
APP=${HERDR_APP_HOME:-$HOME/.config/herdr-app}
HERE=$(cd "$(dirname "$0")" && pwd)
DATA=${XDG_DATA_HOME:-$HOME/.local/share}/over9k

say() { printf '%s\n' "$*"; }
note() { command -v notify-send >/dev/null 2>&1 && notify-send -a Over9k "$1" "${2:-}" || true; }
die() { say "$1"; note "Over9k update stopped" "$1"; exit 1; }

cd "$SRC" || die "No Over9k clone at $SRC"
branch=$(git symbolic-ref --short -q HEAD) || die "$SRC isn't on a branch"
[ -z "$(git status --porcelain)" ] || die "$SRC has local changes; patches belong in $HERE/apply.py"
old=$(git rev-parse HEAD)
review=""
if [ "${1:-}" != --install ]; then
  export GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND="${GIT_SSH_COMMAND:-ssh -o BatchMode=yes -o ConnectTimeout=10}"
  git fetch -q origin "$branch" || die "Couldn't fetch $branch"
  review=$(git diff --name-only "$old" "origin/$branch" -- install.sh over9k/keys.json over9k/mods/over9k-options/setup.sh)
  git merge -q --ff-only "origin/$branch" || die "$branch can't fast-forward to origin/$branch"
fi
new=$(git rev-parse HEAD)
short() { git rev-parse --short "$1"; }
[ "$old" = "$new" ] && say "Over9k: $branch at $(short "$new")" \
  || say "Over9k: $(git rev-list --count "$old..$new") new commit(s), $(short "$old") -> $(short "$new")"

# The layout (a changed copy kept beside it, as install.sh does).
mkdir -p "$APP/layouts" "$APP/mods"
lay="$APP/layouts/over9k.json"
[ -f "$lay" ] && ! cmp -s "$SRC/over9k/layouts/over9k.json" "$lay" && cp "$lay" "$lay.before-update"
cp "$SRC/over9k/layouts/over9k.json" "$SRC/over9k/layouts/over9k.svg" "$APP/layouts/"

# The mods.
for d in "$SRC"/over9k/mods/*/; do
  name=$(basename "$d")
  rsync -a --delete --exclude servers.json --exclude '*.error' \
    --exclude gpui-kit.d.ts --exclude herdr.d.ts --exclude jsconfig.json "$d" "$APP/mods/$name/"
  [ -f "$d/servers.json" ] && [ ! -f "$APP/mods/$name/servers.json" ] && cp "$d/servers.json" "$APP/mods/$name/"
  chmod +x "$APP/mods/$name"/*.sh 2>/dev/null || true
done

# Where it came from, for the footer's update check.
mkdir -p "$DATA"
printf '{"path": "%s", "commit": "%s", "branch": "%s"}\n' "$SRC" "$new" "$branch" > "$DATA/source.json"

# This machine's patches, then a load check of every mod.
problems=""
out=$(python3 -I "$HERE/apply.py" 2>&1) || problems="patches failed (see above)"
printf '%s\n' "$out" | sed 's/^/  /'
bad=""
for d in "$SRC"/over9k/mods/*/; do
  name=$(basename "$d")
  herdr-app check "$APP/mods/$name" >/dev/null 2>&1 || bad="$bad $name"
done
[ -z "$bad" ] || problems="${problems:+$problems; }check failed:$bad"

[ -z "$review" ] || say "Review by hand (a hand copy doesn't act on these): $(echo $review)"
if [ -n "$problems" ]; then
  say "Done with problems: $problems"; note "Over9k updated, with problems" "$problems"; exit 1
fi
say "Done."
[ "$old" = "$new" ] || note "Over9k updated" "${review:+Review: $(echo $review)}"
