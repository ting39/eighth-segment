import sys; sys.path.insert(0, __import__('os').path.join(__import__('os').path.dirname(__file__), '..'))
from roomgen import Room
r = Room().border(l=range(13,17), u=range(30,34), r=range(13,17))
r.rect(0,0,30,2); r.rect(34,0,6,2); r.rect(0,17,40,5)
r.rect(7,14,3,1); r.rect(12,11,3,1)
r.put(16,7,'A')            # static 4 cup
r.rect(23,8,3,1)
r.rect(27,5,2,1)
r.rect(31,3,3,1)
r.rect(20,16,12,1,'^')
r.put(1,16,'P')
print(r.js())
