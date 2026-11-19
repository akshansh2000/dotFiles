#!/usr/bin/env python3
"""Low-battery warning (2026-10-30; two steps + live updates 2026-11-19).
Run by the runit user service ~/.local/sv/battery-notify.

Two steps per discharge: "Battery low" at LOW_PCT or less, "Battery critical"
at CRITICAL_PCT or less. Both are CRITICAL notifications: they stay until
dismissed (mako's critical timeout is 0) and draw on mako's overlay layer,
i.e. above fullscreen windows - the normal top layer is hidden under them.

While a warning is on screen it is updated IN PLACE (notify-send -r) with
the current level and time left, and turns from low into critical at
CRITICAL_PCT rather than stacking a second card. Dismissing it by hand stops
the updates; only the next step not yet shown brings a new one. So: 20% ->
low card, kept current; dismissed -> silence until 7% -> critical card, kept
current; dismissed -> silence. Plugging in closes whatever is showing and
re-arms both steps for the next discharge.

"Dismissed by hand" = our id is gone from `makoctl list -j`. Two blind
spots, both accepted: dismissing in the instant between that check and an
update brings the card back once; a mako restart counts as a dismissal.

Wakes on kernel power_supply events (`udevadm monitor`, so plugging in clears
the warning at once) and every REFRESH seconds for the level itself - 30 s,
like the waybar module. (It was 15 s and 25% while the old battery could drop
fast; the battery was replaced, so 20% and 30 s since 2026-11-19.) LOW_PCT
matches waybar's red battery icon (battery-status.py).

"Discharging" is taken from AC0/online, not BAT0/status: on AC at the charge
limit the status reads "Not charging", which must not warn.

If the notification can't be sent (mako not up yet at login), the warning
stays armed and is retried on the next wake-up.

BAT/AC/REFRESH can be overridden with BATTERY_NOTIFY_BAT / _AC / _REFRESH,
for testing against a fake sysfs directory.
"""
import json, os, select, subprocess, sys

BAT = os.environ.get("BATTERY_NOTIFY_BAT", "/sys/class/power_supply/BAT0")
AC = os.environ.get("BATTERY_NOTIFY_AC", "/sys/class/power_supply/AC0")
LOW_PCT = 20
CRITICAL_PCT = 7
REFRESH = float(os.environ.get("BATTERY_NOTIFY_REFRESH", 30))  # seconds

# step -> (summary, icon); step 0 = nothing to show
STEPS = {1: ("Battery low", "battery-caution"),
         2: ("Battery critical", "battery-empty")}


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


def step_for(cap):
    return 2 if cap <= CRITICAL_PCT else 1 if cap <= LOW_PCT else 0


def message(cap, step):
    summary, icon = STEPS[step]
    left = time_left()
    body = f"{cap}% left" + (f", about {left}" if left else "") + " - plug in the charger."
    return summary, icon, body


def notify(msg, replace=None):
    """Show msg, or update notification `replace` in place. Returns the id."""
    summary, icon, body = msg
    cmd = ["notify-send", "-p", "-u", "critical", "-a", "battery", "-i", icon]
    if replace:
        cmd += ["-r", replace]
    try:
        out = subprocess.run(cmd + [summary, body], capture_output=True, text=True, timeout=10)
    except (OSError, subprocess.TimeoutExpired):
        return None
    nid = out.stdout.strip()
    return nid if out.returncode == 0 and nid.isdigit() else None


def on_screen(nid):
    """True/False whether mako still shows nid; None if mako can't be asked."""
    try:
        out = subprocess.run(["makoctl", "list", "-j"], capture_output=True, text=True, timeout=10)
        if out.returncode != 0:
            return None
        return nid in {str(n.get("id")) for n in json.loads(out.stdout)}
    except (OSError, subprocess.TimeoutExpired, ValueError, AttributeError):
        return None


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
    nid = None   # id of our notification on screen, or None
    text = None  # what it currently says, to skip no-op updates
    shown = 0    # highest step shown this discharge (0 = none yet)
    try:
        while True:
            cap = num(f"{BAT}/capacity")
            on_ac = read(f"{AC}/online") == "1"
            if on_ac:
                if nid:
                    dismiss(nid)
                if shown:
                    print("on AC: warning closed, re-armed", flush=True)
                nid, text, shown = None, None, 0
            elif cap is not None:
                if nid and on_screen(nid) is False:
                    print(f"{cap}%: id {nid} dismissed by hand", flush=True)
                    nid, text = None, None
                step = step_for(cap)
                if nid:
                    # Never step back down (capacity can tick up a point).
                    step = max(step, shown)
                    msg = message(cap, step)
                    if msg != text:
                        new = notify(msg, replace=nid)
                        if new:
                            if step > shown:
                                print(f"{cap}%: id {new} updated to {STEPS[step][0]}", flush=True)
                            nid, text, shown = new, msg, step
                elif step > shown:
                    msg = message(cap, step)
                    nid = notify(msg)
                    if nid:
                        text, shown = msg, step
                        print(f"{cap}%: {STEPS[step][0]} (id {nid})", flush=True)
                    else:
                        print(f"{cap}%: notify failed, retrying", flush=True)
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
