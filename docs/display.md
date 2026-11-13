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
The laptop panel and an optional HDMI screen via kanshi; brightness from the keys or here; the wallpaper drawn by swaybg.

## At a glance
- Panel: eDP-1, 2560×1440 at 120 Hz, scale 1.3
- Docked: + HDMI-A-1 1920×1080, to the right
- Brightness: brillo, 5% per key, restored at login
- Wallpaper: swaybg, fill mode, base colour behind

## Screens
- `kanshi/` switches the laptop and docked profiles
- `sv/kanshi` keeps it running; outputs here are read-only (wlr-randr)

## Brightness
- keys run `brillo -A/-U 5 && brillo -O`
- `-O` saves the level; `brillo -I` in river/init restores it at login
> [!NOTE]
> The OSD listens for the kernel's backlight events, so it shows every change, whatever made it.

## Wallpaper
- swaybg shows `~/.local/state/wallpaper/current`, the symlink a click here sets
- no link → `~/Pictures/wallpaper.png`, the Mocha duotone
```sh
ln -sfn <image> ~/.local/state/wallpaper/current && sv restart ~/.local/sv/swaybg
```
> [!TIP]
> The duotone is 1920×1080, so it's a little soft on this 2560×1440 panel. Its ImageMagick command is in `sv/swaybg/`'s run script.
