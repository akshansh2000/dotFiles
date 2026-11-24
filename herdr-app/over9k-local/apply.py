#!/usr/bin/env python3
# over9k-local/apply.py - this machine's changes to Over9k (github.com/herunan/herdr-over9k),
# re-applied after every copy of its mods (update.sh runs this; safe to run again).
#
#   python3 -I apply.py [--check]      (--check: report only, change nothing)
#
# Over9k's files are upstream's and get replaced on each update, so nothing here
# edits them by hand: each patch is an exact find/replace. A patch whose new text
# is already there is skipped; one whose old text isn't there exactly once FAILS
# and is left out (that piece behaves as upstream's until its anchor is fixed
# here), and the exit status is 1 so update.sh can say so.
#
# Why each exists:
#   colours      MARK (project names, to-do circles) and LINK_COLORS used fixed
#                hex; they now read the theme's own colours, so they follow
#                theme/colors.sh -> themes/catppuccin-mocha.json.
#   claude-dirs  Over9k only knew ~/.claude. claudek runs Claude Code with
#                CLAUDE_CONFIG_DIR=~/.claude-krypton, so every ~/.claude-*/ is
#                read too, and a Krypton session resumes through claudek.
#   rules        the to-do and hand-off rules go to every Claude config dir's
#                CLAUDE.md and nowhere else (Codex/Pi/Kimi aren't used here, and
#                handoff.sh would otherwise create ~/.codex again), and never
#                replace a symlink with a copy (upstream rewrites with mv).
#   update       Help & options' Update runs update.sh instead of install.sh
#                (install.sh would merge keys into "global"; ours are per layout).
#   keys         Over9k's keys live under "layout:over9k", so the main layout
#                keeps ctrl-tab = tab.next and plain tab/pane close.
import json, os, sys

HOME = os.path.expanduser("~")
APP = os.environ.get("HERDR_APP_HOME") or os.path.join(HOME, ".config", "herdr-app")
MODS = os.path.join(APP, "mods")
CHECK = "--check" in sys.argv[1:]

MARK_OLD = 'const MARK = { ansi6: "#22a99a", ansi3: "#e3814f", ansi4: "#5b8def", ansi5: "#8b7cf6", ansi2: "#3fae6a", ansi1: "#d9649a" };'
MARK_NEW = '''// over9k-local: the theme's own colours (theme/colors.sh), looked up when drawn.
const MARK = {};
for (const k of ["ansi6", "ansi3", "ansi4", "ansi5", "ansi2", "ansi1"]) Object.defineProperty(MARK, k, { enumerable: true, get: () => theme()[k] });'''

RULE_LOOP_OLD = 'for f in "$HOME/.claude/CLAUDE.md" "$HOME/.codex/AGENTS.md" "$HOME/.pi/agent/AGENTS.md" "${KIMI_CODE_HOME:-$HOME/.kimi-code}/AGENTS.md"; do'
RULE_LOOP_NEW = 'for f in "$HOME/.claude/CLAUDE.md" "$HOME"/.claude-*/CLAUDE.md; do  # over9k-local: every Claude config dir, nothing else'
SYMLINK_GUARD = '[ -L "$f" ] && continue  # over9k-local: mv would replace the link with a copy'

