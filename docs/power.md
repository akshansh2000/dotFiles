---
title: Power & battery
order: 3
icon: F0079
paths:
  services:
    - sv/battery-notify/
  scripts:
    - river/battery-notify.py
    - waybar/scripts/battery-status.py
    - river/lid.sh
  ui:
    - quickshell/services/Battery.qml
    - quickshell/control/sections/Power.qml
  config:
    - path: mako/config.tmpl
      note: "[urgency=critical] layer=overlay: above fullscreen windows"
  system:
    - path: /usr/local/libexec/control-centre-helper
      note: root helper for the charge limit and power profile (staged in system/)
    - path: /etc/polkit-1/rules.d/50-control-centre.rules
      note: keeps the password for a few minutes for that helper only
    - path: /etc/control-centre/charge-limit
      note: the saved limit; /etc/rc.local re-applies it at boot
    - /sys/class/power_supply/BAT0/
    - /sys/firmware/acpi/platform_profile
  logs:
    - /var/log/socklog/everything/current
checks:
  - sv: battery-notify
---
# Power & battery

## Low-battery warning

- `sv/battery-notify` sends **one** critical notification per discharge,
  at 25% or below, with the time left.
- It is dismissed again when AC comes back, and armed for the next
  discharge.
- It wakes on kernel `power_supply` events, and every 15 s because the
  battery is old.
- "Discharging" is read from `AC0/online`, not `BAT0/status`: at the
  charge limit, BAT0 says *Not charging*.
- Critical notifications use mako's **overlay** layer, so they show above
  fullscreen windows. waybar's battery turns red at the same 25%.

## Charge limit and power profile

Both are sysfs files only root can write:

- `charge_control_end_threshold`, 60–100%;
- `platform_profile`: quiet / balanced / performance.

This section changes them through **one small root helper** run by `pkexec`.

- **What the helper accepts:** exactly those two actions, with validated
  values. Anything else exits 2 and writes nothing. Tests:
  `sh ~/.config/system/test-control-centre-helper.sh`.
- **The password:** polkit asks once, then keeps it for a few minutes
  (`50-control-centre.rules`).
- **The charge limit after a reboot:** the firmware resets it to 100 at
  every boot. So the helper also saves it to
  `/etc/control-centre/charge-limit`, and `/etc/rc.local` writes it back.
- **Installing:** both live in `~/.config/system/` like the other
  root-owned files:
  `system/install.sh usr/local/libexec/control-centre-helper etc/polkit-1/rules.d/50-control-centre.rules etc/rc.local`.

A lower limit is kind to an old battery when the laptop mostly sits on AC.

## Known issue

Suspend (s2idle) on battery can drain it to zero. The hardware clock then
falls back to 2023 until chrony fixes it after Wi-Fi comes up, and anything
started before that sees TLS certificates as "not yet valid". Planned fix:
hibernate after a while in suspend.
