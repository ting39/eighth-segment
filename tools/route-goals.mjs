// The canonical full-clear route (all stray points except the real-time hub clock one + true ending),
// as a sequence of solver goals. Re-solve from index N with `node tools/route.mjs --from N`.
export const ROUTE = [
  'lit', 'corners', 'climb', 'notch', 'event:point', 'climb', 'tally1',
  'deaths:7', 'tally2',
  'deaths:1', 'tally3',
  'at:11,8', 'jumps:3', 'at:18,11', 'at:23,11', 'at:36,2',
  'tally4', 'at:32,19',
  // FINE PRINT (secret, through tally4's fake right wall): seconds gate, then deaths ending 1/4/7 (point)
  'fineprint', 'at:24,19', 'deaths:4', 'event:point', 'tally4', 'at:32,19', 'jumps:1', 'at:3,19', 'hub',
  // Clockwork: time drop, patience drop (point)
  'at:7,19', 'clock1', 'at:21,7', 'at:30,19', 'clock2', 'at:19,1', 'at:20,1', 'idle:1', 'event:point',
  // ENCORE (off clock2's lower right): first visit is sealed; leave and come back (point)
  'encore', 'clock2', 'encore', 'event:point',
  // TWO CLOCKS (up from encore) and STILLER (stand still through two floors, point), then back
  'clock4', 'at:9,7', 'jumps:5', 'at:10,7', 'time:7@10,7', 'clock5',
  'at:6,2', 'at:8,2', 'idle:3', 'event:point', 'clock6', 'event:point', 'clock5', 'at:37,2', 'at:2,7', 'clock4',
  'at:28,7', 'time:8@28,7', 'at:20,7', 'time:1@20,7', 'at:9,7', 'encore', 'clock2', 'at:2,19', 'clock1',
  'at:33,7', 'at:28,7', 'time:4@28,7', 'at:21,7', 'at:2,19', 'hub',
  // Coordinates: position bridge, binary stairs (point), then the long way round into the gate
  'at:2,19', 'coord1', 'at:32,11', 'at:3,11', 'coord2', 'deaths:7/8', 'event:point',
  'coord3', 'at:29,6', 'at:3,19', 'coord4', 'coord9', 'event:point', 'coord4', 'at:30,19', 'jumps:4/8', 'at:27,16', 'at:21,13', 'at:15,10', 'at:9,7', 'coord5', 'at:35,5', 'coord6', 'coord7',
  'deaths:1', 'coord8', 'event:point', 'gate',
  // The gate (stand still), overflow (hex), volume, past nine, mixing desk, everything at once, master readout
  'at:9,1', 'at:10,1', 'idle:1', 'at:12,19', 'over1', 'at:29,1', 'jumps:12/16', 'at:20,19', 'sidechannel', 'vol:4', 'event:point', 'over1', 'at:20,19', 'over2',
  'vol:7', 'at:36,7', 'over3', 'deaths:12/16', 'at:30,20', 'over4',
  'at:11,8', 'vol:4', 'at:18,11', 'vol:5', 'at:23,11', 'at:36,2', 'over5', 'deaths:5', 'at:38,7', 'jumps:4',
  'at:10,7', 'master', 'event:slot/3',
];
