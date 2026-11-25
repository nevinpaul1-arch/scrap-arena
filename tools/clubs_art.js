/* ---------- motor clubs: original badges drawn as SVG (used in menus, lobby and painted on the cars) ---------- */
const CLUBS = [
  { id: 'reapers', name: 'Rust Reapers', motto: 'Nothing leaves in one piece', c1: '#e5383b', c2: '#1b0b0d', c3: '#ffd6cc', shape: 'shield', icon: 'skull', vibe: 'Pure wreckers. If it moves, it loses a door.' },
  { id: 'vipers', name: 'Neon Vipers', motto: 'Strike first, strike twice', c1: '#2ef28c', c2: '#071a12', c3: '#ff4fd8', shape: 'hex', icon: 'snake', vibe: 'Quick, slippery and always going sideways.' },
  { id: 'bulls', name: 'Iron Bulls', motto: 'Head down, foot down', c1: '#ff8c1a', c2: '#191b20', c3: '#d8dde6', shape: 'gear', icon: 'bull', vibe: 'Heavy metal. They ram first and ask later.' },
  { id: 'owls', name: 'Night Owls', motto: 'We own the dark', c1: '#9d6bff', c2: '#120b26', c3: '#f1e6ff', shape: 'diamond', icon: 'owl', vibe: 'Patient hunters. Never seen until the hit lands.' },
  { id: 'kings', name: 'Desert Kings', motto: 'Sand in the gears, gold in the trunk', c1: '#f5c242', c2: '#2a1c06', c3: '#fff3cf', shape: 'sun', icon: 'crown', vibe: 'Showboats with the trophies to back it up.' },
  { id: 'wolves', name: 'Frost Wolves', motto: 'Hunt as a pack', c1: '#5cc8ff', c2: '#06182a', c3: '#ffffff', shape: 'shield2', icon: 'wolf', vibe: 'Team players. Bomb Run is their kind of night.' }
];
const CLUB_BY = Object.fromEntries(CLUBS.map(c => [c.id, c]));
function clubShape(k) {
  const pts = (n, r1, r2, off) => Array.from({ length: n * 2 }, (_, i) => { const a = i / (n * 2) * 6.283 + (off || 0), r = i % 2 ? r2 : r1; return (50 + Math.cos(a) * r).toFixed(1) + ' ' + (50 + Math.sin(a) * r).toFixed(1); }).join(' L');
  if (k === 'shield') return 'M50 4 L91 17 V48 C91 73 72 89 50 97 C28 89 9 73 9 48 V17 Z';
  if (k === 'shield2') return 'M50 3 L88 12 L92 50 C90 74 70 90 50 98 C30 90 10 74 8 50 L12 12 Z';
  if (k === 'hex') return 'M50 3 L91 26 V74 L50 97 L9 74 V26 Z';
  if (k === 'diamond') return 'M50 2 Q56 2 60 6 L94 40 Q98 46 94 52 L60 94 Q50 102 40 94 L6 52 Q2 46 6 40 L40 6 Q44 2 50 2 Z';
  if (k === 'gear') { let d = ''; for (let i = 0; i < 12; i++) { const a0 = i / 12 * 6.283, a1 = a0 + .18, a2 = a0 + .34, a3 = a0 + .52; const p = (a, r) => (50 + Math.cos(a) * r).toFixed(1) + ' ' + (50 + Math.sin(a) * r).toFixed(1); d += (i ? 'L' : 'M') + p(a0, 41) + ' L' + p(a1, 48) + ' L' + p(a2, 48) + ' L' + p(a3, 41) + ' '; } return d + 'Z'; }
  if (k === 'sun') return 'M' + pts(16, 48, 39, -Math.PI / 2) + ' Z';
  return 'M50 4 A46 46 0 1 1 49.9 4 Z';
}
function clubIcon(k, c1, c2, c3) {
  if (k === 'skull') return '<g stroke="' + c3 + '" stroke-width="5" stroke-linecap="round"><path d="M24 74 L76 30"/><path d="M24 30 L76 74"/></g><circle cx="22" cy="76" r="5" fill="' + c3 + '"/><circle cx="78" cy="28" r="5" fill="' + c3 + '"/><circle cx="22" cy="28" r="5" fill="' + c3 + '"/><circle cx="78" cy="76" r="5" fill="' + c3 + '"/>' +
    '<path d="M50 22 C66 22 74 33 74 45 C74 54 69 59 64 61 V69 Q64 73 60 73 H40 Q36 73 36 69 V61 C31 59 26 54 26 45 C26 33 34 22 50 22 Z" fill="' + c1 + '" stroke="' + c2 + '" stroke-width="2.5"/>' +
    '<ellipse cx="40.5" cy="46" rx="7" ry="7.5" fill="' + c2 + '"/><ellipse cx="59.5" cy="46" rx="7" ry="7.5" fill="' + c2 + '"/><path d="M50 52 L46 59 H54 Z" fill="' + c2 + '"/><path d="M43 64 V72 M50 64 V72 M57 64 V72" stroke="' + c2 + '" stroke-width="2.4"/>';
  if (k === 'snake') return '<path d="M30 78 C26 60 70 64 70 46 C70 32 54 26 44 32" fill="none" stroke="' + c2 + '" stroke-width="15" stroke-linecap="round"/><path d="M30 78 C26 60 70 64 70 46 C70 32 54 26 44 32" fill="none" stroke="' + c1 + '" stroke-width="10" stroke-linecap="round"/>' +
    '<path d="M30 78 C26 60 70 64 70 46 C70 32 54 26 44 32" fill="none" stroke="' + c3 + '" stroke-width="2" stroke-dasharray="3 7" stroke-linecap="round"/>' +
    '<path d="M46 22 C34 20 26 28 28 36 C30 43 40 44 48 38 C54 33 54 24 46 22 Z" fill="' + c1 + '" stroke="' + c2 + '" stroke-width="2.5"/><circle cx="36" cy="31" r="2.6" fill="' + c2 + '"/><path d="M27 35 L18 38 M18 38 L14 35 M18 38 L15 42" stroke="' + c3 + '" stroke-width="2.2" stroke-linecap="round"/>';
  if (k === 'bull') return '<path d="M30 40 C18 38 12 28 12 18 C20 28 28 30 38 30 Z" fill="' + c3 + '" stroke="' + c2 + '" stroke-width="2.5"/><path d="M70 40 C82 38 88 28 88 18 C80 28 72 30 62 30 Z" fill="' + c3 + '" stroke="' + c2 + '" stroke-width="2.5"/>' +
    '<path d="M32 30 H68 Q74 30 72 38 L64 70 Q60 82 50 82 Q40 82 36 70 L28 38 Q26 30 32 30 Z" fill="' + c1 + '" stroke="' + c2 + '" stroke-width="2.5"/><path d="M36 44 L45 48 M64 44 L55 48" stroke="' + c2 + '" stroke-width="4" stroke-linecap="round"/>' +
    '<ellipse cx="50" cy="70" rx="11" ry="7" fill="' + c2 + '" opacity=".55"/><circle cx="45" cy="69" r="2" fill="' + c3 + '"/><circle cx="55" cy="69" r="2" fill="' + c3 + '"/><circle cx="50" cy="79" r="5.5" fill="none" stroke="' + c3 + '" stroke-width="2.4"/>';
  if (k === 'owl') return '<path d="M26 30 L32 14 L42 28 Z M74 30 L68 14 L58 28 Z" fill="' + c1 + '" stroke="' + c2 + '" stroke-width="2.5" stroke-linejoin="round"/><path d="M50 24 C70 24 78 38 78 54 C78 72 64 84 50 84 C36 84 22 72 22 54 C22 38 30 24 50 24 Z" fill="' + c1 + '" stroke="' + c2 + '" stroke-width="2.5"/>' +
    '<circle cx="38" cy="48" r="11" fill="' + c3 + '" stroke="' + c2 + '" stroke-width="2.5"/><circle cx="62" cy="48" r="11" fill="' + c3 + '" stroke="' + c2 + '" stroke-width="2.5"/><circle cx="39" cy="49" r="5" fill="' + c2 + '"/><circle cx="61" cy="49" r="5" fill="' + c2 + '"/><circle cx="41" cy="47" r="1.6" fill="' + c3 + '"/><circle cx="63" cy="47" r="1.6" fill="' + c3 + '"/>' +
    '<path d="M28 36 L48 42 M72 36 L52 42" stroke="' + c2 + '" stroke-width="3.5" stroke-linecap="round"/><path d="M50 56 L45 64 L50 70 L55 64 Z" fill="' + c3 + '" stroke="' + c2 + '" stroke-width="2"/><path d="M36 74 Q50 80 64 74" stroke="' + c2 + '" stroke-width="2" fill="none" opacity=".6"/>';
  if (k === 'crown') return '<path d="M22 70 L17 34 L35 49 L50 24 L65 49 L83 34 L78 70 Z" fill="' + c1 + '" stroke="' + c2 + '" stroke-width="3" stroke-linejoin="round"/><rect x="21" y="68" width="58" height="11" rx="3" fill="' + c1 + '" stroke="' + c2 + '" stroke-width="3"/>' +
    '<circle cx="17" cy="32" r="4" fill="' + c3 + '" stroke="' + c2 + '" stroke-width="2"/><circle cx="50" cy="21" r="4.5" fill="' + c3 + '" stroke="' + c2 + '" stroke-width="2"/><circle cx="83" cy="32" r="4" fill="' + c3 + '" stroke="' + c2 + '" stroke-width="2"/>' +
    '<circle cx="35" cy="73.5" r="2.6" fill="' + c2 + '"/><circle cx="50" cy="73.5" r="3" fill="#e5383b"/><circle cx="65" cy="73.5" r="2.6" fill="' + c2 + '"/><path d="M33 60 L50 40 L67 60" fill="none" stroke="' + c3 + '" stroke-width="2.5" opacity=".7"/>';
  if (k === 'wolf') return '<path d="M50 86 L33 66 L24 22 L41 38 L50 34 L59 38 L76 22 L67 66 Z" fill="' + c1 + '" stroke="' + c2 + '" stroke-width="3" stroke-linejoin="round"/><path d="M29 30 L38 40 L31 44 Z M71 30 L62 40 L69 44 Z" fill="' + c2 + '" opacity=".5"/>' +
    '<path d="M35 52 L46 55 L37 58 Z M65 52 L54 55 L63 58 Z" fill="' + c3 + '" stroke="' + c2 + '" stroke-width="1.5"/><path d="M42 64 L50 84 L58 64 Q50 60 42 64 Z" fill="' + c3 + '" stroke="' + c2 + '" stroke-width="2"/><path d="M46 71 L50 76 L54 71 Z" fill="' + c2 + '"/>' +
    '<path d="M44 42 L50 50 L56 42" fill="none" stroke="' + c2 + '" stroke-width="2" opacity=".7"/>';
  return '';
}
function clubBadgeSvg(id, opt) {
  const c = CLUB_BY[id]; if (!c) return '';
  const o = opt || {}, gold = o.champ ? '#ffd23f' : null, d = clubShape(c.shape);
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 112 112">' +
    '<defs><linearGradient id="g' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c.c2 + '"/><stop offset="1" stop-color="#000"/></linearGradient>' +
    '<linearGradient id="s' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
    (gold ? '<path d="' + d + '" transform="translate(50 50) scale(1.1) translate(-50 -50)" fill="none" stroke="' + gold + '" stroke-width="5"/>' : '') +
    '<path d="' + d + '" fill="url(#g' + id + ')" stroke="' + (o.chrome ? '#e8edf3' : c.c1) + '" stroke-width="6" stroke-linejoin="round"/>' +
    '<path d="' + d + '" transform="translate(50 50) scale(.84) translate(-50 -50)" fill="none" stroke="' + c.c1 + '" stroke-opacity=".45" stroke-width="2"/>' +
    '<g transform="translate(50 50) scale(.88) translate(-50 -50)">' + clubIcon(c.icon, c.c1, c.c2, c.c3) + '</g>' +
    '<path d="' + d + '" fill="url(#s' + id + ')"/></svg>';
}
const CLUB_URL = {}, CLUB_IMG = {};
function clubBadgeUrl(id, opt) { const k = id + (opt && opt.champ ? 'C' : '') + (opt && opt.chrome ? 'R' : ''); if (!CLUB_URL[k]) CLUB_URL[k] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(clubBadgeSvg(id, opt)); return CLUB_URL[k]; }
function clubImg(id) { // canvas copy for painting onto cars
  if (!CLUB_BY[id]) return null; if (CLUB_IMG[id]) return CLUB_IMG[id].ok ? CLUB_IMG[id].cv : null;
  const im = new Image(), rec = CLUB_IMG[id] = { ok: false, cv: null };
  im.onload = () => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; cv.getContext('2d').drawImage(im, 0, 0, 64, 64); rec.cv = cv; rec.ok = true; };
  im.src = clubBadgeUrl(id); return null;
}
