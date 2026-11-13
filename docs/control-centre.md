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
Where everything is, why, and how it works - and changes made by running the scripts that already exist. The config files stay the truth; everything still works from a terminal.

## At a glance
- Open: Armoury Crate button, or `qs ipc call control toggle`
- Sections: one per `docs/*.md`, live-reloaded
- Controls: `sections/<Id>.qml` when it exists
- Keys: press ? for all of them

## How it works
- every `docs/*.md` is a section; its front matter lists the files by role
- the doc's body becomes this panel: summary, facts, cards, callouts
- click a file chip or a linked name to open it: folder → yazi, file → nvim
- a file only root can edit opens with sudoedit (password first, nvim as you)
> [!IMPORTANT]
> The app is loaded by file URL, not imported, so a typo in it can only break this window, never the OSD.

## Write a topic
- front matter: title, order, icon, paths by role, checks
- body: a short summary, then `## At a glance`, `## <area>` cards, `## Known issues`
- callouts: `> [!IMPORTANT]` (why), WARNING, CAUTION, TIP, NOTE
- full conventions: `quickshell/control/DESIGN.md` §5.5
> [!TIP]
> Keep it terse: about 200 words, short bullets, no sentences that describe the controls on screen.

## Editing the app
- changes under `quickshell/control/` need a shell restart (no hot reload)
- `r` re-reads folder notes and whether listed paths exist
```sh
sv restart ~/.local/sv/quickshell
```

## Known issues
> [!CAUTION]
> Clicking a file that doesn't exist does nothing visible.
> [!CAUTION]
> The OSD pops up "Laptop Speakers" whenever wireplumber restarts (the device is re-created).
> [!WARNING]
> The OSD misses the first brightness change after Quickshell starts or restarts; the second one shows.
