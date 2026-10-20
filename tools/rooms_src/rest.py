"""Generates the rooms after tally3 and writes them into src/rooms.js (replacing same-id blocks)."""
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

# ---------------- tally4 (1,4): hanging jumps-d blocker; don't hop under it
r = Room().border(u=range(2,6), d=range(34,38))
r.rect(0,20,34,2); r.rect(38,20,2,2)
r.rect(6,1,25,18); r.rect(31,1,8,13)          # solid mass; corridor row 19 under it
r.rect(18,13,4,6,'.'); r.put(18,13,'B')        # housing for the hanging digit (d at row 19)
for (x,y) in [(1,17),(4,14),(1,11),(4,8),(1,5),(4,3)]: r.rect(x,y,2,1)
r.put(32,19,'P'); r.put(3,19,'P')
for y in (17,18,19): r.put(39,y,'X')         # fake wall -> FINE PRINT (drawn open on the map)
emit('tally4','1','4','tally','MIND YOUR HEAD', r, "{ B: { s: 2, src: 'jumps' } }")

# ---------------- hub (1,3): junction + real wall clock
r = Room().border(l=range(17,20), r=range(17,20), u=range(2,6), d=range(2,6))
r.rect(0,20,2,2); r.rect(6,20,34,2)
for (x,y,w) in [(7,17,3),(11,14,3),(7,11,3),(11,8,3),(7,5,3)]: r.rect(x,y,w,1)
r.rect(1,3,3,1)   # top-left ledge under the exit
r.put(22,2,'H'); r.put(26,2,'I'); r.put(31,2,'M'); r.put(35,2,'N')
r.put(30,4,'#'); r.put(30,6,'#')
r.put(8,19,'P'); r.put(37,19,'P'); r.put(1,19,'P')
# clock secret: ledges up to the minute-ones digit; brackets under its corners leave bar d as the only
# way into its lower cell (point) -> open on minutes ending 1/4/7 (test/secrets.test.mjs)
r.rect(35,17,3,1); r.rect(32,14,3,1); r.rect(36,11,3,1)
for x in (34,35,38): r.put(x,8,'#')
r.put(36,7,'o')
emit('hub','1','3','tally','JUNCTION', r,
     "{ H: { s: 2, src: 'clock', place: 3 }, I: { s: 2, src: 'clock', place: 2 }, M: { s: 2, src: 'clock', place: 1 }, N: { s: 2, src: 'clock', place: 0 } }",
     "\n    text: [{ s: 'LOCAL TIME', x: 26, y: 10, ox: 2 }],")

# ---------------- clock1 (2,3): time drop column {1,3,7}
r = Room('#')
r.rect(0,17,1,3,'.'); r.rect(1,8,9,12,'.'); r.rect(1,7,30,1,'.')
for (x,y) in [(6,17),(2,14),(6,11)]: r.rect(x,y,3,1)
r.put(22,7,'A')
r.rect(22,8,1,10,'.'); r.rect(27,8,1,10,'.'); r.rect(23,12,4,1,'.'); r.rect(23,17,4,1,'.')
r.put(21,12,'^')
r.rect(18,18,21,2,'.'); r.rect(39,18,1,2,'.')
r.rect(28,8,4,10,'.'); r.rect(28,7,6,1,'.')        # return shaft from the hall up to the corridor's far end
r.rect(28,17,2,1); r.rect(30,14,2,1); r.rect(28,11,2,1)
r.put(33,7,'P')
r.put(2,19,'P'); r.put(36,19,'P')
emit('clock1','2','3','clock','TICK', r, "{ A: { s: 4, src: 'time' } }", "\n    hud: true,")

# ---------------- clock2 (3,3): patience drop (idle) with a stray point in the column
r = Room().border(l=range(18,20), r=range(17,20))
r.rect(0,20,40,2)
for (x,y) in [(12,17),(8,14),(12,11),(8,8),(12,5)]: r.rect(x,y,3,1)
r.rect(15,2,5,1)                       # ledge (stand row 1) next to the digit's top-left corner

r.put(20,1,'A')                        # idle digit box x20..25 rows 1..11
r.rect(21,2,4,4); r.rect(21,7,4,4)     # solid interiors
r.rect(26,1,13,11)                     # mass right of the digit (right column pockets inside)
r.rect(25,2,1,10,'.'); r.put(26,6,'^')
r.put(20,6,'o')
r.put(2,19,'P')
emit('clock2','3','3','clock','PATIENCE', r, "{ A: { s: 4, src: 'idle', at: [20, 1] } }")

