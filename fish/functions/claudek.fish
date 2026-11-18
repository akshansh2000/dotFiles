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
#
# GITHUB_PERSONAL_ACCESS_TOKEN feeds the GitHub plugin's MCP server (its
# .mcp.json sends "Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}"). It is taken from
# the gh CLI login (akshansh2000) at launch, for this process only, and never
# written to disk. Note: every tool subprocess of the session can read it.
function claudek --wraps claude --description 'Claude Code on the Krypton account'
    set -l gh_token (gh auth token 2>/dev/null)
    CLAUDE_CONFIG_DIR=$HOME/.claude-krypton GITHUB_PERSONAL_ACCESS_TOKEN=$gh_token command claude $argv
end
