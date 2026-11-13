# Control centre v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build version 1 of the Control centre: the three-panel Quickshell window driven by `docs/*.md`, with live reload, keys and a `?` overlay, self-documentation, and working Display, Audio and Power sections. Power's charge limit and power profile go through a polkit-guarded root helper.

**Architecture:** `topics.py` (Python stdlib) turns `docs/*.md` front matter into JSON. A `Topics` singleton runs it, and re-runs it when `inotifywait` reports a change. `ControlCentre.qml` draws the panels from that data, and loads `sections/<Id>.qml` into the centre when the file exists. It is built and tested in a separate dev instance (`quickshell -p ~/.config/quickshell/control-dev.qml`), and only the last task wires it into the live `shell.qml` behind a `LazyLoader`.

**Tech Stack:**
- Quickshell 0.3.2 (QML / Qt 6.11): `Quickshell`, `Quickshell.Io`, `Quickshell.Services.Pipewire`, `QtQuick`, `QtQuick.Controls` (templates only, restyled)
- Python 3 stdlib, `unittest`
- POSIX sh
- polkit (pkexec), runit
- `inotifywait` (inotify-tools), `brillo`, `wlr-randr --json`

**Spec:** `quickshell/control/DESIGN.md` (approved 2026-11-13). Read it first; this plan only adds the decisions the spec left open.

## Global Constraints

- Repo root = `~/.config` (public GitHub repo). Never write secrets into docs or code.
- **Never commit.** Each task ends with a checkpoint: show `git status --short` and ask the user whether to commit (AGENTS.md: "Commit and push only when asked").
- The working agreement in `~/.config/AGENTS.md` applies:
  - anything outside a task's listed files goes back to the user first;
  - the user runs every `sudo` command themselves.
- The live shell (`sv/quickshell`, running `quickshell/shell.qml`) must not reload before Task 9. That means:
  - **only add new files** under `quickshell/control/`, `quickshell/services/` and `docs/`;
  - existing files under `quickshell/` are edited only where a task says so (`services/Brightness.qml` in Task 6, `shell.qml` in Task 9). Editing them reloads the live shell, so check the OSD still pops up afterwards.
- Private Use Area glyphs only as `String.fromCodePoint(0x…)`. Every icon is a Material Design Icons codepoint from `Theme.fontIcons`.
- All colours and fonts come from `Theme` (`qs` import). Qt's default control look must not appear anywhere.
- Kill test processes **by exact PID** after checking `/proc/<pid>/comm`. Never use `pkill -f` or `pgrep -f` patterns: they match the shell running them.
- Paths in topic docs resolve against the repo root (the parent of `Quickshell.shellDir`). `~` and absolute paths are allowed.
- Dev instance: `quickshell -p "$HOME/.config/quickshell/control-dev.qml"`, logging to `/tmp/claude-1000/cc-dev.log`. Its IPC: `quickshell ipc -p "$HOME/.config/quickshell/control-dev.qml" call control <fn> [arg]`.
- QML verification (there is no qmllint or qmltestrunner on this system):
  1. the dev instance log has no `WARN` or `ERROR` lines after the step;
  2. a `grim` screenshot of the window, viewed;
  3. the IPC call returns.

## Review Focus

1. **Editors save in several steps.** Vim writes `.audio.md.swp`, a `4913` probe file, and `audio.md~`. Other editors write a temp file and then rename it. Only top-level, non-hidden `*.md` files may become topics, and a burst of events must cause **one** reload. Tests: Task 1 `test_ignores_hidden_and_backup_files`; Task 2 step 5 (save from vim, count reloads).
2. **A broken or missing front matter** must still list the topic, with a visible red error, and the other topics must still load. Tests: Task 1 `test_bad_front_matter_reports_line`, `test_no_front_matter_is_a_plain_topic`.
3. **Paths that can't be read** (a `/var/log/...` file without permission, a `~` path, a dangling symlink) must not crash the reader. They show as `missing`, or as their real kind. Test: Task 1 `test_unreadable_and_dangling_paths`.
4. **Helper input from the app** (out-of-range numbers, `60; rm -rf /`, extra arguments, an unknown verb) is refused with exit 2 and nothing is written. Test: Task 7 `helper_rejects_bad_input`.
5. **Hardware that's missing or mid-restart:**
   - no `charge_control_end_threshold`;
   - no `platform_profile`;
   - PipeWire with no sinks while wireplumber restarts.

   Each must show "not available" in the UI, not JS errors. Tests: Task 8 step 4 (fake battery dir); Task 5 step 5 (restart wireplumber with the window open).

