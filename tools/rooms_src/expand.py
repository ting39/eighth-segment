"""Daytime expansion rooms (Clockwork 3-6, Coordinates 3-8, Overflow 3-5). Writes blocks into src/rooms.js."""
import os, sys, re
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from roomgen import Room
ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
OUT = []

def emit(rid, gx, gy, region, name, r, displays='{}', extra=''):
    OUT.append((rid, f"""  {{
    id: '{rid}', gx: {gx}, gy: {gy}, region: '{region}', name: '{name}',
    map: [
{r.js()}
    ],
    displays: {displays},{extra}
  }},
"""))

def segrects(s):
    return [(1,0,s,1),(s+1,1,1,s),(s+1,s+2,1,s),(1,2*s+2,s,1),(0,s+2,1,s),(0,1,1,s),(1,s+1,s,1)]

def carve_digit(r, x, y, s, corners=True, esc=True):
    """Open the digit's cells (and corners); interiors stay as they are. Escape spikes beside middle corners."""
    for (dx,dy,w,h) in segrects(s): r.rect(x+dx, y+dy, w, h, '.')
    if corners:
        for cx in (x, x+s+1):
            for cy in (y, y+s+1, y+2*s+2): r.put(cx, cy, '.')
    if esc:
        for ex in (x-1, x+s+2):
            if r.g[y+s+1][ex] == '#': r.put(ex, y+s+1, '^')

# ================================================================ CLOCKWORK
# clock4 (4,2): two clocks on one corridor, a jump-count bridge between them (two-way)
r = Room('#')
r.rect(1,7,38,1,'.'); r.rect(39,7,1,1,'.')
r.rect(12,1,4,6,'.'); r.rect(24,1,4,6,'.')
r.rect(1,8,7,12,'.'); r.rect(2,20,4,2,'.')
for (x,y) in [(6,17),(2,14),(6,11)]: r.rect(x,y,2,1)
r.rect(17,8,6,12,'.'); r.put(17,8,'#'); r.put(22,8,'#')
r.rect(18,12,4,1,'^'); r.rect(18,17,4,1,'^'); r.rect(17,19,6,1,'^')
r.put(1,19,'P'); r.put(36,7,'P'); r.put(9,7,'P')
emit('clock4','4','2','clock','TWO CLOCKS', r,
     "{ A: { s: 4, src: 'jumps', at: [17, 8] }, B: { s: 2, src: 'time', at: [12, 1] }, C: { s: 2, src: 'time', off: 3, at: [24, 1] } }",
     "\n    hud: true,")

# clock5 (5,2): stand still through two floors; a one-way ladder brings you back
r = Room('#')
r.rect(0,7,7,1,'.'); r.rect(1,1,6,7,'.'); r.rect(7,1,1,2,'.')
r.rect(4,5,2,1)
r.rect(8,1,31,1,'.')
carve_digit(r,8,2,4); carve_digit(r,8,13,2)
r.rect(8,19,31,2,'.'); r.rect(39,19,1,2,'.')
r.rect(36,2,3,18,'.')
for y in (18,15,12,9,6,3): r.rect(36,y,3,1,'-')
r.put(30,20,'o')
r.put(1,7,'P'); r.put(20,20,'P')
emit('clock5','5','2','clock','STILLER', r,
     "{ A: { s: 4, src: 'idle', at: [8, 2] }, B: { s: 2, src: 'idle', off: 4, at: [8, 13] } }")

# ================================================================ COORDINATES
# coord3 (-2,3): where you stand decides which floor opens
r = Room('#')
r.rect(39,11,1,3,'.'); r.rect(31,1,8,13,'.'); r.rect(1,1,30,6,'.')
r.rect(35,11,3,1); r.rect(31,9,2,1)
for x in (24,17,12,6): carve_digit(r,x,7,2)
r.rect(1,14,22,6,'.'); r.rect(0,17,1,3,'.')
r.put(36,13,'P'); r.put(29,6,'P'); r.put(3,19,'P')
emit('coord3','-2','3','coord','WHERE TO FALL', r,
     "{ A: { s: 2, src: 'pos', at: [24, 7] }, B: { s: 2, src: 'pos', at: [17, 7] }, C: { s: 2, src: 'pos', at: [12, 7] }, D: { s: 2, src: 'pos', at: [6, 7] } }")

