# Foundry District (Hide & Run) - one source of truth for render + game.
# World units: car is 52 x 26. y grows south. Play area 0..W x 0..H.
import json, math

W, H = 3300, 2200
DECK_Z = 4.6  # metres, bridge + parking deck height
U = 11.818

boxes = []   # collision: [x0,y0,x1,y1,mask,occ]   mask 1=ground 2=upper 3=both ; occ 1 = blocks sight
items = []   # render: dict(kind, rect, ...); 'ov' = id of overlay sprite group (None = ground layer)
covers = []  # roofs that hide whoever is underneath: dict(id, rect, ov)
decks = []   # drivable upper surfaces: dict(id, rects:[...], z)
ramps = []   # dict(id, rect, dir: 'w'|'e'|'n'|'s' (direction you drive UP), deck)

def box(x0, y0, x1, y1, mask=1, occ=1):
    boxes.append([x0, y0, x1, y1, mask, occ])

def item(kind, x0, y0, x1, y1, ov=None, **kw):
    d = dict(kind=kind, r=[x0, y0, x1, y1], ov=ov); d.update(kw); items.append(d); return d

# ---------------- roads ----------------
PER = 170                                    # perimeter road width
V = [(1030, 1180), (2120, 2270)]             # interior north-south roads
HZ = [(640, 790), (1410, 1560)]              # interior east-west roads
STREET = (1580, 1720)                        # centre street that runs under the bridge (y 790..1410)
roads = [[0, 0, W, PER], [0, H - PER, W, H], [0, 0, PER, H], [W - PER, 0, W, H]]
for a, b in V: roads.append([a, 0, b, H])
for a, b in HZ: roads.append([0, a, W, b])
roads.append([STREET[0], 790, STREET[1], 1410])

COLS = [(186, 1014), (1196, 2104), (2286, 3114)]
ROWS = [(186, 624), (806, 1394), (1576, 2014)]

# ---------------- A1 rail yard ----------------
for si, (y0, wagons) in enumerate([(272, [(230, 430, 'red'), (520, 720, 'blue'), (810, 960, 'rust')]), (452, [(300, 500, 'blue'), (590, 790, 'red')])]):
    item('track', 186, y0 - 12, 1014, y0 + 62)
    for x0, x1, col in wagons:
        box(x0, y0, x1, y0 + 50); item('wagon', x0, y0, x1, y0 + 50, ov='rail%d' % si, col=col)
for x, y in [(860, 230), (860, 560), (985, 230), (985, 560)]:
    box(x - 10, y - 10, x + 10, y + 10, 1, 0)
item('gantry', 850, 220, 995, 570, ov='gantry')
item('fence', 186, 186, 186, 624)
item('props', 186, 186, 1014, 624, set='rail')

# ---------------- B1 loading docks ----------------
box(1240, 200, 1690, 420); box(1860, 200, 1910, 420)
box(1690, 200, 1710, 420); box(1840, 200, 1860, 420); box(1690, 200, 1860, 240)    # the open drive-in bay
item('warehouse', 1240, 200, 1910, 420, ov='docks', bay=[1710, 240, 1840, 420])
covers.append(dict(id='bay', r=[1710, 240, 1840, 420], ov='docks'))
box(2010, 200, 2095, 400); item('tanks', 2010, 200, 2095, 400, ov='tanks')
for x in range(1300, 1660, 120): box(x - 9, 470 - 9, x + 9, 470 + 9, 1, 0); item('pillar', x - 9, 461, x + 9, 479)
item('props', 1196, 420, 2104, 624, set='docks')

