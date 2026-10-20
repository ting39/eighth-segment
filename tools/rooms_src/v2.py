"""EIGHTH SEGMENT v2 world: the Display Hall and its four wings. Writes src/rooms_v2.js."""
import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from roomgen import Room
ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
OUT = []

def emit(rid, gx, gy, region, name, r, **extra):
    OUT.append(dict(id=rid, gx=gx, gy=gy, region=region, name=name, map=[''.join(row) for row in r.g], **extra))

def segrects(s):
    return [(1,0,s,1),(s+1,1,1,s),(s+1,s+2,1,s),(1,2*s+2,s,1),(0,s+2,1,s),(0,1,1,s),(1,s+1,s,1)]

def carve_cells(r, x, y, s, corners=True):
    for (dx,dy,w,h) in segrects(s): r.rect(x+dx, y+dy, w, h, '.')
    if corners:
        for cx in (x, x+s+1):
            for cy in (y, y+s+1, y+2*s+2): r.put(cx, cy, '.')

def hang(r, x, yd, s=2):
    """housing for a digit hanging from above whose bottom bar d sits in walking row yd"""
    r.rect(x, yd-2*s-2, s+2, 2*s+2, '.')
    return [x, yd-2*s-2]

# ============================================================== THE DISPLAY HALL (0,0)
r = Room('#')
# the Master Readout: 1 0 0 0 0 0 %  (static digits, solid interiors)
digits = [3, 8, 13, 18, 23, 28]
for x in digits: carve_cells(r, x, 1, 2)
r.rect(32, 2, 3, 5, '.')                                          # the % sign: two glowing dots and a slash
for (x, y) in [(34,2),(34,3),(33,4),(32,5),(32,6)]: r.put(x, y, '#')
for x in (7, 12, 17): r.put(x, 7, '.'); r.put(x, 8, '.')          # decimal point slots + the holes under them
r.put(7, 7, 'a'); r.put(12, 7, 'b'); r.put(17, 7, 'c')
# lower hall
r.rect(1, 11, 38, 10, '.')
r.rect(0, 18, 1, 3, '.'); r.rect(39, 18, 1, 3, '.')             # left (TALLY) and right (CLOCKWORK) exits
r.rect(26, 21, 2, 1, '.')                                         # floor hole down to COORDINATES
# left steps up to the corridor under the readout (the 1% slot is right there)
r.rect(1, 9, 14, 2, '.'); r.rect(0, 9, 1, 1, '.')                 # corridor row 9 (+ the TALLY balcony door)
r.rect(4, 10, 4, 1)                                               # corridor floor left part; x1..3 open to climb up
r.rect(13, 10, 2, 1); r.put(15, 9, '#'); r.put(15, 10, '#')
for (x, y, w) in [(5,18,2),(2,15,2),(1,12,2)]: r.rect(x, y, w, 1)
# the socket: a static 1 missing its top bar, right under the 10% slot
carve_cells(r, 7, 10, 4); r.put(7, 10, '#'); r.put(12, 10, '#')
r.rect(8, 11, 4, 4); r.rect(8, 16, 4, 4)                          # solid interiors
# C-ledge under the 100% slot (entered only from the right, past a dim bar)
r.rect(16, 9, 5, 2, '.'); r.rect(13, 10, 8, 3)                   # C-ledge on a solid block (no way up from below)
# the support beams: three static 1s whose top bars would make a bridge
for x in (21, 25, 29):          # hollow frames: with their top bars dark there is no floor up there at all
    carve_cells(r, x, 12, 2)
# upper right (reached from CLOCKWORK's return): ledge, switch, the PANEL shaft
r.rect(21, 9, 18, 3, '.'); r.rect(33, 12, 6, 1); r.rect(39, 9, 1, 3, '.')
r.rect(36, 0, 3, 9, '.')
for y in (9, 6, 3): r.rect(36, y, 3, 1, '-')
r.put(37, 10, 'w')
# a burn-in ledge with a stray point (lower right): only solid at brightness 9
r.put(36, 15, 'o')
r.put(16, 20, 'S'); r.put(5, 9, 'P'); r.put(35, 11, 'P'); r.put(18, 9, 'P'); r.put(37, 20, 'P'); r.put(2, 20, 'P')
disp = {f'R{i}': dict(s=2, val=v, at=[x, 1]) for i, (x, v) in enumerate(zip(digits, [1,0,0,0,0,0]))}
disp['SOCK'] = dict(s=4, val=7, sockets='a', at=[7, 10])
for i, x in enumerate((21, 25, 29)):
    disp[f'BEAM{i}'] = dict(s=2, val=1, src='static', src2='pos', sw='beams', at=[x, 12], wire=[[x+1, 19], [x+1, 20], [36, 20], [36, 12]] if i == 0 else None)
