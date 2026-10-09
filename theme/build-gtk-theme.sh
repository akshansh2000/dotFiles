#!/bin/sh
# Build and install the GTK theme (Colloid, Catppuccin Mocha, purple accent).
#
# Why this exists rather than "download a theme":
# Colloid's own catppuccin palette is NOT Mocha. Its `*-light` accents - the
# ones the dark variant uses - are Frappe (#ca9ee6 purple, #8caaee blue), its
# `*-dark` accents are Latte, and the dark surfaces it actually picks
# (src/sass/_colors.scss: types e/f/g/h -> $grey-800/750/700/650) are
# Frappe/Macchiato greys, not Mocha's #1e1e2e ladder. Only the unused
# $grey-850/900/950 happen to be Mocha.
#
# So this script rewrites that palette from ~/.config/theme/colors.sh before
# compiling, which keeps colors.sh the single source of truth for GTK the same
# way it already is for waybar/rofi/foot/etc. Change a colour there, re-run
# this, and GTK follows.
#
# Run after: a palette change, a Colloid update, or a GTK/libadwaita update
# that visibly breaks widgets. Needs sassc.
set -eu

SRC=${COLLOID_SRC:-$HOME/.local/src/Colloid-gtk-theme}
PALETTE=src/sass/_color-palette-catppuccin.scss

# Build flags. `-l` also installs the gtk-4.0 stylesheet into ~/.config/gtk-4.0,
# which is the ONLY path libadwaita apps read - they ignore gtk-theme-name
# entirely, so without it file-roller/pwvucontrol/satty stay stock Adwaita.
THEME_VARIANT=purple
SIZE=standard

. "$HOME/.config/theme/colors.sh"

command -v sassc >/dev/null 2>&1 || { echo "sassc is not installed" >&2; exit 1; }
[ -d "$SRC" ] || { echo "Colloid checkout missing: $SRC" >&2; exit 1; }

cd "$SRC"

# Start from a pristine palette every time, so the sed below is never applied
# twice and a `git pull` never conflicts with our edits.
git checkout -- "$PALETTE"
git pull --ff-only --quiet || echo "warning: could not update $SRC, building what is on disk" >&2
git checkout -- "$PALETTE"

# Accents: the dark variant reads the `*-light` names (lighter accent on a dark
# background), so those are the ones that must become Mocha.
#
# Greys 650-800 are the four dark surfaces, lightest (650) to darkest (800);
# $grey-700 is what becomes `theme_bg_color`, so it has to be BASE for windows
# to match the rest of the rice. Note Colloid's four are all near-black
# (#232634..#303446), so they map onto Mocha's crust/mantle/base end, NOT onto
# surface0/1/2 - mapping by ladder position instead of by lightness lifts the
# whole theme to a washed-out grey (tried it; theme_bg_color came out #45475a).
# $grey-850/900/950 are deliberately left at upstream's Mocha base/mantle/crust:
# they are only read by `--tweaks black`, where they give a coherent darker set.
sed -i \
	-e "s|^\$red-light:.*|\$red-light: #$THEME_RED;|" \
	-e "s|^\$pink-light:.*|\$pink-light: #$THEME_PINK;|" \
	-e "s|^\$purple-light:.*|\$purple-light: #$THEME_MAUVE;|" \
	-e "s|^\$blue-light:.*|\$blue-light: #$THEME_BLUE;|" \
	-e "s|^\$teal-light:.*|\$teal-light: #$THEME_TEAL;|" \
	-e "s|^\$green-light:.*|\$green-light: #$THEME_GREEN;|" \
	-e "s|^\$yellow-light:.*|\$yellow-light: #$THEME_YELLOW;|" \
	-e "s|^\$orange-light:.*|\$orange-light: #$THEME_PEACH;|" \
	-e "s|^\$grey-650:.*|\$grey-650: #$THEME_SURFACE0;|" \
	-e "s|^\$grey-700:.*|\$grey-700: #$THEME_BASE;|" \
	-e "s|^\$grey-750:.*|\$grey-750: #$THEME_MANTLE;|" \
	-e "s|^\$grey-800:.*|\$grey-800: #$THEME_CRUST;|" \
	-e "s|^\$white:.*|\$white: #$THEME_TEXT;|" \
	-e "s|^\$black:.*|\$black: #$THEME_CRUST;|" \
	-e "s|\$links: *if(\$variant == 'light', #04a5e5, #[0-9a-fA-F]*)|\$links: if(\$variant == 'light', #04a5e5, #$THEME_SKY)|" \
	"$PALETTE"

./install.sh -c dark -t "$THEME_VARIANT" -s "$SIZE" -l --tweaks catppuccin

# install.sh copies the gtk-4.0 files into ~/.config/gtk-4.0. Replace the copies
# with symlinks into the theme so a later rebuild propagates on its own and
# `ls -l` shows what owns them.
THEME_DIR=$(ls -d "$HOME/.themes/Colloid"*"Catppuccin"* 2>/dev/null | head -1)
if [ -n "$THEME_DIR" ] && [ -d "$THEME_DIR/gtk-4.0" ]; then
	for f in gtk.css gtk-dark.css assets; do
		[ -e "$THEME_DIR/gtk-4.0/$f" ] || continue
		rm -rf "$HOME/.config/gtk-4.0/$f"
		ln -sfn "$THEME_DIR/gtk-4.0/$f" "$HOME/.config/gtk-4.0/$f"
	done
fi

# Leave the palette pristine so the checkout is a clean mirror of upstream.
git checkout -- "$PALETTE"

# Stamp the palette this theme was built from, so apply-theme.sh can tell you
# when GTK has fallen behind colors.sh instead of you noticing by eye. Only the
# THEME_* lines are hashed - hashing the whole file made a comment edit report
# the theme as stale. apply-theme.sh must compute this the same way.
[ -n "${THEME_DIR:-}" ] && grep '^THEME_' "$HOME/.config/theme/colors.sh" \
	| sha256sum | cut -d' ' -f1 > "$THEME_DIR/.built-from-colors"

echo
echo "installed: ${THEME_DIR:-(theme dir not found)}"

# Hand the theme name to theme/gtk.sh, which is what apply-theme.sh renders into
# settings.ini and feeds to `gsettings set`. Before 2026-09-18 this script just
# printed a reminder to set the name in those two places by hand, which is
# exactly the kind of manual step that drifts.
if [ -n "${THEME_DIR:-}" ]; then
	_name=$(basename "$THEME_DIR")
	_old=$(sed -n 's/^GTK_THEME_NAME=//p' "$HOME/.config/theme/gtk.sh")
	sed -i "s|^GTK_THEME_NAME=.*|GTK_THEME_NAME=$_name|" "$HOME/.config/theme/gtk.sh"
	if [ "$_old" != "$_name" ]; then
		echo "theme/gtk.sh: GTK_THEME_NAME $_old -> $_name"
		echo "run apply-theme.sh to push the new name into settings.ini and gsettings"
	fi
fi

echo "GTK3 apps need a restart to pick up a rebuild; libadwaita apps too."
