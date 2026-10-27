// v3 canonical route from a new save (language starts as English): every wing, every slot (1% and 10% are
// nudges), all six stray points. Language changes are menu actions ('lang:xx') except in LANGUAGE (l1), where
// the globe switches do it ('event:lang').
export const ROUTE = [
  // minute one: the 1% slot is right there
  'at:3,12', 'at:5,9', 'event:slot/1',
  // TALLY: button gate, death gate; the cup; 1 + bar = 7; carry the second bar home; the 10% slot
  'at:2,20', 't1', 'at:34,19', 'reg.t1:1', 'deaths:1', 't2',
  'at:11,8', 'reg.t2:4', 'at:17,11', 'reg.t2:5', 'at:23,11', 'at:36,2', 't3',
  'event:pickup', 'at:27,5', 'event:socket',
  // round 2: LOOSE's false wall (a one-tile slot over the far side's step) hides CROSSTALK: its gold-striped button turns the DIAL (2 + 5 = 7: the gate opens)
  'at:12,5', 'at:3,11', 's1', 'reg.dial:2', 'event:point', 't3', 'at:3,11', 'at:6,5', 'at:12,5', 'at:2,3', 't4',
  'event:pickup', 'at:26,20', 'jumps:1', 't1', 'hall', 'event:socket', 'at:3,12', 'at:5,9', 'at:12,9', 'event:slot/2',
  // LEXICON: through PRESS's west door; B's second letter in EN, a globe to ZH for A's first letter
  'at:2,9', 'at:3,12', 'at:2,20', 't1', 'deaths:4', 't2', 'at:2,10', 'l1', 'at:19,20', 'event:lang', 'at:10,3', 'l2',
  // round 5: FALL UP, west of LETTERS: pause 1 s so the trapdoor digit reads 1, fall through, come out of the ceiling
  'at:2,14', 'fu', 'pause:1', 'at:25,14', 'event:point', 'l2',
  // LETTERS: the bridge is as long as EXIT -> German (AUSGANG, 7); INTERPRETER: DE, then ZH for UP, then DE for X
  'lang:de', 'l3', 'at:33,20', 'lang:zh-TW', 'at:16,7', 'lang:de', 'event:point', 'at:37,7', 'o2',
  // REWIRE: the idle floor (stand still: fall through a stray point), the switch, east over the zones to BELOW
  'at:5,7', 'event:point', 'at:34,7', 'sw.o2:1', 'at:36,7', 'o1', 'at:22,7', 'at:37,7', 'o3',
  // COUNT THE HOPS: over the zones, hop until the bridge is full, up the ladder into CLOCKWORK
  'at:20,7', 'jumps:12/13', 'at:37,7', 'c1',
  // CLOCKWORK: clock gate, stand still (point); the dial: DIAL wants {1,4,7}, FAR DIAL {0,1,7}, and the gold digit
  // in the hall (dial + 3) wants {0,1,7} -> 7 is the one number that works in all three rooms
  'at:3,20', 'at:37,20', 'c2', 'at:12,3', 'at:14,3', 'idle:1', 'event:point',
  // round 2: BABEL CLOCK (the language sign speaks every language in turn: letter one, wait between, letter two);
  // then down STILL's floor hole into ATLAS: the map of where you have been, and CROSSTALK's block is the last step
  'c5', 'at:9,9', 'at:19,9', 'at:28,9', 'event:point',
  // round 3: INTERMISSION, east of BABEL CLOCK: its gates read the seconds spent in the pause menu -> 1 + 13 = 14 s
  'at:37,20', 'i1', 'pause:13', 'event:point', 'c5', 'at:3,20', 'c2', 'o4', 'at:9,17', 'at:4,17', 'at:4,14', 'at:4,11',
  'event:point',
  // round 2: TURN IT DOWN, east of ATLAS: the music volume is a wall (jump it at <=3) and a pillar (stand on it at 9)
  'at:37,20', 'vol:2', 'y1', 'at:22,20', 'vol:9', 'event:point',
  // round 3: LOOP, down the far corner: its sides meet, every lap is coming in again, one step appears per lap
  'at:35,20', 'lp', 'visits:7', 'at:31,17', 'at:36,14', 'at:31,11', 'at:36,8', 'at:31,5', 'at:36,2', 'y1',
  'vol:2', 'at:2,20', 'o4', 'vol:6',
  'at:37,7', 'at:2,3', 'o3', 'at:20,7', 'at:37,7', 'c1', 'at:37,20', 'c2',
  // back across STILL the only way there is: over the top and stand still on the digit (ATLAS's drop is one way)
  'at:12,3', 'at:14,3', 'idle:1', 'at:32,19', 'c3',
  // round 2: WALL CLOCK, east of DIAL: the route's clock reads 00:00 (all middles dark), so the tunnel is open
  'at:32,11', 'at:37,9', 'x2', 'event:point', 'at:3,20', 'c3', 'at:32,11',
  'at:29,9', 'reg.dial:7', 'reg.dial:7@19,9', 'c4', 'at:37,9', 'at:9,9', 'c1', 'time:2', 'at:5,11', 'hall',
  // the support beams, PANEL, burn-in (the burned-in language code: point), the status bar, the long way home
  'at:36,11', 'sw.beams:1', 'p1', 'at:3,20', 'at:3,11', 'lang:zh-TW', 'at:34,11', 'p2', 'bright:9', 'event:point',
  // round 2: west along BURN-IN's floor to DOWN: its name is the bridge for six seconds (too short in Chinese)
  'lang:de', 'at:2,20', 'p4', 'at:34,14', 'event:point', 'at:2,20',
  // round 2: NO SIGNAL, off DOWN's landing: the solid HUD is in the way wherever it sits -> Settings: HUD OFF
  'x1', 'hud:off', 'at:10,20', 'event:point', 'at:30,20', 'at:10,20',
  // round 2: ENCORE, west off NO SIGNAL's shaft: volume <=3, EN/KO/RU, dial 7 (+4 = 1), and stand still -- then down
  // into CROSSTALK and home through LOOSE's false wall
  'e1', 'vol:2', 'lang:en', 'at:29,12', 'at:26,9', 'at:17,7', 'at:4,14', 'idle:1', 'event:point', 's1', 'hud:top', 'vol:6',
  't3', 'at:13,17', 'at:3,11', 'at:6,5', 'at:12,5', 'at:2,3', 't4', 't1', 'hall',
  'bright:9', 'at:36,11', 'sw.beams:1', 'p1', 'at:3,20', 'at:3,11', 'lang:zh-TW', 'at:34,11', 'p2', 'bright:9', 'hud:bottom',
  'at:35,5', 'p3',
  // round 2: ATTRACT MODE, east of STATUS BAR: stand still on the trapdoor and fall through the sign while it
  // shows the NEXT language -- in JA it shows KO as you fall (the only letter K's centre is open)
  // round 2: NEGATIVE first (east along ATTRACT MODE's corridor): the map of rooms you have NOT been to is the solid
  // part; WALL CLOCK was visited on the way through CLOCKWORK, so the lid over the stray point is gone
  'a1', 'n1', 'at:20,20', 'at:37,17', 'at:37,11', 'at:37,8', 'event:point', 'at:2,17', 'at:2,5', 'a1',
  'lang:ja', 'at:19,6', 'idle:1', 'event:point', 'c3', 'reg.dial:7', 'reg.dial:7@19,9', 'c4', 'c1', 'hall',
  // the hall's burn-in ghost (point: brightness 9), and the burn-in rung up through the hatch to the upper right
  'at:17,20', 'event:point', 'at:37,20', 'bright:9', 'at:36,11',
  // the dim bar wants it dark, then the 100% slot
  'bright:0', 'at:22,11', 'at:18,9', 'event:slot/3',
];
