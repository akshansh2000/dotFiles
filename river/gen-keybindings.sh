#!/bin/sh
# Renders ~/.config/river/keybindings.conf into the marked block inside
# ~/.config/river/init. Edit keybindings.conf, never the block itself.
#
#   gen-keybindings.sh           regenerate and splice
#   gen-keybindings.sh --check   exit 1 if init is stale (prints a diff)
#   gen-keybindings.sh --apply   regenerate, splice, and apply live
#
# Companion to theme/apply-theme.sh - same "regenerate, then live-reload
# whatever can be reloaded without restarting river" shape.

set -e

conf="$HOME/.config/river/keybindings.conf"
init="$HOME/.config/river/init"
BEGIN_RE='^# >>> BEGIN GENERATED KEYBINDINGS'
END_RE='^# <<< END GENERATED KEYBINDINGS'

mode=splice
case "$1" in
	--check) mode=check ;;
	--apply) mode=apply ;;
	"")      ;;
	*) echo "usage: ${0##*/} [--check|--apply]" >&2; exit 2 ;;
esac

[ -r "$conf" ] || { echo "error: cannot read $conf" >&2; exit 1; }
[ -r "$init" ] || { echo "error: cannot read $init" >&2; exit 1; }

# Exactly one marker pair, in the right order, or we refuse to touch init.
nb=$(grep -c "$BEGIN_RE" "$init" || true)
ne=$(grep -c "$END_RE" "$init" || true)
if [ "$nb" != 1 ] || [ "$ne" != 1 ]; then
	echo "error: $init needs exactly one BEGIN and one END marker (found $nb/$ne)" >&2
	exit 1
fi
if [ "$(grep -n "$BEGIN_RE" "$init" | cut -d: -f1)" -ge \
     "$(grep -n "$END_RE" "$init" | cut -d: -f1)" ]; then
	echo "error: END marker precedes BEGIN marker in $init" >&2
	exit 1
fi

tmp=$(mktemp -d "${TMPDIR:-/tmp}/gen-keybindings.XXXXXX")
trap 'rm -rf "$tmp"' EXIT INT TERM

# --- render keybindings.conf -> riverctl calls -------------------------
render() {
	awk '
	function trim(s) { sub(/^[ \t]+/, "", s); sub(/[ \t]+$/, "", s); return s }
	# Pull one pipe-delimited field off the front of `rest`. Done by hand
	# rather than split() so that a `|` inside an action (a pipeline in a
	# spawn command) stays part of the action instead of becoming a field.
	function field(   p, f) {
		p = index(rest, "|")
		if (p == 0) { f = rest; rest = "" } else { f = substr(rest, 1, p - 1); rest = substr(rest, p + 1) }
		return trim(f)
	}
	/^[ \t]*$/            { print ""; next }
	/^##/                 { print "# --- " trim(substr($0, 3)) " ---"; next }
	/^#>/                 { print "# " trim(substr($0, 3)); next }
	/^[ \t]*#/            { next }
	{
		rest = $0
		type = field()
		if (type == "raw") { r = rest; sub(/^ /, "", r); print r; next }
		if (type != "map" && type != "pointer") {
			printf("gen-keybindings: line %d: unknown type \"%s\"\n", NR, type) > "/dev/stderr"
			exit 1
		}
		modes = field(); mods = field(); key = field(); action = trim(rest)
		if (modes == "" || mods == "" || key == "" || action == "") {
			printf("gen-keybindings: line %d: missing field\n", NR) > "/dev/stderr"
			exit 1
		}
		# `spawn` actions are stored unquoted and quoted here, so $(...) in
		# them is deferred to spawn time. Everything else goes out verbatim.
		if (action ~ /^spawn[ \t]/) {
			cmd = trim(substr(action, 6))
			gsub(/'\''/, "'\''\\'\'''\''", cmd)
			action = "spawn '\''" cmd "'\''"
		}
		verb = (type == "pointer") ? "map-pointer" : "map"
		n = split(modes, m, ",")
		for (i = 1; i <= n; i++) print "riverctl " verb " " trim(m[i]) " " mods " " key " " action
	}
	' "$conf"
}

render > "$tmp/block"

# --- compare against what is currently in init -------------------------
awk -v b="$BEGIN_RE" -v e="$END_RE" '
	$0 ~ e { inb = 0; next }
	inb    { print }
	$0 ~ b { inb = 1 }
' "$init" > "$tmp/block-old"

if cmp -s "$tmp/block" "$tmp/block-old"; then
	stale=no
else
	stale=yes
fi

if [ "$mode" = check ]; then
	if [ "$stale" = no ]; then exit 0; fi
	echo "init is out of date with keybindings.conf:"
	diff -u "$tmp/block-old" "$tmp/block" || true
	exit 1
fi

# --- splice ------------------------------------------------------------
if [ "$stale" = yes ]; then
	awk -v b="$BEGIN_RE" -v e="$END_RE" -v blk="$tmp/block" '
		$0 ~ b { print; while ((getline l < blk) > 0) print l; close(blk); inb = 1; next }
		$0 ~ e { inb = 0; print; next }
		!inb   { print }
	' "$init" > "$tmp/init.new"

	# Never install an init we cannot parse. This is what makes the
	# auto-quoting above safe to trust.
	if ! sh -n "$tmp/init.new"; then
		echo "error: generated init failed syntax check - $init left untouched" >&2
		exit 1
	fi

	cp -p "$init" "$init.bak"
	cat "$tmp/init.new" > "$init"
	echo "init updated ($(grep -c '^riverctl' "$tmp/block") bindings)"
else
	echo "init already up to date"
fi

[ "$mode" = apply ] || exit 0

# --- live apply --------------------------------------------------------
# riverctl map overwrites an existing binding, so replaying the block is
# idempotent. Removals are not covered by that, so diff old vs new and
# unmap what disappeared - otherwise deleting a row would look like a no-op
# until the next river restart.
if ! command -v riverctl >/dev/null 2>&1 || ! riverctl list-inputs >/dev/null 2>&1; then
	echo "river not running - changes apply on next start"
	exit 0
fi

# Expand each block by executing it against a riverctl that only reports
# the binding identity. This handles the raw tag loop for free.
mkdir -p "$tmp/stub"
cat > "$tmp/stub/riverctl" <<'STUB'
#!/bin/sh
case "$1" in map|map-pointer) printf '%s %s %s %s\n' "$1" "$2" "$3" "$4" ;; esac
STUB
chmod +x "$tmp/stub/riverctl"
PATH="$tmp/stub:$PATH" sh "$tmp/block-old" 2>/dev/null | sort -u > "$tmp/ids-old"
PATH="$tmp/stub:$PATH" sh "$tmp/block"     2>/dev/null | sort -u > "$tmp/ids-new"

comm -23 "$tmp/ids-old" "$tmp/ids-new" > "$tmp/ids-gone"
while read -r verb md mods key; do
	[ -n "$key" ] || continue
	case "$verb" in
		map)         riverctl unmap "$md" "$mods" "$key" 2>/dev/null || true ;;
		map-pointer) riverctl unmap-pointer "$md" "$mods" "$key" 2>/dev/null || true ;;
	esac
	echo "  unmapped: $md $mods $key"
done < "$tmp/ids-gone"

# river announces every rebind on stderr; that is one line per binding on
# every run, so drop just that message and let real errors through.
sh "$tmp/block" 2>&1 | grep -v '^overwrote an existing keybinding:' || true
echo "applied live ($(grep -c '^riverctl' "$tmp/block") bindings, $(wc -l < "$tmp/ids-gone" | tr -d ' ') removed)"
