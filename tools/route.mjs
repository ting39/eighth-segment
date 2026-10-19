// Build (or verify) the full-game route: a list of goals solved in sequence from a new game.
// usage: node tools/route.mjs            -> solve all segments, write replays/route.json
//        node tools/route.mjs --from N   -> reuse stored segments < N, re-solve from N
import fs from 'node:fs';
const log = (s) => fs.writeSync(1, s + '\n');
import { buildWorld, createGame, snapshot } from '../src/sim.js';
import { ROOMS, START_ROOM } from '../src/rooms.js';
import { solveAny, replay } from './solver.mjs';
import { ROUTE } from './route-goals.mjs';

export function parseGoal(s) {
  if (s.startsWith('at:')) return { at: s.slice(3).split(',').map(Number) };
  if (s.startsWith('vol:')) return { vol: +s.slice(4) };
  const m = s.match(/^(deaths|jumps|idle|visits|time):(\d+)(?:\/(\d+))?(?:@(\d+),(\d+))?$/);
  if (m) return { ctr: m[1], val: +m[2], mod: m[3] ? +m[3] : 10, ...(m[4] ? { stay: [+m[4], +m[5]] } : {}) };
  if (s.startsWith('event:')) { const [ev, id] = s.slice(6).split('/'); return { event: ev, id: id ? +id : undefined }; }
  return { room: s };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fromIdx = process.argv.includes('--from') ? +process.argv[process.argv.indexOf('--from') + 1] : 0;
  const file = new URL('../replays/route.json', import.meta.url);
  const old = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { segments: [] };
  const world = buildWorld(ROOMS);
  const g = createGame(world, START_ROOM);
  const segments = [];
  for (let i = 0; i < ROUTE.length; i++) {
    const goalStr = ROUTE[i];
    if (i < fromIdx && old.segments[i] && old.segments[i].goal === goalStr) {
      replay(g, old.segments[i].inputs); g.events.length = 0; segments.push(old.segments[i]); continue;
    }
    const goal = parseGoal(goalStr);
    const t0 = Date.now();
    if (goal.vol !== undefined) { segments.push({ goal: goalStr, inputs: [[16 + goal.vol, 1]] }); replay(g, [[16 + goal.vol, 1]]); continue; }
    const r = solveAny(g, goal);
    if (!r.ok) {
      log(`#${i} ${goalStr} FAILED from room ${g.room.id} (${(g.p.x / 256).toFixed(0)},${(g.p.y / 256).toFixed(0)}) after ${Date.now() - t0} ms`);
      fs.writeFileSync(file, JSON.stringify({ segments }, null, 0));
      process.exit(1);
    }
    replay(g, r.inputs); g.events.length = 0;
    segments.push({ goal: goalStr, inputs: r.inputs });
    const steps = r.inputs.reduce((a, [, k]) => a + k, 0);
    log(`#${i} ${goalStr} ok ${steps} steps, ${r.expanded} nodes, ${Date.now() - t0} ms -> ${g.room.id} D${g.c.deaths} J${g.c.jumps}`);
  }
  fs.writeFileSync(file, JSON.stringify({ segments }, null, 0));
  const s = snapshot(g);
  console.log('done', s.room, 'deaths', s.c.deaths, 'jumps', s.c.jumps, 'time', (s.c.steps / 120).toFixed(1) + 's');
}
