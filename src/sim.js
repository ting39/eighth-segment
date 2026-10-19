// Deterministic simulation. Pure integer math, fixed 120 Hz step.
// Shared by the browser game, the solver and the tests.
import { digitMask, segmentRects } from './segments.js';

export const HZ = 120;
export const SUB = 256;              // subpixels per pixel
export const TILE = 8;               // pixels per tile
export const TS = TILE * SUB;        // tile size in subpixels
export const RW = 40, RH = 22;       // room size in tiles
export const PW = 6 * SUB, PH = 6 * SUB;

// Feel constants (subpixels per step / per step^2)
export const K = {
  RUN: 192,            // 90 px/s
  ACC_GROUND: 32,
  DEC_GROUND: 40,
  TURN_GROUND: 56,
  ACC_AIR: 22,
  DEC_AIR: 12,
  GRAV: 9,             // ~504 px/s^2
  HANG_GRAV: 5,        // near the apex while jump is held
  HANG_V: 40,
  JUMP_V: 358,         // ~3.5 tiles
  CUT: 0.4,            // vy multiplier on early release
  MAX_FALL: 512,       // 240 px/s
  COYOTE: 12,          // 100 ms
  BUFFER: 12,          // 100 ms
  CORNER: 3,           // px of head-corner forgiveness
  SQUEEZE: 2,          // px of vertical forgiveness when moving sideways into a gap
  DEATH_STEPS: 48,     // 0.4 s from death to control
  UP_BOOST: 358,       // min upward speed when entering a room from below
};

// Tile codes
export const T = { EMPTY: 0, WALL: 1, SPIKE_U: 2, SPIKE_D: 3, SPIKE_L: 4, SPIKE_R: 5, ONEWAY: 6, FAKE: 7, HAZARD: 8 };

export const IN = { LEFT: 1, RIGHT: 2, JUMP: 4 };

// ---------------------------------------------------------------- world ---

const CHAR_TILE = { '#': T.WALL, '^': T.SPIKE_U, 'v': T.SPIKE_D, '<': T.SPIKE_L, '>': T.SPIKE_R,
  '-': T.ONEWAY, 'X': T.FAKE, '%': T.HAZARD };

export function compileRoom(def) {
  if (def.map.length !== RH) throw new Error(`${def.id}: map has ${def.map.length} rows`);
  const tiles = new Uint8Array(RW * RH);
  const spawns = [], items = [], markers = {};
  let start = null;
  def.map.forEach((row, y) => {
    if (row.length !== RW) throw new Error(`${def.id}: row ${y} has ${row.length} cols`);
    for (let x = 0; x < RW; x++) {
      const ch = row[x];
      if (CHAR_TILE[ch] !== undefined) tiles[y * RW + x] = CHAR_TILE[ch];
      else if (ch === 'P' || ch === 'S') {
        const sp = { x: (x * TILE + 1) * SUB, y: (y * TILE + 2) * SUB, tx: x, ty: y };
        spawns.push(sp);
        if (ch === 'S') start = sp;
      } else if (ch === 'o') items.push({ kind: 'point', x, y, key: `${def.id}:${x},${y}` });
      else if (/[A-Za-z0-9*]/.test(ch) && ch !== 'v') markers[ch] = { x, y };
      else if (ch !== '.' && ch !== ' ') throw new Error(`${def.id}: bad char '${ch}'`);
    }
  });
  const displays = [];
  for (const [key, spec] of Object.entries(def.displays || {})) {
    const m = spec.at ? { x: spec.at[0], y: spec.at[1] } : markers[key];
    if (!m) throw new Error(`${def.id}: display marker ${key} missing`);
    displays.push(compileDisplay(def.id, { ...spec, x: m.x + (spec.dx || 0), y: m.y + (spec.dy || 0) }));
  }
  for (const [key, spec] of Object.entries(def.triggers || {})) {
    const m = markers[key];
    if (!m) throw new Error(`${def.id}: trigger marker ${key} missing`);
    items.push({ kind: spec.kind, id: spec.id, x: m.x, y: m.y, w: spec.w || 1, h: spec.h || 1, key: `${def.id}:${key}` });
  }
  return { ...def, tiles, spawns, start, items, displays };
}

