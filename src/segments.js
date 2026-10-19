// Seven-segment geometry. A digit with segment length s (tiles) occupies a
// (s+2) x (2s+3) tile box. Bars are one tile thick and never touch at the
// corners -- the corner tiles stay open, which the player can slip through.

// Bit order: a b c d e f g  (a = top, then clockwise, g = middle)
export const SEG = { a: 1, b: 2, c: 4, d: 8, e: 16, f: 32, g: 64 };

const MASKS = [
  0b0111111, // 0 abcdef
  0b0000110, // 1 bc
  0b1011011, // 2 abdeg
  0b1001111, // 3 abcdg
  0b1100110, // 4 bcfg
  0b1101101, // 5 acdfg
  0b1111101, // 6 acdefg
  0b0000111, // 7 abc
  0b1111111, // 8
  0b1101111, // 9 abcdfg
  0b1110111, // A abcefg
  0b1111100, // b cdefg
  0b0111001, // C adef
  0b1011110, // d bcdeg
  0b1111001, // E adefg
  0b1110001, // F aefg
];
export const MINUS = 0b1000000;

export function digitMask(v) {
  return MASKS[((v % 16) + 16) % 16];
}

// Tile rectangles [x, y, w, h] for each of the 7 segments, relative to the box.
export function segmentRects(s) {
  return [
    [1, 0, s, 1],          // a
    [s + 1, 1, 1, s],      // b
    [s + 1, s + 2, 1, s],  // c
    [1, 2 * s + 2, s, 1],  // d
    [0, s + 2, 1, s],      // e
    [0, 1, 1, s],          // f
    [1, s + 1, s, 1],      // g
  ];
}

export function digitSize(s) {
  return { w: s + 2, h: 2 * s + 3 };
}
