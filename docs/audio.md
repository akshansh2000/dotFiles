---
title: Audio
order: 2
icon: F057E
paths:
  config:
    - wireplumber/
    - wireplumber/wireplumber.conf.d/51-laptop-speakers.conf
    - wireplumber/wireplumber.conf.d/52-laptop-mic.conf
  services:
    - sv/pipewire/
    - sv/pipewire-pulse/
    - sv/wireplumber/
  ui:
    - quickshell/services/Audio.qml
    - quickshell/osd/
    - waybar/scripts/volume-status.py
    - waybar/scripts/audio-menu.sh
  keys:
    - path: river/keybindings.conf
      note: Volume / brightness / media keys (normal + locked, per river's own docs)
  logs:
    - /tmp/runsvdir-user.log
checks:
  - sv: pipewire
  - sv: wireplumber
  - sv: pipewire-pulse
---
PipeWire with WirePlumber, as runit user services; the laptop's devices renamed; volume deliberately uncapped.

## At a glance
- Output: Laptop Speakers
- Input: Laptop Microphone
- Volume range: 0–130% shown, no cap
- Bluetooth codec: SBC-XQ (not LDAC)

## Services
- `sv/pipewire`, `sv/pipewire-pulse`, `sv/wireplumber` under `~/.local/sv`
- started by `river/init` via runsvdir; output in `/tmp/runsvdir-user.log`
> [!NOTE]
> No systemd `--user` on Void, so runit supervises them.

## Device names
- `51-laptop-speakers.conf` → Laptop Speakers
- `52-laptop-mic.conf` → Laptop Microphone
> [!CAUTION]
> WirePlumber saves volume with a delay: wait a few seconds after a change before restarting it, or the change is lost.
```sh
sv restart ~/.local/sv/wireplumber
```

## Volume and mic
- keys call wpctl directly; mic button = XF86AudioMicMute
- OSD and this section: red line at 100%, yellow above
> [!IMPORTANT]
> Not capped on purpose: 130%+ is sometimes wanted. `channelmix.max-volume` doesn't clamp this ALSA sink.
