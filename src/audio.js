// WebAudio: synthesized sfx and a small procedural chiptune sequencer.
let ac = null, master, musicBus, sfxBus, noiseBuf, comp;
let musicVol = 7, sfxVol = 7;
const S = { song: null, nextT: 0, stepI: 0, timer: 0 };

const gainFor = (v) => (v / 9) ** 2;

export function initAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
  master = ac.createGain(); master.gain.value = 0.9;
  musicBus = ac.createGain(); sfxBus = ac.createGain();
  musicBus.connect(comp); sfxBus.connect(comp); comp.connect(master); master.connect(ac.destination);
  setVolumes(musicVol, sfxVol);
  noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const d = noiseBuf.getChannelData(0); let s = 1;
  for (let i = 0; i < d.length; i++) { s = (s * 16807) % 2147483647; d[i] = (s / 2147483647) * 2 - 1; }
  S.timer = setInterval(schedule, 25);
}

export function setVolumes(m, s) {
  musicVol = m; sfxVol = s;
  if (!ac) return;
  musicBus.gain.setTargetAtTime(gainFor(m) * 0.55, ac.currentTime, 0.05);
  sfxBus.gain.setTargetAtTime(gainFor(s) * 0.8, ac.currentTime, 0.02);
}

function env(g, t, a, peak, d, sus = 0) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus), t + a + d);
}

function tone(type, f0, f1, dur, vol, bus = sfxBus, t = ac.currentTime, a = 0.004) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, a, vol, dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + a + dur + 0.02);
  return o;
}

function noise(dur, vol, filt, fq, bus = sfxBus, t = ac.currentTime, q = 1, f1) {
  const src = ac.createBufferSource(); src.buffer = noiseBuf;
  const f = ac.createBiquadFilter(); f.type = filt; f.frequency.setValueAtTime(fq, t); f.Q.value = q;
  if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ac.createGain(); env(g, t, 0.002, vol, dur);
  src.connect(f); f.connect(g); g.connect(bus);
  src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
}

let lastTick = 0;
export const sfx = {
  jump() { if (!ac) return; tone('square', 330, 760, 0.07, 0.12); tone('sine', 660, 1320, 0.05, 0.06); },
  land(v) { if (!ac) return; const k = Math.min(1, v / 512); noise(0.06, 0.08 + 0.2 * k, 'lowpass', 500 + 900 * k); },
  die() {
    if (!ac) return; const t = ac.currentTime;
    tone('square', 880, 55, 0.28, 0.16); tone('sawtooth', 440, 30, 0.3, 0.08);
    noise(0.25, 0.22, 'bandpass', 2400, sfxBus, t, 0.8, 300);
  },
  seg() {
    if (!ac) return; const t = ac.currentTime; if (t - lastTick < 0.03) return; lastTick = t;
    tone('sine', 2100 + Math.random() * 300, 2100, 0.025, 0.035);
  },
  room() { if (!ac) return; noise(0.22, 0.05, 'bandpass', 600, sfxBus, ac.currentTime, 2, 2400); },
  point() {
    if (!ac) return; const t = ac.currentTime;
    [0, 4, 7, 12, 16].forEach((n, i) => tone('square', 523.25 * 2 ** (n / 12), 523.25 * 2 ** (n / 12), 0.12, 0.07, sfxBus, t + i * 0.06));
  },
  bonk() { if (!ac) return; tone('triangle', 180, 90, 0.05, 0.12); },
  move() { if (!ac) return; tone('square', 1200, 1200, 0.02, 0.05); },
  ok() { if (!ac) return; tone('square', 880, 1760, 0.06, 0.07); },
  respawn() { if (!ac) return; tone('sine', 300, 900, 0.12, 0.06); },
  slot() {
    if (!ac) return; const t = ac.currentTime;
    [0, 7, 12, 19, 24].forEach((n, i) => tone('triangle', 261.6 * 2 ** (n / 12), 261.6 * 2 ** (n / 12), 0.8, 0.1, sfxBus, t + i * 0.12, 0.01));
  },
};

