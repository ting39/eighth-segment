// ATLAS check: is the stray point reachable with every room visited, and with every room but one?
// usage: node tools/atlas.mjs [roomIdToLeaveOut ...]
import { buildWorld, createGame, updateDisplays } from '../src/sim.js';
import { ROOMS } from './world.mjs';
import { solve } from './solver.mjs';
const world = buildWorld(ROOMS);
const cases = [null, ...process.argv.slice(2)];
for (const skip of cases) {
  const g = createGame(world, 'o4');
  for (const id of world.rooms.keys()) if (id !== skip) g.c.visits[id] = 1;
  updateDisplays(g);
  const r = solve(g, { event: 'point' }, { weight: 2.5, maxNodes: +(process.env.MAXN || 300000) });
  console.log(skip ? `without ${skip}` : 'all visited', r.ok ? 'REACHABLE' : 'no', r.expanded);
}
