# dotFiles: river

A keyboard-first Wayland desktop on **Void Linux** (runit, no systemd), themed
**Catppuccin Mocha** from a single palette file. This branch is the whole
`~/.config` of the machine, tracked through a whitelist `.gitignore`.

| | |
|---|---|
| compositor | river 0.3 + wideriver (layouts and borders), rivertile as fallback |
| bar / launcher | Waybar with custom scripts (wifi, bluetooth, volume, battery), Rofi for every menu |
| terminal / shell | foot (alacritty as fallback), fish + tide |
| login | greetd + tuigreet, with `river/session-wrapper.sh` as the session |
| idle / lock | swayidle + waylock + wlopm, and lid handling in `river/lid.sh` |
| services | runit user services in `sv/`, run by `runsvdir ~/.local/sv` |
| browser | Zen (`zen-rice/`), Firefox (`firefox/`), Tridactyl, local startpage |
| hardware | ASUS hybrid laptop on the AMD iGPU; NVIDIA blacklisted, keyboard backlight over hidraw |

The other branches (`master`, `dwm`, `i3`) are older, unrelated setups. This
branch is an orphan and shares no history with them.

## Layout

- `theme/`: `colors.sh`, `fonts.sh` and `gtk.sh` are the only source of
  colours, fonts and GTK names. `apply-theme.sh` renders every `*.tmpl` next to
  its output and reloads what it can. **Rendered files are not in the repo.**
- `river/`: `init`, `keybindings.conf` (the master copy;
  `gen-keybindings.sh --apply` writes the block in `init`), session, idle, lid
  and keyboard-backlight scripts, plus `river-state/` (a tiny river-status
  client in C).
- `sv/`: runit user services. `~/.local/sv` is a symlink to this directory.
- `applications/`: Zen launchers. `~/.local/share/applications/zen*.desktop`
  are symlinks to these.
- `system/`: copies of the files installed under `/etc`, plus `packages.txt`
  and `services.txt`. See [System files](#system-files).
- `AGENTS.md`: working rules for coding agents on this machine.

Most scripts carry a header comment explaining why they exist. Read those
before changing anything; they record the non-obvious failures.

## Fresh install

1. Packages and system services:
   ```sh
   xargs -a ~/.config/system/packages.txt sudo xbps-install -S
   for s in $(cat ~/.config/system/services.txt); do sudo ln -s /etc/sv/$s /var/service/; done
   ```
   `agetty-tty1` must stay disabled, because greetd takes VT1.
2. System files: run `~/.config/system/install.sh` with no arguments to see
   the status, then pass each file to install it.
3. Links back from outside `~/.config`:
   ```sh
   ln -s ~/.config/sv ~/.local/sv
   ln -s ~/.config/applications/zen.desktop ~/.config/applications/zen-link.desktop ~/.local/share/applications/
   ```
4. Render the theme: `~/.config/theme/apply-theme.sh`. Add `--gtk` to also
   build the patched Colloid GTK theme into `~/.themes`.
5. Build from source:
   - `river-state`: `make -C ~/.config/river/river-state install` installs it
     to `~/.local/bin`.
   - wideriver 1.3.1: built into `/usr/local`; needs `gcc make pkg-config
     wayland-devel`.
6. Not vendored here, so install them by hand:
   - the Catppuccin Mocha Dark cursor theme into `~/.local/share/icons/`;
   - uosc 5.13 and thumbfast into `~/.config/mpv/`;
   - the fish plugins: `fisher update` (from `fish_plugins`), then
     `tide configure`.
7. Browser profiles, which are linked rather than copied:
   - Firefox: link `user.js` and `chrome/` from `~/.config/firefox/` into the
     profile.
   - Zen: link `user.js` and `chrome/userChrome.css` from `~/.config/zen-rice/`
     into the profile.
   - The startpage is served on 127.0.0.1:8123 by `sv/startpage`.

## System files

`system/etc/...` mirrors `/etc/...`, and the repo copy is the source: edit it
here, then run `system/install.sh <file>`, which shows the diff, asks, and
installs the file as root. These are **copies, not symlinks**. Every one is
read by root (or polkitd) and can make root run things, so a link into `$HOME`
would let anything running as this user bypass sudo. polkitd couldn't follow
one anyway, because `$HOME` is 0700.

After installing or removing packages, run `system/update-lists.sh` and
commit the changes.
