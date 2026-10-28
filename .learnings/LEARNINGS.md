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

## 2026-10-28 — a new door can leak a puzzle through the respawn rule
Respawn = the room's spawn nearest to where you entered. Adding an east door to BABEL CLOCK and ATTRACT MODE made
the nearest spawn one *behind* each room's puzzle: enter, die, collect the point. Found by a random-play luck test
(a "hit" that was really in the neighbouring room). After adding any door, list door → nearest spawn for every
room and add a spawn on the door's side if needed.

## 2026-10-28 — never chain `npm test | grep … && git push`
`grep` succeeds when it prints the ✖ line, so the push ran with a failing test (fixed 10 minutes later).
Gate pushes on the test's own exit code: `npm test >log 2>&1 && git push`, then read the log.

## 2026-10-28 — a digit "set in the rock" must still be carved
Display cells drawn over '#' fail `display cells never overlap static tiles`. To embed a digit in rock (ENCORE's
PLACE VALUE pair), `carve_cells(..., corners=False)`: corners stay rock, so every dark bar is a sealed hole and only
the bar you mean to be the door connects anything. Then check every path through the digit, not just the door.

## 2026-10-28 — luck.mjs counts any point in the room
`node tools/luck.mjs e1 … event:point` read 91.5% because random players walk into ENCORE's *existing* chamber
point. For a second point in a room, pin the lock in a unit test (which values open it) instead, or start the
luck test past the old point.
