// Weighted A* over the deterministic sim. Finds an input sequence that takes
// the game from its current state into a target room (or to a trigger).
// Never produces false positives: every path is the real sim's output.
import { step, snapshot, restore, restartRoom, IN, RW, RH, TS, SUB, K, HZ, neighbor } from '../src/sim.js';
import { LANGS } from '../src/glyphs.js';

const ACTIONS = [0, IN.LEFT, IN.RIGHT, IN.JUMP, IN.LEFT | IN.JUMP, IN.RIGHT | IN.JUMP];
export const RESTART = 8;
export const VOL = 16;    // VOL + v: set music volume to v (menu action)
export const BRIGHT = 32; // BRIGHT + v: set brightness to v
export const HUDTOP = 48, HUDBOT = 49, HUDOFF = 50;   // HUD off: Settings → HUD (TIME/DEATHS) OFF
export const LANG = 64;   // LANG + i: set the language to LANGS[i] (menu action)
export function applySetting(g, a) {
  if (a >= LANG) g.lang = LANGS[a - LANG];
  else if (a >= HUDTOP) g.hudpos = a === HUDTOP ? 'top' : a === HUDBOT ? 'bottom' : 'off';
  else if (a >= BRIGHT) g.bright = a - BRIGHT;
  else g.volume = a - VOL;
}

function ctrVal(g, name) { const [kind, k] = name.split('.'); return (kind === 'reg' ? g.c.reg[k] : g.c.sw[k]) || 0; }

class Heap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(n) { const a = this.a; a.push(n); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p].f <= n.f) break; a[i] = a[p]; i = p; } a[i] = n; }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) { let i = 0; const n = a.length; for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && a[c + 1].f < a[c].f) c++; if (a[c].f >= last.f) break; a[i] = a[c]; i = c; } a[i] = last; }
    return top;
  }
}

function lcm(a, b) { const g = (x, y) => (y ? g(y, x % y) : x); return (a / g(a, b)) * b; }

// What parts of the counters matter in this room
function roomProfile(room) {
  const prof = { deathMod: 1, jumpMod: 1, timePeriod: 0, idle: false, visits: false, volume: false, bright: false, hud: !!room.hudSolid,
    lang: room.parts.some((p) => p.kind === 'lang') };
  for (const d of room.displays) {
    const period = d.t === 'bar' ? (d.mod || 1) * d.div : d.t === 'bits' ? 2 ** d.n * d.div : d.base ** (d.place + 1) * d.div;
    if (d.src === 'deaths') prof.deathMod = lcm(prof.deathMod, period);
    if (d.src === 'jumps') prof.jumpMod = lcm(prof.jumpMod, period);
    if (d.src === 'time') prof.timePeriod = Math.max(prof.timePeriod, period * HZ);
    if (d.src === 'idle' || d.langSrc === 'idle') prof.idle = true;
    if (d.langSrc === 'time') { prof.timePeriod = lcm(prof.timePeriod || 1, LANGS.length * (d.every || 1) * HZ); prof.timeQuant = HZ / 5; }
    if (d.until) prof.here = Math.max(prof.here || 0, d.until * HZ);
    if (d.t === 'code' || d.t === 'word' || String(d.src).startsWith('letters:') || d.src === 'lang') prof.lang = true;
    if (d.src === 'visits') prof.visits = true;
    if (d.src === 'volume' || d.src2 === 'volume') prof.volume = true;
    if (d.src === 'bright' || d.burn || d.dim) prof.bright = true;
  }
  return prof;
}

function key(g, prof, macro, cs = 0) {
  const p = g.p, c = g.c;
  let k = `${g.room.id}|${p.x >> (8 + cs)}|${p.y >> (8 + cs)}|${p.vx >> (4 + cs)}|${p.vy >> (5 + cs)}|${p.ground ? 1 : 0}${p.coyote > 0 ? 1 : 0}${p.buf > 0 ? 1 : 0}${p.prevJump ? 1 : 0}${p.jumping ? 1 : 0}|${p.dead ? p.dtimer : 0}`;
  if (prof.deathMod > 1) k += `|d${c.deaths % prof.deathMod}`;
  if (prof.jumpMod > 1) k += `|j${c.jumps % prof.jumpMod}`;
  if (prof.timePeriod) k += `|t${Math.floor((c.steps % prof.timePeriod) / Math.max(macro, prof.timeQuant || 0))}`;
  if (prof.idle) k += `|i${Math.min(c.idle >> 2, 300)}`;
  if (prof.here) k += `|e${Math.floor(Math.min(c.here, prof.here) / macro)}`;
  if (prof.visits) k += `|v${(c.visits[g.room.id] || 0) % 10}`;
  if (prof.volume) k += `|o${g.volume}`;
  if (prof.bright) k += `|b${g.bright}`;
  if (prof.hud) k += `|h${g.hudpos}`;
  if (prof.lang) k += `|l${g.lang}`;
  k += `|${JSON.stringify(c.reg)}${JSON.stringify(c.sw)}${JSON.stringify(c.sock)}${g.carry || ''}${g.pending ? 'p' : ''}${g.knobCol ?? ''}`;
  return k;
}

