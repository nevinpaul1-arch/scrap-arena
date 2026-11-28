/* ================= Delivery Run: learn the city, deliver from memory (Foundry District) ================= */
// first-playtest values, all in one place
const DRC = { preview: 4, stop: .8, pay: 30, partCost: 15, slack: 1.35, speed: 233, stopCost: 2.3, loadT: 1.1, traffic: 10, retal: .3,
  kitEvery: [18, 30], kitMax: 2, tune: { accel: 500, maxSpeed: 300, turnRate: 2.7, nitro: .5 }, route0: 20, routeStep: 12 };
// fixed addresses: building, curb or bay to stop in (zone), road layer of that zone, rooftop sign
const DR_ADDR = [
  { id: 'bakery', name: 'Red-awning bakery', icon: '🥖', zone: [1222, 2018, 1328, 2078], sign: [1275, 1915] },
  { id: 'diner', name: 'Yellow diner', icon: '🍔', zone: [1592, 2018, 1688, 2078], sign: [1640, 1915] },
  { id: 'books', name: 'Blue bookshop', icon: '📚', zone: [1712, 2018, 1808, 2078], sign: [1760, 1915] },
  { id: 'florist', name: 'Corner florist', icon: '🌷', zone: [2014, 2018, 2086, 2078], sign: [2050, 1915] },
  { id: 'pharmacy', name: 'Market pharmacy', icon: '➕', zone: [1570, 1512, 1720, 1574], sign: [1645, 1655] },
  { id: 'hardware', name: 'Hardware store', icon: '🔨', zone: [1880, 1512, 2060, 1574], sign: [1970, 1655] },
  { id: 'greengar', name: 'Green garage', icon: '🟩', zone: [2340, 566, 2455, 624], sign: [2397, 405] },
  { id: 'bluerep', name: 'Blue repair shop', icon: '🔧', zone: [2540, 566, 2655, 624], sign: [2597, 405] },
  { id: 'redbody', name: 'Red body shop', icon: '🟥', zone: [2740, 566, 2855, 624], sign: [2797, 405] },
  { id: 'tyres', name: 'Grey tyre bay', icon: '🛞', zone: [2940, 566, 3055, 624], sign: [2997, 405] },
  { id: 'bay', name: 'Warehouse loading bay', icon: '📦', zone: [1722, 426, 1828, 486], sign: [1500, 300] },
  { id: 'tanks', name: 'Silver tank farm', icon: '🛢️', zone: [2004, 410, 2100, 472], sign: [2052, 300] },
  { id: 'copper', name: 'Copper tank works', icon: '🏭', zone: [1250, 796, 1520, 838], sign: [1380, 920] },
  { id: 'pump', name: 'Pump house', icon: '💧', zone: [1790, 796, 2050, 838], sign: [1920, 915] },
  { id: 'shed', name: 'Storage shed door', icon: '🚪', zone: [1700, 1252, 1782, 1340], sign: [1930, 1290] },
  { id: 'parkroof', name: 'Parking deck roof', icon: '🅿️', zone: [2380, 900, 2600, 1010], lay: 'u', sign: [2490, 955] },
  { id: 'parklow', name: 'Parking deck, lower level', icon: '🅿️', zone: [2350, 1190, 2520, 1320], sign: [2435, 1360] },
  { id: 'wash', name: 'Yellow wash bays', icon: '🧽', zone: [2445, 1590, 2905, 1655], sign: [2675, 1780] },
  { id: 'office', name: 'Scrapyard office', icon: '🗜️', zone: [992, 1596, 1074, 1680], sign: [935, 1636] },
  { id: 'gantry', name: 'Yellow gantry crane', icon: '🏗️', zone: [872, 576, 974, 636], sign: [922, 390] },
  { id: 'gate', name: 'Container gate', icon: '🚢', zone: [952, 1082, 1062, 1152], sign: [870, 1030] }
];
const DR_DEPOT = { zone: [1250, 1205, 1500, 1365], spawn: [1375, 1300, -Math.PI / 2] };
const DR_SYM = ['▲', '●', '■', '◆', '★', '✚', '⬟', '⬢', '▼', '✦', '♥', '♣'];
const DR_COL = ['#ff5d5d', '#4da3ff', '#ffd166', '#7ae582', '#c77dff', '#ff9f43', '#5ee7df', '#f78fb3', '#e6e6e6', '#a3be8c', '#ff6b9a', '#9ad1ff'];
const DR = { phase: 'idle', t: 0, wave: 0, pk: [], done: 0, earn: 0, kits: 0, stopT: 0, stopAt: null, latched: null, limit: 0, timeLeft: 0, kitT: 20, kitsOn: [], bank: lsGet('scrapArenaDeliveryBank', 0), best: lsGet('scrapArenaDeliveryBest', { w: 0, p: 0 }), car: lsGet('scrapArenaDeliveryCar', 'cruiser'), log: [] };
const drOn = () => gameMode === 'delivery';
const zc = z => [(z[0] + z[2]) / 2, (z[1] + z[3]) / 2];
// ---- route lengths over the nav graph (for fair timers) ----
const drDist = new Map();
function drPathLen(a, b) {
  const k = a < b ? a + '|' + b : b + '|' + a; if (drDist.has(k)) return drDist.get(k);
  const p = fdPath(a, b); let d = 1e5;
  if (p) { d = 0; for (let i = 1; i < p.length; i++) d += Math.hypot(FDM.nodes[p[i]][0] - FDM.nodes[p[i - 1]][0], FDM.nodes[p[i]][1] - FDM.nodes[p[i - 1]][1]); }
  drDist.set(k, d); return d;
}
const drNode = z => { const [x, y] = zc(z.zone || z); return fdNearest(x, y, z.lay === 'u' ? 'u' : 'g'); };
function drRouteTime(stops) { // shortest order from the depot through every stop, in seconds at a normal pace
  const dn = drNode(DR_DEPOT), ns = stops.map(drNode); let best = 1e9;
  const perm = (left, at, acc) => { if (acc >= best) return; if (!left.length) { best = acc; return; } for (let i = 0; i < left.length; i++) perm(left.filter((_, j) => j !== i), left[i], acc + drPathLen(at, left[i])); };
  if (ns.length <= 7) perm(ns, dn, 0);
  else { let at = dn, left = ns.slice(); best = 0; while (left.length) { left.sort((a, b) => drPathLen(at, a) - drPathLen(at, b)); best += drPathLen(at, left[0]); at = left.shift(); } }
  return best / DRC.speed + stops.length * DRC.stopCost;
}
function drBatch(w) { // n distinct addresses: near the depot early, spread out later, route length kept comparable within a wave
  const n = w + 1, [dx, dy] = zc(DR_DEPOT.zone), reach = w === 1 ? 1050 : w === 2 ? 1650 : 1e9;
  const pool = DR_ADDR.filter(a => { const [x, y] = zc(a.zone); return Math.hypot(x - dx, y - dy) <= reach; });
  const src = pool.length >= n ? pool : DR_ADDR, target = DRC.route0 + DRC.routeStep * (w - 1);
  let best = null, bd = 1e9;
  for (let s = 0; s < 28; s++) {
    const pick = src.slice().sort(() => Math.random() - .5).slice(0, Math.min(n, src.length));
    const rt = drRouteTime(pick), d = Math.abs(rt - target) + (w <= 2 ? 0 : Math.random() * 3);
    if (d < bd) { bd = d; best = { pick, rt }; }
  }
  return best;
}
// ---- flow ----
function openDelivery() { $('drSheet').classList.remove('hidden'); renderDrSheet(); fdLoadArt(); }
function renderDrSheet() {
  const lim = Math.max(maxWave, 1); if (!CARS.some(d => d.id === DR.car && d.unlock <= lim)) DR.car = CARS[0].id;
  $('dsCars').innerHTML = CARS.map(d => { const lk = d.unlock > lim; return '<button class="bsCar' + (d.id === DR.car ? ' on' : '') + (lk ? ' lk' : '') + '" data-dcar="' + d.id + '"' + (lk ? ' disabled' : '') + '><img src="' + tileUrl(d.id) + '" alt=""><b>' + d.name + '</b><small>' + (lk ? '🔒 wave ' + d.unlock : d.tag || '') + '</small></button>'; }).join('');
  $('dsStats').innerHTML = '<span>🏦 Bank <b>$' + DR.bank + '</b></span><span>🏁 Best <b>' + (DR.best.w ? 'wave ' + DR.best.w + ' · ' + DR.best.p + ' pkgs' : '-') + '</b></span>';
}
document.addEventListener('click', e => { const b = e.target.closest('[data-dcar]'); if (b && !b.disabled) { DR.car = b.dataset.dcar; lsSet('scrapArenaDeliveryCar', DR.car); renderDrSheet(); } });
async function startDelivery() {
  if (NET.role) netLeave(true);
  if (devRun) { devRun = false; document.body.classList.remove('dev'); }
  $('drSheet').classList.add('hidden'); hrLeave(); showAgain('');
  await fdLoadArt();
  gameMode = 'delivery'; LOCAL_TEAM = false; daily = null; $('card').classList.remove('over', 'teamRes', 'spBomb');
  pname = ($('pname').value || '').trim().slice(0, 14) || 'Player'; lsSet('scrapArenaName', pname);
  const a = audio(); if (a && a.resume) a.resume(); startEngine();
  if (isTouch && fsOK && !fsEl()) setFullscreen(true);
  cars = []; debris = []; parts = []; texts = []; rings = []; pickups = []; booms = []; emotes = []; SPIKES = []; GOO = []; SMOKES = [];
  wave = 1; waveMode = 'delivery'; introT = 0; score = 0; shake = 0; gameOverT = 0; paused = false; hitStop = 0; slowT = 0; flashA = 0; hurtA = 0; combo.n = 0; combo.t = 0; kills = 0;
  setArena(FOUNDRY_IDX);
  const [sx, sy, sa] = DR_DEPOT.spawn;
  player = makeCar(sx, sy, sa, PLAYER_COL, true, 1); player.pid = PID; player.pname = pname; applyCar(player, CAR_BY_ID[DR.car] || CAR_BY_ID.cruiser); player.club = myClubId();
  Object.assign(player, DRC.tune, { mod: '', perk: '', lay: 'g' }); cars.push(player);
  drSpawnTraffic();
  Object.assign(DR, { phase: 'load', t: DRC.loadT, wave: 0, pk: [], done: 0, earn: 0, kits: 0, stopT: 0, latched: null, kitT: 14, kitsOn: [], fixed: 0, charged: 0, end: '' });
  state = 'play'; $('overlay').classList.add('hidden'); document.body.classList.add('dr'); $('drHud').classList.remove('hidden');
  snapCamera(); clearSkids(); banner('DELIVERY RUN', 'Loading your first batch at the depot...', 1300); updateHud();
}
function drLoad() { // the whole batch at once
  DR.wave++; wave = DR.wave;
  const b = drBatch(DR.wave), syms = DR_SYM.slice().sort(() => Math.random() - .5);
  DR.pk = b.pick.map((a, i) => ({ a, sym: syms[i], col: DR_COL[DR_SYM.indexOf(syms[i])], done: false }));
  DR.limit = Math.round(b.rt * DRC.slack + 1); DR.timeLeft = DR.limit; DR.route = b.rt;
  DR.phase = 'preview'; DR.t = DRC.preview; DR.latched = null;
  VIEW_K = drFitZoom(); resize(); camX = DR.cam[0]; camY = DR.cam[1]; beep(520, .08); SFX.pick && SFX.pick();
}
function drFitZoom() { // pull the camera back until the depot, every address and its label fit on screen
  const pts = [zc(DR_DEPOT.zone), ...DR.pk.map(p => zc(p.a.zone))], base = Math.min(innerWidth / VIEW_W, innerHeight / VIEW_H);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); let k = .5;
  for (let it = 0; it < 3; it++) { const px = 1 / (base * k); // world units per screen pixel at this zoom
    const w = Math.max(...xs) - Math.min(...xs) + px * 260, h = (Math.max(...ys) - Math.min(...ys)) * TK + px * (120 + 70 + 40) * TK;
    k = clamp(Math.min(innerWidth / (base * w), innerHeight / (base * h)), .14, 1); }
  const px = 1 / (base * k);
  DR.cam = [(Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2 - px * 45];
  return k;
}
function drTick(dt) {
  if (DR.phase === 'load') { DR.t -= dt; if (DR.t <= 0) drLoad(); return; }
  if (DR.phase === 'preview') { DR.t -= dt; if (DR.t <= 0) { DR.phase = 'drive'; VIEW_K = 1; resize(); banner('GO!', DR.pk.length + ' drop-offs · ' + DR.limit + ' s', 900); beep(660, .15); } return; }
  if (player && player.dead && DR.phase !== 'over') { drSettle('wreck'); return; }
  // repair kits: an occasional detour that trades time for a part
  DR.kitT -= dt; if (DR.kitT <= 0) { DR.kitT = DRC.kitEvery[0] + Math.random() * (DRC.kitEvery[1] - DRC.kitEvery[0]); if (DR.kitsOn.length < DRC.kitMax) drSpawnKit(); }
  for (const k of DR.kitsOn) { k.t += dt; if (player && !player.dead && player.lost > 0 && fdH(player) < .3 && Math.hypot(player.x - k.x, player.y - k.y) < 38) { k.got = true; const lost = PARTS.filter(q => !player.parts[q]); const q = lost[(Math.random() * lost.length) | 0]; player.parts[q] = true; player.lost--; player._key = ''; DR.kits++; addText(k.x, k.y - 30, '🔧 +1 PART', '#7ae582'); ring(k.x, k.y, 40, '#7ae582', .35, 4); beep(880, .08); updateHud(); } }
  DR.kitsOn = DR.kitsOn.filter(k => !k.got);
  if (DR.phase === 'drive') {
    DR.timeLeft -= dt;
    if (DR.timeLeft <= 0) { DR.timeLeft = 0; drSettle('time'); return; }
    drStops(dt, DR.pk.filter(p => !p.done).length ? DR_ADDR : [], false);
  } else if (DR.phase === 'return') drStops(dt, [DR_DEPOT], true);
}
function drStops(dt, list, depot) {
  const c = player; if (!c || c.dead) return;
  const sp = Math.hypot(c.vx, c.vy), lay = c.lay || 'g';
  const z = list.find(a => inRect(c.x, c.y, a.zone) && ((a.lay || 'g') === 'u' ? lay === 'u' : lay === 'g'));
  if (!z) { DR.stopT = 0; DR.latched = null; DR.stopAt = null; return; }
  if (DR.latched === z) return;                          // already handled this stop: move off and come back
  if (sp < 22) { DR.stopT += dt; DR.stopAt = z; } else { DR.stopT = Math.max(0, DR.stopT - dt * 2); }
  if (DR.stopT < DRC.stop) return;
  DR.latched = z; DR.stopT = 0;
  if (depot) { drLoad(); return; }
  const p = DR.pk.find(q => !q.done && q.a === z);
  if (!p) { addText(c.x, c.y - 40, '✗ No package for here', '#ff9f9f'); thud(.12, 120); return; }
  p.done = true; DR.done++; DR.earn += DRC.pay; score = DR.earn;
  addText(c.x, c.y - 44, p.sym + '  +$' + DRC.pay, p.col); ring(c.x, c.y, 50, p.col, .4, 5); SFX.combo && SFX.combo(3); beep(990, .07);
  if (DR.pk.every(q => q.done)) { // last drop-off stops the clock
    DR.phase = 'return'; DR.latched = null;
    banner('WAVE ' + DR.wave + ' CLEARED', Math.ceil(DR.timeLeft) + ' s to spare · head back to the depot for the next batch', 2400); SFX.win && SFX.win();
  }
}
function drSpawnKit() {
  const roads = FDM.nodes.filter(n => n[2] === 'g' && !n[3] && FDM.roads.some(r => inRect(n[0], n[1], r)));
  for (let i = 0; i < 20; i++) { const n = roads[(Math.random() * roads.length) | 0]; if (player && Math.hypot(n[0] - player.x, n[1] - player.y) < 500) continue; if (inRect(n[0], n[1], DR_DEPOT.zone)) continue; DR.kitsOn.push({ x: n[0], y: n[1], t: 0 }); return; }
}
function drSettle(why) { // pay for completed deliveries, charge for what's still broken (never more than you have)
  if (DR.phase === 'over') return;
  DR.phase = 'over'; DR.end = why;
  const cleared = DR.wave - (DR.pk.every(q => q.done) ? 0 : 1), missing = player ? player.lost : 0;
  const bill = missing * DRC.partCost, avail = DR.bank + DR.earn, charge = Math.min(bill, avail), old = DR.bank;
  DR.bank = avail - charge; lsSet('scrapArenaDeliveryBank', DR.bank);
  DR.res = { cleared, pk: DR.done, earn: DR.earn, missing, bill, charge, old, bank: DR.bank, kits: DR.kits, why };
  const nb = cleared > DR.best.w || (cleared === DR.best.w && DR.done > DR.best.p);
  if (nb) { DR.best = { w: cleared, p: DR.done }; lsSet('scrapArenaDeliveryBest', DR.best); }
  DR.res.newBest = nb;
  setTimeout(drOver, why === 'wreck' ? 1400 : 700);
}
function drOver() {
  state = 'over'; paused = false; $('pauseMenu').classList.add('hidden'); document.body.classList.remove('dr'); VIEW_K = 1; resize(); $('drHud').classList.add('hidden');
  const r = DR.res; if (!r) return;
  $('overlay').querySelector('#card h1').innerHTML = r.why === 'wreck' ? 'CAR <span>WRECKED</span>' : r.why === 'time' ? 'OUT OF <span>TIME</span>' : 'SHIFT <span>OVER</span>';
  const row = (k, v, cls) => '<div class="drRow' + (cls ? ' ' + cls : '') + '"><span>' + k + '</span><b>' + v + '</b></div>';
  $('final').innerHTML = '<div class="drRes">' + row('Waves cleared', r.cleared + (r.newBest ? ' <em>NEW BEST</em>' : '')) + row('Packages delivered', r.pk) + row('Delivery earnings', '+$' + r.earn, 'plus') +
    row('Repair kits picked up', r.kits) + row('Parts repaired at the depot', r.missing + (r.missing ? ' × $' + DRC.partCost : '')) + row('Charged for repairs', '−$' + r.charge + (r.charge < r.bill ? ' <small>(capped, you had $' + (r.old + r.earn) + ')</small>' : ''), 'minus') +
    row('Bank', '$' + r.old + ' → <b>$' + r.bank + '</b>', 'bank') + '</div><p class="drBest">Best: wave ' + DR.best.w + ' · ' + DR.best.p + ' packages</p>';
  $('card').classList.add('over'); $('card').classList.remove('teamRes', 'spBomb'); $('banner').classList.remove('show'); $('mpBack').style.display = 'none';
  showAgain('delivery', 'Delivery Run · same car');
  $('overlay').classList.remove('hidden'); renderHub();
}
function drLeave() { document.body.classList.remove('dr'); $('drHud').classList.add('hidden'); if (DR.phase !== 'over') DR.phase = 'idle'; if (drOn()) { VIEW_K = 1; resize(); } }

