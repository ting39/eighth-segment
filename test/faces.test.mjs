// v3 display faces: starburst language code, dot-matrix words, bar graphs, letter counts, the language selector.
import test from 'node:test';
import assert from 'node:assert/strict';
import { IN, updateDisplays, collides, step } from '../src/sim.js';
import { LANGS, WORDS, lettersOf, STAR, CODE } from '../src/glyphs.js';
import { DICT, tr } from '../src/i18n-game.js';
import { game, emptyMap, run } from './helpers.mjs';

test('a code display shows the language code, and its lit strokes are solid', () => {
  const g = game({ map: emptyMap([[2, 19, 'S']]), displays: { C: { t: 'code', n: 2, src: 'lang', at: [20, 2] } } }, { lang: 'en' });
  const d = g.room.displays[0];
  const lit = (lang) => { g.lang = lang; updateDisplays(g); return d.litArr.reduce((a, b) => a + b, 0); };
  for (const l of LANGS) assert.equal(lit(l), d.cells.filter((_, i) => d.litBy[l][i]).length);
  assert.notDeepEqual(d.litBy.en, d.litBy.de, 'EN and DE light different strokes');
  g.lang = 'en'; updateDisplays(g);
  // E's top bar (a) is solid: row 2, columns 21..25
  assert.ok(g.dyn[2 * 40 + 22]);
  // every code letter is defined
  for (const l of LANGS) for (const ch of CODE[l]) assert.ok(STAR[ch], `starburst ${ch}`);
});

test('a word display redraws itself (and its collision) in every language', () => {
  const g = game({ map: emptyMap([[2, 19, 'S']]), displays: { W: { t: 'word', word: 'up', at: [1, 2] } } }, { lang: 'en' });
  const widths = {};
  for (const l of LANGS) { g.lang = l; updateDisplays(g); widths[l] = Math.max(...g.room.displays[0].cells.map(([x]) => x)) - 1 + 1; }
  assert.ok(widths.es > widths.en && widths.en > widths['zh-TW'], JSON.stringify(widths));
});

test('letter counts and bar graphs: the bridge is as long as the word', () => {
  assert.deepEqual(LANGS.map((l) => lettersOf('exit', l)), [4, 2, 2, 3, 7, 6, 5]);
  const g = game({ map: emptyMap([[2, 19, 'S']]), displays: { B: { t: 'bar', n: 8, src: 'letters:exit', at: [10, 10] } } }, { lang: 'de' });
  updateDisplays(g);
  assert.equal(g.room.displays[0].lit, 0b1111111);
  g.lang = 'zh-TW'; updateDisplays(g);
  assert.equal(g.room.displays[0].lit, 0b11);
});

test('a bar graph with a modulus wraps (jumps mod 13)', () => {
  const g = game({ map: emptyMap([[2, 19, 'S']]), displays: { J: { t: 'bar', n: 12, src: 'jumps', mod: 13, at: [10, 10] } } });
  g.c.jumps = 12; updateDisplays(g); assert.equal(g.room.displays[0].lit, (1 << 12) - 1);
  g.c.jumps = 13; updateDisplays(g); assert.equal(g.room.displays[0].lit, 0);
});

test('position displays count zones of four tiles', () => {
  const g = game({ map: emptyMap([[2, 19, 'S']]), displays: { P: { s: 2, src: 'pos', at: [20, 2] } } });
  run(g, IN.RIGHT, 80);
  const col = Math.floor((g.p.x / 256 + 3) / 8);
  assert.equal(g.room.displays[0].lit, [63, 6, 91, 79, 102, 109, 125, 7, 127, 111][Math.floor(col / 4)]);
});

test('walking into the globe switch changes the language (once per entry)', () => {
  const g = game({ map: emptyMap([[2, 19, 'S']]), parts: [{ kind: 'lang', x: 8, y: 19 }] }, { lang: 'en' });
  run(g, IN.RIGHT, 80);
  assert.equal(g.lang, 'zh-TW');
  assert.ok(g.events.some((e) => e.type === 'lang' && e.lang === 'zh-TW'));
});

test('a stroke that lights inside you when the language changes crushes you', () => {
  const g = game({ map: emptyMap([[2, 19, 'S']]), displays: { C: { t: 'code', n: 1, src: 'lang', at: [10, 9] } } }, { lang: 'ja' });
  // J has no top bar: stand where E's top bar (a) will appear
  g.p.x = (12 * 8) * 256; g.p.y = (9 * 8 + 1) * 256; updateDisplays(g);
  assert.ok(!collides(g, g.p.x, g.p.y));
  g.lang = 'en'; step(g, 0);
  assert.ok(g.p.dead);
});

test('every UI string is translated into every game language', () => {
  const keys = Object.keys(DICT['zh-TW']);
  for (const l of LANGS) if (l !== 'en') for (const k of keys) assert.ok(DICT[l][k] != null, `${l} lacks "${k}"`);
  for (const l of LANGS) for (const w of Object.values(WORDS)) assert.ok(w[l], 'word in ' + l);
  assert.equal(tr('EXIT'), 'EXIT');
});

// ---- round 2
test('a time-cycled sign speaks every language in turn, one a second, starting from yours', () => {
  const g = game({ map: emptyMap([[2, 19, 'S']]), displays: { C: { t: 'code', n: 2, src: 'lang', langSrc: 'time', at: [20, 2] } } }, { lang: 'ja' });
  const d = g.room.displays[0];
  const shown = () => { updateDisplays(g); return LANGS.find((l) => d.litBy[l].every((v, i) => v === d.litArr[i])); };
  assert.equal(shown(), 'ja');
  g.c.steps = 120; assert.equal(shown(), 'ko');
  g.c.steps = 120 * 6; assert.equal(shown(), 'zh-TW');
  g.lang = 'en'; g.c.steps = 0; assert.equal(shown(), 'en');
});

test('a title card is lit (and solid) only for its first seconds in the room', () => {
  const g = game({ map: emptyMap([[2, 19, 'S']]), displays: { T: { t: 'word', word: 'down', at: [1, 2], until: 2 } } }, { lang: 'en' });
  const lit = () => { updateDisplays(g); return g.room.displays[0].litArr.some(Boolean); };
  assert.ok(lit());
  run(g, 0, 120 * 2 - 2); assert.ok(lit(), 'still lit just before the time is up');
  run(g, 0, 4); assert.ok(!lit(), 'gone after two seconds');
});

test('a map display has one block per room, lit once that room has been visited', async () => {
  const { buildWorld, createGame } = await import('../src/sim.js');
  const { ROOMS } = await import('../tools/world.mjs');
  const world = buildWorld(ROOMS);
  const g = createGame(world, 'o4');
  const d = g.room.displays.find((x) => x.t === 'map');
  assert.equal(d.mapIds.length, world.rooms.size);
  updateDisplays(g);
  assert.deepEqual(d.mapIds.filter((id, i) => d.litArr[i]), ['o4'], 'only the room you are in, on a new save');
  g.c.visits.s1 = 1; updateDisplays(g);
  const [x, y] = d.cells[d.mapIds.indexOf('s1')];
  assert.ok(g.dyn[y * 40 + x], "a visited room's block is solid");
});
