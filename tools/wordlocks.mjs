// Which languages can cross a segment-word bridge? Per language: solve to the leftmost lit top stroke, then on.
// usage: node tools/wordlocks.mjs <room> <displayKey> <spawn x,y> <final goal> [topRow]
import { buildWorld, createGame, updateDisplays } from '../src/sim.js';
import { LANGS } from '../src/glyphs.js';
import { ROOMS } from './world.mjs';
import { solve, replay } from './solver.mjs';
import { parseGoal } from './route.mjs';
const [room, key, sp, fin, topRowArg] = process.argv.slice(2);
const world = buildWorld(ROOMS);
for (const r of world.rooms.values()) r.parts = r.parts.filter((p) => p.kind !== 'lang');
const out = [];
for (const lang of LANGS) {
  const [sx, sy] = sp.split(',').map(Number);
  const g = createGame(world, room, { lang, spawn: { x: (sx * 8 + 1) * 256, y: (sy * 8 + 2) * 256 } });
  updateDisplays(g);
  const d = g.room.displays.find((q) => q.key === key);
  const lay = d.layouts[lang];
  const top = topRowArg ? +topRowArg : Math.min(...lay.cells.map((c) => c[1]));
  const xs = lay.cells.filter((c, i) => lay.on[i] && c[1] === top).flatMap(([x, , w]) => Array.from({ length: w }, (_, k) => x + k));
  const goals = xs.length ? [`at:${Math.min(...xs)},${top - 1}`, fin] : [fin];
  let ok = true;
  for (const gs of goals) { const r = solve(g, parseGoal(gs), { weight: 2.5, maxNodes: +(process.env.MAXN || 120000) }); if (!r.ok) { ok = false; break; } replay(g, r.inputs); g.events.length = 0; }
  out.push(`${lang}:${ok ? 'PASS' : 'no'}`);
}
console.log(room, key, fin, out.join(' '));
