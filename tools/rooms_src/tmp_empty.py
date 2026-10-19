import sys; sys.path.insert(0, __import__('os').path.join(__import__('os').path.dirname(__file__), '..'))
from roomgen import Room
r = Room().border(r=range(7,8)); r.rect(1,8,38,14); r.put(36,7,'P')
print(r.js())
