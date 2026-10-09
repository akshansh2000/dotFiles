#!/bin/sh
# Catppuccin Mocha - single source of truth for all themed configs.
# Bare hex, no # or 0x prefix (each consumer wants a different prefix convention).
# Edit values here, then run ~/.config/theme/apply-theme.sh to propagate.
#
# This is the full 26-colour Mocha palette. The handful marked below are the
# ones the rice actually leans on; the rest are here so a new template never
# has to invent a colour or hardcode one.
#
# colors.fish is GENERATED from this file by gen-fish-vars.sh (run from
# apply-theme.sh) - never edit it by hand.

# --- surfaces, darkest to lightest ---
THEME_CRUST=11111b      # deepest bg - drop shadows, outermost frame
THEME_MANTLE=181825     # bg-alt / bar background
THEME_BASE=1e1e2e       # bg
THEME_SURFACE0=313244   # subtle raised panel
THEME_SURFACE1=45475a   # borders / unfocused UI
THEME_SURFACE2=585b70   # stronger border / disabled fg

# --- greys, dim to bright ---
THEME_OVERLAY0=6c7086   # dimmest readable text
THEME_OVERLAY1=7f849c
THEME_OVERLAY2=9399b2
THEME_SUBTEXT0=a6adc8   # fg-alt / dim
THEME_SUBTEXT1=bac2de
THEME_TEXT=cdd6f4       # fg

# --- accents ---
THEME_LAVENDER=b4befe   # soft accent, pairs with mauve
THEME_MAUVE=cba6f7      # primary accent
THEME_BLUE=89b4fa       # secondary accent
THEME_SAPPHIRE=74c7ec
THEME_SKY=89dceb
THEME_TEAL=94e2d5
THEME_GREEN=a6e3a1      # good / battery-ok
THEME_YELLOW=f9e2af     # warning
THEME_PEACH=fab387      # warning-alt / secondary highlight
THEME_MAROON=eba0ac
THEME_RED=f38ba8        # urgent / critical
THEME_PINK=f5c2e7
THEME_FLAMINGO=f2cdcd
THEME_ROSEWATER=f5e0dc
