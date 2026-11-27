/* ================= Hide & Run: Foundry District engine (collision layers, cover, sight) + round rules + seeker bots ================= */
// first-playtest values: all together so they are easy to tune
const HRC = { head: 8, cap: 90, cam: 1.10, clues2: [25, 40, 55, 65, 80], clues1: [15, 30, 45, 60, 65, 80], tightAt: 65, tightR: 300, endT: 4.2, introT: 2.2,
  tune: { accel: 500, maxSpeed: 300, turnRate: 2.7, nitro: .5 }, botView: [480, 300], botMem: 8, notice: .4 };
const FDA = FDASSETS; // art, inlined at build time (map: FDM, defined with the arenas)
let FOUNDRY_IDX = -1;
if (FDM) { ARENA_ALL.push(FDM); FOUNDRY_IDX = ARENA_ALL.length - 1; }
const FD_LIFT = FDM ? FDM.deckZ * AR.U * Math.tan(AR.TILT * Math.PI / 180) : 0; // how far north a deck-height car is drawn
const inRect = (x, y, r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
const isFd = () => FDM && arena === FDM;
function fdLayout() { return { fixed: [], groups: [], barrels: [], oil: [], puddles: [] }; }
// ---- broad-phase grid for the boxes ----
const FDG = { cell: 200, grid: null };
if (FDM) {
  FDM.occ = FDM.boxes.filter(b => b[5] && (b[4] & 1));
  const nx = Math.ceil(FDM.pw / FDG.cell) + 1, ny = Math.ceil(FDM.ph / FDG.cell) + 1; FDG.nx = nx; FDG.grid = Array.from({ length: nx * ny }, () => []);
  for (const b of FDM.boxes) for (let gy = Math.max(0, Math.floor((b[1] - 30) / FDG.cell)); gy <= Math.min(ny - 1, Math.floor((b[3] + 30) / FDG.cell)); gy++) for (let gx = Math.max(0, Math.floor((b[0] - 30) / FDG.cell)); gx <= Math.min(nx - 1, Math.floor((b[2] + 30) / FDG.cell)); gx++) FDG.grid[gy * nx + gx].push(b);
}
const fdNear = (x, y) => FDG.grid[clamp(Math.floor(y / FDG.cell), 0, 1e4) * FDG.nx + clamp(Math.floor(x / FDG.cell), 0, FDG.nx - 1)] || [];
// ---- ramps + decks: which surface a car is on (g ground, r ramp, u upper deck) ----
function rampT(rp, x, y, raw) {
  const [x0, y0, x1, y1] = rp.r; let t = rp.up === 'e' ? (x - x0) / (x1 - x0) : rp.up === 'w' ? (x1 - x) / (x1 - x0) : rp.up === 'n' ? (y1 - y) / (y1 - y0) : (y - y0) / (y1 - y0);
  return raw ? t : clamp(t, 0, 1);
}
const fdRampAt = (x, y) => FDM.ramps.find(rp => inRect(x, y, rp.r));
const fdOnDeck = (x, y) => FDM.decks.some(d => d.rects.some(r => inRect(x, y, r)));
const fdH = c => !isFd() || !c.lay || c.lay === 'g' ? 0 : c.lay === 'u' ? 1 : (c.ramp ? rampT(c.ramp, c.x, c.y) : .5);
function fdLayer(c) {
  if (!c.lay) c.lay = 'g';
  const rp = fdRampAt(c.x, c.y);
  if (c.lay === 'g') { if (rp && rampT(rp, c.x, c.y) < .4) { c.lay = 'r'; c.ramp = rp; } }
  else if (c.lay === 'r') {
    if (!c.ramp) c.ramp = rp;
    if (!c.ramp || !inRect(c.x, c.y, c.ramp.r)) { const t = c.ramp ? rampT(c.ramp, c.x, c.y, true) : 0; c.lay = t >= .5 ? 'u' : 'g'; c.ramp = null; if (c.lay === 'u' && !fdOnDeck(c.x, c.y)) c.lay = 'g'; }
  } else if (c.lay === 'u') { if (rp) { c.lay = 'r'; c.ramp = rp; } else if (!fdOnDeck(c.x, c.y)) c.lay = 'g'; }
}
// ---- car vs boxes: three circles along the car ----
function fdCollide(c, quiet) {
  if (!isFd()) return;
  fdLayer(c);
  const mask = c.lay === 'g' ? 1 : 2, fx = Math.cos(c.a), fy = Math.sin(c.a), r = (c.cW || WD) / 2, hl = (c.cL || L) / 2;
  for (const off of [hl - r, 0, r - hl]) {
    let px = c.x + fx * off, py = c.y + fy * off;
    for (const b of fdNear(px, py)) {
      if (!(b[4] & mask)) continue;
      const qx = clamp(px, b[0], b[2]), qy = clamp(py, b[1], b[3]), dx = px - qx, dy = py - qy, d = Math.hypot(dx, dy);
      if (d >= r) continue;
      let nx, ny, pen;
      if (d < 1e-6) { const l = px - b[0], rr = b[2] - px, t = py - b[1], bb = b[3] - py, mn = Math.min(l, rr, t, bb); [nx, ny] = mn === l ? [-1, 0] : mn === rr ? [1, 0] : mn === t ? [0, -1] : [0, 1]; pen = mn + r; }
      else { nx = dx / d; ny = dy / d; pen = r - d; }
      c.x += nx * pen; c.y += ny * pen; px += nx * pen; py += ny * pen;
      const vn = c.vx * nx + c.vy * ny;
      if (vn < 0) {
        c.vx -= 1.3 * vn * nx; c.vy -= 1.3 * vn * ny;
        if (!quiet) { c.spin = clamp(c.spin - off * vn * .0012 * (fx * ny - fy * nx), -6, 6); if (-vn > 150 && !hiddenFrom(c)) { spark(qx, qy, 5, 150, '#ddd'); thud(clamp(-vn / 900, .05, .3), 95); if (c === player) shake = Math.min(10, shake - vn * .01); } }
      }
    }
  }
}
// ---- cover + line of sight ----
function fdCover(c) { if (!isFd() || (c.lay && c.lay !== 'g')) return null; for (const cv of FDM.covers) if (inRect(c.x, c.y, cv.r)) return cv; return null; }
function segBox(x0, y0, x1, y1, b) { // does the segment cross the box (slab test)
  let t0 = 0, t1 = 1; const dx = x1 - x0, dy = y1 - y0;
  for (const [p, d, lo, hi] of [[x0, dx, b[0], b[2]], [y0, dy, b[1], b[3]]]) {
    if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) return false; continue; }
    let a = (lo - p) / d, c = (hi - p) / d; if (a > c) [a, c] = [c, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, c); if (t0 > t1) return false;
  }
  return true;
}
const fdLos = (x0, y0, x1, y1) => !FDM.occ.some(b => segBox(x0, y0, x1, y1, b));
function fdSees(v, t) {
  if (!v || !t || v === t) return true;
  const ct = fdCover(t), cv = fdCover(v);
  if (ct && ct !== cv) return false;                        // under a roof or a deck: hidden from anyone outside it
  const ht = fdH(t), hv = fdH(v);
  if ((cv && cv.deck && ht > .5) || (ct && ct.deck && hv > .5)) return false;
  if (hv > .5 || ht > .5) return true;                      // up on the bridge or the parking deck: over the low stuff
  for (const o of [0, 20, -20]) if (fdLos(v.x, v.y, t.x + Math.cos(t.a) * o, t.y + Math.sin(t.a) * o)) return true;
  return false;
}
// ---- art ----
const FDI = { ready: false, bg: [], ov: {}, mini: null };
function fdLoadArt() {
  if (FDI.ready || FDI.loading || !FDA) return FDI.loading || Promise.resolve();
  const k = 1 / FDM.bpu, kt = 1 / (FDM.bpu * TK), X = px => FDM.bx0 + px * k, Y = py => FDM.by0 + py * kt;
  FDI.loading = Promise.all([
    ...FDA.bg.map(([src, x, y, w, h]) => loadImg(src).then(im => FDI.bg.push({ im, x: X(x), y: Y(y), w: w * k, h: h * kt }))),
    ...Object.entries(FDA.ov).map(([id, [src, x, y, w, h, base]]) => loadImg(src).then(im => { FDI.ov[id] = { im, x: X(x), y: Y(y), w: w * k, h: h * kt, base }; })),
    loadImg(FDA.mini).then(im => { FDI.mini = im; })
  ]).then(() => { FDI.ready = true; });
  return FDI.loading;
}
function fdDrawBg() { for (const t of FDI.bg) ctx.drawImage(t.im, t.x, t.y, t.w + .6, t.h + .6); }
function fdDrawOv(id, a) { const o = FDI.ov[id]; if (!o) return; ctx.globalAlpha = a; ctx.drawImage(o.im, o.x, o.y, o.w, o.h); ctx.globalAlpha = 1; }
const viewCar = () => player;
function fdRenderWorld(sorted) {
  const me = viewCar(), myCv = me && !me.dead ? fdCover(me) : null, list = [];
  for (const c of sorted) if (!c.lay || c.lay === 'g') list.push([c.y + 8, 0, c]);
  for (const id in FDI.ov) list.push([FDI.ov[id].base, 1, id]);
  list.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let ghost = false;
  for (const [by, t, o] of list) {
    if (t === 0) { drawCarShadow(o); drawCar(o); continue; }
    fdDrawOv(o, myCv && myCv.ov === o ? .24 : 1);
    if (me && !ghost && !myCv && by > me.y + 8 && (!me.lay || me.lay === 'g')) { const s = FDI.ov[o]; if (me.x > s.x && me.x < s.x + s.w && me.y > s.y && me.y < s.y + s.h) ghost = true; }
  }
  const up = sorted.filter(c => c.lay && c.lay !== 'g').sort((a, b) => a.y - b.y);
  for (const c of up) { ctx.save(); ctx.translate(0, -FD_LIFT * fdH(c)); drawCarShadow(c); drawCar(c); ctx.restore(); }
  if (ghost && me) { drawCar.ghost = true; try { drawCar(me); } finally { drawCar.ghost = false; } }
  hrDrawClue();
}
// local fade in/out of other cars as they leave and enter your sight
function fdVisTick(dt) {
  if (!hideOn()) return;
  const me = viewCar(), k = Math.min(1, dt * 9);
  for (const c of cars) {
    if (c === me) { c.vis = 1; continue; }
    const mate = me && c.hr && me.hr === 'seeker' && c.hr === 'seeker';
    const want = HR.phase === 'end' || HR.phase === 'final' || mate || fdSees(me, c) ? 1 : 0;
    c.vis = c.vis == null ? want : c.vis + (want - c.vis) * k;
  }
}