disp['PCT0'] = dict(t='bits', n=1, val=1, at=[32, 2]); disp['PCT1'] = dict(t='bits', n=1, val=1, at=[34, 6])
disp['DIM'] = dict(t='bits', n=1, w=1, h=1, val=1, src='static', dim=True, at=[20, 9])
disp['BURN'] = dict(t='bits', n=1, w=3, val=0, src='static', burn=True, at=[35, 17])
for k in list(disp):
    if disp[k].get('wire') is None: disp[k].pop('wire', None)
emit('hall', 0, 0, 'boot', 'THE DISPLAY HALL', r, displays=disp,
     parts=[dict(kind='switch', x=37, y=10, sw='beams')],
     triggers=dict(a=dict(kind='slot', id=1), b=dict(kind='slot', id=2), c=dict(kind='slot', id=3)),
     always=True)

# ============================================================== TALLY
# t1 (-1,0): a button and a spike, each wired to a gate. Above: the balcony home (from t4).
r = Room('#')
r.rect(28, 13, 11, 8, '.'); r.rect(39, 18, 1, 3, '.')
r.rect(6, 20, 22, 1, '.'); r.rect(1, 13, 5, 8, '.'); r.rect(0, 18, 1, 3, '.')
gA = hang(r, 22, 20); gB = hang(r, 12, 20)
r.put(29, 20, '^')
r.rect(30, 0, 4, 9, '.'); r.rect(30, 9, 10, 1, '.')             # balcony: from t4 down to the hall's corridor
r.put(36, 20, 'P'); r.put(3, 20, 'P'); r.put(35, 9, 'P')
emit('t1', -1, 0, 'tally', 'TALLY', r,
     parts=[dict(kind='button', x=33, y=20, w=2, reg='t1')],
     displays=dict(A=dict(s=2, src='reg:t1', at=gA, wire=[[34, 19], [34, 15], [26, 15]], hint='button'),
                   B=dict(s=2, src='deaths', at=gB, wire=[[29, 19], [29, 14], [16, 14]], hint='deaths')))

# t2 (-2,0): PRESS -- a cup that opens when its own button is pressed
src = open(os.path.join(ROOT, 'tools/rooms_src/tally3.py')).read()
ns = {'__file__': os.path.join(ROOT, 'tools/rooms_src/tally3.py')}
exec(src.replace('print(r.js())', ''), ns)
r = ns['r']
for y in range(22):
    for x in range(40):
        if r.g[y][x] == 'A': r.g[y][x] = '.'
r.put(18, 11, '.')
emit('t2', -2, 0, 'tally', 'PRESS', r,
     parts=[dict(kind='button', x=12, y=8, reg='t2'), dict(kind='button', x=18, y=11, reg='t2')],
     displays=dict(A=dict(s=3, src='reg:t2', at=[16, 8], wire=[[12, 7], [12, 5], [18, 5]])))

# t3 (-2,-1): LOOSE -- 1 + a loose bar = 7: the top bar becomes a bridge
r = Room('#')
r.rect(34, 21, 4, 1, '.'); r.rect(25, 7, 14, 14, '.')            # near side (entry from below)
r.rect(25, 7, 7, 0)
for (x, y, w) in [(34,18,3),(29,15,3),(34,12,3),(33,9,3),(25,6,7)]: r.rect(x, y, w, 1)
r.rect(32, 6, 7, 1, '.')
r.rect(25, 6, 7, 1); r.rect(25, 1, 14, 5, '.')
carve_cells(r, 17, 6, 6)                                          # the big 1 (box x17..24 rows 6..20)
for (x, y) in [(17,6),(24,6),(17,13),(24,13),(17,20),(24,20)]: r.put(x, y, '#')   # corners sealed
r.rect(1, 3, 16, 18, '.'); r.rect(5, 6, 12, 1)                    # far side
r.rect(17, 3, 8, 3, '.')                                          # headroom over the bridge
r.rect(1, 4, 2, 1)
r.rect(1, 1, 38, 1, '.'); r.rect(39, 1, 1, 1, '.')               # the high corridor back over the room
r.rect(4, 2, 35, 1); r.rect(1, 2, 3, 1, '.')
r.put(30, 20, '.')
r.put(32, 20, 'P'); r.put(27, 5, 'P'); r.put(12, 5, 'P')
emit('t3', -2, -1, 'tally', 'LOOSE', r,
     parts=[dict(kind='seg', x=30, y=20, o='h', id='t3')],
     displays=dict(A=dict(s=6, val=7, sockets='a', at=[17, 6])))

