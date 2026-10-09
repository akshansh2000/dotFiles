# Claude Code on the Krypton account.
#
# Krypton work (everything under ~/Code/krypton) runs on Krypton's Claude
# account; the rest of the system stays on the personal one. CLAUDE_CONFIG_DIR
# points Claude Code at a separate config dir - its own login, settings,
# plugins, MCP servers and memory - and it is set for this one process only,
# so it never leaks into the shell and a plain `claude` stays personal.
#
# `command claude` goes straight to the binary, past the `claude` function
# beside this one, so its "you are on the personal account" hint never fires
# for a Krypton session. Setup notes: ~/Code/krypton/CLAUDE.md.
function claudek --wraps claude --description 'Claude Code on the Krypton account'
    CLAUDE_CONFIG_DIR=$HOME/.claude-krypton command claude $argv
end
