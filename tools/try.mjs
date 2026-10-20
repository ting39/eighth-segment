// quick: node tools/try.mjs <fromRoom> <toRoom|event:slot> [k=v counters...]
import { buildWorld, createGame, updateDisplays } from '../src/sim.js';
import { ROOMS } from './world.mjs';
import { solve, solveAny } from './solver.mjs';
const [from, to, ...kv] = process.argv.slice(2);
const world = buildWorld(ROOMS);
const g = createGame(world, from);
for (const [k, v] of kv.map((s) => s.split('='))) { if (k === 'volume') g.volume = +v; else if (k === 'spawn') { const [x, y] = v.split(',').map(Number); g.p.x = (x * 8 + 1) * 256; g.p.y = (y * 8 + 2) * 256; g.spawn = { x: g.p.x, y: g.p.y }; } else g.c[k] = +v; }
updateDisplays(g);
const t0 = Date.now();
const goal = to.startsWith('event:') ? { event: to.slice(6) } : to.startsWith('at:') ? { at: to.slice(3).split(',').map(Number) } : { room: to };
const res = process.env.W ? solve(g, goal, { maxNodes: +(process.env.MAXN || 600000), weight: +process.env.W, macro: +(process.env.M || 4) }) : solveAny(g, goal);
console.log(from, '->', to, res.ok ? 'OK' : 'FAIL', 'expanded', res.expanded, 'ms', Date.now() - t0, JSON.stringify(res.cfg || ''));
if (res.ok) {
  const steps = res.inputs.reduce((a, [m, k]) => a + k, 0);
  console.log('steps', steps, 'deaths', res.state.c.deaths - g.c.deaths, 'jumps', res.state.c.jumps - (+kv.find(s=>s.startsWith('jumps='))?.split('=')[1] || 0));
  if (process.env.V) console.log(JSON.stringify(res.inputs));
}
