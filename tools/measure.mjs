import { game, emptyMap, run } from '../test/helpers.mjs';
import { IN, SUB } from '../src/sim.js';
const g = game({ map: emptyMap([[5, 19, 'S']]) });
const y0 = g.p.y; let minY = y0, t = 0, apexT = 0;
for (let i = 0; i < 200; i++) { run(g, IN.JUMP, 1); if (g.p.y < minY) { minY = g.p.y; apexT = i; } }
console.log('held jump height px', (y0 - minY) / SUB, 'apex step', apexT);
const g2 = game({ map: emptyMap([[5, 19, 'S']]) });
run(g2, IN.JUMP, 1); let m = g2.p.y; for (let i = 0; i < 100; i++) { run(g2, 0, 1); m = Math.min(m, g2.p.y); }
console.log('tap jump height px', (y0 - m) / SUB);
const g3 = game({ map: emptyMap([[5, 19, 'S']]) });
run(g3, IN.JUMP | IN.RIGHT, 1); let st = 0;
while (!g3.p.ground || st < 2) { run(g3, IN.JUMP | IN.RIGHT, 1); st++; if (st > 500) break; }
console.log('full running jump distance px', (g3.p.x - (5 * 8 + 1) * SUB) / SUB, 'steps', st);
