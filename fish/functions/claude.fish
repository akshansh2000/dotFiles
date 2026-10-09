# Claude Code on the personal account, with a reminder inside ~/Code/krypton.
#
# Krypton work belongs to the Krypton account (`claudek`), but the personal
# account stays usable there for a quick look. So this only prints a one-line
# hint, on stderr, when a personal session starts anywhere under
# ~/Code/krypton, and then runs Claude exactly as before.
#
# No --wraps: a function named after the command it wraps would wrap itself.
# The binary's own completions still apply, because they are keyed by name.
function claude --description 'Claude Code (personal account)'
    if not set -q CLAUDE_CONFIG_DIR
        and string match -qr -- "^$HOME/Code/krypton(/|\$)" $PWD
        echo "claude: personal account; Krypton work runs on `claudek`" >&2
    end
    command claude $argv
end
