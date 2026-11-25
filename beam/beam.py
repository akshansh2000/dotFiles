#!/usr/bin/env python3
"""beam - play a movie file or URL on a DLNA renderer (the Beem projector).

    beam FILE|URL          play it; stays in the foreground showing progress.
                           Keys while it runs: space pause/resume,
                           left/right -/+10 s, down/up -/+1 min, q or Ctrl-C stop
    beam pause | resume | stop | status
    beam seek 1:23:00      absolute;  beam seek +30 / -10  relative (seconds)
    beam devices           list the DLNA renderers on the network
    beam use NAME|IP       pick which one to beam to (remembered)

Written 2026-11-25; named beam, not cast, because Foundry's `cast` comes
first in PATH. Why DLNA and not screen casting: the projector ("Beem 440",
Android-ish Linux) speaks AirPlay and DLNA but is not a Google Cast receiver,
and real Miracast needs NetworkManager + wpa_supplicant, which clashes with
the iwd-only network setup. Pushing the file over DLNA plays it with the
projector's own player - full quality, nothing to encode, laptop can sleep
the screen. Movies are picked as MKVs with built-in subtitles.

How it works, stdlib only:
  * discovery: SSDP M-SEARCH for a MediaRenderer, then its device description
    for the AVTransport control URL. The renderer (a Java "Cling" stack) picks
    its HTTP port itself, so it is rediscovered rather than hardcoded. The
    network has more than one renderer (the LG webOS TV answers too), so the
    choice is explicit: `beam use beem` saves it in ~/.cache/beam/device.json
    (which also makes the control commands instant); BEAM_DEVICE=<name part
    or IP> overrides it for one run. With several renderers and no choice
    saved, beam lists them rather than guess.
  * a local FILE is served by a small HTTP server bound to the LAN address
    that routes to the renderer, for that one file only, under a random path.
    It answers Range requests (206) - without them the projector could not
    seek or skip in a 2-hour file - and sends the DLNA "byte seek supported"
    header. It lives exactly as long as the `beam FILE` command does.
  * a URL is handed to the renderer as is (it must be one the projector can
    fetch itself - a direct media URL, not a web page).
  * SOAP actions SetAVTransportURI / Play / Pause / Stop / Seek /
    GetTransportInfo / GetPositionInfo. RenderingControl's volume/mute are
    deliberately unused: the projector reports Volume 0 / Mute 1 while
    playing sound fine, so they mean nothing here.

The foreground `beam FILE` exits by itself when playback ends or is stopped
(from the remote, or `beam stop` elsewhere), or when something else is cast to it.
"""
import html, json, mimetypes, os, re, secrets, select, signal, socket, sys, termios, threading, time, tty
import urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

CACHE = os.path.join(os.environ.get("XDG_CACHE_HOME", os.path.expanduser("~/.cache")),
                     "beam", "device.json")
AVT = "urn:schemas-upnp-org:service:AVTransport:1"
RENDERER = "urn:schemas-upnp-org:device:MediaRenderer:1"
UPNP_NS = {"d": "urn:schemas-upnp-org:device-1-0"}
POLL = 2  # seconds between status polls while playing
# Seek keys while playing (escape sequences in cbreak mode) -> seconds.
# 10 s rather than mpv's 5: each seek makes the projector re-buffer.
SEEK_KEYS = {"\x1b[D": -10, "\x1b[C": 10, "\x1b[B": -60, "\x1b[A": 60}
SEEK_SETTLE = 0.4  # presses closer together than this add up into one Seek

# MKV is not in Python's mimetypes table; these are the types the projector
# lists in its ConnectionManager protocol info.
MIME = {".mkv": "video/x-matroska", ".mp4": "video/mp4", ".m4v": "video/mp4",
        ".avi": "video/avi", ".mov": "video/quicktime", ".webm": "video/webm",
        ".ts": "video/mpeg", ".mpg": "video/mpeg", ".wmv": "video/x-ms-wmv"}
# OP=01: byte seeking supported; FLAGS: streaming transfer mode.
DLNA_FEATURES = "DLNA.ORG_OP=01;DLNA.ORG_CI=0;DLNA.ORG_FLAGS=01700000000000000000000000000000"


def die(msg):
    print(f"beam: {msg}", file=sys.stderr)
    sys.exit(1)


# ---------- discovery ----------

def ssdp_locations(timeout=2.5):
    msg = ("M-SEARCH * HTTP/1.1\r\nHOST: 239.255.255.250:1900\r\n"
           'MAN: "ssdp:discover"\r\nMX: 2\r\n'
           f"ST: {RENDERER}\r\n\r\n").encode()
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 2)
    s.settimeout(0.3)
    found = []
    try:
        s.sendto(msg, ("239.255.255.250", 1900))
        end = time.time() + timeout
        while time.time() < end:
            try:
                data, _ = s.recvfrom(4096)
            except socket.timeout:
                continue
            m = re.search(rb"^location:\s*(\S+)", data, re.I | re.M)
            if m and m.group(1).decode() not in found:
                found.append(m.group(1).decode())
    finally:
        s.close()
    return found


