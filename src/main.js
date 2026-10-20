// Game shell: loop, states (title / play / pause / map / settings / ending), save, fx.
import { buildWorld, createGame, step, restartRoom, snapshot, restore, updateDisplays, HZ, SUB, RW, RH, TILE, T, newCounters } from './sim.js';
import { ROOMS, START_ROOM, ENDINGS } from './rooms.js';
import { createRenderer, W, H, PALETTES } from './render.js';
import { createInput, DEFAULT_KEYS, keyName } from './input.js';
import { digitMask } from './segments.js';
import { initAudio, sfx, playSong, setVolumes } from './audio.js';

const params = new URLSearchParams(location.search);
const DEV = params.has('dev');
const SHOT = params.has('shot');
const SAVE_KEY = 'eighth-segment/v1';

const world = buildWorld(ROOMS);
const TOTAL_POINTS = [...world.rooms.values()].reduce((n, r) => n + r.items.filter((i) => i.kind === 'point').length, 0);
const canvas = document.getElementById('screen');
const R = createRenderer(canvas);
const input = createInput();

// ------------------------------------------------------------- storage ---
const store = {
  load() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || null; } catch { return null; } },
  save(d) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch { /* private mode etc. */ } },
};
const saved = store.load() || {};
const settings = Object.assign({
  music: 6, sfx: 7, speed: 100, glow: true, shake: true, flashes: true, hud: true, hints: true, touch: 'auto',
  keys: structuredClone(DEFAULT_KEYS),
}, saved.settings || {});
input.keys = settings.keys;
const meta = Object.assign({ endings: [], bestTime: null, bestDeaths: null, clears: 0 }, saved.meta || {});

function applySettings() {
  setVolumes(settings.music, settings.sfx);
  R.opts.glow = settings.glow; R.opts.shake = settings.shake; R.opts.flashes = settings.flashes;
  if (game) game.volume = settings.music;
  updateTouchVisibility();
}

// ---------------------------------------------------------------- game ---
let game = null;
let run = saved.run || null;           // { snap, visited:[], assisted, startedAt }
let visited = new Set(run ? run.visited : []);
let mode = 'title';
let menu = null;                       // { items, i, title }
let banner = null;                     // { text, sub, t }
let squash = 0;
let endingInfo = null;
let lastSave = 0;

function newGame() {
  game = createGame(world, START_ROOM, { volume: settings.music });
  visited = new Set([START_ROOM]);
  run = { visited: [...visited], assisted: settings.speed < 100, snap: null };
  saveRun();
  enterPlay();
  showBanner(game.room);
}

function continueGame() {
  game = createGame(world, run.snap.room, { volume: settings.music, counters: run.snap.c, spawn: run.snap.spawn, points: run.snap.points, flags: run.snap.flags });
  // createGame counted a visit for re-entering; undo it so loading is not a "visit"
  game.c.visits = { ...run.snap.c.visits };
  updateDisplays(game);
  enterPlay();
  showBanner(game.room, true);
}

function saveRun() {
  if (!game || !run) { store.save({ settings, meta, run }); return; }
  const s = snapshot(game);
  // always resume from the spawn point, never mid-air
  run.snap = { room: s.room, c: s.c, spawn: s.spawn, points: s.points, flags: s.flags };
  run.visited = [...visited];
  store.save({ settings, meta, run });
}
const saveAll = () => store.save({ settings, meta, run });

function enterPlay() {
  mode = 'play'; menu = null;
  input.clearHeld();
  playSong(game.room.music || game.room.region);
}

function showBanner(room, force) {
  const first = !visited.has(room.id) || force;
  if (!first && !room.always) return;
  banner = { text: room.name || '', sub: (PALETTES[room.region] || {}).name || '', t: 0 };
}

