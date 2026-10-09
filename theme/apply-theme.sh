#!/bin/sh
# Regenerates every templated config from colors.sh/fonts.sh/gtk.sh and
# live-reloads what can be reloaded without a full river restart. Run this
# after editing any of them. Safe to run repeatedly (idempotent).

# --gtk also rebuilds the GTK theme (Colloid, compiled from colors.sh by
# theme/build-gtk-theme.sh). Off by default because that is a sass compile -
# seconds, not milliseconds - and this script is meant to be cheap enough to
# run on every palette tweak. Parsed before the `set --` below, which clears
# the positional parameters to reuse them as sed arguments.
BUILD_GTK=no
[ "${1:-}" = "--gtk" ] && BUILD_GTK=yes

. "$HOME/.config/theme/colors.sh"
. "$HOME/.config/theme/fonts.sh"
. "$HOME/.config/theme/gtk.sh"

# Built with `set --` (POSIX sh has no arrays) rather than a plain string,
# so a value containing spaces (e.g. FONT_MONO_FAMILY="Fira Code") survives
# as one sed -e argument instead of being word-split into two. A plain
# unquoted `SED_ARGS="..."` string silently broke this exact way once a
# font family with a space was introduced - every template failed to
# compile and each output file was truncated to empty by `>` before sed
# ever ran, taking out waybar/foot/alacritty/rofi/yazi in one go.
set --

