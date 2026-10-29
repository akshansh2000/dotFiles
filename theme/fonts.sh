#!/bin/sh
# Monospace font for terminals - single source of truth for foot + alacritty
# + kitty.
# Bare family name, no quotes (each consumer quotes it its own way). Sizes
# are kept separate per app rather than shared, since foot and alacritty
# don't necessarily want to look identical.
# Edit values here, then run ~/.config/theme/apply-theme.sh to propagate;
# that also regenerates fonts.fish, which is never edited by hand.

FONT_MONO_FAMILY="Fira Code"
FONT_MONO_SIZE_FOOT=10
FONT_MONO_SIZE_ALACRITTY=11
# kitty and foot count sizes the same way: 10 draws foot's 11x22 px cell at
# the 1.3 scale (measured 2026-10-17; a first try matched a foot window that
# had been zoomed with Ctrl+= and came out a size too big).
FONT_MONO_SIZE_KITTY=10

# --- sans ---
# The UI font, shared by GTK apps, waybar, rofi and mako. Before this existed
# those three all said the generic `sans`, which fontconfig resolves to DejaVu
# Sans here (`fc-match sans`), while GTK was set to Noto Sans - so the bar,
# launcher and notifications silently disagreed with every application window.
# Sizes stay per-consumer because the units differ: GTK/rofi/mako take points,
# waybar's CSS takes pixels.
FONT_SANS_FAMILY="Noto Sans"
FONT_SANS_SIZE_GTK=11
FONT_SANS_SIZE_ROFI=13
FONT_SANS_SIZE_MAKO=11
FONT_SANS_SIZE_WAYBAR=14