/* ---------- traffic: follows the roads; most just honk, a few bite back ---------- */
const DR_ROAD = { adj: null };
function drRoadGraph() {
  if (DR_ROAD.adj) return;
  const onRoad = n => n[2] === 'g' && FDM.roads.some(r => inRect(n[0], n[1], [r[0] + 18, r[1] + 18, r[2] - 18, r[3] - 18]));
  DR_ROAD.ok = FDM.nodes.map(onRoad); DR_ROAD.adj = FDM.nodes.map(() => []);
  for (const [a, b] of FDM.edges) if (DR_ROAD.ok[a] && DR_ROAD.ok[b]) { const d = Math.hypot(FDM.nodes[a][0] - FDM.nodes[b][0], FDM.nodes[a][1] - FDM.nodes[b][1]); DR_ROAD.adj[a].push([b, d]); DR_ROAD.adj[b].push([a, d]); }
  DR_ROAD.list = FDM.nodes.map((n, i) => i).filter(i => DR_ROAD.ok[i] && DR_ROAD.adj[i].length);
}
function drRoadPath(a, b) { const keep = FDNAV.adj; FDNAV.adj = DR_ROAD.adj; try { return fdPath(a, b); } finally { FDNAV.adj = keep; } }
const DR_TRAFFIC = ['cruiser', 'hauler', 'dart', 'bruiser', 'drifter', 'hauler', 'cruiser'];
function drSpawnTraffic() {
  drRoadGraph();
  const n = DRC.traffic, used = [];
  for (let i = 0; i < n; i++) {
    let node = -1;
    for (let k = 0; k < 40; k++) { const c = DR_ROAD.list[(Math.random() * DR_ROAD.list.length) | 0], p = FDM.nodes[c]; if (Math.hypot(p[0] - DR_DEPOT.spawn[0], p[1] - DR_DEPOT.spawn[1]) < 450 || used.some(u => Math.hypot(u[0] - p[0], u[1] - p[1]) < 220)) continue; node = c; break; }
    if (node < 0) continue; const p = FDM.nodes[node]; used.push(p);
    const retal = i < Math.round(n * DRC.retal), police = retal && i % 2 === 0;
    const type = police ? 'dart' : retal ? (i % 3 ? 'fortress' : 'rocket') : DR_TRAFFIC[i % DR_TRAFFIC.length];
    const c = makeCar(p[0], p[1], Math.random() * 6.28, PLAYER_COL, true, 1); applyCar(c, CAR_BY_ID[type] || CAR_BY_ID.cruiser);
    Object.assign(c, { bot: true, traffic: true, retal, police, pid: 'tr' + i, pname: '', accel: 380, maxSpeed: 230, turnRate: 2.5, cruise: 150 + Math.random() * 50, lay: 'g', tb: { path: null, pi: 0, goal: -1, stuck: 0, rev: 0, rs: 1, wait: 0 }, mad: 0, honkT: 0 });
    cars.push(c);
  }
}
function drTrafficAI(c, dt) {
  c.handbrake = false; c.boost = false;
  if (DR.phase === 'preview' || DR.phase === 'load' || state !== 'play') { c.throttle = 0; c.steer = 0; return; }
  const b = c.tb; c.honkT = Math.max(0, c.honkT - dt);
  if (c.mad > 0 && player && !player.dead) { // provoked: go after the player for a while
    c.mad -= dt; const lead = .35, tx = player.x + player.vx * lead, ty = player.y + player.vy * lead;
    hrBotSteer(c, b, tx, ty, dt); c.throttle = Math.max(c.throttle, .85); c.boost = c.nitro > .2 && Math.hypot(player.x - c.x, player.y - c.y) > 160;
    if (c.boost) c.nitro = Math.max(0, c.nitro - .6 * dt); if (c.mad <= 0) { b.path = null; emote(c, 'cool'); }
    return;
  }
  if (!b.path || b.pi >= b.path.length) {
    const start = fdNearest(c.x, c.y, 'g'), s2 = DR_ROAD.ok[start] ? start : DR_ROAD.list.reduce((m, i) => Math.hypot(FDM.nodes[i][0] - c.x, FDM.nodes[i][1] - c.y) < Math.hypot(FDM.nodes[m][0] - c.x, FDM.nodes[m][1] - c.y) ? i : m, DR_ROAD.list[0]);
    let goal = DR_ROAD.list[(Math.random() * DR_ROAD.list.length) | 0]; b.path = drRoadPath(s2, goal); b.pi = 0; if (!b.path) { b.path = null; c.throttle = 0; return; }
  }
  // follow the road, keeping to the right-hand side
  const P2 = b.path; let best = b.pi, bd = 1e9;
  for (let i = b.pi; i < Math.min(P2.length, b.pi + 6); i++) { const n = FDM.nodes[P2[i]], d = Math.hypot(n[0] - c.x, n[1] - c.y); if (d < bd) { bd = d; best = i; } }
  b.pi = bd < 70 ? best + 1 : best; if (b.pi >= P2.length) return;
  const k = Math.min(P2.length - 1, b.pi + 1), n0 = FDM.nodes[P2[b.pi]], n1 = FDM.nodes[P2[k]];
  let dx = n1[0] - n0[0], dy = n1[1] - n0[1]; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
  const tx = n0[0] - dy * 30, ty = n0[1] + dx * 30;
  // brake for anything close ahead
  const fx = Math.cos(c.a), fy = Math.sin(c.a); let blocked = false;
  for (const o of cars) { if (o === c || o.dead || Math.abs(fdH(o) - fdH(c)) > .3) continue; const rx = o.x - c.x, ry = o.y - c.y, ah = rx * fx + ry * fy, lat = Math.abs(-rx * fy + ry * fx); if (ah > 0 && ah < 105 && lat < 34) { blocked = true; break; } }
  b.cruise = c.cruise; hrBotSteer(c, b, tx, ty, dt);
  if (blocked) { c.throttle = Math.hypot(c.vx, c.vy) > 40 ? -.6 : 0; b.stuck = 0; b.wait += dt; if (b.wait > 4) { b.wait = 0; b.rev = .6; b.rs = Math.random() < .5 ? 1 : -1; } } else b.wait = 0;
}
function drBump(a, b, closing, atkA, atkB) { // traffic got hit: honk, glare, and maybe fight back
  const t = a.traffic ? a : b, o = t === a ? b : a, atk = t === a ? atkB : atkA;
  if (o !== player) return;
  if (t.honkT <= 0) { t.honkT = 1.2; beep(330, .12); setTimeout(() => beep(300, .12), 140); emote(t, 'rage'); }
  if (t.retal && atk > 95 && !(t.mad > 0)) { t.mad = 11; addText(t.x, t.y - 40, t.police ? '🚨 PULL OVER!' : 'YOU WANT SOME?', t.police ? '#9ad1ff' : '#ff9f9f'); }
}

