// Which register values let you reach a goal? usage: node tools/reglocks.mjs <room> <goal> <reg> [spawn=x,y] [k=v...]
import { buildWorld, createGame, updateDisplays } from '../src/sim.js';
import { ROOMS } from './world.mjs';
import { solveAny } from './solver.mjs';
import { parseGoal } from './route.mjs';
const [room, goalStr, reg, ...kv] = process.argv.slice(2);
const world = buildWorld(ROOMS);
const out = [];
for (let v = 0; v < 10; v++) {
  const g = createGame(world, room);
  g.c.reg[reg] = v;
  for (const [k, val] of kv.map((s) => s.split('='))) {
    if (k === 'spawn') { const [x, y] = val.split(',').map(Number); g.p.x = (x * 8 + 1) * 256; g.p.y = (y * 8 + 2) * 256; g.spawn = { x: g.p.x, y: g.p.y }; }
    else if (k === 'bright') g.bright = +val; else g.c[k] = +val;
  }
  updateDisplays(g);
  const r = solveAny(g, parseGoal(goalStr), { quick: !!process.env.QUICK });
  out.push(`${v}:${r.ok ? 'PASS' : 'no'}`);
}
console.log(room, goalStr, reg, out.join(' '));
