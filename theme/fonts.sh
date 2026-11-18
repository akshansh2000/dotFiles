#!/bin/sh
# Monospace font - single source of truth for foot, alacritty, kitty, the
# generic `monospace` fontconfig alias (fontconfig/fonts.conf), GTK's
# monospace-font-name, and the mono bits of waybar/startpage/tridactyl.
# Not templated, so set by hand to match: zed/settings.json, and Herdr (which
# ships JetBrains Mono Medium as its own default, so it needs nothing set).
# Bare family name, no quotes (each consumer quotes it its own way). Sizes
# are kept separate per app rather than shared, since foot and alacritty
# don't necessarily want to look identical.
# Edit values here, then run ~/.config/theme/apply-theme.sh to propagate;
# that also regenerates fonts.fish, which is never edited by hand.
#
# JetBrains Mono since 2026-11-18 (was Fira Code): picked after a side-by-side
# in Herdr, where it is the default. Void doesn't package it, so it is the
# official release (v2.304) in ~/.local/share/fonts/JetBrainsMono/.
# The weight is part of the look: Medium, not Regular. FONT_MONO_STYLE is the
# fontconfig style name (foot/kitty/alacritty/GTK); FONT_MONO_WEIGHT is the same
# weight as a number (Zed, CSS). Bold and italic are set explicitly in each
# terminal's template - a terminal that derives bold by adding weight=bold to
# a pattern that already says Medium gets Medium again (checked with fc-match).

FONT_MONO_FAMILY="JetBrains Mono"
FONT_MONO_STYLE=Medium
FONT_MONO_WEIGHT=500
FONT_MONO_SIZE_GTK=11
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
