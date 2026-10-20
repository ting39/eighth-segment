import test from 'node:test';
import assert from 'node:assert/strict';
import { IN, K, step, collides, updateDisplays, kill } from '../src/sim.js';
import { game, emptyMap, run } from './helpers.mjs';

const settle = (g, input, n) => run(g, input, n);

test('landing on a tact button adds one to its register (walking on it does not)', () => {
  const g = game({ map: emptyMap([[2, 19, 'S']]), parts: [{ kind: 'button', x: 10, y: 19, w: 2, reg: 'k' }] });
  // the button is a raised block: hop onto it, then hop in place twice
  settle(g, IN.RIGHT, 60); settle(g, IN.RIGHT | IN.JUMP, 30); settle(g, 0, 60);
  assert.equal(g.c.reg.k, 1);
  settle(g, IN.JUMP, 30); settle(g, 0, 60); settle(g, IN.JUMP, 30); settle(g, 0, 60);
  assert.equal(g.c.reg.k, 3);
});

test('a display wired to a register shows it, and its bars become solid', () => {
  const g = game({ map: emptyMap([[2, 19, 'S']]), displays: { A: { s: 2, src: 'reg:k', at: [20, 5] } } });
  g.c.reg.k = 1; updateDisplays(g);
  assert.equal(g.room.displays[0].lit, 0b0000110);
});

test('walking across a knob turns it: right = +1 per tile, left = -1', () => {
  const g = game({ map: emptyMap([[2, 18, 'S'], [0, 19, '#'.repeat(40)]]), parts: [{ kind: 'knob', x: 6, y: 19, w: 8, reg: 'n' }] });
  settle(g, IN.RIGHT, 200);
  const after = g.c.reg.n;
  assert.equal(after, 7, 'crossing 8 knob tiles = 7 clicks');
  settle(g, IN.LEFT, 160);
  assert.ok(g.c.reg.n < after, 'left turns it back');
});

test('a slide switch flips once per entry and re-wires its display', () => {
  const g = game({ map: emptyMap([[2, 19, 'S']]), parts: [{ kind: 'switch', x: 8, y: 19, sw: 'w' }],
    displays: { A: { s: 2, src: 'deaths', src2: 'jumps', sw: 'w', at: [20, 5] } } });
  settle(g, IN.RIGHT, 80);
  assert.equal(g.c.sw.w, 1);
  g.c.jumps = 7; g.c.deaths = 1; updateDisplays(g);
  assert.equal(g.room.displays[0].lit, 0b0000111);   // shows jumps (7)
  settle(g, IN.LEFT, 80);
  assert.equal(g.c.sw.w, 0);
});

test('a loose segment is carried into an empty socket and stays; dying drops a carried one', () => {
  // an 8 whose bottom bar d (row 18, just above the walkway) is missing; the loose bar is on the floor
  const def = { map: emptyMap([[2, 19, 'S']]), parts: [{ kind: 'seg', x: 8, y: 19, o: 'h', id: 'a' }],
    displays: { A: { s: 2, val: 8, sockets: 'd', at: [14, 12] } } };
  const g = game(def);
  assert.equal(g.room.displays[0].lit & 8, 0, 'socket starts empty');
  settle(g, IN.RIGHT, 60);
  assert.ok(g.carry, 'picked up');
  for (let i = 0; i < 200 && g.carry; i++) step(g, g.p.x < 15 * 2048 ? IN.RIGHT : IN.JUMP);
  assert.equal(g.carry, null, 'placed');
  settle(g, 0, 60);
  assert.equal(g.room.displays[0].lit & 8, 8, 'd is lit now');
  assert.ok(!g.p.dead && !collides(g, g.p.x, g.p.y));
  // a second game: carry, then die -> dropped
  const h = game(def);
  settle(h, IN.RIGHT, 60); assert.ok(h.carry);
  kill(h, 'test'); assert.equal(h.carry, null, 'dropped on death');
});

test('brightness: burn-in ghosts are solid at 9; dim displays vanish at 0', () => {
  const g = game({ map: emptyMap([[2, 19, 'S']]), displays: {
    A: { s: 2, val: 1, burn: true, at: [10, 10] }, B: { s: 2, val: 8, dim: true, at: [20, 10] } } });
  const solidAt = (x, y) => g.dyn[y * 40 + x] !== 0;
  g.bright = 5; updateDisplays(g);
  assert.ok(!solidAt(11, 10) && solidAt(21, 10));
  g.bright = 9; updateDisplays(g);
  assert.ok(solidAt(11, 10), 'ghost a-bar of the 1 is a ledge at 9');
  g.bright = 0; updateDisplays(g);
  assert.ok(!solidAt(21, 10), 'dim 8 is gone at 0');
});

test('the HUD is solid in HUD rooms and follows the HUD position setting', () => {
  const g = game({ map: emptyMap([[30, 19, 'S']]), hudSolid: true });
  g.c.deaths = 8; updateDisplays(g);
  const solidAt = (x, y) => g.dyn[y * 40 + x] !== 0;
  assert.ok(solidAt(16, 1), 'deaths ones digit (top bar) at the top');
  g.hudpos = 'bottom'; updateDisplays(g);
  assert.ok(!solidAt(16, 1) && solidAt(16, 16), 'moved to the bottom');
});