/* ================= navigation graph (bots) ================= */
const FDNAV = { adj: null };
if (FDM) { FDNAV.adj = FDM.nodes.map(() => []); for (const [a, b] of FDM.edges) { const A2 = FDM.nodes[a], B2 = FDM.nodes[b], d = Math.hypot(A2[0] - B2[0], A2[1] - B2[1]); FDNAV.adj[a].push([b, d]); FDNAV.adj[b].push([a, d]); } }
const layOf = c => c.lay === 'u' ? 'u' : c.lay === 'r' ? 'r' : 'g';
function fdNearest(x, y, lay) {
  let best = -1, bd = 1e9;
  FDM.nodes.forEach((n, i) => { if (n[2] !== lay && !(lay === 'r')) return; const d = Math.hypot(n[0] - x, n[1] - y) + (lay === 'g' && !fdLos(x, y, n[0], n[1]) ? 400 : 0); if (d < bd) { bd = d; best = i; } });
  return best;
}
function fdPath(a, b) { // A* over the node graph
  if (a < 0 || b < 0) return null; if (a === b) return [a];
  const N2 = FDM.nodes, h = i => Math.hypot(N2[i][0] - N2[b][0], N2[i][1] - N2[b][1]);
  const g = new Map([[a, 0]]), from = new Map(), open = [[h(a), a]], done = new Set();
  while (open.length) {
    let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
    const [, cur] = open.splice(bi, 1)[0]; if (cur === b) break; if (done.has(cur)) continue; done.add(cur);
    for (const [nb, d] of FDNAV.adj[cur]) { const ng = g.get(cur) + d; if (ng < (g.get(nb) ?? 1e12)) { g.set(nb, ng); from.set(nb, cur); open.push([ng + h(nb), nb]); } }
  }
  if (!from.has(b)) return null;
  const p = [b]; while (p[0] !== a) p.unshift(from.get(p[0])); return p;
}
const fdPt = i => FDM.nodes[i];
function fdClear(c, x, y) { // can this car drive straight there (same surface, nothing solid in between)
  const lay = layOf(c); if (lay === 'r') return false;
  const mask = lay === 'g' ? 1 : 2, dx = x - c.x, dy = y - c.y, n = Math.max(2, Math.hypot(dx, dy) / 18);
  for (let i = 1; i <= n; i++) { const px = c.x + dx * i / n, py = c.y + dy * i / n;
    if (lay === 'g' && fdRampAt(px, py)) return false;
    if (lay === 'u' && !fdOnDeck(px, py)) return false;
    for (const b of fdNear(px, py)) if ((b[4] & mask) && px > b[0] - 22 && px < b[2] + 22 && py > b[1] - 22 && py < b[3] + 22) return false; }
  return true;
}

