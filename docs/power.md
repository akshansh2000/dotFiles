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
Battery stats, a 25% low-battery warning, and a charge limit and power profile that need root.

## At a glance
- Warning: 25%, once per discharge
- Charge limit: 60–100% (root)
- Profiles: quiet · balanced · performance
- Health: full ÷ design capacity

## Low-battery warning
- `sv/battery-notify`, wakes on power_supply events + every 15 s
- cleared when AC returns, re-armed for the next discharge
- `mako/config.tmpl` puts critical notifications above fullscreen
> [!IMPORTANT]
> "Discharging" = `AC0/online`, not `BAT0/status`: at the limit BAT0 says "Not charging".

## Root changes
- one helper via pkexec, fixed allow-list, validated values
- password kept a few minutes (`50-control-centre.rules`)
- limit re-applied at boot by `/etc/rc.local`
> [!TIP]
> A lower limit is kind to an old battery that mostly sits on AC.
```sh
system/install.sh usr/local/libexec/control-centre-helper etc/polkit-1/rules.d/50-control-centre.rules etc/rc.local
```

## Known issues
> [!WARNING]
> s2idle on battery drains it to 0 → clock resets to 2023 → TLS fails until chrony syncs. Planned fix: hibernate after a while.
