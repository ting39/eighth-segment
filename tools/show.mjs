// Print rooms as ASCII with display segments overlaid.
// usage: node tools/show.mjs <roomId|all> [deaths=0 jumps=0 time=0 ...]
import { buildWorld, createGame, updateDisplays, RW, RH } from '../src/sim.js';
import { ROOMS } from './world.mjs';
const world = buildWorld(ROOMS);
const [id = 'all', ...kv] = process.argv.slice(2);
const set = Object.fromEntries(kv.map((s) => s.split('=')));
for (const r of world.rooms.values()) {
  if (id !== 'all' && r.id !== id) continue;
  const g = createGame(world, r.id);
  for (const [k, v] of Object.entries(set)) { if (k === 'volume') g.volume = +v; else if (k === 'visits') g.c.visits[r.id] = +v; else g.c[k] = +v; }
  updateDisplays(g);
  console.log(`== ${r.id} (${r.gx},${r.gy}) ${r.region} "${r.name}"`);
  console.log('   ' + Array.from({ length: RW }, (_, i) => i % 10).join(''));
  for (let y = 0; y < RH; y++) {
    let s = '';
    for (let x = 0; x < RW; x++) {
      const ch = r.map[y][x];
      let ghost = false;
      for (const d of r.displays) for (const [cx, cy, w, h] of d.cells) if (x >= cx && x < cx + w && y >= cy && y < cy + h) ghost = true;
      s += g.dyn[y * RW + x] ? '█' : ghost ? '░' : ch;
    }
    console.log(String(y).padStart(2) + ' ' + s);
  }
}
