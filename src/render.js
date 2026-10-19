// VFD-style renderer. Everything is drawn at 320x176 into `low`, then
// composited to the screen with integer scaling, bloom and a mesh overlay.
import { RW, RH, TILE, SUB, PW, PH, T } from './sim.js';
import { drawText, textWidth } from './font.js';

export const W = RW * TILE, H = RH * TILE;

export const PALETTES = {
  boot:   { lit: '#5ff2e6', wall: '#0e3b3a', edge: '#3bc4b8', bg0: '#030b0c', bg1: '#071a1b', hazard: '#ff5a4a', name: 'BOOT' },
  tally:  { lit: '#ffb347', wall: '#3a2508', edge: '#d98a2b', bg0: '#0c0703', bg1: '#1b1006', hazard: '#ff4d6d', name: 'TALLY' },
  clock:  { lit: '#7dff8a', wall: '#0d3312', edge: '#46c457', bg0: '#030b04', bg1: '#08180a', hazard: '#ff6a3d', name: 'CLOCKWORK' },
  coord:  { lit: '#ff7ae3', wall: '#3a0d33', edge: '#c94fb5', bg0: '#0b030a', bg1: '#190818', hazard: '#ffd23d', name: 'COORDINATES' },
  over:   { lit: '#f2f4ff', wall: '#262a3a', edge: '#9aa3c9', bg0: '#05060b', bg1: '#0e1020', hazard: '#ff3d5a', name: 'OVERFLOW' },
  master: { lit: '#fff3c2', wall: '#2e2a1a', edge: '#c9b875', bg0: '#060604', bg1: '#141208', hazard: '#ff3d5a', name: 'MASTER READOUT' },
};

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