// -------------------------------------------------------------- events ---
function handleEvents() {
  const pal = PALETTES[game.room.region] || PALETTES.boot;
  for (const e of game.events) {
    switch (e.type) {
      case 'jump': sfx.jump(); squash = -1; R.dust(e.x / SUB, e.y / SUB + 6, R.hexA(pal.lit, 0.6)); break;
      case 'land': if (e.v > 120) { sfx.land(e.v); squash = Math.min(1, e.v / 400); R.dust(e.x / SUB, e.y / SUB + 6, R.hexA(pal.lit, 0.6)); } break;
      case 'die': {
        sfx.die(); R.shake = 4; R.flash = 1;
        const x = e.x / SUB + 3, y = e.y / SUB + 3;
        R.burst(x, y, '#ffffff', 18, 1.6); R.burst(x, y, pal.lit, 14, 1.0);
        break;
      }
      case 'respawn': sfx.respawn(); R.burst(game.p.x / SUB + 3, game.p.y / SUB + 3, R.hexA(pal.lit, 0.8), 8, 0.6, 20); break;
      case 'room': {
        sfx.room();
        const room = world.rooms.get(e.id);
        showBanner(room);
        visited.add(e.id);
        playSong(room.music || room.region);
        saveRun();
        break;
      }
      case 'point': sfx.point(); R.burst(e.x * TILE + 4, e.y * TILE + 4, '#ffffff', 24, 1.4); saveRun(); break;
      case 'bonk': sfx.bonk(); break;
      case 'slot': startEnding(e.id); break;
      case 'note': break;
    }
  }
  game.events.length = 0;
}

function startEnding(id) {
  sfx.slot();
  const time = game.c.steps / HZ;
  endingInfo = { id, time, deaths: game.c.deaths, jumps: game.c.jumps, points: game.points.size, assisted: run.assisted, t: 0 };
  if (!meta.endings.includes(id)) meta.endings.push(id);
  if (!run.assisted) {
    if (meta.bestTime === null || time < meta.bestTime) meta.bestTime = time;
    if (meta.bestDeaths === null || game.c.deaths < meta.bestDeaths) meta.bestDeaths = game.c.deaths;
  }
  meta.clears++;
  run = null; saveAll();
  mode = 'ending';
  playSong('master');
}

// --------------------------------------------------------------- menus ---
function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60), cs = Math.floor((sec * 100) % 100);
  return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

const SPEEDS = [100, 90, 80, 70, 60, 50];
function settingsMenu(back) {
  const items = [
    { label: 'MUSIC VOLUME', value: () => settings.music, digit: true, adj: (d) => { settings.music = (settings.music + d + 10) % 10; } },
    { label: 'SOUND VOLUME', value: () => settings.sfx, digit: true, adj: (d) => { settings.sfx = (settings.sfx + d + 10) % 10; sfx.jump(); } },
    { label: 'GAME SPEED', value: () => settings.speed + '%', adj: (d) => { const i = SPEEDS.indexOf(settings.speed); settings.speed = SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, i - d))]; if (settings.speed < 100 && run) run.assisted = true; } },
    { label: 'GLOW', value: () => (settings.glow ? 'ON' : 'OFF'), adj: () => { settings.glow = !settings.glow; } },
    { label: 'SCREEN SHAKE', value: () => (settings.shake ? 'ON' : 'OFF'), adj: () => { settings.shake = !settings.shake; } },
    { label: 'FLASHES', value: () => (settings.flashes ? 'ON' : 'OFF'), adj: () => { settings.flashes = !settings.flashes; } },
    { label: 'HUD (TIME/DEATHS)', value: () => (settings.hud ? 'ON' : 'OFF'), adj: () => { settings.hud = !settings.hud; } },
    { label: 'HINTS WHEN STUCK', value: () => (settings.hints ? 'ON' : 'OFF'), adj: () => { settings.hints = !settings.hints; } },
    { label: 'TOUCH BUTTONS', value: () => settings.touch.toUpperCase(), adj: (d) => { const o = ['auto', 'on', 'off']; settings.touch = o[(o.indexOf(settings.touch) + (d || 1) + 3) % 3]; } },
    ...['left', 'right', 'jump'].map((act) => ({
      label: 'KEY ' + act.toUpperCase(), value: () => (settings.keys[act][0] ? keyName(settings.keys[act][0]) : '-'),
      act: (it) => {
        it.waiting = true;
        input.capture = (code) => {
          it.waiting = false;
          if (code === 'Escape') return;
          for (const k of Object.keys(settings.keys)) settings.keys[k] = settings.keys[k].filter((c) => c !== code);
          settings.keys[act] = [code, ...settings.keys[act]];
          applySettings(); saveAll();
        };
      },
    })),
    { label: 'RESET KEYS', act: () => { settings.keys = structuredClone(DEFAULT_KEYS); input.keys = settings.keys; saveAll(); } },
    { label: 'BACK', act: back },
  ];
  return { title: 'SETTINGS', items, i: 0, back, onChange: () => { applySettings(); saveAll(); } };
}

