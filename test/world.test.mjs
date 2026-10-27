import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWorld, createGame, updateDisplays, collides, RW, RH, T } from '../src/sim.js';
import { LANGS } from '../src/glyphs.js';
import { ROOMS } from '../src/rooms_v3.js';

const world = buildWorld(ROOMS);
const solidTile = (r, x, y) => r.tiles[y * RW + x] === T.WALL;

test('room edges line up with their neighbours', () => {
  for (const r of world.rooms.values()) {
    const right = r.wrap ? r : world.rooms.get(world.grid.get(`${r.gx + 1},${r.gy}`));   // (a wrapping room is its own neighbour)
    if (right) for (let y = 0; y < RH; y++) assert.equal(solidTile(r, RW - 1, y), solidTile(right, 0, y), `${r.id}|${right.id} row ${y}`);
    else for (let y = 0; y < RH; y++) assert.ok(solidTile(r, RW - 1, y) || r.tiles[y * RW + RW - 1] === T.FAKE, `${r.id} right edge open at row ${y} with no neighbour`);
    const down = world.rooms.get(world.grid.get(`${r.gx},${r.gy + 1}`));
    if (down) for (let x = 0; x < RW; x++) assert.equal(solidTile(r, x, RH - 1), solidTile(down, x, 0), `${r.id}|${down.id} col ${x}`);
    if (!r.wrap && !world.rooms.get(world.grid.get(`${r.gx - 1},${r.gy}`))) for (let y = 0; y < RH; y++) assert.ok(solidTile(r, 0, y), `${r.id} left edge open at row ${y}`);
    if (!world.rooms.get(world.grid.get(`${r.gx},${r.gy - 1}`))) for (let x = 0; x < RW; x++) assert.ok(solidTile(r, x, 0), `${r.id} top edge open at col ${x}`);
  }
});

test('display cells never overlap static tiles, in any language', () => {
  for (const r of world.rooms.values()) {
    const g = createGame(world, r.id);
    for (const lang of LANGS) {
      g.lang = lang; updateDisplays(g);
      for (const d of r.displays) for (const [x, y, w, h] of d.cells)
        for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++)
          assert.ok(r.tiles[yy * RW + xx] === T.EMPTY || r.tiles[yy * RW + xx] === T.ONEWAY,   // (one-way floors run through sign strokes)
            `${r.id}: display ${d.key} (${lang}) cell at ${xx},${yy} overlaps a tile`);
    }
  }
});

test('every respawn point stands on static ground and never overlaps a display', () => {
  for (const r of world.rooms.values()) {
    const g = createGame(world, r.id);
    for (const lang of LANGS) {
      g.lang = lang; updateDisplays(g);
      for (const s of r.spawns) {
        assert.ok(solidTile(r, s.tx, s.ty + 1), `${r.id}: spawn ${s.tx},${s.ty} not on ground`);
        for (const d of r.displays) for (const [x, y, w, h] of d.cells)
          assert.ok(!(s.tx >= x && s.tx < x + w && s.ty >= y && s.ty < y + h), `${r.id}: spawn ${s.tx},${s.ty} inside display ${d.key}`);
      }
    }
  }
});

test('spawns are safe for every counter value, language and brightness', () => {
  for (const r of world.rooms.values()) {
    const g = createGame(world, r.id);
    for (const s of r.spawns) for (let v = 0; v < 16; v++) for (const lang of LANGS) for (const bright of [0, 5, 9]) {
      Object.assign(g.c, { deaths: v, jumps: v, steps: v * 120, idle: v * 120 });
      g.c.visits[r.id] = v; g.volume = v % 10; g.lang = lang; g.bright = bright; g.p.x = s.x; g.p.y = s.y;
      for (const k of Object.keys(g.c.reg)) g.c.reg[k] = v;
      g.c.reg.dial = v % 10;
      updateDisplays(g);
      assert.ok(!collides(g, s.x, s.y), `${r.id}: spawn ${s.tx},${s.ty} crushed at value ${v} (${lang}, bright ${bright})`);
    }
  }
});

