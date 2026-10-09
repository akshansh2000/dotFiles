#!/usr/bin/env python3
"""waybar custom/volume - icon-only volume (2026-10-09).

Replaces waybar's built-in pulseaudio module so the tooltip can show the
bluetooth codec (api.bluez5.codec on the sink), which the built-in module's
tooltip fields can't reach - and on its own line, not baked into the device
name (the user's call; a WirePlumber description rewrite would have put the
codec into the name everywhere).

Prints one JSON line per change. Wakes on `pactl subscribe` events for sinks,
cards (codec/profile switches) and the server (default output changes) - not
sink-inputs, which are per-app streams and only noise here.

Icon: an empty circle (U+F0766) for ~0%, then a pie that fills in 8 steps
(U+F0A9E..U+F0AA5): 9 icons over 0-100%. Muted = the empty circle, class
"muted" (red in style.css.tmpl). Glyphs are built with chr() - BMP Private-Use
glyphs don't survive being typed into files by an agent (see AGENTS.md); these
are supplementary-plane, but the rule is kept uniformly.

Tooltip (plain, order chosen by the user): Volume / device / Codec (bluetooth
only).
"""
import ctypes, json, os, select, signal, subprocess, sys

EMPTY = chr(0xF0766)
ICONS = [EMPTY] + [chr(c) for c in range(0xF0A9E, 0xF0AA6)]
CODECS = {"sbc": "SBC", "sbc_xq": "SBC-XQ", "aac": "AAC", "msbc": "mSBC",
          "cvsd": "CVSD", "ldac": "LDAC", "aptx": "aptX", "aptx_hd": "aptX HD",
          "aptx_ll": "aptX LL", "lc3": "LC3", "faststream": "FastStream"}


def pactl_json(*args):
    try:
        out = subprocess.run(["pactl", "--format=json", *args], capture_output=True,
                             text=True, timeout=3).stdout
        return json.loads(out) if out.strip() else None
    except (OSError, ValueError, subprocess.TimeoutExpired):
        return None


def state():
    try:
        default = subprocess.run(["pactl", "get-default-sink"], capture_output=True,
                                 text=True, timeout=3).stdout.strip()
    except (OSError, subprocess.TimeoutExpired):
        default = ""
    sink = next((s for s in (pactl_json("list", "sinks") or []) if s.get("name") == default), None)
    if not sink:
        return {"text": EMPTY, "tooltip": "No output device", "class": "muted"}

    vols = [int(str(ch.get("value_percent", "0")).rstrip("%") or 0)
            for ch in (sink.get("volume") or {}).values()]
    vol = round(sum(vols) / len(vols)) if vols else 0
    muted = bool(sink.get("mute"))
    props = sink.get("properties") or {}

    lines = [f"Volume: {vol}%" + (" (muted)" if muted else ""),
             sink.get("description") or default]
    codec = props.get("api.bluez5.codec")
    if codec:
        lines.append(f"Codec: {CODECS.get(codec, codec.upper())}")

    icon = EMPTY if muted else ICONS[max(0, min(8, round(vol / 100 * 8)))]
    return {"text": icon, "tooltip": "\n".join(lines), "class": "muted" if muted else ""}


def main():
    # Die with waybar (see battery-status.py / river-state for why).
    ctypes.CDLL(None, use_errno=True).prctl(1, signal.SIGTERM)  # PR_SET_PDEATHSIG
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    sub = subprocess.Popen(["pactl", "subscribe"], stdout=subprocess.PIPE,
                           stderr=subprocess.DEVNULL, text=True, bufsize=1)
    last = None
    try:
        while True:
            cur = json.dumps(state(), ensure_ascii=False)
            if cur != last:
                print(cur, flush=True)
                last = cur
            # Block until an interesting event, then drain the burst that a
            # single change produces before recomputing once.
            relevant = False
            while not relevant:
                line = sub.stdout.readline()
                if not line:
                    return  # pactl subscribe died; waybar's restart-interval brings us back
                relevant = any(k in line for k in (" on sink #", " on card #", " on server"))
            while select.select([sub.stdout], [], [], 0.05)[0]:
                if not sub.stdout.readline():
                    break
    finally:
        sub.terminate()


if __name__ == "__main__":
    main()
