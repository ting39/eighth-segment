## 2026-10-27 — `pgrep -f`/`pkill -f` with a pattern that appears in your own command kills your own shell
Context: killing a background sweep with `for p in $(pgrep -f "langlocks.mjs p2"); do kill $p; done` inside a bash -c
whose own command line contains the same text → exit 144, the rest of the command never ran (silent partial state).
Fix: select by a regex that cannot match its own text, e.g. `ps -eo pid,args | awk '/node tools\/langlocks.mjs p2 / {print $1}'`
(the escaped slash in the awk source does not match the unescaped path), or keep PIDs when starting jobs.
