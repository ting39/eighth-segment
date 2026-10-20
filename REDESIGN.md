# EIGHTH SEGMENT — redesign proposal (v2)

Status: **APPROVED by the user 2026-10-20 ~19:30 — build it in phases (see "Build plan"). Hard stop at 92% weekly usage.**
Design method: follow `~/.claude/skills-authored/metroidbrainia-design/SKILL.md` and run its
"interest loop" (§7) for every room, every milestone and every playtest.

## What the player said (2026-10-20)
- Likes the seven-segment concept. The design is "somewhat boring": too few things to interact with.
- Wants: jumping on the status bar; brightness as a controllable; interactable items in the map.
- Hints once only (no speaker icon beside every volume digit).
- Going through every screen once is a pity: put the goal **next to / inside the start room**, come back
  once you have the knowledge, and make the way back its own challenge.
- The 3.14159 ending is awkward.

## What the research says (and how it applies)
- **Gates open through understanding, not items** (Thinky Games on knowledge-gated games; Leap Year,
  Animal Well, Tunic, Outer Wilds). → Keep "nothing is ever given", but give the player many more
  *things to understand and touch*.
- **Knowledge must be reused, far from where it was learned** (Bruno Dias, "Against Metroidbrania").
  A fact used once is a password. → Every mechanic below is introduced in one wing and needed again
  in the start room at the end.