def describe(location):
    """Device description -> {name, location, avt} or None."""
    try:
        with urllib.request.urlopen(location, timeout=4) as r:
            root = ET.fromstring(r.read())
    except Exception:
        return None
    for dev in root.iter("{%s}device" % UPNP_NS["d"]):
        name = dev.findtext("d:friendlyName", "", UPNP_NS)
        for svc in dev.iterfind("d:serviceList/d:service", UPNP_NS):
            if svc.findtext("d:serviceType", "", UPNP_NS) == AVT:
                ctl = svc.findtext("d:controlURL", "", UPNP_NS)
                return {"name": name, "location": location,
                        "avt": urllib.parse.urljoin(location, ctl)}
    return None


def discover(want=""):
    devs = [d for d in map(describe, ssdp_locations()) if d]
    want = want.lower()
    if want:
        devs = [d for d in devs if want in d["name"].lower() or
                want == urllib.parse.urlparse(d["location"]).hostname]
    return devs


def save(dev):
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    with open(CACHE, "w") as f:
        json.dump(dev, f)


def load():
    try:
        with open(CACHE) as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def device():
    """The renderer to use: BEAM_DEVICE, else the saved choice (rediscovered
    if its address or port changed), else the only one on the network."""
    want = os.environ.get("BEAM_DEVICE", "")
    saved = load()
    if not want and saved and describe(saved.get("location", "")):
        return saved
    devs = discover(want or (saved or {}).get("name", ""))
    if len(devs) == 1:
        if not want:
            save(devs[0])
        return devs[0]
    if not devs:
        die(f"no DLNA renderer {'matching ' + repr(want or saved['name']) + ' ' if want or saved else ''}"
            "found (off, or on another network?)")
    die("several renderers - pick one with `beam use NAME`:\n  " +
        "\n  ".join(d["name"] for d in devs))


# ---------- SOAP ----------

def soap(dev, action, args=""):
    body = ('<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" '
            's:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body>'
            f'<u:{action} xmlns:u="{AVT}"><InstanceID>0</InstanceID>{args}</u:{action}>'
            "</s:Body></s:Envelope>").encode()
    req = urllib.request.Request(dev["avt"], data=body, headers={
        "Content-Type": 'text/xml; charset="utf-8"', "SOAPACTION": f'"{AVT}#{action}"'})
    try:
        with urllib.request.urlopen(req, timeout=6) as r:
            root = ET.fromstring(r.read())
    except urllib.error.HTTPError as e:
        detail = re.search(rb"<errorDescription>([^<]*)", e.read() or b"")
        die(f"{action} refused by {dev['name']}: "
            f"{detail.group(1).decode() if detail else e}")
    except Exception as e:
        die(f"{action}: cannot reach {dev['name']} ({e})")
    # Flatten the response's out-arguments into a dict.
    return {el.tag.split("}")[-1]: (el.text or "") for el in root.iter() if len(el) == 0}


def state(dev):
    t = soap(dev, "GetTransportInfo")
    p = soap(dev, "GetPositionInfo")
    return t.get("CurrentTransportState", "?"), p.get("RelTime", ""), \
        p.get("TrackDuration", ""), p.get("TrackURI", "")


def hms(secs):
    secs = max(0, int(secs))
    return f"{secs // 3600}:{secs // 60 % 60:02d}:{secs % 60:02d}"


def secs(t):
    """'1:02:03' / '62:03' / '3723' -> seconds; None if not a time."""
    try:
        parts = [float(x) for x in t.split(":")]
    except ValueError:
        return None
    total = 0.0
    for x in parts:
        total = total * 60 + x
    return total


# ---------- file server ----------

def lan_ip_towards(host):
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect((host, 9))  # no packet sent; just picks the route
        return s.getsockname()[0]
    finally:
        s.close()


