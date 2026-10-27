// v3 canonical route from a new save (language starts as English): every wing, every slot (1% and 10% are
// nudges), all six stray points. Language changes are menu actions ('lang:xx') except in LANGUAGE (l1), where
// the globe switches do it ('event:lang').
export const ROUTE = [
  // minute one: the 1% slot is right there
  'at:3,12', 'at:5,9', 'event:slot/1',
  // TALLY: button gate, death gate; the cup; 1 + bar = 7; carry the second bar home; the 10% slot
  'at:2,20', 't1', 'at:34,19', 'reg.t1:1', 'deaths:1', 't2',
  'at:11,8', 'reg.t2:4', 'at:17,11', 'reg.t2:5', 'at:23,11', 'at:36,2', 't3',
  'event:pickup', 'at:27,5', 'event:socket', 'at:12,5', 'at:2,3', 't4',
  'event:pickup', 'at:26,20', 'jumps:1', 't1', 'hall', 'event:socket', 'at:3,12', 'at:5,9', 'at:12,9', 'event:slot/2',
  // LEXICON: through PRESS's west door; B's second letter in EN, a globe to ZH for A's first letter
  'at:2,9', 'at:3,12', 'at:2,20', 't1', 't2', 'at:2,10', 'l1', 'at:19,20', 'event:lang', 'at:10,3', 'l2',
  // LETTERS: the bridge is as long as EXIT -> German (AUSGANG, 7); INTERPRETER: DE, then ZH for UP, then DE for X
  'lang:de', 'l3', 'at:33,20', 'lang:zh-TW', 'at:16,7', 'lang:de', 'event:point', 'at:37,7', 'o2',
  // REWIRE: the idle floor (stand still: fall through a stray point), the switch, east over the zones to BELOW
  'at:5,7', 'event:point', 'at:34,7', 'sw.o2:1', 'at:36,7', 'o1', 'at:22,7', 'at:37,7', 'o3',
  // COUNT THE HOPS: over the zones, hop until the bridge is full, up the ladder into CLOCKWORK
  'at:20,7', 'jumps:12/13', 'at:37,7', 'c1',
  // CLOCKWORK: clock gate, stand still (point); the dial: DIAL wants {1,4,7}, FAR DIAL {0,1,7}, and the gold digit
  // in the hall (dial + 3) wants {0,1,7} -> 7 is the one number that works in all three rooms
  'at:3,20', 'at:37,20', 'c2', 'at:12,3', 'at:14,3', 'idle:1', 'event:point', 'at:32,19', 'c3',
  'at:29,9', 'reg.dial:7', 'reg.dial:7@19,9', 'c4', 'at:37,9', 'at:9,9', 'c1', 'hall',
  // the support beams, PANEL, burn-in (the burned-in language code: point), the status bar, the long way home
  'at:36,11', 'sw.beams:1', 'p1', 'at:3,20', 'at:3,11', 'lang:zh-TW', 'at:34,11', 'p2', 'bright:9', 'event:point', 'hud:bottom',
  'at:35,5', 'p3', 'at:20,15', 'c4', 'c1', 'hall',
  // the hall's burn-in ghost (point: brightness 9), and the burn-in rung up through the hatch to the upper right
  'at:17,20', 'event:point', 'at:37,20', 'bright:9', 'event:point', 'at:36,11',
  // the dim bar wants it dark, then the 100% slot
  'bright:0', 'at:22,11', 'at:18,9', 'event:slot/3',
];
