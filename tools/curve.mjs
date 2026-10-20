// Difficulty proxy: solver time (s) and deaths spent per room along the canonical route.
import fs from 'node:fs';
import { buildWorld, createGame } from '../src/sim.js';
import { ROOMS, START_ROOM } from '../src/rooms.js';
import { replay } from './solver.mjs';
const data = JSON.parse(fs.readFileSync(new URL('../replays/route.json', import.meta.url), 'utf8'));
const g = createGame(buildWorld(ROOMS), START_ROOM);
const per = new Map(); const order = [];
replay(g, data.segments.flatMap((s) => s.inputs), (gg) => {
  const id = gg.room.id;
  if (!per.has(id)) { per.set(id, { steps: 0, deaths: 0 }); order.push(id); }
  const e = per.get(id); e.steps++;
  for (const ev of gg.events) if (ev.type === 'die') e.deaths++;
  gg.events.length = 0;
});
for (const id of order) { const e = per.get(id); console.log(id.padEnd(12), (e.steps / 120).toFixed(1).padStart(6) + 's', String(e.deaths).padStart(3) + ' deaths'); }
