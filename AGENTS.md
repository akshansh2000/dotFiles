# User and system context

- This is a personally maintained Void Linux (runit) configuration for a
  keyboard-first, lightweight Wayland desktop. Preserve its minimal,
  transparent, user-controlled character; avoid proposing heavyweight desktop
  environments or systemd-based solutions unless specifically requested.
- The active desktop is River + wideriver (built from source into /usr/local,
  supervised at ~/.local/sv/wideriver; rivertile is the fallback), Waybar, Rofi, Foot (with Alacritty
  as fallback), and Fish. The machine is an ASUS hybrid-GPU laptop using the
  AMD Cezanne iGPU; the NVIDIA RTX 3060 Mobile is deliberately inactive.
- The user is an experienced Linux power user who values clear reasoning,
  small composable scripts, keyboard workflows, and careful integration work.
  Explain non-obvious tradeoffs, but do not oversimplify or assume a GUI-first
  workflow.
- Maintain the shared Catppuccin Mocha theme through `theme/colors.sh` and
  `theme/apply-theme.sh`; do not hand-edit generated themed output when a
  template/source exists.
- Existing comments capture hard-won operational knowledge (notably D-Bus
  lifecycle, runit user services, GPU selection, and XWayland constraints).
  Read and preserve them when changing related configuration.
- Favor reversible, incremental changes and validate them in proportion to
  risk. Treat old i3/dwm/master dotfile trees as historical/reference material
  unless asked to revive or edit them.

# Showing images to the user

- Show every image (screenshots, previews, rendered comparisons, charts)
  directly in the session, without being asked: the user runs the agent inside
  tmux in foot, which draws sixel graphics. Use the `terminal-image-viewer`
  skill (`~/.claude/skills/terminal-image-viewer/`): `chafa -f sixels
  --passthrough none <absolute path>` in a reusable side pane split with `-d`
  next to `$TMUX_PANE` and marked with the `@image_viewer` pane option.
  Never draw in the agent's own pane, and never guess pane IDs.
- Only when `$TMUX_PANE` is empty (not inside tmux): give the absolute path
  and offer `setsid -f xdg-open <path>`.
- Several images: combine them into one with `magick ... +append` / `-append`
  and show that.
- Icon glyphs in the Unicode Private Use Area U+E000-U+F8FF (Font Awesome /
  older Nerd Font icons) are UNRELIABLE through an agent: they are invisible
  in the agent's own tool output, a typed-out escape can be silently turned
  into the glyph on its way into a file, and some have been lost outright
  (waybar's volume/battery icon lists were found empty on 2026-10-09). So:
  name them by codepoint in chat; put them into files only from a script that
  builds them from the number (python chr(0xF240)); verify afterwards with a
  codepoint dump; and when the user needs to SEE one, render it to an image
  with `fc-match -f '%{file}' 'Symbols Nerd Font'` and show that.

# Working agreement

- Discuss before changing anything: for every change to files, configs,
  services or system state, first lay out the options with pros and cons,
  how each would work, and the exact changes - then wait for an explicit
  go-ahead. Investigating needs no approval: reading, measuring, and tests
  in a throwaway headless river or on an isolated tmux server.
- An approval covers what was agreed. A fix found along the way that stays
  within that scope may be applied, but say so; anything wider (other
  files, new behaviour, new packages) goes back to discussion first.
- Commit and push only when asked.
