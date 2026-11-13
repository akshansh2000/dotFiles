---
title: Display & wallpaper
order: 1
icon: F0379
paths:
  config:
    - kanshi/
  services:
    - sv/kanshi/
    - sv/swaybg/
  ui:
    - quickshell/services/Brightness.qml
    - quickshell/control/sections/Display.qml
  keys:
    - path: river/keybindings.conf
      note: Volume / brightness / media keys (normal + locked, per river's own docs)
  wallpapers:
    - ~/Pictures/wallpapers/
    - path: ~/.local/state/wallpaper/current
      note: symlink to the chosen image (set here); missing = the fallback below
    - path: ~/Pictures/wallpaper.png
      note: fallback, the Mocha duotone
checks:
  - sv: kanshi
  - sv: swaybg
---
# Display & wallpaper

The laptop panel (`eDP-1`) is 2560×1440 at 120 Hz, at scale **1.3**.
**kanshi** (`sv/kanshi`) switches between the *laptop* and *docked*
profiles in `kanshi/config`. Docked adds HDMI-A-1 at 1920×1080 to the
right.

## Brightness

- The keys run `brillo -A/-U 5 && brillo -O`.
- `-O` saves the level, and `brillo -I` in `river/init` restores it at
  login.
- The slider here does the same with `brillo -S N && brillo -O`.
- The OSD reacts to every change, whatever made it: it listens for the
  kernel's backlight events.

## Wallpaper

**swaybg** (`sv/swaybg`) draws it in `fill` mode, with the theme's base
colour behind it. It shows `~/.local/state/wallpaper/current`. Picking an
image here repoints that symlink and restarts the service.

Without the link, it falls back to `~/Pictures/wallpaper.png`. That's a
Mocha duotone made with ImageMagick (the command is in `sv/swaybg/run`). At
1920×1080 it looks a little soft on this 2560×1440 panel.