function compileDisplay(roomId, d) {
  const out = { src: 'static', base: 10, place: 0, div: 1, off: 0, ...d, cells: [] };
  if (d.t === 'bits') {
    const n = d.n, w = d.w || 1, h = d.h || 1, gap = d.gap ?? 1;
    for (let i = 0; i < n; i++) {
      // most significant bit first (left / top)
      const o = i * ((d.dir === 'v' ? h : w) + gap);
      out.cells.push(d.dir === 'v' ? [d.x, d.y + o, w, h] : [d.x + o, d.y, w, h]);
    }
  } else {
    out.t = 'digit';
    out.s = d.s || 3;
    for (const [x, y, w, h] of segmentRects(out.s)) out.cells.push([d.x + x, d.y + y, w, h]);
  }
  for (const [x, y, w, h] of out.cells) {
    if (x < 0 || y < 0 || x + w > RW || y + h > RH) throw new Error(`${roomId}: display out of bounds`);
  }
  return out;
}

export function buildWorld(defs) {
  const rooms = new Map(), grid = new Map();
  for (const def of defs) {
    const r = compileRoom(def);
    if (rooms.has(r.id)) throw new Error(`duplicate room ${r.id}`);
    rooms.set(r.id, r);
    const k = `${r.gx},${r.gy}`;
    if (grid.has(k)) throw new Error(`rooms ${grid.get(k)} and ${r.id} share cell ${k}`);
    grid.set(k, r.id);
  }
  return { rooms, grid };
}

export function neighbor(world, room, dx, dy) {
  const id = world.grid.get(`${room.gx + dx},${room.gy + dy}`);
  return id ? world.rooms.get(id) : null;
}

// ---------------------------------------------------------------- state ---

export function newCounters() {
  return { deaths: 0, jumps: 0, steps: 0, idle: 0, visits: {} };
}

export function createGame(world, roomId, opts = {}) {
  const g = {
    world,
    room: null,
    p: { x: 0, y: 0, vx: 0, vy: 0, ground: true, coyote: 0, buf: 0, prevJump: false,
      jumping: false, face: 1, dead: false, dtimer: 0 },
    c: opts.counters ? structuredCloneCounters(opts.counters) : newCounters(),
    volume: opts.volume ?? 7,
    clockMinutes: opts.clockMinutes ?? 0,
    points: new Set(opts.points || []),
    flags: new Set(opts.flags || []),
    spawn: null,
    dyn: new Uint8Array(RW * RH),
    dynPrev: new Uint8Array(RW * RH),
    events: [],
    nbr: null,
    lastInput: 0,
  };
  enterRoom(g, world.rooms.get(roomId), null, opts.spawn);
  return g;
}

function structuredCloneCounters(c) {
  return { deaths: c.deaths, jumps: c.jumps, steps: c.steps, idle: c.idle, visits: { ...c.visits } };
}

function enterRoom(g, room, entry, forcedSpawn) {
  g.room = room;
  g.nbr = {
    l: !!neighbor(g.world, room, -1, 0), r: !!neighbor(g.world, room, 1, 0),
    u: !!neighbor(g.world, room, 0, -1), d: !!neighbor(g.world, room, 0, 1),
  };
  g.c.visits[room.id] = (g.c.visits[room.id] || 0) + 1;
  if (forcedSpawn) g.spawn = { x: forcedSpawn.x, y: forcedSpawn.y };
  else if (!entry) { const s0 = room.start || room.spawns[0]; g.spawn = { x: s0.x, y: s0.y }; }
  else {
    let best = null, bd = Infinity;
    for (const s of room.spawns) {
      const d = (s.x - entry.x) ** 2 + (s.y - entry.y) ** 2;
      if (d < bd) { bd = d; best = s; }
    }
    g.spawn = { x: best.x, y: best.y };
  }
  if (!entry) placeAtSpawn(g);
  updateDisplays(g);
  g.dynPrev.set(g.dyn);
  g.events.push({ type: 'room', id: room.id });
}

function placeAtSpawn(g) {
  const p = g.p;
  p.x = g.spawn.x; p.y = g.spawn.y; p.vx = 0; p.vy = 0;
  p.ground = true; p.coyote = 0; p.buf = 0; p.jumping = false; p.dead = false; p.dtimer = 0;
}

// ------------------------------------------------------------- displays ---

export function sourceValue(g, d) {
  const p = g.p;
  switch (d.src) {
    case 'static': return d.val ?? 8;
    case 'deaths': return g.c.deaths;
    case 'jumps': return g.c.jumps;
    case 'time': return Math.floor(g.c.steps / HZ);
    case 'idle': return Math.floor(g.c.idle / HZ);
    case 'visits': return g.c.visits[g.room.id] || 0;
    case 'pos': return Math.floor((p.x + PW / 2) / TS);
    case 'posy': return RH - 1 - Math.floor((p.y + PH / 2) / TS);
    case 'volume': return g.volume;
    case 'clock': return g.clockMinutes;
    case 'points': return g.points.size;
    default: throw new Error(`unknown source ${d.src}`);
  }
}

