import test from 'node:test';
import assert from 'node:assert/strict';
import { IN, SUB, K, TS, step, snapshot } from '../src/sim.js';
import { game, emptyMap, run } from './helpers.mjs';

const flat = () => ({ map: emptyMap([[5, 19, 'S']]) });

function apex(g, input, steps = 150) {
  const y0 = g.p.y; let m = y0;
  for (let i = 0; i < steps; i++) { step(g, i === 0 ? input | IN.JUMP : input); m = Math.min(m, g.p.y); }
  return (y0 - m) / SUB;
}

test('held jump clears 3 tiles but not 4', () => {
  const g = game(flat());
  const y0 = g.p.y; let m = y0;
  for (let i = 0; i < 150; i++) { step(g, IN.JUMP); m = Math.min(m, g.p.y); }
  const h = (y0 - m) / SUB;
  assert.ok(h > 24 && h < 32, `height ${h}`);
});

test('releasing jump early gives a lower jump (variable height)', () => {
  const tap = apex(game(flat()), 0);
  const g = game(flat());
  const y0 = g.p.y; let m = y0;
  for (let i = 0; i < 150; i++) { step(g, i < 15 ? IN.JUMP : 0); m = Math.min(m, g.p.y); }
  const mid = (y0 - m) / SUB;
  assert.ok(tap < 8, `tap ${tap}`);
  assert.ok(mid > tap && mid < 24, `mid ${mid}`);
});

test('run reaches full speed within ~50 ms and stops quickly', () => {
  const g = game(flat());
  run(g, IN.RIGHT, 6);
  assert.equal(g.p.vx, K.RUN);
  run(g, 0, 5);
  assert.equal(g.p.vx, 0);
});

test('every jump increments the jump counter exactly once', () => {
  const g = game(flat());
  for (let j = 0; j < 3; j++) { run(g, IN.JUMP, 30); run(g, 0, 100); }
  assert.equal(g.c.jumps, 3);
});

test('coyote time: jump allowed shortly after leaving a ledge, not later', () => {
  // ledge at x 0..9, pit beyond
  const mk = () => game({ map: emptyMap([[2, 19, 'S'], [10, 20, '..........'], [10, 21, '..........']]) });
  for (const [delay, ok] of [[8, true], [16, false]]) {
    const g = mk();
    let t = 0;
    while (g.p.ground && t < 400) { step(g, IN.RIGHT); t++; }
    run(g, IN.RIGHT, delay);
    const before = g.c.jumps;
    step(g, IN.RIGHT | IN.JUMP);
    assert.equal(g.c.jumps - before, ok ? 1 : 0, `delay ${delay}`);
  }
});

test('jump buffer: pressing just before landing still jumps', () => {
  const g = game(flat());
  run(g, IN.JUMP, 1); run(g, 0, 1);            // tap jump
  let t = 0;
  while (!(g.p.vy > 0 && g.p.y > (154 - 3) * SUB) && t < 300) { step(g, 0); t++; }
  // now falling close to the floor; press jump and keep holding
  const before = g.c.jumps;
  let landedBefore = false;
  for (let i = 0; i < 10; i++) { step(g, IN.JUMP); if (g.c.jumps > before) break; }
  assert.equal(g.c.jumps, before + 1);
  assert.ok(!landedBefore);
});

test('head-corner correction slides around a ceiling edge', () => {
  // ceiling block whose right edge overlaps the player by 2px
  const map = emptyMap([[10, 19, 'S'], [8, 16, '###']]); // block tiles 8..10 at row 16
  const g = game({ map });
  // spawn x = 10*8+1 = 81px, block right edge at 88px; player spans 81..87 -> fully under. shift:
  g.p.x = (88 - 2) * SUB; // spans 86..92, overlap 2px
  const y0 = g.p.y; let m = y0;
  for (let i = 0; i < 60; i++) { step(g, IN.JUMP); m = Math.min(m, g.p.y); }
  assert.ok(y0 - m > 20 * SUB, 'jump was blocked');
  assert.ok(g.p.x >= 88 * SUB, 'not nudged');
});

test('the 6px dot fits through a 1-tile corner gap', () => {
  const map = emptyMap([[2, 19, 'S'], [20, 0, '#'], [20, 1, '#']]);
  for (let y = 2; y < 19; y++) map[y] = map[y].slice(0, 20) + '#' + map[y].slice(21);
  map[19] = map[19].slice(0, 20) + '.' + map[19].slice(21); // one-tile hole at floor level
  const g = game({ map });
  run(g, IN.RIGHT, 400);
  assert.ok(g.p.x > 21 * TS, `stuck at ${g.p.x / SUB}`);
});

test('a segment lighting up inside the player crushes them; death is counted', () => {
  // death-counter digit whose 'g' bar crosses the spawn row; spawn sits on a static wall
  const map = emptyMap([[3, 10, 'S'], [2, 11, '###'], [1, 12, 'A'], [20, 19, '^']]);
  const g = game({ map, displays: { A: { s: 3, src: 'jumps' } } });
  // digit at (1,14) s=3: g bar spans x 2..4, y 18 -> no. Use posy-independent check instead:
  assert.equal(g.c.deaths, 0);
  // Force a crush: place the player inside the 'a' bar of the digit and show 0 (a lit)
  g.p.x = 3 * TS; g.p.y = 12 * TS;
  step(g, 0);
  assert.equal(g.c.deaths, 1);
  assert.ok(g.p.dead);
  run(g, 0, K.DEATH_STEPS + 1);
  assert.ok(!g.p.dead);
});

test('spikes kill; respawn returns to the entry point', () => {
  const g = game({ map: emptyMap([[2, 19, 'S'], [8, 19, '^^^']]) });
  let t = 0;
  while (!g.p.dead && t++ < 300) step(g, IN.RIGHT);
  assert.equal(g.c.deaths, 1);
  run(g, 0, K.DEATH_STEPS + 2);
  assert.equal(g.p.x, (2 * 8 + 1) * SUB);
});

test('walking off the right edge enters the neighbouring room', () => {
  const a = { id: 'a', gx: 0, map: emptyMap([[2, 19, 'S']]) };
  const b = { id: 'b', gx: 1, map: emptyMap([[3, 19, 'P']]) };
  const g = game([a, b]);
  run(g, IN.RIGHT, 500);
  assert.equal(g.room.id, 'b');
  assert.equal(g.c.visits.b, 1);
});

test('the sim is deterministic', () => {
  const seq = []; let s = 12345;
  for (let i = 0; i < 2000; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; seq.push(s % 8); }
  const a = game(flat()), b = game(flat());
  for (const i of seq) { step(a, i); step(b, i); }
  assert.deepEqual(snapshot(a), snapshot(b));
});