export function createRenderer(canvas) {
  const low = document.createElement('canvas'); low.width = W; low.height = H;
  const lc = low.getContext('2d');
  const g1 = document.createElement('canvas'); g1.width = W / 2; g1.height = H / 2;
  const g1c = g1.getContext('2d');
  const g2 = document.createElement('canvas'); g2.width = W / 8; g2.height = H / 8;
  const g2c = g2.getContext('2d');
  const sc = canvas.getContext('2d');
  let staticLayer = null, staticRoom = null, mesh = null, meshScale = 0;

  const R = {
    low, lc, scale: 1, ox: 0, oy: 0,
    particles: [], shake: 0, flash: 0,
    seg: new Map(),   // display brightness state per room display cell
    trail: [],
    opts: { glow: true, shake: true, flashes: true },
  };

  R.resize = function () {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cw = Math.floor(window.innerWidth * dpr), ch = Math.floor(window.innerHeight * dpr);
    canvas.width = cw; canvas.height = ch;
    canvas.style.width = window.innerWidth + 'px'; canvas.style.height = window.innerHeight + 'px';
    let s = Math.min(cw / W, ch / H);
    if (s >= 2) s = Math.floor(s);
    R.scale = s; R.ox = Math.floor((cw - W * s) / 2); R.oy = Math.floor((ch - H * s) / 2);
    R.dpr = dpr;
  };

  function buildStatic(room, pal) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    // background: dark glass gradient + faint grid of dots
    const grd = x.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, pal.bg1); grd.addColorStop(1, pal.bg0);
    x.fillStyle = grd; x.fillRect(0, 0, W, H);
    x.fillStyle = hexA(pal.edge, 0.07);
    for (let yy = 4; yy < H; yy += 8) for (let xx = 4; xx < W; xx += 8) x.fillRect(xx, yy, 1, 1);
    const t = room.tiles;
    const isW = (tx, ty) => tx < 0 || ty < 0 || tx >= RW || ty >= RH ? null : (t[ty * RW + tx] === T.WALL || t[ty * RW + tx] === T.FAKE);
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) {
      const v = t[ty * RW + tx];
      const px = tx * TILE, py = ty * TILE;
      if (v === T.WALL || v === T.FAKE) {
        x.fillStyle = pal.wall; x.fillRect(px, py, TILE, TILE);
        // inner hatch for texture
        x.fillStyle = hexA(pal.edge, 0.12);
        if ((tx + ty) % 2 === 0) x.fillRect(px + 3, py + 3, 2, 2);
        x.fillStyle = pal.edge;
        if (isW(tx, ty - 1) === false) x.fillRect(px, py, TILE, 1);
        if (isW(tx, ty + 1) === false) x.fillRect(px, py + TILE - 1, TILE, 1);
        if (isW(tx - 1, ty) === false) x.fillRect(px, py, 1, TILE);
        if (isW(tx + 1, ty) === false) x.fillRect(px + TILE - 1, py, 1, TILE);
        // fake walls have one pixel out of place: the only visible tell besides the map
        if (v === T.FAKE) { x.fillStyle = pal.wall; x.fillRect(px + 2, py + 2, 1, 1); }
      } else if (v === T.ONEWAY) {
        x.fillStyle = pal.edge;
        for (let i = 0; i < TILE; i += 2) x.fillRect(px + i, py, 1, 1);
        x.fillRect(px, py, TILE, 1);
        x.fillStyle = hexA(pal.edge, 0.35); x.fillRect(px, py + 1, TILE, 1);
      } else if (v >= T.SPIKE_U && v <= T.SPIKE_R) {
        x.fillStyle = pal.hazard;
        for (let i = 0; i < 4; i++) {
          // two small teeth per tile
          const a = i, len = 3 - Math.abs(1.5 - i) * 0 ;
          for (let k = 0; k < 2; k++) {
            const o = k * 4;
            const h = [1, 2, 3, 2][i];
            if (v === T.SPIKE_U) x.fillRect(px + o + i, py + 8 - h * 1.33 | 0, 1, Math.ceil(h * 1.33));
            if (v === T.SPIKE_D) x.fillRect(px + o + i, py, 1, Math.ceil(h * 1.33));
            if (v === T.SPIKE_L) x.fillRect(px + 8 - Math.ceil(h * 1.33), py + o + i, Math.ceil(h * 1.33), 1);
            if (v === T.SPIKE_R) x.fillRect(px, py + o + i, Math.ceil(h * 1.33), 1);
            void a; void len;
          }
        }
      } else if (v === T.HAZARD) {
        x.fillStyle = hexA(pal.hazard, 0.5); x.fillRect(px + 1, py + 1, 6, 6);
        x.fillStyle = pal.hazard;
        for (let i = 1; i < 7; i += 2) { x.fillRect(px + i, py + 1 + ((i * 3) % 5), 1, 1); x.fillRect(px + 1 + ((i * 5) % 6), py + i, 1, 1); }
      }
    }
    // ghost segments
    for (const d of room.displays) {
      d.cells.forEach((cell) => drawCell(x, d, cell, hexA(pal.lit, 0.075)));
      if (d.icon) drawIcon(x, d, pal);
    }
    // decorative text
    for (const tx of room.text || []) drawText(x, tx.s, tx.x * TILE + (tx.ox || 0), tx.y * TILE + (tx.oy || 0), hexA(pal.edge, tx.a ?? 0.6));
    return c;
  }

  function drawCell(x, d, [cx, cy, cw, ch], color) {
    const px = cx * TILE, py = cy * TILE, w = cw * TILE, h = ch * TILE;
    x.fillStyle = color;
    if (d.t === 'bits') { x.fillRect(px + 1, py + 1, w - 2, h - 2); return; }
    x.beginPath();
    if (cw >= ch) { // horizontal bar with pointed ends
      x.moveTo(px - 1, py + h / 2); x.lineTo(px + 2, py); x.lineTo(px + w - 2, py); x.lineTo(px + w + 1, py + h / 2);
      x.lineTo(px + w - 2, py + h); x.lineTo(px + 2, py + h);
    } else {
      x.moveTo(px + w / 2, py - 1); x.lineTo(px + w, py + 2); x.lineTo(px + w, py + h - 2); x.lineTo(px + w / 2, py + h + 1);
      x.lineTo(px, py + h - 2); x.lineTo(px, py + 2);
    }
    x.closePath(); x.fill();
  }

  function drawIcon(x, d, pal) {
    const [cx, cy] = d.cells[0];
    const px = d.x * TILE - 10, py = d.y * TILE;
    x.fillStyle = hexA(pal.edge, 0.8);
    if (d.icon === 'speaker') {
      x.fillRect(px, py + 2, 2, 3); x.fillRect(px + 2, py + 1, 1, 5); x.fillRect(px + 3, py, 1, 7);
      x.fillRect(px + 5, py + 2, 1, 3); x.fillRect(px + 7, py + 1, 1, 5);
    }
    void cx; void cy;
  }

  R.invalidate = () => { staticRoom = null; };

  R.draw = function (g, ui) {
    const room = g.room, pal = PALETTES[room.region] || PALETTES.boot;
    if (staticRoom !== room) {
      staticLayer = buildStatic(room, pal); staticRoom = room;
      R.particles.length = 0; R.trail.length = 0;
      R.seg = new Map();
    }
    const x = lc;
    x.drawImage(staticLayer, 0, 0);

    // displays (lit segments with phosphor afterglow + light-up flash)
    for (let di = 0; di < room.displays.length; di++) {
      const d = room.displays[di];
      let st = R.seg.get(d);
      if (!st) { st = d.cells.map((_, i) => (d.lit & (1 << i) ? 1 : 0)); R.seg.set(d, st); }
      for (let i = 0; i < d.cells.length; i++) {
        const on = !!(d.lit & (1 << i));
        if (on) {
          if (st[i] < 1) { st[i] = 1.6; if (ui.onSegOn) ui.onSegOn(d, i); }
          else if (st[i] > 1) st[i] = Math.max(1, st[i] - 0.08);
        } else st[i] = Math.max(0, st[i] - 0.12);
        const b = Math.min(st[i], 1);
        if (b <= 0) continue;
        drawCell(x, d, d.cells[i], hexA(pal.lit, 0.25 + 0.75 * b));
        if (st[i] > 1 && R.opts.flashes) drawCell(x, d, d.cells[i], `rgba(255,255,255,${(st[i] - 1) * 0.8})`);
        if (on && d.t !== 'bits') { // inner highlight line
          const [cx, cy, cw, ch] = d.cells[i];
          x.fillStyle = 'rgba(255,255,255,0.35)';
          if (cw >= ch) x.fillRect(cx * TILE + 2, cy * TILE + 3, cw * TILE - 4, 1);
          else x.fillRect(cx * TILE + 3, cy * TILE + 2, 1, ch * TILE - 4);
        }
      }
    }

    // items
    const t = performance.now() / 1000;
    for (const it of room.items) {
      if (it.kind === 'point' && !g.points.has(it.key)) {
        const bob = Math.round(Math.sin(t * 3 + it.x) * 1.5);
        x.fillStyle = hexA('#ffffff', 0.25); x.fillRect(it.x * TILE + 1, it.y * TILE + 1 + bob, 6, 6);
        x.fillStyle = '#ffffff'; x.fillRect(it.x * TILE + 2, it.y * TILE + 2 + bob, 4, 4);
      } else if (it.kind === 'slot') {
        const on = Math.sin(t * 4 + it.id) > 0;
        x.fillStyle = hexA(pal.lit, on ? 0.6 : 0.25);
        x.fillRect(it.x * TILE + 1, it.y * TILE + 1, 6, 6);
        x.fillStyle = pal.bg0; x.fillRect(it.x * TILE + 2, it.y * TILE + 2, 4, 4);
      }
    }

    // player
    const p = g.p;
    const px = p.x / SUB, py = p.y / SUB;
    if (!p.dead) {
      R.trail.push([px, py]); if (R.trail.length > 6) R.trail.shift();
      R.trail.forEach(([tx, ty], i) => {
        x.fillStyle = `rgba(255,255,255,${0.04 * (i + 1)})`;
        x.fillRect(Math.round(tx), Math.round(ty), 6, 6);
      });
      const sq = ui.squash || 0; // >0 = squashed (wide), <0 = stretched (tall)
      const w = Math.round(6 + sq * 2), h = Math.round(6 - sq * 2);
      const dx = Math.round(px - (w - 6) / 2), dy = Math.round(py + (6 - h));
      x.fillStyle = '#ffffff';
      x.fillRect(dx, dy, w, h);
      x.fillStyle = hexA(pal.lit, 0.9);
      x.fillRect(dx, dy + h - 1, w, 1);
      // eye-ish glint facing direction
      x.fillStyle = pal.bg0;
      x.fillRect(dx + (p.face > 0 ? w - 2 : 1), dy + 1, 1, 2);
    } else R.trail.length = 0;

    // particles
    for (let i = R.particles.length - 1; i >= 0; i--) {
      const q = R.particles[i];
      q.x += q.vx; q.y += q.vy; q.vy += q.g; q.life--;
      if (q.life <= 0) { R.particles.splice(i, 1); continue; }
      x.fillStyle = q.c; x.globalAlpha = Math.min(1, q.life / 20);
      x.fillRect(Math.round(q.x), Math.round(q.y), q.s, q.s);
    }
    x.globalAlpha = 1;

    if (ui.overlay) ui.overlay(x, pal);

    // ---- composite to screen
    sc.setTransform(1, 0, 0, 1, 0, 0);
    sc.fillStyle = '#000'; sc.fillRect(0, 0, canvas.width, canvas.height);
    let sx = 0, sy = 0;
    if (R.shake > 0.05 && R.opts.shake) { sx = (Math.random() - 0.5) * R.shake * R.scale; sy = (Math.random() - 0.5) * R.shake * R.scale; }
    R.shake *= 0.85;
    const s = R.scale, ox = R.ox + sx, oy = R.oy + sy;
    sc.imageSmoothingEnabled = false;
    sc.drawImage(low, ox, oy, W * s, H * s);
    if (R.opts.glow) {
      g1c.clearRect(0, 0, g1.width, g1.height); g1c.imageSmoothingEnabled = true;
      g1c.drawImage(low, 0, 0, g1.width, g1.height);
      g2c.clearRect(0, 0, g2.width, g2.height); g2c.imageSmoothingEnabled = true;
      g2c.drawImage(g1, 0, 0, g2.width, g2.height);
      sc.imageSmoothingEnabled = true;
      sc.globalCompositeOperation = 'lighter';
      sc.globalAlpha = 0.35; sc.drawImage(g1, ox, oy, W * s, H * s);
      sc.globalAlpha = 0.45; sc.drawImage(g2, ox, oy, W * s, H * s);
      sc.globalAlpha = 1; sc.globalCompositeOperation = 'source-over';
    }
    if (s >= 3) {
      if (!mesh || meshScale !== s) {
        mesh = document.createElement('canvas'); mesh.width = s; mesh.height = s; meshScale = s;
        const m = mesh.getContext('2d'); m.fillStyle = 'rgba(0,0,0,0.28)';
        m.fillRect(0, s - 1, s, 1); m.fillRect(s - 1, 0, 1, s);
        R.meshPat = sc.createPattern(mesh, 'repeat');
      }
      sc.save(); sc.translate(ox, oy); sc.fillStyle = R.meshPat; sc.fillRect(0, 0, W * s, H * s); sc.restore();
    }
    // vignette
    const vg = sc.createRadialGradient(ox + W * s / 2, oy + H * s / 2, H * s * 0.35, ox + W * s / 2, oy + H * s / 2, W * s * 0.62);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    sc.fillStyle = vg; sc.fillRect(ox, oy, W * s, H * s);
    if (R.flash > 0.01 && R.opts.flashes) { sc.fillStyle = `rgba(255,255,255,${R.flash * 0.25})`; sc.fillRect(ox, oy, W * s, H * s); }
    R.flash *= 0.8;
  };

  R.burst = function (x, y, color, n, speed = 1.2, life = 40) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (0.3 + Math.random()) * speed;
      R.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.5, g: 0.04, life: life * (0.5 + Math.random() * 0.5), c: color, s: Math.random() < 0.3 ? 2 : 1 });
    }
  };
  R.dust = function (x, y, color) {
    for (let i = 0; i < 5; i++) R.particles.push({ x: x + Math.random() * 6, y, vx: (Math.random() - 0.5) * 0.8, vy: -Math.random() * 0.4, g: 0.01, life: 18, c: color, s: 1 });
  };

  // small seven-segment number for UI (each digit 4x7 px)
  R.segNum = function (x, s, px, py, color, dim) {
    const MASK = [63, 6, 91, 79, 102, 109, 125, 7, 127, 111];
    s = String(s);
    for (let i = 0; i < s.length; i++) {
      const ch = s[i], ox = px + i * 5;
      if (ch === ':' || ch === '.') { x.fillStyle = color; if (ch === ':') { x.fillRect(ox + 1, py + 2, 1, 1); x.fillRect(ox + 1, py + 4, 1, 1); } else x.fillRect(ox + 1, py + 6, 1, 1); continue; }
      const m = MASK[+ch] ?? 64;
      const segs = [[1, 0, 2, 1], [3, 1, 1, 2], [3, 4, 1, 2], [1, 6, 2, 1], [0, 4, 1, 2], [0, 1, 1, 2], [1, 3, 2, 1]];
      segs.forEach(([a, b, w, h], k) => {
        x.fillStyle = m & (1 << k) ? color : dim;
        if (dim || m & (1 << k)) x.fillRect(ox + a, py + b, w, h);
      });
    }
  };
  R.text = (s, px, py, color) => drawText(lc, s, px, py, color);
  R.textWidth = textWidth;
  R.hexA = hexA;
  return R;
}
