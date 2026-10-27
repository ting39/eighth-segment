// Which music volumes (0-9) let you reach a goal? usage: node tools/vollocks.mjs <room> <goal> [spawn=x,y]
import { buildWorld, createGame, updateDisplays } from '../src/sim.js';
import { ROOMS } from './world.mjs';
import { solve } from './solver.mjs';
import { parseGoal } from './route.mjs';
const [room, goalStr, ...kv] = process.argv.slice(2);
const world = buildWorld(ROOMS);
const out = [];
for (let v = 0; v <= 9; v++) {
  const g = createGame(world, room, { volume: v });
  for (const [k, val] of kv.map((s) => s.split('='))) if (k === 'spawn') { const [x, y] = val.split(',').map(Number); g.p.x = (x * 8 + 1) * 256; g.p.y = (y * 8 + 2) * 256; g.spawn = { x: g.p.x, y: g.p.y }; }
  updateDisplays(g);
  const r = solve(g, parseGoal(goalStr), { weight: 2.5, maxNodes: +(process.env.MAXN || 100000), restart: false });
  if (r.ok) out.push(v);
}
console.log(room, goalStr, kv.join(' '), 'passes at volume', out.join(',') || 'none');