# (name, file under mods/, old, new)
PATCHES = [
    ("colours: sidebar MARK", "over9k/main.js", MARK_OLD, MARK_NEW),
    ("colours: to-do MARK", "over9k-todos/main.js", MARK_OLD, MARK_NEW),
    ("colours: LINK_COLORS", "over9k/main.js",
     '''const LINK_COLORS = ["#5b8def", "#e3814f", "#3fae6a", "#d9649a", "#8b7cf6", "#22a99a",
  "#d4a72c", "#e05a5a", "#3ba7d9", "#8cb83a", "#c26bd6", "#b08a5a"];''',
     '''// over9k-local: the theme's colours (theme/colors.sh), not fixed hex.
const LINK_COLORS = () => ["accent", "ansi4", "ansi3", "ansi2", "ansi1", "ansi5", "ansi6"].map((k) => theme()[k]);'''),
    ("colours: LINK_COLORS use", "over9k/main.js",
     "this.linkColors[address] = LINK_COLORS.reduce(",
     "this.linkColors[address] = LINK_COLORS().reduce("),

    ("claude-dirs: CONFIGS", "over9k/claude-info.py",
     'OUT = os.path.join(HOME, ".cache", "over9k", "agents")\n',
     'OUT = os.path.join(HOME, ".cache", "over9k", "agents")\n'
     '# over9k-local: every Claude config dir: ~/.claude and ~/.claude-<name> (claudek\'s CLAUDE_CONFIG_DIR).\n'
     'CONFIGS = [os.path.join(HOME, ".claude")] + sorted(d for d in glob.glob(os.path.join(HOME, ".claude-*")) if os.path.isdir(os.path.join(d, "sessions")))\n'),
    ("claude-dirs: transcript_of", "over9k/claude-info.py",
     '''def transcript_of(session, cwd):
    if not session:
        return None
    if cwd:
        p = os.path.join(HOME, ".claude", "projects", re.sub(r"[^A-Za-z0-9]", "-", cwd), f"{session}.jsonl")
        if os.path.isfile(p):
            return p
    found = glob.glob(os.path.join(HOME, ".claude", "projects", "*", f"{session}.jsonl"))
    if found:
        return found[0]
    # A new conversation (just after /clear) has no file until its first message:
    # its path still says which one it is.
    return os.path.join(HOME, ".claude", "projects", re.sub(r"[^A-Za-z0-9]", "-", cwd), f"{session}.jsonl") if cwd else None''',
     '''def transcript_of(session, cwd, base=os.path.join(HOME, ".claude")):  # over9k-local: base = its config dir
    if not session:
        return None
    if cwd:
        p = os.path.join(base, "projects", re.sub(r"[^A-Za-z0-9]", "-", cwd), f"{session}.jsonl")
        if os.path.isfile(p):
            return p
    found = glob.glob(os.path.join(base, "projects", "*", f"{session}.jsonl"))
    if found:
        return found[0]
    # A new conversation (just after /clear) has no file until its first message:
    # its path still says which one it is.
    return os.path.join(base, "projects", re.sub(r"[^A-Za-z0-9]", "-", cwd), f"{session}.jsonl") if cwd else None'''),
    ("claude-dirs: sessions scan", "over9k/claude-info.py",
     '    for f in glob.glob(os.path.join(HOME, ".claude", "sessions", "*.json")):',
     '    for base, f in ((b, f) for b in CONFIGS for f in glob.glob(os.path.join(b, "sessions", "*.json"))):  # over9k-local'),
    ("claude-dirs: transcript base", "over9k/claude-info.py",
     '        path = transcript_of(s.get("sessionId"), s.get("cwd"))',
     '        path = transcript_of(s.get("sessionId"), s.get("cwd"), base)'),
    ("claude-dirs: stale-file check", "over9k/claude-info.py",
     'mine = "/.claude/projects/" in (json.load(open(dest)).get("transcript") or "").replace(os.sep, "/")',
     'mine = re.search(r"/\\.claude[^/]*/projects/", (json.load(open(dest)).get("transcript") or "").replace(os.sep, "/")) is not None  # over9k-local'),
    ("claude-dirs: resume list", "over9k-new-menu/main.js",
     '''  claude: `if [ -n "$1" ]; then set -- "$HOME/.claude/projects/$(printf %s "$1" | sed 's/[^a-zA-Z0-9]/-/g')"/*.jsonl
else set -- "$HOME"/.claude/projects/*/*.jsonl; fi''',
     '''  claude: `if [ -n "$1" ]; then s=$(printf %s "$1" | sed 's/[^a-zA-Z0-9]/-/g'); set -- "$HOME/.claude/projects/$s"/*.jsonl "$HOME"/.claude-*/projects/"$s"/*.jsonl
else set -- "$HOME"/.claude/projects/*/*.jsonl "$HOME"/.claude-*/projects/*/*.jsonl; fi'''),
    ("claude-dirs: resume account", "over9k-new-menu/resume.sh",
     '''    [ -n "$id" ] && exec claude --resume "$id"
''',
     '''    # over9k-local: a session kept in another Claude config dir resumes on that
    # account: Krypton's through claudek (fish), any other with CLAUDE_CONFIG_DIR.
    if [ -n "$id" ]; then
      for d in "$HOME"/.claude-*/; do
        ls "$d"projects/*/"$id".jsonl >/dev/null 2>&1 || continue
        [ "$d" = "$HOME/.claude-krypton/" ] && command -v fish >/dev/null 2>&1 && exec fish -c 'claudek $argv' -- --resume "$id"
        export CLAUDE_CONFIG_DIR="${d%/}"
      done
    fi
    [ -n "$id" ] && exec claude --resume "$id"
'''),
    ("claude-dirs: + menu folders", "over9k-new-menu/main.js",
     '  for d in "$HOME"/.claude/projects/*/; do',
     '  for d in "$HOME"/.claude/projects/*/ "$HOME"/.claude-*/projects/*/; do  # over9k-local'),
    ("claude-dirs: options folders", "over9k-options/main.js",
     '  for d in "$HOME"/.claude/projects/*/; do',
     '  for d in "$HOME"/.claude/projects/*/ "$HOME"/.claude-*/projects/*/; do  # over9k-local'),
    ("claude-dirs: to-do hook", "over9k-todos/todo-hook.sh",
     '''grep -q '<!-- over9k:todo -->' "$HOME/.claude/CLAUDE.md" 2>/dev/null || exit 0''',
     '''grep -q '<!-- over9k:todo -->' "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/CLAUDE.md" 2>/dev/null || exit 0  # over9k-local'''),
    ("claude-dirs: to-do hook in every settings.json", "over9k-options/setup.sh",
     '''    command -v jq >/dev/null 2>&1 && hook "$on" UserPromptSubmit over9k-todos/todo-hook.sh "sh \\"$mods/over9k-todos/todo-hook.sh\\""''',
     '''    # over9k-local: in every Claude config dir's settings.json
    command -v jq >/dev/null 2>&1 && for c in "$HOME/.claude" "$HOME"/.claude-*/; do
      [ -d "$c" ] || continue; settings="${c%/}/settings.json"
      hook "$on" UserPromptSubmit over9k-todos/todo-hook.sh "sh \\"$mods/over9k-todos/todo-hook.sh\\""
    done'''),

    ("accounts: status line in every settings.json", "over9k-options/setup.sh",
     '''    was="$HOME/.claude/.over9k-statusline-was.json"
    ours='test("over9k[^/\\"]*/claude-statusline\\\\.sh")'
''',
     '''    # over9k-local: in every Claude config dir (each saves its own limits: claude-statusline.sh)
    for c in "$HOME/.claude" "$HOME"/.claude-*/; do
    [ -d "$c" ] || continue; c=${c%/}; settings="$c/settings.json"
    was="$c/.over9k-statusline-was.json"
    ours='test("over9k[^/\\"]*/claude-statusline\\\\.sh")'
'''),
    ("accounts: status line loop end", "over9k-options/setup.sh",
     '''      edit "if ((.statusLine.command // \\"\\") | $ours) then del(.statusLine) else . end"
    fi
    exit 0 ;;''',
     '''      edit "if ((.statusLine.command // \\"\\") | $ours) then del(.statusLine) else . end"
    fi
    done  # over9k-local
    exit 0 ;;'''),
    ("accounts: limits file per config dir", "over9k/claude-statusline.sh",
     'u="$HOME/.cache/over9k/usage"; mkdir -p "$u"',
     '''u="$HOME/.cache/over9k/usage"
# over9k-local: another Claude config dir (claudek's ~/.claude-krypton) keeps its
# limits apart, in usage/<its name without the dot>/claude.json (over9k-usage reads them).
case "${CLAUDE_CONFIG_DIR:-}" in ""|"$HOME/.claude"|"$HOME/.claude/") ;; *) n=${CLAUDE_CONFIG_DIR%/}; n=${n##*/}; u="$u/${n#.}" ;; esac
mkdir -p "$u"'''),
    ("accounts: Usage reads every account", "over9k-usage/main.js",
     '    this.mine = { claude, api, plan, account, codex, agy };',
     '''    // over9k-local: each other Claude config dir (claudek's ~/.claude-krypton): its limits
    // (usage/claude-<name>/claude.json, from claude-statusline.sh) and plan (<dir>/.claude.json).
    const others = [];
    const dirs = (await exec("sh", ["-c", 'for d in "$HOME"/.claude-*/; do [ -d "$d" ] && basename "$d"; done']).catch(() => null))?.stdout ?? "";
    for (const d of dirs.split("\\n").filter(Boolean)) {
      const limits = await readJson(`${dir}/${d.replace(/^\\./, "")}/claude.json`);
      const p = (await exec("sh", ["-c", `jq -r '.oauthAccount.planDisplayName // empty' "$HOME/$1/.claude.json" 2>/dev/null`, "sh", d]).catch(() => null))?.stdout.trim();
      if (limits) others.push({ name: d.replace(/^\\.claude-/, ""), claude: limits, plan: p });
    }
    this.mine = { claude, api, plan, account, codex, agy, others };'''),
    ("accounts: Usage row per account", "over9k-usage/main.js",
     '''        seven && limit("7d", seven.used_percentage, seven.resets_at),
      ].filter(Boolean) });
    }
''',
     '''        seven && limit("7d", seven.used_percentage, seven.resets_at),
      ].filter(Boolean) });
      // over9k-local: a row for each other account, after this one (Options' Claude switch covers them too).
      for (const o of this.mine.others ?? []) {
        if (!sub(o.claude)) continue;
        const f = o.claude.five_hour, w = o.claude.seven_day;
        out.push({ key: `claude-${o.name}`, service: "claude", name: `Claude · ${o.name[0].toUpperCase()}${o.name.slice(1)}`, plan: planName(o.plan), limits: [
          f && limit("5h", f.used_percentage, f.resets_at), w && limit("7d", w.used_percentage, w.resets_at)].filter(Boolean) });
      }
    }
'''),

    ("rules: to-do rule files", "over9k-todos/todo.sh",
     '  ' + RULE_LOOP_OLD + '\n    [ -d "$(dirname "$f")" ] || continue\n',
     '  ' + RULE_LOOP_NEW + '\n    [ -d "$(dirname "$f")" ] || continue\n    ' + SYMLINK_GUARD + '\n'),
    ("rules: hand-off rule files", "over9k/handoff.sh",
     '    ' + RULE_LOOP_OLD + '\n      [ "${2:-}" = on ] && mkdir -p "$(dirname "$f")"\n      [ -d "$(dirname "$f")" ] || continue\n',
     '    ' + RULE_LOOP_NEW + '\n      [ -d "$(dirname "$f")" ] || continue\n      ' + SYMLINK_GUARD + '\n'),

    ("update: Update runs update.sh", "over9k-options/main.js",
     '  git pull -q --no-rebase --ff-only origin "$2" && sh ./install.sh --yes --no-claude --home "$3"',
     '  sh "$3/over9k-local/update.sh"  # over9k-local: instead of git pull + install.sh'),
]