def serve(path, bind_ip):
    """Serve one file; returns (server, url)."""
    size = os.path.getsize(path)
    ext = os.path.splitext(path)[1].lower()
    mime = MIME.get(ext) or mimetypes.guess_type(path)[0] or "application/octet-stream"
    route = f"/{secrets.token_urlsafe(9)}/{urllib.parse.quote(os.path.basename(path))}"

    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def log_message(self, *a):
            pass

        def _head(self):
            if self.path != route:
                self.send_error(404)
                return None
            start, end = 0, size - 1
            rng = re.fullmatch(r"bytes=(\d*)-(\d*)", self.headers.get("Range", "").strip())
            if rng and (rng.group(1) or rng.group(2)):
                if rng.group(1):
                    start = int(rng.group(1))
                    if rng.group(2):
                        end = min(int(rng.group(2)), size - 1)
                else:  # suffix range: last N bytes
                    start = max(0, size - int(rng.group(2)))
                if start > end:
                    self.send_response(416)
                    self.send_header("Content-Range", f"bytes */{size}")
                    self.send_header("Content-Length", "0")
                    self.end_headers()
                    return None
                self.send_response(206)
                self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            else:
                self.send_response(200)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(end - start + 1))
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("transferMode.dlna.org", "Streaming")
            self.send_header("contentFeatures.dlna.org", DLNA_FEATURES)
            self.end_headers()
            return start, end

        def do_HEAD(self):
            self._head()

        def do_GET(self):
            span = self._head()
            if not span:
                return
            start, end = span
            try:
                with open(path, "rb") as f:
                    f.seek(start)
                    left = end - start + 1
                    while left > 0:
                        chunk = f.read(min(1 << 20, left))
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                        left -= len(chunk)
            except (BrokenPipeError, ConnectionResetError):
                pass  # the player drops connections whenever it seeks

    srv = ThreadingHTTPServer((bind_ip, 0), Handler)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://{bind_ip}:{srv.server_port}{urllib.parse.quote(route, safe='/%')}", mime


# ---------- keys ----------

class Keys:
    """Single keypresses from the terminal while playing: cbreak mode (no
    Enter needed, no echo; Ctrl-C still raises SIGINT). Inert without a tty,
    e.g. when piped or run from a script."""

    def __init__(self):
        self.fd = None
        if sys.stdin.isatty() and sys.stdout.isatty():
            self.fd = sys.stdin.fileno()
            self.saved = termios.tcgetattr(self.fd)
            tty.setcbreak(self.fd)

    def restore(self):
        if self.fd is not None:
            termios.tcsetattr(self.fd, termios.TCSADRAIN, self.saved)
            self.fd = None

    def read(self, timeout):
        """Keys pressed within timeout: escape sequences kept whole."""
        if self.fd is None:
            time.sleep(timeout)
            return []
        if not select.select([self.fd], [], [], timeout)[0]:
            return []
        data, keys = os.read(self.fd, 64).decode(errors="ignore"), []
        while data:
            n = 3 if data.startswith("\x1b[") else 1
            keys.append(data[:n])
            data = data[n:]
        return keys


# ---------- commands ----------

def didl(title, url, mime):
    e = html.escape
    return ('<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/" '
            'xmlns:dc="http://purl.org/dc/elements/1.1/" '
            'xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">'
            '<item id="1" parentID="0" restricted="1">'
            f"<dc:title>{e(title)}</dc:title>"
            "<upnp:class>object.item.videoItem</upnp:class>"
            f'<res protocolInfo="http-get:*:{e(mime)}:{DLNA_FEATURES}">{e(url)}</res>'
            "</item></DIDL-Lite>")


