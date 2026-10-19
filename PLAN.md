Status: in-progress

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
| ✦8 | **VISITS** (times you entered this room) | leave and come back | a door "1 of 3" style counter by the entrance |
| ✦9 | **BINARY** row of bits = deaths | it's binary | row of 4 lamps, 1 lamp per bit, LSB right |
| ✦10 | **HEX** jumps mod 16 | numbers past 9 (A b C d E F) have shapes 0–9 never make | the digit occasionally shows letters |
| ✦11 | **MUSIC VOLUME** (settings) | the menu is part of the world | a speaker glyph next to the digit; menu draws volume as the same 7-seg digit |
| ✦12 | combos (deaths + jumps, position + time…) | everything at once | late rooms |
| ◇13 | **the HUD** | in one room the HUD counters are giant and solid | secret |
| ◇14 | **wall clock** (real local time HH:MM) | the hub clock is real; wait for a minute ending in 8 | secret room under the hub |
| ◇15 | **the map** | a wall that is drawn open on the pause map is fake | secret |
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
- [ ] Engine: fixed-step physics, tilemap + display collision, input layer, room transitions
- [ ] Feel tuning + automated physics tests
- [ ] Art & audio generation (VFD renderer, glow, sfx, region music)
- [ ] World: rooms, locks, secrets, endings
- [ ] Solver + replay harness proves completability; softlock audit
- [ ] Menus, save, settings (volume digits, speed, remap), touch/gamepad, title & ending
- [ ] Publish ting39/eighth-segment + Pages + CARD.json + MORNING_REPORT entry
- [ ] Polish passes (juice, difficulty curve, hints that don't spoil)

## Progress log
- 2026-10-20 01:50 — Design doc written. Name: Eighth Segment. Folder kept as `platformer`.
  Weekly usage 28% at start (Pro plan) → keep turns efficient.
