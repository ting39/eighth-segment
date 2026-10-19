# Eighth Segment

A hard, minimal precision platformer for the browser. **Play: https://ting39.github.io/eighth-segment/**

A seven-segment display has eight parts: seven bars and the decimal point. You are the decimal
point. You fell out of the Master Readout, and you have to climb back.

**The one rule:** lit segments are solid, unlit ones are air — and every number in the machine is
counting *something*. Nothing is ever unlocked; you can do everything from the first room once you
understand what the numbers mean. Move and jump are the only controls.

- Controls: arrows / WASD + Z / Space / C (remappable), gamepad, or on-screen touch buttons.
  Esc pauses (map, restart room, settings). Progress saves automatically.
- Settings: music & sound volume, game speed (assist), glow, screen shake, flashes, HUD, touch, keys.
- No spoilers here: if you are stuck, die more. Or don't. Or stand still.
- Stuck for a while in one room? Displays quietly show a glyph for what they count
  (turn off: Settings → HINTS WHEN STUCK).

## Under the hood
- `src/sim.js` — deterministic 120 Hz integer simulation (shared by the game, tests and solver):
  coyote time, jump buffering, variable jump, corner and gap forgiveness, crush rules, checkpoints.
- `src/render.js` — vacuum-fluorescent-display look: ghost segments, phosphor afterglow, bloom.
- `src/audio.js` — all sound and music synthesized with WebAudio.
- `tools/solver.mjs` — weighted A* over the real sim. `tools/route.mjs` solves the whole game from a
  new save (waypoints in `tools/route-goals.mjs`) and records the inputs in `replays/route.json`.
- `npm test` — physics tests, world validators (edges, spawns, crush-safety for every counter value)
  a replay of the recorded route proving the game is completable to the true ending, and solver
  checks that secret locks open for exactly the intended values.

Everything (code, pixel art, sound, music) is original and generated in code.
