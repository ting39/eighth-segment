// Luck test (skill §8): random "naive" play from a spot; how often does it reach a goal room / event by accident?
// usage: node tools/luck.mjs <room> <x,y> <goal: roomId | event:point> [trials=200] [steps=1800] [k=v ...]
import { buildWorld, createGame, step, updateDisplays, IN } from '../src/sim.js';
import { ROOMS } from './world.mjs';
const [room, at, goal, trials = 200, steps = 1800, ...kv] = process.argv.slice(2);
const world = buildWorld(ROOMS);
let seed = 12345; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
let hits = 0;
for (let t = 0; t < +trials; t++) {
  const [x, y] = at.split(',').map(Number);
  const g = createGame(world, room, { spawn: { x: (x * 8 + 1) * 256, y: (y * 8 + 2) * 256 } });
  for (const [k, v] of kv.map((s) => s.split('='))) { if (k === 'visitall') for (const id of world.rooms.keys()) g.c.visits[id] = 1; else if (k.startsWith('reg.')) g.c.reg[k.slice(4)] = +v; }
  updateDisplays(g);
  let m = 0, hit = false;
  for (let i = 0; i < +steps && !hit; i++) {
    if (i % 20 === 0) { const r = rnd(); m = (r < 0.4 ? IN.LEFT : r < 0.8 ? IN.RIGHT : 0) | (rnd() < 0.35 ? IN.JUMP : 0); }
    step(g, m);
    if (goal.startsWith('event:') ? g.events.some((e) => e.type === goal.slice(6)) : g.room.id === goal) hit = true;
    g.events.length = 0;
  }
  if (hit) hits++;
}
console.log(`${room} from ${at} -> ${goal}: ${hits}/${trials} random players (${(100 * hits / trials).toFixed(1)}%)`);