# coord4 (-3,3): binary stairs counted in jumps
r = Room().border(l=range(17,20), r=range(17,20), u=range(2,6))
r.rect(0,20,40,2)
r.rect(8,8,3,1); r.rect(3,5,3,1); r.rect(6,3,2,1)
r.put(37,19,'P'); r.put(9,7,'P')
emit('coord4','-3','3','coord','COUNTING IN TWOS', r,
     "{ K: { t: 'bits', n: 1, w: 3, src: 'jumps', div: 1, at: [26, 17] }, L: { t: 'bits', n: 1, w: 3, src: 'jumps', div: 2, at: [20, 14] }, M: { t: 'bits', n: 1, w: 3, src: 'jumps', div: 4, at: [14, 11] } }")

# coord5 (-3,2): mind the gaps -- the bridge vanishes at columns ending in 1 or 4
r = Room('#')
r.rect(1,1,7,19,'.'); r.rect(2,20,4,2,'.')
for (x,y) in [(6,17),(2,14),(6,11),(2,8)]: r.rect(x,y,2,1)
r.rect(8,1,31,5,'.'); r.rect(39,3,1,3,'.')
for x in (8,16,24):
    carve_digit(r,x,6,6,corners=False,esc=False)
    r.rect(x+1,7,6,6,'.'); r.rect(x+1,14,6,6,'.')
    r.rect(x+1,12,6,1,'^'); r.rect(x+1,19,6,1,'^')
r.put(1,19,'P'); r.put(35,5,'P')
emit('coord5','-3','2','coord','MIND THE GAPS', r,
     "{ A: { s: 6, src: 'pos', at: [8, 6] }, B: { s: 6, src: 'pos', at: [16, 6] }, C: { s: 6, src: 'pos', at: [24, 6] } }")

# coord6 (-2,2): descent
r = Room().border(l=range(3,6), r=range(17,20))
r.rect(0,6,7,16); r.rect(0,21,40,1); r.rect(33,20,7,2)
r.rect(7,20,26,1,'^')
for (x,y,w) in [(10,9,2),(15,12,2),(20,10,1),(24,13,2),(29,16,2)]: r.rect(x,y,w,1)
r.rect(19,6,3,1,'v')
r.put(2,5,'P'); r.put(35,19,'P')
emit('coord6','-2','2','coord','DESCENT', r)

# coord7 (-1,2): low ceiling, two death counters
r = Room('#')
r.rect(0,17,6,3,'.'); r.rect(6,19,28,1,'.'); r.rect(34,17,6,3,'.')
r.rect(18,13,4,6,'.'); r.rect(26,13,4,6,'.')
r.put(3,20,'^')
r.put(1,19,'P'); r.put(36,19,'P')
emit('coord7','-1','2','coord','LOW CEILING', r,
     "{ A: { s: 2, src: 'deaths', at: [18, 13] }, B: { s: 2, src: 'deaths', off: 6, at: [26, 13] } }")

# coord8 (0,2): back door into the gate (a stray point on the tower)
r = Room().border(l=range(17,20), r=range(17,20))
r.rect(0,20,40,2)
for (x,y,w) in [(8,17,2),(12,14,1),(16,11,1),(20,8,1),(24,5,1)]: r.rect(x,y,w,1)
r.put(28,3,'o'); r.rect(26,9,6,1,'^')
r.put(1,19,'P'); r.put(37,19,'P')
emit('coord8','0','2','coord','BACK DOOR', r)

# ================================================================ OVERFLOW
# over3 (2,0): hex deaths -- only C, E and F open the right column
r = Room('#')
r.rect(0,7,31,1,'.'); r.put(5,8,'.'); r.put(5,9,'^')
carve_digit(r,20,8,4)
r.put(20,18,'#'); r.put(19,17,'^')
r.rect(14,19,25,2,'.'); r.rect(27,18,13,1,'.'); r.rect(39,19,1,2,'.')
r.put(1,7,'P'); r.put(16,20,'P')
emit('over3','2','0','over','PAST NINE', r, "{ A: { s: 4, src: 'deaths', base: 16, at: [20, 8] } }")

# over4 (3,0): the volume cup (tally3's shape, wired to the music volume)
src = open(os.path.join(ROOT, 'tools/rooms_src/tally3.py')).read()
ns = {'__file__': os.path.join(ROOT, 'tools/rooms_src/tally3.py')}
exec(src.replace('print(r.js())', '').replace("border(r=range(18,21), u=range(34,38))", "border(l=range(18,21), u=range(34,38))"), ns)
r = ns['r']; r.put(2,20,'P')
emit('over4','3','0','over','MIXING DESK', r, "{ A: { s: 3, src: 'volume', icon: 'speaker' } }")