---

### Task 1: Topic reader `topics.py`

**Files:**
- Create: `quickshell/control/topics.py`
- Test: `quickshell/control/test_topics.py`

**Interfaces:**
- Produces, as a CLI: `python3 -I topics.py --root ROOT --docs DIR --sections DIR`, printing one JSON object to stdout (always exit 0 unless the arguments are wrong):
  ```
  {"topics": [ {
      "id": "audio", "title": str, "order": int (default 99), "icon": str (hex, "" if none),
      "body": str (Markdown, front matter stripped),
      "error": str ("" or "line N: message"),
      "controls": str ("Audio" if sections/Audio.qml exists, else ""),
      "groups": [ {"name": str, "entries": [ {"path": str, "note": str, "full": str,
                    "kind": "folder"|"script"|"doc"|"file"|"missing", "notes": str} ] } ],
      "checks": [ {"type": str, "value": str} ] } ],
    "generated": "<ISO time>" }
  ```
  Sorted by `(order, title)`.
- Produces, as Python: `parse_front_matter(text) -> (dict, str)`, raising `FrontMatterError(line: int, msg: str)`; `describe(path: str, root: str) -> dict`; `pascal(topic_id: str) -> str`; `load(root, docs, sections) -> dict`.

- [ ] **Step 1: Write the failing tests** in `test_topics.py` (`unittest`, each test builds a temp dir tree):
  - `test_full_schema`: the DESIGN.md §5.2 example parses to `title == "Audio"` and `order == 2`; groups are `config, services, keys, logs`, in that order; the keys entry has `note == "the volume / mic block"`; checks are `[{"type":"sv","value":"wireplumber"},{"type":"path","value":"/run/asus-kbd-backlight"}]`.
  - `test_kinds`: a folder → `folder`; a `chmod +x` file → `script`; `x.md` → `doc`; a plain file → `file`; a nonexistent path → `missing`.
  - `test_relative_tilde_absolute`: `kanshi/` resolves under `--root`; `~/x` under `$HOME`; `/tmp/...` stays as it is.
  - `test_folder_notes`: `wireplumber/NOTES.md` is attached as `notes` to an entry `wireplumber/`, and to an entry `wireplumber/51-x.conf`.
  - `test_controls_name`: `sections/Audio.qml` exists → `audio` gets `"Audio"`; `login-logs` → `pascal()` gives `"LoginLogs"`; with no file, `""`.
  - `test_bad_front_matter_reports_line`: an unknown nested key or a bad indent gives `error` starting `"line 4:"`; the topic is still listed (title = id); other topics still load.
  - `test_no_front_matter_is_a_plain_topic`: no `---` block → `title = id`, `order = 99`, `body` = the whole file, `error = ""`.
  - `test_ignores_hidden_and_backup_files`: `.audio.md.swp`, `audio.md~`, `4913`, `README.md` and `sub/x.md` are not topics.
  - `test_unreadable_and_dangling_paths`: a dangling symlink → `missing`; a dir with mode 000 → `folder`, with no exception raised.
  - `test_sort_order`: order ties sort by title.

- [ ] **Step 2: Run them and confirm they fail**
  Run: `cd ~/.config/quickshell/control && python3 -I -m unittest test_topics -v`
  Expected: ERROR, `ModuleNotFoundError: No module named 'topics'`.

- [ ] **Step 3: Implement `topics.py`**
  - The spike's `/tmp/claude-1000/spike/topics.py` is the starting point.
  - Add strict parsing:
    - top-level keys `title`, `order`, `icon`, `paths`, `checks`;
    - 2-space indentation only;
    - anything else raises `FrontMatterError` with its 1-based line number in the file.
  - `notes` = the content of the nearest `NOTES.md` in the entry's own folder: for a file entry, its parent folder; for a folder entry, the folder itself.
  - Use `os.path.lexists` and `os.access` so nothing raises on permission errors.

