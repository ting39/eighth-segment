"""Tiny helper to author room maps with drawing ops, then print JS map rows.
usage: from roomgen import Room; r = Room(); r.rect(...); print(r.js())"""
class Room:
    def __init__(self, fill='.'):
        self.g = [[fill] * 40 for _ in range(22)]
    def rect(self, x, y, w, h, ch='#'):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                if 0 <= xx < 40 and 0 <= yy < 22: self.g[yy][xx] = ch
        return self
    def put(self, x, y, ch):
        self.g[y][x] = ch; return self
    def border(self, l=(), r=(), u=(), d=(), ch='#'):
        """solid border except the given open ranges (list of rows for l/r, cols for u/d)"""
        for y in range(22):
            if y not in l: self.g[y][0] = ch
            if y not in r: self.g[y][39] = ch
        for x in range(40):
            if x not in u: self.g[0][x] = ch
            if x not in d: self.g[21][x] = ch
        return self
    def js(self):
        return '\n'.join("      '" + ''.join(row) + "'," for row in self.g)
