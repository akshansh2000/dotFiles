#!/usr/bin/env python3
"""Low-battery warning (2026-10-30). Run by the runit user service
~/.local/sv/battery-notify.

Once per discharge, when the battery reaches LOW_PCT or less, show a
CRITICAL notification: it stays until dismissed (mako's critical timeout is
0) and draws on mako's overlay layer, i.e. above fullscreen windows - the
normal top layer is hidden under them. Plugging in dismisses it again and
re-arms the warning for the next discharge.

Wakes on kernel power_supply events (`udevadm monitor`, so plugging in clears
the warning at once) and every REFRESH seconds for the level itself - 15 s,
not 30 like the waybar module, because this battery is old and its level can
drop fast. LOW_PCT matches waybar's red battery icon (battery-status.py).

"Discharging" is taken from AC0/online, not BAT0/status: on AC at the charge
limit the status reads "Not charging", which must not warn.

If the notification can't be sent (mako not up yet at login), the warning
stays armed and is retried on the next wake-up.

BAT/AC/REFRESH can be overridden with BATTERY_NOTIFY_BAT / _AC / _REFRESH,
for testing against a fake sysfs directory.
"""
import os, select, subprocess, sys

BAT = os.environ.get("BATTERY_NOTIFY_BAT", "/sys/class/power_supply/BAT0")
AC = os.environ.get("BATTERY_NOTIFY_AC", "/sys/class/power_supply/AC0")
LOW_PCT = 25
REFRESH = float(os.environ.get("BATTERY_NOTIFY_REFRESH", 15))  # seconds


def read(path):
    try:
        with open(path) as f:
            return f.read().strip()
    except OSError:
        return None


def num(path):
    v = read(path)
    return int(v) if v and v.lstrip("-").isdigit() else None


def time_left():
    # energy_now / power_now (µWh / µW) while discharging; None if unknown.
    energy, power = num(f"{BAT}/energy_now"), num(f"{BAT}/power_now")
    if not energy or not power:
        return None
    mins = energy * 60 // power
    return f"{mins // 60} h {mins % 60:02d} min" if mins >= 60 else f"{mins} min"


def notify(cap):
    left = time_left()
    body = f"{cap}% left" + (f", about {left}" if left else "") + " - plug in the charger."
    try:
        out = subprocess.run(
            ["notify-send", "-p", "-u", "critical", "-a", "battery",
             "-i", "battery-caution", "Battery low", body],
            capture_output=True, text=True, timeout=10)
    except (OSError, subprocess.TimeoutExpired):
        return None
    nid = out.stdout.strip()
    return nid if out.returncode == 0 and nid.isdigit() else None


def dismiss(nid):
    try:
        subprocess.run(["makoctl", "dismiss", "-n", nid],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=10)
    except (OSError, subprocess.TimeoutExpired):
        pass


def main():
    mon = None
    try:
        mon = subprocess.Popen(["udevadm", "monitor", "--kernel", "--subsystem-match=power_supply"],
                               stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    except OSError:
        pass  # no udevadm: plain polling
    warned = None  # id of the notification on screen, or None when armed
    try:
        while True:
            cap = num(f"{BAT}/capacity")
            on_ac = read(f"{AC}/online") == "1"
            if on_ac:
                if warned:
                    dismiss(warned)
                    print("on AC: warning dismissed, re-armed", flush=True)
                warned = None
            elif cap is not None and cap <= LOW_PCT and not warned:
                warned = notify(cap)
                print(f"{cap}%: " + (f"warned (id {warned})" if warned else "notify failed, retrying"),
                      flush=True)
            if mon:
                ready, _, _ = select.select([mon.stdout], [], [], REFRESH)
                if ready and not os.read(mon.stdout.fileno(), 4096):
                    mon = None  # monitor died: keep polling
            else:
                select.select([], [], [], REFRESH)
    finally:
        if mon:
            mon.terminate()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
