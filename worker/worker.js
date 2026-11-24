// Scrap Arena — Cloudflare Worker: serves the game from GitHub + leaderboard/daily API (D1 binding: DB)
const SRC = 'https://raw.githubusercontent.com/nevinpaul1-arch/scrap-arena/main/index.html';
const TZ = 'America/Toronto';
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' };

const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...CORS } });

function dayStr(t = Date.now()) {
  // YYYY-MM-DD in Toronto time
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t));
}
function nextResetMs() {
  // ms until next Toronto midnight (step forward in 1-min increments from a coarse guess)
  const now = Date.now(), today = dayStr(now);
  let lo = now, hi = now + 26 * 3600e3;
  while (hi - lo > 1000) { const mid = (lo + hi) / 2; if (dayStr(mid) === today) lo = mid; else hi = mid; }
  return Math.round(hi - now);
}
function weekStartTs() {
  // Monday 00:00 Toronto of the current week (approx via day stepping)
  let t = Date.now();
  for (let i = 0; i < 7; i++) {
    const wd = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(new Date(t));
    if (wd === 'Mon') break;
    t -= 864e5;
  }
  const d = dayStr(t);
  let lo = t - 864e5, hi = t;
  while (hi - lo > 1000) { const mid = (lo + hi) / 2; if (dayStr(mid) < d) lo = mid; else hi = mid; }
  return Math.round(hi);
}
async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].slice(0, 8).map(x => x.toString(16).padStart(2, '0')).join('');
}
const cleanName = n => String(n || '').replace(/[^\p{L}\p{N} _.\-]/gu, '').trim().slice(0, 12);

async function top(env, mode, period, day, pid) {
  let where = 'mode = ?1', args = [mode];
  if (mode === 'daily') { where += ' AND day = ?2'; args.push(day); }
  else if (period === 'week') { where += ' AND ts >= ?2'; args.push(weekStartTs()); }
  // best score per player
  const rows = (await env.DB.prepare(
    'SELECT name, MAX(score) AS score, wave, car, pid FROM scores WHERE ' + (where) + ' GROUP BY pid ORDER BY score DESC LIMIT 20'
  ).bind(...args).all()).results.map(r => ({ name: r.name, score: r.score, wave: r.wave, car: r.car, me: r.pid === pid || undefined }));
  const total = (await env.DB.prepare('SELECT COUNT(DISTINCT pid) AS n FROM scores WHERE ' + (where)).bind(...args).first()).n;
  let mine = null;
  if (pid) {
    const best = await env.DB.prepare('SELECT MAX(score) AS s FROM scores WHERE ' + (where) + ' AND pid = ?' + (args.length + 1)).bind(...args, pid).first();
    if (best && best.s != null) {
      const above = await env.DB.prepare('SELECT COUNT(*) AS n FROM (SELECT MAX(score) AS s FROM scores WHERE ' + (where) + ' GROUP BY pid) WHERE s > ?' + (args.length + 1)).bind(...args, best.s).first();
      mine = { rank: above.n + 1, score: best.s };
    }
  }
  return { rows, total, mine };
}

