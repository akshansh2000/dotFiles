#!/usr/bin/env python3
"""waybar custom/mic - microphone state, between volume and battery (2026-11-25).

Always shown while there is a default source. The mic is normally kept muted,
so the muted state is the quiet one: microphone-off (U+F036D) in the bar's
plain text colour. A LIVE mic is what should catch the eye: microphone
(U+F036C), class "live", red in style.css.tmpl. (First version, same day:
red mic-off shown only while muted, hidden otherwise - too loud for a mic
that is muted nearly all the time.) No default source at all -> empty text,
which hides the module. Left-click toggles the mute, right-click opens
pwvucontrol - see config.jsonc.

Built like volume-status.py: one JSON line per change, woken by `pactl
subscribe` events for sources (mute/volume) and the server (default source
changes), so no polling. The icons are the same MDI pair as the Quickshell
OSD, built with chr() per AGENTS.md.
"""
import ctypes, json, select, signal, subprocess, sys

MIC_OFF = chr(0xF036D)
MIC_ON = chr(0xF036C)
HIDDEN = {"text": "", "tooltip": "", "class": ""}


def state():
    try:
        default = subprocess.run(["pactl", "get-default-source"], capture_output=True,
                                 text=True, timeout=3).stdout.strip()
        out = subprocess.run(["pactl", "--format=json", "list", "sources"],
                             capture_output=True, text=True, timeout=3).stdout
        sources = json.loads(out) if out.strip() else []
    except (OSError, ValueError, subprocess.TimeoutExpired):
        return HIDDEN
    src = next((s for s in sources if s.get("name") == default), None)
    if not src:
        return HIDDEN
    name = src.get("description") or default
    if src.get("mute"):
        return {"text": MIC_OFF, "tooltip": f"Microphone muted\n{name}", "class": "muted"}
    return {"text": MIC_ON, "tooltip": f"Microphone on\n{name}", "class": "live"}


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
                relevant = any(k in line for k in (" on source #", " on server"))
            while select.select([sub.stdout], [], [], 0.05)[0]:
                if not sub.stdout.readline():
                    break
    finally:
        sub.terminate()


if __name__ == "__main__":
    main()