// goal: { room: id } reach that room (from a neighbouring edge), or { event: type } fire a trigger.
export function solve(g, goal, opts = {}) {
  const macro = opts.macro || 4;
  const maxNodes = opts.maxNodes || 1_500_000;
  const w = opts.weight ?? 2.5;
  const allowRestart = opts.restart ?? true;
  const startRoom = g.room;
  const startDeaths = g.c.deaths;
  const prof = roomProfile(startRoom);
  if (opts.timePeriod) prof.timePeriod = opts.timePeriod;
  const allowed = new Set([startRoom.id, goal.room].filter(Boolean));

  // heuristic: BFS distance (in tiles) over open tiles from the goal, scaled to steps
  const dist = new Int32Array(RW * RH).fill(-1);
  const q = [];
  const open = (x, y) => x >= 0 && y >= 0 && x < RW && y < RH && startRoom.tiles[y * RW + x] !== 1;
  const seed = (x, y) => { if (open(x, y) && dist[y * RW + x] < 0) { dist[y * RW + x] = 0; q.push(x, y); } };
  if (goal.room) {
    const r = g.world.rooms.get(goal.room);
    const dx = r.gx - startRoom.gx, dy = r.gy - startRoom.gy;
    if (Math.abs(dx) + Math.abs(dy) !== 1) throw new Error(`goal room ${goal.room} not adjacent to ${startRoom.id}`);
    if (dx) for (let y = 0; y < RH; y++) seed(dx > 0 ? RW - 1 : 0, y);
    else for (let x = 0; x < RW; x++) seed(x, dy > 0 ? RH - 1 : 0);
  } else if (goal.at) seed(goal.at[0], goal.at[1]);
  else if (goal.event) for (const it of startRoom.items) if (it.kind === goal.event) seed(it.x, it.y);
  for (let i = 0; i < q.length; i += 2) {
    const x = q[i], y = q[i + 1], d = dist[y * RW + x];
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (open(nx, ny) && dist[ny * RW + nx] < 0) { dist[ny * RW + nx] = d + 1; q.push(nx, ny); }
    }
  }
  const STEPS_PER_TILE = TS / K.RUN;
  const h = (gg) => {
    if (goal.ctr === 'idle') return Math.max(0, goal.val * 120 - gg.c.idle);
    if (goal.ctr === 'time') { const P = goal.mod * 120; return (((goal.val * 120 - gg.c.steps) % P) + P) % P; }
    if (goal.ctr && goal.ctr.includes('.')) { const m = goal.mod || 10; return ((((goal.val - ctrVal(gg, goal.ctr)) % m) + m) % m) * 20; }
    if (goal.ctr) { const m = goal.mod || 10; return ((((goal.val - gg.c[goal.ctr]) % m) + m) % m) * (goal.ctr === 'deaths' ? 60 : 30); }
    const tx = Math.min(RW - 1, Math.max(0, Math.floor((gg.p.x + 768) / TS)));
    const ty = Math.min(RH - 1, Math.max(0, Math.floor((gg.p.y + 768) / TS)));
    const d = dist[ty * RW + tx];
    return (d < 0 ? 200 : d) * STEPS_PER_TILE;
  };
  const reached = (gg) => {
    if (!goal.room && gg.room !== startRoom) return false;
    if (goal.stay && !(Math.floor((gg.p.x + 768) / TS) === goal.stay[0] && Math.floor((gg.p.y + 768) / TS) === goal.stay[1])) return false;
    if (goal.room) return gg.room.id === goal.room && !gg.p.dead;
    if (goal.at) return !gg.p.dead && Math.floor((gg.p.x + 768) / TS) === goal.at[0] && Math.floor((gg.p.y + 768) / TS) === goal.at[1];
    if (goal.ctr === 'idle') return !gg.p.dead && gg.p.ground && gg.c.deaths === startDeaths && Math.floor(gg.c.idle / 120) === goal.val;
    if (goal.ctr === 'time') return !gg.p.dead && gg.p.ground && Math.floor(gg.c.steps / 120) % goal.mod === goal.val && gg.c.steps % 120 < 8;
    if (goal.ctr && goal.ctr.includes('.')) return !gg.p.dead && gg.p.ground && ctrVal(gg, goal.ctr) % (goal.mod || 10) === goal.val;
    if (goal.ctr) return !gg.p.dead && gg.p.ground && ((gg.c[goal.ctr] % (goal.mod || 10)) + (goal.mod || 10)) % (goal.mod || 10) === goal.val;
    if (goal.event) return gg.events.some((e) => e.type === goal.event && (!goal.id || e.id === goal.id));
    return false;
  };

  const actions = [...ACTIONS];
  if (allowRestart) actions.push(RESTART);
  // settings (volume, brightness, HUD position) are deliberate menu actions: the route sets them
  // explicitly with goals like 'vol:7', 'bright:9', 'hud:bottom'; the search never flips them itself
  if (opts.settings) {
    if (prof.volume) for (let v = 0; v <= 9; v++) actions.push(VOL + v);
    if (prof.bright) for (let v = 0; v <= 9; v++) actions.push(BRIGHT + v);
    if (prof.hud) actions.push(HUDTOP, HUDBOT, HUDOFF);
    if (prof.lang) for (let i = 0; i < LANGS.length; i++) actions.push(LANG + i);
  }

  const seen = new Set();
  const heap = new Heap();
  const root = { s: snapshot(g), parent: null, act: null, cost: 0, f: 0 };
  seen.add(key(g, prof, macro, opts.coarse || 0));
  heap.push(root);
  let expanded = 0;
  while (heap.size) {
    const node = heap.pop();
    if (++expanded > maxNodes) break;
    for (const a of actions) {
      if (a >= VOL && a < BRIGHT && node.s.volume === a - VOL) continue;
      if (a >= BRIGHT && a < HUDTOP && node.s.bright === a - BRIGHT) continue;
      if (a >= LANG && node.s.lang === LANGS[a - LANG]) continue;
      if (a >= HUDTOP && a < LANG && node.s.hudpos === (a === HUDTOP ? 'top' : a === HUDBOT ? 'bottom' : 'off')) continue;
      restore(g, node.s);
      g.events.length = 0;
      let n = macro, ok = false, left = false, cost = macro;
      if (a === RESTART) {
        if (g.p.dead) continue;
        restartRoom(g); n = 1; cost = 60; // discourage, but allow
        step(g, 0);
      } else if (a >= VOL) {
        applySetting(g, a); cost = 30; n = 0;
        step(g, 0); n = 1;
      } else {
        for (let i = 0; i < n; i++) {
          step(g, a);
          if (reached(g)) { ok = true; n = i + 1; break; }
          if (!allowed.has(g.room.id)) { left = true; break; }
        }
      }
      if (left) continue;
      if (opts.noDeath && (g.p.dead || g.c.deaths !== node.s.c.deaths)) continue;
      if (!ok && reached(g)) ok = true;
      const child = { s: snapshot(g), parent: node, act: [a, n], cost: node.cost + cost, f: 0 };
      if (ok) return { ok: true, inputs: unwind(child), expanded, state: child.s };
      if (g.room.id !== startRoom.id) continue; // entered goal room but dead? skip
      const k = key(g, prof, macro, opts.coarse || 0);
      if (seen.has(k)) continue;
      seen.add(k);
      child.f = child.cost + w * h(g);
      heap.push(child);
    }
  }
  return { ok: false, expanded };
}

