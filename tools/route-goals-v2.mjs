// v2 canonical route: every wing, every slot (1% and 10% are nudges), all stray points.
export const ROUTE = [
  // minute one: the 1% slot is right there
  'at:3,12', 'at:5,9', 'event:slot/1',
  // TALLY: button gate, death gate; the cup; 1 + bar = 7; carry the second bar home
  'at:2,20', 't1', 'at:34,19', 'reg.t1:1', 'deaths:1', 't2',
  'at:11,8', 'reg.t2:4', 'at:17,11', 'reg.t2:5', 'at:23,11', 'at:36,2', 't3',
  'event:pickup', 'at:27,5', 'event:socket', 'at:12,5', 'at:2,3', 't4',
  'event:pickup', 'at:26,20', 'jumps:1', 't1', 'hall', 'event:socket', 'at:3,12', 'at:5,9', 'at:12,9', 'event:slot/2',
  // COORDINATES: down the hole, position bridges, the switch, up into CLOCKWORK
  'at:2,9', 'at:3,12', 'at:2,20', 'at:26,20', 'o1', 'at:22,7', 'at:3,7', 'o2', 'at:34,7', 'sw.o2:1', 'event:point',
  'at:36,7', 'o1', 'at:22,7', 'at:37,7', 'o3', 'at:17,7', 'sw.o3:1', 'at:37,7', 'c1',
  // CLOCKWORK: clock gate, stand still (point), the dial, the timed dial, the trapdoors home
  'at:3,20', 'at:37,20', 'c2', 'at:12,3', 'at:14,3', 'idle:1', 'event:point', 'at:32,19', 'c3',
  'at:30,9', 'c4', 'at:37,9', 'at:9,9', 'c1', 'hall',
  // the support beams, PANEL, burn-in (point), the status bar, the long way home
  'at:36,11', 'sw.beams:1', 'p1', 'at:3,20', 'at:3,11', 'at:34,11', 'p2', 'bright:9', 'event:point', 'hud:bottom',
  'at:35,5', 'p3', 'at:20,15', 'c4', 'c1', 'hall',
  // the hall's burn-in ghost (point: brightness 9), then once more around CLOCKWORK to the upper right
  'at:37,20', 'bright:9', 'event:point', 'c1', 'at:37,20', 'c2', 'at:12,3', 'at:14,3', 'idle:1', 'at:32,19', 'c3',
  'at:30,9', 'c4', 'at:37,9', 'at:9,9', 'c1', 'hall',
  // the dim bar wants it dark, then the 100% slot
  'bright:0', 'at:36,11', 'at:22,11', 'at:18,9', 'event:slot/3',
];