- [ ] **Step 4: Run the tests and confirm they pass**
  Run: `python3 -I -m unittest test_topics -v`
  Expected: `OK` (10 tests).

- [ ] **Step 5: Checkpoint.** Show `git status --short` and ask the user about committing `quickshell/control/topics.py` and `test_topics.py`.

### Task 2: `Topics` service with live reload, and the dev root

**Files:**
- Create: `quickshell/services/Topics.qml`
- Create: `quickshell/control-dev.qml` (the dev root, never loaded by the live shell)

**Interfaces:**
- Consumes: the Task 1 CLI.
- Produces: the `Topics` singleton (`import qs.services`):
  - `readonly property string root` = parent of `Quickshell.shellDir`;
  - `property var topics: []`;
  - `property string generated`;
  - `property int reloads` (counts finished loads, for testing);
  - `function reload()`.
- Produces: `control-dev.qml`, a `ShellRoot` that for now only does `Component.onCompleted: console.log("topics", Topics.topics.length)`. Task 3 adds the window.

- [ ] **Step 1: Write the check:** a sample `docs/` with copies of the spike's three docs (`/tmp/claude-1000/spike/docs/*.md`) into `~/.config/docs/`.
- [ ] **Step 2: Implement `Topics.qml`:**
  - `Process` + `StdioCollector`, with `JSON.parse` in `onStreamFinished` and `reloads++`;
  - a second `Process` running `["inotifywait","-m","-q","-e","close_write,create,delete,moved_to,moved_from", root + "/docs"]` with a `SplitParser` that restarts a 200 ms `Timer`, which calls `reload()`;
  - `onExited` restarts inotifywait after 1000 ms, the same pattern as `services/Brightness.qml`.
- [ ] **Step 3: Start the dev instance.** In the log, expect `topics 3` and no `WARN`/`ERROR`.
- [ ] **Step 4: Live reload.** `touch ~/.config/docs/audio.md`, then within 1 s the log shows one more reload. Add `log` lines for `reloads` while testing, and remove them afterwards.
- [ ] **Step 5: Editor burst (Review Focus 1).** Open `docs/power.md` in `vim -u NONE`, change a word, `:w`. Expected: exactly **one** extra reload, and the topic count stays 3.
- [ ] **Step 6: The live shell is untouched.** `grep -c Reloading /tmp/runsvdir-user.log` is unchanged from before this task.
- [ ] **Step 7: Checkpoint.** Ask about committing `services/Topics.qml`, `control-dev.qml` and the sample `docs/` (the docs get rewritten in Tasks 5, 6 and 8).

### Task 3: Window, panels and Mocha widgets

**Files:**
- Create: `quickshell/control/ControlCentre.qml` (a `FloatingWindow`, title `"Control centre"`, 1200×760)
- Create: `quickshell/control/SectionList.qml`, `DocPanel.qml`, `FileGroups.qml`
- Create: `quickshell/control/widgets/MochaSlider.qml`, `MochaButton.qml`, `MochaToggle.qml`, `Caption.qml`
- Modify: `quickshell/control-dev.qml` (instantiate `ControlCentre`; add `IpcHandler { target: "control"; function toggle(): void; function open(id: string): void }`)

**Interfaces:**
- Consumes: the `Topics` singleton.
- Produces:
  - `ControlCentre`: `property int current`, `property bool shown`, `function openTopic(id: string)`.
  - `FileGroups`: `property var groups`. It's the default centre content when `topic.controls === ""`, and also the right panel's file list.
  - Widgets, all themed from `Theme`:
    - `MochaSlider { from; to; value; signal moved(real v) }`;
    - `MochaButton { text; signal clicked() }`;
    - `MochaToggle { checked; signal toggled(bool on) }`;
    - `Caption { text }`, the small uppercase overlay0 label.
- **Layout values:**
  - left panel 230 px, mantle;
  - right panel 500 px, mantle, 32 px padding, Markdown at 15 px with `lineHeight: 1.35`, 22 px between blocks. These are the spike values the user approved.