# over5 (3,-1): everything at once (deaths bridge, jumps blocker, time blocker)
src = open(os.path.join(ROOT, 'tools/rooms_src/tally1.py')).read()
ns = {'__file__': os.path.join(ROOT, 'tools/rooms_src/tally1.py')}
src = src.replace('print(r.js())', '')
src = src.replace("d=range(30,34)", "d=range(34,38)").replace("r.rect(0,20,30,2); r.rect(34,20,6,2)", "r.rect(0,20,34,2); r.rect(38,20,2,2)")
src = src.replace("r.rect(35,17,4,1); r.rect(30,14,3,1); r.rect(35,11,4,1)", "r.rect(31,17,3,1); r.rect(35,14,3,1); r.rect(31,11,3,1)")
exec(src, ns)
r = ns['r']
for y in range(22):
    for x in range(40):
        if r.g[y][x] in 'AB': r.g[y][x] = '.'
r.rect(18,8,16,1); r.rect(34,8,3,1,'.'); r.rect(37,8,2,1)
r.rect(4,1,4,6,'.')
for (x,y) in [(36,19),(37,7)]:
    if r.g[y][x] == 'P': r.put(x,y,'.')
r.put(32,19,'P'); r.put(38,7,'P')
emit('over5','3','-1','over','EVERYTHING AT ONCE', r,
     "{ A: { s: 4, src: 'deaths', at: [12, 8] }, B: { s: 2, src: 'jumps', at: [22, 1] }, C: { s: 2, src: 'time', at: [4, 1] } }",
     "\n    hud: true,")

# ================================================================ SIDE ROOMS (dead ends with stray points)
# notch (4,6): climb a pillar of 1s through their corner notches
r = Room().border(l=range(13,17))
r.rect(0,17,40,5)
r.put(17,10,'A'); r.put(17,4,'B')
r.rect(24,3,3,1); r.put(25,2,'o')
r.put(2,16,'P')
emit('notch','4','6','boot','NOTCHES', r, "{ A: { s: 2, val: 1 }, B: { s: 2, val: 1 } }")

# clock6 (6,2): overtime -- precision off STILLER's bottom corridor
r = Room('#')
r.rect(1,1,38,20,'.'); r.rect(0,19,1,2,'.')
r.rect(33,20,6,1)
r.rect(9,20,24,1,'^')
for (x,y,w) in [(11,18,2),(16,16,2),(21,18,2),(26,15,2)]: r.rect(x,y,w,1)
r.rect(18,11,6,1,'v'); r.put(20,13,'o'); r.put(36,17,'o')
r.rect(35,18,4,1,'v')
r.put(3,20,'P'); r.put(35,19,'P')
emit('clock6','6','2','clock','OVERTIME', r)

# sidechannel (0,1): walk the top bar of the volume -- it must be off (1 or 4)
r = Room('#')
r.rect(39,17,1,3,'.'); r.rect(30,8,9,12,'.')
for (x,y) in [(30,17),(35,14),(30,11)]: r.rect(x,y,3,1)
r.rect(4,7,35,1,'.')
carve_digit(r,10,7,4)
r.put(9,17,'^'); r.put(16,17,'^')
r.put(5,7,'o')
r.put(36,19,'P'); r.put(28,7,'P')
emit('sidechannel','0','1','over','SIDE CHANNEL', r, "{ A: { s: 4, src: 'volume', icon: 'speaker', at: [10, 7] } }")

# coord9 (-4,3): every other -- the bridges count in twos
r = Room('#')
r.rect(32,1,7,19,'.'); r.rect(39,17,1,3,'.')
for (x,y) in [(32,17),(36,14),(32,11),(36,8)]: r.rect(x,y,2,1)
r.rect(1,1,31,5,'.')
for x in (8,16,24):
    carve_digit(r,x,6,6,corners=False,esc=False)
    r.rect(x+1,7,6,6,'.'); r.rect(x+1,14,6,6,'.')
    r.rect(x+1,12,6,1,'^'); r.rect(x+1,19,6,1,'^')
r.rect(24,1,8,1,'v')
r.put(3,5,'o')
r.put(36,19,'P'); r.put(5,5,'P')
emit('coord9','-4','3','coord','EVERY OTHER', r,
     "{ A: { s: 6, src: 'pos', div: 2, off: 1, at: [8, 6] }, B: { s: 6, src: 'pos', div: 2, off: 1, at: [16, 6] }, C: { s: 6, src: 'pos', div: 2, off: 1, at: [24, 6] } }")

path = os.path.join(ROOT, 'src/rooms.js')
s = open(path).read()
for rid, block in OUT:
    m = re.search(r"  \{\n    id: '" + rid + r"'.*?\n  \},\n", s, re.S)
    if m: s = s[:m.start()] + block + s[m.end():]
    else:
        k = s.rstrip().rindex('];'); s = s[:k] + block + s[k:]
open(path, 'w').write(s)
print('wrote', [o[0] for o in OUT])
