// v3 display faces that are not seven-segment: the starburst (14-segment) letters of the language-code
// display and the dot-matrix glyphs of word displays. Pure data + geometry, shared by sim, renderer and tools.
import { FONT57 } from './font57.js';

// Game languages. The first three are the site's; the rest exist only in the game, chosen because their
// words take very different shapes (Hangul blocks, long German compounds, Spanish, Cyrillic).
export const LANGS = ['en', 'zh-TW', 'ja', 'ko', 'de', 'es', 'ru'];
export const CODE = { en: 'EN', 'zh-TW': 'ZH', ja: 'JA', ko: 'KO', de: 'DE', es: 'ES', ru: 'RU' };
export const LANG_NAME = { en: 'ENGLISH', 'zh-TW': '中文', ja: '日本語', ko: '한국어', de: 'DEUTSCH', es: 'ESPAÑOL', ru: 'РУССКИЙ' };

// Words that appear ON displays (and so become geometry). Keep CJK/Hangul to the hand-made glyphs below.
export const WORDS = {
  exit: { en: 'EXIT', 'zh-TW': '出口', ja: '出口', ko: '나가기', de: 'AUSGANG', es: 'SALIDA', ru: 'ВЫХОД' },
  up: { en: 'UP', 'zh-TW': '上', ja: '上', ko: '위', de: 'OBEN', es: 'ARRIBA', ru: 'ВВЕРХ' },
  // a room name that is also a word display (the title card in p4): keep it equal to the room's translated name
  down: { en: 'DOWN', 'zh-TW': '下', ja: '下', ko: '아래', de: 'UNTEN', es: 'ABAJO', ru: 'ВНИЗ' },
};
export const wordOf = (key, lang) => (WORDS[key] || {})[lang] ?? (WORDS[key] || {}).en ?? '';

// ---- words drawn BY SEGMENTS (the redesign): each room's own word, in your language, as a segment display.
// Latin/Cyrillic use the 14-seg starburst below (<= 5 letters fit a room); zh/ja/ko use a STROKE LATTICE: 5x5
// nodes two tiles apart, every unit stroke between neighbouring nodes is a segment (custom-layout segment displays
// are how real hardware shows a small set of kanji). Lit strokes are solid like every other segment.
export const SEGWORDS = {
  up:   { en: 'UP', 'zh-TW': '上', ja: '上', ko: '위', de: 'AUF', es: 'SUBE', ru: 'ВЕРХ' },
  down: { en: 'DOWN', 'zh-TW': '下', ja: '下', ko: '아래', de: 'AB', es: 'BAJO', ru: 'ВНИЗ' },
  gate: { en: 'GATE', 'zh-TW': '門', ja: '門', ko: '문', de: 'TOR', es: 'REJA', ru: 'ВХОД' },
};
// lattice strokes: ['h', row, c0, c1] / ['v', col, r0, r1] in node units (0..4)
const LAT_DEF = {
  '上': [['v', 2, 0, 4], ['h', 2, 2, 3], ['h', 4, 0, 4]],
  '下': [['h', 0, 0, 4], ['v', 2, 0, 4], ['h', 2, 2, 3]],
  '위': [['h', 0, 0, 2], ['h', 1, 0, 2], ['v', 0, 0, 1], ['v', 2, 0, 1], ['h', 2, 0, 3], ['v', 2, 2, 4], ['v', 4, 0, 4]],
  '아': [['h', 1, 0, 2], ['h', 3, 0, 2], ['v', 0, 1, 3], ['v', 2, 1, 3], ['v', 3, 0, 4], ['h', 2, 3, 4]],
  '래': [['h', 0, 0, 2], ['v', 2, 0, 2], ['h', 2, 0, 2], ['v', 0, 2, 4], ['h', 4, 0, 2], ['v', 3, 0, 4], ['v', 4, 0, 4], ['h', 2, 3, 4]],
  '門': [['v', 0, 0, 4], ['v', 4, 0, 4], ['h', 0, 0, 1], ['h', 1, 0, 1], ['v', 1, 0, 1], ['h', 0, 3, 4], ['h', 1, 3, 4], ['v', 3, 0, 1]],
  '문': [['h', 0, 1, 3], ['h', 1, 1, 3], ['v', 1, 0, 1], ['v', 3, 0, 1], ['h', 2, 0, 4], ['v', 2, 2, 3], ['v', 1, 3, 4], ['h', 4, 1, 3]],
};
export const LAT_W = 9, LAT_PITCH = 10;
const latEdges = () => { const e = []; for (let r = 0; r <= 4; r++) for (let c = 0; c < 4; c++) e.push(['h', r, c]); for (let c = 0; c <= 4; c++) for (let r = 0; r < 4; r++) e.push(['v', c, r]); return e; };
const LAT_EDGES = latEdges();
function latOn(ch) {
  const on = new Set();
  for (const [k, a, b0, b1] of LAT_DEF[ch] || []) for (let b = b0; b < b1; b++) on.add(k === 'h' ? `h${a},${b}` : `v${a},${b}`);
  return LAT_EDGES.map(([k, a, b]) => (on.has(`${k}${a},${b}`) ? 1 : 0));
}
// cells + lit flags for a segment-drawn word at (x0,y0); align 'left' | 'center' | 'right' within width w
export function segLayout(word, x0, y0, align = 'left', w = 0) {
  const chars = [...word];
  const lat = chars.some((ch) => LAT_DEF[ch]);
  const pitch = lat ? LAT_PITCH : STAR_PITCH, cw = lat ? LAT_W : STAR_W;
  const width = chars.length * pitch - (pitch - cw);
  const x = align === 'right' ? x0 + w - width : align === 'center' ? x0 + Math.floor((w - width) / 2) : x0;
  const cells = [], on = [];
  chars.forEach((ch, k) => {
    const cx = x + k * pitch;
    if (lat) {
      const lit = latOn(ch);
      LAT_EDGES.forEach(([kind, a, b], i) => { cells.push(kind === 'h' ? [cx + 2 * b, y0 + 2 * a, 3, 1] : [cx + 2 * a, y0 + 2 * b, 1, 3]); on.push(lit[i]); });
    } else {
      const lit = new Set(STAR[ch] || []);
      STAR_SEGS.forEach((rects, si) => rects.forEach(([rx, ry, rw, rh]) => { cells.push([cx + rx, y0 + ry, rw, rh]); on.push(lit.has(si) ? 1 : 0); }));
    }
  });
  return { cells, on, width, lat };
}
export const lettersOf = (key, lang) => [...wordOf(key, lang)].length;

