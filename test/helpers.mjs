import { buildWorld, createGame, step } from '../src/sim.js';

// Build a one-room (or multi-room) world from compact defs.
export function world(...defs) {
  return buildWorld(defs.map((d, i) => ({ id: d.id || `t${i}`, gx: d.gx ?? i, gy: d.gy ?? 0, ...d })));
}

export function emptyMap(fill = []) {
  const rows = [];
  for (let y = 0; y < 22; y++) rows.push((y >= 20 ? '#' : '.').repeat(40));
  for (const [x, y, s] of fill) rows[y] = rows[y].slice(0, x) + s + rows[y].slice(x + s.length);
  return rows;
}

export function run(g, input, n) {
  for (let i = 0; i < n; i++) step(g, input);
}

export function game(defs, opts) {
  const w = world(...[].concat(defs));
  return createGame(w, [].concat(defs)[0].id || 't0', opts);
}
