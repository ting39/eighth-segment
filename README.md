# Eighth Segment

A hard, minimal precision platformer for the browser — 18 dense rooms around one hall, 6 stray points, 3 endings,
playable in 7 languages (and the language is part of the level). **Play: https://ting39.github.io/eighth-segment/**

A seven-segment display has eight parts: seven bars and the decimal point. You are the decimal
point. You fell out of the Master Readout, and you have to climb back.

**The one rule:** lit segments are solid, unlit ones are air — and every number in the machine is
counting *something*. Nothing is ever unlocked; you can do everything from the first room once you
understand what the numbers mean. Move and jump are the only controls.

v3 adds displays beyond numbers: starburst (14-segment) letters, dot-matrix words and bar graphs. Words are
shown in your language, so changing the language (English, 中文, 日本語, 한국어, Deutsch, Español, Русский)
changes their shape — and the shape is the level. A display's frame tells you what it is wired to.

- Controls: arrows / WASD + Z / Space / C (remappable), gamepad, or on-screen touch buttons.
  Esc pauses (map, restart room, settings). Progress saves automatically.
- Settings: language, music & sound volume, game speed (assist), glow, screen shake, flashes, HUD, touch, keys
  (and a couple more that you find in the world). The language is shared with ting39.github.io.
- No spoilers here: if you are stuck, die more. Or don't. Or stand still.
- Stuck for a while in one room? Displays quietly show a glyph for what they count
  (turn off: Settings → HINTS WHEN STUCK).

## Under the hood
- `src/sim.js` — deterministic 120 Hz integer simulation (shared by the game, tests and solver):
  coyote time, jump buffering, variable jump, corner and gap forgiveness, crush rules, checkpoints.
- `src/render.js` — vacuum-fluorescent-display look: ghost segments, phosphor afterglow, bloom.
- `src/audio.js` — all sound and music synthesized with WebAudio.
- `tools/solver.mjs` — weighted A* over the real sim. `tools/route.mjs` solves the whole game from a
  new save (waypoints in `tools/route-goals-v3.mjs`) and records the inputs in `replays/route-v3.json`.
  `tools/langlocks.mjs` / `tools/reglocks.mjs` sweep which languages / dial values open a gate.
- `tools/rooms_src/v3.py` — the world, authored with drawing ops; generates `src/rooms_v3.js`.
- `src/glyphs.js` — languages, the words on displays, starburst letters, hand-made dot-matrix glyphs.
- `npm test` — physics tests, world validators (edges, spawns, crush-safety for every counter value)
  a replay of the recorded route proving the game is completable to the true ending, and solver
  checks that secret locks open for exactly the intended values.

Everything (code, pixel art, sound, music) is original and generated in code.
