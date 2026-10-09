#!/usr/bin/env python3
"""Replicate hid-asus's asus_kbd_get_functions() probe from userspace.

The driver does, on interface 1-3:1.0 (hidraw0):
    SET_FEATURE  {0x5a,0x05,0x20,0x31,0x00,0x08}   (6 bytes)
    GET_FEATURE  report 0x5a, 16 bytes             <- this is what returns -75

-75 is EOVERFLOW, which the xHCI driver only produces for
COMP_BABBLE_DETECTED_ERROR: the device sent back more data than the transfer
asked for. So we retry the GET at several lengths. If short lengths fail and a
longer one succeeds, the device is answering with a bigger report than the
driver's fixed 16-byte buffer expects.

Run: sudo python3 kbd-probe.py
"""
import fcntl, os, sys

DEV = "/dev/hidraw0"
RID = 0x5A

def _ioc(d, t, nr, size):
    v = (d << 30) | (size << 16) | (t << 8) | nr
    return v - (1 << 32) if v >= (1 << 31) else v

def SFEATURE(n): return _ioc(3, ord('H'), 0x06, n)
def GFEATURE(n): return _ioc(3, ord('H'), 0x07, n)

try:
    fd = os.open(DEV, os.O_RDWR)
except PermissionError:
    sys.exit("need root: sudo python3 " + " ".join(sys.argv))
except FileNotFoundError:
    sys.exit(DEV + " missing - is hid-asus bound?")

buf = bytearray([RID, 0x05, 0x20, 0x31, 0x00, 0x08])
try:
    n = fcntl.ioctl(fd, SFEATURE(len(buf)), buf)
    print(f"SET_FEATURE  6 bytes  -> ok ({n})")
except OSError as e:
    print(f"SET_FEATURE  6 bytes  -> FAIL errno {e.errno} ({e.strerror})")

for size in (16, 17, 32, 64, 65, 128):
    rb = bytearray(size); rb[0] = RID
    try:
        n = fcntl.ioctl(fd, GFEATURE(size), rb)
        print(f"GET_FEATURE {size:4d} bytes -> ok, {n} returned: {rb[:min(n,16)].hex(' ')}")
    except OSError as e:
        print(f"GET_FEATURE {size:4d} bytes -> FAIL errno {e.errno} ({e.strerror})")
os.close(fd)
