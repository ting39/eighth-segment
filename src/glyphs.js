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
