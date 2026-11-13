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
# Audio

PipeWire, WirePlumber and pipewire-pulse run as **runit user services** in
`~/.local/sv`, because Void has no systemd `--user`. `river/init` starts
them through `runsvdir`. Their output, and any errors, go to
`/tmp/runsvdir-user.log`, which a reboot clears.

## Device names

ALSA calls both built-in devices *"Family 17h/19h HD Audio Controller
Analog Stereo"*. Two WirePlumber rules rename them:

- `51-laptop-speakers.conf` → **Laptop Speakers**
- `52-laptop-mic.conf` → **Laptop Microphone**

To apply a rule change, restart the wireplumber service
(`sv restart ~/.local/sv/wireplumber`). Wait a few seconds after any
volume change first: WirePlumber saves volume with a delay, and a quick
restart loses the last change.

## Volume

- The keys call `wpctl` directly (the `keys` entry below).
- Volume is **deliberately not capped**: 130%+ is sometimes wanted.
  `channelmix.max-volume` in a WirePlumber rule was tried and does **not**
  clamp this ALSA sink.
- The OSD and this section draw volume as 0–130% with a red line at 100%.
  The bar turns yellow from 101%.

## Mic

The dedicated mic button sends `KEY_MICMUTE`, which xkb names
`XF86AudioMicMute`. It toggles the default input's mute. The button has no
LED, so the OSD card is the only sign.

## Bluetooth

SBC-XQ, not LDAC, is the deliberate codec choice. The codec in use shows
here and in waybar's volume tooltip. A newly connected headset becomes the
default output, and the OSD shows its name.