export function displayValue(g, d) {
  const raw = Math.floor((sourceValue(g, d) + d.off) / d.div);
  if (d.t === 'bits') return ((raw % (1 << d.n)) + (1 << d.n)) % (1 << d.n);
  const v = Math.floor(raw / d.base ** d.place);
  return ((v % d.base) + d.base) % d.base;
}

// bitmask of lit cells for a display
export function displayLit(g, d) {
  const v = displayValue(g, d);
  let m;
  if (d.t === 'bits') {
    m = 0;
    for (let i = 0; i < d.n; i++) if (v & (1 << (d.n - 1 - i))) m |= 1 << i;
  } else m = digitMask(v);
  if (d.inv) m = ~m & ((1 << d.cells.length) - 1);
  return m;
}

export function updateDisplays(g) {
  const dyn = g.dyn;
  dyn.fill(0);
  for (const d of g.room.displays) {
    const m = displayLit(g, d);
    d.lit = m;
    for (let i = 0; i < d.cells.length; i++) {
      if (!(m & (1 << i))) continue;
      const [x, y, w, h] = d.cells[i];
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) dyn[yy * RW + xx] = 1;
    }
  }
}

// ------------------------------------------------------------ collision ---

export function solidAt(g, tx, ty) {
  if (tx < 0) return !g.nbr.l || ty < 0 ? true : false;
  if (tx >= RW) return !g.nbr.r || ty < 0 ? true : false;
  if (ty < 0) return !g.nbr.u;
  if (ty >= RH) return false;
  const i = ty * RW + tx;
  return g.room.tiles[i] === T.WALL || g.dyn[i] === 1;
}

export function collides(g, x, y) {
  const tx0 = Math.floor(x / TS), tx1 = Math.floor((x + PW - 1) / TS);
  const ty0 = Math.floor(y / TS), ty1 = Math.floor((y + PH - 1) / TS);
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) if (solidAt(g, tx, ty)) return true;
  return false;
}

// one-way platform under a bottom edge moving from oldBottom to newBottom (exclusive ends)
function onewayHit(g, x, oldBottom, newBottom) {
  const tx0 = Math.floor(x / TS), tx1 = Math.floor((x + PW - 1) / TS);
  // a one-way tile at row ty has its top at ty*TS; we hit it if oldBottom <= top < newBottom
  const ty = Math.floor((newBottom - 1) / TS);
  const top = ty * TS;
  if (!(oldBottom <= top && newBottom > top)) return -1;
  if (ty < 0 || ty >= RH) return -1;
  for (let tx = tx0; tx <= tx1; tx++) {
    if (tx >= 0 && tx < RW && g.room.tiles[ty * RW + tx] === T.ONEWAY) return top;
  }
  return -1;
}

export function onGround(g) {
  const p = g.p;
  if (collides(g, p.x, p.y + 1)) return true;
  return onewayHit(g, p.x, p.y + PH, p.y + PH + 1) >= 0;
}

function moveX(g, dx) {
  const p = g.p;
  if (!dx) return;
  let nx = p.x + dx;
  if (collides(g, nx, p.y)) {
    // squeeze: a gap that is 1-2 px off vertically still lets you in
    for (let d = 1; d <= K.SQUEEZE; d++) {
      for (const s of [-1, 1]) {
        const ny = p.y + s * d * SUB;
        if (!collides(g, nx, ny) && !collides(g, p.x, ny)) { p.y = ny; p.x = nx; if (s > 0 && p.vy < 0) p.vy = 0; return; }
      }
    }
    if (dx > 0) nx = Math.floor((nx + PW - 1) / TS) * TS - PW;
    else nx = (Math.floor(nx / TS) + 1) * TS;
    if ((dx > 0 && nx < p.x) || (dx < 0 && nx > p.x) || collides(g, nx, p.y)) nx = p.x;
    p.vx = 0;
  }
  p.x = nx;
}