- **Show the gate long before it can be opened** (Tunic's doors seen from one side, later understood
  from the other; Animal Well's rooms that become readable once another area teaches the missing idea).
  → The goal is visible in the first room. Every wing's last lesson is "the thing you saw at the start".
- **Layers** (Animal Well: base ending → optional → community secrets). → Ending / stray points /
  a final hidden layer.
- **Secrets on the critical path, pointed at by signs** (Leap Year). → Secrets are hinted by visible
  wires, tunnels and burn-in text — never by luck.
- **Diegetic interface** (HUD that exists in the world). → The HUD and the settings menu are physical.

## The rules (still three lines)
1. **Lit segments are solid.**
2. **Every number is counting something** — and wires on the circuit board show *what*.
3. **Some numbers you can change with your hands.** (new)

Controls stay: left, right, jump. (R = restart room, Esc = pause/settings.)

## New interactive parts (all built from display vocabulary)
| Part | How you use it | What it teaches |
|---|---|---|
| **Tact button** | Land on it: +1 to the display it is wired to (hold = repeat) | numbers can be pushed by hand |
| **Rotary knob** | A wheel set into the floor; walking across it turns it, left = −1, right = +1 | direction matters; fine control |
| **Slide switch** | Walk into it to flip it: re-wires a display between two sources | the *source* of a number is itself changeable |
| **Loose segment** | A bar that fell out of a digit. Touch it to pick it up (it floats above your head; you carry one at a time). Walk it to a digit with an empty socket and it clicks in, permanently changing that digit's shape. Dying drops it back where you found it | turning 1 into 7, 3 into 9, F into E... |
| **PCB traces** | Thin glowing wires from each display to its source (button, spike pit, clock, speaker...) | *the* hint system: follow the wire |
| **Brightness** | Global 0–9: a knob in the PANEL wing, and also in the settings menu once discovered | see below |
| **The HUD** | The timer / death counter strip is real. In some rooms the top edge is open and you can climb out onto it | your own stats are platforms you shape |

### Brightness (new global quantity)
Real VFDs "ghost": at high brightness, unlit segments glow faintly; at low brightness, dim digits vanish.
- At **brightness 9**, ghost segments of *burn-in* displays become solid (thin ledges you can stand on),
  and **burn-in text** appears on the glass (the hint layer, e.g. where a stray point is).
- At **brightness 0**, *dim* displays switch off completely (their lit bars become air).
- In between, everything behaves normally. One number, two opposite uses.

### The HUD is part of the world
- The HUD strip (time, deaths) is drawn in the top 2 rows of every room. In rooms whose ceiling is open,
  it is **solid**, and its digits are platforms.
- Late lesson: the settings menu has **HUD POSITION: TOP / BOTTOM**. Moving it to the bottom lays your
  own death counter across a bottomless gap. (Same idea as the music-volume lock, reused far away.)

### Hints: once per idea, then never again
- The *first* display of each kind shows its wire with a small icon at the source, once, animated. All
  later displays only have the plain wire. No icons next to every digit.
- "Stuck" hints (after many deaths) stay optional in settings, but are reduced to one glyph per room.

## World structure: everything comes back to the start
```
                       ┌────────────── PANEL (brightness, HUD position, settings) ─┐
                       │                                                            │
   TALLY (deaths,      │        ╔══════════════════════════════╗                    │
   jumps, buttons) ────┼────────║  DISPLAY HALL  (start + goal)║──── CLOCKWORK (time,
                       │        ║  Master Readout fills the    ║     idle, visits, knobs)
   COORDINATES ────────┘        ║  ceiling; the empty slot is  ║
   (position, binary,           ║  visible from frame 1        ║
    hex, slide switches)        ╚══════════════════════════════╝
```
- **Start room = DISPLAY HALL**, a tall room. The Master Readout is above you from the first frame,
  with its empty point slots. One slot is reachable straight away (a "wrong" ending you can take in
  the first minute, then try again). The right slot is high up and needs everything you learn.
- **Four wings** leave the hall. Each wing is a small loop (~6–8 rooms) that ends with a **shortcut that
  drops you back into the hall from a new side** (a one-way door that opens from the far side), so the
  hall is visited again and again and you see it with new eyes each time.
- **Each wing's final lesson unlocks part of the hall**: TALLY → the hall's death-wired bridge;
  CLOCKWORK → a door that opens at a certain second; COORDINATES → the slide switch that rewires the
  readout's support beams; PANEL → brightness ghosts + HUD position.
- **The way back is a challenge**: the last wing (PANEL) is entered from the hall's top floor and
  exits at the bottom of the world. Its return route is a vertical climb back up through the hall
  ("the long way home") that uses every idea once more, under one rule set.
- Target ~30 rooms (fewer, denser rooms than now), ~60 min first clear.

## The ending (replaces 3.14159)
The Master Readout reads **`1 0 0 0 0 0 %`** — the machine's own completion meter, stuck without its
decimal point. Where you put the point decides what it reads:
- `1.00000 %` — the easy slot you can reach in minute one: "ONE PERCENT." The machine shrugs; the
  point pops back out; you can try again. (Not a fail screen: a nudge.)
- `10.0000 %` — mid slot: "TEN PERCENT."
- `100.000 %` — the right slot: every display in the world lights up and counts up to 100; the credits
  are the displays of each wing showing your time / deaths / jumps / stray points.
- Stray points (optional collectibles) keep their meaning: the last digits of `100.000` light one per
  point found — so 100% literally means you found everything.
No story text paragraph; the numbers say it.

## What stays
The VFD look, palettes, music, 120 Hz engine, deterministic sim + solver + replay tests, saves,
touch/gamepad, the pixel font, R to restart, hover menus. Existing good locks are reused inside the
new wings (deaths, jumps, time, idle, position, visits, binary, hex, volume).

## Build plan (phases, so it fits the usage budget)
1. **Engine**: buttons, knobs, slide switches, loose segments + sockets, wires (render + data), brightness
   (ghost/dim classes), solid HUD, HUD position setting, one-time hints. Physics tests for each. Solver:
   new actions for brightness/HUD settings.
2. **Display Hall + TALLY + CLOCKWORK** (hall fully built, two wings, shortcuts back) → playable.
3. **COORDINATES + PANEL + the long way home + ending** → complete.
4. Route/replay proof from new save to every ending; polish; publish.

Rough cost: phase 1–2 ≈ 10–12% of weekly usage, phase 3–4 ≈ 10–12%.