function titleMenu() {
  const items = [];
  if (run && run.snap) items.push({ label: 'CONTINUE', act: () => continueGame() });
  items.push({ label: run && run.snap ? 'NEW GAME' : 'START', act: () => {
    if (run && run.snap) { menu = confirmMenu('ERASE THE CURRENT RUN?', () => newGame(), () => { menu = titleMenu(); }); } else newGame();
  } });
  items.push({ label: 'SETTINGS', act: () => { menu = settingsMenu(() => { menu = titleMenu(); }); } });
  return { title: null, items, i: 0 };
}

function confirmMenu(q, yes, no) {
  return { title: q, items: [{ label: 'NO', act: no }, { label: 'YES', act: yes }], i: 0, back: no };
}

function pauseMenu() {
  const resume = () => { mode = 'play'; menu = null; input.clearHeld(); };
  return {
    title: 'PAUSED', back: resume, i: 0,
    items: [
      { label: 'RESUME', act: resume },
      { label: 'MAP', act: () => { mode = 'map'; } },
      { label: 'RESTART ROOM', act: () => { restartRoom(game); resume(); } },
      { label: 'SETTINGS', act: () => { menu = settingsMenu(() => { menu = pauseMenu(); }); } },
      { label: 'SAVE & QUIT TO TITLE', act: () => { saveRun(); mode = 'title'; menu = titleMenu(); playSong('title'); } },
    ],
  };
}

function menuInput(edges) {
  if (!menu) return;
  const it = menu.items[menu.i];
  if (it && it.waiting) return;
  for (const e of edges) {
    if (e === 'up') { menu.i = (menu.i + menu.items.length - 1) % menu.items.length; sfx.move(); }
    else if (e === 'down') { menu.i = (menu.i + 1) % menu.items.length; sfx.move(); }
    else if (e === 'left' || e === 'right') {
      const cur = menu.items[menu.i];
      if (cur.adj) { cur.adj(e === 'left' ? -1 : 1); sfx.move(); menu.onChange && menu.onChange(); }
    } else if (e === 'confirm') {
      const cur = menu.items[menu.i];
      if (cur.act) { sfx.ok(); cur.act(cur); } else if (cur.adj) { cur.adj(1); sfx.move(); menu.onChange && menu.onChange(); }
      return;
    } else if (e === 'back' || e === 'pause') { if (menu.back) { sfx.move(); menu.back(); } return; }
  }
}

// --------------------------------------------------------------- loop ----
let acc = 0, last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  input.pollPad();
  const edges = input.edges();
  if (input.anyKey) initAudio();

  if (mode === 'play') {
    if (edges.includes('pause')) { mode = 'pause'; menu = pauseMenu(); sfx.move(); }
    else if (edges.includes('map')) { mode = 'map'; }
    else {
      game.clockMinutes = clockValue();
      acc += dt * (settings.speed / 100);
      let n = 0;
      while (acc >= 1 / HZ && n < 24) {
        step(game, input.mask());
        handleEvents();
        acc -= 1 / HZ; n++;
      }
      if (n >= 24) acc = 0;
      if (DEV) devKeys();
      if (now - lastSave > 5000) { lastSave = now; saveRun(); }
    }
  } else {
    acc = 0;
    if (mode === 'map') { if (edges.some((e) => e === 'pause' || e === 'back' || e === 'map' || e === 'confirm')) { mode = menu ? 'pause' : 'play'; sfx.move(); } }
    else if (mode === 'ending') {
      endingInfo.t += dt;
      if (endingInfo.t > 4.5 && edges.some((e) => e === 'confirm' || e === 'pause')) { mode = 'title'; menu = titleMenu(); playSong('title'); }
    } else menuInput(edges);
  }
  squash *= 0.8;
  draw(dt);
  requestAnimationFrame(frame);
}

