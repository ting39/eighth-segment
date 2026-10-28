// Game shell: loop, states (title / play / pause / map / settings / ending), save, fx.
import { buildWorld, createGame, step, restartRoom, respawn, snapshot, restore, updateDisplays, HZ, SUB, RW, RH, TILE, T, newCounters } from './sim.js';
import { LANGS, CODE, LANG_NAME } from './glyphs.js';
import { createRenderer, W, H, PALETTES } from './render.js';
import { createInput, DEFAULT_KEYS, keyName } from './input.js';
import { digitMask } from './segments.js';
import { nudgeFor } from './nudges.js';
import { initAudio, sfx, playSong, setLayers, setVolumes } from './audio.js';

const params = new URLSearchParams(location.search);
// v3 is the only world now (v1 and v2 live on in git history)
const V2 = true;
const { ROOMS, START_ROOM, ENDINGS } = await import('./rooms_v3.js');
const DEV = params.has('dev');
const SHOT = params.has('shot');
const SAVE_KEY = 'eighth-segment/v3';
// the game language is the site's (localStorage "ting39:lang", via i18n.js) and also a world quantity
const curLang = () => (globalThis.I18N && LANGS.includes(I18N.lang) ? I18N.lang : 'en');

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
  music: 6, sfx: 7, bright: 5, hudpos: 'top', speed: 100, glow: true, shake: true, flashes: true, hud: true, hints: true, touch: 'auto',
  keys: structuredClone(DEFAULT_KEYS),
}, saved.settings || {});
// older saves predate some actions (e.g. restart): fill in defaults for any missing key lists
for (const [act, codes] of Object.entries(DEFAULT_KEYS)) if (!settings.keys[act]) settings.keys[act] = [...codes];
input.keys = settings.keys;
const meta = Object.assign({ endings: [], bestTime: null, bestDeaths: null, clears: 0, revealed: [], hintsSeen: [] }, saved.meta || {});
// the HUD is a world quantity too: where it sits, or 'off' (Settings → HUD), decides what a solid HUD blocks
const hudOf = () => (settings.hud ? settings.hudpos : 'off');
const gopts = () => ({ volume: settings.music, bright: settings.bright, hudpos: hudOf(), lang: curLang() });

function applySettings() {
  setVolumes(settings.music, settings.sfx);
  R.opts.glow = settings.glow; R.opts.shake = settings.shake; R.opts.flashes = settings.flashes;
  if (game) { game.volume = settings.music; game.bright = settings.bright; game.hudpos = hudOf(); game.lang = curLang(); updateDisplays(game); }
  updateTouchVisibility();
}

// ---------------------------------------------------------------- game ---
let game = null;
let run = saved.run || null;           // { snap, visited:[], assisted, startedAt }
let visited = new Set(run ? run.visited : []);
let mode = 'title';
let menu = null;                       // { items, i, title }
let banner = null;                     // { text, sub, t }
let roomFx = 1;                        // 0..1: the CRT 'retune' when you cross into another room
let squash = 0;
let endingInfo = null;
let lastSave = 0;

function newGame() {
  game = createGame(world, START_ROOM, gopts());
  visited = new Set([START_ROOM]);
  run = { visited: [...visited], assisted: settings.speed < 100, snap: null };
  saveRun();
  enterPlay();
  showBanner(game.room);
}

