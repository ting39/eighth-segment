// Jump success rate (skill §8): sample start x, jump delay and sideways delay; count arrivals.
// usage: V2=1 node tools/jumprate.mjs room fromX fromY toX toY dir [k=v ...]
import { buildWorld, createGame, step, updateDisplays, IN, SUB, TS } from '../src/sim.js';
import { ROOMS } from './world.mjs';
const [room, fx, fy, tx, ty, dir, ...kv] = process.argv.slice(2);
const world = buildWorld(ROOMS);
let ok = 0, total = 0;
// dir 'L>R' / 'R>L': hold the first direction, then switch to the second after `turn` steps (a drift onto a ledge)
const turns = dir.includes('>') ? [10, 16, 22, 28, 34] : [999];
for (const turn of turns) for (let sx = -4; sx <= 4; sx += 1) for (let delay = 0; delay <= 24; delay += 4) for (let side = 0; side <= 12; side += 4) for (const hold of [12, 24, 40]) {
  const g = createGame(world, room);
  for (const [k, v] of kv.map((s) => s.split('='))) { if (k === 'hudpos') g.hudpos = v; else if (k === 'bright') g.bright = +v; else if (k === 'volume') g.volume = +v; else if (k === 'lang') g.lang = v; else if (k.startsWith('reg.')) g.c.reg[k.slice(4)] = +v; else if (k === 'visitall') { for (const id of world.rooms.keys()) g.c.visits[id] = 1; } else g.c[k] = +v; }
  g.p.x = (+fx * 8 + 1 + sx) * SUB; g.p.y = (+fy * 8 + 2) * SUB; g.p.ground = true;
  updateDisplays(g); total++;
  for (let i = 0; i < 200; i++) {
    let m = 0; const d = i - delay >= turn ? dir.slice(-1) : dir[0];
    if (i >= side) m |= d === 'L' ? IN.LEFT : IN.RIGHT; if (i >= delay && i < delay + hold) m |= IN.JUMP;
    step(g, m);
    if (g.p.dead) break;
    if (g.p.ground && String(tx).split('-').map(Number).some((t, _, a) => a.length > 1 ? (Math.floor((g.p.x + 768) / TS) >= a[0] && Math.floor((g.p.x + 768) / TS) <= a[1]) : Math.floor((g.p.x + 768) / TS) === t) && Math.floor((g.p.y + 768) / TS) === +ty) { ok++; break; }
  }
}
console.log(`${room} (${fx},${fy})->(${tx},${ty}): ${ok}/${total} = ${(100 * ok / total).toFixed(1)}%`);