// ---- starburst: a 7x11 tile box. Bars are one tile thick; diagonals are two-step staircases.
// Segment order: a b c d e f g1 g2 h i j k l m
export const STAR_W = 7, STAR_H = 11, STAR_PITCH = 8;
export const STAR_SEGS = [
  [[1, 0, 5, 1]], [[6, 1, 1, 4]], [[6, 6, 1, 4]], [[1, 10, 5, 1]], [[0, 6, 1, 4]], [[0, 1, 1, 4]],
  [[1, 5, 2, 1]], [[4, 5, 2, 1]],
  [[1, 1, 1, 2], [2, 3, 1, 2]],   // h: top-left corner down to the centre
  [[3, 1, 1, 4]],                  // i: upper centre
  [[5, 1, 1, 2], [4, 3, 1, 2]],   // j: top-right corner down to the centre
  [[2, 6, 1, 2], [1, 8, 1, 2]],   // k: centre down to the bottom-left corner
  [[3, 6, 1, 4]],                  // l: lower centre
  [[4, 6, 1, 2], [5, 8, 1, 2]],   // m: centre down to the bottom-right corner
];
const SN = 'a b c d e f g1 g2 h i j k l m'.split(' ');
const STAR_DEF = {
  A: 'a b c e f g1 g2', B: 'a b c d g2 i l', C: 'a d e f', D: 'a b c d i l', E: 'a d e f g1', F: 'a e f g1',
  G: 'a c d e f g2', H: 'b c e f g1 g2', I: 'a d i l', J: 'b c d e', K: 'e f g1 j m', L: 'd e f',
  M: 'b c e f h j', N: 'b c e f h m', O: 'a b c d e f', P: 'a b e f g1 g2', Q: 'a b c d e f m',
  R: 'a b e f g1 g2 m', S: 'a c d f g1 g2', T: 'a i l', U: 'b c d e f', V: 'e f k j', W: 'b c e f k m',
  X: 'h j k m', Y: 'h j l', Z: 'a d j k', ' ': '',
  // Cyrillic (no standard 14/16-seg table exists; drawn to read at a glance)
  'В': 'a b c d g2 i l', 'Е': 'a d e f g1', 'Р': 'a b e f g1 g2', 'Х': 'h j k m', 'Н': 'b c e f g1 g2',
  'И': 'b c e f j k', 'З': 'a b c d g2', 'Д': 'a b c d k', 'Ь': 'c d e f g1 g2', 'О': 'a b c d e f', 'Т': 'a i l', 'У': 'b c d g2 g1 f',
};
export const STAR = {};
for (const [ch, s] of Object.entries(STAR_DEF)) STAR[ch] = s ? s.split(' ').map((n) => SN.indexOf(n)) : [];

// ---- dot matrix. Narrow glyphs are 5x7 (the UI font, so a word on a display reads like the menu);
// wide glyphs (CJK, Hangul, kana) are 7x7 and hand-made so they stay legible as terrain.
const WIDE = {
  '出': ['#..#..#', '#..#..#', '#######', '...#...', '#..#..#', '#..#..#', '#######'],
  '口': ['#######', '#.....#', '#.....#', '#.....#', '#.....#', '#.....#', '#######'],
  '上': ['...#...', '...#...', '...####', '...#...', '...#...', '...#...', '#######'],
  '위': ['.###.#.', '#...##.', '.###.#.', '.....#.', '####.#.', '.#...#.', '.#...#.'],
  '나': ['#....#.', '#....#.', '#....##', '#....#.', '#....#.', '####.#.', '.....#.'],
  '가': ['####.#.', '...#.#.', '...#.##', '..#..#.', '.#...#.', '#....#.', '.....#.'],
  '기': ['#####.#', '....#.#', '....#.#', '...#..#', '..#...#', '.#....#', '......#'],
  '下': ['#######', '...#...', '...##..', '...#.#.', '...#...', '...#...', '...#...'],
  '아': ['.##..#.', '#..#.#.', '#..#.##', '#..#.#.', '.##..#.', '.....#.', '.....#.'],
  '래': ['###.#.#', '..#.#.#', '###.###', '#...#.#', '###.#.#', '....#.#', '....#.#'],
};
export const DOT_H = 7;
// returns { w, px: [[x,y]...] } for one character
export function dotGlyph(ch) {
  if (WIDE[ch]) {
    const px = [];
    WIDE[ch].forEach((row, y) => { for (let x = 0; x < 7; x++) if (row[x] === '#') px.push([x, y]); });
    return { w: 7, px };
  }
  return { w: 5, px: FONT57[ch] || FONT57['?'] };
}