function clockValue() { const d = new Date(); return d.getHours() * 100 + d.getMinutes(); }

// ------------------------------------------------------------- drawing ---
function draw(dt) {
  if (!game) { game = createGame(world, START_ROOM, { volume: settings.music }); }
  R.draw(game, {
    squash,
    onSegOn: () => { if (mode === 'play') sfx.seg(); },
    overlay: (x, pal) => {
      if (mode === 'play' || mode === 'pause') { drawHints(x, pal); drawHud(x, pal, dt); }
      if (mode === 'title') drawTitle(x, pal);
      if (mode === 'pause' || (mode === 'title' && menu && menu.title)) drawMenu(x, pal);
      if (mode === 'title' && menu && !menu.title) drawMenu(x, pal, 112);
      if (mode === 'map') drawMap(x, pal);
      if (mode === 'ending') drawEnding(x, pal);
      if (DEV && devOverlay) drawDev(x);
    },
  });
}

// Hints that don't spoil: after a while stuck in one room, each wired display grows a small glyph
// for the quantity it counts (the death glyph is the HUD's). It says what to watch, never what to do.
const HINT_GLYPHS = {
  deaths: ['101', '010', '101'],
  jumps: ['00100', '01110', '10101', '00100', '00100'],
  time: ['01110', '10101', '10111', '10001', '01110'],
  pos: ['00000', '01010', '11111', '01010', '00000'],
  idle: ['1111', '0010', '0100', '1111'],
  visits: ['1110', '1010', '1011', '1010', '1110'],
};
const roomStay = { id: null, d0: 0, s0: 0 };
function drawHints(x, pal) {
  const room = game.room;
  if (roomStay.id !== room.id) Object.assign(roomStay, { id: room.id, d0: game.c.deaths, s0: game.c.steps });
  if (!settings.hints) return;
  const stuck = Math.max((game.c.deaths - roomStay.d0 - 6) / 4, ((game.c.steps - roomStay.s0) / HZ - 150) / 30);
  if (stuck <= 0) return;
  const a = Math.min(1, stuck) * (0.75 + 0.15 * Math.sin(performance.now() / 400));
  for (const d of room.displays) {
    const g = HINT_GLYPHS[d.src];
    if (!g || d.icon) continue;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
    for (const [cx, cy, cw] of d.cells) { x0 = Math.min(x0, cx); x1 = Math.max(x1, cx + cw); y0 = Math.min(y0, cy); }
    let px = x0 * TILE - g[0].length - 3;
    if (px < 2) px = x1 * TILE + 3;
    const py = y0 * TILE + 1;
    x.fillStyle = R.hexA(d.src === 'deaths' ? pal.hazard : pal.edge, a);
    g.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '1') x.fillRect(px + i, py + j, 1, 1); });
  }
}

