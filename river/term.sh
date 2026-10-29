#!/bin/sh
# Start a terminal program only once the window has its real size (2026-10-17).
# foot spawns its child at once, on a pty sized from its default window
# (80x24), and settles only afterwards: on the tile size (SIGWINCH), and then
# again a few ms later, once the fractional scale (1.3 here) is known and the
# cell size changes - in a headless river at 1.3: 80 -> 87 -> 82 columns.
# tmux started on the first size drew one wrong frame (the "small window, then
# resize" flash on Super+Return); started on the second, fish drew tide's
# prompt 5 columns too wide and it wrapped until the next redraw.
# So: wait for the first SIGWINCH (at most 0.3 s, for a window that is never
# resized), then until 50 ms pass with no further one, and exec then.
# Measured: the program starts ~90 ms after the spawn, at its final size.
#   usage: foot term.sh tmux
got=0
trap 'got=1' WINCH
sleep 0.3 & wait $!; kill $! 2>/dev/null
while [ $got = 1 ]; do
	got=0
	sleep 0.05 & wait $!; kill $! 2>/dev/null
done
trap - WINCH
exec "$@"
