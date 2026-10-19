import sys; sys.path.insert(0, __import__('os').path.join(__import__('os').path.dirname(__file__), '..'))
from roomgen import Room
r = Room('#')
r.rect(14,7,25,1,'.')                 # corridor row 7, x14..38
r.rect(39,7,1,1,'.')                  # right exit
r.put(18,7,'A')                       # digit box x18..23 rows 7..17
r.rect(18,8,1,4,'.'); r.rect(18,12,1,1,'.'); r.rect(18,13,1,5,'.')   # left column (f, corner, e, corner)
r.rect(19,7,4,1,'.')                  # a row
r.rect(23,8,1,10,'.')                 # right column (b, corner, c, corner)
r.rect(19,12,4,1,'.'); r.rect(19,17,4,1,'.')    # g and d rows
r.put(17,12,'^'); r.put(24,12,'^')    # escape-by-death pockets beside the middle corners
r.rect(1,18,38,3,'.'); r.rect(0,18,1,3,'.')   # bottom hall + left exit rows 18..20
r.rect(26,18,13,3,'#')                # keep the hall short on the right
r.put(34,8,'.'); r.put(34,9,'^')      # the tally pit: drop in on purpose
r.put(37,7,'P'); r.put(3,20,'P')
print(r.js())