function drawHud(x, pal, dt) {
  if ((settings.hud || game.room.hud) && !game.room.nohud) {
    const t = game.c.steps / HZ;
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(2, 2, 70, 11);
    R.segNum(x, fmtTime(t).replace(/\.\d\d$/, '') , 4, 4, R.hexA(pal.lit, 0.85), R.hexA(pal.lit, 0.08));
    x.fillStyle = R.hexA(pal.hazard, 0.9);
    x.fillRect(42, 6, 1, 1); x.fillRect(44, 6, 1, 1); x.fillRect(43, 7, 1, 1); x.fillRect(42, 8, 1, 1); x.fillRect(44, 8, 1, 1);
    R.segNum(x, String(game.c.deaths % 10000), 47, 4, R.hexA(pal.lit, 0.85), R.hexA(pal.lit, 0.08));
  }
  if (game.room.id === START_ROOM && game.c.jumps < 3) {
    const hint = input.lastDevice === 'touch' ? '' : input.lastDevice === 'pad' ? 'STICK MOVE   A JUMP' : 'ARROWS MOVE   Z / SPACE JUMP';
    if (hint) R.text(hint, (W - R.textWidth(hint)) / 2, 40, R.hexA(pal.edge, 0.55));
  }
  if (banner) {
    banner.t += dt;
    const a = Math.min(1, banner.t * 3, Math.max(0, 3 - banner.t));
    if (a <= 0) banner = null;
    else {
      const w = R.textWidth(banner.text);
      R.text(banner.sub, (W - R.textWidth(banner.sub)) / 2, H - 30, R.hexA(pal.edge, 0.7 * a));
      R.text(banner.text, (W - w) / 2, H - 22, R.hexA('#ffffff', 0.9 * a));
    }
  }
}

function drawTitle(x, pal) {
  x.fillStyle = 'rgba(0,0,0,0.55)'; x.fillRect(0, 0, W, H);
  // logo: big seven-segment-ish lettering using the pixel font at 3x
  const title = 'EIGHTH SEGMENT';
  const s = 3, tw = R.textWidth(title) * s;
  const t = performance.now() / 1000;
  drawBig(x, title, (W - tw) / 2, 40, s, pal.lit);
  x.fillStyle = '#fff';
  if (Math.sin(t * 3) > -0.3) x.fillRect((W + tw) / 2 + 4, 40 + 5 * s - 3, 3, 3);
  R.text('YOU ARE THE DECIMAL POINT.', (W - R.textWidth('YOU ARE THE DECIMAL POINT.')) / 2, 68, R.hexA(pal.edge, 0.9));
  if (meta.clears) {
    const s2 = `CLEARS ${meta.clears}  BEST ${meta.bestTime ? fmtTime(meta.bestTime) : '-'}  ENDINGS ${meta.endings.length}/${ENDINGS.length}`;
    R.text(s2, (W - R.textWidth(s2)) / 2, H - 12, R.hexA(pal.edge, 0.6));
  }
  const hint = input.lastDevice === 'touch' ? 'TAP JUMP TO SELECT' : input.lastDevice === 'pad' ? 'A TO SELECT' : 'ARROWS + Z/SPACE';
  R.text(hint, (W - R.textWidth(hint)) / 2, H - 22, R.hexA(pal.edge, 0.45));
}

function drawBig(x, s, px, py, k, color) {
  x.save(); x.translate(px, py); x.scale(k, k);
  R.text(s, 0, 0, color);
  x.restore();
}

const menuHits = [];
function drawMenu(x, pal, y0) {
  menuHits.length = 0;
  if (!menu) return;
  const hasTitle = !!menu.title;
  if (hasTitle) { x.fillStyle = 'rgba(0,0,0,0.7)'; x.fillRect(0, 0, W, H); }
  let y = y0 ?? 28;
  if (hasTitle) { R.text(menu.title, (W - R.textWidth(menu.title)) / 2, y - 14, pal.lit); }
  const rowH = menu.items.length > 8 ? 9 : 11;
  menu.items.forEach((it, i) => {
    const sel = i === menu.i;
    const label = it.label, val = it.value ? String(it.value()) : null;
    const col = sel ? '#ffffff' : R.hexA(pal.edge, 0.85);
    if (val !== null) {
      R.text(label, 70, y, col);
      if (it.digit) R.segNum(x, val, 236, y - 1, sel ? '#fff' : pal.lit, R.hexA(pal.lit, 0.1));
      else R.text(it.waiting ? 'PRESS A KEY' : val, 236, y, sel ? '#fff' : pal.lit);
      if (sel && it.adj) { R.text('<', 228, y, R.hexA(pal.lit, 0.6)); R.text('>', 246 + (it.digit ? 0 : R.textWidth(val)), y, R.hexA(pal.lit, 0.6)); }
    } else R.text(label, (W - R.textWidth(label)) / 2, y, col);
    if (sel) { x.fillStyle = '#fff'; x.fillRect(val !== null ? 62 : (W - R.textWidth(label)) / 2 - 8, y + 1, 3, 3); }
    menuHits.push({ i, y0: y - 3, y1: y + rowH - 3 });
    y += rowH;
  });
}