def play(target):
    dev = device()
    srv = None
    if re.match(r"https?://", target):
        url, title = target, urllib.parse.unquote(os.path.basename(urllib.parse.urlparse(target).path)) or target
        mime = MIME.get(os.path.splitext(title)[1].lower(), "video/mp4")
    else:
        path = os.path.abspath(target)
        if not os.path.isfile(path):
            die(f"no such file: {target}")
        host = urllib.parse.urlparse(dev["location"]).hostname
        srv, url, mime = serve(path, lan_ip_towards(host))
        title = os.path.splitext(os.path.basename(path))[0]

    def finish(*_):
        if sys.stdout.isatty():
            print()
        try:
            cur = state(dev)
            if cur[3] == url and cur[0] not in ("STOPPED", "NO_MEDIA_PRESENT"):
                soap(dev, "Stop")
                print("stopped")
        except SystemExit:
            pass
        if srv:
            srv.shutdown()
        sys.exit(0)

    signal.signal(signal.SIGINT, finish)
    signal.signal(signal.SIGTERM, finish)

    soap(dev, "SetAVTransportURI",
         f"<CurrentURI>{html.escape(url)}</CurrentURI>"
         f"<CurrentURIMetaData>{html.escape(didl(title, url, mime))}</CurrentURIMetaData>")
    soap(dev, "Play", "<Speed>1</Speed>")
    keys = Keys()
    tty_out = keys.fd is not None
    hint = "  [space pause, \u2190/\u2192 10s, \u2193/\u2191 1m, q stop]" if tty_out else "  (Ctrl-C stops)"
    print(f"casting {title} -> {dev['name']}{hint}")

    def draw(text):
        if tty_out:
            print(f"\r{text}\x1b[K", end="", flush=True)

    started, t0 = False, time.time()
    st, pos, dur = "TRANSITIONING", "", ""
    pending, base, last_press, next_poll = 0, 0.0, 0.0, time.time() + POLL
    try:
        while True:
            now = time.time()
            if now >= next_poll:
                next_poll = now + POLL
                st, pos, dur, uri = state(dev)
                if uri and uri != url and started:
                    print("\nsomething else is playing now - done")
                    break
                if st in ("PLAYING", "PAUSED_PLAYBACK", "TRANSITIONING"):
                    started = True
                    if not pending:
                        label = {"PLAYING": "playing", "PAUSED_PLAYBACK": "paused",
                                 "TRANSITIONING": "loading"}[st]
                        draw(f"{label:8} {pos} / {dur}")
                elif started:  # STOPPED / NO_MEDIA_PRESENT after playing
                    print("\nfinished" if st == "STOPPED" else f"\n{st.lower()}")
                    break
                elif now - t0 > 30:
                    print(f"\nnever started (renderer says {st}) - format not supported?")
                    break
            for k in keys.read(0.1):
                if k == "q":
                    finish()
                elif k == " " and st in ("PLAYING", "PAUSED_PLAYBACK"):
                    pausing = st == "PLAYING"
                    soap(dev, "Pause" if pausing else "Play", "" if pausing else "<Speed>1</Speed>")
                    st = "PAUSED_PLAYBACK" if pausing else "PLAYING"
                    draw(f"{'paused' if pausing else 'playing':8} {pos} / {dur}")
                    next_poll = time.time() + 1
                elif k in SEEK_KEYS and started:
                    if not pending:  # fresh position as the base for this burst
                        st, pos, dur, _ = state(dev)
                        base = secs(pos) or 0
                    pending += SEEK_KEYS[k]
                    last_press = time.time()
                    draw(f"seek  -> {hms(clamp(base + pending, dur))} / {dur}")
            if pending and time.time() - last_press > SEEK_SETTLE:
                soap(dev, "Seek", f"<Unit>REL_TIME</Unit><Target>{hms(clamp(base + pending, dur))}</Target>")
                pending = 0
                next_poll = time.time() + 1
    finally:
        keys.restore()
    if srv:
        srv.shutdown()


def clamp(target, dur):
    """Keep a seek target inside the track (dur as reported, may be empty)."""
    end = secs(dur) if dur else None
    return max(0, min(target, end - 1) if end else target)


def seek(arg):
    dev = device()
    if arg[:1] in "+-":
        delta = secs(arg[1:])
        if delta is None:
            die(f"bad time: {arg}")
        _, pos, dur, _ = state(dev)
        target = clamp((secs(pos) or 0) + (delta if arg[0] == "+" else -delta), dur)
    else:
        target = secs(arg)
        if target is None:
            die(f"bad time: {arg}")
    soap(dev, "Seek", f"<Unit>REL_TIME</Unit><Target>{hms(target)}</Target>")
    print(f"-> {hms(target)}")


def main(argv):
    if not argv or argv[0] in ("-h", "--help", "help"):
        print(__doc__.split("\n\n")[0] + "\n" + __doc__.split("\n\n")[1])
        return
    cmd, rest = argv[0], argv[1:]
    if cmd == "devices":
        for d in discover():
            print(f"{d['name']}\t{urllib.parse.urlparse(d['location']).hostname}")
    elif cmd == "use":
        if len(rest) != 1:
            die("usage: beam use NAME|IP")
        devs = discover(rest[0])
        if len(devs) != 1:
            die(f"{len(devs)} renderers match {rest[0]!r}" +
                "".join(f"\n  {d['name']}" for d in devs))
        save(devs[0])
        print(f"casting to {devs[0]['name']} from now on")
    elif cmd in ("pause", "resume", "stop"):
        dev = device()
        soap(dev, {"pause": "Pause", "resume": "Play", "stop": "Stop"}[cmd],
             "<Speed>1</Speed>" if cmd == "resume" else "")
    elif cmd == "status":
        dev = device()
        st, pos, dur, uri = state(dev)
        print(f"{dev['name']}: {st.lower()} {pos} / {dur}".rstrip(" /"))
        if uri:
            print(urllib.parse.unquote(uri))
    elif cmd == "seek":
        if len(rest) != 1:
            die("usage: beam seek 1:23:00 | +30 | -10")
        seek(rest[0])
    elif len(argv) == 1:
        play(cmd)
    else:
        die("usage: beam FILE|URL | pause | resume | stop | status | seek T | devices | use NAME")


if __name__ == "__main__":
    main(sys.argv[1:])
