#!/usr/bin/env python3
"""Control centre: turn docs/*.md into JSON for the app (2026-11-13).

Every top-level, non-hidden docs/*.md except README.md is a topic. Its YAML
front matter is a deliberately small subset - there is no PyYAML on this
system - and anything outside it is reported as "line N: ..." on the topic
instead of being ignored, so a typo is visible in the app:

  title: Audio            scalars: title, order, icon
  paths:                  groups by role (free-form names, kept in order)
    config:
      - wireplumber/      relative to --root, or ~/..., or absolute
      - path: river/keybindings.conf
        note: the volume / mic block
  checks:
    - sv: wireplumber

See quickshell/control/DESIGN.md (sections 4.3 and 5) for the whole contract.

The body is also split into blocks for the right panel (summary, facts,
cards with callouts and commands, known issues): see structure() below.

  python3 -I topics.py --root ~/.config --docs ~/.config/docs \\
      --sections ~/.config/quickshell/control/sections
"""
import argparse, datetime, json, os, re, sys

SCALARS = ("title", "order", "icon")


class FrontMatterError(Exception):
    def __init__(self, line, msg):
        super().__init__(f"line {line}: {msg}")
        self.line, self.msg = line, msg


def _value(raw):
    """A scalar: a quoted string as-is, else the text before any ` # comment`."""
    raw = raw.strip()
    if len(raw) >= 2 and raw[0] == raw[-1] and raw[0] in "\"'":
        return raw[1:-1]
    return re.sub(r"\s+#.*$", "", raw)


def parse_front_matter(text):
    """Return (meta, body). meta holds the scalars plus 'paths' (a list of
    {name, entries}) and 'checks' (a list of {type, value})."""
    lines = text.split("\n")
    if not lines or lines[0].strip() != "---":
        return {}, text
    try:
        end = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    except StopIteration:
        raise FrontMatterError(1, "front matter opened with --- but never closed")
    meta, section, group, entry = {}, None, None, None
    for i in range(1, end):
        n, raw = i + 1, lines[i]
        if "\t" in raw:
            raise FrontMatterError(n, "tab in indentation (use 2 spaces)")
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        indent = len(raw) - len(raw.lstrip(" "))
        line = raw.strip()
        if indent == 0:
            key, sep, val = line.partition(":")
            if not sep:
                raise FrontMatterError(n, f"expected 'key: value', got '{line}'")
            section, group, entry = key, None, None
            if key in SCALARS:
                meta[key] = _value(val)
            elif key == "paths":
                meta["paths"] = []
            elif key == "checks":
                meta["checks"] = []
            else:
                raise FrontMatterError(n, f"unknown key '{key}'")
        elif section == "paths" and indent == 2 and line.endswith(":"):
            group = {"name": line[:-1].strip(), "entries": []}
            meta["paths"].append(group)
            entry = None
        elif section == "paths" and indent == 4 and line.startswith("- ") and group is not None:
            item = line[2:].strip()
            if item.startswith("path:"):
                entry = {"path": _value(item[5:]), "note": ""}
            else:
                entry = {"path": _value(item), "note": ""}
            group["entries"].append(entry)
        elif section == "paths" and indent == 6 and line.startswith("note:") and entry is not None:
            entry["note"] = _value(line[5:])
        elif section == "checks" and indent == 2 and line.startswith("- "):
            key, sep, val = line[2:].partition(":")
            if not sep:
                raise FrontMatterError(n, f"expected '- type: value', got '{line}'")
            meta["checks"].append({"type": key.strip(), "value": _value(val)})
        else:
            raise FrontMatterError(n, f"unexpected line (indent {indent}) in '{section}': '{line}'")
    if "order" in meta:
        try:
            meta["order"] = int(meta["order"])
        except ValueError:
            raise FrontMatterError(1 + next(i for i in range(1, end) if lines[i].startswith("order")),
                                   f"order must be a whole number, got '{meta['order']}'")
    return meta, "\n".join(lines[end + 1:])


def _full(path, root):
    if path.startswith("~"):
        full = os.path.expanduser(path)
    elif os.path.isabs(path):
        full = path
    else:
        full = os.path.join(root, path)
    return os.path.normpath(full)


def _notes(folder):
    try:
        with open(os.path.join(folder, "NOTES.md")) as f:
            return f.read().strip()
    except OSError:
        return ""


def describe(path, root):
    """Resolve an entry and detect its kind. Never raises: anything that
    can't be stat'ed (dangling link, no permission) is 'missing'."""
    full = _full(path, root)
    if os.path.isdir(full):
        kind, folder = "folder", full
    elif not os.path.exists(full):
        kind, folder = "missing", os.path.dirname(full)
    elif full.endswith(".md"):
        kind, folder = "doc", os.path.dirname(full)
    elif os.access(full, os.X_OK):
        kind, folder = "script", os.path.dirname(full)
    else:
        kind, folder = "file", os.path.dirname(full)
    return {"full": full, "kind": kind, "notes": _notes(folder)}


def pascal(topic_id):
    """'login-logs' -> 'LoginLogs': the name of a topic's controls file."""
    return "".join(p[:1].upper() + p[1:] for p in re.split(r"[-_]", topic_id) if p)