# ---------------- C1 repair row: 4 garages, G1-G3 drive-through, G4 single door ----------------
G = [(2310, 2485, '#5f8a62'), (2510, 2685, '#4f74a8'), (2710, 2885, '#a84a44'), (2910, 3085, '#8c8f99')]
for i, (x0, x1, roof) in enumerate(G):
    gy0, gy1, t = 250, 560, 22
    box(x0, gy0, x0 + t, gy1); box(x1 - t, gy0, x1, gy1)
    rear = i < 3
    if not rear: box(x0, gy0, x1, gy0 + t)
    item('garage', x0, gy0, x1, gy1, ov='gar%d' % i, roof=roof, rear=rear)
    covers.append(dict(id='gar%d' % i, r=[x0 + t, gy0 + (0 if rear else t), x1 - t, gy1], ov='gar%d' % i))
for (a, _, _), (b, _, _) in zip(G[1:], G[:-1]):
    pass
for i in range(3):                       # fill the slots between garages (too narrow to drive)
    box(G[i][1], 250, G[i + 1][0], 560)
item('props', 2286, 560, 3114, 624, set='repair')

# ---------------- A2 container yard ----------------
CONT = [(830, 890, [(230, 372), (470, 612), (720, 862)]), (990, 1070, [(260, 402), (520, 662), (800, 942)]),
        (1170, 1230, [(230, 372), (480, 622), (720, 862)]), (1320, 1376, [(300, 442), (600, 742)])]
for ri, (y0, y1, xs) in enumerate(CONT):
    for ci, (x0, x1) in enumerate(xs):
        box(x0, y0, x1, y1); item('containers', x0, y0, x1, y1, ov='cont%d' % ri, seed=ri * 10 + ci)
item('props', 186, 806, 1014, 1394, set='containers')

# ---------------- B2 overpass: deck + ramps, four small blocks, staging lot ----------------
DY0, DY1 = 1040, 1160
decks.append(dict(id='bridge', rects=[[1370, DY0, 1930, DY1]], z=DECK_Z, ov='bridge'))
ramps.append(dict(id='bw', r=[1180, DY0, 1370, DY1], up='e', deck='bridge'))
ramps.append(dict(id='be', r=[1930, DY0, 2120, DY1], up='w', deck='bridge'))
item('bridge', 1180, DY0 - 10, 2120, DY1 + 10, ov='bridge', street=list(STREET))
# rails: upper-only above the street, both layers along the ramps (side walls), solid embankment under ramps
for yy in (DY0 - 10, DY1):
    box(1180, yy, 1370, yy + 10, 3, 0); box(1930, yy, 2120, yy + 10, 3, 0)
    box(1370, yy, 1930, yy + 10, 2, 0)
box(1220, DY0, STREET[0], DY1, 1, 1); box(STREET[1], DY0, 2080, DY1, 1, 1)   # under the deck (ramp feet left free)
covers.append(dict(id='tunnel', r=[STREET[0], DY0, STREET[1], DY1], ov='bridge', deck=1))
box(1230, 840, 1530, 1000); item('plant', 1230, 840, 1530, 1000, ov='plant')
box(1780, 840, 2060, 990); item('pumphouse', 1780, 840, 2060, 990, ov='pump')
# SE storage shed: one door on the west side, onto the centre street
sx0, sy0, sx1, sy1, t = 1780, 1200, 2080, 1380, 20
box(sx0, sy0, sx1, sy0 + t); box(sx0, sy1 - t, sx1, sy1); box(sx1 - t, sy0, sx1, sy1)
box(sx0, sy0, sx0 + t, 1235); box(sx0, 1350, sx0 + t, sy1)
item('shed', sx0, sy0, sx1, sy1, ov='shed', door=[1235, 1350])
covers.append(dict(id='shed', r=[sx0 + t, sy0 + t, sx1 - t, sy1 - t], ov='shed'))
# staging lot (SW): fenced, exits east (centre street) and south (road)
box(1196, 1176, 1210, 1394, 1, 0)
box(1196, 1380, 1330, 1394, 1, 0); box(1450, 1380, 1564, 1394, 1, 0)
box(1550, 1176, 1564, 1240, 1, 0); box(1550, 1370, 1564, 1394, 1, 0)
item('lot', 1196, 1176, 1564, 1394, gaps=[[1330, 1450], [1240, 1370]])
STAGE = dict(hider=[1652, 1300, math.pi / 2], seekers=[[1300, 1250, 0], [1300, 1320, 0], [1420, 1250, 0], [1420, 1320, 0], [1360, 1215, 0]])

