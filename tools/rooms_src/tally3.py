import sys; sys.path.insert(0, __import__('os').path.join(__import__('os').path.dirname(__file__), '..'))
from roomgen import Room
r = Room().border(r=range(18,21), u=range(34,38))
r.rect(0,0,34,1); r.rect(38,0,2,1)
r.rect(0,21,40,1)
r.put(16,8,'A')                       # jumps digit, box x16..20 rows 8..16
r.rect(14,7,9,1)                      # ceiling over the digit: no walking on top of 'a'
r.rect(10,9,6,1)                      # left ledge (stand row 8), ends at the f column
r.rect(21,12,18,6)                    # right ledge (top 12) and solid block down to the bottom corridor
r.rect(26,9,3,1); r.rect(31,6,3,1); r.rect(35,3,3,1)   # steps to the top exit
r.rect(6,18,3,1); r.rect(2,15,3,1); r.rect(6,12,3,1)   # left climb from the bottom
r.put(37,20,'P'); r.put(11,8,'P'); r.put(23,11,'P')
print(r.js())
