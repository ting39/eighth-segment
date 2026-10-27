// Which languages let you through? For each game language, solve from a spawn to a goal with the language fixed.
// usage: node tools/langlocks.mjs <room> <goal: roomId | at:x,y | event:x> [spawn=x,y] [k=v counters...]
import { buildWorld, createGame, updateDisplays } from '../src/sim.js';
import { LANGS } from '../src/glyphs.js';
import { ROOMS } from './world.mjs';
import { solve, solveAny } from './solver.mjs';
import { parseGoal } from './route.mjs';
const [room, goalStr, ...kv] = process.argv.slice(2);
const world = buildWorld(ROOMS);
// the language is held fixed: selectors are taken out of the room for the sweep
for (const r of world.rooms.values()) r.parts = r.parts.filter((p) => p.kind !== 'lang');
const out = [];
for (const lang of LANGS) {
  const g = createGame(world, room, { lang });
  for (const [k, v] of kv.map((s) => s.split('='))) {
    if (k === 'spawn') { const [x, y] = v.split(',').map(Number); g.p.x = (x * 8 + 1) * 256; g.p.y = (y * 8 + 2) * 256; g.spawn = { x: g.p.x, y: g.p.y }; }
    else if (k === 'bright') g.bright = +v; else if (k.startsWith('reg.')) g.c.reg[k.slice(4)] = +v; else g.c[k] = +v;
  }
  updateDisplays(g);
  const goal = parseGoal(goalStr);
  const r = process.env.W ? solve(g, goal, { weight: +process.env.W, maxNodes: +(process.env.MAXN || 400000) }) : solveAny(g, goal, { quick: !!process.env.QUICK });
  out.push(`${lang}:${r.ok ? 'PASS' : 'no'}`);
  console.log(lang, r.ok ? 'PASS' : 'no', r.expanded);
}
console.log(room, goalStr, out.join(' '));