# ---------------- C2 parking deck ----------------
PX0, PY0, PX1, PY1 = 2330, 850, 2960, 1330
decks.append(dict(id='park', rects=[[PX0, PY0, PX1, PY1], [2960, PY0, 3090, 1060]], z=DECK_Z, ov='park'))
ramps.append(dict(id='pr', r=[2980, 1060, 3090, 1370], up='n', deck='park'))
item('parking', PX0, PY0, 3090, 1370, ov='park')
box(2960, 850, 3090, 1330, 1, 1)                    # stair core + embankment under the ramp/landing
box(PX0, PY0, PX1, PY0 + 16, 1, 1)                  # lower level north wall
for x in range(2460, 2960, 160):
    for y in (1000, 1180):
        box(x - 12, y - 12, x + 12, y + 12, 1, 0)
# upper rails
box(PX0 - 8, PY0 - 8, 3098, PY0, 2, 0); box(PX0 - 8, PY0, PX0, PY1 + 8, 2, 0); box(PX0, PY1, PX1, PY1 + 8, 2, 0)
box(PX1, 1060, PX1 + 8, PY1 + 8, 2, 0); box(3090, PY0, 3098, 1060, 2, 0); box(PX1, 1052, 2980, 1060, 2, 0)
box(2972, 1060, 2980, 1370, 3, 0); box(3090, 1060, 3098, 1370, 3, 0)  # ramp side walls
covers.append(dict(id='parklow', r=[PX0, PY0 + 16, PX1, PY1], ov='park', deck=1))

# ---------------- A3 scrap yard ----------------
box(230, 1620, 520, 1800); item('scrappile', 230, 1620, 520, 1800, ov='scrap')
box(600, 1620, 680, 1700, 1, 1); item('tyres', 600, 1620, 680, 1700, ov='tyre1')
box(600, 1780, 680, 1860, 1, 1); item('tyres', 600, 1780, 680, 1860, ov='tyre2')
box(760, 1640, 860, 1740); item('digger', 760, 1640, 860, 1740, ov='digger')
box(800, 1880, 960, 1960, 1, 0); item('skip', 800, 1880, 960, 1960, ov='skip')
box(880, 1596, 990, 1676); item('office', 880, 1596, 990, 1676, ov='office')
box(230, 1880, 560, 1960); item('scrappile', 230, 1880, 560, 1960, ov='scrap2')
item('props', 186, 1576, 1014, 2014, set='scrap')

# ---------------- B3 market alleys ----------------
SHOPS_N = [(1210, 1440), (1550, 1740), (1850, 2090)]
SHOPS_S = [(1210, 1470), (1580, 1820), (1930, 2090)]
for i, (x0, x1) in enumerate(SHOPS_N): box(x0, 1590, x1, 1720); item('shops', x0, 1590, x1, 1720, ov='shopn%d' % i, face='n', seed=i)
for i, (x0, x1) in enumerate(SHOPS_S): box(x0, 1830, x1, 2000); item('shops', x0, 1830, x1, 2000, ov='shops%d' % i, face='s', seed=i + 3)
item('props', 1196, 1576, 2104, 2014, set='market')

# ---------------- C3 wash bays: three drive-through lanes ----------------
WX0, WY0, WX1, WY1 = 2420, 1660, 2990, 1900
LANES = [(2440, 2570), (2610, 2740), (2780, 2910)]
box(WX0, WY0, 2440, WY1); box(2570, WY0, 2610, WY1); box(2740, WY0, 2780, WY1); box(2910, WY0, WX1, WY1)
item('wash', WX0, WY0, WX1, WY1, ov='wash', lanes=LANES)
covers.append(dict(id='wash', r=[2440, WY0, 2910, WY1], ov='wash', lanes=LANES))
item('props', 2286, 1576, 3114, 2014, set='wash')


