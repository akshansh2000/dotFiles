#!/usr/bin/env python3
"""org.freedesktop.ScreenSaver for river, so Firefox stops dimming the screen.

Firefox asks the session bus for idle inhibition when it plays video. It tries
three names in order - org.freedesktop.ScreenSaver, org.freedesktop.Power-
Management, then the XDG portal - and on this machine all three fail: the first
two are unowned, and the portal refuses because the only installed backend
(gtk.portal) is marked `UseIn=gnome`. Firefox does bind the Wayland protocol
`zwp_idle_inhibit_manager_v1` at startup, but never calls create_inhibitor, so
river never learns anything is playing. Verified with dbus-monitor and
WAYLAND_DEBUG on 2026-09-18.

This owns the first of those names, which is the one Firefox tries first.

Why not one of the audio-based inhibitors (sway-audio-idle-inhibit,
wayland-pipewire-idle-inhibit): a MUTED video creates no PipeWire stream at all
(`pactl list sink-inputs` is empty), so they cannot see it. Firefox sends this
request for muted video too.

Inhibiting stops ~/.local/sv/swayidle, which is the 5/10/30 ladder ONLY. The
before-sleep lock lives in a second service, swayidle-sleep, which is never
paused - otherwise closing the lid during a video would suspend without
locking. Restarting the ladder also resets its clock, so the 5-minute timer
starts fresh once playback ends rather than firing immediately.
"""

import os
import subprocess
import sys

import gi

gi.require_version("Gio", "2.0")
from gi.repository import Gio, GLib  # noqa: E402

BUS_NAME = "org.freedesktop.ScreenSaver"

# Callers disagree about the path: Firefox uses /ScreenSaver, others use the
# fully qualified one. Export both; they share the same state.
OBJECT_PATHS = ("/ScreenSaver", "/org/freedesktop/ScreenSaver")

IFACE_XML = """
<node>
  <interface name='org.freedesktop.ScreenSaver'>
    <method name='Inhibit'>
      <arg type='s' name='application_name' direction='in'/>
      <arg type='s' name='reason_for_inhibit' direction='in'/>
      <arg type='u' name='cookie' direction='out'/>
    </method>
    <method name='UnInhibit'>
      <arg type='u' name='cookie' direction='in'/>
    </method>
    <method name='GetActive'>
      <arg type='b' name='active' direction='out'/>
    </method>
    <method name='SimulateUserActivity'/>
  </interface>
</node>
"""

HOME = os.path.expanduser("~")
LADDER_SV = os.path.join(HOME, ".local/sv/swayidle")
IDLE_SH = os.path.join(HOME, ".config/river/idle.sh")


def log(msg):
    print(msg, flush=True)


def run(*argv):
    try:
        subprocess.run(argv, check=False, timeout=10,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception as exc:  # a failing helper must never kill the service
        log(f"warning: {argv[0]} failed: {exc}")


class Inhibitor:
    def __init__(self):
        self.cookies = {}       # cookie -> (sender, app, reason)
        self.watches = {}       # sender -> NameOwnerChanged subscription id
        self.next_cookie = 1
        self.bus = None

    # --- the actual effect -------------------------------------------------
    def pause_ladder(self):
        log("inhibited: stopping the idle ladder")
        run("sv", "down", LADDER_SV)
        # If the screen had already dimmed or blanked before playback started,
        # stopping the ladder alone would leave it that way - the resume hooks
        # only fire on input.
        run(IDLE_SH, "on")
        run(IDLE_SH, "undim")

    def resume_ladder(self):
        log("released: restarting the idle ladder")
        run("sv", "up", LADDER_SV)

    # --- bookkeeping -------------------------------------------------------
    def add(self, sender, app, reason):
        cookie = self.next_cookie
        self.next_cookie += 1
        was_idle = not self.cookies
        self.cookies[cookie] = (sender, app, reason)
        log(f"inhibit #{cookie} from {app} ({reason}) [{sender}]")
        self.watch(sender)
        if was_idle:
            self.pause_ladder()
        return cookie

    def remove(self, cookie):
        entry = self.cookies.pop(cookie, None)
        if entry is None:
            log(f"uninhibit #{cookie}: unknown cookie, ignored")
            return
        log(f"uninhibit #{cookie} from {entry[1]}")
        self.prune_watch(entry[0])
        if not self.cookies:
            self.resume_ladder()

    def drop_sender(self, sender):
        """A caller vanished (crash, quit) - release everything it held."""
        stale = [c for c, e in self.cookies.items() if e[0] == sender]
        if not stale:
            return
        log(f"caller {sender} disappeared, releasing {len(stale)} inhibit(s)")
        for cookie in stale:
            self.cookies.pop(cookie, None)
        self.prune_watch(sender, force=True)
        if not self.cookies:
            self.resume_ladder()

    # --- crash safety ------------------------------------------------------
    def watch(self, sender):
        if sender in self.watches:
            return
        self.watches[sender] = self.bus.signal_subscribe(
            "org.freedesktop.DBus", "org.freedesktop.DBus",
            "NameOwnerChanged", "/org/freedesktop/DBus", sender,
            Gio.DBusSignalFlags.NONE, self.on_name_owner_changed, None)

    def prune_watch(self, sender, force=False):
        if not force and any(e[0] == sender for e in self.cookies.values()):
            return
        sub = self.watches.pop(sender, None)
        if sub is not None:
            self.bus.signal_unsubscribe(sub)

    def on_name_owner_changed(self, bus, sender, path, iface, signal, params, _=None):
        name, _old, new = params.unpack()
        if new == "":
            self.drop_sender(name)


INHIBITOR = Inhibitor()


def on_call(conn, sender, path, iface, method, params, invocation, _user=None):
    if method == "Inhibit":
        app, reason = params.unpack()
        cookie = INHIBITOR.add(sender, app, reason)
        invocation.return_value(GLib.Variant("(u)", (cookie,)))
    elif method == "UnInhibit":
        (cookie,) = params.unpack()
        INHIBITOR.remove(cookie)
        invocation.return_value(None)
    elif method == "GetActive":
        # "Is the screensaver showing" - never, from our side.
        invocation.return_value(GLib.Variant("(b)", (False,)))
    elif method == "SimulateUserActivity":
        invocation.return_value(None)
    else:
        invocation.return_error_literal(
            Gio.dbus_error_quark(), Gio.DBusError.UNKNOWN_METHOD, method)


def on_bus_acquired(conn, name, _user=None):
    INHIBITOR.bus = conn
    node = Gio.DBusNodeInfo.new_for_xml(IFACE_XML)
    for path in OBJECT_PATHS:
        # *_with_closures2, not register_object: the plain one is deprecated in
        # pygobject and logs a warning on every start.
        conn.register_object_with_closures2(path, node.interfaces[0], on_call, None, None)
    log(f"exported {name} on {', '.join(OBJECT_PATHS)}")


def on_name_lost(_conn, name, _user=None):
    # Losing the name means something else took it, or the bus went away.
    # Exiting lets runit restart us rather than sitting here doing nothing.
    log(f"lost {name}, exiting")
    sys.exit(1)


def main():
    Gio.bus_own_name(Gio.BusType.SESSION, BUS_NAME,
                     Gio.BusNameOwnerFlags.NONE,
                     on_bus_acquired, None, on_name_lost)
    GLib.MainLoop().run()


if __name__ == "__main__":
    main()
