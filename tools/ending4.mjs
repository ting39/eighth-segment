// Prove the deep ending: replay the full route up to (not including) its last goal -- the 100% slot -- then solve
// to the fourth slot (1000.00 %), which opens only with every stray point. Writes replays/ending4-v3.json.
import fs from 'node:fs';
import { buildWorld, createGame } from '../src/sim.js';
import { ROOMS, START_ROOM } from './world.mjs';
import { solveAny, replay } from './solver.mjs';
const { segments } = JSON.parse(fs.readFileSync(new URL('../replays/route-v3.json', import.meta.url), 'utf8'));
const g = createGame(buildWorld(ROOMS), START_ROOM);
const from = segments.length - 1;
for (const s of segments.slice(0, from)) { replay(g, s.inputs); g.events.length = 0; }
const r = solveAny(g, { event: 'slot', id: 4 });
if (!r.ok) { console.log('FAILED'); process.exit(1); }
fs.writeFileSync(new URL('../replays/ending4-v3.json', import.meta.url), JSON.stringify({ from, inputs: r.inputs }));
console.log('ending 4 from goal', from, 'in', r.inputs.reduce((a, [, k]) => a + k, 0), 'steps; points', g.points.size);