# ---------------- coord1 (0,3): position bridge
r = Room().border(l=range(9,12), r=range(17,20))
r.rect(0,0,40,1); r.rect(0,21,40,1)
r.rect(1,12,6,9)                       # left landing block (top 12)
r.rect(31,12,2,8); r.rect(31,20,8,1)   # bridge-side block (top 12) and entry floor (top 20)
r.rect(35,17,3,1); r.rect(36,14,2,1)   # climb from the entry floor
r.rect(7,20,24,1,'^')                  # pit
for i,x in enumerate([8,14,20,25]): r.put(x,12,'ABCD'[i])
r.put(37,19,'P'); r.put(32,11,'P'); r.put(3,11,'P')
emit('coord1','0','3','coord','WHERE YOU ARE', r,
     "{ A: { s: 2, src: 'pos' }, B: { s: 2, src: 'pos' }, C: { s: 2, src: 'pos' }, D: { s: 2, src: 'pos' } }")

# ---------------- coord2 (-1,3): binary stairs of deaths, stray point + hint
r = Room().border(r=range(9,12))
r.rect(0,14,40,8); r.rect(32,12,7,2)
r.rect(30,11,0,0)
r.put(28,11,'K'); r.put(23,8,'L'); r.put(18,5,'M')
r.rect(10,2,6,1)                       # top ledge with the point
r.put(12,1,'o')
r.put(36,11,'P')
emit('coord2','-1','3','coord','BITS', r,
     "{ K: { t: 'bits', n: 1, w: 3, src: 'deaths', div: 1 }, L: { t: 'bits', n: 1, w: 3, src: 'deaths', div: 2 }, M: { t: 'bits', n: 1, w: 3, src: 'deaths', div: 4 } }",
     "\n    text: [{ s: 'C / D', x: 4, y: 6 }],")

# ---------------- gate (1,2): idle drop, then the stairs
r = Room('#')
r.rect(1,1,8,19,'.'); r.rect(2,20,4,2,'.')         # left climb area, entry from below x2..5
for (x,y) in [(6,17),(1,14),(6,11),(1,8),(6,5)]: r.rect(x,y,3,1)
r.rect(1,1,9,0)
r.rect(9,1,1,1,'.')                                 # stand on top of the x9 wall at row 1
r.put(10,1,'A')
r.rect(10,1,1,11,'.'); r.rect(11,1,4,1,'.'); r.rect(15,1,1,11,'.')
r.rect(11,6,4,1,'.'); r.rect(11,11,4,1,'.')
r.put(16,6,'^'); r.put(9,6,'^')
r.rect(10,12,6,8,'.'); r.rect(16,1,23,19,'.')      # region R
r.rect(16,1,1,11,'#'); r.put(16,6,'^')
for (x,y,w) in [(20,17,3),(25,14,3),(30,11,3),(35,8,3),(30,5,3),(35,3,2)]: r.rect(x,y,w,1)
r.rect(34,0,4,1,'.')
r.put(12,19,'P'); r.put(7,19,'P')
emit('gate','1','2','clock','STAND STILL', r, "{ A: { s: 4, src: 'idle', at: [10, 1] } }")

# ---------------- over1 (1,1): hex jumps, right-column drop at C/E/F
r = Room('#')
r.rect(30,1,9,19,'.'); r.rect(34,20,4,2,'.')        # right climb area, entry from below x34..37
for (x,y) in [(30,17),(35,14),(30,11),(35,8),(30,5)]: r.rect(x,y,3,1)
r.put(28,1,'.'); r.rect(29,1,1,1,'.')
r.put(22,1,'A')                                     # box x22..27 rows 1..11
r.rect(27,1,1,11,'.'); r.rect(23,1,4,1,'.'); r.rect(22,1,1,11,'.')
r.rect(23,6,4,1,'.'); r.rect(23,11,4,1,'.')
r.put(21,6,'^'); r.put(28,6,'^')
r.rect(1,12,27,8,'.')                               # chamber below
r.rect(1,1,9,11,'.'); r.rect(6,0,4,1,'.')           # left climb to the top exit x6..9
for (x,y) in [(5,17),(1,14),(5,11),(1,8),(5,5),(8,3)]: r.rect(x,y,2,1)
r.put(31,19,'P'); r.put(20,19,'P')
emit('over1','1','1','over','OVERFLOW', r, "{ A: { s: 4, src: 'jumps', base: 16, at: [22, 1] } }")