- **Right panel order:**
  1. the topic body;
  2. a red `error` line if one is set;
  3. "FILES", the groups;
  4. under each entry that has `notes`, the folder note rendered as Markdown.
- **Left panel:** each row draws the topic's `icon` (when set) with `String.fromCodePoint(parseInt(icon, 16))` in `Theme.fontIcons`, left of the title.
- **Centre:** the heading, then a `Loader` whose `source` is `Qt.resolvedUrl("sections/" + topic.controls + ".qml")` when `controls` is set, else `FileGroups`.

- [ ] **Step 1: Build it.** Restyle `QtQuick.Controls` templates (`Slider`, `Button`, `Switch`) with `background`/`handle`/`contentItem` overrides. Never use the Basic style's look.
- [ ] **Step 2: Run the dev instance.** Run `ipc … call control toggle`, then screenshot with `grim -o eDP-1`. Expected:
  - three panels;
  - the three sample topics on the left;
  - the right panel matching the approved spike spacing;
  - no WARN/ERROR in the log.
- [ ] **Step 3: Broken doc (Review Focus 2).** Break `docs/power.md`'s front matter (an indent of 3). Expected: the right panel shows the red `line N:` error, and the other topics still work. Restore it.
- [ ] **Step 4: Folder notes.** Create a temporary `wireplumber/NOTES.md` with one line. Expected: it appears under the `wireplumber/` entry in Audio. Delete it.
- [ ] **Step 5: Checkpoint.** Ask about committing.

### Task 4: Keys, the `?` overlay and the self-doc topic

**Files:**
- Create: `quickshell/control/KeyMap.qml`, `quickshell/control/HelpOverlay.qml`
- Create: `docs/control-centre.md` (order 99, icon `F0493`, the cog)
- Modify: `quickshell/control/ControlCentre.qml` (route `Keys.onPressed` through the table)

**Naming:** the file is `KeyMap.qml`, not `Keys.qml`. A component called `Keys` would shadow QtQuick's `Keys` attached property for every file in `control/`.

**Interfaces:**
- Produces: `KeyMap.qml` with `readonly property var bindings`, a list of `{ keys: [string], action: string, help: string }`, and `function handle(event, cc): bool`.
- **v1 bindings** (exact):

  | Keys | Action |
  |---|---|
  | `j` / Down | next section |
  | `k` / Up | previous section |
  | `1`–`9` | jump to the Nth section |
  | Tab | cycle focus left → centre → right |
  | `r` | reload (`Topics.reload()`) |
  | `?` | toggle the overlay |
  | `q` / Esc | close the overlay if it's open, else hide the window |

- `HelpOverlay` renders `KeyMap.bindings` and nothing else, so the help can't drift.
- `docs/control-centre.md` lists the app's own paths, grouped `ui:` (`quickshell/control/`), `services:` (`quickshell/services/Topics.qml`), `scripts:` (`quickshell/control/topics.py`), `system:` (the Task 7 helper and polkit rule), `keys:` (`river/keybindings.conf`, note: the block heading Task 9 adds). The body covers:
  - how the app works;
  - how to add a topic;
  - how to add controls (`sections/<Id>.qml`, PascalCase);
  - the usual group names (config, services, scripts, ui, keys, logs, system);
  - the front-matter schema from DESIGN.md §5.2;
  - tips: `r`, `?`, editing a doc reloads live.

- [ ] **Step 1: Implement it**, then press each binding in the dev window. Expected: every action works, and `?` shows exactly the table above.
- [ ] **Step 2: Self-doc check.** The "Control centre" topic appears last, and none of its paths show as `missing`. The Task 7 helper path may show `missing` until Task 7; note that in the doc's `system:` group.
- [ ] **Step 3: Checkpoint.** Ask about committing.

### Task 5: Audio section and doc

**Files:**
- Create: `quickshell/control/sections/Audio.qml`
- Modify (rewrite): `docs/audio.md`. Front matter as in DESIGN.md §5.2, plus `checks: [sv: pipewire, sv: wireplumber, sv: pipewire-pulse]`. The keys note is the exact `keybindings.conf` heading `Volume / brightness / media keys (normal + locked, per river's own docs)`. The body draws on `wireplumber/wireplumber.conf.d/*.conf`, `sv/*/run` comments, `waybar/scripts/volume-status.py` and the 2026-11-11 commits.

