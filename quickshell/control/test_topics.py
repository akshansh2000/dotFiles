#!/usr/bin/env python3
"""Tests for topics.py, the Control centre's docs/*.md reader.

Run: cd ~/.config/quickshell/control && python3 -I -m unittest test_topics -v
"""
import os, shutil, stat, sys, tempfile, unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import topics  # noqa: E402

DESIGN_EXAMPLE = """---
title: Audio                 # shown in the left panel
order: 2                     # sort key; ties sort by title
icon: F057E
paths:
  config:
    - wireplumber/
  services:
    - sv/wireplumber/
  keys:
    - path: river/keybindings.conf
      note: the volume / mic block
  logs:
    - /tmp/runsvdir-user.log
checks:
  - sv: wireplumber
  - path: /run/asus-kbd-backlight
---
# Audio

Body text.
"""


class Tree(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.root = os.path.join(self.tmp, "root")
        self.docs = os.path.join(self.root, "docs")
        self.sections = os.path.join(self.root, "quickshell", "control", "sections")
        os.makedirs(self.docs)
        os.makedirs(self.sections)

    def tearDown(self):
        for dirpath, dirnames, _ in os.walk(self.tmp):
            for d in dirnames:
                os.chmod(os.path.join(dirpath, d), 0o755)
        shutil.rmtree(self.tmp)

    def write(self, rel, text="", mode=None):
        path = os.path.join(self.root, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(text)
        if mode is not None:
            os.chmod(path, mode)
        return path

    def load(self):
        return topics.load(self.root, self.docs, self.sections)

    def topic(self, tid):
        return next(t for t in self.load()["topics"] if t["id"] == tid)

    def entries(self, t):
        return {e["path"]: e for g in t["groups"] for e in g["entries"]}


class TestTopics(Tree):
    def test_full_schema(self):
        self.write("docs/audio.md", DESIGN_EXAMPLE)
        t = self.topic("audio")
        self.assertEqual(t["title"], "Audio")
        self.assertEqual(t["order"], 2)
        self.assertEqual(t["icon"], "F057E")
        self.assertEqual(t["error"], "")
        self.assertEqual([g["name"] for g in t["groups"]], ["config", "services", "keys", "logs"])
        self.assertEqual(self.entries(t)["river/keybindings.conf"]["note"], "the volume / mic block")
        self.assertEqual(t["checks"], [{"type": "sv", "value": "wireplumber"},
                                       {"type": "path", "value": "/run/asus-kbd-backlight"}])
        self.assertTrue(t["body"].startswith("# Audio"))

    def test_kinds(self):
        os.makedirs(os.path.join(self.root, "adir"))
        self.write("run.sh", "#!/bin/sh\n", mode=0o755)
        self.write("notes.md", "x")
        self.write("plain.conf", "x")
        self.write("docs/k.md", "---\npaths:\n  g:\n    - adir/\n    - run.sh\n    - notes.md\n"
                   "    - plain.conf\n    - nope.conf\n---\n")
        e = self.entries(self.topic("k"))
        self.assertEqual({p: e[p]["kind"] for p in e},
                         {"adir/": "folder", "run.sh": "script", "notes.md": "doc",
                          "plain.conf": "file", "nope.conf": "missing"})

    def test_relative_tilde_absolute(self):
        self.write("docs/p.md", "---\npaths:\n  g:\n    - kanshi/\n    - ~/x\n    - /tmp/y\n---\n")
        e = self.entries(self.topic("p"))
        self.assertEqual(e["kanshi/"]["full"], os.path.join(self.root, "kanshi"))
        self.assertEqual(e["~/x"]["full"], os.path.join(os.path.expanduser("~"), "x"))
        self.assertEqual(e["/tmp/y"]["full"], "/tmp/y")

    def test_folder_notes(self):
        self.write("wireplumber/NOTES.md", "Folder note.")
        self.write("wireplumber/51-x.conf", "x")
        self.write("docs/a.md", "---\npaths:\n  g:\n    - wireplumber/\n    - wireplumber/51-x.conf\n---\n")
        e = self.entries(self.topic("a"))
        self.assertEqual(e["wireplumber/"]["notes"], "Folder note.")
        self.assertEqual(e["wireplumber/51-x.conf"]["notes"], "Folder note.")

    def test_controls_name(self):
        self.write("quickshell/control/sections/Audio.qml", "")
        self.write("docs/audio.md", "x")
        self.write("docs/login-logs.md", "x")
        self.assertEqual(self.topic("audio")["controls"], "Audio")
        self.assertEqual(self.topic("login-logs")["controls"], "")
        self.assertEqual(topics.pascal("login-logs"), "LoginLogs")

    def test_bad_front_matter_reports_line(self):
        self.write("docs/bad.md", "---\ntitle: Bad\npaths:\n   g:\n    - x\n---\nBody\n")
        self.write("docs/good.md", "---\ntitle: Good\n---\n")
        t = self.topic("bad")
        self.assertTrue(t["error"].startswith("line 4:"), t["error"])
        self.assertEqual(t["title"], "bad")
        self.assertEqual(self.topic("good")["title"], "Good")
        self.write("docs/bad.md", "---\ntitle: Bad\nwhatever: 1\n---\n")
        self.assertTrue(self.topic("bad")["error"].startswith("line 3:"))

    def test_no_front_matter_is_a_plain_topic(self):
        self.write("docs/plain.md", "# Just text\n")
        t = self.topic("plain")
        self.assertEqual((t["title"], t["order"], t["error"], t["groups"]), ("plain", 99, "", []))
        self.assertEqual(t["body"], "# Just text")

    def test_ignores_hidden_and_backup_files(self):
        for name in (".audio.md.swp", "audio.md~", "4913", "README.md", "sub/x.md"):
            self.write("docs/" + name, "x")
        self.write("docs/real.md", "x")
        self.assertEqual([t["id"] for t in self.load()["topics"]], ["real"])

    def test_unreadable_and_dangling_paths(self):
        os.symlink(os.path.join(self.root, "gone"), os.path.join(self.root, "dangling"))
        locked = os.path.join(self.root, "locked")
        os.makedirs(os.path.join(locked, "inner"))
        os.chmod(locked, 0)
        self.write("docs/u.md", "---\npaths:\n  g:\n    - dangling\n    - locked/\n    - locked/inner/x\n---\n")
        e = self.entries(self.topic("u"))
        self.assertEqual(e["dangling"]["kind"], "missing")
        self.assertEqual(e["locked/"]["kind"], "folder")
        self.assertIn(e["locked/inner/x"]["kind"], ("missing", "file"))

    def test_sort_order(self):
        self.write("docs/b.md", "---\ntitle: Beta\norder: 1\n---\n")
        self.write("docs/a.md", "---\ntitle: Alpha\norder: 1\n---\n")
        self.write("docs/z.md", "---\ntitle: Zero\norder: 0\n---\n")
        self.assertEqual([t["title"] for t in self.load()["topics"]], ["Zero", "Alpha", "Beta"])


STRUCTURED = """---
title: Power
paths:
  services:
    - sv/battery-notify/
  scripts:
    - river/battery-notify.py
    - other/battery-notify.py
---
# Power

Battery stats and a 25% warning.

## At a glance
- Warning: 25%, once per discharge
- no colon here

## Low-battery warning
- `sv/battery-notify`, wakes on events
  and every 15 s
- `battery-notify.py` is ambiguous, `nope.conf` isn't listed
> [!IMPORTANT]
> "Discharging" = `AC0/online`,
> not `BAT0/status`.
```sh
sv restart ~/.local/sv/battery-notify
```
A plain sentence.

## Known issues
> [!WARNING]
> s2idle drains it to 0.
> [!TIP]
> unknown kinds fall back
"""


class TestStructure(Tree):
    def power(self):
        self.write("docs/power.md", STRUCTURED)
        return self.topic("power")

    def test_summary_drops_h1_equal_to_title(self):
        self.assertEqual(self.power()["summary"], "Battery stats and a 25% warning.")

    def test_block_types_in_order(self):
        self.assertEqual([(b["type"], b.get("title", "")) for b in self.power()["blocks"]],
                         [("facts", ""), ("card", "Low-battery warning"), ("issues", "")])

    def test_facts_split_on_first_colon(self):
        facts = self.power()["blocks"][0]["items"]
        self.assertEqual(facts, [{"key": "Warning", "value": "25%, once per discharge"},
                                 {"key": "", "value": "no colon here"}])

    def test_card_items(self):
        items = self.power()["blocks"][1]["items"]
        self.assertEqual([i["type"] for i in items], ["point", "point", "callout", "command", "text"])
        self.assertTrue(items[0]["md"].endswith("wakes on events and every 15 s"))   # continuation joined
        self.assertEqual(items[2]["kind"], "why")                                    # [!IMPORTANT]
        self.assertEqual(items[2]["md"], '"Discharging" = `AC0/online`, not `BAT0/status`.')
        self.assertEqual(items[3]["text"], "sv restart ~/.local/sv/battery-notify")
        self.assertEqual(items[4]["md"], "A plain sentence.")

    def test_issue_callout_kinds(self):
        self.assertEqual([i["kind"] for i in self.power()["blocks"][2]["items"]], ["warning", "tip"])

    def test_listed_paths_become_links(self):
        md = self.power()["blocks"][1]["items"][0]["md"]
        self.assertTrue(md.startswith("[sv/battery-notify](open:" + os.path.join(self.root, "sv/battery-notify") + ")"), md)

    def test_ambiguous_and_unlisted_names_stay_code(self):
        md = self.power()["blocks"][1]["items"][1]["md"]
        self.assertEqual(md, "`battery-notify.py` is ambiguous, `nope.conf` isn't listed")

    def test_plain_doc_is_one_summary(self):
        self.write("docs/plain.md", "Just a paragraph.\n\nAnd another.\n")
        t = self.topic("plain")
        self.assertEqual((t["summary"], t["blocks"]), ("Just a paragraph. And another.", []))


if __name__ == "__main__":
    unittest.main()