/* ---------- drawing: curb zones + rooftop signs (always on, all addresses), kits, preview pins, HUD ---------- */
function drDrawWorld() {
  if (!drOn() || !FDI.ready) return;
  const pv = DR.phase === 'preview', active = new Set(DR.pk.filter(p => !p.done).map(p => p.a));
  ctx.save();
  for (const a of DR_ADDR) { // painted curb bay: same for every address, so it never gives the answer away
    const [x0, y0, x1, y1] = a.zone, lift = a.lay === 'u' ? FD_LIFT : 0;
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; ctx.setLineDash([12, 8]); ctx.strokeRect(x0, y0 - lift, x1 - x0, y1 - y0); ctx.setLineDash([]);
    if (DR.stopAt === a && DR.stopT > 0 && !DR.latched) { ctx.fillStyle = 'rgba(255,209,102,.18)'; ctx.fillRect(x0, y0 - lift, x1 - x0, y1 - y0); }
  }
  // depot
  { const [x0, y0, x1, y1] = DR_DEPOT.zone; ctx.strokeStyle = DR.phase === 'return' ? 'rgba(122,229,130,.9)' : 'rgba(122,229,130,.45)'; ctx.lineWidth = 5; ctx.setLineDash([18, 10]); ctx.strokeRect(x0, y0, x1 - x0, y1 - y0); ctx.setLineDash([]); }
  for (const k of DR.kitsOn) { const s = 1 + Math.sin(k.t * 5) * .08; ctx.save(); ctx.translate(k.x, k.y); ctx.scale(s, s / TK); ctx.fillStyle = 'rgba(20,24,30,.85)'; ctx.beginPath(); ctx.arc(0, 0, 17, 0, 6.283); ctx.fill(); ctx.strokeStyle = '#7ae582'; ctx.lineWidth = 3; ctx.stroke(); ctx.font = '18px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🔧', 0, 1); ctx.restore(); }
  ctx.restore();
}
function drDrawSigns() { // over the buildings
  if (!drOn() || !FDI.ready) return;
  const big = DR.phase === 'preview' ? 1 / Math.max(.3, VIEW_K) : 1;
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const a of DR_ADDR) { const [x, y] = a.sign; ctx.save(); ctx.translate(x, y - (a.lay === 'u' ? FD_LIFT : 0)); ctx.scale(big * .9, big * .9 / TK); ctx.fillStyle = 'rgba(16,18,24,.82)'; drRR(-22, -14, 44, 28, 8); ctx.fill(); ctx.font = '18px system-ui'; ctx.fillText(a.icon, 0, 1); ctx.restore(); }
  { const [x, y] = zc(DR_DEPOT.zone); ctx.save(); ctx.translate(x, y); ctx.scale(big, big / TK); ctx.fillStyle = 'rgba(16,40,24,.85)'; drRR(-48, -16, 96, 32, 9); ctx.fill(); ctx.fillStyle = '#7ae582'; ctx.font = '900 16px system-ui'; ctx.fillText('📦 DEPOT', 0, 1); ctx.restore(); }
  if (DR.phase === 'preview') for (const p of DR.pk) { // the one-time reveal: symbol + landmark on each address
    const [x, y] = zc(p.a.zone); ctx.save(); ctx.translate(x, y - (p.a.lay === 'u' ? FD_LIFT : 0)); ctx.scale(big, big / TK);
    ctx.strokeStyle = p.col; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 30, 0, 6.283); ctx.stroke();
    ctx.fillStyle = 'rgba(12,14,18,.92)'; drRR(-26, -86, 52, 44, 10); ctx.fill(); ctx.strokeStyle = p.col; ctx.lineWidth = 3; drRR(-26, -86, 52, 44, 10); ctx.stroke();
    ctx.fillStyle = p.col; ctx.font = '900 26px system-ui'; ctx.fillText(p.sym + (DR.pk.indexOf(p) + 1), 0, -63);
    ctx.font = '800 15px system-ui'; const w = ctx.measureText(p.a.name).width + 16; ctx.fillStyle = 'rgba(12,14,18,.88)'; drRR(-w / 2, -38, w, 24, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(p.a.name, 0, -25);
    ctx.restore();
  }
  ctx.restore();
}
function drRR(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function drDrawTraffic() { // police lights + a stop ring around the player
  if (!drOn()) return;
  const t = performance.now() / 1000;
  for (const c of cars) if (c.police && !c.dead) { const on = (t * 4 | 0) % 2; ctx.fillStyle = on ? 'rgba(80,140,255,.95)' : 'rgba(255,70,70,.95)'; ctx.beginPath(); ctx.arc(c.x, c.y, c.mad > 0 ? 7 : 4.5, 0, 6.283); ctx.fill(); }
  if (player && DR.stopT > 0 && !DR.latched) { const k = Math.min(1, DR.stopT / DRC.stop); ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(player.x, player.y - FD_LIFT * fdH(player), 40, -Math.PI / 2, -Math.PI / 2 + k * 6.283); ctx.stroke(); }
}
let drMiniT = 0;
function drHud(dt) {
  if (!drOn() || state !== 'play') { if (!$('drHud').classList.contains('hidden')) $('drHud').classList.add('hidden'); return; }
  $('drHud').classList.remove('hidden');
  const ph = DR.phase, me = player;
  $('drWave').textContent = 'WAVE ' + Math.max(1, DR.wave);
  $('drTime').textContent = ph === 'preview' ? 'REMEMBER ' + Math.ceil(DR.t) : ph === 'load' ? 'LOADING' : ph === 'return' ? 'BACK TO DEPOT' : DR.timeLeft.toFixed(1) + ' s';
  $('drTime').className = ph === 'drive' && DR.timeLeft < 10 ? 'low' : '';
  $('drCash').textContent = '$' + DR.earn;
  $('drPk').innerHTML = DR.pk.filter(p => !p.done).map((p, i) => '<span style="--c:' + p.col + '">' + p.sym + (DR.pk.indexOf(p) + 1) + '</span>').join('') || (ph === 'return' ? '<i>empty</i>' : '');
  if (me) { $('drParts').innerHTML = PARTS.map(q => '<i class="' + (me.parts[q] ? 'ok' : '') + '"></i>').join(''); $('drNos').firstChild.style.width = Math.round((me.nitro || 0) * 100) + '%'; }
  const bar = $('drPrev'); bar.classList.toggle('hidden', ph !== 'preview'); if (ph === 'preview') bar.firstChild.style.width = (DR.t / DRC.preview * 100) + '%';
  // a depot arrow only on the way back (no pins for addresses)
  const ar = $('drArrow'); ar.classList.toggle('hidden', ph !== 'return' || !me);
  if (ph === 'return' && me) { const [dx, dy] = zc(DR_DEPOT.zone), a = Math.atan2((dy - me.y) * TK, dx - me.x); ar.style.transform = 'translate(-50%,-50%) rotate(' + a + 'rad)'; }
}