function unwind(n) {
  const out = [];
  for (; n.parent; n = n.parent) out.push(n.act);
  out.reverse();
  // run-length merge
  const rle = [];
  for (const [a, k] of out) {
    if (rle.length && rle[rle.length - 1][0] === a && a < RESTART) rle[rle.length - 1][1] += k;
    else rle.push([a, k]);
  }
  return rle;
}

// Replay RLE inputs on a game. Returns nothing; mutates g.
export function replay(g, rle, onStep) {
  for (const [a, k] of rle) {
    if (a === RESTART) { restartRoom(g); step(g, 0); if (onStep) onStep(g); continue; }
    if (a >= VOL) { applySetting(g, a); step(g, 0); if (onStep) onStep(g); continue; }
    for (let i = 0; i < k; i++) { step(g, a); if (onStep) onStep(g); }
  }
}

// Try a portfolio of search settings, cheapest first.
export const PORTFOLIO = [
  { macro: 8, weight: 1.2, maxNodes: 60_000 },
  { macro: 8, weight: 3, maxNodes: 200_000, coarse: 2 },
  { macro: 6, weight: 2, maxNodes: 250_000 },
  { macro: 4, weight: 1.5, maxNodes: 400_000 },
  { macro: 3, weight: 3, maxNodes: 600_000 },
  { macro: 2, weight: 2, maxNodes: 1_000_000 },
];
export function solveAny(g, goal, extra = {}) {
  const start = snapshot(g);
  let total = 0;
  for (const o of extra.quick ? PORTFOLIO.slice(0, 2) : PORTFOLIO) {
    restore(g, start);
    const r = solve(g, goal, { ...o, ...extra });
    total += r.expanded;
    if (r.ok) { restore(g, start); return { ...r, expanded: total, cfg: o }; }
  }
  restore(g, start);
  return { ok: false, expanded: total };
}
