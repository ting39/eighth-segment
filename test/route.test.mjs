import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildWorld, createGame } from '../src/sim.js';
import * as V1 from '../src/rooms.js';
import * as V2 from '../src/rooms_v2.js';
import { replay } from '../tools/solver.mjs';
import { parseGoal } from '../tools/route.mjs';
import { ROUTE as ROUTE1 } from '../tools/route-goals.mjs';
import { ROUTE as ROUTE2 } from '../tools/route-goals-v2.mjs';


for (const [label, W, ROUTE, file, points, ending] of [['v1', V1, ROUTE1, 'route.json', 10, 3], ['v2', V2, ROUTE2, 'route-v2.json', 4, 3]]) {
const data = JSON.parse(fs.readFileSync(new URL('../replays/' + file, import.meta.url), 'utf8'));
test(label + ': the recorded route covers every route goal', () => {
  assert.deepEqual(data.segments.map((s) => s.goal), ROUTE);
});

test(label + ': replaying the full route from a new game reaches every goal and the true ending', () => {
  const world = buildWorld(W.ROOMS);
  const g = createGame(world, W.START_ROOM);
  const visited = new Set([W.START_ROOM]);
  let ended = null;
  for (const seg of data.segments) {
    const goal = parseGoal(seg.goal);
    let hit = false;
    replay(g, seg.inputs, (gg) => {
      visited.add(gg.room.id);
      for (const e of gg.events) if (e.type === 'slot') ended = e.id;
      if (goal.event && gg.events.some((e) => e.type === goal.event && (!goal.id || e.id === goal.id))) hit = true;
      gg.events.length = 0;
    });
    if (goal.room) assert.equal(g.room.id, goal.room, `segment ${seg.goal}`);
    if (goal.at) assert.deepEqual([Math.floor((g.p.x + 768) / 2048), Math.floor((g.p.y + 768) / 2048)], goal.at, `segment ${seg.goal}`);
    if (goal.ctr === 'idle') assert.equal(Math.floor(g.c.idle / 120), goal.val, `segment ${seg.goal}`);
    else if (goal.ctr === 'time') assert.equal(Math.floor(g.c.steps / 120) % goal.mod, goal.val);
    else if (goal.ctr && goal.ctr.includes('.')) { /* register / switch waypoint */ }
    else if (goal.ctr) assert.equal(g.c[goal.ctr] % goal.mod, goal.val, `segment ${seg.goal}`);
    if (goal.event) assert.ok(hit, `segment ${seg.goal}`);
  }
  assert.equal(ended, 3, 'true ending reached');
  assert.equal(g.points.size, points, 'stray points collected');
  const playable = [...world.rooms.keys()].filter((id) => id !== 'title');
  for (const id of playable) assert.ok(visited.has(id), `room ${id} visited by the route`);
});
}
