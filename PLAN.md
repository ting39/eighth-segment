Status: in-progress (v3 round 2 — resumed 2026-10-28 after the 5h reset; route from #101, then tests, push, more rooms; hard stop weekly 92% or 18:00 CST)

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
- 2026-10-20 (afternoon) — Screenshot QA after the browser-lock fix: new rooms (coord5, clock5, over5, notch) look
  right at 960×528; phone portrait 375×812 and tablet 768×1024 fit the width with no page scroll. Render polish:
  deep wall interiors (all 8 neighbours solid) are drawn at 40% so large slabs stop overpowering the rooms.
- 2026-10-20 11:50 lane A (QA sweep) editing: og:url/type + twitter:card, ← ting39 link.
- 2026-10-20 11:54 lane A: added 'MORE BY TING39' to the title menu (saves, then goes home; menu y 112→104 so 4 items clear the ledge/hint) + og:type/og:url/twitter:card. 19 tests pass. Live. Released.
- 2026-10-20 (user request) text readability: all UI/room text now drawn crisp at screen resolution after bloom/mesh/vignette (render.js drawTextQueue), brighter (alpha x1.6, colour lifted 35% toward white), dark outline + soft glow; logo keeps the pixel font (R.pixelText). 19 tests pass; checked title/hub/ending/phone screenshots.

## USER FEEDBACK 2026-10-20 afternoon (from playing) — do these, in order
- [x] Spike pits too easy to run over: tally2/over3/coord7 pits widened to 2 tiles; route re-solved (waypoints at:5,10 + at:13,7 added in over2). Commit e686eec.
- [x] 1-tile-wide holes/shafts in floors are generally hard to fall into while running (e.g. tally2 shafts at cols 18 and 23 under the corridor). Fix generally: either physics (SQUEEZE (2px) lets you slide past a 1-wide hole? check) or widen key holes; make sure intended drops are easy. Re-run tests + route.
- [x] (tally1: ceiling gap widened to cols 30-33; 4→32 of 252 naive jumps succeed) A climb "to the upper layer" is too hard (user screenshot, tally region: player on a right-side ledge ~row 9 near x 37, small platform ~(31,12), upper corridor ~row 6 reached through a ceiling gap ~cols 31-33). Find the room, make that jump a little easier.
- [x] (tally4: hole from tally3 narrowed to 2; secret now a 1-high floor tunnel ending in the fake wall) Secret room found only by luck (screenshot: room with an '8' display embedded in the ceiling ~cols 17-20, corridor ~row 11, open area on the right x 31-38): currently found by jumping up-right from the room below. Make the hole from below narrower and hide the secret behind a thin tunnel that is hinted (secrets must be hinted, not luck).
- [x] Menu: highlight the item under the mouse (hover), click to select.
- [x] Font: replace the crisp DejaVu text with a pixel font that fits the VFD/pixel theme but stays readable (e.g. 5x7 bitmap drawn at screen resolution, keep outline/glow, keep layout widths).
- [x] Shortcut R (default; remappable if remap exists) = restart room (counts as a death, same as the pause-menu Restart).
- [x] Tests + route pass, screenshots, push, short note in MORNING_REPORT.

## REDESIGN v2 (user approved 2026-10-20 ~19:30) — CURRENT WORK
Read and follow `REDESIGN.md` (the design) and `~/.claude/skills-authored/metroidbrainia-design/SKILL.md`
(the method; run its interest loop §7 for every room, milestone and playtest; use its
references/playtest-metrics.md for fall-in, jump-success and luck tests). Build in the 4 phases listed
at the end of REDESIGN.md; keep the old game playable on the live site until phase 2 is solid (develop
on a branch `v2` or behind `?v2`, then switch main when the redesign is better than v1).
- [x] Phase 1 engine (buttons, knobs, slide switches, loose segments+sockets, wires, brightness, solid HUD, HUD position, one-time hints) + tests + solver actions
- [x] Phase 2 Display Hall + TALLY + CLOCKWORK + shortcuts back to the hall → playable, route-proven
- [x] Phase 3 COORDINATES + PANEL + long way home + 100.000% ending (first pass)
- [ ] Phase 4 full route proof to every ending, polish, publish, MORNING_REPORT entry

### v2 world design (interest loop applied before building)
Grid: `t3(-2,-1) t4(-1,-1) p1(0,-1) c4(1,-1) c3(2,-1)` / `t2(-2,0) t1(-1,0) HALL(0,0) c1(1,0) c2(2,0)` /
`o2(-1,1) o1(0,1) o3(1,1)` / `p2(0,-2) p3(1,-2)`. Readout `1 0 0 0 0 0 %` across the hall's ceiling from frame 1.
Slots under it: after the 1 = `1.00000 %` (reachable in minute one by the left steps), after the next 0 =
`10.0000 %` (behind the hall socket: a static 1 missing its top bar), after the next = `100.000 %` (C-ledge).

| Idea | Taught (no words) | Reused far away | Reframes |
|---|---|---|---|
| deaths move digits | t1: spike wired to a hanging gate | t4 carry run (dying drops your bar) | the HUD death counter |
| landing pushes a number | t1: tact button wired to a gate | t2 button inside a cup (4 → land → 5 opens) | — |
| a bar can be carried into a socket | t3: 1 + bar = 7 bridge | hall: the dashed socket seen from frame 1 | the start room |
| time moves digits | c1: clock-wired gate | c1 balcony trapdoors (a, g, d open at 1 / 4→7) on the way home | the HUD timer |
| standing still is an input | c2: idle drop | — (Panel return passes c2? no) | — |
| walking turns a knob, direction matters | c3: knob on the path, crossing adds w-1 | p1 brightness knob | — |
| a switch rewires a number's source | o2: static 4 → position bridge | hall support beams (static 1s → position) | the beams seen from frame 1 |
| position moves digits | o1 | hall beams | — |
| brightness 0 kills dim bars, 9 makes burn ghosts solid | p1, p2 (+ settings item appears) | hall: the last ghost ledge to the 100% slot | every ghost segment in the game |
| the HUD is real; its position is a setting | p3 (+ setting appears) | — | the HUD you've watched all game |
Interest notes: every room has something to touch (button/knob/switch/bar/setting); each wing returns to
the hall by a one-way shortcut from a new side (t4→t1 balcony→hall corridor, c4→c1 trapdoors→hall upper
right, o3→c1→hall, p3→c4→c1→hall); the 1% ending is a nudge, not a fail.
- 2026-10-20 (afternoon) — **v2 built and live behind `?v2`** (title menu links both ways; v1 stays the default
  until v2 is playtested). 15 rooms: hall + t1-t4 + c1-c4 + o1-o3 + p1-p3, generated by `tools/rooms_src/v2.py`
  (writes src/rooms_v2.js; never hand-edit). Engine: parts (button/knob/switch/seg), sockets with a 'pending'
  grace cell, registers/switches/sockets in counters, brightness (dim/burn), HUD-as-digits rooms (`hudSolid`),
  HUD position, one-time wire hints (meta.hintsSeen), reveals → settings items BRIGHTNESS / HUD POSITION.
  Solver never flips settings itself (route goals `bright:N`, `hud:bottom`, `vol:N`); new goals `reg.X:v`,
  `sw.X:v`. `V2=1 node tools/route.mjs` → replays/route-v2.json (105 goals, 152 s, all 3 slots, 4 points).
  `tools/jumprate.mjs` = skill §8 jump-success metric. 32 tests pass.
  Interest loop applied: hint text/HUD moved off the readout; sockets breathe (faster while carrying); the 1%/10%
  slots are nudges that keep the run going; p2 rebuilt (burn '1's became closed 8s at brightness 9 → burned-in bars
  instead); t4's floating gate housed in rock (it was a trap); STATUS BAR hops measured at ~20% (tight, fair).
  NEXT: real playtest feedback; more interactables per room in o/c wings; music for v2 hall; maybe light the
  last digits of 100.000 per stray point; make v2 the default once the user approves.
- 2026-10-20 (late afternoon) — Stray points are now diegetic: the hall's readout shows `1 0 0` lit and its last three
  zeros + `%` as ghosts; each stray point found lights one (needPoints on displays), and the true ending's big readout
  does the same ("N DIGITS STILL DARK. STRAY POINTS LIGHT THEM."). Pushed to main (v1 default, `?v2` for the redesign).
  Waiting on the user's playtest of v2 before making it the default.
- 2026-10-20 ~21:00 USER PLAYTEST FEEDBACK on ?v2 (in progress when the 5h limit hit; uncommitted edits exist):
  [x] BURN-IN room unclear: grey ghost bars read as background. Add in-room cue (bars flicker/glow when brightness changes; faint burned-in "9"/brightness glyph). Same for hall BURN bar + RUNG.
  [x] DIMMER knob: crossing it should visibly retune brightness live (screen/lit bars dim/brighten step by step) with a small 7-seg readout of the value; full crossing reaches 0 and 9.
  [x] Hall bottom-right stray point: reachable (sim 48/120 at bright 9) but check it reads clearly (rung visible, point position clear).
- 2026-10-20 (evening) — Playtest fixes: (1) burn-in ghosts now answer to brightness everywhere (brighter each step,
  a flash on every change, solid + glowing at 9) and rooms with burn-ins carry a faint burned-in "☼9" on the glass
  (`burnMarks`; p2, hall); (2) every knob shows a live 7-seg readout, and below 5 the whole glass dims step by step
  (brightness 5 looks exactly as before); test: crossing the dimmer fully reaches 0 and 9; (3) hall stray point:
  the hatch + burn-in rung (from another session) kept, verified visible at 9. Route re-solved from 0 (91 goals,
  123 s); 33 tests pass. Interest note: brightness is now felt as a physical dimmer, so the p2 aha becomes
  "the ghosts reacted when I turned the knob" rather than a guess.
- 2026-10-20 ~23:40 (watchdog) — Ticked the three playtest items (fixed in the evening entry). Added the v2 hall theme
  (`SONGS.hall`, room.music='hall'): it gains one layer (bass → drums → hats → fills, arp speeds up at 2) for each
  wing the run has reached, so every return to the hall sounds different. Maps unchanged; 33 tests pass; smoke-tested
  in the browser pane. Phase 4 remaining: making v2 the default needs the user's go-ahead (v1 stays default).
  Banner sub-labels now follow the v2 wings (`room.wing`): the hall reads START (not BOOT), p1–p3 read PANEL (not OVERFLOW).

## V3 (overnight 2026-10-27/28, unattended; brief: V3_BRIEF.md) — CURRENT WORK
Usage at start: weekly 66%, 5h 30%. Hard stop at weekly ≥ 92% (commit locally, log, end).

### v3 design (interest loop run before building)
Rule set unchanged (lit = solid; every number counts something; some you change by hand) plus one more line:
**every display's frame (bezel) tells you what it is wired to**, so the wire is a hint, not the only hint.
New display faces and inputs:
- **Starburst (14-seg) code display** `t:'code'`: shows the current LANGUAGE CODE (EN ZH JA KO DE ES RU), 7x11 tiles
  per letter. Diagonal segments are real 2-step staircases (Z climbs bottom-left→top-right, N top-left→bottom-right,
  K/R have their own). Change language → letters → geometry.
- **Dot-matrix word display** `t:'word'`: a word in the current language (5x7 dots for Latin/Cyrillic, 7x7 for
  CJK/Hangul/kana), every dot a solid tile. "EXIT" is 4 letters, AUSGANG 7, 出口 2.
- **Bar graph** `t:'bar'`: unary meter, n cells, value v lights v cells (a bridge that is exactly v long, or a pillar).
- Sources: `lang` (code display), `word:K`, `letters:K` (number of letters of word K in your language), plus the
  old ones. `langSrc:'idle'` = an attract-mode display whose language is chosen by how long you stand still.
- **Language is shared with the site** (localStorage ting39:lang). Game languages: en zh-TW ja (site) + ko de es ru
  (game only, chosen for shape: Hangul blocks, long German compounds, Spanish, Cyrillic mirror letters И/Я).
  An in-world **language selector** (globe switch) in the first LEXICON room teaches it; later rooms need the menu.
- **Bus** (one machine, displays in several rooms): the DIAL knob in c3 drives gates in c3, c4 and the hall (gold
  bezel + tag). A value must satisfy the next rooms too → plan across rooms.
Feedback fixes: (1) knobs get ≥3 tiles of headroom; (2) knob mini-readout only when no display in the room shows
that value; (3) position displays count in zones of 4 tiles (0-9 across the room) with a ruler printed on the glass;
(4) every idea recurs far from where it is taught (table below); v1 and the old v2 menu entry retired.

| Idea | Taught | Reused far away |
|---|---|---|
| deaths | t1 | p3 (HUD deaths bridge), l3 |
| button | t1/t2 | l2 |
| loose bar → socket | t3 | t4 carry, hall socket |
| time | c1 | c4, o3 |
| idle | c2 | l4 SCREENSAVER (idle picks the word's language) |
| knob / bus dial | c3 (headroom) | c4 + hall (same bus), p1 brightness knob |
| switch rewires | o2 | hall beams |
| position (zones+ruler) | o1 | hall beams, o3 |
| jumps | t4 | o3 (bar-graph pillar = jumps mod n) |
| brightness dim/burn | p1/p2 | hall final + l-wing? |
| HUD is solid | p3 | (hall bottom HUD) |
| language code (starburst) | l1 (selector) | hall, p-wing |
| words / letter count | l2/l3 | p2 burn-in WORD is solid at brightness 9 (brightness × language) |
| two languages in one room (user idea) | l3 INTERPRETER: long word bridge, then a short-word wall | — |
Grid: l1(-3,0) l2(-3,1) l3(-2,1) l4(-3,-1); t2 gets a left exit to l1; l3 exits right into o2.
Sources of truth: `tools/rooms_src/v3.py` → `src/rooms_v3.js`; route goals `tools/route-goals-v3.mjs` →
`replays/route-v3.json`. New goal kinds: `lang:xx`.
- 2026-10-27 ~22:40 (v3 session) — Engine + data done: `src/glyphs.js` (7 game languages, CODE, WORDS exit/up,
  starburst 7x11 letters with staircase diagonals, hand-made 7x7 wide glyphs 出口上위나가기), sim faces `code`/`word`/`bar`
  (+`mod`), sources `lang`, `letters:K`, pos zones of 4, `langSrc:'idle'`, part `lang` (globe selector), `g.lang`
  in snapshots; solver/route `lang:xx` goals; render bezels per source (BEZEL table), ruler, faces, selector, knob
  readout only when no display shows the value; main: v3 only (v1/v2 retired, save key eighth-segment/v3),
  language synced with ting39:lang both ways; i18n-game: zh-TW ja ko de es ru for every UI string; 5x7 font has
  Cyrillic + accents. v3.py: LEXICON l1 (code letters set in rock — dark strokes are tunnels; through B's 2nd
  letter = EN/KO/RU, then A's 1st letter = ZH/JA/DE: verified by tools/langlocks.mjs), l2 (bar = letters of EXIT),
  l3 INTERPRETER (E: letters:exit ∈{1,4,7} = EN/DE ✓ verified; U: letters:up ∈{0,1,7} = ZH/JA/KO; X point:
  EXIT has 7 = DE), c3 dial = bus (headroom), c4 FAR DIAL reads it through its middle ({0,1,7}; c3 {1,4,7}),
  o3 COUNT THE HOPS (bar = jumps mod 13 under a low roof; bus point inside the dial digit, in through b = 5/6),
  o2 idle floor digit (stand still → falls, point), p2 burned-in code letters (sweeping which languages reach the
  point). Decision: no separate SCREENSAVER room — any word puzzle there is solved by the menu, so idle wouldn't
  be what it tests; idle recurs in o2 instead. Points: c2 p2 hall o3 l3 o2 = 6. 33 unit/world tests pass.
  NEXT: tune p2, write tools/route-goals-v3.mjs and solve the full route, screenshots, deploy.
- 2026-10-28 ~00:45 — **Full v3 route proven**: `node tools/route.mjs` → replays/route-v3.json, 109 goals, new save →
  1% → 10% → LEXICON → o-wing → CLOCKWORK (dial 7) → PANEL → hall points → 100%; 152 s game time, D3, all 6 points,
  every room. 35 tests pass. Design changes forced by the solver (interest loop): (1) the bus's third display could
  never be reached at 5/6 because leaving c3 requires gate K → moved to **the hall**: a gold digit set in rock that
  reads dial+3, its dark middle bar is the tunnel to a stray point → open at dial {4,7,8}; with K {1,4,7} and c4's H
  {0,1,7} only **7** works in all three rooms (verified by tools/reglocks.mjs); (2) p2's burned-in code letters
  couldn't make a fair gate (climb = lottery/impossible; in rock a missing top bar is just a dip) → p2 is back to the
  v2 layout, and language × settings lives in **p1 DIMMER**: a middle slot counting UP's letters (open ZH/JA/KO) on
  the way to the dimmer door; (3) l3's climb had 4-5 row steps (impossible) → re-stepped; (4) route holds the dial
  with `reg.dial:7@19,9` (walking off the knob turns it). `langSrc:'idle'` (attract mode) is implemented but unused.
- 2026-10-28 ~01:10 — **v3 is the default and live** (pushed 7669ad3; Pages serves rooms_v3.js). Smoke-tested in a real
  browser (ru, no console errors); screenshots in .shots/v3 (grid1/grid2/titles). Usage: weekly 72%, 5h 76%.

### v3 as built — recurrence map (final; supersedes the plan table above)
| Idea | Taught | Recurs far away / combined |
|---|---|---|
| deaths | t1 | p3 (your HUD death digits are the bridge) |
| button | t1, t2 | — (GAP: no far reuse yet) |
| loose bar → socket | t3 | t4 carry, hall socket (10% slot) |
| time | c1 | c4 time gate, c1 trapdoors on the way home (same wing — GAP: no far reuse) |
| idle | c2 (stand still) | o2: an idle floor digit — keep moving or it drops you (reverse lesson) + stray point |
| knob / bus dial | c3 (headroom, readout via its gate) | c4 FAR DIAL + the hall's gold digit (dial+3): only 7 opens all three; p1 brightness knob |
| switch rewires | o2 | hall beams |
| position (zones + ruler) | o1 | o2, o3, hall beams |
| jumps | t4 | o3 COUNT THE HOPS (bar = jumps mod 13) |
| brightness dim / burn | p1 / p2 | hall DIM bar (final) + hall burn rung/point |
| HUD is solid / position | p3 | — (GAP) |
| language code (starburst, in rock) | l1 (globes): 2nd letter's middle EN/KO/RU, then 1st letter's ZH/JA/DE | (l1 only — GAP: no far starburst reuse) |
| letter counts (bar / digits) | l2 bar = EXIT's letters (DE/ES) | l3 (EXIT 1/4/7 = EN/DE; UP 0/1/7 = ZH/JA/KO; X: EXIT 7 = DE), p1 DIMMER (UP slot) |
| two languages in one room (user idea) | l1 (selector), l3 (menu) | — |
Ideas for a v3.1 pass (need the user's playtest first): far reuse for buttons (e.g. a button whose register is a
bus read in another wing), time (a clock digit in LEXICON), HUD (hudSolid somewhere with words), and a starburst
code display outside LEXICON (a fair one: middle-row passages are the only selective starburst mechanic found —
top-bar bridges and climbs were not selective, see the p2 notes above).
Status: v3 complete pending the user's playtest. To resume: read V3_BRIEF.md, this section, then `npm test` and
`node tools/route.mjs --from N` after any room edit (rooms: tools/rooms_src/v3.py → src/rooms_v3.js).

## V3 ROUND 2 (2026-10-28, from the parent session: "more mechanisms, more rooms, refine the map, polish, surprise me")
Hard stops: weekly 92% or 18:00 CST. Resume = read this section, `npm test`, `node tools/route.mjs`.
Plan (each new room = one insight; every gap in the recurrence map closed by a COMBINATION, not a copy):
- E1 `langSrc:'time'`: a code/word sign that speaks every language in turn (one per second, starting from yours —
  your menu language is the PHASE). → starburst + time far from both.
- E2 title card: a word display lit only for the first N seconds after you enter the room (`until`). The room's own
  name, printed huge where the banner always appears, is the bridge: leave and come back to relight it; its length
  is your language. → UI-is-geometry (p3 HUD) + time + language, far away.
- E3 map face `t:'map'`: one block per room of the world, lit (solid) once visited — the pause map as terrain.
  Visited moves into sim state (g.c.seen) so the solver can prove it. A dark block on it is a room you have not
  found: the visible hint for a secret.
- E4 polish: segment light-up/fade animation (render only), room-transition wipe, readability.
Rooms: c5 (3,0) BABEL CLOCK (door from c2): two time-cycled code signs in rock, rhythm passages, a point.
p4 (-1,-2) TITLE CARD: from p2 west, drops into t4 → PANEL↔TALLY loop (far-side shortcut).
o4 (2,1) ATLAS: from o3 east; the world map as climbing terrain, a point that needs the secret room's block.
s1 (-3,-1) secret (FAKE-wall entrance, hinted by ATLAS + a mark in t3/l1), with a button on TALLY's bus.
Progress log:
- 01:50 — round 2 opened (weekly 73%, 5h 83%).
- 02:40 — Engine: `langSrc:'time'`, `until` (title card, g.c.here), `t:'map'` (laid out in buildWorld; lit by
  g.c.visits), solver keys for both (time buckets of 0.2 s for cycling signs). Rooms built and solver-checked:
  c5 BABEL CLOCK (letter one in ZH/JA/DE, wait in the gap, letter two in EN/KO/RU), p4 DOWN (card right-aligned
  to the door; EN DE ES RU cross, ZH JA KO too short; six seconds; leave + re-enter relights it), o4 ATLAS (point
  needs s1's block: verified unreachable without it), s1 CROSSTALK (button on the DIAL bus, gate = dial+5).
  Doors: c2 east + floor hole, o3 top-east, p2 west floor, t3 false wall (+ steps out of its far-side pit: it was
  a dead end), t4 top hole, l1 top hole. Points 6 → 10, readout needs 3/6/10. Render: cycle legend + beat bar over
  time signs, title-card flicker in its last second, map "you are here", CRT retune on room change.
- 02:45 — PAUSED: 5-hour window hit 100% (weekly 75%). Committed locally, NOT pushed (route not yet proven).
  RESUME: (1) check scratchpad route log or just re-run `nice -n 15 node tools/route.mjs --from 23` (goals 20-23
  are stored; new goals: s1 detour after LOOSE's socket, c5+o4 after STILL's point, p4 after BURN-IN's point then
  home via t4/t1/hall and back up through p1/p2 to p3); fix any FAILED goal with waypoints; (2) `npm test`;
  (3) screenshots via the in-app browser (headless shot.sh renders black for this game) of c5/p4/o4/s1/t3;
  (4) interest loop per new room + update the recurrence map; (5) push; (6) report + Status: done.
- 02:50 — route rebuild (--from 23) stopped at: #101 at:32,19 FAILED from room c2 (-3,162) after 122259 ms. Resume there (add waypoints), stored segments up to it are in replays/route-v3.json.
- ~04:10 — **Round-2 route proven**: new save → 100% through all 22 rooms, 10/10 points, 232 s, D3 (161 goals).
  Fixes on the way (interest loop / solver): BABEL CLOCK's and LANGUAGE's tunnels dropped you into dark lower
  strokes when you just held a direction (KO/RU in l1 fell into a 4-deep l-pit) → `floor_code`: one-way floors
  under the walked middle rows (test allows one-way tiles under display cells). STILL re-crossing after ATLAS
  uses the idle digit again (ATLAS's drop stays one-way so STILL's lesson can't be skipped). c1's clock trapdoors
  need a `time:2` goal (the solver can't find "stand still 3 s" in a 10 s clock's state space). route.mjs now
  re-checks reused segments (a t3 edit had silently desynced the stored replay; see .learnings).
  38 tests pass. Pushing this milestone; NO SIGNAL (x1, HUD OFF) is written in scratch and comes next.
- ~05:00 — **NO SIGNAL (x1, -2,-2)** in and proven: west of DOWN's landing. The solid HUD sits on the way wherever
  it is (floor walk under the bottom HUD, ceiling walk under the top HUD); the setting that has been in the menu
  since frame 1, HUD: OFF, clears both (`tools/hudlocks.mjs`: deaths 0 → top: floor ok / ceiling no; bottom:
  floor no; off: both). A player whose deaths digits both read 1/4/7 (e.g. 14) walks through with the HUD on.
  HUD 'off' is a world state now (g.hudpos 'off', main maps Settings→HUD to it, solver/route `hud:off`).
  First placed at (-4,0) but an 8th map column would overflow ATLAS and move its secret corner → moved inside the
  grid. Route: 23 rooms, 11/11 points, 240 s, D2; 38 tests pass. Readout needs 3/7/11.
