// Build (or verify) the full-game route: a list of goals solved in sequence from a new game.
// usage: node tools/route.mjs            -> solve all segments, write replays/route.json
//        node tools/route.mjs --from N   -> reuse stored segments < N, re-solve from N
//        node tools/route.mjs --to N     -> stop after goal N (build the route room by room)
import fs from 'node:fs';
const log = (s) => fs.writeSync(1, s + '\n');
import { buildWorld, createGame, snapshot, restore } from '../src/sim.js';
import { ROOMS, START_ROOM } from './world.mjs';
import { solveAny, replay } from './solver.mjs';
import { LANGS } from '../src/glyphs.js';
const { ROUTE } = await import('./route-goals-v3.mjs');

export function parseGoal(s) {
  if (s.startsWith('at:')) return { at: s.slice(3).split(',').map(Number) };
  if (s.startsWith('vol:')) return { set: 16 + +s.slice(4) };
  if (s.startsWith('bright:')) return { set: 32 + +s.slice(7) };
  if (s.startsWith('lang:')) return { set: 64 + LANGS.indexOf(s.slice(5)) };
  if (s === 'hud:top') return { set: 48 };
  if (s === 'hud:bottom') return { set: 49 };
  if (s === 'hud:off') return { set: 50 };
  if (s.startsWith('pause:')) return { set: 128 + +s.slice(6) };
  const m = s.match(/^(deaths|jumps|idle|visits|time|reg\.\w+|sw\.\w+):(\d+)(?:\/(\d+))?(?:@(\d+),(\d+))?$/);
  if (m) return { ctr: m[1], val: +m[2], mod: m[3] ? +m[3] : (m[1].startsWith('sw.') ? 2 : 10), ...(m[4] ? { stay: [+m[4], +m[5]] } : {}) };
  if (s.startsWith('event:')) { const [ev, id] = s.slice(6).split('/'); return { event: ev, id: id ? +id : undefined }; }
  return { room: s };
}

function stillReaches(g, goal) {
  if (goal.set !== undefined) return true;
  if (g.p.dead) return false;
  if (goal.room) return g.room.id === goal.room;
  if (goal.event) return g.events.some((e) => e.type === goal.event && (!goal.id || e.id === goal.id));
  if (goal.at) return Math.floor((g.p.x + 768) / 2048) === goal.at[0] && Math.floor((g.p.y + 768) / 2048) === goal.at[1];
  return true;   // counter goals: trust them (their state is checked by the next goals)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fromIdx = process.argv.includes('--from') ? +process.argv[process.argv.indexOf('--from') + 1] : 0;
  const file = new URL('../replays/route-v3.json', import.meta.url);
  const old = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { segments: [] };
  const world = buildWorld(ROOMS);
  const g = createGame(world, START_ROOM);
  const segments = [];
  const toIdx = process.argv.includes('--to') ? +process.argv[process.argv.indexOf('--to') + 1] : ROUTE.length - 1;
  for (let i = 0; i <= Math.min(toIdx, ROUTE.length - 1); i++) {
    const goalStr = ROUTE[i];
    if (i < fromIdx && old.segments[i] && old.segments[i].goal === goalStr) {
      // a stored segment is only reused if it still does its job (rooms may have changed since it was solved)
      const snap = snapshot(g);
      g.events.length = 0; replay(g, old.segments[i].inputs);
      if (stillReaches(g, parseGoal(goalStr))) { g.events.length = 0; segments.push(old.segments[i]); continue; }
      log(`#${i} ${goalStr}: stored inputs no longer reach it -> re-solving from here`);
      restore(g, snap); g.events.length = 0;
    }
    const goal = parseGoal(goalStr);
    const t0 = Date.now();
    if (goal.set !== undefined) { segments.push({ goal: goalStr, inputs: [[goal.set, 1]] }); replay(g, [[goal.set, 1]]); continue; }
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
