"""Append an empty room skeleton before the final '];' of src/rooms.js.
usage: addroom.py id gx gy region "NAME" "displays-js" """
import sys
rid, gx, gy, region, name, disp = sys.argv[1:7]
src = open('src/rooms.js').read()
k = src.rstrip().rindex('];')
block = f"""  {{
    id: '{rid}', gx: {gx}, gy: {gy}, region: '{region}', name: '{name}',
    map: [
    ],
    displays: {disp},
  }},
"""
src = src[:k] + block + src[k:]
open('src/rooms.js', 'w').write(src)