test('the world has eighteen stray points; the hall readout asks for all but the wall clock\'s (beyond 100%)', () => {
  const pts = [...world.rooms.values()].reduce((n, r) => n + r.items.filter((i) => i.kind === 'point').length, 0);
  assert.equal(pts, 18);
  const hall = world.rooms.get('hall');
  assert.equal(Math.max(...hall.displays.map((d) => d.needPoints || 0)), pts - 1);
});

test('the wall clock reads the real time, and its tunnel is open only when every digit is 0, 1 or 7', () => {
  const g = createGame(world, 'x2');
  const tunnelOpen = (hhmm) => {
    g.clockMinutes = hhmm; updateDisplays(g);
    for (let x = 4; x <= 31; x++) if (g.dyn[9 * RW + x]) return false;
    return true;
  };
  for (const t of [0, 110, 707, 1001, 1111, 1717, 1017]) assert.ok(tunnelOpen(t), `open at ${t}`);
  for (const t of [1200, 1112, 835, 2359, 1710, 1170 + 0]) assert.equal(tunnelOpen(t), [...String(t).padStart(4, '0')].every((c) => '017'.includes(c)), `at ${t}`);
});

test('ATTRACT MODE: standing still in the well drops you through the sign only in JA (shows KO as you fall) or ZH (one second later)', async () => {
  const { step } = await import('../src/sim.js');
  const through = [];
  for (const lang of LANGS) {
    const g = createGame(world, 'a1', { lang, spawn: { x: (19 * 8 + 1) * 256, y: (6 * 8 + 2) * 256 } });
    for (let i = 0; i < 400; i++) step(g, 0);
    if (Math.floor((g.p.y + 768) / 2048) >= 19 && !g.c.deaths) through.push(lang);
  }
  assert.deepEqual(through, ['zh-TW', 'ja']);
});

test("NEGATIVE: the map of rooms you have NOT been to is solid; WALL CLOCK's block is the lid over the stray point", () => {
  const g = createGame(world, 'n1');
  const lid = () => { updateDisplays(g); return [33, 34, 35].every((x) => g.dyn[9 * RW + x]); };
  for (const id of world.rooms.keys()) if (id !== 'x2') g.c.visits[id] = 1;
  assert.ok(lid(), 'lid closed until WALL CLOCK has been visited');
  g.c.visits.x2 = 1;
  assert.ok(!lid(), 'visiting WALL CLOCK lifts it');
  assert.ok(!g.room.displays[0].litArr.some(Boolean), 'with every room visited the map is all air');
});

test('coming in through a door and dying respawns you on that side of the room\'s puzzle (no free points)', () => {
  const nearest = (id, x, y) => { let b = null, bd = 1e9; for (const s of world.rooms.get(id).spawns) { const d = (s.tx - x) ** 2 + (s.ty - y) ** 2; if (d < bd) { bd = d; b = s; } } return [b.tx, b.ty]; };
  assert.deepEqual(nearest('c5', 39, 19), [37, 20], 'BABEL CLOCK from INTERMISSION: not behind the sign');
  assert.deepEqual(nearest('a1', 39, 4), [36, 5], 'ATTRACT MODE from NEGATIVE: not in the chamber under the sign');
});

test('LOOP: its sides meet; every lap counts as coming in again and lights one more step', async () => {
  const { step, IN } = await import('../src/sim.js');
  const g = createGame(world, 'lp', { spawn: { x: (2 * 8 + 1) * 256, y: (20 * 8 + 2) * 256 } });
  const steps = () => { updateDisplays(g); return g.room.displays.filter((d) => d.key.startsWith('S') && d.lit).length; };
  assert.equal(g.c.visits.lp, 1); assert.equal(steps(), 0);
  for (let i = 0; i < 120 * 5; i++) step(g, IN.RIGHT);       // run right for 5 s: off the right edge, in on the left
  assert.equal(g.room.id, 'lp');
  assert.ok(g.c.visits.lp >= 2, `visits ${g.c.visits.lp}`);
  assert.equal(steps(), Math.min(6, g.c.visits.lp - 1));
});