# ---------------- planters with trees (small solid islands that also break sight lines a little) ----------------
PLANTERS = [(1215, 820), (2085, 820), (1215, 1015), (2085, 1015), (1215, 1180), (2090, 1395), (205, 205), (3095, 205), (205, 1995), (3095, 1995),
            (1215, 205), (2085, 205), (2305, 1595), (3095, 1595), (1215, 1995), (2085, 1995), (205, 1595), (995, 1595), (205, 825), (995, 825)]
for x, y in PLANTERS:
    box(x - 17, y - 17, x + 17, y + 17, 1, 0); item('planter', x - 17, y - 17, x + 17, y + 17)

# ---------------- districts (clues) ----------------
DNAMES = [['Rail Yard', 'Loading Docks', 'Repair Row'], ['Container Yard', 'Overpass', 'Parking Deck'], ['Scrap Yard', 'Market Alleys', 'Wash Bays']]
XS, YS = [0, 1105, 2195, W], [0, 715, 1485, H]
districts = [dict(name=DNAMES[r][c], r=[XS[c], YS[r], XS[c + 1], YS[r + 1]]) for r in range(3) for c in range(3)]

# ---------------- nav graph ----------------
def clear_pt(x, y, m=34, mask=1):
    if x < m or y < m or x > W - m or y > H - m: return False
    for b in boxes:
        if not (b[4] & mask): continue
        if b[0] - m < x < b[2] + m and b[1] - m < y < b[3] + m: return False
    return True
def in_rect(x, y, r): return r[0] <= x <= r[2] and r[1] <= y <= r[3]
def on_deck(x, y, m=30):
    for d in decks:
        if all(any(in_rect(px, py, r) for r in d['rects']) for px, py in ((x, y), (x - m, y), (x + m, y), (x, y - m), (x, y + m))): return d['id']
    return None
def in_ramp(x, y):
    for rp in ramps:
        if in_rect(x, y, rp['r']): return rp
    return None
def seg_clear(a, b, mask):
    n = max(2, int(math.hypot(b[0] - a[0], b[1] - a[1]) / 14))
    for i in range(n + 1):
        t = i / n; x = a[0] + (b[0] - a[0]) * t; y = a[1] + (b[1] - a[1]) * t
        if mask == 1:
            if not clear_pt(x, y, 24, 1): return False
            if in_ramp(x, y): return False
        else:
            if not (on_deck(x, y, 22) and clear_pt(x, y, 22, 2)): return False
    return True

nodes = []   # [x, y, layer('g'|'u'|'r'), hide(0/1)]
STEP = 100
for gy in range(50, H, STEP):
    for gx in range(50, W, STEP):
        if clear_pt(gx, gy, 34, 1) and not in_ramp(gx, gy): nodes.append([gx, gy, 'g', 0])
for gy in range(25, H, 25):          # fill narrow lanes and alleys the coarse grid missed
    for gx in range(25, W, 25):
        if clear_pt(gx, gy, 32, 1) and not in_ramp(gx, gy) and all(math.hypot(n[0] - gx, n[1] - gy) > 72 for n in nodes): nodes.append([gx, gy, 'g', 0])
for d in decks:
    for r in d['rects']:
        for gy in range(r[1] + 50, r[3] - 20, 90):
            for gx in range(r[0] + 50, r[2] - 20, 90):
                if on_deck(gx, gy, 30) and not in_ramp(gx, gy) and clear_pt(gx, gy, 30, 2): nodes.append([gx, gy, 'u', 0])