// ------------------------------------------------------------- music ---
const NOTE = (n) => 440 * 2 ** ((n - 69) / 12);
// chord = root midi note + quality
const MIN = [0, 3, 7, 10], MAJ = [0, 4, 7, 11], SUS = [0, 5, 7, 10];
export const SONGS = {
  title:  { bpm: 92,  chords: [[57, MIN], [53, MAJ], [48, MAJ], [55, SUS]], drums: 0, arp: 'slow', pad: 1 },
  boot:   { bpm: 104, chords: [[57, MIN], [53, MAJ], [48, MAJ], [55, MAJ]], drums: 1, arp: 'up', pad: 1 },
  tally:  { bpm: 126, chords: [[50, MIN], [58, MAJ], [53, MAJ], [48, MAJ]], drums: 2, arp: 'updown', pad: 0.7 },
  clock:  { bpm: 120, chords: [[52, MIN], [48, MAJ], [55, MAJ], [50, MAJ]], drums: 3, arp: 'tick', pad: 0.8 },
  coord:  { bpm: 136, chords: [[54, MIN], [50, MAJ], [57, MAJ], [52, SUS]], drums: 2, arp: 'skip', pad: 0.6 },
  over:   { bpm: 150, chords: [[48, MIN], [56, MAJ], [51, MAJ], [58, MAJ]], drums: 4, arp: 'updown', pad: 0.7 },
  master: { bpm: 80,  chords: [[53, MAJ], [57, MIN], [50, MIN], [55, SUS]], drums: 0, arp: 'slow', pad: 1.2 },
};

export function playSong(name) {
  if (S.song === SONGS[name]) return;
  S.song = SONGS[name] || null; S.stepI = 0;
  if (ac) S.nextT = ac.currentTime + 0.1;
}

function schedule() {
  if (!ac || !S.song || musicVol === 0) { if (ac) S.nextT = ac.currentTime + 0.05; return; }
  const song = S.song, sp16 = 60 / song.bpm / 4;
  if (S.nextT < ac.currentTime) S.nextT = ac.currentTime + 0.02;
  while (S.nextT < ac.currentTime + 0.12) { playStep(song, S.stepI, S.nextT, sp16); S.stepI++; S.nextT += sp16; }
}

function playStep(song, i, t, sp16) {
  const bar = Math.floor(i / 16) % song.chords.length, s = i % 16;
  const [root, q] = song.chords[bar];
  const tones = [...q.map((x) => root + x), ...q.map((x) => root + 12 + x)];
  // pad on bar start
  if (s === 0 && song.pad) {
    for (const n of [root, root + q[1], root + q[2]]) {
      for (const det of [-6, 6]) {
        const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
        o.type = 'sawtooth'; o.frequency.value = NOTE(n); o.detune.value = det;
        f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 0.5;
        const dur = sp16 * 16;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.022 * song.pad, t + dur * 0.3);
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        o.connect(f); f.connect(g); g.connect(musicBus); o.start(t); o.stop(t + dur + 0.05);
      }
    }
  }
  // bass
  if (song.drums >= 1 && (s % 4 === 2 || (song.drums >= 3 && s % 4 === 0))) tone('triangle', NOTE(root - 12), NOTE(root - 12), sp16 * 1.6, 0.16, musicBus, t);
  else if (song.drums === 0 && s === 0) tone('triangle', NOTE(root - 12), NOTE(root - 12), sp16 * 12, 0.12, musicBus, t, 0.05);
  // arp
  let n = null;
  switch (song.arp) {
    case 'slow': if (s % 4 === 0) n = tones[(s / 4 + bar) % tones.length] + 12; break;
    case 'up': if (s % 2 === 0) n = tones[(s / 2) % tones.length] + 12; break;
    case 'updown': { const seq = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 2, 3]; n = tones[seq[s] % tones.length] + 12; break; }
    case 'tick': if (s % 2 === 0 || s === 15) n = tones[[0, 2, 4, 1, 3, 5, 2, 6][(s >> 1) % 8]] + 12; break;
    case 'skip': if ([0, 3, 6, 8, 10, 13].includes(s)) n = tones[(s * 3) % tones.length] + 12; break;
  }
  if (n !== null) {
    tone('square', NOTE(n), NOTE(n), sp16 * 0.9, 0.035, musicBus, t);
    tone('square', NOTE(n), NOTE(n), sp16 * 0.9, 0.015, musicBus, t + sp16 * 3); // echo
  }
  // drums
  const d = song.drums;
  if (d >= 2 && s % 4 === 0) { tone('sine', 150, 40, 0.14, 0.32, musicBus, t, 0.002); }
  if (d >= 1 && s % 4 === 2) noise(0.03, 0.05, 'highpass', 7000, musicBus, t);
  if (d >= 3 && s % 2 === 1) noise(0.015, 0.025, 'highpass', 9000, musicBus, t);
  if (d >= 2 && (s === 4 || s === 12)) noise(0.12, 0.09, 'bandpass', 1800, musicBus, t, 0.7);
  if (d >= 4 && s === 14) noise(0.08, 0.06, 'bandpass', 2600, musicBus, t, 0.7);
}
