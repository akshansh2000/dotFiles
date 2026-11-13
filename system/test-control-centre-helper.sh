#!/bin/sh
# Tests for system/usr/local/libexec/control-centre-helper (2026-11-13), run on
# the STAGED copy with --dry-run, so nothing is written and no root is needed:
#   sh system/test-control-centre-helper.sh
# Prints PASS/FAIL per case; exits non-zero if any case fails.
H="$(dirname "$0")/usr/local/libexec/control-centre-helper"
fails=0

pass() { echo "PASS $1"; }
fail() { echo "FAIL $1"; fails=$((fails + 1)); }

# accepts: exit 0 and the expected write lines
out=$(sh "$H" --dry-run charge-limit 80 2>/dev/null); rc=$?
if [ $rc -eq 0 ] &&
	printf '%s\n' "$out" | grep -qx 'write 80 -> /sys/class/power_supply/BAT0/charge_control_end_threshold' &&
	printf '%s\n' "$out" | grep -qx 'write 80 -> /etc/control-centre/charge-limit'
then pass "helper_accepts_valid: charge-limit 80"; else fail "helper_accepts_valid: charge-limit 80 (rc=$rc, out=$out)"; fi

out=$(sh "$H" --dry-run power-profile quiet 2>/dev/null); rc=$?
if [ $rc -eq 0 ] && printf '%s\n' "$out" | grep -qx 'write quiet -> /sys/firmware/acpi/platform_profile'
then pass "helper_accepts_valid: power-profile quiet"; else fail "helper_accepts_valid: power-profile quiet (rc=$rc, out=$out)"; fi

# rejects: exit 2, nothing on stdout, and the helper's OWN message on stderr
# (dash also exits 2 when it can't open a missing file - that must not pass)
reject() {   # description, then the helper's arguments
	desc=$1; shift
	err=$(sh "$H" --dry-run "$@" 2>&1 >/dev/null)
	out=$(sh "$H" --dry-run "$@" 2>/dev/null); rc=$?
	if [ $rc -eq 2 ] && [ -z "$out" ] && printf '%s' "$err" | grep -q '^control-centre-helper: '
	then pass "helper_rejects_bad_input: $desc"
	else fail "helper_rejects_bad_input: $desc (rc=$rc, out=$out, err=$err)"; fi
}
reject "limit 59"            charge-limit 59
reject "limit 101"           charge-limit 101
reject "limit abc"           charge-limit abc
reject "limit injection"     charge-limit "60; rm -rf /"
reject "limit 80 extra"      charge-limit 80 extra
reject "limit empty"         charge-limit ""
reject "limit 080 (octal?)"  charge-limit 080
reject "profile turbo"       power-profile turbo
reject "profile injection"   power-profile 'quiet; reboot'
reject "unknown verb"        reboot
reject "no arguments"

[ $fails -eq 0 ] && echo "all passed" || echo "$fails failed"
exit $fails