for x, y in [(1557, 1305), (1390, 1387), (1470, 1305), (1390, 1300), (1745, 1292), (1840, 1292)]: nodes.append([x, y, 'g', 0])
for cv in covers:  # explicit hiding spots inside every cover
    r = cv['r']
    pts = [((r[0] + r[2]) / 2, (r[1] + r[3]) / 2)]
    if cv.get('lanes'): pts = [((a + b) / 2, (r[1] + r[3]) / 2) for a, b in cv['lanes']]
    for x, y in pts:
        nodes.append([round(x), round(y), 'g', 1])
for n in nodes:
    for cv in covers:
        if in_rect(n[0], n[1], cv['r']) and n[2] == 'g': n[3] = 1
edges = set()
def link(i, j): edges.add((min(i, j), max(i, j)))
for i, a in enumerate(nodes):
    for j in range(i + 1, len(nodes)):
        b = nodes[j]
        if a[2] != b[2]: continue
        d = math.hypot(a[0] - b[0], a[1] - b[1])
        if d > 150: continue
        if seg_clear(a, b, 1 if a[2] == 'g' else 2): link(i, j)
# ramps: foot (ground) -> mid (ramp) -> top (upper)
for rp in ramps:
    x0, y0, x1, y1 = rp['r']; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    if rp['up'] == 'e': foot, mid, top = (x0 - 50, cy), (cx, cy), (x1 + 50, cy)
    elif rp['up'] == 'w': foot, mid, top = (x1 + 50, cy), (cx, cy), (x0 - 50, cy)
    elif rp['up'] == 'n': foot, mid, top = (cx, y1 + 50), (cx, cy), (cx, y0 - 50)
    else: foot, mid, top = (cx, y0 - 50), (cx, cy), (cx, y1 + 50)
    ids = []
    for (x, y), lay in [(foot, 'g'), (mid, 'r'), (top, 'u')]:
        nodes.append([round(x), round(y), lay, 0]); ids.append(len(nodes) - 1)
    link(ids[0], ids[1]); link(ids[1], ids[2])
    for k, lay in ((0, 'g'), (2, 'u')):
        best = sorted([(math.hypot(n[0] - nodes[ids[k]][0], n[1] - nodes[ids[k]][1]), i) for i, n in enumerate(nodes) if n[2] == lay and i != ids[k]])[:3]
        for d, i in best:
            if d < 160 and seg_clear(nodes[ids[k]], nodes[i], 1 if lay == 'g' else 2): link(ids[k], i)
# connect hiding-spot nodes to anything nearby that is reachable
for i, n in enumerate(nodes):
    if n[3] and not any(i in e for e in edges):
        best = sorted([(math.hypot(m[0] - n[0], m[1] - n[1]), j) for j, m in enumerate(nodes) if j != i and m[2] == 'g'])[:6]
        for d, j in best:
            if seg_clear(n, nodes[j], 1): link(i, j)

out = dict(id='foundry', name='FOUNDRY DISTRICT', pw=W, ph=H, bx0=-220, by0=-300, bx1=3520, by1=2440, bpu=1.1, deckZ=DECK_Z,
           roads=roads, cols=COLS, rows=ROWS, boxes=boxes, items=items, covers=covers, decks=decks, ramps=ramps,
           districts=districts, stage=STAGE, nodes=nodes, edges=sorted(edges))
json.dump(out, open('/home/claude/r3d/foundry.json', 'w'), separators=(',', ':'))
print('boxes', len(boxes), 'items', len(items), 'nodes', len(nodes), 'edges', len(edges), 'covers', len(covers))
# connectivity check
adj = {i: [] for i in range(len(nodes))}
for a, b in edges: adj[a].append(b); adj[b].append(a)
seen = {0}; st = [0]
while st:
    k = st.pop()
    for j in adj[k]:
        if j not in seen: seen.add(j); st.append(j)
lost = [nodes[i] for i in range(len(nodes)) if i not in seen]
print('unreachable nodes', len(lost), lost[:12])
