## 2026-10-27 — `pgrep -f`/`pkill -f` with a pattern that appears in your own command kills your own shell
Context: killing a background sweep with `for p in $(pgrep -f "langlocks.mjs p2"); do kill $p; done` inside a bash -c
whose own command line contains the same text → exit 144, the rest of the command never ran (silent partial state).
Fix: select by a regex that cannot match its own text, e.g. `ps -eo pid,args | awk '/node tools\/langlocks.mjs p2 / {print $1}'`
(the escaped slash in the awk source does not match the unescaped path), or keep PIDs when starting jobs.

## 2026-10-28 — `route.mjs --from N` replayed stale segments silently
A room edit (steps added to t3) changed physics BEFORE the resume index, so the reused stored inputs for goals
19-22 replayed differently and skipped a stray point; the failure only surfaced 130 goals later as an
unsolvable "event:point". Fix: route.mjs now re-checks each reused segment's goal and re-solves from the first
one that no longer reaches it. Rule: after editing a room, resume the route from the first goal that touches
that room, not from where the last failure was.

## 2026-10-28 — repeat: `until ! pgrep -f X` waits forever (matches its own shell)
Round 2 left 14 wait loops running for hours: the loop's own `bash -c` command line contains the pattern, so
`pgrep -f` always finds it. Wait on the background task's notification instead, or match with an awk regex that
excludes the waiter (`ps -eo args | awk '/[n]ode tools\/route/'`). Kill strays by PID after a session.
