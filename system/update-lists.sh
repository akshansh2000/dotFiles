#!/bin/sh
# Refresh the two system inventories next to this script (2026-10-10):
#   packages.txt  every package installed explicitly (xbps-query -m), names
#                 only, so a fresh install can take it as it is:
#                     xargs -a packages.txt sudo xbps-install -S
#   services.txt  the system services enabled in /var/service
#                     (sudo ln -s /etc/sv/NAME /var/service/ for each)
# Re-run after installing or removing packages / enabling services, then
# commit what changed. No sudo needed.

cd "$(dirname "$0")" || exit 1
xbps-query -m | xargs -n1 xbps-uhelper getpkgname | sort > packages.txt
ls /var/service | sort > services.txt
git rev-parse --is-inside-work-tree >/dev/null 2>&1 &&
	git diff --stat -- packages.txt services.txt