let ICE_CACHE = null;
async function api(req, env, url) {
  const p = url.pathname;
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (p === '/api/ice') { // WebRTC servers: Cloudflare TURN when a key is set up, otherwise free STUN only
    const stun = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }];
    if (!env.TURN_KEY_ID || !env.TURN_KEY_TOKEN) return json({ iceServers: stun });
    if (ICE_CACHE && ICE_CACHE.exp > Date.now()) return json({ iceServers: ICE_CACHE.v });
    try {
      const r = await fetch('https://rtc.live.cloudflare.com/v1/turn/keys/' + env.TURN_KEY_ID + '/credentials/generate-ice-servers', { method: 'POST', headers: { authorization: 'Bearer ' + env.TURN_KEY_TOKEN, 'content-type': 'application/json' }, body: JSON.stringify({ ttl: 86400 }) });
      const d = await r.json();
      const v = (d.iceServers || []).map(x => Object.assign({}, x, { urls: [].concat(x.urls || []).filter(u => !/:53(\?|$)/.test(u)) })).filter(x => x.urls.length);
      if (!v.length) return json({ iceServers: stun });
      ICE_CACHE = { v, exp: Date.now() + 6 * 3600e3 }; return json({ iceServers: v });
    } catch (e) { return json({ iceServers: stun }); }
  }
  if (p === '/api/daily') {
    const day = dayStr(), y = dayStr(Date.now() - 864e5);
    const yt = (await env.DB.prepare('SELECT name, MAX(score) AS score FROM scores WHERE mode=\'daily\' AND day=?1 GROUP BY pid ORDER BY score DESC LIMIT 1').bind(y).first()) || null;
    return json({ day, resetMs: nextResetMs(), yesterday: yt });
  }
  if (p === '/api/top') {
    const mode = url.searchParams.get('mode') === 'daily' ? 'daily' : 'waves';
    const period = url.searchParams.get('period') === 'week' ? 'week' : 'all';
    const day = url.searchParams.get('day') || dayStr();
    const pid = (url.searchParams.get('pid') || '').slice(0, 40);
    return json(await top(env, mode, period, day, pid));
  }
  if (p === '/api/score' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
    const mode = b.mode === 'daily' ? 'daily' : 'waves';
    const name = cleanName(b.name) || 'Driver';
    const pid = String(b.pid || '').replace(/[^a-z0-9]/gi, '').slice(0, 40);
    const score = Math.floor(+b.score), wave = Math.floor(+b.wave), ms = Math.floor(+b.ms || 0), kills = Math.floor(+b.kills || 0);
    if (pid.length < 8) return json({ error: 'pid' }, 400);
    if (!(score >= 0 && score < 5e6 && wave >= 1 && wave < 500)) return json({ error: 'range' }, 400);
    // plausibility: score ceiling grows with waves reached; runs can't be faster than ~12 s per wave
    if (score > 9000 * wave + 3000) return json({ error: 'implausible' }, 422);
    if (ms && ms < 8000 * (wave - 1)) return json({ error: 'implausible' }, 422);
    let day = null;
    if (mode === 'daily') {
      day = String(b.day || '');
      const ok = [dayStr(), dayStr(Date.now() - 3 * 3600e3)]; // small grace past midnight
      if (!ok.includes(day)) return json({ error: 'day' }, 400);
      if (wave > 5) return json({ error: 'range' }, 400);
    }
    const iph = await sha((req.headers.get('cf-connecting-ip') || '') + '|sa');
    const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE iph = ?1 AND ts > ?2').bind(iph, Date.now() - 3600e3).first();
    if (recent.n >= 30) return json({ error: 'slow down' }, 429);
    const r = await env.DB.prepare(
      'INSERT OR IGNORE INTO scores (mode, day, name, pid, score, wave, car, kills, ms, ts, iph) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)'
    ).bind(mode, day, name, pid, score, wave, String(b.car || '').slice(0, 16), kills, ms, Date.now(), iph).run();
    const counted = r.meta.changes > 0;
    const board = await top(env, mode, 'all', day, pid);
    return json({ ok: true, counted, ...board });
  }
  return json({ error: 'not found' }, 404);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/room/')) {
      try { return await api(req, env, url); } catch (e) { return json({ error: 'server', detail: String(e).slice(0, 200) }, 500); }
    }
    // multiplayer rooms: /api/room/ABCD/ws -> one Durable Object per room code
    const rm = url.pathname.match(/^\/api\/room\/([A-Z]{4})\/ws$/);
    if (rm) return env.ROOMS.get(env.ROOMS.idFromName(rm[1])).fetch(req);
    // previews: /dev/ -> dev branch, /mp/ -> multiplayer branch (uncached); / -> main. Each also serves its app files.
    const pm = url.pathname.match(/^(\/dev|\/mp)?(\/.*)?$/) || [];
    const pre = pm[1] || '', rest = pm[2] || '';
    const branch = pre === '/dev' ? 'dev' : pre === '/mp' ? 'multiplayer' : 'main', isDev = branch !== 'main';
    if (pre && !rest) return Response.redirect(url.origin + pre + '/' + url.search, 302);
    const sm = rest.match(/^\/(manifest\.webmanifest|sw\.js|icons\/[a-z0-9-]+\.png)$/);
    if (sm) {
      const f = sm[1], ct = f.endsWith('.png') ? 'image/png' : f.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'application/manifest+json';
      const fr = await fetch(SRC.replace('/main/index.html', '/' + branch + '/pwa/' + f) + (isDev ? '?t=' + Date.now() : ''), isDev ? { cf: { cacheTtl: 0 } } : { cf: { cacheTtl: 300, cacheEverything: true } });
      if (!fr.ok) return new Response('not found', { status: 404 });
      return new Response(fr.body, { headers: { 'content-type': ct, 'cache-control': (f === 'sw.js' || isDev) ? 'no-cache' : 'public, max-age=3600', 'x-content-type-options': 'nosniff' } });
    }
    if (rest !== '/' && rest !== '/index.html') return Response.redirect(url.origin + pre + '/', 302);
    const r = await fetch(isDev ? SRC.replace('/main/', '/' + branch + '/') + '?t=' + Date.now() : SRC, isDev ? { cf: { cacheTtl: 0 } } : { cf: { cacheTtl: 120, cacheEverything: true } });
    if (!r.ok) return new Response('Game temporarily unavailable', { status: 502 });
    return new Response(r.body, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': isDev ? 'no-store' : 'public, max-age=60', 'x-content-type-options': 'nosniff' } });
  }
};