/* ================= rules ================= */
const HR = { on: false, solo: true, phase: 'idle', t: 0, clock: 0, round: 0, order: [], hider: '', res: {}, tags: {}, clue: null, sched: [], si: 0, by: '', bots: 2, car: 'cruiser', best: 0 };
HR.bots = lsGet('scrapArenaHideBots', 2); HR.car = lsGet('scrapArenaHideCar', 'cruiser'); HR.best = lsGet('scrapArenaHideBest', 0);
const hideOn = () => gameMode === 'hide' || (mpOn() && VS.kind === 'hide');
const hrHost = () => (gameMode === 'hide' && !NET.role) || (isHost() && VS.kind === 'hide');
const hrName = pid => { const c = cars.find(o => o.pid === pid); return c ? (c.pname || 'Driver') : 'Driver'; };
const hrDistrict = (x, y) => (FDM.districts.find(d => inRect(x, y, d.r)) || FDM.districts[4]).name;
function hrTuneCar(c) { Object.assign(c, { accel: HRC.tune.accel, maxSpeed: HRC.tune.maxSpeed, turnRate: HRC.tune.turnRate, nitroEff: 1, nitro: HRC.tune.nitro, mod: '', perk: '', boostK: 1, driftK: 1, armor: 0 }); }
function hrPlace() { // every round starts from the same staging lot
  const st = FDM.stage, hider = cars.find(c => c.pid === HR.hider); let si = 0;
  for (const c of cars) {
    const p = c === hider ? st.hider : st.seekers[si++ % st.seekers.length];
    Object.assign(c, { x: p[0], y: p[1], a: p[2], vx: 0, vy: 0, spin: 0, lay: 'g', ramp: null, dead: false, lost: 0, inv: 0, hr: c === hider ? 'hider' : 'seeker', brain: null, hb: null, vis: 1 });
    for (const pt of PARTS) c.parts[pt] = true; c._key = ''; hrTuneCar(c);
  }
}
function hrStartRound() {
  HR.round++; HR.hider = HR.order[HR.round - 1]; HR.phase = 'intro'; HR.t = HRC.introT; HR.clock = 0; HR.clue = null; HR.si = 0; HR.by = '';
  const seekers = cars.length - 1; HR.sched = seekers >= 2 ? HRC.clues2.slice() : HRC.clues1.slice();
  hrPlace(); hrView(); clearSkids(); snapCamera();
  const hn = hrName(HR.hider), mine = HR.hider === PID;
  banner(mine ? 'YOU HIDE' : esc(hn) + ' HIDES', mine ? 'Stay untouched until the timer runs out.' : 'Touch the hider’s car to end the round.', 2200); beep(440, .1);
  hrNev();
}
function hrView() { // hider sees a little more of the world around the car
  const me = player; VIEW_K = me && me.hr === 'hider' ? 1 / HRC.cam : 1; resize();
  document.body.classList.toggle('hrHider', !!(me && me.hr === 'hider'));
}
function hrTick(dt) {
  if (!hrHost()) return;
  HR.t -= dt;
  if (HR.phase === 'intro' && HR.t <= 0) { HR.phase = 'head'; HR.t = HRC.head; hrNev(); }
  else if (HR.phase === 'head' && HR.t <= 0) { HR.phase = 'hunt'; HR.clock = 0; beep(660, .2); hrNev(); if (player && player.hr === 'seeker') banner('GO!', 'Find the hider. One touch ends it.', 1200); }
  else if (HR.phase === 'hunt') {
    HR.clock += dt;
    while (HR.si < HR.sched.length && HR.clock >= HR.sched[HR.si]) { hrClue(HR.sched[HR.si]); HR.si++; }
    if (HR.clock >= HRC.cap) hrEnd('');
  } else if (HR.phase === 'end' && HR.t <= 0) { if (HR.round < HR.order.length) hrStartRound(); else hrFinal(); }
}
function hrClue(at) {
  const h = cars.find(c => c.pid === HR.hider); if (!h) return;
  const name = hrDistrict(h.x, h.y);
  if (at < HRC.tightAt) { const d = FDM.districts.find(q => q.name === name); HR.clue = { k: 'd', r: d.r.slice(), name, at: HR.clock, n: HR.si + 1 }; }
  else { const a = Math.random() * 6.283, o = Math.random() * HRC.tightR * .45; HR.clue = { k: 'c', x: Math.round(h.x + Math.cos(a) * o), y: Math.round(h.y + Math.sin(a) * o), r: HRC.tightR, name, at: HR.clock, n: HR.si + 1 }; }
  if (player && player.hr === 'seeker') { banner('CLUE', 'Last seen near ' + name + (HR.clue.k === 'c' ? ' (tight)' : ''), 1500); beep(880, .08); }
  else if (player && player.hr === 'hider') addText(player.x, player.y - 46, 'Seekers got a clue: ' + name, '#ffd166');
  hrNev();
}
function hrTagCheck() { // before collisions push the cars apart: any overlap on a shared surface is a tag
  if (HR.phase !== 'hunt') return;
  const h = cars.find(c => c.pid === HR.hider); if (!h || h.dead) return;
  const hh = fdH(h);
  const hits = cars.filter(s => s !== h && !s.dead && Math.abs(fdH(s) - hh) <= .3 && Math.abs(s.x - h.x) < 70 && Math.abs(s.y - h.y) < 70 && sat(h, s));
  if (hits.length) { hits.sort((a, b) => a.id - b.id); hrEnd(hits[0].pid); }
}
function hrEnd(byPid) {
  if (HR.phase !== 'hunt') return;
  const t = Math.min(HRC.cap, HR.clock); HR.phase = 'end'; HR.t = HRC.endT; HR.by = byPid;
  HR.res[HR.hider] = { t, caught: !!byPid, by: byPid };
  if (byPid) HR.tags[byPid] = (HR.tags[byPid] || 0) + 1;
  const h = cars.find(c => c.pid === HR.hider);
  if (byPid) { const s = cars.find(c => c.pid === byPid); if (h) { ring(h.x, h.y, 70, '#ffd166', .5, 6); flashA = .25; } SFX.combo && SFX.combo(6); }
  else SFX.win && SFX.win();
  hrResultBanner(); hrNev();
}
function hrResultBanner() {
  const r = HR.res[HR.hider]; if (!r) return;
  const hn = esc(hrName(HR.hider)), t = r.t.toFixed(1) + ' s';
  if (r.caught) banner('CAUGHT', hn + ' survived ' + t + '. Tagged by ' + esc(hrName(r.by)) + '.', 3600);
  else banner('ESCAPED', hn + ' survived the full ' + HRC.cap + ' seconds.', 3600);
}
function hrStandings() { // rank once per player by survival time; equal times share a rank
  const rows = HR.order.map(pid => ({ pid, name: hrName(pid), t: HR.res[pid] ? HR.res[pid].t : 0, r: HR.res[pid], tags: HR.tags[pid] || 0 }));
  rows.sort((a, b) => b.t - a.t);
  rows.forEach((x, i) => { x.rank = i && Math.abs(rows[i - 1].t - x.t) < 1e-9 ? rows[i - 1].rank : i + 1; });
  return rows;
}
function hrFinal() {
  HR.phase = 'final'; hrNev();
  if (HR.solo) { const r = HR.res[PID]; if (r && r.t > HR.best) { HR.best = r.t; lsSet('scrapArenaHideBest', +r.t.toFixed(2)); } }
  if (mpOn()) { NET.overArmed = true; gameOverT = .4; } else setTimeout(() => hrOver(), 600);
}
function hrResultsHtml(rows) {
  const me = rows.find(x => x.pid === PID);
  return '<div class="hrRes"><div class="hrRow hd"><span>#</span><span>Driver</span><span>Survived</span><span>Result</span><span>Tags</span></div>' + rows.map(x => '<div class="hrRow' + (x.pid === PID ? ' me' : '') + '"><span>' + x.rank + '</span><span class="n">' + esc(x.name) + '</span><span class="t">' + x.t.toFixed(1) + ' s</span><span>' + (x.r ? (x.r.caught ? 'tagged by ' + esc(hrName(x.r.by)) : 'escaped') : '-') + '</span><span>' + x.tags + '</span></div>').join('') + '</div>' +
    (HR.solo && me ? '<p class="hrBest">Your best: <b>' + HR.best.toFixed(1) + ' s</b></p>' : '');
}
function hrOver(quit) {
  state = 'over'; paused = false; $('pauseMenu').classList.add('hidden'); document.body.classList.remove('hr', 'hrHider'); VIEW_K = 1; resize();
  const rows = hrStandings(), me = rows.find(x => x.pid === PID), win = me && me.rank === 1 && rows.length > 1;
  const h1 = $('overlay').querySelector('#card h1');
  h1.innerHTML = quit ? 'ROUND <span>ABANDONED</span>' : HR.solo ? (me && me.r && !me.r.caught ? 'YOU <span>ESCAPED</span>' : 'YOU WERE <span>CAUGHT</span>') : win ? 'YOU <span>WIN</span>' : 'HIDE &amp; <span>RUN</span>';
  $('final').innerHTML = quit ? '' : hrResultsHtml(rows);
  $('card').classList.add('over'); $('card').classList.remove('teamRes', 'spBomb'); $('banner').classList.remove('show'); $('mpBack').style.display = 'none';
  showAgain('hide', '👀 Hide & Run · ' + HR.bots + ' seeker' + (HR.bots > 1 ? 's' : '') + ' · same car');
  $('overlay').classList.remove('hidden'); $('hrHud').classList.add('hidden'); renderHub();
}
// ---- solo: you hide, bots seek ----
function openHide() { $('hideSheet').classList.remove('hidden'); renderHideSheet(); fdLoadArt(); }
function renderHideSheet() {
  const lim = Math.max(maxWave, 1), cars0 = CARS.filter(d => d.unlock <= lim);
  if (!cars0.some(d => d.id === HR.car)) HR.car = cars0[0].id;
  $('hsCars').innerHTML = CARS.map(d => { const lk = d.unlock > lim; return '<button class="bsCar' + (d.id === HR.car ? ' on' : '') + (lk ? ' lk' : '') + '" data-hcar="' + d.id + '"' + (lk ? ' disabled' : '') + '><img src="' + tileUrl(d.id) + '" alt=""><b>' + d.name + '</b><small>' + (lk ? '🔒 wave ' + d.unlock : d.tag || '') + '</small></button>'; }).join('');
  document.querySelectorAll('#hsBots button').forEach(b => b.classList.toggle('on', +b.dataset.n === HR.bots));
  $('hsBest').textContent = HR.best ? 'Best: ' + HR.best.toFixed(1) + ' s' : '';
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-hcar]'); if (b && !b.disabled) { HR.car = b.dataset.hcar; lsSet('scrapArenaHideCar', HR.car); renderHideSheet(); }
  const n = e.target.closest('#hsBots [data-n]'); if (n) { HR.bots = +n.dataset.n; lsSet('scrapArenaHideBots', HR.bots); renderHideSheet(); }
});
const HR_BOTN = ['Rusty', 'Dash', 'Gauge', 'Piston', 'Torque', 'Sparky'];
async function startHideSP() {
  if (NET.role) netLeave(true);
  if (devRun) { devRun = false; document.body.classList.remove('dev'); }
  $('hideSheet').classList.add('hidden');
  await fdLoadArt();
  gameMode = 'hide'; LOCAL_TEAM = false; daily = null; $('card').classList.remove('over');
  pname = ($('pname').value || '').trim().slice(0, 14) || 'Player'; lsSet('scrapArenaName', pname);
  const a = audio(); if (a && a.resume) a.resume(); startEngine();
  if (isTouch && fsOK && !fsEl()) setFullscreen(true);
  cars = []; debris = []; parts = []; texts = []; rings = []; pickups = []; booms = []; emotes = []; SPIKES = []; GOO = []; SMOKES = [];
  wave = 1; waveMode = 'hide'; introT = 0; score = 0; shake = 0; gameOverT = 0; paused = false; hitStop = 0; slowT = 0; flashA = 0; hurtA = 0; combo.n = 0; combo.t = 0; kills = 0;
  setArena(FOUNDRY_IDX);
  player = makeCar(0, 0, 0, PLAYER_COL, true, 1); player.pid = PID; player.pname = pname; applyCar(player, CAR_BY_ID[HR.car] || CAR_BY_ID.cruiser); player.club = myClubId();
  cars.push(player);
  for (let i = 0; i < HR.bots; i++) { const d = CARS[(i * 3 + 1) % 3], b = makeCar(0, 0, 0, d.col || PLAYER_COL, true, 1); applyCar(b, d); Object.assign(b, { bot: true, pid: 'bot' + i, pname: HR_BOTN[i], diff: 1 }); cars.push(b); }
  Object.assign(HR, { solo: true, round: 0, order: [PID], res: {}, tags: {}, phase: 'idle' });
  state = 'play'; $('overlay').classList.add('hidden'); document.body.classList.add('hr'); $('hrHud').classList.remove('hidden');
  hrStartRound(); updateHud();
}
function hrLeave() { document.body.classList.remove('hr', 'hrHider'); VIEW_K = 1; resize(); $('hrHud').classList.add('hidden'); $('hrCover').classList.add('hidden'); HR.phase = 'idle'; }

