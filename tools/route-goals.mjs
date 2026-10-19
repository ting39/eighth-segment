// The canonical full-clear route (all stray points + true ending), as a sequence of solver goals.
export const ROUTE = [
  'lit', 'corners', 'climb', 'tally1',
  'deaths:7', 'tally2',
  'deaths:1', 'tally3',
  'at:11,8', 'jumps:3', 'at:18,11', 'at:23,11', 'at:36,2',
  'tally4', 'at:32,19', 'jumps:1', 'at:3,19', 'hub',
  // Clockwork: time drop, patience drop (point), back through the return shaft
  'at:7,19', 'clock1', 'at:21,7', 'at:30,19', 'clock2', 'at:19,1', 'at:20,1', 'idle:1', 'event:point', 'at:2,19', 'clock1',
  'at:33,7', 'at:28,7', 'time:4@28,7', 'at:21,7', 'at:2,19', 'hub',
  // Coordinates: position bridge, binary stairs (point)
  'at:2,19', 'coord1', 'at:32,11', 'at:3,11', 'coord2', 'deaths:7/8', 'event:point', 'coord1', 'at:32,11', 'at:37,19', 'hub',
  // The gate (stand still), overflow (hex), volume, master readout
  'at:2,2', 'gate', 'at:9,1', 'at:10,1', 'idle:1', 'at:12,19', 'over1', 'at:29,1', 'jumps:12/16', 'at:20,19', 'over2',
  'vol:7', 'at:36,7', 'master', 'event:slot/3',
];