**Interfaces:**
- Consumes: `Audio` (existing: `sink`, `source`, `volume`, `muted`, `micVolume`, `micMuted`, `displayName(node)`), `Pipewire.nodes`, `Pipewire.preferredDefaultAudioSink`/`Source`, `PwObjectTracker`, and the Task 3 widgets.
- **Content, top to bottom:**
  1. OUTPUT: every `isSink && !isStream && audio` node, with the default marked; clicking sets `preferredDefaultAudioSink`;
  2. a volume `MochaSlider` 0–1.3 with a 100% tick (same rule as the OSD), and a mute toggle;
  3. INPUT: the same list for sources (`!isSink && !isStream && audio`), plus mic volume 0–1.0 and mute;
  4. for a Bluetooth default sink, the codec from `sink.properties["api.bluez5.codec"]`.
- **Every control shows the equivalent command under it** (spec §2 anti-goal: no invisible changes), e.g. `wpctl set-default <id>`, `wpctl set-volume @DEFAULT_AUDIO_SINK@ 0.85`, `wpctl set-mute @DEFAULT_AUDIO_SOURCE@ toggle`. It does that even though the change itself goes through the PipeWire API.

- [ ] **Step 1: Implement it.** Check in the dev window that clicking the other output changes `wpctl status`'s `*`. Set it back afterwards.
- [ ] **Step 2: Volume.** Dragging moves `wpctl get-volume @DEFAULT_AUDIO_SINK@` and the OSD shows the card. Restore the original value.
- [ ] **Step 3: Mute toggles** for both the output and the mic, each restored.
- [ ] **Step 4: Bluetooth.** Ask the user to connect headphones. The codec line appears; skip it if no device is available.
- [ ] **Step 5: Review Focus 5.** With the Audio section open, first note both volumes, wait 5 s, then `sv restart ~/.local/sv/wireplumber`. Expected: the lists empty and refill, there are no `TypeError` lines in the log, and both volumes are unchanged afterwards.
- [ ] **Step 6: Checkpoint.** Ask about committing.

### Task 6: Display section, wallpaper mechanism and doc

**Files:**
- Create: `quickshell/control/sections/Display.qml`
- Modify: `quickshell/services/Brightness.qml`: add `function set(fraction: real)`, which runs `Quickshell.execDetached(["sh","-c","brillo -S " + Math.round(fraction*100) + " && brillo -O"])`. This reloads the live shell; check the OSD afterwards.
- Modify: `sv/swaybg/run`: the image is `$HOME/.local/state/wallpaper/current` if it exists, else `$HOME/Pictures/wallpaper.png`. Update its comment.
- Modify (rewrite): `docs/display.md` (adds `checks: [sv: swaybg, sv: kanshi]`).

**Interfaces:**
- Consumes: `Brightness.level`, `Brightness.set()`, and the widgets.
- **Wallpaper switch** [plan decision; the spec left it open]: picking an image runs `mkdir -p ~/.local/state/wallpaper && ln -sfn <image> ~/.local/state/wallpaper/current && sv restart ~/.local/sv/swaybg`. The app shows that command under the grid.
- **Content:**
  1. a brightness slider (0.01–1.0), with its command (`brillo -S N && brillo -O`) shown under it;
  2. WALLPAPER: a grid of `~/Pictures/wallpapers/*.{png,jpg,jpeg,webp}` thumbnails (`Image`, `sourceSize` 240×135, `asynchronous: true`), with the current one outlined in mauve;
  3. OUTPUTS: read-only cards from `wlr-randr --json` (name, mode, refresh, scale, enabled), refreshed when the section opens.

- [ ] **Step 1: Brightness.** The slider moves the backlight, `brillo -G` agrees, and the OSD shows. Restore it.
- [ ] **Step 2: Wallpaper.** Pick an image: the wallpaper changes, `readlink ~/.local/state/wallpaper/current` matches, and `sv status swaybg` shows a fresh start. Then `rm ~/.local/state/wallpaper/current && sv restart ~/.local/sv/swaybg` must bring back `~/Pictures/wallpaper.png` (the fallback).
- [ ] **Step 3: Outputs.** The card shows `eDP-1 2560x1440 120 Hz scale 1.3`.
- [ ] **Step 4: Checkpoint.** Ask about committing.