/* ================= HUD: timer, role, clue, minimap, seeker blackout ================= */
let hrMiniT = 0;
function hrHud(dt) {
  if (!hideOn() || state !== 'play') { if (!$('hrHud').classList.contains('hidden')) { $('hrHud').classList.add('hidden'); $('hrCover').classList.add('hidden'); } return; }
  $('hrHud').classList.remove('hidden');
  const me = player, role = me ? me.hr : '', ph = HR.phase;
  const cover = role === 'seeker' && (ph === 'head' || ph === 'intro');
  $('hrCover').classList.toggle('hidden', !cover);
  if (cover) $('hrCoverN').textContent = Math.max(0, Math.ceil(HR.t + (ph === 'intro' ? HRC.head : 0)));
  if (me) $('hrNos').firstChild.style.width = Math.round((me.nitro || 0) * 100) + '%';
  $('hrRole').textContent = role === 'hider' ? 'HIDER' : 'SEEKER'; $('hrRole').className = role === 'hider' ? 'hider' : 'seeker';
  $('hrClock').textContent = ph === 'head' ? 'HEAD START ' + Math.ceil(HR.t) : ph === 'intro' ? 'GET READY' : (Math.min(HRC.cap, HR.clock)).toFixed(1) + ' s';
  const cl = HR.clue;
  $('hrClue').innerHTML = ph === 'hunt' && cl ? '🔎 Last seen near <b>' + esc(cl.name) + '</b> · ' + Math.max(0, Math.round(HR.clock - cl.at)) + ' s ago' + (cl.k === 'c' ? ' · tight' : '') :
    ph === 'hunt' && role === 'seeker' ? 'First clue at ' + (HR.sched[0] || 0) + ' s' : ph === 'head' && role === 'hider' ? 'Seekers release in ' + Math.ceil(HR.t) : '';
  $('hrSub').textContent = HR.order.length > 1 ? 'Round ' + HR.round + '/' + HR.order.length + ' · ' + hrName(HR.hider) + ' hides' : (HR.best ? 'Best ' + HR.best.toFixed(1) + ' s' : '');
  hrMiniT -= dt; if (hrMiniT <= 0) { hrMiniT = .1; hrMini(); }
}
function hrMini() {
  const cv = $('hrMini'), g = cv.getContext('2d'); if (!FDI.mini) return;
  const w = cv.width, h = cv.height, X = x => (x - FDM.bx0) / (FDM.bx1 - FDM.bx0) * w, Y = y => (y - FDM.by0) / (FDM.by1 - FDM.by0) * h;
  g.clearRect(0, 0, w, h); g.drawImage(FDI.mini, 0, 0, w, h);
  const cl = HR.clue;
  if (cl && HR.phase === 'hunt') { g.strokeStyle = '#ffd166'; g.fillStyle = 'rgba(255,209,102,.22)'; g.lineWidth = 2; g.setLineDash([5, 4]);
    if (cl.k === 'd') { g.fillRect(X(cl.r[0]), Y(cl.r[1]), X(cl.r[2]) - X(cl.r[0]), Y(cl.r[3]) - Y(cl.r[1])); g.strokeRect(X(cl.r[0]), Y(cl.r[1]), X(cl.r[2]) - X(cl.r[0]), Y(cl.r[3]) - Y(cl.r[1])); }
    else { g.beginPath(); g.ellipse(X(cl.x), Y(cl.y), cl.r / (FDM.bx1 - FDM.bx0) * w, cl.r / (FDM.by1 - FDM.by0) * h, 0, 0, 6.283); g.fill(); g.stroke(); }
    g.setLineDash([]); }
  for (const c of cars) {
    const mine = c === player, mate = player && c.hr === 'seeker' && player.hr === 'seeker';
    if (!mine && !(mate) && !(HR.phase === 'end' || HR.phase === 'final')) continue;
    g.fillStyle = mine ? '#fff' : c.hr === 'hider' ? '#ff5d8f' : '#4da3ff'; g.strokeStyle = '#000'; g.lineWidth = 1.5;
    g.beginPath(); g.arc(X(c.x), Y(c.y), mine ? 4.5 : 3.5, 0, 6.283); g.fill(); g.stroke();
  }
}
function hrDrawClue() { // the clue area on the ground, so seekers can read it at street level too
  const cl = HR.clue; if (!cl || HR.phase !== 'hunt' || !player || player.hr !== 'seeker') return;
  ctx.save(); ctx.strokeStyle = 'rgba(255,209,102,.55)'; ctx.lineWidth = 6; ctx.setLineDash([26, 18]);
  if (cl.k === 'd') ctx.strokeRect(cl.r[0] + 6, cl.r[1] + 6, cl.r[2] - cl.r[0] - 12, cl.r[3] - cl.r[1] - 12); else { ctx.beginPath(); ctx.arc(cl.x, cl.y, cl.r, 0, 6.283); ctx.stroke(); }
  ctx.restore();
}