// ---------- multiplayer room: lobby + relay. The host's browser runs the game; this object only passes messages. ----------
// Phones drop connections (app switch, network change, screen lock), so a dropped player keeps their place for a while
// and can reconnect into the same match. The room record lives in storage so it survives the object sleeping.
const MAX_PLAYERS = 4, MAX_CAP = 6; // older pages don't send max/cmax, so they keep 4
const HOST_GRACE = 30000, GUEST_GRACE = 30000;
export class Room {
  constructor(ctx, env) { this.ctx = ctx; this.R = null; ctx.blockConcurrencyWhile(async () => { this.R = (await ctx.storage.get('R')) || null; }); }
  async save() { if (this.R) await this.ctx.storage.put('R', this.R); else await this.ctx.storage.delete('R'); await this.plan(); }
  async plan() { // next alarm = earliest grace deadline
    const R = this.R; let t = 0;
    if (R) { if (R.hostAway) t = R.hostAway + HOST_GRACE; for (const k in R.away || {}) { const d = R.away[k].t + GUEST_GRACE; if (!t || d < t) t = d; } }
    if (t) await this.ctx.storage.setAlarm(t); else await this.ctx.storage.deleteAlarm();
  }
  peers() { return this.ctx.getWebSockets().map(ws => ({ ws, me: ws.deserializeAttachment() || {} })).filter(p => !p.me.dead); }
  hostPeer() { const R = this.R; return R ? this.peers().find(p => p.me.pid === R.hostPid) : null; }
  lobby(extra) {
    const R = this.R; if (!R) return;
    const ps = this.peers(), seen = new Set(), players = [];
    for (const p of ps) { if (seen.has(p.me.pid)) continue; seen.add(p.me.pid); players.push({ pid: p.me.pid, name: p.me.name, car: p.me.car, host: p.me.pid === R.hostPid }); }
    if (R.hostAway && !seen.has(R.hostPid)) { seen.add(R.hostPid); players.unshift({ pid: R.hostPid, name: R.hostName, car: R.hostCar, host: true, away: true }); }
    for (const k in R.away || {}) if (!seen.has(k)) players.push({ pid: k, name: R.away[k].name, car: R.away[k].car, host: false, away: true });
    const msg = JSON.stringify(Object.assign({ c: 'lobby', mode: R.mode || 'coop', started: !!R.started, players }, extra || {}));
    for (const p of ps) { try { p.ws.send(msg); } catch (e) {} }
  }
  send(ws, o) { try { ws.send(typeof o === 'string' ? o : JSON.stringify(o)); } catch (e) {} }
  async fetch(req) {
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('expected websocket', { status: 426 });
    const url = new URL(req.url), pid = (url.searchParams.get('pid') || '').replace(/[^a-z0-9]/gi, '').slice(0, 24);
    const name = (url.searchParams.get('name') || 'Driver').replace(/[^\p{L}\p{N} _.\-]/gu, '').slice(0, 12) || 'Driver';
    const car = (url.searchParams.get('car') || 'cruiser').replace(/[^a-z]/g, '').slice(0, 12);
    const create = url.searchParams.get('create') === '1', resume = url.searchParams.get('re') === '1';
    if (pid.length < 8) return new Response('bad pid', { status: 400 });
    const pair = new WebSocketPair(), client = pair[0], server = pair[1];
    this.ctx.acceptWebSocket(server);
    const deny = why => { server.serializeAttachment({ pid, dead: true }); this.send(server, { c: 'denied', why }); server.close(4000, why); return new Response(null, { status: 101, webSocket: client }); };
    // a room with nobody connected and nobody expected back is gone
    let R = this.R;
    if (R && !R.hostAway && !this.peers().some(p => p.ws !== server && p.me.pid === R.hostPid)) R = this.R = null;
    // same player reconnecting replaces the old socket (marked first so its close doesn't count as leaving)
    for (const p of this.peers()) if (p.ws !== server && p.me.pid === pid) { p.me.dead = true; try { p.ws.serializeAttachment(p.me); p.ws.close(4001, 'replaced'); } catch (e) {} }
    if (!R) {
      if (!create || resume) return deny(resume ? 'gone' : 'no-room');
      R = this.R = { hostPid: pid, hostName: name, hostCar: car, mode: url.searchParams.get('mode') === 'versus' ? 'versus' : 'coop',
        max: Math.min(MAX_CAP, Math.max(2, +url.searchParams.get('max') || MAX_PLAYERS)), cmax: url.searchParams.get('cmax') ? Math.min(MAX_CAP, Math.max(2, +url.searchParams.get('cmax') || 2)) : 0,
        started: false, roster: [], away: {}, hostAway: 0 };
    } else if (pid === R.hostPid) { // host back
      R.hostAway = 0; R.hostName = name; R.hostCar = car;
      for (const p of this.peers()) if (p.ws !== server) this.send(p.ws, '{"c":"hostback"}');
    } else {
      if (create) return deny('taken');
      const back = !!R.away[pid] || R.roster.includes(pid);
      if (R.started && !back) return deny('started');
      const others = new Set(this.peers().filter(p => p.ws !== server && p.me.pid !== pid).map(p => p.me.pid));
      if (R.hostAway) others.add(R.hostPid); for (const k in R.away) if (k !== pid) others.add(k);
      const cap = R.mode === 'versus' ? R.max : (R.cmax || R.max);
      if (!back && others.size >= cap) return deny('full');
      if (R.away[pid]) { delete R.away[pid]; const h = this.hostPeer(); if (h) this.send(h.ws, { c: 'back', pid }); }
    }
    server.serializeAttachment({ pid, name, car });
    await this.save(); this.lobby();
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, msg) {
    const me = ws.deserializeAttachment() || {}, R = this.R;
    if (me.dead || !R) return;
    if (typeof msg !== 'string') return;
    const isHost = me.pid === R.hostPid;
    if (msg.charCodeAt(0) === 123 && msg.indexOf('"c":') > 0 && msg.length < 400) { // small control messages
      let m; try { m = JSON.parse(msg); } catch (e) { return; }
      if (m.c === 'ping') { ws.send('{"c":"pong","t":' + (+m.t || 0) + '}'); return; }
      if (m.c === 'car') { me.car = String(m.car || '').replace(/[^a-z]/g, '').slice(0, 12); ws.serializeAttachment(me); if (isHost) { R.hostCar = me.car; await this.save(); } this.lobby(); return; }
      if (m.c === 'mode' && isHost) { if (m.mode !== 'versus' && R.cmax && this.peers().length + Object.keys(R.away).length > R.cmax) { this.lobby(); return; }
        R.mode = m.mode === 'versus' ? 'versus' : 'coop'; await this.save(); this.lobby(); return; }
      if (m.c === 'start' && isHost) { R.started = true; R.roster = [...new Set(this.peers().map(p => p.me.pid).concat(Object.keys(R.away)))]; await this.save(); this.lobby({ go: true }); return; }
      if (m.c === 'reset' && isHost) { R.started = false; R.roster = []; await this.save(); this.lobby(); return; }
      if (m.c === 'bye') { me.bye = true; ws.serializeAttachment(me); await this.gone(ws, me, true); try { ws.close(1000, 'bye'); } catch (e) {} return; }
    }
    if (isHost) { // host -> everyone else (snapshots + events), passed through untouched
      for (const p of this.peers()) if (p.ws !== ws) { try { p.ws.send(msg); } catch (e) {} }
    } else { // guest -> host, tagged with who sent it
      const h = this.hostPeer();
      if (h) { try { h.ws.send('{"f":"' + me.pid + '","d":' + msg + '}'); } catch (e) {} }
    }
  }
  async webSocketClose(ws, code) { try { ws.close(code === 1005 || code === 1006 ? 1000 : code, 'closed'); } catch (e) {} const me = ws.deserializeAttachment() || {}; await this.gone(ws, me, false); }
  async webSocketError(ws) { const me = ws.deserializeAttachment() || {}; await this.gone(ws, me, false); }
  async gone(ws, me, onPurpose) {
    const R = this.R;
    if (me.dead || !R) return;
    me.dead = true; try { ws.serializeAttachment(me); } catch (e) {}
    if (this.peers().some(p => p.me.pid === me.pid)) return; // already reconnected on a newer socket
    const ps = this.peers();
    if (me.pid === R.hostPid) {
      if (onPurpose) { // host left on purpose: close the room
        for (const p of ps) { try { p.ws.send('{"c":"hostleft"}'); p.ws.close(4002, 'host left'); } catch (e) {} }
        this.R = null; await this.save(); return;
      }
      R.hostAway = Date.now(); for (const p of ps) this.send(p.ws, '{"c":"hostaway"}');
    } else {
      const h = this.hostPeer();
      if (onPurpose) { delete R.away[me.pid]; R.roster = R.roster.filter(k => k !== me.pid); if (h) this.send(h.ws, { c: 'left', pid: me.pid }); }
      else { R.away[me.pid] = { t: Date.now(), name: me.name, car: me.car }; if (h) this.send(h.ws, { c: 'away', pid: me.pid }); }
      if (!ps.length && !R.hostAway) { this.R = null; await this.save(); return; }
    }
    await this.save(); this.lobby();
  }
  async alarm() {
    const R = this.R; if (!R) return;
    const now = Date.now(), ps = this.peers();
    if (R.hostAway && now - R.hostAway >= HOST_GRACE - 50) {
      for (const p of ps) { try { p.ws.send('{"c":"hostleft"}'); p.ws.close(4002, 'host left'); } catch (e) {} }
      this.R = null; await this.save(); return;
    }
    const h = this.hostPeer();
    for (const k in R.away) if (now - R.away[k].t >= GUEST_GRACE - 50) { delete R.away[k]; R.roster = R.roster.filter(x => x !== k); if (h) this.send(h.ws, { c: 'left', pid: k }); }
    if (!ps.length && !R.hostAway) { this.R = null; await this.save(); return; }
    await this.save(); this.lobby();
  }
}
