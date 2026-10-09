#!/bin/sh
# GTK appearance names - single source of truth for the two places GTK reads
# them from, which must agree:
#   - ~/.config/gtk-{3,4}.0/settings.ini   (most GTK apps)
#   - gsettings org.gnome.desktop.interface (apps that read appearance through
#     the xdg-desktop-portal Settings interface)
# apply-theme.sh renders the settings.ini files AND issues the matching
# `gsettings set` calls from these values, so the two paths cannot drift. They
# did drift on 2026-09-10 - pcmanfm and blueman stayed light while file-roller
# went dark - which is why this file exists rather than two hand-edited copies.
#
# GTK_THEME_NAME is rewritten by build-gtk-theme.sh after it compiles Colloid;
# the other two are yours to edit. The name must resolve to a real directory in
# ~/.themes or /usr/share/themes, or portal-aware apps fall back to light.
# Edit, then run ~/.config/theme/apply-theme.sh.

GTK_THEME_NAME=Colloid-Purple-Dark-Catppuccin
GTK_ICON_THEME=Papirus-Dark

# Cursor - ONE theme everywhere it is read (2026-10-09). Besides the two GTK
# paths above, river/init uses these for `riverctl xcursor-theme` (river draws
# the cursor for every cursor-shape-v1 client: Zen/Firefox, GTK4, foot - and
# exports XCURSOR_THEME/SIZE to what it spawns and to Xwayland) and exports
# them itself for its own children (runsvdir services, D-Bus activation), so
# apps that draw their OWN cursor pick the same theme. apply-theme.sh applies
# them live. Theme: Catppuccin Mocha Dark (catppuccin/cursors v2.0.0, unzipped
# into ~/.local/share/icons/ - not packaged for Void). Size: its Xcursor files
# come in 6px steps (24, 30, 36...); loaders snap to the nearest, so use a real
# step. Was Adwaita 24; 30 = "at least 4px bigger".
GTK_CURSOR_THEME=catppuccin-mocha-dark-cursors
GTK_CURSOR_SIZE=30