# Every THEME_* in colors.sh becomes a {{NAME}} placeholder automatically, so
# adding a colour there is a one-file change - no risk of a template using a
# placeholder this script has never heard of and silently emitting it verbatim.
for _var in $(sed -n 's/^\(THEME_[A-Za-z0-9_]*\)=.*/\1/p' "$HOME/.config/theme/colors.sh")
do
	eval "_val=\$$_var"
	set -- "$@" -e "s/{{${_var#THEME_}}}/$_val/g"

	# Also emit a {{NAME_RGBF}} float triple, for configs that take colours as
	# space-separated 0..1 floats rather than hex. sioyek was the original
	# consumer and is gone; kept because the next such config costs nothing.
	# Hex is split with parameter expansion and converted with
	# awk because dash arithmetic is integer-only.
	_rest=${_val#??}
	set -- "$@" -e "s/{{${_var#THEME_}_RGBF}}/$(awk -v r=$((0x${_val%????})) \
		-v g=$((0x${_rest%??})) -v b=$((0x${_rest#??})) \
		'BEGIN { printf "%.3f %.3f %.3f", r/255, g/255, b/255 }')/g"
done

# Same treatment for fonts.sh and gtk.sh, so adding a font or an appearance
# name is a one-file change there too. These were hand-listed one sed argument
# per variable until 2026-09-18; adding the four sans entries would have made
# that list seven lines long and easy to forget to extend.
#
# Unlike THEME_*, these keep their full name in the placeholder
# ({{FONT_MONO_FAMILY}}, not {{MONO_FAMILY}}) - that is the convention the
# existing foot/alacritty templates already use, so it stays.
for _src in fonts gtk; do
	for _var in $(sed -n 's/^\([A-Z][A-Za-z0-9_]*\)=.*/\1/p' "$HOME/.config/theme/$_src.sh")
	do
		eval "_val=\$$_var"
		set -- "$@" -e "s/{{${_var}}}/$_val/g"
	done
done

# Regenerate to a temp file first and only replace the real config if sed
# succeeded - so a bad template/value can never truncate a working config
# to empty the way the word-splitting bug above just did.
for pair in \
	"$HOME/.config/waybar/style.css.tmpl:$HOME/.config/waybar/style.css" \
	"$HOME/.config/alacritty/alacritty.toml.tmpl:$HOME/.config/alacritty/alacritty.toml" \
	"$HOME/.config/rofi/colors.rasi.tmpl:$HOME/.config/rofi/colors.rasi" \
	"$HOME/.config/foot/foot.ini.tmpl:$HOME/.config/foot/foot.ini" \
	"$HOME/.config/yazi/theme.toml.tmpl:$HOME/.config/yazi/theme.toml" \
	"$HOME/.config/startpage/index.html.tmpl:$HOME/.config/startpage/index.html" \
	"$HOME/.config/firefox/userChrome.css.tmpl:$HOME/.config/firefox/chrome/userChrome.css" \
	"$HOME/.config/zen-rice/userChrome.css.tmpl:$HOME/.config/zen-rice/chrome/userChrome.css" \
	"$HOME/.config/zen-rice/user.js.tmpl:$HOME/.config/zen-rice/user.js" \
	"$HOME/.config/tridactyl/themes/catppuccin.css.tmpl:$HOME/.config/tridactyl/themes/catppuccin.css" \
	"$HOME/.config/mako/config.tmpl:$HOME/.config/mako/config" \
	"$HOME/.config/rofi/fonts.rasi.tmpl:$HOME/.config/rofi/fonts.rasi" \
	"$HOME/.config/rofi/icons.rasi.tmpl:$HOME/.config/rofi/icons.rasi" \
	"$HOME/.config/gtk-3.0/settings.ini.tmpl:$HOME/.config/gtk-3.0/settings.ini" \
	"$HOME/.config/gtk-3.0/settings.ini.tmpl:$HOME/.config/gtk-4.0/settings.ini" \
	"$HOME/.config/mpv/script-opts/uosc.conf.tmpl:$HOME/.config/mpv/script-opts/uosc.conf"
do
	src=${pair%%:*}
	dst=${pair#*:}
	tmp=$(mktemp "$dst.XXXXXX")
	if sed "$@" "$src" > "$tmp"; then
		mv "$tmp" "$dst"
		# mktemp makes the temp file 0600, and mv carries that over. That
		# was invisible while every consumer ran as this user, but
		# startpage/index.html is served by a web server, so make the
		# generated files plain config-readable.
		chmod 644 "$dst"
	else
		echo "error: sed failed rendering $src - $dst left untouched" >&2
		rm -f "$tmp"
	fi
done

echo "theme files regenerated"

# fish cannot source POSIX sh, so colors/fonts have to exist twice. These two
# are generated, never edited - see gen-fish-vars.sh for why hand-syncing them
# was a silent-drift hazard. New shells pick the values up; shells already open
# keep the old ones until they are restarted.
for pair in colors fonts; do
	"$HOME/.config/theme/gen-fish-vars.sh" \
		"$HOME/.config/theme/$pair.sh" "$HOME/.config/theme/$pair.fish"
done
echo "colors.fish/fonts.fish regenerated from the .sh sources"

# Reload waybar (picks up the new style.css) - it has no live CSS-reload
# signal. It is supervised (~/.local/sv/waybar), so restart it through runit:
# killing it and relaunching by hand would leave runit starting a second bar.
if [ -x "$HOME/.local/sv/waybar/run" ] && [ ! -e "$HOME/.local/sv/waybar/down" ]; then
	sv restart "$HOME/.local/sv/waybar" >/dev/null && echo "waybar restarted"
fi

# mako re-reads its config on SIGUSR2; no restart, no lost notifications.
if pgrep -u "$USER" -x mako >/dev/null 2>&1; then
	makoctl reload && echo "mako reloaded"
fi

# river background: riverctl is idempotent and applies live.
# Border colours are NOT set here: wideriver owns them (it sets them itself over
# river-control and would overwrite a riverctl call), and reads colors.sh only
# when it starts - so restart it instead. border-color-urgent is river/init's.
if command -v riverctl >/dev/null 2>&1 && riverctl list-inputs >/dev/null 2>&1; then
	riverctl background-color "0x$THEME_BASE"
	riverctl border-color-urgent "0x$THEME_RED"
	# Cursor (theme/gtk.sh): live for river-drawn cursors and for anything river
	# spawns from now on. Apps already running keep the cursor they loaded.
	riverctl xcursor-theme "$GTK_CURSOR_THEME" "$GTK_CURSOR_SIZE"
	if [ -x "$HOME/.local/sv/wideriver/run" ] && [ ! -e "$HOME/.local/sv/wideriver/down" ]; then
		sv restart "$HOME/.local/sv/wideriver" >/dev/null && echo "wideriver restarted (border colours)"
	fi
	echo "river colors updated live"
fi

# The other half of the GTK appearance rule: settings.ini above covers most
# apps, gsettings covers the ones that read appearance through the
# xdg-desktop-portal Settings interface. Both are rendered from theme/gtk.sh and
# fonts.sh here, so they cannot disagree - which they did on 2026-09-10, leaving
# pcmanfm and blueman light while file-roller went dark. Values are quoted:
# family names contain spaces. `color-scheme=prefer-dark` is deliberately not
# touched - it is a light/dark preference, not one of these names.
if command -v gsettings >/dev/null 2>&1; then
	gsettings set org.gnome.desktop.interface gtk-theme "$GTK_THEME_NAME"
	gsettings set org.gnome.desktop.interface icon-theme "$GTK_ICON_THEME"
	gsettings set org.gnome.desktop.interface cursor-theme "$GTK_CURSOR_THEME"
	gsettings set org.gnome.desktop.interface cursor-size "$GTK_CURSOR_SIZE"
	gsettings set org.gnome.desktop.interface font-name "$FONT_SANS_FAMILY $FONT_SANS_SIZE_GTK"
	gsettings set org.gnome.desktop.interface document-font-name "$FONT_SANS_FAMILY $FONT_SANS_SIZE_GTK"
	echo "gsettings interface keys synced with settings.ini"
fi

# The compiled GTK *theme* is the one thing this script does not build: that is
# build-gtk-theme.sh, which stamps the palette's checksum into the installed
# theme. Compare the two so a palette change can never leave GTK silently
# showing the old colours. (settings.ini and gsettings above ARE generated.)
GTK_STAMP=$(ls -d "$HOME/.themes/Colloid"*"Catppuccin"*/.built-from-colors 2>/dev/null | head -1)
if [ "$BUILD_GTK" = yes ]; then
	"$HOME/.config/theme/build-gtk-theme.sh"
elif [ -z "$GTK_STAMP" ]; then
	echo "gtk: no built theme found - run theme/build-gtk-theme.sh"
elif [ "$(cat "$GTK_STAMP")" != "$(grep '^THEME_' "$HOME/.config/theme/colors.sh" | sha256sum | cut -d' ' -f1)" ]; then
	echo "gtk: STALE - colors.sh changed since the theme was built."
	echo "     run 'theme/apply-theme.sh --gtk' or 'theme/build-gtk-theme.sh'"
else
	echo "gtk: theme is current"
fi

echo "foot/alacritty/rofi/yazi pick up the new colors on next launch"
echo "tridactyl: re-run ':colourscheme --url http://127.0.0.1:8123/tridactyl-catppuccin.css --update catppuccin'"
echo "firefox: userChrome.css is read at startup only - fully restart Firefox"
echo "zen: same - fully restart Zen to pick up zen-rice/chrome/userChrome.css"
