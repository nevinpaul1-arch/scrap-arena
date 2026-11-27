/* ---------- 3D drivers: built from simple shapes so every item lines up, animated by rotating joints ---------- */
function makeAV(THREE) {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const matCache = {};
  const M = (col, o) => { const k = col + JSON.stringify(o || {}); if (!matCache[k]) matCache[k] = new THREE.MeshStandardMaterial(Object.assign({ color: col, roughness: .62, metalness: 0 }, o || {})); return matCache[k]; };
  const texCache = {};
  function canvasTex(key, w, h, draw) {
    if (texCache[key]) return texCache[key];
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return (texCache[key] = t);
  }
  const camoTex = (k, cols) => canvasTex('camo' + k, 128, 128, (x, w, h) => { let s = 7; const R = () => (s = (s * 16807) % 2147483647) / 2147483647; x.fillStyle = cols[0]; x.fillRect(0, 0, w, h);
    for (let c = 1; c < cols.length; c++) for (let i = 0; i < 14; i++) { x.fillStyle = cols[c]; x.beginPath(); const cx = R() * w, cy = R() * h, r = 8 + R() * 14; for (let j = 0; j <= 9; j++) { const a = j / 9 * 6.283, rr = r * (.6 + R() * .6); x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .7); } x.fill(); } });
  const dotsTex = (k, bg, fg) => canvasTex('dots' + k, 64, 64, (x, w, h) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.beginPath(); x.arc(8 + i * 16 + (j % 2) * 8, 8 + j * 16, 2.6, 0, 6.283); x.fill(); } x.strokeStyle = fg; x.lineWidth = 1.5; x.strokeRect(3, 3, w - 6, h - 6); });
  const flameTex = k => canvasTex('flame' + k, 128, 64, (x, w, h) => { x.fillStyle = '#16181d'; x.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) { const g = x.createLinearGradient(0, h, 0, 0); g.addColorStop(0, '#ffcc00'); g.addColorStop(.6, '#ff5a00'); g.addColorStop(1, 'rgba(255,40,0,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(i * 22, h); x.quadraticCurveTo(i * 22 + 6, h * .3, i * 22 + 14, 4); x.quadraticCurveTo(i * 22 + 12, h * .5, i * 22 + 24, h); x.fill(); } });
  const stripeTex = (k, bg, fg) => canvasTex('stripe' + k, 64, 64, (x, w, h) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.fillRect(w * .42, 0, w * .16, h); x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(w * .36, 0, w * .04, h); x.fillRect(w * .6, 0, w * .04, h); });
  const numTex = (n, col) => canvasTex('num' + n + col, 256, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a2f3a'); g.addColorStop(1, '#14171d'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = col; x.fillRect(0, 0, w, 18); x.font = '900 150px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 10; x.fillText(n, w / 2, h / 2 + 12); });

  /* ---------- catalog ---------- */
  const SKIN = ['#f6d1b3', '#e9b48f', '#c98d63', '#a46a43', '#7a4a2c', '#553220'];
  const COLS = ['#e63946', '#2a7bd8', '#2fbf71', '#ffbe0b', '#8e44ff', '#ff7a1a', '#f2f2f2', '#22252b'];
  const HAIR = ['#2b1d14', '#6b4426', '#c9a24a', '#a8331e', '#e8e8e8', '#151515'];
  // price 0 = free; club: needs that club level (1 Member, 3 Enforcer, 5 President)
  const ITEMS = {
    head: [
      { id: 'none', name: 'Short hair', icon: '💇', price: 0 }, { id: 'spiky', name: 'Spiky hair', icon: '⚡', price: 0 },
      { id: 'helmet', name: 'Racing helmet', icon: '🪖', price: 0 }, { id: 'goggle', name: 'Aviator cap', icon: '🥽', price: 150 },
      { id: 'bandana', name: 'Badass bandana', icon: '🏴‍☠️', price: 150 }, { id: 'beanie', name: 'Beanie', icon: '🧶', price: 100 },
      { id: 'mohawk', name: 'Mohawk', icon: '🦔', price: 200 }, { id: 'cowboy', name: 'Cowboy hat', icon: '🤠', price: 250 },
      { id: 'mil', name: 'Military cap', icon: '🎖️', price: 200 }, { id: 'viking', name: 'Viking helmet', icon: '🐂', price: 400 },
      { id: 'clubband', name: 'Club bandana', icon: '🏁', club: 1 }, { id: 'clubhelm', name: 'Club helmet', icon: '🏁', club: 3 }
    ],
    face: [
      { id: 'none', name: 'Nothing', icon: '🙂', price: 0 }, { id: 'shades', name: 'Shades', icon: '🕶️', price: 0 },
      { id: 'goggles', name: 'Goggles', icon: '🥽', price: 120 }, { id: 'mask', name: 'Bandana mask', icon: '😷', price: 150 },
      { id: 'beard', name: 'Big beard', icon: '🧔', price: 120 }, { id: 'patch', name: 'Eye patch', icon: '🏴‍☠️', price: 150 },
      { id: 'stache', name: 'Moustache', icon: '👨', price: 80 }
    ],
    top: [
      { id: 'tee', name: 'T-shirt', icon: '👕', price: 0 }, { id: 'suit', name: 'Racing suit', icon: '🏎️', price: 0 },
      { id: 'leather', name: 'Studded leather', icon: '🧥', price: 300 }, { id: 'camo', name: 'Military camo', icon: '🪖', price: 250 },
      { id: 'hoodie', name: 'Hoodie', icon: '🧥', price: 150 }, { id: 'tank', name: 'Tank top', icon: '🎽', price: 100 },
      { id: 'flame', name: 'Flame jacket', icon: '🔥', price: 450 }, { id: 'clubjk', name: 'Club jacket', icon: '🏁', club: 5 }
    ],
    legs: [
      { id: 'jeans', name: 'Jeans', icon: '👖', price: 0 }, { id: 'race', name: 'Race pants', icon: '🏁', price: 0 },
      { id: 'camo', name: 'Camo pants', icon: '🪖', price: 150 }, { id: 'shorts', name: 'Cargo shorts', icon: '🩳', price: 100 }, { id: 'leather', name: 'Leather pants', icon: '🖤', price: 200 }
    ],
    boots: [
      { id: 'sneaker', name: 'Sneakers', icon: '👟', price: 0 }, { id: 'combat', name: 'Combat boots', icon: '🥾', price: 0 },
      { id: 'spiked', name: 'Spikey boots', icon: '🦔', price: 300 }, { id: 'cowboy', name: 'Cowboy boots', icon: '🤠', price: 200 }, { id: 'gold', name: 'Gold kicks', icon: '✨', price: 500 }
    ],
    extra: [
      { id: 'none', name: 'Nothing', icon: '—', price: 0 }, { id: 'gloves', name: 'Race gloves', icon: '🧤', price: 0 },
      { id: 'pads', name: 'Spiked shoulder pads', icon: '🗡️', price: 400 }, { id: 'chain', name: 'Gold chain', icon: '⛓️', price: 250 },
      { id: 'pack', name: 'Wrench backpack', icon: '🔧', price: 250 }, { id: 'cape', name: 'Cape', icon: '🦸', price: 350 }, { id: 'scarf', name: 'Scarf', icon: '🧣', price: 120 }
    ]
  };
  const CATS = [['head', 'HEAD'], ['face', 'FACE'], ['top', 'TOP'], ['legs', 'PANTS'], ['boots', 'BOOTS'], ['extra', 'EXTRA'], ['skin', 'SKIN'], ['col', 'COLOUR']];
  const DEF = { skin: 1, hair: 0, col: 0, head: 'helmet', face: 'none', top: 'suit', legs: 'race', boots: 'combat', extra: 'gloves' };
  const enc = c => [c.skin, c.hair, c.col, c.head, c.face, c.top, c.legs, c.boots, c.extra].join('.');
  const dec = s => { const p = String(s || '').split('.'); if (p.length < 9) return Object.assign({}, DEF); const c = { skin: +p[0] | 0, hair: +p[1] | 0, col: +p[2] | 0, head: p[3], face: p[4], top: p[5], legs: p[6], boots: p[7], extra: p[8] };
    for (const k of ['head', 'face', 'top', 'legs', 'boots', 'extra']) if (!ITEMS[k].some(i => i.id === c[k])) c[k] = DEF[k]; c.skin = Math.min(5, Math.max(0, c.skin)); c.hair %= HAIR.length; c.col %= COLS.length; return c; };
  function randomCfg(seed) { let s = (seed | 0) * 9301 + 49297; const R = n => { s = (s * 16807 + 11) % 2147483647; return s % n; }; const pick = k => { const l = ITEMS[k].filter(i => !i.club); return l[R(l.length)].id; };
    return { skin: R(6), hair: R(HAIR.length), col: R(COLS.length), head: pick('head'), face: pick('face'), top: pick('top'), legs: pick('legs'), boots: pick('boots'), extra: pick('extra') }; }

  /* ---------- geometry helpers ---------- */
  const add = (p, g, m, x, y, z, o) => { const me = new THREE.Mesh(g, m); me.position.set(x || 0, y || 0, z || 0); if (o) { if (o.rx) me.rotation.x = o.rx; if (o.ry) me.rotation.y = o.ry; if (o.rz) me.rotation.z = o.rz; if (o.s) me.scale.set(o.s[0], o.s[1], o.s[2]); } me.castShadow = true; p.add(me); return me; };
  const Sph = (r, ws, hs, ps, pl, ts, tl) => new THREE.SphereGeometry(r, ws || 24, hs || 18, ps, pl, ts, tl);
  const Cap = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 14);
  const Box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const Cyl = (rt, rb, h, s) => new THREE.CylinderGeometry(rt, rb, h, s || 20);
  const Cone = (r, h, s) => new THREE.ConeGeometry(r, h, s || 10);
  const Tor = (r, t, rs, ts, arc) => new THREE.TorusGeometry(r, t, rs || 8, ts || 24, arc);
  function RBox(w, h, d, r) { const sh = new THREE.Shape(), x = -w / 2, y = -h / 2; r = Math.min(r, w / 2, h / 2);
    sh.moveTo(x + r, y); sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r); sh.lineTo(x + w, y + h - r); sh.quadraticCurveTo(x + w, y + h, x + w - r, y + h); sh.lineTo(x + r, y + h); sh.quadraticCurveTo(x, y + h, x, y + h - r); sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y);
    const g = new THREE.ExtrudeGeometry(sh, { depth: d - r * 2, bevelEnabled: true, bevelThickness: r, bevelSize: r * .9, bevelSegments: 3, curveSegments: 6 }); g.translate(0, 0, -(d - r * 2) / 2); return g; }

  /* ---------- the driver ---------- */
  function build(cfgIn, opt) {
    const o = opt || {}, cfg = typeof cfgIn === 'string' ? (cfgIn[0] === 'r' ? randomCfg(+cfgIn.slice(1) || 1) : dec(cfgIn)) : Object.assign({}, DEF, cfgIn || {});
    const rank = o.rank == null ? 9 : o.rank; // club gear needs the club level (and a club)
    for (const k of ['head', 'top']) { const it = ITEMS[k].find(i => i.id === cfg[k]); if (it && it.club && (!o.club || rank < it.club)) cfg[k] = DEF[k]; }
    const skin = M(SKIN[cfg.skin]), col = COLS[cfg.col], hair = M(HAIR[cfg.hair], { roughness: .8 });
    const clubC = o.club || null; // { c1, c2, badge }
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const R = { root, body, cfg };
    // legs (pivot at hip)
    const legMat = { jeans: M('#3b5d8f', { roughness: .85 }), race: M(col), camo: M('#fff', { map: camoTex('g', ['#5b6b3a', '#3d4a26', '#8a8a5c', '#2b2f1d']), roughness: .9 }), shorts: M('#9b8a62', { roughness: .9 }), leather: M('#1d1e22', { roughness: .35 }) }[cfg.legs] || M('#3b5d8f');
    for (const s of [-1, 1]) {
      const leg = new THREE.Group(); leg.position.set(s * .12, .62, 0); body.add(leg); R[s < 0 ? 'legL' : 'legR'] = leg;
      if (cfg.legs === 'shorts') { add(leg, Cap(.1, .14), legMat, 0, -.12, 0); add(leg, Cap(.075, .26), skin, 0, -.36, 0); }
      else add(leg, Cap(.095, .36), legMat, 0, -.27, 0);
      if (cfg.legs === 'race') add(leg, Box(.03, .5, .2), M('#ffffff'), s * .09, -.27, 0);
      // boots
      const bootMat = { sneaker: M('#f4f4f4'), combat: M('#2a2622', { roughness: .7 }), spiked: M('#1b1b1f', { roughness: .4 }), cowboy: M('#7a4a26', { roughness: .6 }), gold: M('#e3b341', { roughness: .25, metalness: .8 }) }[cfg.boots];
      const tall = cfg.boots === 'combat' || cfg.boots === 'spiked' || cfg.boots === 'cowboy';
      if (tall) add(leg, Cyl(.1, .095, .2), bootMat, 0, -.47, 0);
      add(leg, RBox(.17, .12, .27, .05), bootMat, 0, -.58, .045);
      add(leg, Box(.18, .03, .28), cfg.boots === 'sneaker' ? M(col) : cfg.boots === 'cowboy' ? M('#3b2414') : M('#111'), 0, -.635, .045);
      if (cfg.boots === 'cowboy') add(leg, Box(.1, .06, .08), M('#3b2414'), 0, -.62, -.06);
      if (cfg.boots === 'spiked') for (let i = 0; i < 4; i++) add(leg, Cone(.025, .08, 6), M('#c9ced6', { metalness: .9, roughness: .25 }), Math.cos(i * 1.57 + .78) * .11, -.46, Math.sin(i * 1.57 + .78) * .11, { rz: -Math.cos(i * 1.57 + .78) * 1.57, rx: Math.sin(i * 1.57 + .78) * 1.57 });
      if (cfg.boots === 'spiked') add(leg, Cone(.03, .09, 6), M('#c9ced6', { metalness: .9, roughness: .25 }), 0, -.56, .2, { rx: 1.57 });
    }
    // hips + torso
    add(body, RBox(.42, .16, .28, .06), legMat, 0, .66, 0);
    const torso = new THREE.Group(); torso.position.set(0, .74, 0); body.add(torso); R.torso = torso;
    const topCols = { tee: M(col), suit: M(col), leather: M('#18191d', { roughness: .32 }), camo: M('#fff', { map: camoTex('j', ['#56653a', '#384423', '#7f7d52', '#24281a']), roughness: .9 }), hoodie: M(col, { roughness: .9 }), tank: M(col), flame: M('#fff', { map: (() => { const t = flameTex(1); t.repeat.set(2.2, 2.2); return t; })(), roughness: .5 }), clubjk: M(clubC ? clubC.c1 : col, { roughness: .5 }) };
    const tm = topCols[cfg.top] || M(col);
    const tw = cfg.top === 'tank' ? .4 : .46;
    add(torso, RBox(tw, .44, .3, .1), tm, 0, .22, 0);
    if (cfg.top === 'suit') { add(torso, Box(.08, .44, .31), M('#ffffff'), 0, .22, 0); add(torso, Cyl(.14, .15, .06), M('#ffffff'), 0, .46, 0); }
    if (cfg.top === 'leather') { add(torso, Box(.1, .38, .02), M('#e8e8e8'), 0, .22, .151); for (const sx of [-1, 1]) add(torso, Box(.13, .14, .04), M('#18191d'), sx * .1, .4, .14, { rz: sx * .5 }); for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) add(torso, Sph(.014, 8, 6), M('#d9dde3', { metalness: .9, roughness: .2 }), sx * (.13 + i * .02), .4 - i * .005, .15); }
    if (cfg.top === 'camo') { for (const sx of [-1, 1]) add(torso, Box(.12, .09, .03), M('#3f4a2a'), sx * .11, .3, .155); add(torso, Box(.42, .03, .31), M('#2b2f1d'), 0, .06, 0); }
    if (cfg.top === 'hoodie') { add(torso, Box(.24, .1, .03), M(col, { roughness: .95 }), 0, .14, .155); add(torso, Tor(.15, .055, 8, 20, Math.PI), M(col, { roughness: .9 }), 0, .47, -.08, { rx: -.5 }); }
    if (cfg.top === 'clubjk' && clubC) { add(torso, Box(.47, .07, .31), M(clubC.c2 || '#111'), 0, .06, 0); if (clubC.badge) { const bt = new THREE.TextureLoader().load(clubC.badge); bt.colorSpace = THREE.SRGBColorSpace; add(torso, new THREE.PlaneGeometry(.26, .26), new THREE.MeshStandardMaterial({ map: bt, transparent: true, roughness: .5 }), 0, .24, -.155, { ry: Math.PI }); add(torso, new THREE.PlaneGeometry(.09, .09), new THREE.MeshStandardMaterial({ map: bt, transparent: true, roughness: .5 }), -.12, .32, .153); } }
    if (cfg.top === 'tank') add(torso, Cyl(.1, .11, .05), skin, 0, .46, 0);
    // arms (pivot at shoulder)
    const sleeve = cfg.top === 'tank' ? skin : tm, shortSleeve = cfg.top === 'tee';
    for (const s of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(s * (tw / 2 + .05), .4, 0); torso.add(arm); R[s < 0 ? 'armL' : 'armR'] = arm;
      add(arm, Sph(.085), sleeve, 0, 0, 0);
      if (shortSleeve) { add(arm, Cap(.083, .1), sleeve, 0, -.08, 0); add(arm, Cap(.066, .22), skin, 0, -.24, 0); }
      else add(arm, Cap(.075, .28), sleeve, 0, -.18, 0);
      if (cfg.top === 'suit') add(arm, Box(.03, .3, .16), M('#ffffff'), s * .07, -.18, 0);
      const gl = cfg.extra === 'gloves';
      const hand = add(arm, Sph(gl ? .085 : .075), gl ? M('#1e2026') : skin, 0, -.38, .01); R[s < 0 ? 'handL' : 'handR'] = hand;
      if (gl) add(arm, Cyl(.08, .085, .06), M(col), 0, -.32, 0);
      if (cfg.extra === 'pads') { add(arm, Sph(.12, 16, 10, 0, 6.283, 0, 1.6), M('#2a2c33', { roughness: .4 }), 0, .03, 0); for (let i = 0; i < 3; i++) add(arm, Cone(.028, .1, 6), M('#d0d4da', { metalness: .9, roughness: .2 }), s * .02, .12, -.06 + i * .06, { rz: -s * .5 }); }
    }
    // extras on the body
    if (cfg.extra === 'chain') add(torso, Tor(.13, .018, 6, 20), M('#f2c14e', { metalness: .9, roughness: .2 }), 0, .4, .07, { rx: 1.25 });
    if (cfg.extra === 'scarf') { add(torso, Tor(.13, .05, 8, 20), M(COLS[(cfg.col + 3) % COLS.length]), 0, .45, 0, { rx: 1.57 }); add(torso, Box(.09, .2, .04), M(COLS[(cfg.col + 3) % COLS.length]), .08, .34, .16, { rz: .2 }); }
    if (cfg.extra === 'pack') { add(torso, RBox(.3, .32, .14, .05), M('#5a3b22', { roughness: .8 }), 0, .24, -.21); const w = new THREE.Group(); w.position.set(.1, .44, -.26); w.rotation.z = -.4; torso.add(w); add(w, Box(.035, .3, .025), M('#b9bfc8', { metalness: .9, roughness: .3 }), 0, .1, 0); add(w, Tor(.04, .015, 6, 12, 4.4), M('#b9bfc8', { metalness: .9, roughness: .3 }), 0, .27, 0, { rz: 2.2 }); }
    if (cfg.extra === 'cape') { const cape = new THREE.Mesh(new THREE.PlaneGeometry(.5, .8, 4, 6), M(COLS[(cfg.col + 5) % COLS.length], { side: THREE.DoubleSide, roughness: .7 })); cape.position.set(0, .03, -.17); cape.rotation.x = .12; cape.castShadow = true; const g = cape.geometry, p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, -Math.pow((.4 - p.getY(i)) / .8, 2) * .08 - Math.cos(p.getX(i) * 6) * .02); g.computeVertexNormals(); const cg = new THREE.Group(); cg.position.set(0, .44, 0); cape.position.y = -.4; cg.add(cape); torso.add(cg); R.cape = cg; }
    // head (pivot at neck)
    const head = new THREE.Group(); head.position.set(0, .48, 0); head.scale.setScalar(1.12); torso.add(head); R.head = head;
    add(head, Cyl(.07, .08, .1), skin, 0, .02, 0);
    const skull = add(head, Sph(.3, 32, 24), skin, 0, .3, 0, { s: [1, .96, .95] }); R.skull = skull;
    for (const s of [-1, 1]) add(head, Sph(.06, 12, 10), skin, s * .29, .29, 0, { s: [.6, 1, 1] }); // ears
    // face
    const face = new THREE.Group(); face.position.set(0, .3, 0); head.add(face); R.face = face;
    const eyeW = M('#ffffff', { roughness: .3 }), eyeB = M('#1a1a1f', { roughness: .2 });
    R.eyes = []; R.brows = [];
    for (const s of [-1, 1]) {
      const e = new THREE.Group(); e.position.set(s * .1, .02, .26); face.add(e);
      add(e, Sph(.055, 16, 12), eyeW, 0, 0, 0, { s: [1, 1.15, .5] }); add(e, Sph(.032, 12, 10), eyeB, 0, 0, .022, { s: [1, 1.15, .6] }); add(e, Sph(.01, 6, 6), eyeW, .01, .015, .04);
      R.eyes.push(e);
      const b = add(face, Box(.1, .022, .02), hair, s * .1, .1, .27, { rz: s * -.12 }); R.brows.push(b);
    }
    add(face, Sph(.035, 10, 8), M(SKIN[Math.min(5, cfg.skin + 1)]), 0, -.04, .29); // nose
    R.mouth = add(face, Tor(.055, .014, 6, 16, Math.PI), M('#5a1f1f'), 0, -.1, .27, { rz: Math.PI }); R.mouthO = add(face, Sph(.04, 12, 10), M('#3b1010'), 0, -.11, .27, { s: [1, 1.2, .4] }); R.mouthO.visible = false;
    // hair / headwear
    const hw = cfg.head;
    if (hw === 'none' || hw === 'goggle' || hw === 'cowboy' || hw === 'mil') add(head, Sph(.315, 28, 16, 0, 6.283, 0, 1.25), hair, 0, .31, -.01);
    if (hw === 'spiky') { add(head, Sph(.312, 28, 16, 0, 6.283, 0, 1.2), hair, 0, .31, -.01); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; add(head, Cone(.07, .2, 8), hair, Math.cos(a) * .17, .56, Math.sin(a) * .15 - .02, { rz: -Math.cos(a) * .7, rx: Math.sin(a) * .7 }); } add(head, Cone(.08, .24, 8), hair, 0, .64, 0); }
    if (hw === 'mohawk') { add(head, Sph(.305, 28, 16, 0, 6.283, 0, 1.15), M(SKIN[cfg.skin]), 0, .31, -.01); for (let i = 0; i < 6; i++) add(head, Cone(.06, .22, 6), M(COLS[(cfg.col + 2) % COLS.length], { roughness: .7 }), 0, .6 - Math.abs(i - 2.5) * .02, .2 - i * .08, { rx: -.3 + i * .12 }); }
    if (hw === 'helmet' || hw === 'clubhelm') {
      const hc = hw === 'clubhelm' && clubC ? clubC.c1 : col;
      add(head, Sph(.36, 32, 24), M(hc, { roughness: .25, metalness: .2 }), 0, .32, 0, { s: [1, .98, 1] });
      add(head, Sph(.365, 32, 12, Math.PI / 2 - 1.15, 2.3, 1.15, .62), M('#0e1218', { roughness: .05, metalness: .6, transparent: true, opacity: .9 }), 0, .32, .005);
      add(head, Tor(.362, .022, 6, 40), M(hw === 'clubhelm' && clubC ? (clubC.c2 || '#fff') : '#ffffff'), 0, .32, 0, { rx: 1.57, ry: .0, s: [1, 1, 1] }).rotation.set(0, 0, 0);
      add(head, Box(.05, .3, .74), M(hw === 'clubhelm' && clubC ? (clubC.c2 || '#fff') : '#ffffff', { roughness: .3 }), 0, .55, 0, { s: [1, .25, 1] });
      if (hw === 'clubhelm' && clubC && clubC.badge) { const bt = new THREE.TextureLoader().load(clubC.badge); bt.colorSpace = THREE.SRGBColorSpace; for (const sx of [-1, 1]) add(head, new THREE.PlaneGeometry(.16, .16), new THREE.MeshStandardMaterial({ map: bt, transparent: true }), sx * .362, .34, 0, { ry: sx * 1.57 }); }
      R.face.visible = false;
    }
    if (hw === 'goggle') { add(head, Sph(.33, 28, 16, 0, 6.283, 0, 1.3), M('#6b4a2b', { roughness: .8 }), 0, .31, -.01); for (const s of [-1, 1]) { add(head, Cyl(.07, .07, .06), M('#c7a96b', { metalness: .7, roughness: .3 }), s * .1, .5, .22, { rx: 1.1 }); add(head, Cyl(.055, .055, .065), M('#79c3ff', { roughness: .05, metalness: .4 }), s * .1, .5, .222, { rx: 1.1 }); } add(head, Tor(.31, .02, 6, 30), M('#3a2a18'), 0, .47, 0, { rx: 1.75 }); }
    if (hw === 'bandana' || hw === 'clubband') {
      const bm = hw === 'clubband' && clubC ? M(clubC.c1, { roughness: .8 }) : M('#fff', { map: dotsTex('r' + cfg.col, ['#c0262f', '#1e3a7a', '#151515', '#c0262f'][cfg.col % 4], '#ffffff'), roughness: .85 });
      add(head, Sph(.322, 28, 16, 0, 6.283, 0, 1.3), bm, 0, .31, -.01); add(head, Tor(.31, .03, 6, 30), bm, 0, .43, 0, { rx: 1.45 });
      for (const s of [-1, 1]) add(head, Cone(.06, .22, 4), bm, s * .06, .36, -.33, { rx: -1.9, rz: s * .5, s: [1, 1, .35] });
      add(head, Sph(.05, 10, 8), bm, 0, .42, -.31);
      if (hw === 'clubband' && clubC && clubC.badge) { const bt = new THREE.TextureLoader().load(clubC.badge); bt.colorSpace = THREE.SRGBColorSpace; add(head, new THREE.PlaneGeometry(.13, .13), new THREE.MeshStandardMaterial({ map: bt, transparent: true }), 0, .5, .275, { rx: -.5 }); }
    }
    if (hw === 'beanie') { add(head, Sph(.33, 28, 16, 0, 6.283, 0, 1.35), M(COLS[(cfg.col + 1) % COLS.length], { roughness: .95 }), 0, .31, -.01); add(head, Tor(.3, .05, 8, 30), M(COLS[(cfg.col + 1) % COLS.length], { roughness: .95 }), 0, .42, 0, { rx: 1.57 }); add(head, Sph(.08, 12, 10), M('#f4f4f4', { roughness: 1 }), 0, .66, 0); }
    if (hw === 'cowboy') { add(head, Cyl(.24, .27, .22), M('#8a5a2e', { roughness: .8 }), 0, .62, 0); add(head, Cyl(.56, .56, .025, 32), M('#8a5a2e', { roughness: .8 }), 0, .52, 0, { s: [1, 1, .85] }); add(head, Cyl(.272, .272, .05), M('#3b2414'), 0, .53, 0); }
    if (hw === 'mil') { add(head, Cyl(.3, .31, .14), M('#fff', { map: camoTex('c', ['#56653a', '#384423', '#7f7d52', '#24281a']), roughness: .9 }), 0, .55, 0); add(head, Box(.36, .025, .16), M('#3b4527'), 0, .5, .3, { rx: .2 }); }
    if (hw === 'viking') { add(head, Sph(.34, 28, 16, 0, 6.283, 0, 1.4), M('#8e939c', { metalness: .85, roughness: .3 }), 0, .31, -.01); add(head, Tor(.32, .03, 6, 30), M('#c9a24a', { metalness: .8, roughness: .3 }), 0, .43, 0, { rx: 1.57 }); for (const s of [-1, 1]) { const h = new THREE.Group(); h.position.set(s * .3, .5, 0); h.rotation.z = -s * .9; head.add(h); add(h, Cone(.07, .32, 12), M('#efe6d2', { roughness: .5 }), 0, .14, 0); } }
    // face items
    const fi = cfg.face;
    if (fi === 'shades') { for (const s of [-1, 1]) add(face, RBox(.13, .075, .03, .025), M('#0d0f13', { roughness: .1, metalness: .5 }), s * .1, .02, .3); add(face, Box(.06, .015, .02), M('#0d0f13'), 0, .04, .3); }
    if (fi === 'goggles') { for (const s of [-1, 1]) { add(face, Cyl(.065, .065, .06), M('#2a2a2a'), s * .1, .02, .29, { rx: 1.57 }); add(face, Cyl(.05, .05, .065), M('#ffb347', { roughness: .05, metalness: .4 }), s * .1, .02, .292, { rx: 1.57 }); } add(face, Tor(.3, .018, 6, 30), M('#222'), 0, .02, 0, { rx: 1.57 }); }
    if (fi === 'mask') { const mm = M('#fff', { map: dotsTex('m' + cfg.col, ['#151515', '#c0262f', '#1e3a7a', '#151515'][cfg.col % 4], '#ffffff'), roughness: .85 }); add(head, Sph(.315, 28, 12, Math.PI / 2 - 1.5, 3, 1.62, .9), mm, 0, .3, .01); add(face, Cone(.12, .14, 4), mm, 0, -.22, .25, { rx: Math.PI, ry: .78, s: [1, 1, .3] }); }
    if (fi === 'beard') { add(head, Sph(.312, 24, 12, Math.PI / 2 - 1.45, 2.9, 1.98, .95), hair, 0, .3, .015); for (let i = 0; i < 5; i++) add(head, Sph(.06, 8, 6), hair, (i - 2) * .07, .02 - Math.abs(i - 2) * .02, .25 - Math.abs(i - 2) * .03); add(face, Tor(.07, .03, 6, 14, Math.PI), hair, 0, -.06, .27); }
    if (fi === 'stache') add(face, Tor(.07, .028, 6, 14, Math.PI), hair, 0, -.06, .28);
    if (fi === 'patch') { add(face, Cyl(.06, .06, .02), M('#0d0f13'), .1, .02, .3, { rx: 1.57 }); add(head, Tor(.305, .012, 6, 30), M('#0d0f13'), 0, .33, 0, { rx: 1.4, rz: .5 }); }
    R.shadowBlob = null;
    root.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = false; } });
    R.expr = e => setExpr(R, e); setExpr(R, 'smile');
    return R;
  }
  function setExpr(R, e) {
    R.mouth.visible = e !== 'shock' && e !== 'laugh'; R.mouthO.visible = e === 'shock' || e === 'laugh';
    R.mouth.rotation.z = e === 'angry' || e === 'sad' ? 0 : Math.PI; R.mouth.position.y = e === 'angry' || e === 'sad' ? -.13 : -.1;
    R.mouthO.scale.set(e === 'laugh' ? 1.4 : 1, e === 'laugh' ? .8 : 1.3, .4);
    R.brows.forEach((b, i) => { const s = i ? 1 : -1; b.rotation.z = e === 'angry' ? s * .45 : e === 'sad' ? -s * .4 : e === 'shock' ? s * -.05 : s * -.12; b.position.y = e === 'shock' ? .13 : e === 'angry' ? .085 : .1; });
    R.eyes.forEach(ey => ey.scale.set(1, e === 'happy' || e === 'laugh' ? .35 : e === 'angry' ? .7 : 1, 1));
  }
  /* ---------- poses (time-based, all procedural) ---------- */
  const lerp = (a, b, k) => a + (b - a) * k, ease = k => k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k);
  function pose(R, p) { // p: { armL:[x,z], armR:[x,z], legL, legR, head:[x,y,z], torso:[x,z], bob }
    const set = (g, v) => { if (!g || !v) return; g.rotation.x = v[0] || 0; g.rotation.z = v[1] || 0; g.rotation.y = v[2] || 0; };
    set(R.armL, p.armL || [0, -.12]); set(R.armR, p.armR || [0, .12]); set(R.legL, p.legL || [0, 0]); set(R.legR, p.legR || [0, 0]);
    set(R.torso, p.torso || [0, 0]); if (R.head) { const h = p.head || [0, 0, 0]; R.head.rotation.set(h[0], h[1], h[2]); }
    R.body.position.y = p.bob || 0;
  }
  const POSE = {
    idle: t => ({ armL: [0, -.12 - Math.sin(t * 2) * .03], armR: [0, .12 + Math.sin(t * 2) * .03], bob: Math.sin(t * 2) * .01, head: [0, Math.sin(t * .7) * .2, 0] }),
    cheer: t => ({ armL: [0, -2.7 - Math.sin(t * 9) * .2], armR: [0, 2.7 + Math.sin(t * 9) * .2], bob: Math.abs(Math.sin(t * 9)) * .08, head: [-.15, 0, 0] }),
    clap: t => { const k = Math.abs(Math.sin(t * 10)); return { armL: [-1.2, -.25 + k * .3], armR: [-1.2, .25 - k * .3], bob: k * .015 }; },
    wave: t => ({ armL: [0, -.12], armR: [0, 2.6 + Math.sin(t * 10) * .3], head: [0, .2, 0] }),
    dance: t => ({ armL: [Math.sin(t * 6) * .8, -1 - Math.sin(t * 6) * .6], armR: [-Math.sin(t * 6) * .8, 1 - Math.sin(t * 6) * .6], legL: [Math.max(0, Math.sin(t * 6)) * -.6, 0], legR: [Math.max(0, -Math.sin(t * 6)) * -.6, 0], torso: [0, Math.sin(t * 6) * .15], bob: Math.abs(Math.sin(t * 6)) * .06, head: [0, Math.sin(t * 3) * .4, Math.sin(t * 6) * .15] }),
    sulk: t => ({ armL: [.1, -.05], armR: [.1, .05], head: [.45, 0, 0], torso: [.15, 0] }),
    angry: t => ({ armL: [-.3, -1.4 - Math.sin(t * 14) * .5], armR: [-.3, 1.4 + Math.sin(t * 14 + 1) * .5], bob: Math.abs(Math.sin(t * 14)) * .05, head: [0, Math.sin(t * 7) * .15, 0] }),
    laugh: t => ({ armL: [-.6, -.4], armR: [-.6, .4], torso: [-.15 + Math.sin(t * 16) * .06, 0], head: [-.3 + Math.sin(t * 16) * .08, 0, 0], bob: Math.abs(Math.sin(t * 16)) * .02 }),
    dizzy: t => ({ armL: [0, -.6], armR: [0, .6], legL: [-1.4, -.2], legR: [-1.4, .2], head: [0, 0, Math.sin(t * 5) * .3] })
  };

  /* ---------- podium scene ---------- */
  // tops: [{ name, cfg, club, score }] best first; gag: 0..4; returns { el, dispose, replay }
  const GAGS = ['champagne', 'kick', 'pie', 'steal', 'dance'];
  function podium(host, tops, gagIdx, title, onDone) {
    const W = host.clientWidth || innerWidth, H = host.clientHeight || innerHeight;
    const ren = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    ren.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); ren.setSize(W, H); ren.shadowMap.enabled = true; ren.shadowMap.type = THREE.PCFSoftShadowMap; ren.outputColorSpace = THREE.SRGBColorSpace; ren.toneMapping = THREE.ACESFilmicToneMapping; ren.toneMappingExposure = 1.05;
    host.appendChild(ren.domElement);
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#0d1018'); scene.fog = new THREE.Fog('#0d1018', 9, 20);
    const wide = W / H > 1.6, cam = new THREE.PerspectiveCamera(wide ? 37 : 46, W / H, .1, 60), CZ = wide ? 7.1 : 7.6; cam.position.set(0, 2.1, CZ); cam.lookAt(0, 1.6, 0);
    scene.add(new THREE.HemisphereLight('#dfe8ff', '#3a2c20', 1.5));
    const key = new THREE.SpotLight('#fff4e0', 140, 22, .6, .5, 1.2); key.position.set(2.5, 7, 5); key.target.position.set(0, .8, 0); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -.0004; scene.add(key, key.target);
    const rim = new THREE.DirectionalLight('#7fb2ff', 1.2); rim.position.set(-4, 4, -5); scene.add(rim);
    for (const [x, c] of [[-4.5, '#ff4d5a'], [4.5, '#4da3ff']]) { const s = new THREE.SpotLight(c, 30, 18, .35, .6, 1.4); s.position.set(x, 6, 1); s.target.position.set(0, 0, 0); scene.add(s, s.target); }
    const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.MeshStandardMaterial({ color: '#191d26', roughness: .85 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 2.7, 64), new THREE.MeshBasicMaterial({ color: '#ffae00', transparent: true, opacity: .4 })); ring.rotation.x = -Math.PI / 2; ring.position.y = .005; scene.add(ring);
    const STEP = [{ x: 0, h: .9, c: '#ffcf3f', n: '1' }, { x: -1.55, h: .6, c: '#cfd6e2', n: '2' }, { x: 1.55, h: .38, c: '#d98b4a', n: '3' }];
    for (const st of STEP) { const g = new THREE.Group(); g.position.x = st.x; scene.add(g);
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.45, st.h, 1.25), [M('#232833'), M('#232833'), M(st.c, { roughness: .35, metalness: .3 }), M('#1b1f27'), new THREE.MeshStandardMaterial({ map: numTex(st.n, st.c), roughness: .6 }), M('#1b1f27')]);
      box.position.y = st.h / 2; box.castShadow = box.receiveShadow = true; g.add(box); }
    // drivers
    const D = tops.slice(0, 3).map((tp, i) => { const r = build(tp.cfg, { club: tp.club }); r.root.position.set(STEP[i].x, STEP[i].h + 3 + i * .6, 0); r.root.scale.setScalar(1.08); r.root.rotation.y = i === 1 ? .25 : i === 2 ? -.25 : 0; scene.add(r.root); r.base = { x: STEP[i].x, y: STEP[i].h }; return r; });
    // props
    const props = new THREE.Group(); scene.add(props);
    const trophy = new THREE.Group(); { const g = M('#f2c14e', { metalness: .9, roughness: .2 }); add(trophy, Cyl(.16, .05, .22), g, 0, .2, 0); add(trophy, Cyl(.03, .03, .1), g, 0, .05, 0); add(trophy, Cyl(.08, .1, .04), g, 0, 0, 0); for (const s of [-1, 1]) add(trophy, Tor(.06, .015, 6, 12, Math.PI), g, s * .17, .22, 0, { rz: s > 0 ? -1.57 : 1.57 }); } trophy.visible = false; scene.add(trophy);
    const bottle = new THREE.Group(); { add(bottle, Cyl(.06, .07, .26), M('#1f5e2b', { roughness: .15, metalness: .3 }), 0, 0, 0); add(bottle, Cyl(.025, .055, .1), M('#1f5e2b', { roughness: .15 }), 0, .17, 0); add(bottle, Cyl(.03, .03, .05), M('#f2c14e', { metalness: .8, roughness: .3 }), 0, .23, 0); } bottle.visible = false; scene.add(bottle);
    const pie = new THREE.Group(); { add(pie, Cyl(.16, .12, .06), M('#c98d4a', { roughness: .8 }), 0, 0, 0); add(pie, Sph(.15, 16, 8, 0, 6.283, 0, 1.4), M('#fff7ea', { roughness: .9 }), 0, .02, 0, { s: [1, .5, 1] }); add(pie, Sph(.035, 8, 6), M('#d0213a'), 0, .09, 0); } pie.visible = false; scene.add(pie);
    const splat = new THREE.Group(); for (let i = 0; i < 9; i++) add(splat, Sph(.06 + Math.random() * .05, 10, 8), M('#fff7ea', { roughness: .9 }), (Math.random() - .5) * .4, (Math.random() - .5) * .35, Math.random() * .05); splat.visible = false;
    if (D[0]) { D[0].head.add(splat); splat.position.set(0, .32, .3); }
    const stars = new THREE.Group(); for (let i = 0; i < 4; i++) add(stars, new THREE.OctahedronGeometry(.06), M('#ffd23f', { emissive: '#ffb300', emissiveIntensity: .8 }), Math.cos(i * 1.57) * .25, 0, Math.sin(i * 1.57) * .25); stars.visible = false; scene.add(stars);
    const cloud = new THREE.Group(); for (let i = 0; i < 5; i++) add(cloud, Sph(.16 + (i % 2) * .05, 12, 10), M('#6b7280', { roughness: 1 }), (i - 2) * .14, (i % 2) * .05, 0); cloud.visible = false; scene.add(cloud);
    // particles: confetti + champagne + rain
    const PN = 260, pg = new THREE.BufferGeometry(), pp = new Float32Array(PN * 3), pc = new Float32Array(PN * 3), pv = [];
    const CC = ['#ff4d5a', '#ffd23f', '#4da3ff', '#3ddc84', '#ff7ae0', '#ffffff'].map(c => new THREE.Color(c));
    for (let i = 0; i < PN; i++) { pv.push({ x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, life: 0, kind: 0 }); const c = CC[i % CC.length]; pc.set([c.r, c.g, c.b], i * 3); }
    pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pc, 3));
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: .13, vertexColors: true, transparent: true, opacity: .95 })); pts.frustumCulled = false; scene.add(pts);
    let pi = 0; const emit = (x, y, z, vx, vy, vz, life, kind, col) => { const q = pv[pi]; Object.assign(q, { x, y, z, vx, vy, vz, life, kind }); if (col) pc.set([col.r, col.g, col.b], pi * 3); else { const c = CC[pi % CC.length]; pc.set([c.r, c.g, c.b], pi * 3); } pg.attributes.color.needsUpdate = true; pi = (pi + 1) % PN; };
    const foam = new THREE.Color('#fff6d8'), drop = new THREE.Color('#8ab4ff');
    const gag = GAGS[((gagIdx | 0) % GAGS.length + GAGS.length) % GAGS.length];
    const handW = (r, s) => { const v = new THREE.Vector3(); (s < 0 ? r.handL : r.handR).getWorldPosition(v); return v; };
    const headW = r => { const v = new THREE.Vector3(); r.skull.getWorldPosition(v); return v; };
    let t0 = performance.now(), raf = 0, done = false, lastT = 0;
    const T_END = 9.5;
    function frame() {
      const t = (performance.now() - t0) / 1000, dt = Math.min(.05, t - lastT); lastT = t;
      // drop onto the steps with a squash
      D.forEach((r, i) => { const land = .35 + i * .18, k = ease((t - .0) / land); if (t < land) { r.root.position.y = r.base.y + (1 - k * k) * (3 + i * .6); r.body.scale.set(1, 1, 1); } else if (!r.off) { r.root.position.y = r.base.y; const sq = Math.max(0, 1 - (t - land) * 6); r.body.scale.set(1 + sq * .15, 1 - sq * .2, 1 + sq * .15); } });
      if (t > .4 && t < .5 && !frame.conf) { frame.conf = 1; for (let i = 0; i < 140; i++) emit((Math.random() - .5) * 5, 5 + Math.random() * 2, (Math.random() - .5) * 2, (Math.random() - .5) * 1.5, -Math.random() * 1, (Math.random() - .5) * .5, 6, 0); }
      // celebration then the gag
      const A = D[0], B = D[1], C = D[2], g0 = 2.4;
      if (t < g0) { if (A) { pose(A, POSE.cheer(t)); A.expr('happy'); } if (B) { pose(B, POSE.clap(t)); B.expr('smile'); } if (C) { pose(C, POSE.clap(t + .3)); C.expr('smile'); } }
      else {
        const k = t - g0;
        if (gag === 'champagne') {
          if (A) { bottle.visible = true; const sh = k < 1.2; pose(A, sh ? { armR: [-1.3 + Math.sin(k * 30) * .3, .2], armL: [0, -.3], bob: .02 } : { armR: [-2.6, .5], armL: [0, -2.4], head: [-.2, 0, 0] }); A.expr(sh ? 'smile' : 'laugh');
            const h = handW(A, 1); bottle.position.copy(h); bottle.position.y += .1; bottle.rotation.set(0, 0, sh ? -.3 : -.5);
            if (!sh) for (let i = 0; i < 7; i++) emit(h.x, h.y + .3, h.z, (Math.random() - .3) * 1.2, 3 + Math.random() * 1.5, (Math.random() - .5) * .8, 2.2, 1, foam); }
          if (B) { pose(B, k < 1.2 ? POSE.clap(t) : POSE.cheer(t)); B.expr(k < 1.2 ? 'smile' : 'happy'); } if (C) { pose(C, k < 1.2 ? POSE.clap(t) : { armL: [-2, -.6], armR: [-2, .6], head: [-.4, 0, 0] }); C.expr(k < 1.2 ? 'smile' : 'laugh'); }
        } else if (gag === 'kick') {
          const V = C || B;
          if (A) { if (k < .6) { pose(A, POSE.idle(t)); A.root.rotation.y = lerp(0, -1.1 * Math.sign(V.base.x), ease(k / .6)); A.expr('angry'); } else if (k < 1.1) { const q = ease((k - .6) / .5); pose(A, { legR: [-1.6 * Math.sin(q * Math.PI), 0], armL: [.6, -.5], armR: [-.6, .5] }); } else { pose(A, POSE.laugh(t)); A.expr('laugh'); A.root.rotation.y = lerp(A.root.rotation.y, 0, .05); } }
          if (V) { if (k < .9) { pose(V, POSE.clap(t)); } else { V.off = true; const q = k - .9; if (!V.vel) V.vel = { x: Math.sign(V.base.x) * 1.45, y: 3.2 }; const y = V.base.y + 1 * 0 + V.vel.y * q - 4.9 * q * q; const x = V.base.x + V.vel.x * q; const ground = 0;
              if (y > ground) { V.root.position.set(x, y, q * .4); V.root.rotation.z = -Math.sign(V.base.x) * q * 7; V.expr('shock'); pose(V, { armL: [0, -2.4], armR: [0, 2.4], legL: [-.5, 0], legR: [.3, 0] }); }
              else { if (!V.landed) { V.landed = { x }; } V.root.position.set(V.landed.x, 0, .4); V.root.rotation.set(0, -Math.sign(V.base.x) * .5, 0); V.body.position.y = -.33; pose(V, POSE.dizzy(t)); V.body.position.y = -.33; V.expr('sad'); stars.visible = true; const hp = headW(V); stars.position.set(hp.x, hp.y + .35, hp.z); stars.rotation.y = t * 5; } } }
          const O = C ? B : null; if (O) { pose(O, k < 1 ? POSE.clap(t) : POSE.laugh(t)); O.expr(k < 1 ? 'smile' : 'laugh'); }
        } else if (gag === 'pie') {
          const P = B || C; if (P && A) {
            if (k < .5) { pose(P, POSE.idle(t)); P.expr('smile'); P.root.rotation.y = lerp(P.root.rotation.y, Math.sign(-P.base.x) * .9, .1); }
            else if (k < 1.0) { pie.visible = true; const q = ease((k - .5) / .5); pose(P, { armR: [lerp(0, 1.2, q), .3], armL: [0, -.3] }); P.expr('happy'); const h = handW(P, 1); pie.position.copy(h); pie.position.y += .08; }
            else if (k < 1.6) { if (!frame.pf) frame.pf = handW(P, 1).clone(); const q = (k - 1.0) / .6, tgt = headW(A); pose(P, { armR: [-1.8, .3], armL: [0, -.3] }); pie.position.set(lerp(frame.pf.x, tgt.x, q), lerp(frame.pf.y, tgt.y, q) + Math.sin(q * Math.PI) * .7, lerp(frame.pf.z, tgt.z + .25, q)); pie.rotation.x = q * 6; }
            else { pie.visible = false; splat.visible = true; pose(P, POSE.laugh(t)); P.expr('laugh'); }
            if (k < 1.6) { pose(A, POSE.cheer(t)); A.expr('happy'); } else { pose(A, { armL: [-1.2, -.5 + Math.sin(t * 12) * .2], armR: [-1.2, .5 - Math.sin(t * 12) * .2], head: [.1, Math.sin(t * 8) * .2, 0] }); A.expr('shock'); }
            const O = P === B ? C : null; if (O) { pose(O, k < 1.6 ? POSE.clap(t) : POSE.laugh(t)); O.expr(k < 1.6 ? 'smile' : 'laugh'); }
          }
        } else if (gag === 'steal') {
          const S = B || C;
          if (A) { trophy.visible = true; if (k < 1.2 || !S) { pose(A, { armL: [0, -2.6], armR: [0, 2.6], head: [-.25, 0, 0] }); A.expr('happy'); const h1 = handW(A, -1), h2 = handW(A, 1); trophy.position.set((h1.x + h2.x) / 2, (h1.y + h2.y) / 2 + .12, (h1.z + h2.z) / 2); }
            else { pose(A, POSE.angry(t)); A.expr('angry'); } }
          if (S && A) { if (k < .8) { pose(S, POSE.clap(t)); S.expr('smile'); } else if (k < 1.2) { const q = ease((k - .8) / .4); S.off = true; S.root.position.set(lerp(S.base.x, A.base.x - Math.sign(S.base.x) * -.0 + Math.sign(S.base.x) * .45, q), S.base.y + Math.sin(q * Math.PI) * .7 + q * (A.base.y - S.base.y), .3 * q); pose(S, { armL: [0, -2.6], armR: [0, 2.6] }); S.expr('happy'); }
            else { const q = k - 1.2; S.root.rotation.y = Math.sign(S.base.x) * -1.57 * -1; S.root.position.set(A.base.x + Math.sign(S.base.x) * (.45 + q * 2.4), Math.max(0, A.base.y - q * 3), .3 + q * .5); pose(S, { armL: [0, -2.6], armR: [0, 2.6], legL: [Math.sin(t * 14) * .8, 0], legR: [-Math.sin(t * 14) * .8, 0], bob: Math.abs(Math.sin(t * 14)) * .05 }); S.expr('laugh'); const h1 = handW(S, -1), h2 = handW(S, 1); trophy.position.set((h1.x + h2.x) / 2, (h1.y + h2.y) / 2 + .12, (h1.z + h2.z) / 2); } }
          const O = S === B ? C : null; if (O) { pose(O, k < 1.2 ? POSE.clap(t) : POSE.laugh(t)); O.expr(k < 1.2 ? 'smile' : 'laugh'); }
        } else { // dance-off, last place sulks under a rain cloud
          if (A) { pose(A, POSE.dance(t)); A.expr('happy'); } if (B) { pose(B, POSE.dance(t + .5)); B.expr('laugh'); }
          const L = C || null; if (L) { pose(L, POSE.sulk(t)); L.expr('sad'); cloud.visible = true; const hp = headW(L); cloud.position.set(hp.x, hp.y + .8, hp.z); if (Math.random() < .6) emit(hp.x + (Math.random() - .5) * .5, hp.y + .7, hp.z + (Math.random() - .5) * .2, 0, -3, 0, .5, 2, drop); }
        }
      }
      // particles
      for (let i = 0; i < PN; i++) { const q = pv[i]; if (q.life > 0) { q.life -= dt; q.vy -= (q.kind === 0 ? .8 : 6) * dt; if (q.kind === 0) { q.vx *= .99; q.x += Math.sin(t * 3 + i) * dt * .3; } q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; if (q.y < 0) q.life = 0; pp[i * 3] = q.x; pp[i * 3 + 1] = q.y; pp[i * 3 + 2] = q.z; } else pp[i * 3 + 1] = -99; }
      pg.attributes.position.needsUpdate = true;
      if (D.some(r => r.cape)) D.forEach(r => { if (r.cape) r.cape.rotation.x = .15 + Math.sin(t * 3) * .05; });
      cam.position.x = Math.sin(t * .25) * .45; cam.lookAt(0, 1.6, 0);
      ren.render(scene, cam);
      if (t > T_END && !done) { done = true; onDone && onDone(); }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return { canvas: ren.domElement, gag, project: (r, dy) => { const v = headW(r); v.y += dy || .6; v.project(cam); return [(v.x + 1) / 2, (1 - v.y) / 2]; }, drivers: D,
      dispose() { cancelAnimationFrame(raf); scene.traverse(o => { if (o.geometry) o.geometry.dispose(); }); ren.dispose(); ren.forceContextLoss && ren.forceContextLoss(); ren.domElement.remove(); } };
  }
  /* ---------- garage preview: one driver on a turntable, drag to spin ---------- */
  function preview(host, cfg, club) {
    const W = host.clientWidth || 300, H = host.clientHeight || 300;
    const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true }); ren.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); ren.setSize(W, H); ren.outputColorSpace = THREE.SRGBColorSpace; ren.toneMapping = THREE.ACESFilmicToneMapping; ren.shadowMap.enabled = true; ren.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(ren.domElement);
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, W / H, .1, 30); cam.position.set(0, 1.35, 5.2); cam.lookAt(0, .95, 0);
    scene.add(new THREE.HemisphereLight('#dfe8ff', '#30261c', 1.1)); const k = new THREE.DirectionalLight('#fff3e0', 2.2); k.position.set(2, 4, 3); k.castShadow = true; k.shadow.mapSize.set(1024, 1024); k.shadow.camera.left = k.shadow.camera.bottom = -2; k.shadow.camera.right = k.shadow.camera.top = 2; scene.add(k); const rl = new THREE.DirectionalLight('#8fb8ff', 1.4); rl.position.set(-3, 2, -3); scene.add(rl);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(.9, .95, .08, 48), new THREE.MeshStandardMaterial({ color: '#232833', roughness: .5, metalness: .3 })); disc.position.y = -.04; disc.receiveShadow = true; scene.add(disc);
    const ringM = new THREE.Mesh(new THREE.TorusGeometry(.92, .015, 6, 64), new THREE.MeshBasicMaterial({ color: '#ffae00' })); ringM.rotation.x = Math.PI / 2; scene.add(ringM);
    let R = null, yaw = .45, vy = 0, drag = null, raf = 0, t0 = performance.now(), act = 'idle', actT = 0;
    const set = (c, cl) => { if (R) { scene.remove(R.root); R.root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } R = build(c, { club: cl }); scene.add(R.root); act = 'wave'; actT = 1.4; };
    set(cfg, club);
    const down = e => { const p = e.touches ? e.touches[0] : e; drag = { x: p.clientX, yaw }; vy = 0; }, move = e => { if (!drag) return; const p = e.touches ? e.touches[0] : e; const ny = drag.yaw + (p.clientX - drag.x) * .012; vy = ny - yaw; yaw = ny; e.preventDefault && e.cancelable && e.preventDefault(); }, up = () => { drag = null; };
    ren.domElement.addEventListener('pointerdown', down); addEventListener('pointermove', move, { passive: false }); addEventListener('pointerup', up); ren.domElement.style.touchAction = 'none';
    function frame() { const t = (performance.now() - t0) / 1000; if (!drag) { yaw += vy; vy *= .93; if (Math.abs(vy) < .0005) yaw += .004; } if (actT > 0) actT -= 1 / 60; pose(R, (actT > 0 ? POSE[act] : POSE.idle)(t)); if (R.cape) R.cape.rotation.x = .12 + Math.sin(t * 2) * .04; R.root.rotation.y = yaw; disc.rotation.y = yaw; ren.render(scene, cam); raf = requestAnimationFrame(frame); }
    raf = requestAnimationFrame(frame);
    return { set, play(a) { act = a; actT = 1.6; }, snapshot(size) { // head-and-shoulders portrait for the profile badge
        const c2 = new THREE.PerspectiveCamera(26, 1, .1, 20); c2.position.set(.0, 1.55, 2.6); c2.lookAt(0, 1.45, 0); const y0 = R.root.rotation.y; R.root.rotation.y = .25; pose(R, POSE.idle(0)); R.expr('smile');
        const rt = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); rt.setSize(size, size); rt.outputColorSpace = THREE.SRGBColorSpace; rt.toneMapping = THREE.ACESFilmicToneMapping; disc.visible = ringM.visible = false; rt.render(scene, c2); const url = rt.domElement.toDataURL('image/png'); disc.visible = ringM.visible = true; rt.dispose(); rt.forceContextLoss && rt.forceContextLoss(); R.root.rotation.y = y0; return url; },
      resize() { const w = host.clientWidth, h = host.clientHeight; if (w && h) { ren.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); } },
      dispose() { cancelAnimationFrame(raf); removeEventListener('pointermove', move); removeEventListener('pointerup', up); scene.traverse(o => { if (o.geometry) o.geometry.dispose(); }); ren.dispose(); ren.forceContextLoss && ren.forceContextLoss(); ren.domElement.remove(); } };
  }
  return { build, podium, preview, ITEMS, CATS, SKIN, COLS, HAIR, DEF, enc, dec, randomCfg, GAGS, pose, POSE };
}