function continueGame() {
  game = createGame(world, run.snap.room, { ...gopts(), counters: run.snap.c, spawn: run.snap.spawn, points: run.snap.points, flags: run.snap.flags });
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

// the hall's theme gains a layer for every wing the run has reached
function roomMusic(room) {
  if (room.music === 'hall') {
    const wings = new Set();
    for (const id of visited) { const r = world.rooms.get(id); if (r && r.region !== room.region) wings.add(r.region); }
    setLayers(wings.size);
  }
  playSong(room.music || room.region);
}

function enterPlay() {
  mode = 'play'; menu = null;
  input.clearHeld();
  roomMusic(game.room);
}

function showBanner(room, force) {
  if (room.card) return;                // this room says its name itself, big and solid (the title card)
  const first = !visited.has(room.id) || force;
  if (!first && !room.always) return;
  banner = { text: room.name || '', sub: room.wing || (PALETTES[room.region] || {}).name || '', t: 0 };
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
        for (const k of hintsShown) if (!meta.hintsSeen.includes(k)) meta.hintsSeen.push(k);
        hintsShown.clear();
        for (const r of world.rooms.get(e.id).reveals || []) reveal(r);
        sfx.room(); roomFx = 0;
        const room = world.rooms.get(e.id);
        showBanner(room);
        visited.add(e.id);
        roomMusic(room);
        saveRun();
        break;
      }
      case 'point': sfx.point(); R.burst(e.x * TILE + 4, e.y * TILE + 4, '#ffffff', 24, 1.4); saveRun(); break;
      case 'bonk': sfx.bonk(); break;
      case 'dp': sfx.seg(); R.burst(e.x * TILE + 4, e.y * TILE + 6, R.hexA(pal.lit, 0.9), 8, 0.6, 14); break;
      case 'button': sfx.move(); R.dust(e.x * TILE, e.y * TILE, R.hexA(pal.lit, 0.8)); break;
      case 'knob': sfx.seg(); if (e.reg === 'bright') { settings.bright = game.bright; reveal('bright'); } break;
      case 'switch': sfx.ok(); R.burst(e.x * TILE + 4, e.y * TILE + 4, R.hexA(pal.lit, 0.8), 6, 0.6, 16); break;
      case 'pickup': sfx.point(); break;
      case 'socket': sfx.slot(); R.flash = 0.6; R.burst(e.x * TILE + 4, e.y * TILE + 4, '#ffffff', 16, 1.2); saveRun(); break;
      case 'drop': break;
      case 'slot': startEnding(e.id); break;
      case 'note': break;
      case 'lang': sfx.ok(); R.flash = 0.4; R.burst(e.x * TILE + 4, e.y * TILE + 4, '#b98cff', 12, 0.9, 24); if (globalThis.I18N) I18N.set(e.lang); reveal('lang'); break;
    }
  }
  game.events.length = 0;
}

function startEnding(id) {
  if (V2 && id < 3) {   // 1% / 10%: the machine shrugs, the point pops back out, the run goes on
    sfx.slot();
    endingInfo = { id, time: game.c.steps / HZ, deaths: game.c.deaths, jumps: game.c.jumps, points: game.points.size, assisted: run.assisted, t: 0, nudge: true };
    if (!meta.endings.includes(id)) meta.endings.push(id);
    saveAll(); mode = 'ending'; return;
  }
  sfx.slot();
  const time = game.c.steps / HZ;
  endingInfo = { id, time, deaths: game.c.deaths, jumps: game.c.jumps, points: game.points.size, assisted: run.assisted, t: 0, clock: game.points.has(CLOCK_POINT) };
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

// one-time hints: the first display of each kind shows its glyph at the wire's far end, for one visit
const hintsShown = new Set();
function showHint(d) {
  if (meta.hintsSeen.includes(d.hint)) return false;
  hintsShown.add(d.hint); return true;
}
function reveal(k) { if (!meta.revealed.includes(k)) { meta.revealed.push(k); saveAll(); } }

// --------------------------------------------------------------- menus ---
function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60), cs = Math.floor((sec * 100) % 100);
  return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