# t4 (-1,-1): CARRY HOME -- take the second bar down to the hall without dying
r = Room('#')
r.rect(0, 1, 21, 1, '.'); r.rect(14, 2, 25, 18, '.')
r.rect(14, 20, 12, 1, '.'); r.rect(14, 20, 12, 1, '^')
for (x, y, w) in [(17,6,3),(22,10,3),(17,14,3),(21,17,3)]: r.rect(x, y, w, 1)
r.rect(26, 20, 8, 1, '.'); r.rect(27, 19, 7, 1); r.rect(30, 21, 4, 1, '.')
gC = hang(r, 27, 20)
r.put(2, 1, 'P'); r.put(26, 20, 'P')
emit('t4', -1, -1, 'tally', 'CARRY HOME', r,
     parts=[dict(kind='seg', x=10, y=1, o='h', id='home')],
     displays=dict(C=dict(s=2, src='jumps', at=gC, hint='jumps', wire=[[31, 14], [35, 14], [35, 6]])))

# ============================================================== CLOCKWORK
# c1 (1,0): TICK -- a clock-wired gate. Above: the balcony home with the clock's trapdoors (c4 drops in).
r = Room('#')
r.rect(1, 13, 7, 8, '.'); r.rect(0, 18, 1, 3, '.')
r.rect(8, 20, 22, 1, '.'); r.rect(30, 13, 9, 8, '.'); r.rect(39, 18, 1, 3, '.')
r.rect(34, 21, 3, 1, '.')                                          # from COORDINATES (o3's ladder)
gT = hang(r, 18, 20)
# balcony: c4 drops in at x30..33 onto the trapdoor digit, then a corridor home to the hall's upper right
r.rect(30, 0, 4, 2, '.'); carve_cells(r, 30, 2, 2); r.rect(31, 3, 2, 2, '.'); r.rect(31, 6, 2, 2, '.')
r.rect(1, 9, 33, 3, '.'); r.rect(0, 9, 1, 3, '.')
r.put(3, 20, 'P'); r.put(37, 20, 'P'); r.put(5, 11, 'P')
emit('c1', 1, 0, 'clock', 'TICK', r,
     displays=dict(T=dict(s=2, src='time', at=gT, wire=[[22, 15], [27, 15], [27, 12]], hint='time'),
                   D=dict(s=2, src='time', at=[30, 2])))

# c2 (2,0): STILL -- stand still on the corner and the floor goes away (a stray point in the column)
r = Room('#')
r.rect(1, 1, 12, 20, '.'); r.rect(0, 18, 1, 3, '.')
for (x, y) in [(8,18),(4,15),(8,12),(4,9),(8,6)]: r.rect(x, y, 3, 1)
r.rect(11, 4, 3, 1); r.rect(11, 3, 3, 1, '.')
carve_cells(r, 14, 3, 4)
for ex in (13, 20):
    if r.g[8][ex] == '#': r.put(ex, 8, '^')
r.rect(14, 14, 25, 7, '.'); r.rect(30, 1, 9, 14, '.'); r.rect(34, 0, 4, 1, '.')
for (x, y, w) in [(31,18,3),(35,15,3),(31,12,3),(35,9,3),(31,6,3),(35,3,2)]: r.rect(x, y, w, 1)
r.put(14, 8, 'o')
r.put(2, 20, 'P'); r.put(20, 20, 'P')
emit('c2', 2, 0, 'clock', 'STILL', r,
     displays=dict(D=dict(s=4, src='idle', at=[14, 3], wire=[[20, 2], [24, 2]], hint='idle')))

# c3 (2,-1): DIAL -- a knob on the path: walking across it moves the gate's number
r = Room('#')
r.rect(30, 10, 9, 11, '.'); r.rect(34, 21, 4, 1, '.')
r.rect(1, 9, 38, 1, '.'); r.rect(0, 9, 1, 1, '.')
for (x, y, w) in [(31,18,3),(35,15,3),(31,12,3)]: r.rect(x, y, w, 1)
gK = hang(r, 14, 9)
r.put(32, 20, 'P'); r.put(22, 9, 'P'); r.put(3, 9, 'P')
emit('c3', 2, -1, 'clock', 'DIAL', r,
     parts=[dict(kind='knob', x=23, y=10, w=6, reg='c3')],
     displays=dict(K=dict(s=2, src='reg:c3', at=gK, wire=[[26, 11], [26, 13], [18, 13], [18, 8]], hint='knob')))