function drawMap(x, pal) {
  x.fillStyle = 'rgba(0,0,0,0.85)'; x.fillRect(0, 0, W, H);
  R.text('MAP', 4, 4, pal.lit);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const id of visited) { const r = world.rooms.get(id); if (!r) continue; minX = Math.min(minX, r.gx); maxX = Math.max(maxX, r.gx); minY = Math.min(minY, r.gy); maxY = Math.max(maxY, r.gy); }
  const cols = maxX - minX + 1, rows = maxY - minY + 1;
  // each room drawn at 1px per tile if it fits, else 0.5
  const k = Math.min(1, (W - 16) / (cols * 41), (H - 24) / (rows * 23));
  const ox = (W - cols * 41 * k) / 2, oy = 14 + (H - 18 - rows * 23 * k) / 2;
  const blink = Math.sin(performance.now() / 150) > 0;
  for (const id of visited) {
    const r = world.rooms.get(id); if (!r) continue;
    const rx = ox + (r.gx - minX) * 41 * k, ry = oy + (r.gy - minY) * 23 * k;
    const rp = PALETTES[r.region] || pal;
    x.fillStyle = R.hexA(rp.lit, 0.08); x.fillRect(rx, ry, 40 * k, 22 * k);
    x.fillStyle = R.hexA(rp.lit, 0.75);
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) {
      // the map draws what is really there: fake walls show as open
      if (r.tiles[ty * RW + tx] === T.WALL) x.fillRect(rx + tx * k, ry + ty * k, Math.max(k, 0.6), Math.max(k, 0.6));
    }
    if (r === game.room && blink) {
      x.fillStyle = '#fff';
      x.fillRect(rx + (game.p.x / SUB / TILE) * k - 1, ry + (game.p.y / SUB / TILE) * k - 1, 3, 3);
    }
  }
  const pts = `POINTS ${game.points.size}`;
  R.text(pts, W - R.textWidth(pts) - 4, 4, R.hexA(pal.edge, 0.8));
}

