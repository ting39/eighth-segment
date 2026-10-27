# EIGHTH SEGMENT v3 — overnight rework brief (user, 2026-10-27)
Status: STARTED 2026-10-27 evening. User: "think creatively, don't constrain yourself to my ideas." The ideas above are seeds, not a spec.
+ ~/.claude/skills-authored/metroidbrainia-design/SKILL.md are the context). Follow the skill's interest
loop (§7) for every room and every playtest; think deeply about what makes the game interesting.

## User decisions (2026-10-27)
- Build v3 FROM v2; retire v1 (remove v1 and old v2 from the title menu; keep code only if v3 needs it).
- When v3 is solid (tests + full route proof + screenshots), make it the DEFAULT at the main URL. Push.
- Language is a puzzle input and stays SHARED with the site (localStorage "ting39:lang"). Add MORE
  languages to the GAME ONLY (e.g. Korean, French, German, Spanish… choose ones whose words give very
  different display shapes); the site keeps en / zh-TW / ja. Game language list ⊇ site's three.
- User idea to use: a room with two mechanisms in sequence — the first needs language A, the second
  needs language B — so a player whose language is A or B can't pass by doing nothing.
- Hard stop when weekly usage has < 8% left (Weekly · all models ≥ 92% used). Weekly resets
  2026-10-28 ~19:00; do NOT resume after the reset — wait for the user. Mind the 5-hour limit: if hit,
  stop cleanly (commit locally), an hourly resume task continues after it resets.

## User feedback to fix
1. The space above the knob is too small; hard to adjust it. (Give knobs headroom; easy to walk across.)
2. No extra small counter for knobs when a display already shows that value. (Remove redundancy.)
3. The position-detecting display changes too fast. (Coarser steps / hysteresis / bigger cells per digit.)
4. Some tricks are used only once, or only in consecutive rooms. (Every idea must recur far from where
   it was learned and combine with others; space them across the world.)
→ Cut (some or many) existing rooms/mechanics that don't earn their place.

## New ideas from the user
- Displays beyond numbers and beyond 7 segments: 14/16-segment alphanumeric (starburst) displays,
  dot-matrix displays (for CJK/kana/other scripts), bar graphs, etc. WORDS on displays: changing the
  language changes the word → changes which segments are lit → changes the level geometry.
- Some displays in different rooms are controlled by a SINGLE machine (one control, effects in several
  rooms → plan routes and states across rooms).
- Distinguish displays of different function by their shape/design (e.g. bezel style, color, segment
  style per source type) so players can read what a display is wired to.

## Keep
Core rule (lit segments are solid), deterministic sim + solver/replay proof, VFD look, pixel fonts
(5x7 Latin + 12x12 CJK), translations of all UI text (game text must exist in every game language
where possible; at least en/zh-TW/ja for all UI), R restart, hover menus, gamepad/touch, saves.