function moveY(g, dy) {
  const p = g.p;
  if (!dy) return;
  let ny = p.y + dy;
  if (dy > 0) {
    const ow = onewayHit(g, p.x, p.y + PH, ny + PH);
    if (ow >= 0 && !collides(g, p.x, ow - PH)) { p.y = ow - PH; p.vy = 0; return; }
  }
  if (!collides(g, p.x, ny)) { p.y = ny; return; }
  if (dy < 0) {
    // head-corner correction: slide sideways up to K.CORNER px if that clears the ceiling
    const pref = p.vx > 0 ? 1 : p.vx < 0 ? -1 : 0;
    const dirs = pref ? [pref, -pref] : [1, -1];
    for (let d = 1; d <= K.CORNER; d++) {
      for (const s of dirs) {
        // align to the pixel grid boundary that clears the tile
        const nx = p.x + s * d * SUB;
        if (!collides(g, nx, ny) && !collides(g, nx, p.y)) { p.x = nx; p.y = ny; return; }
      }
    }
    ny = (Math.floor(ny / TS) + 1) * TS;
    if (ny > p.y || collides(g, p.x, ny)) ny = p.y;
    g.events.push({ type: 'bonk' });
  } else {
    ny = Math.floor((ny + PH - 1) / TS) * TS - PH;
    if (ny < p.y || collides(g, p.x, ny)) ny = p.y;
  }
  p.y = ny;
  p.vy = 0;
}

function hazardHit(g) {
  const p = g.p;
  const px0 = p.x, px1 = p.x + PW, py0 = p.y, py1 = p.y + PH;
  const tx0 = Math.max(0, Math.floor(px0 / TS)), tx1 = Math.min(RW - 1, Math.floor((px1 - 1) / TS));
  const ty0 = Math.max(0, Math.floor(py0 / TS)), ty1 = Math.min(RH - 1, Math.floor((py1 - 1) / TS));
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    const t = g.room.tiles[ty * RW + tx];
    if (t < T.SPIKE_U || (t > T.SPIKE_R && t !== T.HAZARD)) continue;
    // hazard box in pixels inside the tile
    let b;
    switch (t) {
      case T.SPIKE_U: b = [1, 5, 7, 8]; break;
      case T.SPIKE_D: b = [1, 0, 7, 3]; break;
      case T.SPIKE_L: b = [5, 1, 8, 7]; break;
      case T.SPIKE_R: b = [0, 1, 3, 7]; break;
      default: b = [1, 1, 7, 7];
    }
    const hx0 = (tx * TILE + b[0]) * SUB, hy0 = (ty * TILE + b[1]) * SUB;
    const hx1 = (tx * TILE + b[2]) * SUB, hy1 = (ty * TILE + b[3]) * SUB;
    if (px0 < hx1 && px1 > hx0 && py0 < hy1 && py1 > hy0) return true;
  }
  return false;
}

// ----------------------------------------------------------------- step ---

export function kill(g, cause) {
  const p = g.p;
  if (p.dead) return;
  p.dead = true;
  p.dtimer = K.DEATH_STEPS;
  g.c.deaths++;
  g.events.push({ type: 'die', cause, x: p.x, y: p.y });
}

// Restart the room from the menu: it is a death, by design.
export function restartRoom(g) { kill(g, 'restart'); }

export function step(g, input) {
  const p = g.p, c = g.c;
  c.steps++;
  const left = !!(input & IN.LEFT), right = !!(input & IN.RIGHT), jump = !!(input & IN.JUMP);
  if (input & 7) c.idle = 0; else c.idle++;
  g.lastInput = input;

  if (p.dead) {
    if (--p.dtimer <= 0) {
      placeAtSpawn(g);
      g.events.push({ type: 'respawn' });
    }
    p.prevJump = jump;
    refreshDisplays(g);
    if (!p.dead && collides(g, p.x, p.y)) kill(g, 'crush');
    return;
  }

  // horizontal
  const dir = (right ? 1 : 0) - (left ? 1 : 0);
  if (dir) p.face = dir;
  const target = dir * K.RUN;
  let acc;
  if (p.ground) acc = dir === 0 ? K.DEC_GROUND : (Math.sign(p.vx) === -dir ? K.TURN_GROUND : K.ACC_GROUND);
  else acc = dir === 0 ? K.DEC_AIR : K.ACC_AIR;
  if (p.vx < target) p.vx = Math.min(target, p.vx + acc);
  else if (p.vx > target) p.vx = Math.max(target, p.vx - acc);

  // jump
  if (jump && !p.prevJump) p.buf = K.BUFFER;
  if (p.buf > 0 && (p.ground || p.coyote > 0)) {
    p.vy = -K.JUMP_V;
    p.buf = 0; p.coyote = 0; p.ground = false; p.jumping = true;
    c.jumps++;
    g.events.push({ type: 'jump', x: p.x, y: p.y });
  }
  if (p.jumping && !jump && p.vy < 0) { p.vy = Math.trunc(p.vy * K.CUT); p.jumping = false; }
  if (p.vy >= 0) p.jumping = false;

  // gravity
  const hang = jump && Math.abs(p.vy) < K.HANG_V;
  p.vy = Math.min(K.MAX_FALL, p.vy + (hang ? K.HANG_GRAV : K.GRAV));

  const wasGround = p.ground;
  const fallV = p.vy;
  moveX(g, p.vx);
  moveY(g, p.vy);
  p.ground = onGround(g);
  if (p.ground) { p.coyote = K.COYOTE; if (p.vy > 0) p.vy = 0; }
  else if (p.coyote > 0) p.coyote--;
  if (p.buf > 0) p.buf--;
  if (p.ground && !wasGround) g.events.push({ type: 'land', v: fallV, x: p.x, y: p.y });
  p.prevJump = jump;

  // room edges
  if (edgeCheck(g)) return;

  refreshDisplays(g);
  if (collides(g, p.x, p.y)) { kill(g, 'crush'); return; }
  if (hazardHit(g)) { kill(g, 'spike'); return; }
  collectItems(g);
  if (p.ground) checkpoint(g);
}