### Task 7: Root helper, polkit rule, install.sh support, charge-limit at boot

**Files:**
- Create: `system/usr/local/libexec/control-centre-helper` (POSIX sh, executable)
- Create: `system/etc/polkit-1/rules.d/50-control-centre.rules`
- Modify: `system/install.sh`: accept `usr/local/libexec/*` alongside `etc/*`, in `norm()`, the status listing and the per-file hint (`-> used by the control centre's pkexec calls`).
- Modify: `system/etc/rc.local`: apply the saved limit at boot.
- Test: `system/test-control-centre-helper.sh`

**Plan decision (this corrects DESIGN.md §8):** polkit reads `.policy` files only from `/usr/share/polkit-1/actions`, not from `/etc`. So there is **no .policy file**. pkexec's built-in action `org.freedesktop.policykit.exec` already asks for the admin password, and the rule only upgrades it to "keep" for this one program:
```js
polkit.addRule(function(action, subject) {
	if (action.id == "org.freedesktop.policykit.exec" &&
	    action.lookup("program") == "/usr/local/libexec/control-centre-helper" &&
	    subject.local && subject.active && subject.isInGroup("wheel"))
		return polkit.Result.AUTH_ADMIN_KEEP;
});
```

**Interfaces:**
- Produces: `control-centre-helper [--dry-run] charge-limit N` (N an integer 60–100), `control-centre-helper [--dry-run] power-profile P` (P must be one of `/sys/firmware/acpi/platform_profile_choices`).
  - Exit 0 on success. Exit 2 with a usage message for anything else, having written nothing.
  - `--dry-run` prints the writes it would make (`write <value> -> <path>`) and touches nothing.
  - `charge-limit` writes the sysfs threshold **and** `/etc/control-centre/charge-limit` (creating the directory, 755/644).
- Produces: an `rc.local` line:
  ```sh
  [ -r /etc/control-centre/charge-limit ] && cat /etc/control-centre/charge-limit > /sys/class/power_supply/BAT0/charge_control_end_threshold
  ```

- [ ] **Step 1: Write the failing test** `test-control-centre-helper.sh` (plain sh; prints PASS/FAIL per case; non-zero exit on any failure), running the *staged* helper with `--dry-run`:
  - `helper_accepts_valid`: `charge-limit 80` → exit 0, and the output contains `write 80 -> /sys/class/power_supply/BAT0/charge_control_end_threshold` and `write 80 -> /etc/control-centre/charge-limit`; `power-profile quiet` → exit 0.
  - `helper_rejects_bad_input` (Review Focus 4): `charge-limit 59`, `101`, `abc`, `"60; rm -rf /"`, `charge-limit 80 extra`, `power-profile turbo`, `reboot`, no arguments → each exits 2, with empty stdout.
