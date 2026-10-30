#!/usr/bin/env python3
"""Print "fullscreen" if the focused window is fullscreen, else "normal"
(2026-10-30). Used by focus-view.sh for Super+J/K.

river's own status protocol doesn't report fullscreen, but river implements
wlr-foreign-toplevel-management, whose toplevel handles carry state arrays
(2 = activated, i.e. focused; 3 = fullscreen). This speaks that protocol
directly over the Wayland socket - a few dozen lines instead of a new package
(lswt would do the same) - and takes ~16 ms, cheap enough to run on every
Super+J/K. Two roundtrips: one to bind the manager, one to receive every
toplevel and its state.
"""
import os, socket, struct

MANAGER = "zwlr_foreign_toplevel_manager_v1"
ACTIVATED, FULLSCREEN = 2, 3


def msg(obj, op, payload=b""):
    return struct.pack("<IHH", obj, op, 8 + len(payload)) + payload


def wl_string(text):
    b = text.encode() + b"\0"
    return struct.pack("<I", len(b)) + b + b"\0" * (-len(b) % 4)


def main():
    s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    s.connect(os.path.join(os.environ["XDG_RUNTIME_DIR"], os.environ.get("WAYLAND_DISPLAY", "wayland-1")))
    # wl_display(1).get_registry -> 2, then sync -> callback 3
    s.sendall(msg(1, 1, struct.pack("<I", 2)) + msg(1, 0, struct.pack("<I", 3)))
    buf, manager, states, synced = b"", None, {}, 0
    while synced < 2:
        data = s.recv(65536)
        if not data:
            break
        buf += data
        while len(buf) >= 8:
            obj, word = struct.unpack("<II", buf[:8])
            op, size = word & 0xFFFF, word >> 16
            if len(buf) < size:
                break
            body, buf = buf[8:size], buf[size:]
            if obj == 2 and op == 0:  # wl_registry.global(name, interface, version)
                name, ln = struct.unpack("<II", body[:8])
                if body[8:8 + ln - 1].decode() == MANAGER:
                    # wl_registry.bind(name, interface, version 3, new id 4)
                    s.sendall(msg(2, 0, struct.pack("<I", name) + wl_string(MANAGER) + struct.pack("<II", 3, 4)))
                    manager = 4
            elif obj == 3:  # callback done: sync once more for the toplevels
                synced += 1
                if synced == 1:
                    s.sendall(msg(1, 0, struct.pack("<I", 3)))
            elif obj == manager and op == 0:  # manager.toplevel(new handle)
                states[struct.unpack("<I", body[:4])[0]] = set()
            elif obj in states and op == 4:  # handle.state(array of u32)
                n = struct.unpack("<I", body[:4])[0]
                states[obj] = set(struct.unpack(f"<{n // 4}I", body[4:4 + n]))
    print("fullscreen" if any({ACTIVATED, FULLSCREEN} <= st for st in states.values()) else "normal")


if __name__ == "__main__":
    main()
