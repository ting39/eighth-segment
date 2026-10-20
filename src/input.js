// Keyboard / gamepad / touch → one input mask per sim step, plus menu edges.
import { IN } from './sim.js';

export const DEFAULT_KEYS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  jump: ['KeyZ', 'Space', 'ArrowUp', 'KeyW', 'KeyC', 'KeyK'],
  restart: ['KeyR'],
};

export function createInput() {
  const held = new Set();
  const edges = [];          // menu actions pressed since last poll
  const touch = { left: false, right: false, jump: false };
  let padPrev = {};
  const I = {
    keys: structuredClone(DEFAULT_KEYS),
    lastDevice: 'keyboard',
    capture: null,           // remap callback(code)
    anyKey: false,
  };

  const menuOf = (code) => {
    if (code === 'Escape' || code === 'KeyP') return 'pause';
    if (code === 'Enter' || code === 'NumpadEnter') return 'confirm';
    if (code === 'Backspace') return 'back';
    if (code === 'KeyM') return 'map';
    if ((I.keys.restart || []).includes(code)) return 'restart';
    if (I.keys.left.includes(code)) return 'left';
    if (I.keys.right.includes(code)) return 'right';
    if (code === 'ArrowUp' || code === 'KeyW') return 'up';
    if (code === 'ArrowDown' || code === 'KeyS') return 'down';
    if (I.keys.jump.includes(code)) return 'confirm';
    if (code === 'KeyX') return 'back';
    return null;
  };

  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (I.capture) { e.preventDefault(); const cb = I.capture; I.capture = null; cb(e.code); return; }
    I.lastDevice = 'keyboard'; I.anyKey = true;
    if (!e.repeat) { const m = menuOf(e.code); if (m) edges.push(m); }
    held.add(e.code);
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  });
  addEventListener('keyup', (e) => held.delete(e.code));
  addEventListener('blur', () => held.clear());

  I.mask = function () {
    let m = 0;
    const any = (list) => list.some((k) => held.has(k));
    if (any(I.keys.left) || touch.left || pad.left) m |= IN.LEFT;
    if (any(I.keys.right) || touch.right || pad.right) m |= IN.RIGHT;
    if (any(I.keys.jump) || touch.jump || pad.jump) m |= IN.JUMP;
    return m;
  };

  const pad = { left: false, right: false, jump: false };
  I.pollPad = function () {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (const p of pads) if (p && p.connected) { gp = p; break; }
    if (!gp) { pad.left = pad.right = pad.jump = false; return; }
    const b = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed);
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    const now = {
      left: b(14) || ax < -0.4, right: b(15) || ax > 0.4, up: b(12) || ay < -0.6, down: b(13) || ay > 0.6,
      jump: b(0) || b(1) || b(2) || b(3), pause: b(9) || b(8), back: b(1), map: b(8),
    };
    pad.left = now.left; pad.right = now.right; pad.jump = now.jump;
    for (const k of ['left', 'right', 'up', 'down', 'pause', 'back']) if (now[k] && !padPrev[k]) { edges.push(k); I.lastDevice = 'pad'; I.anyKey = true; }
    if (b(0) && !padPrev.a) { edges.push('confirm'); I.lastDevice = 'pad'; I.anyKey = true; }
    padPrev = { ...now, a: b(0) };
  };

  I.edges = function () { const e = edges.splice(0); return e; };
  I.push = (e) => edges.push(e);
  I.clearHeld = () => { held.clear(); touch.left = touch.right = touch.jump = false; };

  // touch buttons (DOM)
  I.bindTouch = function (root) {
    const btns = root.querySelectorAll('[data-touch]');
    const update = (e) => {
      touch.left = touch.right = touch.jump = false;
      for (const t of e.touches) {
        const el = document.elementFromPoint(t.clientX, t.clientY);
        const k = el && el.closest('[data-touch]') && el.closest('[data-touch]').dataset.touch;
        if (k && k in touch) touch[k] = true;
      }
      btns.forEach((b) => b.classList.toggle('on', !!touch[b.dataset.touch]));
    };
    for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) {
      root.addEventListener(ev, (e) => {
        if (e.target.closest('[data-touch]')) e.preventDefault();
        I.lastDevice = 'touch'; I.anyKey = true;
        if (ev === 'touchstart') {
          const k = e.target.closest('[data-touch]') && e.target.closest('[data-touch]').dataset.touch;
          if (k === 'pause') edges.push('pause');
          if (k === 'jump') edges.push('confirm');
        }
        update(e);
      }, { passive: false });
    }
  };
  return I;
}

export function keyName(code) {
  return code.replace(/^Key/, '').replace(/^Digit/, '').replace('Arrow', '').replace('Space', 'SPACE').toUpperCase();
}
