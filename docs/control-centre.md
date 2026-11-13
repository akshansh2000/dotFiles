---
title: Control centre
order: 99
icon: F0493
paths:
  ui:
    - quickshell/control/
    - quickshell/control/ControlCentre.qml
    - quickshell/control/KeyMap.qml
  services:
    - quickshell/services/Topics.qml
  scripts:
    - path: quickshell/control/topics.py
      note: docs/*.md -> JSON; tests in test_topics.py
  docs:
    - docs/
    - path: quickshell/control/DESIGN.md
      note: the approved design: why, conventions, decisions
  system:
    - path: /usr/local/libexec/control-centre-helper
      note: root helper for charge limit / power profile (installed from system/)
    - path: /etc/polkit-1/rules.d/50-control-centre.rules
      note: lets the helper keep the password for a few minutes
  keys:
    - path: river/keybindings.conf
      note: the Armoury Crate button opens this window
---
# Control centre

This app shows **where everything is, why, and how it works**, and changes
things by running the scripts that already exist. The config files stay the
source of truth: everything still works from a terminal without it.

## How it works

- **Sections are files.** Every `docs/*.md` is a section. Its YAML front
  matter says what the left panel shows and which files belong to it. The
  Markdown below it is what you're reading now.
- **The right panel** is that Markdown plus the topic's files, grouped by
  role. A `NOTES.md` inside a listed folder shows up under that folder.
- **The centre** shows a topic's controls when
  `quickshell/control/sections/<Id>.qml` exists. Otherwise it shows the
  files.
- **Live reload.** Saving any doc in `docs/` updates the app within a
  moment (`inotifywait` watches the folder).

## Add a topic

Create `docs/<id>.md`:

```yaml
---
title: Audio          # left-panel name
order: 2              # sort key (ties sort by title)
icon: F057E           # optional: Material Design Icons codepoint, hex
paths:                # groups BY ROLE, shown in this order
  config:
    - wireplumber/    # relative to ~/.config, or ~/..., or /absolute
  keys:
    - path: river/keybindings.conf
      note: Volume / brightness / media keys (normal + locked, per river's own docs)
checks:               # optional, for the health overview
  - sv: wireplumber
---
```

- **Usual group names:** config, services, scripts, ui, keys, logs, system.
  Any name works.
- **A typo in the front matter** shows as a red line at the top of the topic,
  with its line number.
- **Hidden files, `*~` backups and `README.md`** in `docs/` are ignored.

## Give a topic controls

Add `quickshell/control/sections/<Id>.qml`, where `<Id>` is the file name in
PascalCase (`login-logs.md` → `LoginLogs.qml`). Build it from the Mocha
widgets in `quickshell/control/widgets/`, never Qt's default look. Every
control shows the command it is equivalent to.

## Tips

- Press `?` for every key.
- **Click any file entry to open it** (`quickshell/control/open-path.sh`):
  - a folder opens in yazi;
  - a file opens in nvim inside tmux;
  - a file only root can edit opens with `sudoedit`: sudo asks for your
    password in that window, nvim edits a copy as you, and sudo writes it
    back when you `:wq`.
- `Tab` moves focus between the panels. With the docs focused, `j`/`k`
  scroll them.
- `r` re-reads everything, including folder notes and whether listed paths
  still exist. Those aren't watched live.
- **Editing anything under `quickshell/control/`** is *not* picked up by
  Quickshell's hot reload. The app is loaded by file URL on purpose: that
  way a typo in it can only break this window, never the OSD. Restart the
  shell with `sv restart ~/.local/sv/quickshell`; the OSD comes back with it.
  Topic docs in `docs/` still reload live.
- Changes that need root (charge limit, power profile) go through
  `pkexec` and the small helper listed above. It accepts only a fixed set of
  actions.

## Known issues (accepted for now)

- Clicking a file entry that doesn't exist does nothing visible.
  `open-path.sh` exits quietly when the path is missing and its folder is
  readable.
- The OSD pops up "Laptop Speakers" whenever wireplumber restarts, because
  the device is re-created.
- The OSD misses the **first** brightness change after Quickshell starts or
  restarts. The second one shows.
