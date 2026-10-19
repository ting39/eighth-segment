import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWorld, createGame, updateDisplays } from '../src/sim.js';
import { ROOMS } from '../src/rooms.js';
import { solveAny } from '../tools/solver.mjs';

const world = buildWorld(ROOMS);

// The hub's stray point sits in the lower cell of the minute-ones digit of the real clock;
// the only way in is up through its bottom bar, which is dark only on 1, 4 and 7.
function reachHubPoint(hhmm) {
  const g = createGame(world, 'hub');
  g.p.x = (37 * 8 + 1) * 256; g.p.y = (19 * 8 + 2) * 256; g.spawn = { x: g.p.x, y: g.p.y };
  g.clockMinutes = hhmm;
  updateDisplays(g);
  return solveAny(g, { at: [36, 7] }, { noDeath: true, restart: false, quick: true }).ok;
}

test('hub clock point opens only on minutes ending in 1, 4 or 7', () => {
  for (const t of [2341, 1204, 917]) assert.ok(reachHubPoint(t), `reachable at ${t}`);
  for (const t of [2340, 1208, 916, 2025]) assert.ok(!reachHubPoint(t), `sealed at ${t}`);
});
