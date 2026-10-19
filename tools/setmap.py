"""Replace the map of room <id> in src/rooms.js with rows read from stdin (JS row lines)."""
import re, sys
rid = sys.argv[1]
rows = sys.stdin.read().rstrip('\n')
src = open('src/rooms.js').read()
i = src.index(f"id: '{rid}'")
a = src.index('map: [', i) + len('map: [')
b = src.index('    ],', a)
src = src[:a] + '\n' + rows + '\n' + src[b:]
open('src/rooms.js', 'w').write(src)
