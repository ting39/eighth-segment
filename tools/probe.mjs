// Replay the stored route up to goal N, then try solving extra goals from there (debugging a failed segment).
// usage: node tools/probe.mjs N goal [goal...]     (W, MAXN env as in try.mjs)
import fs from 'node:fs';
import { buildWorld, createGame, updateDisplays } from '../src/sim.js';
import { ROOMS, START_ROOM } from './world.mjs';
import { solve, replay } from './solver.mjs';
import { parseGoal } from './route.mjs';
import { RW } from '../src/sim.js';
const [n, ...goals] = process.argv.slice(2);
const { segments } = JSON.parse(fs.readFileSync(new URL('../replays/route-v3.json', import.meta.url), 'utf8'));
const g = createGame(buildWorld(ROOMS), START_ROOM);
for (const s of segments.slice(0, +n)) { replay(g, s.inputs); g.events.length = 0; }
console.log('at', g.room.id, (g.p.x / 2048).toFixed(1), (g.p.y / 2048).toFixed(1), 'bright', g.bright, 'points', g.points.size, JSON.stringify(g.c.reg), JSON.stringify(g.c.sw));
if (process.env.SHOW) { updateDisplays(g); for (let y = 0; y < 22; y++) { let s = ''; for (let x = 0; x < RW; x++) s += g.dyn[y * RW + x] ? '█' : g.room.map[y][x]; console.log(String(y).padStart(2), s); } }
for (const gs of goals) {
  const goal = parseGoal(gs);
  if (goal.set !== undefined) { replay(g, [[goal.set, 1]]); console.log(gs, 'set'); continue; }
  const r = solve(g, goal, { weight: +(process.env.W || 2.5), maxNodes: +(process.env.MAXN || 300000) });
  console.log(gs, r.ok ? 'ok' : 'FAIL', r.expanded);
  if (!r.ok) break;
  replay(g, r.inputs); g.events.length = 0;
}
if (process.env.PTS) console.log([...g.points].join(' '));