// The Master Readout, drawn big: digits light one by one, then the point (you) arcs into the slot
// you chose. Ending 3 reads 3.14159; the wrong slots read ten times too much / too little.
const READOUTS = { 3: ['314159', 0], 1: ['314159', 1], 2: ['0314159', 0] };
function bigDigit(x, mask, px, py, on, ghost) {
  const L = 8;
  const segs = [[2, 0, L, 2], [L + 2, 2, 2, L], [L + 2, L + 4, 2, L], [2, 2 * L + 4, L, 2], [0, L + 4, 2, L], [0, 2, 2, L], [2, L + 2, L, 2]];
  segs.forEach(([a, b, w, h], k) => { x.fillStyle = mask & (1 << k) ? on : ghost; x.fillRect(px + a, py + b, w, h); });
}
function drawReadout(x, pal, e) {
  const [digits, slot] = READOUTS[e.id] || READOUTS[3];
  const pitch = 16, x0 = Math.round((W - digits.length * pitch + 4) / 2), y0 = 18;
  const lit = Math.max(0, Math.min(digits.length, Math.floor((e.t - 0.6) / 0.18)));
  if (lit > (e.lit || 0)) { e.lit = lit; sfx.seg(); }
  const T0 = 0.8 + digits.length * 0.18, T1 = T0 + 0.7;          // point flight
  const landed = e.t >= T1;
  if (landed && !e.landed) { e.landed = true; sfx.point(); }
  // a wrong readout never settles: it flickers now and then
  const wrong = e.id !== 3 && landed && Math.sin(e.t * 7.3) * Math.sin(e.t * 2.1) > 0.82;
  const settle = landed ? Math.min(1, (e.t - T1) * 2) : 0;
  const onCol = e.id === 3 && landed ? R.hexA('#ffffff', 0.55 + 0.45 * settle) : R.hexA(pal.lit, wrong ? 0.35 : 0.95);
  for (let i = 0; i < digits.length; i++) {
    bigDigit(x, i < lit ? digitMask(+digits[i]) : 0, x0 + i * pitch, y0, onCol, R.hexA(pal.lit, 0.07));
  }
  const sx = x0 + slot * pitch + 13, sy = y0 + 20;                 // the decimal-point slot
  x.fillStyle = R.hexA(pal.lit, 0.12); x.fillRect(sx, sy, 2, 2);
  if (e.t < T0) return;
  const u = Math.min(1, (e.t - T0) / (T1 - T0)), ease = 1 - (1 - u) * (1 - u);
  const fx = W / 2 + (sx - W / 2) * ease, fy = H + 4 + (sy - H - 4) * ease - Math.sin(u * Math.PI) * 30;
  x.fillStyle = '#ffffff'; x.fillRect(Math.round(fx), Math.round(fy), 2, 2);
  if (landed && e.t - T1 < 0.6) {                                   // landing ring
    const k = (e.t - T1) / 0.6;
    x.strokeStyle = R.hexA('#ffffff', 0.8 * (1 - k)); x.lineWidth = 1;
    x.beginPath(); x.arc(sx + 1, sy + 1, 2 + k * 18, 0, Math.PI * 2); x.stroke();
  }
}

function drawEnding(x, pal) {
  const e = endingInfo, end = ENDINGS.find((q) => q.id === e.id) || ENDINGS[0];
  x.fillStyle = `rgba(0,0,0,${0.96 * Math.min(1, e.t / 0.8)})`; x.fillRect(0, 0, W, H);
  drawReadout(x, pal, e);
  const a = Math.max(0, Math.min(1, (e.t - 2.9) / 1.2));
  let y = 54;
  R.text(end.title, (W - R.textWidth(end.title)) / 2, y, R.hexA(pal.lit, a)); y += 14;
  for (const line of end.lines.filter((l) => !/^[\d.]+$/.test(l))) { R.text(line, (W - R.textWidth(line)) / 2, y, R.hexA('#ffffff', a * 0.85)); y += 9; }
  y += 6;
  const stats = [`TIME ${fmtTime(e.time)}`, `DEATHS ${e.deaths}   JUMPS ${e.jumps}`, `STRAY POINTS ${e.points}/${TOTAL_POINTS}`, `ENDING ${ENDINGS.indexOf(end) + 1} OF ${ENDINGS.length}${e.assisted ? '   (ASSISTED SPEED)' : ''}`];
  const b = Math.max(0, Math.min(1, (e.t - 3.6) / 1.2));
  for (const st of stats) { R.text(st, (W - R.textWidth(st)) / 2, y, R.hexA(pal.edge, b)); y += 9; }
  if (e.t > 4.5) R.text('PRESS JUMP', (W - R.textWidth('PRESS JUMP')) / 2, H - 12, R.hexA(pal.edge, 0.5 + 0.5 * Math.sin(e.t * 4)));
}