/* ================= seeker bots ================= */
const HR_WATCH = [[1650, 715], [1105, 1485], [2195, 715], [1105, 715], [2195, 1485], [1650, 1485]];
function hrBotAI(c, dt) {
  const b = c.hb || (c.hb = { path: null, pi: 0, goal: -1, mode: 'patrol', last: null, seen: new Set(), stuck: 0, rev: 0, rs: 1, repath: 0, wi: cars.indexOf(c), clueN: 0 });
  c.handbrake = false; c.boost = false;
  if (c.testGoal != null && state === 'play' && (HR.phase === 'hunt' || (HR.phase === 'head' && c.hr === 'hider'))) { // dev: drive to a node (travel-time checks)
    if (b.goal !== c.testGoal || !b.path) { b.goal = c.testGoal; b.path = fdPath(fdNearest(c.x, c.y, layOf(c) === 'r' ? 'g' : layOf(c)), b.goal); b.pi = 0; }
    if (!b.path || b.pi >= b.path.length) { c.throttle = 0; c.steer = 0; c.handbrake = true; c.testDone = true; return; }
    const p = hrFollow(c, b); if (!p) { c.testDone = true; c.throttle = 0; return; }
    hrBotSteer(c, b, p[0], p[1], dt); return;
  }
  if (state !== 'play' || HR.phase !== 'hunt' || c.hr !== 'seeker') { c.throttle = 0; c.steer = 0; c.handbrake = HR.phase !== 'hunt'; return; }
  const h = cars.find(o => o.pid === HR.hider), now = HR.clock;
  // perception: same rules as a person's view (roofs, walls, decks) inside a screen-sized box
  const inView = h && Math.abs(h.x - c.x) < HRC.botView[0] && Math.abs(h.y - c.y) < HRC.botView[1] && fdSees(c, h);
  b.spot = inView ? (b.spot || 0) + dt : 0;
  const sees = inView && (b.spot > HRC.notice || Math.hypot(h.x - c.x, h.y - c.y) < 200 || b.mode === 'chase');
  if (sees) b.last = { x: h.x, y: h.y, lay: layOf(h), t: now, vx: h.vx, vy: h.vy };
  if (HR.clue && HR.clue.n !== b.clueN) { b.clueN = HR.clue.n; b.seen.clear(); if (b.mode !== 'chase') { b.mode = 'clue'; b.path = null; } }
  let tx, ty;
  if (sees && layOf(c) === layOf(h) && layOf(c) !== 'r' && fdClear(c, h.x, h.y)) {
    const lead = Math.min(.45, Math.hypot(h.x - c.x, h.y - c.y) / 700); tx = h.x + h.vx * lead; ty = h.y + h.vy * lead; b.mode = 'chase'; b.path = null;
    c.boost = c.nitro > .15 && Math.hypot(h.x - c.x, h.y - c.y) > 220;
  } else {
    if (sees) { b.mode = 'chase'; if (b.repath <= 0) { b.goal = fdNearest(h.x, h.y, layOf(h) === 'r' ? 'g' : layOf(h)); b.path = null; b.repath = .6; } }
    else if (b.mode === 'chase' && b.last && now - b.last.t < HRC.botMem) { if (!b.path) { b.goal = fdNearest(b.last.x + b.last.vx * .8, b.last.y + b.last.vy * .8, b.last.lay === 'r' ? 'g' : b.last.lay); } }
    else if (b.mode === 'chase') { b.mode = HR.clue ? 'clue' : 'patrol'; b.path = null; }
    b.repath -= dt;
    if (!b.path || b.pi >= b.path.length) {
      if (b.path && b.pi >= b.path.length && b.goal >= 0) b.seen.add(b.goal);
      if (b.mode !== 'chase' || !b.path) b.goal = hrBotGoal(c, b);
      const start = fdNearest(c.x, c.y, layOf(c) === 'r' ? 'g' : layOf(c));
      b.path = fdPath(start, b.goal); b.pi = 0; if (!b.path) { b.seen.add(b.goal); b.path = null; c.throttle = .4; return; }
    }
    const p = hrFollow(c, b) || fdPt(b.path[b.path.length - 1]); tx = p[0]; ty = p[1];
    if (b.mode === 'chase' && b.last && b.pi >= b.path.length) { b.mode = 'search'; b.path = null; }
    c.boost = c.nitro > .4 && b.mode === 'chase';
  }
  b.cruise = b.mode === 'chase' ? 0 : 235; // searching drivers look around instead of flooring it
  hrBotSteer(c, b, tx, ty, dt);
  if (c.boost) c.nitro = Math.max(0, c.nitro - .85 * dt);
  const sp = Math.hypot(c.vx, c.vy); if (c.slip > 110 && sp > 140) c.nitro = Math.min(1, c.nitro + .2 * dt);
}
function hrFollow(c, b) { // progress along the path: snap to the nearest of the next few nodes, then look ahead
  const P2 = b.path; let best = b.pi, bd = 1e9;
  for (let i = b.pi; i < Math.min(P2.length, b.pi + 8); i++) { const n = fdPt(P2[i]), d = Math.hypot(n[0] - c.x, n[1] - c.y); if (d < bd) { bd = d; best = i; } }
  b.pi = best; if (bd < 80) b.pi = best + 1;
  if (b.pi >= P2.length) return null;
  let k = b.pi; while (k + 1 < P2.length && Math.hypot(fdPt(P2[k + 1])[0] - c.x, fdPt(P2[k + 1])[1] - c.y) < 320 && fdClear(c, fdPt(P2[k + 1])[0], fdPt(P2[k + 1])[1])) k++;
  return fdPt(P2[k]);
}
function hrBotGoal(c, b) { // where to look next
  const N2 = FDM.nodes, others = cars.filter(o => o !== c && o.hb && o.hb.goal >= 0).map(o => N2[o.hb.goal]);
  const free = i => !b.seen.has(i) && others.every(p => Math.hypot(p[0] - N2[i][0], p[1] - N2[i][1]) > 260);
  const pick = list => { list = list.filter(e => free(e[0])); if (!list.length) return -1; list.sort((a, z) => a[1] - z[1]); return list[Math.min(list.length - 1, (Math.random() * Math.min(4, list.length)) | 0)][0]; };
  const dist = i => Math.hypot(N2[i][0] - c.x, N2[i][1] - c.y);
  let g = -1;
  if (b.mode === 'search' && b.last) { const L2 = b.last; g = pick(N2.map((n, i) => [i, Math.hypot(n[0] - L2.x, n[1] - L2.y)]).filter(([i, d]) => d < 520 && d > 80).map(([i, d]) => [i, d - (N2[i][3] ? 250 : 0) + Math.random() * 120])); if (g < 0) b.mode = HR.clue ? 'clue' : 'patrol'; }
  if (g < 0 && HR.clue) {
    const cl = HR.clue, inC = n => cl.k === 'd' ? inRect(n[0], n[1], cl.r) : Math.hypot(n[0] - cl.x, n[1] - cl.y) < cl.r;
    g = pick(N2.map((n, i) => [i, n]).filter(([i, n]) => inC(n)).map(([i, n]) => [i, dist(i) - (n[3] ? 260 : 0) - (n[2] === 'u' ? 80 : 0) + Math.random() * 800]));
    if (g < 0) { b.seen.clear(); }
  }
  if (g < 0 && !HR.clue && b.wi >= 0 && !b.watched) { b.watched = true; const w = HR_WATCH[(b.wi - 1 + HR_WATCH.length) % HR_WATCH.length]; g = fdNearest(w[0], w[1], 'g'); }
  if (g < 0) g = pick(N2.map((n, i) => [i, n]).filter(([i, n]) => n[2] !== 'r').map(([i, n]) => [i, Math.abs(dist(i) - 700) + (n[3] ? -300 : 0) + Math.random() * 900]));
  if (g < 0) { b.seen.clear(); g = (Math.random() * N2.length) | 0; }
  return g;
}
function hrBotSteer(c, b, tx, ty, dt) {
  const sp = Math.hypot(c.vx, c.vy), d = Math.hypot(tx - c.x, ty - c.y);
  if (b.rev > 0) { b.rev -= dt; c.throttle = -1; c.steer = b.rs; return; }
  if (sp < 28 && Math.abs(c.throttle) > .2) b.stuck += dt; else b.stuck = Math.max(0, b.stuck - dt);
  if (b.stuck > .7) { b.stuck = 0; b.rev = .75; const side = wrap(Math.atan2(ty - c.y, tx - c.x) - c.a); b.rs = side > 0 ? -1 : 1; b.path = null; return; }
  const diff = wrap(Math.atan2(ty - c.y, tx - c.x) - c.a), ad = Math.abs(diff);
  c.steer = clamp(diff * 2.6, -1, 1);
  if (ad > 2.3 && d < 200 && sp < 120) { c.throttle = -1; c.steer = -c.steer; return; }
  // never orbit a point: the turning circle at this speed must fit inside the distance
  const turnR = sp / (c.turnRate || 2.7), want = ad > .35 ? clamp(d * (c.turnRate || 2.7) * .55 / Math.max(.35, Math.sin(Math.min(ad, 1.5))), 70, 330) : 999;
  const cap = b.cruise ? Math.min(want, b.cruise) : want;
  c.throttle = sp > cap + 20 ? -.7 : sp > cap ? 0 : ad > 1.3 ? .5 : 1;
  c.handbrake = ad > 1.1 && sp > 210 && turnR > d * .6;
}