# c4 (1,-1): TIMED DIAL -- a clock gate, a knob, a knob gate; then down to c1's trapdoors.
# PANEL's way home (p3) drops in at x8..10, past the gates.
r = Room('#')
r.rect(5, 9, 34, 1, '.'); r.rect(39, 9, 1, 1, '.')
r.rect(8, 0, 3, 9, '.')
g1 = hang(r, 31, 9); g2 = hang(r, 13, 9)
r.rect(5, 10, 3, 8, '.'); r.rect(2, 18, 32, 3, '.'); r.rect(30, 21, 4, 1, '.')
r.put(37, 9, 'P'); r.put(9, 9, 'P'); r.put(3, 20, 'P')
emit('c4', 1, -1, 'clock', 'TIMED DIAL', r,
     parts=[dict(kind='knob', x=19, y=10, w=8, reg='c4')],
     displays=dict(G=dict(s=2, src='time', off=3, at=g1, wire=[[35, 8], [35, 6]]),
                   H=dict(s=2, src='reg:c4', at=g2, wire=[[22, 11], [22, 12], [17, 12], [17, 8]])))

# ============================================================== COORDINATES
def bridge(r, xs, y, s=2):
    for x in xs: carve_cells(r, x, y, s)

# o1 (0,1): BELOW -- position bridges. Left: always position. Right: static 1s until the switch in o2.
r = Room('#')
r.rect(26, 0, 2, 8, '.')
r.rect(1, 1, 38, 19, '.'); r.rect(0, 5, 1, 3, '.'); r.rect(39, 5, 1, 3, '.')
r.rect(1, 8, 5, 13); r.rect(18, 8, 9, 13); r.rect(36, 8, 3, 13)
bridge(r, (6, 10, 14), 8); bridge(r, (27, 31), 8)
r.rect(6, 20, 12, 1, '^'); r.rect(27, 20, 9, 1, '^')
r.put(3, 7, 'P'); r.put(22, 7, 'P'); r.put(37, 7, 'P')
dsp = {f'L{i}': dict(s=2, src='pos', at=[x, 8]) for i, x in enumerate((6, 10, 14))}
dsp['L0'].update(wire=[[7, 16], [3, 16], [3, 12]], hint='pos')
for i, x in enumerate((27, 31)): dsp[f'R{i}'] = dict(s=2, val=1, src='static', src2='pos', sw='o2', at=[x, 8])
dsp['R0']['wire'] = [[28, 16], [24, 16], [24, 19], [0, 19]]
emit('o1', 0, 1, 'coord', 'BELOW', r, displays=dsp)

# o2 (-1,1): REWIRE -- a switch turns static 1s into position bridges (here, and in o1)
r = Room('#')
r.rect(1, 1, 38, 19, '.'); r.rect(39, 5, 1, 3, '.')
r.rect(1, 8, 12, 13); r.rect(29, 8, 10, 13)
bridge(r, (13, 17, 21, 25), 8)
r.rect(13, 20, 16, 1, '^')
r.put(5, 7, 'o')
r.put(36, 7, 'P'); r.put(3, 7, 'P')
dsp = {f'B{i}': dict(s=2, val=1, src='static', src2='pos', sw='o2', at=[x, 8]) for i, x in enumerate((13, 17, 21, 25))}
dsp['B3']['wire'] = [[26, 16], [33, 16], [33, 6]]
emit('o2', -1, 1, 'coord', 'REWIRE', r, displays=dsp,
     parts=[dict(kind='switch', x=33, y=5, sw='o2')])

# o3 (1,1): WHERE AND WHEN -- position, then a switch of your own, then up the ladder into c1
r = Room('#')
r.rect(1, 1, 38, 19, '.'); r.rect(0, 5, 1, 3, '.')
r.rect(1, 8, 6, 13); r.rect(15, 8, 6, 13); r.rect(33, 8, 6, 13)
bridge(r, (7, 11), 8); bridge(r, (21, 25, 29), 8)
r.rect(7, 20, 8, 1, '^'); r.rect(21, 20, 12, 1, '^')
r.rect(34, 0, 3, 1, '.'); r.rect(34, 5, 3, 1, '-'); r.rect(34, 2, 3, 1, '-')
r.put(3, 7, 'P'); r.put(17, 7, 'P'); r.put(37, 7, 'P')
dsp = {f'L{i}': dict(s=2, src='pos', off=3, at=[x, 8]) for i, x in enumerate((7, 11))}
for i, x in enumerate((21, 25, 29)): dsp[f'R{i}'] = dict(s=2, val=1, src='static', src2='pos', sw='o3', at=[x, 8])
dsp['R0']['wire'] = [[22, 16], [18, 16], [18, 6]]
emit('o3', 1, 1, 'coord', 'WHERE AND WHEN', r, displays=dsp,
     parts=[dict(kind='switch', x=18, y=5, sw='o3')])

