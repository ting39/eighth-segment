import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildWorld, createGame } from '../src/sim.js';
import * as W from '../src/rooms_v3.js';
import { replay } from '../tools/solver.mjs';
import { parseGoal } from '../tools/route.mjs';
import { ROUTE } from '../tools/route-goals-v3.mjs';

const data = JSON.parse(fs.readFileSync(new URL('../replays/route-v3.json', import.meta.url), 'utf8'));
test('the recorded route covers every route goal', () => {
  assert.deepEqual(data.segments.map((s) => s.goal), ROUTE);
});

test('replaying the full route from a new game reaches every room, every slot and every stray point', () => {
  const world = buildWorld(W.ROOMS);
  const g = createGame(world, W.START_ROOM);
  const visited = new Set([W.START_ROOM]);
  const slots = [];
  for (const seg of data.segments) {
    const goal = parseGoal(seg.goal);
    let hit = false;
    replay(g, seg.inputs, (gg) => {
      visited.add(gg.room.id);
      for (const e of gg.events) if (e.type === 'slot') slots.push(e.id);
      if (goal.event && gg.events.some((e) => e.type === goal.event && (!goal.id || e.id === goal.id))) hit = true;
      gg.events.length = 0;
    });
    if (goal.room) assert.equal(g.room.id, goal.room, `segment ${seg.goal}`);
    if (goal.at) assert.deepEqual([Math.floor((g.p.x + 768) / 2048), Math.floor((g.p.y + 768) / 2048)], goal.at, `segment ${seg.goal}`);
    if (goal.ctr === 'idle') assert.equal(Math.floor(g.c.idle / 120), goal.val, `segment ${seg.goal}`);
    else if (goal.ctr === 'time') assert.equal(Math.floor(g.c.steps / 120) % goal.mod, goal.val);
    else if (goal.ctr && !goal.ctr.includes('.')) assert.equal((goal.ctr === 'visits' ? g.c.visits[g.room.id] : g.c[goal.ctr]) % goal.mod, goal.val, `segment ${seg.goal}`);
    if (goal.event) assert.ok(hit, `segment ${seg.goal}`);
  }
  assert.deepEqual([...new Set(slots)].sort(), [1, 2, 3], 'every slot (1%, 10%, 100%) reached from a new game');
  assert.equal(slots[slots.length - 1], 3, 'the run ends in the true ending');
  const total = [...world.rooms.values()].reduce((n, r) => n + r.items.filter((i) => i.kind === 'point').length, 0);
  assert.equal(g.points.size, total, 'all stray points collected');
  for (const id of world.rooms.keys()) assert.ok(visited.has(id), `room ${id} visited by the route`);
});

test('the deep ending: with every stray point, the fourth slot (1000.00 %) opens and is reachable', () => {
  const end4 = JSON.parse(fs.readFileSync(new URL('../replays/ending4-v3.json', import.meta.url), 'utf8'));
  const world = buildWorld(W.ROOMS);
  const g = createGame(world, W.START_ROOM);
  for (const seg of data.segments.slice(0, end4.from)) { replay(g, seg.inputs); g.events.length = 0; }
  const total = [...world.rooms.values()].reduce((n, r) => n + r.items.filter((i) => i.kind === 'point').length, 0);
  assert.equal(g.points.size, total);
  let slot = null;
  replay(g, end4.inputs, (gg) => { for (const e of gg.events) if (e.type === 'slot') slot = e.id; gg.events.length = 0; });
  assert.equal(slot, 4);
  const plug = world.rooms.get('hall').displays.find((d) => d.key === 'PLUG');
  assert.equal(plug.untilPoints, total, 'the plug asks for every stray point');
});