/* ================= online: host runs the rules, guests mirror them ================= */
const HR_PH = ['idle', 'intro', 'head', 'hunt', 'end', 'final'];
function hrPack() {
  const cl = HR.clue;
  return [HR_PH.indexOf(HR.phase), +HR.t.toFixed(2), +HR.clock.toFixed(2), HR.round, HR.hider, HR.by, cl ? (cl.k === 'd' ? ['d', cl.r, cl.name, +cl.at.toFixed(1), cl.n] : ['c', cl.x, cl.y, cl.r, cl.name, +cl.at.toFixed(1), cl.n]) : 0,
    HR.order, Object.entries(HR.res).map(([p, r]) => [p, +r.t.toFixed(3), r.caught ? 1 : 0, r.by || '']), Object.entries(HR.tags), HR.sched];
}
function hrApply(a) {
  const prev = { ph: HR.phase, round: HR.round, cn: HR.clue ? HR.clue.n : 0, hider: HR.hider };
  HR.phase = HR_PH[a[0]] || 'idle'; HR.t = a[1]; HR.clock = a[2]; HR.round = a[3]; HR.hider = a[4]; HR.by = a[5];
  const c = a[6]; HR.clue = !c ? null : c[0] === 'd' ? { k: 'd', r: c[1], name: c[2], at: c[3], n: c[4] } : { k: 'c', x: c[1], y: c[2], r: c[3], name: c[4], at: c[5], n: c[6] };
  HR.order = a[7]; HR.res = Object.fromEntries(a[8].map(([p, t, cg, by]) => [p, { t, caught: !!cg, by }])); HR.tags = Object.fromEntries(a[9]); HR.sched = a[10] || [];
  HR.solo = false; document.body.classList.add('hr');
  for (const car of cars) car.hr = car.pid === HR.hider ? 'hider' : 'seeker';
  if (prev.hider !== HR.hider || prev.round !== HR.round) { hrView(); snapCamera(); clearSkids(); }
  if (prev.round !== HR.round && HR.phase === 'intro') { const mine = HR.hider === PID, hn = hrName(HR.hider); banner(mine ? 'YOU HIDE' : esc(hn) + ' HIDES', mine ? 'Stay untouched until the timer runs out.' : 'Touch the hider’s car to end the round.', 2200); beep(440, .1); }
  if (prev.ph === 'head' && HR.phase === 'hunt') { beep(660, .2); if (player && player.hr === 'seeker') banner('GO!', 'Find the hider. One touch ends it.', 1200); }
  if (HR.clue && HR.clue.n !== prev.cn && HR.phase === 'hunt') { if (player && player.hr === 'seeker') { banner('CLUE', 'Last seen near ' + HR.clue.name + (HR.clue.k === 'c' ? ' (tight)' : ''), 1500); beep(880, .08); } else if (player) addText(player.x, player.y - 46, 'Seekers got a clue: ' + HR.clue.name, '#ffd166'); }
  if (prev.ph === 'hunt' && HR.phase === 'end') { hrResultBanner(); if (HR.by) SFX.combo && SFX.combo(6); else SFX.win && SFX.win(); }
}
function hrNetStart() { // host: called from netStartGame once the cars exist
  setArena(FOUNDRY_IDX); fdLoadArt();
  const order = cars.filter(c => c.isPlayer && !c.bot).map(c => c.pid);
  for (let i = order.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [order[i], order[j]] = [order[j], order[i]]; }
  Object.assign(HR, { solo: false, round: 0, order, res: {}, tags: {}, phase: 'idle' });
  waveMode = 'hide'; wave = 1; document.body.classList.add('hr');
  hrStartRound();
}
function hrNetResults(r) { // everyone: the final standings from the host
  const h = r.hr; if (!h) return false;
  hrApply(h); const rows = hrStandings(), me = rows.find(x => x.pid === PID);
  $('overlay').querySelector('#card h1').innerHTML = me && me.rank === 1 ? 'YOU <span>WIN</span>' : 'HIDE &amp; <span>RUN</span>';
  $('final').innerHTML = hrResultsHtml(rows); document.body.classList.remove('hr', 'hrHider'); VIEW_K = 1; resize(); $('hrHud').classList.add('hidden');
  $('card').classList.add('over'); $('card').classList.remove('teamRes', 'spBomb'); $('overlay').classList.remove('hidden');
  if (NET.ws) { $('mpBack').style.display = ''; } else $('mpBack').style.display = 'none';
  return true;
}