# Over9k's keys (its over9k/keys.json), scoped to its layout.
KEYS = {
    "layout:over9k": {
        "ctrl-tab": "over9k.switcher",
        "ctrl-shift-w": "over9k.close-tab",
        "ctrl-shift-x": "over9k.close-pane",
    },
    "mod:over9k-switcher": {
        "ctrl-tab": "over9k-switcher.next",
        "ctrl-shift-tab": "over9k-switcher.prev",
    },
}


def patch_files():
    texts, changed, failed = {}, set(), []
    for name, rel, old, new in PATCHES:
        path = os.path.join(MODS, rel)
        if path not in texts:
            try:
                texts[path] = open(path, encoding="utf-8").read()
            except OSError as e:
                print(f"FAILED   {name}: {e}")
                failed.append(name)
                continue
        text = texts[path]
        if new in text:
            print(f"ok       {name}")
        elif text.count(old) == 1:
            texts[path] = text.replace(old, new)
            changed.add(path)
            print(f"applied  {name}")
        else:
            print(f"FAILED   {name}: its old text is in {rel} {text.count(old)} times, not once")
            failed.append(name)
    for path in changed if not CHECK else ():
        tmp = path + ".over9k-local.tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            f.write(texts[path])
        os.chmod(tmp, os.stat(path).st_mode)
        os.replace(tmp, path)
    return failed


def merge_keys():
    path = os.path.join(APP, "keys.json")
    keys = json.load(open(path, encoding="utf-8"))
    added = []
    for section, binds in KEYS.items():
        have = keys.setdefault(section, {})
        for key, action in binds.items():
            if key not in have:  # one you set yourself stays yours
                have[key] = action
                added.append(f"{section} {key}")
    if added and not CHECK:
        tmp = path + ".over9k-local.tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(keys, f, indent=2, ensure_ascii=False)
            f.write("\n")
        os.replace(tmp, path)
    print(f"keys     {'added ' + ', '.join(added) if added else 'ok'}")


failed = patch_files()
merge_keys()
if failed:
    print(f"\n{len(failed)} patch(es) failed; those parts run as upstream's until apply.py is fixed.")
sys.exit(1 if failed else 0)