function refreshDisplays(g) {
  g.dynPrev.set(g.dyn);
  updateDisplays(g);
}

function edgeCheck(g) {
  const p = g.p;
  const cx = p.x + PW / 2, cy = p.y + PH / 2;
  const W = RW * TS, H = RH * TS;
  let dx = 0, dy = 0;
  if (cx < 0) dx = -1; else if (cx >= W) dx = 1;
  else if (cy < 0) dy = -1; else if (cy >= H) dy = 1;
  if (!dx && !dy) return false;
  const next = neighbor(g.world, g.room, dx, dy);
  if (!next) {
    if (dy === 1) { if (p.y >= H) { kill(g, 'fall'); return true; } return false; }
    return false;
  }
  p.x -= dx * W; p.y -= dy * H;
  if (dy === -1) { p.vy = Math.min(p.vy, -K.UP_BOOST); p.jumping = false; }
  enterRoom(g, next, { x: p.x, y: p.y });
  if (collides(g, p.x, p.y)) kill(g, 'crush');
  return true;
}

// Standing on a respawn marker makes it the current respawn point.
function checkpoint(g) {
  const p = g.p;
  const tx = Math.floor((p.x + PW / 2) / TS), ty = Math.floor((p.y + PH - 1) / TS);
  for (const s of g.room.spawns) {
    if (s.tx === tx && s.ty === ty && (g.spawn.x !== s.x || g.spawn.y !== s.y)) {
      g.spawn = { x: s.x, y: s.y };
      g.events.push({ type: 'checkpoint', x: tx, y: ty });
    }
  }
}

function collectItems(g) {
  const p = g.p;
  for (const it of g.room.items) {
    const x0 = it.x * TS, y0 = it.y * TS, x1 = x0 + (it.w || 1) * TS, y1 = y0 + (it.h || 1) * TS;
    if (p.x < x1 && p.x + PW > x0 && p.y < y1 && p.y + PH > y0) {
      if (it.kind === 'point') {
        if (!g.points.has(it.key)) { g.points.add(it.key); g.events.push({ type: 'point', key: it.key, x: it.x, y: it.y }); }
      } else if (!g.flags.has(it.key) || it.kind === 'ending') {
        g.flags.add(it.key);
        g.events.push({ type: it.kind, id: it.id, key: it.key });
      }
    }
  }
}

// Snapshot helpers (for save, solver)
export function snapshot(g) {
  return {
    room: g.room.id, p: { ...g.p }, c: structuredCloneCounters(g.c), spawn: { ...g.spawn },
    volume: g.volume, points: [...g.points], flags: [...g.flags],
  };
}

export function restore(g, s) {
  g.room = g.world.rooms.get(s.room);
  g.nbr = {
    l: !!neighbor(g.world, g.room, -1, 0), r: !!neighbor(g.world, g.room, 1, 0),
    u: !!neighbor(g.world, g.room, 0, -1), d: !!neighbor(g.world, g.room, 0, 1),
  };
  Object.assign(g.p, s.p);
  g.c = structuredCloneCounters(s.c);
  g.spawn = { ...s.spawn };
  g.volume = s.volume;
  g.points = new Set(s.points);
  g.flags = new Set(s.flags);
  updateDisplays(g);
  g.dynPrev.set(g.dyn);
}
