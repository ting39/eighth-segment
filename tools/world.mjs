// Which world the tools work on: V2=1 selects the redesign.
const mod = await import(process.env.V2 ? '../src/rooms_v2.js' : '../src/rooms.js');
export const { ROOMS, START_ROOM, ENDINGS } = mod;
