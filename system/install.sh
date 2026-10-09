#!/bin/sh
# Staged system files (2026-10-10). system/etc/... mirrors /etc/... and the
# repo copy is the source of truth: edit here, then install. They are COPIES on
# purpose, not symlinks into $HOME - every one is read by root (or polkitd) and
# can make root do things (rc.local runs as root, udev RUN+=, polkit rules,
# greetd's initial_session, modprobe install lines, grub's init=), so a link
# would let anything running as this user skip the sudo password. polkitd
# couldn't follow one anyway: $HOME is 0700.
#
#   install.sh             status of every staged file vs the live one
#   install.sh FILE...     per file: show the diff, ask, sudo-install it
#                          (FILE as etc/..., system/etc/... or /etc/...)
#
# Installed root:root, 755 if the staged file is executable, else 644 - only
# the exec bit is taken from the staged file, which is all git keeps anyway
# (copying the whole mode installed two files 664 on 2026-10-10, because some
# staged copies were group-writable). Needs a terminal: sudo asks for a password
# and the y/N prompt reads stdin.

cd "$(dirname "$0")" || exit 1

norm() {   # any spelling -> etc/...
	case $1 in
	/etc/*)        printf '%s\n' "${1#/}" ;;
	system/etc/*)  printf '%s\n' "${1#system/}" ;;
	./etc/*)       printf '%s\n' "${1#./}" ;;
	etc/*)         printf '%s\n' "$1" ;;
	*)             printf 'etc/%s\n' "$1" ;;
	esac
}

hint() {   # what makes the new file take effect
	case $1 in
	etc/iwd/*)          echo "  -> sudo sv restart iwd" ;;
	etc/udev/*)         echo "  -> sudo udevadm control --reload && sudo udevadm trigger --subsystem-match=hidraw" ;;
	etc/default/grub)   echo "  -> sudo grub-mkconfig -o /boot/grub/grub.cfg (then reboot)" ;;
	etc/greetd/*)       echo "  -> used from the next greeter start (log out)" ;;
	etc/polkit-1/*)     echo "  -> polkitd reloads rules by itself" ;;
	etc/modprobe.d/*)   echo "  -> rebuild the initramfs (sudo xbps-reconfigure -f linux<ver>), then reboot" ;;
	etc/rc.local|etc/rc.conf) echo "  -> used from the next boot" ;;
	etc/xbps.d/*)       echo "  -> used by the next xbps-install -S" ;;
	esac
}

readable_dir() {   # can we even look inside /etc/...'s directory?
	[ -x "$(dirname "/$1")" ]
}

if [ $# -eq 0 ]; then
	find etc -type f | sort | while read -r f; do
		if ! readable_dir "$f" || { [ -e "/$f" ] && [ ! -r "/$f" ]; }; then
			st="unreadable without sudo"
		elif [ ! -e "/$f" ]; then st="NOT INSTALLED"
		elif cmp -s "/$f" "$f"; then st="same"
		else st="DIFFERS"
		fi
		printf '%-24s %s\n' "$st" "$f"
	done
	exit 0
fi

for arg; do
	f=$(norm "$arg")
	[ -f "$f" ] || { echo "not staged: $f" >&2; continue; }
	echo "== /$f"
	if ! readable_dir "$f" || { [ -e "/$f" ] && [ ! -r "/$f" ]; }; then
		if sudo test -e "/$f"; then
			sudo diff -u "/$f" "$f" && { echo "already the same"; continue; }
		else
			echo "(not installed yet - new file)"
		fi
	elif [ ! -e "/$f" ]; then
		echo "(not installed yet - new file)"
	else
		diff -u "/$f" "$f" && { echo "already the same"; continue; }
	fi
	printf 'install /%s? [y/N] ' "$f"
	read -r ans
	[ "$ans" = y ] || { echo "skipped"; continue; }
	if [ -x "$f" ]; then mode=755; else mode=644; fi
	sudo install -D -m "$mode" -o root -g root "$f" "/$f" &&
		echo "installed" && hint "$f"
done