- [ ] **Step 2: Run it and confirm it fails.** `sh system/test-control-centre-helper.sh`. Expected: FAIL (the helper doesn't exist yet).
- [ ] **Step 3: Implement the helper.**
  - Validate with `case` patterns.
  - Use only absolute paths.
  - Set `PATH=/usr/bin:/bin` at the top.
  - Never `eval`.
- [ ] **Step 4: Run it and confirm it passes.** Expected: every case PASS, exit 0.
- [ ] **Step 5: The user installs it.** Hand over `system/install.sh usr/local/libexec/control-centre-helper etc/polkit-1/rules.d/50-control-centre.rules etc/rc.local` for the user to run.
- [ ] **Step 6: The real thing, once, through pkexec.**
  1. `pkexec /usr/local/libexec/control-centre-helper charge-limit 100`: expect the polkit agent's dialog, exit 0, and the threshold still reading 100.
  2. Run it again within 5 minutes: no dialog this time (`auth_admin_keep`).
- [ ] **Step 7: Checkpoint.** Ask about committing.

### Task 8: Power section, Battery service and doc

**Files:**
- Create: `quickshell/services/Battery.qml`
- Create: `quickshell/control/sections/Power.qml`
- Modify (rewrite): `docs/power.md` (adds `checks: [sv: battery-notify]`, and `system:` with the helper and the rule)

**Interfaces:**
- Produces: the `Battery` singleton:
  - paths (overridable for tests): `property string batDir: "/sys/class/power_supply/BAT0"`, `acDir: ".../AC0"`, `profileDir: "/sys/firmware/acpi"`;
  - `property bool active` (refreshes every 5000 ms while true; the section sets it);
  - read-only values: `present`, `percent: int`, `onAc: bool`, `status: string`, `powerW: real`, `energyNowWh`, `energyFullWh`, `energyDesignWh: real`, `healthPct: int`, `minutesLeft: int` (-1 = unknown), `chargeLimit: int` (-1 = unsupported), `profile: string` ("" = unsupported), `profiles: var`;
  - `function refresh()`.

  "Discharging" = `onAc === false`, the same rule as `river/battery-notify.py`.
- Produces: `Power.qml`:
  1. stat cards for %, state, draw W, time to full/empty, health (full ÷ design, shown as `76.7 / 76.0 Wh`);
  2. CHARGE LIMIT: a slider 60–100 with step 5, applied on release by `pkexec /usr/local/libexec/control-centre-helper charge-limit N`;
  3. POWER PROFILE: three buttons from `profiles`, running `… power-profile P`.

  Each action shows its exact command line under the control, and `refresh()` runs after the process exits. Exit 126 or 127 (dialog dismissed or not authorised) shows "cancelled", and the control returns to the real value.

- [ ] **Step 1: Implement it.** The dev window shows real values matching `cat` of the sysfs files (W = `power_now`/1e6, Wh = `energy_*`/1e6).
- [ ] **Step 2: Charge limit.** Set 80: the dialog appears and the threshold reads 80. Set 100 again. Cancel the dialog once: expect "cancelled", and the slider back at 100.
- [ ] **Step 3: Profile.** Switch to quiet, then back to balanced. `platform_profile` matches each time.
- [ ] **Step 4: Review Focus 5.** In the dev root, set `Battery.batDir` to a temp dir with only `capacity` and `status`, and `profileDir` to an empty dir. Expected: "not available" for the limit and the profile, "—" for missing stats, and no WARN/ERROR. Restore it.
- [ ] **Step 5: Checkpoint.** Ask about committing.

### Task 9: Go live

**Files:**
- Modify: `quickshell/shell.qml`: add `LazyLoader { id: cc; source: "control/ControlCentre.qml" }` and the `IpcHandler { target: "control" … }`, both moved from `control-dev.qml`. `toggle()` sets `cc.active = true` before showing.
- Modify: `river/keybindings.conf`: under the mic-mute block, add
  ```
  map | normal | None | XF86Launch1 | spawn qs ipc call control toggle
  ```
  Edit the Armoury Crate comment there to say it opens the Control centre. Then run `river/gen-keybindings.sh --apply`. Never edit `river/init`'s generated block by hand.
- Modify: `river/init`, by hand outside the generated block, next to the rofi rule (line ~351): `riverctl rule-add -app-id <id> float` plus `dimensions 1200 760`. Find `<id>` first with `lswt` or the foreign-toplevel reader `river/fullscreen-focused.py`, adapted to print app-ids. Apply it live with the same `riverctl` lines.
- Delete: `quickshell/control-dev.qml`, once the live shell works.

- [ ] **Step 1: Before the change,** note the OSD works (a brightness nudge, then restore it).
- [ ] **Step 2: Wire it in.** The live log shows `Reloading`, then `Configuration Loaded`, with no WARN.
- [ ] **Step 3: OSD regression.** A brightness nudge and a mic toggle still show cards. Restore both.
- [ ] **Step 4: The key.** The user presses Armoury Crate: the window opens floating at 1200×760, and pressing it again hides it.
- [ ] **Step 5: Memory.** `ps -o rss= -p <live quickshell pid>` before and after the first open. Report both numbers to the user.
- [ ] **Step 6: Clean up.** Kill the dev instance by PID, and delete `control-dev.qml`.
- [ ] **Step 7: Checkpoint.** Ask about committing; this is the natural place to suggest one commit per finished task if any are still uncommitted.