# ---- the body as blocks, for the right panel (2026-11-13) ------------------
# Conventions (all optional; a doc using none is just a summary):
#   text before the first "## "        summary (an H1 equal to the title is dropped)
#   "## At a glance" with "- Key: value"  facts
#   "## Known issues"                  issues (its callouts, on their own)
#   any other "## Heading"             a card: points ("- "), callouts, commands, text
#   "> [!IMPORTANT|WARNING|CAUTION|TIP|NOTE]"  callouts (GitHub alert syntax);
#                                      IMPORTANT reads as the "why" of a decision
#   a ```sh fence                      one command row per line
# A code span naming a listed path (as written, or its basename when only one
# entry has it) becomes a link "open:<full path>".
ALERTS = {"IMPORTANT": "why", "WARNING": "warning", "CAUTION": "caution", "TIP": "tip", "NOTE": "note"}
_ALERT = re.compile(r"^>\s*\[!(\w+)\]\s*$")


def _path_index(groups):
    idx, bases = {}, {}
    for g in groups:
        for e in g["entries"]:
            idx[e["path"]] = idx[e["path"].rstrip("/")] = e["full"]
            base = e["path"].rstrip("/").split("/")[-1]
            bases.setdefault(base, set()).add(e["full"])
    for base, fulls in bases.items():
        if len(fulls) == 1:
            idx.setdefault(base, next(iter(fulls)))
    return idx


def _link(md, idx):
    def rep(m):
        full = idx.get(m.group(1)) or idx.get(m.group(1).rstrip("/"))
        return f"[{m.group(1)}](open:{full})" if full else m.group(0)
    return re.sub(r"(?<![\[\w])`([^`\n]+)`(?!\])", rep, md)


def _items(lines, idx):
    items, i = [], 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
        elif line.startswith("```"):
            i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                if lines[i].strip():
                    items.append({"type": "command", "text": lines[i].strip()})
                i += 1
            i += 1
        elif _ALERT.match(line):
            kind = ALERTS.get(_ALERT.match(line).group(1).upper(), "note")
            body, i = [], i + 1
            while i < len(lines) and lines[i].startswith(">") and not _ALERT.match(lines[i]):
                body.append(lines[i][1:].strip())
                i += 1
            items.append({"type": "callout", "kind": kind, "md": _link(" ".join(body), idx)})
        elif line.startswith("- "):
            text, i = [line[2:].strip()], i + 1
            while i < len(lines) and lines[i].startswith("  ") and lines[i].strip():
                text.append(lines[i].strip())
                i += 1
            items.append({"type": "point", "md": _link(" ".join(text), idx)})
        else:
            text, i = [line.strip()], i + 1
            while i < len(lines) and lines[i].strip() and not re.match(r"^(- |>|```|## )", lines[i]):
                text.append(lines[i].strip())
                i += 1
            items.append({"type": "text", "md": _link(" ".join(text), idx)})
    return items


def structure(body, title, groups):
    """(summary, blocks) for the right panel - see the conventions above."""
    idx = _path_index(groups)
    lines = body.split("\n")
    if lines and re.match(r"^#\s", lines[0]) and lines[0].lstrip("#").strip().lower() == title.lower():
        lines = lines[1:]
    cut = next((i for i, l in enumerate(lines) if l.startswith("## ")), len(lines))
    summary = _link(" ".join(l.strip() for l in lines[:cut] if l.strip()), idx)
    blocks, i = [], cut
    while i < len(lines):
        head = lines[i][3:].strip()
        j = next((k for k in range(i + 1, len(lines)) if lines[k].startswith("## ")), len(lines))
        items = _items(lines[i + 1:j], idx)
        if head.lower() == "at a glance":
            facts = []
            for it in items:
                k, sep, v = it.get("md", it.get("text", "")).partition(": ")
                facts.append({"key": k, "value": v} if sep else {"key": "", "value": k})
            blocks.append({"type": "facts", "items": facts})
        elif head.lower() == "known issues":
            blocks.append({"type": "issues", "items": items})
        else:
            blocks.append({"type": "card", "title": head, "items": items})
        i = j
    return summary, blocks


def _topic(path, tid, root, sections):
    with open(path, errors="replace") as f:
        text = f.read()
    try:
        meta, body = parse_front_matter(text)
        error = ""
    except FrontMatterError as e:
        m = re.match(r"^---\n.*?\n---\n?(.*)$", text, re.S)
        meta, body, error = {}, (m.group(1) if m else text), str(e)
    groups = meta.get("paths", [])
    for g in groups:
        for e in g["entries"]:
            e.update(describe(e["path"], root))
    controls = pascal(tid)
    title = meta.get("title") or tid
    summary, blocks = structure(body.strip(), title, groups)
    return {
        "id": tid,
        "title": title,
        "order": meta.get("order", 99),
        "icon": meta.get("icon", ""),
        "body": body.strip(),
        "summary": summary,
        "blocks": blocks,
        "error": error,
        "controls": controls if os.path.isfile(os.path.join(sections, controls + ".qml")) else "",
        "groups": groups,
        "checks": meta.get("checks", []),
    }


def load(root, docs, sections):
    out = []
    try:
        names = os.listdir(docs)
    except OSError:
        names = []
    for name in names:
        path = os.path.join(docs, name)
        if not name.endswith(".md") or name.startswith(".") or name == "README.md" \
                or not os.path.isfile(path):
            continue
        out.append(_topic(path, name[:-3], root, sections))
    out.sort(key=lambda t: (t["order"], t["title"].lower()))
    return {"topics": out, "generated": datetime.datetime.now().isoformat(timespec="seconds")}


def main(argv):
    ap = argparse.ArgumentParser(description="docs/*.md -> JSON for the Control centre")
    ap.add_argument("--root", required=True)
    ap.add_argument("--docs", required=True)
    ap.add_argument("--sections", required=True)
    a = ap.parse_args(argv)
    json.dump(load(a.root, a.docs, a.sections), sys.stdout)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main(sys.argv[1:])