// ---------------------------------------------------------------- dev ----
let devOverlay = DEV;
const roomIds = [...world.rooms.keys()];
function devKeys() { /* handled in keydown below */ }
if (DEV) {
  addEventListener('keydown', (e) => {
    if (!game) return;
    if (e.code === 'F2') { devOverlay = !devOverlay; }
    if (e.code === 'BracketRight' || e.code === 'BracketLeft') {
      const i = (roomIds.indexOf(game.room.id) + (e.code === 'BracketRight' ? 1 : roomIds.length - 1)) % roomIds.length;
      warp(roomIds[i]);
    }
    if (e.code === 'Digit1') game.c.deaths++;
    if (e.code === 'Digit2') game.c.jumps++;
    if (e.code === 'Digit3') game.c.steps += HZ;
  });
}
function warp(id) {
  const c = game.c;
  game = createGame(world, id, { volume: settings.music, counters: c, points: [...game.points], flags: [...game.flags] });
  visited.add(id); mode = 'play'; playSong(game.room.music || game.room.region);
}
function drawDev(x) {
  x.fillStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i <= RW; i++) x.fillRect(i * TILE, 0, 1, H);
  for (let i = 0; i <= RH; i++) x.fillRect(0, i * TILE, W, 1);
  const p = game.p;
  const s = `${game.room.id} X${(p.x / SUB).toFixed(1)} Y${(p.y / SUB).toFixed(1)} D${game.c.deaths} J${game.c.jumps} I${Math.floor(game.c.idle / HZ)} V${game.c.visits[game.room.id]}`;
  R.text(s, 2, H - 7, '#ff0');
}

// ------------------------------------------------------------- touch ----
const touchEl = document.getElementById('touch');
let sawTouch = false;
addEventListener('touchstart', () => { if (!sawTouch) { sawTouch = true; updateTouchVisibility(); } }, { passive: true });
function updateTouchVisibility() {
  const show = settings.touch === 'on' || (settings.touch === 'auto' && (sawTouch || matchMedia('(pointer: coarse)').matches));
  touchEl.hidden = !show || !(mode === 'play');
}
input.bindTouch(touchEl);
setInterval(updateTouchVisibility, 500);

// tap/click on menus
canvas.addEventListener('pointerdown', (e) => {
  initAudio();
  input.anyKey = true;
  if (!menu || (mode !== 'title' && mode !== 'pause')) {
    if (mode === 'ending' || mode === 'map') input.push('confirm');
    return;
  }
  const y = ((e.clientY * R.dpr) - R.oy) / R.scale;
  const xx = ((e.clientX * R.dpr) - R.ox) / R.scale;
  const hit = menuHits.find((h) => y >= h.y0 && y < h.y1);
  if (!hit) return;
  const it = menu.items[hit.i];
  if (menu.i !== hit.i) { menu.i = hit.i; sfx.move(); if (!(e.pointerType === 'touch' || e.pointerType === 'mouse')) return; }
  if (it.adj && !it.act) { it.adj(xx < 230 ? -1 : 1); sfx.move(); menu.onChange && menu.onChange(); }
  else if (it.act) { sfx.ok(); it.act(it); }
});

addEventListener('resize', () => R.resize());
document.addEventListener('visibilitychange', () => {
  if (document.hidden && mode === 'play') { saveRun(); mode = 'pause'; menu = pauseMenu(); }
});
addEventListener('pagehide', () => { if (game && mode !== 'title' && mode !== 'ending' && run) saveRun(); });

// ---------------------------------------------------------------- boot ---
R.resize();
applySettings();
if (SHOT) {
  // synchronous render for headless screenshots: ?shot&room=ID[&deaths=n&jumps=n]
  const id = params.get('room') || START_ROOM;
  const c = newCounters();
  c.deaths = +params.get('deaths') || 0; c.jumps = +params.get('jumps') || 0; c.steps = (+params.get('time') || 0) * HZ;
  game = createGame(world, id, { volume: settings.music, counters: c });
  mode = params.has('title') ? 'title' : 'play';
  if (mode === 'title') menu = titleMenu();
  devOverlay = params.has('grid');
  if (params.get('ending')) { endingInfo = { id: +params.get('ending'), time: 1234.5, deaths: 88, jumps: 321, points: 2, assisted: false, t: +params.get('t') || 6 }; mode = 'ending'; }
  if (params.has('stuck')) Object.assign(roomStay, { id, d0: c.deaths - 20, s0: 0 });
  draw(0);
} else {
  menu = titleMenu();
  playSong('title');
  if (DEV && params.get('room')) { game = createGame(world, params.get('room'), { volume: settings.music }); enterPlay(); visited.add(game.room.id); run = run || { visited: [], assisted: false }; }
  requestAnimationFrame(frame);
}
