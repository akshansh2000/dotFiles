#!/usr/bin/env fish

# --- D-Bus session bus ---
# Has to be exported here, before `river` is launched from this shell -
# river itself, and anything it spawns via riverctl keybindings (your
# terminal, rofi, etc.), inherit river's own process environment, which is
# whatever it was at the moment fish exec'd it. Setting this from inside
# river/init only reaches the init script's own children (waybar, and
# runsvdir with the services it supervises), not river itself or anything river spawns
# directly - confirmed the hard way.
#
# The cache/ping logic itself moved to ~/.config/river/dbus-address.sh so
# that greetd's session wrapper can share it: started from a display manager
# there is no login shell, so this file never runs and the bus would other-
# wise never be set up. Guarded so opening more terminals after river's
# already running doesn't do anything (they've already inherited it), and so
# a bus inherited from the greetd session isn't replaced here.
if not set -q DBUS_SESSION_BUS_ADDRESS
	set -gx DBUS_SESSION_BUS_ADDRESS (~/.config/river/dbus-address.sh)
end

# Theme (colors + monospace font) and custom PATH entries (managed via the
# Super+Shift+D rofi menu). Sourced unconditionally since fish reads
# config.fish for every invocation, not just interactive ones - unlike
# bash's split .bashrc/.bash_profile.
source ~/.config/theme/colors.fish
source ~/.config/theme/fonts.fish
source ~/.config/path/build-path.fish

# --- runit user services ---
# `sv` looks in /var/service unless SVDIR says otherwise, so without this every
# check of a per-session service (mako, kanshi, cliphist, polkit-agent, ...)
# needs its full path spelled out. Set here rather than in river/init because
# it is only ever read by the `sv` command typed in a shell - the supervisor
# itself is started with an explicit directory argument and does not need it.
set -gx SVDIR ~/.local/sv

# --- gutenprint module path ---
# Void's gutenprint-5.3.4_1 baked the literal, unexpanded autoconf string
# `${exec_prefix}/lib64/gutenprint/5.3/modules` into libgutenprint as its
# module directory, so it finds no driver modules, ends up with an empty
# printer list and aborts on an assertion (print-list.c:212). Pointing it at
# the real directory is the only thing standing between that and a SIGABRT.
#
# This covers escputil (nozzle checks, head cleaning) and anything else that
# links gutenprint from the session. It does NOT cover printing: cupsd is a
# system daemon and never reads this file, so the same variable is set again
# for filters via `SetEnv` in /etc/cups/cups-files.conf. Both are needed.
set -gx STP_MODULE_PATH /usr/lib/gutenprint/5.3/modules

# --- editor ---
# Zed (GUI, ~/.local/opt/zed.app) is the day-one editor; Neovim takes over
# once it is set up. `--wait` keeps the caller blocked until the tab is closed,
# which is what git, Claude Code's Ctrl+G and anything else using $EDITOR need -
# without it they read the file back before it has been edited. Needs a
# Wayland session: from a bare TTY or over ssh, use `nvim` explicitly.
set -gx EDITOR "zed --wait"
set -gx VISUAL $EDITOR

# disable fish help message
set fish_greeting ""

# fix fish/tide inverted > issue
set -U fish_key_bindings fish_default_key_bindings


# bun
set --export BUN_INSTALL "$HOME/.bun"
set --export PATH $BUN_INSTALL/bin $PATH

# --- fzf ---
# Ctrl-R: fuzzy history (replaces fish's own history pager)
# Ctrl-T: fuzzy-pick a file, insert its path at the cursor
# Alt-C:  fuzzy-pick a directory, cd into it
#
# `fzf --fish` prints the bindings for the fzf binary actually installed, so
# they never drift from its version (unlike a vendored copy or a plugin).
# Must stay BELOW the `set -U fish_key_bindings` line above: setting that
# variable re-runs fish's default bindings and would wipe these.
#
# fd instead of fzf's built-in walker: it skips .gitignore'd paths, so a
# Krypton repo lists its source, not node_modules/.venv/out. --hidden keeps
# dotfiles in (most of this machine's config lives in dot-dirs); .git is
# excluded by hand because it is never gitignored.
#
# Colours are Catppuccin Mocha from colors.fish (sourced above), so a palette
# change in theme/colors.sh reaches fzf on the next shell - no template needed.
if status is-interactive
    set -gx FZF_DEFAULT_COMMAND 'fd --type f --hidden --exclude .git'
    set -gx FZF_CTRL_T_COMMAND $FZF_DEFAULT_COMMAND
    set -gx FZF_ALT_C_COMMAND 'fd --type d --hidden --exclude .git'
    set -gx FZF_DEFAULT_OPTS "--height 40% --layout reverse --border \
--color=bg+:#$THEME_SURFACE0,bg:#$THEME_BASE,fg:#$THEME_TEXT,fg+:#$THEME_TEXT \
--color=hl:#$THEME_RED,hl+:#$THEME_RED,info:#$THEME_MAUVE,prompt:#$THEME_MAUVE \
--color=pointer:#$THEME_ROSEWATER,spinner:#$THEME_ROSEWATER,marker:#$THEME_LAVENDER \
--color=header:#$THEME_RED,border:#$THEME_OVERLAY0,label:#$THEME_TEXT,selected-bg:#$THEME_SURFACE1"
    fzf --fish | source
end