# ---------------- over2 (1,0): volume = tally1 mirrored
src = open(os.path.join(ROOT, 'tools/rooms_src/tally1.py')).read()
ns = {'__file__': os.path.join(ROOT, 'tools/rooms_src/tally1.py')}
exec(src.replace('print(r.js())', ''), ns)
t1 = ns['r']
r = Room(); r.g = [row[::-1] for row in t1.g]
for y in range(22):
    for x in range(40):
        if r.g[y][x] in 'AB': r.g[y][x] = '.' if r.g[y][x]=='A' else '.'
r.put(14,1,'B')
r.rect(0,7,1,1,'#'); r.put(39,7,'.')
emit('over2','1','0','over','TURN IT UP', r,
     "{ A: { s: 4, src: 'volume', at: [22, 8], icon: 'speaker' }, B: { s: 2, src: 'volume', icon: 'speaker' } }")

# ---------------- master (2,0): the Master Readout, 3 1 4 1 5 9 with decimal-point slots
r = Room().border(l=range(7,8))
r.rect(0,0,40,3); r.rect(0,8,3,14); r.rect(0,18,40,4)
digits = [(3,3),(9,1),(15,4),(21,1),(27,5),(33,9)]
disp = []
for i,(x,v) in enumerate(digits):
    r.put(x,9,'QRTUWY'[i])
    r.rect(x+1,10,3,3); r.rect(x+1,14,3,3)           # solid interiors
    disp.append(f"{'QRTUWY'[i]}: {{ s: 3, val: {v} }}")
for gx in (20,26,32,38): r.rect(gx,9,1,9)
r.rect(2,8,1,10,'.'); r.put(21,17,'^')
r.put(2,17,'a'); r.put(8,17,'b'); r.put(14,17,'c')
r.put(1,7,'P')
emit('master','2','0','master','MASTER READOUT', r, '{ ' + ', '.join(disp) + ' }',
     "\n    triggers: { a: { kind: 'slot', id: 2 }, b: { kind: 'slot', id: 3 }, c: { kind: 'slot', id: 1 } },\n    text: [{ s: 'PUT THE POINT WHERE IT BELONGS', x: 8, y: 4 }],")

# ---------------- fineprint (2,4): secret. The HUD, giant and solid: seconds digit, hazard x, deaths digit.
r = Room().border(l=range(17,20))
r.rect(1,1,38,10); r.rect(1,20,38,1)            # corridor rows 11-19 = exactly one digit tall
r.put(12,11,'J'); r.put(27,11,'K')
for (x,y) in [(20,14),(22,14),(21,15),(20,16),(22,16)]: r.put(x,y,'%')
r.put(2,19,'P'); r.put(24,19,'P'); r.put(36,19,'o')
emit('fineprint','2','4','tally','FINE PRINT', r, "{ J: { s: 3, src: 'time' }, K: { s: 3, src: 'deaths' } }",
     "\n    nohud: true,")

# ---------------- encore (4,3): secret-ish side room off clock2. A digit counting VISITS to this room,
# walled in so the only way in is its upper-left bar f; the point sits on its middle bar g.
r = Room().border(l=range(17,20))
r.rect(0,20,40,2)
r.rect(30,1,9,19)                              # solid right of the digit (b, c sides closed)
r.rect(19,1,11,3)                              # ceiling over the digit's a bar
r.rect(23,1,1,4)                               # no way into the top-left corner
r.rect(23,10,1,10); r.rect(24,15,6,5)          # e side and below d closed
r.rect(19,9,5,1)                               # ledge: stand on row 8, level with f's bottom
for (x,y,w) in [(14,17,3),(9,14,3),(14,11,3)]: r.rect(x,y,w,1)
r.rect(26,5,1,3)                               # divider: reach the point only by walking on g
r.put(24,4,'A'); r.put(28,8,'o')
r.put(2,19,'P')
emit('encore','4','3','clock','ENCORE', r, "{ A: { s: 4, src: 'visits' } }")

path = os.path.join(ROOT, 'src/rooms.js')
s = open(path).read()
for rid, block in OUT:
    m = re.search(r"  \{\n    id: '" + rid + r"'.*?\n  \},\n", s, re.S)
    if m: s = s[:m.start()] + block + s[m.end():]
    else:
        k = s.rstrip().rindex('];'); s = s[:k] + block + s[k:]
open(path, 'w').write(s)
print('wrote', [o[0] for o in OUT])