const SPEEDS = [100, 90, 80, 70, 60, 50];
function settingsMenu(back) {
  const items = [
    // the language item always says LANGUAGE in English too, so nobody gets lost in a script they can't read
    ...(globalThis.I18N ? [{ label: 'LANGUAGE', value: () => `${CODE[curLang()]} ${LANG_NAME[curLang()]}`, adj: (d) => { I18N.set(LANGS[(LANGS.indexOf(curLang()) + (d || 1) + LANGS.length) % LANGS.length]); } }] : []),
    { label: 'MUSIC VOLUME', value: () => settings.music, digit: true, adj: (d) => { settings.music = (settings.music + d + 10) % 10; } },
    { label: 'SOUND VOLUME', value: () => settings.sfx, digit: true, adj: (d) => { settings.sfx = (settings.sfx + d + 10) % 10; sfx.jump(); } },
    ...(meta.revealed.includes('bright') ? [{ label: 'BRIGHTNESS', value: () => settings.bright, digit: true, adj: (d) => { settings.bright = Math.max(0, Math.min(9, settings.bright + d)); } }] : []),
    ...(meta.revealed.includes('hudpos') ? [{ label: 'HUD POSITION', value: () => settings.hudpos.toUpperCase(), adj: () => { settings.hudpos = settings.hudpos === 'top' ? 'bottom' : 'top'; } }] : []),
    { label: 'GAME SPEED', value: () => settings.speed + '%', adj: (d) => { const i = SPEEDS.indexOf(settings.speed); settings.speed = SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, i - d))]; if (settings.speed < 100 && run) run.assisted = true; } },
    { label: 'GLOW', value: () => (settings.glow ? 'ON' : 'OFF'), adj: () => { settings.glow = !settings.glow; } },
    { label: 'SCREEN SHAKE', value: () => (settings.shake ? 'ON' : 'OFF'), adj: () => { settings.shake = !settings.shake; } },
    { label: 'FLASHES', value: () => (settings.flashes ? 'ON' : 'OFF'), adj: () => { settings.flashes = !settings.flashes; } },
    { label: 'HUD (TIME/DEATHS)', value: () => (settings.hud ? 'ON' : 'OFF'), adj: () => { settings.hud = !settings.hud; } },
    { label: 'HINTS WHEN STUCK', value: () => (settings.hints ? 'ON' : 'OFF'), adj: () => { settings.hints = !settings.hints; } },
    { label: 'TOUCH BUTTONS', value: () => settings.touch.toUpperCase(), adj: (d) => { const o = ['auto', 'on', 'off']; settings.touch = o[(o.indexOf(settings.touch) + (d || 1) + 3) % 3]; } },
    ...['left', 'right', 'jump', 'restart'].map((act) => ({
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
  items.push({ label: 'MORE BY TING39', act: () => { saveAll(); location.href = 'https://ting39.github.io/'; } });
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
    else if (edges.includes('restart')) { restartRoom(game); sfx.move(); }
    else {
      game.clockMinutes = clockValue();
      acc += dt * (settings.speed / 100);
      let n = 0;
      while (acc >= 1 / HZ && n < 24) {
        step(game, input.mask());
        handleEvents();
        beat();
        acc -= 1 / HZ; n++;
      }
      if (n >= 24) acc = 0;
      if (DEV) devKeys();
      if (now - lastSave > 5000) { lastSave = now; saveRun(); }
    }
  } else {
    acc = 0;
    // time in the pause menu (or on the map) is real time the game clock never sees: one display counts it
    if (game && run && (mode === 'pause' || mode === 'map')) {
      const before = Math.floor((game.c.paused || 0) / HZ);
      game.c.paused = (game.c.paused || 0) + Math.min(dt, 0.25) * HZ; updateDisplays(game);
      // where a display counts paused time, the menu ticks: something in the room is still counting
      if (Math.floor(game.c.paused / HZ) !== before && game.room.displays.some((d) => d.src === 'paused')) sfx.tick(false);
    }
    if (mode === 'map') { if (edges.some((e) => e === 'pause' || e === 'back' || e === 'map' || e === 'confirm')) { mode = menu ? 'pause' : 'play'; sfx.move(); } }
    else if (mode === 'ending') {
      endingInfo.t += dt;
      if (endingInfo.t > 4.5 && edges.some((e) => e === 'confirm' || e === 'pause')) {
        if (endingInfo.nudge) { respawn(game); mode = 'play'; input.clearHeld(); roomMusic(game.room); }
        else { mode = 'title'; menu = titleMenu(); playSong('title'); }
      }
    } else menuInput(edges);
  }
  squash *= 0.8;
  draw(dt);
  requestAnimationFrame(frame);
}

function clockValue() { const d = new Date(); return d.getHours() * 100 + d.getMinutes(); }

// audible clocks: a sign that cycles languages ticks on every change; a title card ticks fast in its last second
function beat() {
  const c = game.c;
  for (const d of game.room.displays) {
    if (d.langSrc === 'time' && c.steps % (HZ * (d.every || 1)) === 0) sfx.tick(false);
    if (d.until) { const left = d.until * HZ - c.here; if (left > 0 && left <= HZ && left % 15 === 0) sfx.tick(true); }
  }
}

// ------------------------------------------------------------- drawing ---
function draw(dt) {
  if (!game) { game = createGame(world, START_ROOM, gopts()); }
  R.draw(game, {
    squash, showHint, particlesOnTop: mode === 'ending',
    onSegOn: () => { if (mode === 'play') sfx.seg(); },
    overlay: (x, pal) => {
      if (mode === 'play' || mode === 'pause') { drawHints(x, pal); drawHud(x, pal, dt); }
      if (mode === 'title') drawTitle(x, pal);
      if (mode === 'pause' || (mode === 'title' && menu && menu.title)) drawMenu(x, pal);
      if (mode === 'title' && menu && !menu.title) drawMenu(x, pal, 104);
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
  lang: ['01110', '10101', '11111', '10101', '01110'],
  reg: ['111', '101', '111'], bus: ['11111', '10001', '10101', '10001', '11111'], bright: ['10101', '01110', '11011', '01110', '10101'],
  volume: ['00100', '01101', '11101', '01101', '00100'], clock: ['10101', '01110', '11011', '01110', '10101'], paused: ['11011', '11011', '11011', '11011', '11011'],
};
const roomStay = { id: null, d0: 0, s0: 0 };
function drawHints(x, pal) {
  const room = game.room;
  if (roomStay.id !== room.id) Object.assign(roomStay, { id: room.id, d0: game.c.deaths, s0: game.c.steps, nudged: false });
  if (!settings.hints) return;
  const stuck = Math.max((game.c.deaths - roomStay.d0 - 6) / 4, ((game.c.steps - roomStay.s0) / HZ - 150) / 30);
  if (stuck <= 0) return;
  const a = Math.min(1, stuck) * (0.75 + 0.15 * Math.sin(performance.now() / 400));
  for (const d of room.displays) {
    if (!d.cells.length) continue;
    const src = String(d.src);
    const g = HINT_GLYPHS[d.t === 'code' || d.t === 'word' || src.startsWith('letters:') ? 'lang' : src.startsWith('reg:') ? (d.bus ? 'bus' : 'reg') : d.dim || d.burn ? 'bright' : src];
    if (!g || d.icon) continue;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
    for (const [cx, cy, cw] of d.cells) { x0 = Math.min(x0, cx); x1 = Math.max(x1, cx + cw); y0 = Math.min(y0, cy); }
    let px = x0 * TILE - g[0].length - 3;
    if (px < 2) px = x1 * TILE + 3;
    const py = y0 * TILE + 1;
    x.fillStyle = R.hexA(d.src === 'deaths' ? pal.hazard : pal.edge, a);
    g.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '1') x.fillRect(px + i, py + j, 1, 1); });
  }
  // second stage (much later): one line pointing at what to look at -- never at the answer
  if (stuck >= 2) {
    const line = nudgeFor(room.id, curLang());
    if (line && !roomStay.nudged) { roomStay.nudged = true; sfx.ok(); }
    if (line) {
      const b = Math.min(1, stuck - 2) * 0.8, y = (settings.hudpos === 'bottom' || room.hudBottom) ? 18 : H - 12;
      x.fillStyle = `rgba(0,0,0,${0.5 * b})`; x.fillRect(0, y - 3, W, 11);
      R.text(line, (W - R.textWidth(line)) / 2, y, R.hexA(pal.edge, b));
    }
  }
}

function drawHud(x, pal, dt) {
  if (roomFx < 1) {          // the picture opens from a bright line in the middle, like a tube warming up
    roomFx = Math.min(1, roomFx + dt / 0.13);
    const h0 = Math.round((1 - roomFx) * (1 - roomFx) * H / 2);
    x.fillStyle = 'rgba(0,0,0,0.75)'; x.fillRect(0, 0, W, h0); x.fillRect(0, H - h0, W, h0);
    x.fillStyle = R.hexA(pal.lit, 0.5 * (1 - roomFx)); x.fillRect(0, h0, W, 1); x.fillRect(0, H - h0 - 1, W, 1);
  }
  if ((settings.hud || game.room.hud) && !game.room.nohud && !game.room.hudSolid) {
    const t = game.c.steps / HZ, oy = (settings.hudpos === 'bottom' || game.room.hudBottom) ? H - 15 : 0;
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(2, 2 + oy, 70, 11);
    R.segNum(x, fmtTime(t).replace(/\.\d\d$/, '') , 4, 4 + oy, R.hexA(pal.lit, 0.85), R.hexA(pal.lit, 0.08));
    x.fillStyle = R.hexA(pal.hazard, 0.9);
    x.fillRect(42, 6 + oy, 1, 1); x.fillRect(44, 6 + oy, 1, 1); x.fillRect(43, 7 + oy, 1, 1); x.fillRect(42, 8 + oy, 1, 1); x.fillRect(44, 8 + oy, 1, 1);
    R.segNum(x, String(game.c.deaths % 10000), 47, 4 + oy, R.hexA(pal.lit, 0.85), R.hexA(pal.lit, 0.08));
  }
  if (game.room.id === START_ROOM && game.c.jumps < 3) {
    const hint = input.lastDevice === 'touch' ? '' : input.lastDevice === 'pad' ? 'STICK MOVE   A JUMP' : 'ARROWS MOVE   Z / SPACE JUMP';
    if (hint) R.text(hint, (W - R.textWidth(hint)) / 2, 82, R.hexA(pal.edge, 0.55));
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
  // the big logo keeps the chunky pixel font (it's large enough to read and is part of the look)
  x.save(); x.translate(px, py); x.scale(k, k);
  R.pixelText(s, 0, 0, color);
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
    if (sel) {
      // soft highlight band behind the selected row, then the marker
      const bx = val !== null ? 58 : (W - R.textWidth(label)) / 2 - 12;
      const bw = val !== null ? W - 2 * 58 : R.textWidth(label) + 24;
      x.fillStyle = R.hexA(pal.lit, 0.16); x.fillRect(bx, y - 3, bw, rowH - 1);
      x.fillStyle = R.hexA(pal.lit, 0.5); x.fillRect(bx, y - 3, 1, rowH - 1); x.fillRect(bx + bw - 1, y - 3, 1, rowH - 1);
      x.fillStyle = '#fff'; x.fillRect(val !== null ? 62 : (W - R.textWidth(label)) / 2 - 8, y + 1, 3, 3);
    }
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
// how many stray points light each of the readout's last three digits (the hall's R3..R5 use the same numbers)
const CLOCK_POINT = 'x2:35,6';           // WALL CLOCK's stray point: the one beyond 100%
const POINTS_FOR = [3, 7, 19];          // the hall needs 19; the wall clock's point is beyond 100%
const READOUTS = V2 ? { 1: ['100000', 0], 2: ['100000', 1], 3: ['100000', 2], 4: ['100000', 3] } : { 3: ['314159', 0], 1: ['314159', 1], 2: ['0314159', 0] };
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
  if (landed && !e.landed) {
    e.landed = true; sfx.point();
    // the point clicks home: a burst at the slot (the true and deep endings ring out further)
    const bx = x0 + slot * pitch + 14, by = y0 + 21, big = e.id >= 3;
    R.burst(bx, by, '#ffffff', big ? 40 : 14, big ? 2.2 : 1.1, big ? 70 : 30);
    R.burst(bx, by, pal.lit, big ? 30 : 8, big ? 1.4 : 0.8, big ? 90 : 30);
    if (big) { R.flash = 0.6; R.shake = 3; if (e.id === 4) sfx.slot(); }
  }
  // a wrong readout never settles: it flickers now and then
  const wrong = e.id < 3 && landed && Math.sin(e.t * 7.3) * Math.sin(e.t * 2.1) > 0.82;
  const settle = landed ? Math.min(1, (e.t - T1) * 2) : 0;
  const onCol = e.id >= 3 && landed ? R.hexA('#ffffff', 0.55 + 0.45 * settle) : R.hexA(pal.lit, wrong ? 0.35 : 0.95);
  for (let i = 0; i < digits.length; i++) {
    const earned = e.id !== 3 || i < 3 || e.points >= POINTS_FOR[i - 3];   // the last three digits are your stray points
    bigDigit(x, i < lit && earned ? digitMask(+digits[i]) : 0, x0 + i * pitch, y0, onCol, R.hexA(pal.lit, 0.07));
  }
  if (V2) { // the percent sign
    const px = x0 + digits.length * pitch + 1;
    x.fillStyle = lit >= digits.length ? onCol : R.hexA(pal.lit, 0.07);
    x.fillRect(px, y0 + 1, 3, 3); x.fillRect(px + 8, y0 + 17, 3, 3);
    for (let k = 0; k < 18; k++) x.fillRect(px + 10 - Math.round(k * 10 / 18), y0 + 1 + k, 2, 1);
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
  const lines = [...end.lines];
  if (e.id === 3 && e.points < TOTAL_POINTS) lines.push(`${TOTAL_POINTS - e.points} STRAY POINT${TOTAL_POINTS - e.points > 1 ? 'S' : ''} STILL LOST.`);
  // the true ending nods at the one number that was never the machine's: the clock on the player's wall
  if (e.id === 3 && e.points === TOTAL_POINTS - 1 && !e.clock) lines.push('IT IS ONLY A MATTER OF TIME.');
  if (e.id === 3 && e.points >= TOTAL_POINTS) lines.push('EVEN THE CLOCK ON YOUR WALL READS TRUE.');
  for (const line of lines.filter((l) => !/^[\d.]+$/.test(l))) { R.text(line, (W - R.textWidth(line)) / 2, y, R.hexA('#ffffff', a * 0.85)); y += 9; }
  y += 6;
  const stats = e.nudge ? ['THE POINT POPS BACK OUT.'] : [`TIME ${fmtTime(e.time)}`, `DEATHS ${e.deaths}   JUMPS ${e.jumps}`, `STRAY POINTS ${e.points}/${TOTAL_POINTS}`, `ENDING ${ENDINGS.indexOf(end) + 1} OF ${ENDINGS.length}${e.assisted ? '   (ASSISTED SPEED)' : ''}`];
  const b = Math.max(0, Math.min(1, (e.t - 3.6) / 1.2));
  for (const st of stats) { R.text(st, (W - R.textWidth(st)) / 2, y, R.hexA(pal.edge, b)); y += 9; }
  if (e.id >= 3 && e.points >= TOTAL_POINTS && b > 0) {          // ...and its time, in the machine's own digits
    const hhmm = String(clockValue()).padStart(4, '0'), cx = Math.round(W / 2 - 34), cy = H - 46;
    for (let i = 0; i < 4; i++) bigDigit(x, digitMask(+hhmm[i]), cx + i * 16 + (i > 1 ? 6 : 0), cy, R.hexA('#9ef0ff', 0.9 * b), R.hexA('#9ef0ff', 0.06));
    if (Math.floor(e.t * 2) % 2) { x.fillStyle = R.hexA('#9ef0ff', 0.9 * b); x.fillRect(cx + 32, cy + 6, 3, 3); x.fillRect(cx + 32, cy + 14, 3, 3); }
  }
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
  game = createGame(world, id, { ...gopts(), counters: c, points: [...game.points], flags: [...game.flags] });
  visited.add(id); mode = 'play'; roomMusic(game.room);
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

// mouse hover: highlight (select) the menu item under the pointer, pointer cursor over items
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  const onMenu = menu && (mode === 'title' || mode === 'pause');
  const y = ((e.clientY * R.dpr) - R.oy) / R.scale;
  const hit = onMenu ? menuHits.find((h) => y >= h.y0 && y < h.y1) : null;
  canvas.style.cursor = hit ? 'pointer' : '';
  if (hit && menu.i !== hit.i && !menu.items[hit.i].waiting) { menu.i = hit.i; sfx.move(); }
});
canvas.addEventListener('pointerleave', () => { canvas.style.cursor = ''; });

addEventListener('resize', () => R.resize());
document.addEventListener('visibilitychange', () => {
  if (document.hidden && mode === 'play') { saveRun(); mode = 'pause'; menu = pauseMenu(); }
});
addEventListener('pagehide', () => { if (game && mode !== 'title' && mode !== 'ending' && run) saveRun(); });

if (globalThis.I18N) I18N.onChange(() => { if (game) { game.lang = curLang(); updateDisplays(game); } R.invalidate(); });
addEventListener('storage', (e) => { if (e.key === 'ting39:lang' && globalThis.I18N && e.newValue && e.newValue !== I18N.lang) I18N.set(e.newValue); });

// ---------------------------------------------------------------- boot ---
R.resize();
applySettings();
if (SHOT) {
  // synchronous render for headless screenshots: ?shot&room=ID[&deaths=n&jumps=n]
  const id = params.get('room') || START_ROOM;
  const c = newCounters();
  if (params.has('bright')) settings.bright = +params.get('bright');
  if (params.has('lang') && globalThis.I18N) I18N.set(params.get('lang'));
  c.deaths = +params.get('deaths') || 0; c.jumps = +params.get('jumps') || 0; c.steps = (+params.get('time') || 0) * HZ;
  game = createGame(world, id, { ...gopts(), counters: c });
  mode = params.has('title') ? 'title' : 'play';
  if (mode === 'title') menu = titleMenu();
  devOverlay = params.has('grid');
  if (params.get('ending')) { endingInfo = { id: +params.get('ending'), time: 1234.5, deaths: 88, jumps: 321, points: +params.get('points') || 2, clock: params.has('clockpt'), assisted: false, t: +params.get('t') || 6 }; mode = 'ending'; }
  if (params.has('stuck')) Object.assign(roomStay, { id, d0: c.deaths - 20, s0: 0 });
  draw(0);
} else {
  menu = titleMenu();
  playSong('title');
  if (DEV && params.get('room')) { game = createGame(world, params.get('room'), gopts()); enterPlay(); visited.add(game.room.id); run = run || { visited: [], assisted: false }; }
  requestAnimationFrame(frame);
}
