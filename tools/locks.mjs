// For a room and goal, list which values of a counter allow passing WITHOUT dying.
// usage: node tools/locks.mjs <room> <goalRoom> <counter: deaths|jumps|...> [mod=10] [k=v ...]
import { buildWorld, createGame, updateDisplays } from '../src/sim.js';
import { ROOMS } from './world.mjs';
import { solveAny } from './solver.mjs';
const [room, goal, ctr, mod = '10', ...kv] = process.argv.slice(2);
const world = buildWorld(ROOMS);
const pass = [];
for (let v = 0; v < +mod; v++) {
  const g = createGame(world, room);
  for (const [k, val] of kv.map((s) => s.split('='))) {
    if (k === 'spawn') { const [x, y] = val.split(',').map(Number); g.p.x = (x * 8 + 1) * 256; g.p.y = (y * 8 + 2) * 256; g.spawn = { x: g.p.x, y: g.p.y }; }
    else g.c[k] = +val;
  }
  if (ctr === 'time') g.c.steps = v * 120; else if (ctr === 'clock') g.clockMinutes = 1200 + v; else if (ctr === 'volume') g.volume = v; else if (ctr === 'visits') g.c.visits[room] = v; else g.c[ctr] = v;
  updateDisplays(g);
  const r = solveAny(g, goal.startsWith('at:') ? { at: goal.slice(3).split(',').map(Number) } : { room: goal }, { noDeath: true, restart: false, quick: true });
  process.stdout.write(`${v}:${r.ok ? 'Y' : '.'} `);
  if (r.ok) pass.push(v);
}
console.log('\npassable', ctr, pass);
