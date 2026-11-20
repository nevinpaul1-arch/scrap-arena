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

async function api(req, env, url) {
  const p = url.pathname;
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
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
    if (url.pathname.startsWith('/api/')) {
      try { return await api(req, env, url); } catch (e) { return json({ error: 'server', detail: String(e).slice(0, 200) }, 500); }
    }
    if (url.pathname !== '/' && url.pathname !== '/index.html') return Response.redirect(url.origin + '/', 302);
    const r = await fetch(SRC, { cf: { cacheTtl: 120, cacheEverything: true } });
    if (!r.ok) return new Response('Game temporarily unavailable', { status: 502 });
    return new Response(r.body, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=60', 'x-content-type-options': 'nosniff' } });
  }
};
