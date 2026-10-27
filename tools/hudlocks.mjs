// Which HUD settings (top / bottom / off) let you through a solid-HUD room, for a given death count?
// usage: node tools/hudlocks.mjs <room> <goal> [spawn=x,y] [deaths=N]
import { buildWorld, createGame, updateDisplays } from '../src/sim.js';
import { ROOMS } from './world.mjs';
import { solve } from './solver.mjs';
import { parseGoal } from './route.mjs';
const [room, goalStr, ...kv] = process.argv.slice(2);
const world = buildWorld(ROOMS);
const out = [];
for (const hudpos of ['top', 'bottom', 'off']) {
  const g = createGame(world, room, { hudpos });
  for (const [k, v] of kv.map((s) => s.split('='))) {
    if (k === 'spawn') { const [x, y] = v.split(',').map(Number); g.p.x = (x * 8 + 1) * 256; g.p.y = (y * 8 + 2) * 256; g.spawn = { x: g.p.x, y: g.p.y }; }
    else g.c[k] = +v;
  }
  updateDisplays(g);
  const r = solve(g, parseGoal(goalStr), { weight: 2.5, maxNodes: +(process.env.MAXN || 300000), restart: false });
  out.push(`${hudpos}:${r.ok ? 'PASS' : 'no'}`);
}
console.log(room, goalStr, kv.join(' '), out.join(' '));
