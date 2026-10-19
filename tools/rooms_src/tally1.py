import sys; sys.path.insert(0, __import__('os').path.join(__import__('os').path.dirname(__file__), '..'))
from roomgen import Room
r = Room().border(l=range(7,8), d=range(30,34))
r.rect(0,0,40,1)
r.rect(0,20,30,2); r.rect(34,20,6,2)
# right-side steps up to the corridor
r.rect(35,17,4,1); r.rect(30,14,3,1); r.rect(35,11,4,1)
# corridor: rows 6-7, ceiling row 5, floor row 8
r.rect(1,1,21,6); r.rect(26,1,13,6)  # ceiling; corridor is row 7 only
r.rect(21,1,1,6); r.rect(26,1,1,5)         # B's housing walls
r.rect(18,8,12,1); r.rect(33,8,6,1)  # floor right of the bridge, hole at x30..32
r.rect(26,9,1,1)
r.put(22,1,'B')                            # deaths, s=2: its d bar hangs into the walking row
r.rect(1,8,11,1)                           # floor left of the bridge
r.put(12,8,'A'); r.put(12,8,'#'); r.put(17,8,'#')   # bridge corners are static
r.rect(11,9,1,13); r.rect(18,9,1,13)       # pit walls
r.rect(13,12,4,1,'^'); r.rect(13,17,4,1,'^')  # teeth inside the cells
r.rect(12,19,6,1,'^')
r.put(36,19,'P'); r.put(37,7,'P'); r.put(3,7,'P')
print(r.js())