# ============================================================== PANEL
# p1 (0,-1): DIMMER -- walking left over the long knob turns the brightness down; the dim door is up top
# on the right, and walking back over the knob would turn it up again: take the high road.
r = Room('#')
r.rect(1, 13, 38, 8, '.'); r.rect(36, 21, 3, 1, '.')
r.rect(1, 9, 30, 3, '.'); r.rect(1, 12, 5, 1, '.'); r.rect(6, 12, 25, 1)
for (x, y, w) in [(2,18,3),(5,15,3),(2,12,3)]: r.rect(x, y, w, 1)
r.rect(31, 1, 8, 11, '.'); r.rect(32, 12, 7, 1); r.rect(31, 12, 1, 1)
r.rect(34, 0, 4, 1, '.')
for (x, y, w) in [(36,9,3),(32,6,3),(36,3,2)]: r.rect(x, y, w, 1)
r.put(35, 20, 'P'); r.put(3, 20, 'P'); r.put(34, 11, 'P')
emit('p1', 0, -1, 'over', 'DIMMER', r,
     parts=[dict(kind='knob', x=12, y=20, w=16, reg='bright')],
     displays=dict(DOOR=dict(t='bits', n=1, w=1, h=3, val=1, src='static', dim=True, at=[31, 9],
                             wire=[[20, 19], [20, 14], [31, 14], [31, 12]], hint='bright')),
     reveals=['bright'])

# p2 (0,-2): BURN-IN -- at brightness 9 old burned-in bars glow and hold you; the glass shows old text
r = Room('#')
r.rect(1, 1, 38, 20, '.'); r.rect(34, 21, 4, 1, '.'); r.rect(39, 3, 1, 3, '.')
r.rect(27, 6, 12, 1)
r.put(9, 4, 'o')
r.put(32, 20, 'P'); r.put(35, 5, 'P')
burn = [(31, 18), (25, 15), (19, 12), (13, 9), (19, 6), (8, 6)]
emit('p2', 0, -2, 'over', 'BURN-IN', r,
     displays={f'B{i}': dict(t='bits', n=1, w=3, val=0, burn=True, at=[x, y]) for i, (x, y) in enumerate(burn)},
     text=[dict(s='HUD POSITION: BOTTOM', x=3, y=17, burn=True), dict(s='THE HALL WANTS IT DARK', x=3, y=19, burn=True)],
     reveals=['hudpos'])

# p3 (1,-2): STATUS BAR -- your own HUD blocks the way in; at the bottom it bridges the pit
r = Room('#')
r.rect(0, 3, 1, 3, '.'); r.rect(1, 1, 17, 5, '.'); r.rect(18, 3, 4, 3, '.')
r.rect(19, 6, 3, 9, '.'); r.rect(1, 15, 22, 6, '.'); r.rect(18, 16, 5, 5)
r.rect(8, 21, 3, 1, '.')
r.put(4, 20, '^'); r.put(14, 20, '^')
r.put(18, 5, 'P'); r.put(20, 15, 'P')
emit('p3', 1, -2, 'over', 'STATUS BAR', r, hudSolid=True)

ENDINGS = [
  dict(id=1, title='ONE PERCENT', lines=['THE READOUT SAYS 1.00000 %.', 'THE MACHINE SHRUGS. THE POINT POPS BACK OUT.']),
  dict(id=2, title='TEN PERCENT', lines=['THE READOUT SAYS 10.0000 %.', 'CLOSER. SOMETHING IS STILL MISSING.']),
  dict(id=3, title='ONE HUNDRED PERCENT', lines=['100.000 %', 'EVERY NUMBER IN THE MACHINE READS TRUE.']),
]
out = "// GENERATED by tools/rooms_src/v2.py -- edit there, not here.\n"
out += "export const START_ROOM = 'hall';\n"
out += "export const ENDINGS = " + json.dumps(ENDINGS, indent=1) + ";\n"
out += "export const ROOMS = " + json.dumps(OUT, indent=1) + ";\n"
open(os.path.join(ROOT, 'src/rooms_v2.js'), 'w').write(out)
print('rooms', [o['id'] for o in OUT])
