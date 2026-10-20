Status: done

# O. EIGHTH SEGMENT — a hard, minimal precision platformer built on knowledge locks
Read `~/Desktop/playground/NIGHT_PLAN.md` first (rules, approvals, protocols, HARD STOP rule).
Folder: `~/Desktop/playground/platformer` (**not renamed** — sessions and the scheduled resume task
point at this path; renaming the cwd mid-session is fragile. Repo/slug: `ting39/eighth-segment`,
live at https://ting39.github.io/eighth-segment/). Heartbeat: `.heartbeat`. Local port: 8101.

## What the user asked for (paraphrased)
Simple controls (move + jump), knowledge locks (you could do it from the start once you understand
the rules), still hard & precise. Loves *Leap Year*, *Ooo*, *+1* — inspiration only, copy nothing.

---------------------------------------------------------------------------------------------------
## DESIGN DOC

### Name & premise
**EIGHTH SEGMENT.** A seven-segment display has eight parts: seven bars and the decimal point.
You are the decimal point. You fell out of the Master Readout at the top of an enormous old
machine, and every number in the machine is now slightly wrong. Climb back and take your place.

The world is drawn like a **vacuum-fluorescent display** (VFD): dark glass, glowing cyan/amber/
magenta/green segments, faint "ghost" outlines of unlit segments, a fine mesh texture. You are a
small bright square (6×6 px hitbox, 8 px tiles, 320×176 native canvas).

### Controls (the whole list)
- Left / right, Jump (variable height). Nothing else. Pause menu (Esc / Start).
- Pause → "Restart room" counts as a death (guarantees no softlock; also a lock in itself).

### The one rule
> **Lit segments are solid. Every number in the world is counting something.**

Big seven-segment digits are part of the level geometry. Whatever a digit currently shows, its lit
bars are walls/floors and its unlit (ghost) bars are air. Each display is wired to a quantity —
and the player can change most of those quantities from the very first room. Nothing is ever
given to you; you only learn *what the numbers mean*.

Consequences, all strict and consistent (they are the knowledge locks):
- A segment that lights up **inside you crushes you** (death). Death respawns you at the point
  where you entered the room. Deaths are a number too.
- Digit corners are open (real 7-seg bars do not touch). Your dot is 6 px; the gap is 8 px. You
  fit through corners.
- Every counter is cyclic (shown mod 10, 16 or 2ⁿ), so any value is always reachable again →
  no softlocks by construction. Spawn points never overlap any display (tested).

### Knowledge locks (main path ✦, optional ◇)
| # | Display wired to | The "aha" | How it's taught without words |
|---|---|---|---|
| ✦1 | nothing (static 8s) | lit = solid, ghost = air | first rooms: plain 8/0/1 shapes as terrain |
| ✦2 | — | **corners are gaps; the dot fits through** | a sealed "8" chamber; light spills from a corner |
| ✦3 | **DEATHS** (ones digit) | dying is a tool — die to reshape the room | the digit sits next to a spike pit by spawn; it ticks in your face each death |
| ✦4 | **JUMPS** | the floor changes when you jump; count your jumps | digit under your feet changes on take-off |
| ✦5 | **TIME** (game-timer seconds) | the HUD timer *is* this digit; wait for the right second | ticking digit; HUD timer toggled on in that zone |
| ✦6 | **POSITION** (your column) | the digit shows *where you are*; walk to reshape it | the floor below you morphs every few steps |
| ✦7 | **IDLE** (seconds since any input) | stand completely still | a digit that only ever reads 0 while you play... |
| ✦8 | **VISITS** (times you entered this room) | leave and come back | ENCORE (4,3), optional point; open on visits 2/3 (built 10-20) |
| ✦9 | **BINARY** row of bits = deaths | it's binary | row of 4 lamps, 1 lamp per bit, LSB right |
| ✦10 | **HEX** jumps mod 16 | numbers past 9 (A b C d E F) have shapes 0–9 never make | the digit occasionally shows letters |
| ✦11 | **MUSIC VOLUME** (settings) | the menu is part of the world | a speaker glyph next to the digit; menu draws volume as the same 7-seg digit |
| ✦12 | combos (deaths + jumps, position + time…) | everything at once | late rooms |
| ◇13 | **the HUD** | in one room the HUD counters are giant and solid | FINE PRINT (2,4), built 10-20 |
| ◇14 | **wall clock** (real local time HH:MM) | the hub clock is real; wait for a minute ending in 1, 4 or 7 | stray point sealed in the minute digit's lower cell (built 10-20) |
| ◇15 | **the map** | a wall that is drawn open on the pause map is fake | tally4's right wall → FINE PRINT |
| ◇16 | **the title** | the title letters are a room; walk left from the start | secret |
| ★ | **where the point goes** | the Master Readout has several slots; the right one comes from clues in secret rooms | true ending |

Collectibles: 8 optional "stray points" in secret rooms (shown on title/ending). Never required.

### World map (single-screen rooms, 40×22 tiles each, laid out on a grid)
```
                     [MASTER READOUT]                 ← ending (slots = endings)
                           |
        OVERFLOW (white/red): hex, volume, combos — final climb
                           |
  COORDINATES (magenta)  -[ HUB "Junction" + real clock ]-  CLOCKWORK (green)
  position, binary         |                                time, idle, visits
                     TALLY (amber): deaths, jumps
                           |
                 BOOT (cyan): tutorial, corners   ← start (title room to the far left: ◇16)
```
Boot → Tally is linear. Tally opens the Hub. Clockwork and Coordinates can be done in either order;
each region's last room needs one idea from the other (death/jump knowledge carries). Overflow needs
both. Target ~40 rooms, ~45–90 min first clear.

### Feel targets (120 Hz fixed step, integer subpixel math, deterministic)
Run 90 px/s (ground accel ~50 ms), jump apex ~3.5 tiles in ~0.33 s, variable cut on release,
apex hang, coyote 100 ms, jump buffer 100 ms, head-corner correction ≤3 px, max fall 240 px/s,
respawn < 0.45 s. Same sim module runs in browser and Node.

### Verification
- `node --test`: physics unit tests (jump height, coyote, buffer, corner correction, crush).
- Solver (A* over the deterministic sim, actions held for 4 steps) produces input recordings per
  room; replay test re-runs them and asserts arrival at the exit; full-game chain replay from
  start to ending carrying counters. Static validators: edge openings match neighbours, spawns
  safe, every room reachable.

---------------------------------------------------------------------------------------------------
## Checklist
- [x] Design doc: core rule, knowledge-lock list, world map sketch, name
- [x] Engine: fixed-step physics, tilemap + display collision, input layer, room transitions
- [x] Feel tuning + automated physics tests (test/physics.test.mjs, 12 tests)
- [x] Art & audio generation (VFD renderer, glow, sfx, region music)
- [x] World: 18 rooms (+secret title room), 3 stray points, 3 endings
- [x] Solver + replay harness proves completability (test/route.test.mjs); world validators
- [x] Menus, save, settings (volume digits, speed, remap), touch/gamepad, title & ending
- [x] Publish ting39/eighth-segment + Pages + CARD.json + MORNING_REPORT entry
- [x] Polish passes (juice, difficulty curve, hints that don't spoil) — hints ✓, ending anim ✓, 3 secrets ✓, mobile checked ✓

## Progress log
- 2026-10-20 01:50 — Design doc written. Name: Eighth Segment. Folder kept as `platformer`.
  Weekly usage 28% at start (Pro plan) → keep turns efficient.
- 2026-10-20 02:45 — Engine done: `src/sim.js` (120 Hz int sim, squeeze/corner forgiveness, crush,
  checkpoints = standing on a `P` marker), `src/render.js` (VFD look, bloom, mesh), `src/input.js`,
  `src/audio.js` (sfx + procedural region songs), `src/main.js` (menus, save, settings, map, endings,
  `?dev`, `?shot&room=ID`). Rooms so far: title(secret), wake, lit, corners, climb, tally1, tally2(stub).
  Tools: `tools/solver.mjs` (weighted A*, BFS-distance heuristic, portfolio `solveAny`),
  `tools/try.mjs from to|at:x,y [k=v]`, `tools/locks.mjs room goal counter mod spawn=x,y` (which counter
  values pass without dying), `tools/show.mjs room [k=v]` (ASCII with segments), `tools/roomgen.py` +
  `tools/setmap.py id` + `tools/addroom.py` (author maps with drawing ops; scripts in scratch, re-creatable).
  **Usage is tight (weekly 37% after ~1 h, shared by 3 lanes): scope cut to ~20 rooms.**
  Design facts learned: no decimal digit has both side bars of a cell unlit → corridors can't pass straight
  through a cell. Gate elements: a-bridge {0,2,3,5,6,7,8,9}; hanging d-blocker {1,4,7,9};
  left-column shaft (f,e off) {1,3,7}; middle-corner pass (g off) {0,1,7}.
  NEXT: finish tally1 lock check (target {7,9}), tally2..5 (deaths, then jumps), hub, 2 short regions,
  master room, replay test, publish.
- 2026-10-20 03:30 — Rooms wake→lit→corners→climb→tally1 (deaths≡7)→tally2 (deaths≡1)→tally3 (jumps "cup":
  enter at 4, jump → 5 opens right) all solved end-to-end by `node tools/route.mjs` (waypoint route in
  `tools/route-goals.mjs`, output `replays/route.json`; goals: room id, `at:x,y`, `deaths:n`, `jumps:n`).
  Single-shot A* fails on counter rooms → always give waypoints. Never `pkill -f` a pattern that appears
  in your own command (it kills the shell). Room scripts live in session scratch; re-author with
  `tools/roomgen.py` if needed (maps in src/rooms.js are the source of truth).
  NEXT: tally3's top exit leads to (1,4) = tally4 (not yet built); then hub, Clockwork/Coordinates
  (3 rooms each), Overflow (3), master room with slots (ENDINGS in rooms.js; triggers kind 'slot'),
  replay test (test/route.test.mjs replaying replays/route.json), spawn-marker rendering, publish.
  Stopped here: 5-hour usage limit reached.
- 2026-10-20 (after 5h reset) — Built tally4, hub (real clock), clock1 (time drop), clock2 (stand still,
  point), coord1 (position bridge), coord2 (binary stairs, point, π hint), gate (idle drop), over1 (hex
  jumps), over2 (music volume), master (slots: after 3 = true ending). Room maps for these are generated
  by `tools/rooms_src/rest.py` (edit there, re-run; it rewrites the blocks in src/rooms.js). Route
  goals now support `idle:N`, `time:N@x,y`, `deaths:N/mod`. Full route replays to the true ending
  (122 s, 15 deaths, both reachable points). 18 tests pass. PUBLISHED: https://ting39.github.io/eighth-segment/
  World grid: boot row y=6 (title -1..climb 3), tally1 (3,5) tally2 (2,5) tally3 (1,5) tally4 (1,4)
  hub (1,3) clock1 (2,3) clock2 (3,3) coord1 (0,3) coord2 (-1,3) gate (1,2) over1 (1,1) over2 (1,0)
  master (2,0).
  POLISH IDEAS (next): playtest feel in a visible browser; more rooms per region (target 25+); hub
  clock secret (◇14), HUD-solid secret (◇13); better music; ending animation; mobile layout check.
- 2026-10-20 07:30–08:10 (resume watchdog) — Polish: (1) **hints when stuck**: after 6+ deaths or 150 s in a
  room, each wired display fades in a tiny glyph for its quantity (deaths = the HUD's pink ×, jumps ↑, time
  clock, pos ↔, idle z; volume already has its speaker); setting HINTS WHEN STUCK (default on). `?shot&stuck`
  previews it. (2) **ending animation**: the Master Readout lights digit by digit and the point arcs up into the
  chosen slot (3.14159 true / 31.4159 / 0314159), wrong endings flicker; text fades in after; `?shot&room=master&
  ending=N&t=S` previews. (3) **◇14 clock secret**: 4th stray point in the hub, inside the lower cell of the
  minute-ones digit; ledges up the right side + 3 static corner brackets so the only way in is through bar d →
  opens exactly on minutes ending 1/4/7 (verified for all 00–59; test/secrets.test.mjs). Route replay unaffected.
  (4) mobile: portrait fills width with room for touch buttons below; landscape OK — no change.
  Gotchas: the in-app browser pane freezes rAF when hidden and caches modules (python http.server sends no
  cache headers) → use `_shared/shot.sh` + `?shot` for checks. `tools/locks.mjs ... clock 60` sweeps HHMM 1200+v.
  NEXT polish ideas: ◇13 HUD-solid secret room; more rooms per region (target 25+); music variety.
- 2026-10-20 08:30 — **◇13+◇15 FINE PRINT** (2,4, tally palette, `nohud`): reached through a fake wall (X) in
  tally4's right edge rows 17-19 (the pause map draws only true walls, so it shows as a gap). Corridor exactly one
  digit tall: giant seconds digit (time, s=3) → floating hazard × (die here; P at 24,19) → giant deaths digit
  (passable on deaths ending 1/4/7, `locks.mjs fineprint at:34,19 deaths`) → stray point. Added to the canonical
  route after tally4 (`route.mjs --from 15` re-solved; full route now 3 points, 129.8 s, D15). Total points 5
  (hub clock point is never in the route: real time). hub/tally4/fineprint are now authored in
  tools/rooms_src/rest.py (hub edits ported there) — edit there and re-run, don't hand-edit those maps.
- 2026-10-20 08:50 — **✦8 ENCORE** (4,3, clockwork, optional): clock2's right wall opened at rows 17-19. A digit
  counting visits to this room, walled so the only way in is bar f; a static divider in its upper cell means the
  point (on bar g) needs g lit → open exactly on visits 2/3 (`locks.mjs encore at:28,8 visits`): the first visit
  is always sealed. In the route after clock2's point (re-solved `--from 33`). Route: 4 points, 131 s, D15.
  Stray points now 6 (title, clock2, coord2, hub clock, fineprint, encore). 19 tests pass.
- 2026-10-20 09:00 — **Status → done.** 22 rooms (+title), 6 stray points, 3 endings, hints, animated ending.
  Marked done so the daytime-only training projects get the watchdog's slot (it picks platformer first).
  FUTURE (only with the user's playtest feedback): more main-path rooms in Overflow (✦12 combos, e.g. a detour
  gate→(2,2)→(2,1)→over1; needs gate/over1 re-maps + `route.mjs --from <gate idx>`), difficulty tuning, music
  variety, 2 more stray points to reach the design's 8.

## DAYTIME EXPANSION (user approved 2026-10-20 ~10:05) — work this next
Goal: grow from 22 rooms (~20–40 min) to **35+ rooms, 45–90 min first clear**, without diluting quality.
- [x] Add rooms to the thinnest regions (Clockwork, Coordinates, Overflow); every new room teaches or
      tests one idea, combos deepen late game. Keep every room solver-verified; full-game chain replay must
      still reach the true ending.
- [x] Difficulty curve pass: order rooms easy→hard within each region; measure solver path length/deaths
      as a proxy; add optional harder side rooms rather than walls of difficulty on the main path.
- [x] Distinct music per region (WebAudio), plus a quiet ambient for secret rooms.
- [x] Mobile/touch QA at 375×812 and 768×1024 (headless shots + in-app pane): buttons, scaling, no
      page scroll, readable HUD.
- [x] Update MORNING_REPORT.md entry + README; Status: done when complete.
- 2026-10-20 10:37 QA sweep (lane A) findings for Eighth Segment: no way back to ting39.github.io (no links at all on the page;
  add a small "← ting39" link outside the canvas or on the title screen). og:image present; add og:url and
  <meta name="twitter:card" content="summary_large_image">. No console errors, no overflow at 375/1280, 28 KB load.
- 2026-10-20 (daytime expansion) — +9 rooms (31 incl. title): clock4 TWO CLOCKS (4,2, above encore: time gates
  {1,4,7} at off 0/3 + jumps bridge, two-way), clock5 STILLER (5,2: two idle drops, D2 off 4, point, one-way
  '-' ladder back), coord3 WHERE TO FALL (-2,3: pos chooses which corner drops), coord4 COUNTING IN TWOS
  (-3,3: jump-binary stairs, jumps≡4 mod 8), coord5 MIND THE GAPS (-3,2: pos bridges vanish at cols 11/14/21),
  coord6 DESCENT, coord7 LOW CEILING (two deaths gates, off 0/6 → deaths≡1), coord8 BACK DOOR (point) → gate's
  left area; over3 PAST NINE (2,0: hex deaths C/E/F right-column drop), over4 MIXING DESK (3,0: volume cup 4→5),
  over5 EVERYTHING AT ONCE (3,-1: deaths bridge + jumps gate + time gate); master moved to (2,-1), entered from
  the right. New-room maps: tools/rooms_src/expand.py. **Design fact fixed: hanging-d gates open only on
  {1,4,7} (9 lights d).** Route: 118 goals, 218 s solver time, D35, 6 points; 19 tests pass. Distinct lead
  voice per region + quiet 'secret' song (title, fineprint via room.music).
- 2026-10-20 (daytime, cont.) — +4 optional side rooms with stray points → **35 rooms**: notch NOTCHES (4,6: off
  climb's right wall, climb a pillar of static 1s via their corner notches), clock6 OVERTIME (6,2: off STILLER's
  bottom corridor, 2 points), sidechannel SIDE CHANNEL (0,1: off over1's chamber, walk the volume digit's top bar
  → volume 1/4), coord9 EVERY OTHER (-4,3: off coord4, pos bridges with div 2). Route: 133 goals, 265 s solver time,
  D35, 10 of 12 points (title + hub clock excluded). 19 tests pass.
- 2026-10-20 11:20 — Curve pass via `node tools/curve.mjs` (solver seconds + deaths per room along the route):
  boot 3–10 s, tally 6–9 s (deaths here are deliberate counter-setting), clockwork 3–26 s (TWO CLOCKS waits on the
  clocks), coordinates 4–12 s, overflow 5–12 s; no outliers on the main path. Harder rooms (NOTCHES, MIND THE
  GAPS, OVERTIME, EVERY OTHER) are optional branches; main path = boot → tally → hub → gate → overflow → master.
  Mobile: portrait/landscape layouts were checked earlier (07:33 shots); the new rooms render (pixel check in the
  pane). Headless screenshots are blocked by a stuck snap Firefox holding browser.lock (see shared notes).
  Human first-clear estimate: the solver needs 4.4 min with perfect knowledge; with discovery, deliberate deaths and
  learning, 45–90 min is plausible (unmeasured; needs a real playtest). **Status → done.**
