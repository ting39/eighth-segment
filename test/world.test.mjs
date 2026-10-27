import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWorld, createGame, updateDisplays, collides, RW, RH, T } from '../src/sim.js';
import { LANGS } from '../src/glyphs.js';
import { ROOMS } from '../src/rooms_v3.js';

const world = buildWorld(ROOMS);
const solidTile = (r, x, y) => r.tiles[y * RW + x] === T.WALL;

test('room edges line up with their neighbours', () => {
  for (const r of world.rooms.values()) {
    const right = world.rooms.get(world.grid.get(`${r.gx + 1},${r.gy}`));
    if (right) for (let y = 0; y < RH; y++) assert.equal(solidTile(r, RW - 1, y), solidTile(right, 0, y), `${r.id}|${right.id} row ${y}`);
    else for (let y = 0; y < RH; y++) assert.ok(solidTile(r, RW - 1, y) || r.tiles[y * RW + RW - 1] === T.FAKE, `${r.id} right edge open at row ${y} with no neighbour`);
    const down = world.rooms.get(world.grid.get(`${r.gx},${r.gy + 1}`));
    if (down) for (let x = 0; x < RW; x++) assert.equal(solidTile(r, x, RH - 1), solidTile(down, x, 0), `${r.id}|${down.id} col ${x}`);
    if (!world.rooms.get(world.grid.get(`${r.gx - 1},${r.gy}`))) for (let y = 0; y < RH; y++) assert.ok(solidTile(r, 0, y), `${r.id} left edge open at row ${y}`);
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
          assert.equal(r.tiles[yy * RW + xx], T.EMPTY, `${r.id}: display ${d.key} (${lang}) cell at ${xx},${yy} overlaps a tile`);
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

test('the world has ten stray points and the hall readout asks for all of them', () => {
  const pts = [...world.rooms.values()].reduce((n, r) => n + r.items.filter((i) => i.kind === 'point').length, 0);
  assert.equal(pts, 10);
  const hall = world.rooms.get('hall');
  assert.equal(Math.max(...hall.displays.map((d) => d.needPoints || 0)), pts);
});
