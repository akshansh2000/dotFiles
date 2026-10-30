#!/usr/bin/env python3
"""waybar custom/battery - icon-only battery (2026-10-09).

Prints one JSON line per change ({text, tooltip, class}); waybar reads them
continuously (no "interval" in config.jsonc). Wakes on kernel power_supply
events (`udevadm monitor`, so plug/unplug recolours instantly) and every 30 s
for the slowly changing level.

Icon: Font Awesome's horizontal battery, 5 steps (U+F244 empty .. U+F240 full).
Built from codepoints with chr() on purpose - BMP Private-Use glyphs don't
survive being typed into files by an agent (see AGENTS.md).

Classes (colours live in style.css.tmpl):
  charging  - status Charging                         -> yellow
  full      - AC online and Full / Not charging        -> green
              ("Not charging" = held at the charge limit)
  low       - not charging and at or below LOW_PCT     -> red
  (none)    - everything else                          -> bar text colour
Charging wins over low: a low battery that is charging shows yellow.
"""
import ctypes, json, os, select, signal, subprocess, sys

BAT = "/sys/class/power_supply/BAT0"
AC = "/sys/class/power_supply/AC0"
LOW_PCT = 25  # = river/battery-notify.py's warning level (2026-10-30)
REFRESH = 30  # seconds
ICONS = [chr(c) for c in (0xF244, 0xF243, 0xF242, 0xF241, 0xF240)]


def read(path, default=None):
    try:
        with open(path) as f:
            return f.read().strip()
    except OSError:
        return default


def num(path):
    v = read(path)
    return int(v) if v and v.lstrip("-").isdigit() else None


def hm(hours):
    h, m = int(hours), int(round((hours - int(hours)) * 60))
    if m == 60:
        h, m = h + 1, 0
    return f"{h} h {m:02d} min" if h else f"{m} min"


def state():
    cap = num(f"{BAT}/capacity") or 0
    status = read(f"{BAT}/status", "Unknown")
    ac = read(f"{AC}/online") == "1"
    e_now, e_full, e_design = (num(f"{BAT}/{k}") for k in ("energy_now", "energy_full", "energy_full_design"))
    power = num(f"{BAT}/power_now")
    limit = num(f"{BAT}/charge_control_end_threshold")

    icon = ICONS[0 if cap <= 12 else 1 if cap <= 37 else 2 if cap <= 62 else 3 if cap <= 87 else 4]

    # "Full" on AC also covers a stale status: ASUS firmware kept reporting
    # Discharging at 100% for 2-3 min after the charge LED showed full
    # (2026-10-09), so plugged in at (or within 1% of) the limit counts as full.
    top = limit if limit else 100
    if status == "Charging":
        cls = "charging"
    elif ac and (status in ("Full", "Not charging") or cap >= top - 1):
        cls = "full"
    elif cap <= LOW_PCT:
        cls = "low"
    else:
        cls = ""

    if cls == "full":
        # "held" only means something when the limit is actually below 100.
        words = (f"Plugged in, held at the {limit}% charge limit"
                 if limit and limit < 100 else "Plugged in, full")
    else:
        words = {"Not charging": "Plugged in, not charging"}.get(status, status)
    lines = [f"Battery {cap}%", words]
    if cls != "full" and power and power > 0 and e_now is not None:
        if status == "Discharging":
            lines[1] += f" · {hm(e_now / power)} left"
        elif status == "Charging" and e_full:
            # Charging stops at the limit, not at 100%: estimate to there.
            stop = min(limit or 100, 100)
            eta = hm(max(e_full * stop / 100 - e_now, 0) / power)
            lines[1] += f" · full in {eta}" if stop >= 100 else f" · {stop}% in {eta}"
    if e_full and e_design:
        lines.append(f"Health: {round(100 * e_full / e_design)}% "
                     f"({e_full / 1e6:.1f} of {e_design / 1e6:.1f} Wh)")
    if limit is not None:
        lines.append(f"Limit: {limit}%")
    return {"text": icon, "tooltip": "\n".join(lines), "class": cls}


def main():
    # Die with waybar: on a restart it kills only the `sh -c` it spawned, which
    # used to orphan its children (seen with river-state, 2026-09-29).
    ctypes.CDLL(None, use_errno=True).prctl(1, signal.SIGTERM)  # PR_SET_PDEATHSIG
    mon = None
    try:
        mon = subprocess.Popen(["udevadm", "monitor", "--kernel", "--subsystem-match=power_supply"],
                               stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    except OSError:
        pass  # no udevadm: fall back to plain polling
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    last = None
    try:
        while True:
            cur = json.dumps(state(), ensure_ascii=False)
            if cur != last:
                print(cur, flush=True)
                last = cur
            if mon:
                ready, _, _ = select.select([mon.stdout], [], [], REFRESH)
                if ready:
                    if not os.read(mon.stdout.fileno(), 4096):
                        mon = None  # monitor died: keep polling
            else:
                select.select([], [], [], REFRESH)
    finally:
        if mon:
            mon.terminate()


if __name__ == "__main__":
    main()
