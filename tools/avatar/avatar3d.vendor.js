/* Scrap Arena modular driver models and podium scenes. */
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
  const numTex = (n, col) => canvasTex('num' + n + col, 256, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a2f3a'); g.addColorStop(1, '#14171d'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = col; x.fillRect(0, 0, w, 18); x.font = '900 150px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 10; x.fillText(n, w / 2, h / 2 + 12); });

  /* ---------- catalog ---------- */
  const SKIN = ['#f6d1b3', '#e9b48f', '#c98d63', '#a46a43', '#7a4a2c', '#553220'];
  const COLS = ['#ae3937', '#3061ac', '#2fbf71', '#ffbe0b', '#8e44ff', '#ff7a1a', '#f2f2f2', '#22252b'];
  const HAIR = ['#2b1d14', '#6b4426', '#c9a24a', '#a8331e', '#e8e8e8', '#151515'];
  // price 0 = free; club: needs that club level (1 Member, 3 Enforcer, 5 President)
  const ITEMS = {
    head: [
      { id: 'none', name: 'Short hair', icon: '💇', price: 0 }, { id: 'spiky', name: 'Spiky hair', icon: '⚡', price: 0 },
      { id: 'helmet', name: 'Racing helmet', icon: '🪖', price: 0 }, { id: 'goggle', name: 'Aviator cap', icon: '🥽', price: 150 },
      { id: 'bandana', name: 'Badass bandana', icon: '🏴‍☠️', price: 150 }, { id: 'beanie', name: 'Beanie', icon: '🧶', price: 100 },
      { id: 'mohawk', name: 'Mohawk', icon: '🦔', price: 200 }, { id: 'cowboy', name: 'Cowboy hat', icon: '🤠', price: 250 },
      { id: 'mil', name: 'Military cap', icon: '🎖️', price: 200 }, { id: 'viking', name: 'Viking helmet', icon: '🐂', price: 400 },
      { id: 'curls', name: 'Short curls', icon: '↟', price: 80 },
      { id: 'pitcap', name: 'Pit cap & goggles', icon: '🥽', price: 150 },
      { id: 'openface', name: 'Open-face helmet', icon: '🏁', price: 200 },
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
      { id: 'coveralls', name: 'Mechanic coveralls', icon: '🔧', price: 180 },
      { id: 'pitjacket', name: 'Club-stripe jacket', icon: '🏁', price: 230 },
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
  const Sph = (r, ws, hs, ps, pl, ts, tl) => new THREE.SphereGeometry(r, Math.min(ws || 16, 22), Math.min(hs || 12, 14), ps, pl, ts, tl);
  const Box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const Cyl = (rt, rb, h, s) => new THREE.CylinderGeometry(rt, rb, h, s || 20);
  const Cone = (r, h, s) => new THREE.ConeGeometry(r, h, s || 10);
  const Tor = (r, t, rs, ts, arc) => new THREE.TorusGeometry(r, t, rs || 8, ts || 24, arc);
  function RBox(w, h, d, radius) {
    const half = V3(w / 2, h / 2, d / 2);
    const r = Math.min(radius, half.x, half.y, half.z);
    const g = new THREE.BoxGeometry(w, h, d, 4, 4, 4);
    const v = g.attributes.position, n = g.attributes.normal;
    const point = V3(), inner = V3(), normal = V3();
    const clamp = THREE.MathUtils.clamp;
    for (let i = 0; i < v.count; i++) {
      point.fromBufferAttribute(v, i);
      inner.set(clamp(point.x, -half.x+r, half.x-r), clamp(point.y,-half.y+r,half.y-r), clamp(point.z,-half.z+r,half.z-r));
      normal.subVectors(point, inner).normalize();
      point.copy(inner).addScaledVector(normal, r);
      v.setXYZ(i, point.x, point.y, point.z);
      n.setXYZ(i, normal.x, normal.y, normal.z);
    }
    return g;
  }

  // Closed cross sections define the silhouette. The stitched panels follow the same surface.
  function loft(rings, segments = 12, power = .82) {
    const pos = [], indices = [];
    for (const [y, width, depth, back = 0, shift = 0] of rings) {
      for (let i = 0; i < segments; i++) {
        const a = 2 * Math.PI * (i + .5) / segments;
        const x = Math.sin(a), z = Math.cos(a);
        pos.push(shift + Math.sign(x) * Math.abs(x) ** power * width, y,
          back + Math.sign(z) * Math.abs(z) ** power * depth);
      }
    }
    for (let row = 0; row < rings.length - 1; row++) {
      for (let i = 0; i < segments; i++) {
        const a = row * segments + i, b = row * segments + (i + 1) % segments;
        indices.push(a, b, a + segments, b, b + segments, a + segments);
      }
    }
    const top = (rings.length - 1) * segments;
    for (let i = 1; i < segments - 1; i++) indices.push(0, i + 1, i, top, top + i, top + i + 1);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  function sculptedSkull(jawWidth = 1) {
    return loft([
      [.036, .094*jawWidth, .070, .066], [.074, .151*jawWidth, .110, .068], [.124, .183*jawWidth, .155, .051],
      [.195, .211, .188, .023], [.275, .230, .216, .002], [.352, .223, .22, -.009],
      [.432, .216, .213, -.017], [.505, .181, .171, -.025], [.556, .104, .119, -.026],
      [.579, .026, .027, -.02]
    ], 16, .84);
  }

  const UPPER_ARM = .365, LOWER_ARM = .318, THIGH = .545, SHIN = .512;
  const beltY = 1.116;
  const spineY = 1.199;
  const wristY = -LOWER_ARM;
  const elbowY = -UPPER_ARM;
  const leagueBoot = ['combat','spiked','cowboy'];
  const badgeMaterials = new Map();

  function clubBadge(group, url, size, x, y, z, ry = 0) {
    if (!url) return;
    if (!badgeMaterials.has(url)) {
      const map = new THREE.TextureLoader().load(url);
      map.colorSpace = THREE.SRGBColorSpace;
      badgeMaterials.set(url, new THREE.MeshStandardMaterial({
        map, transparent: true, alphaTest: .32, roughness: .84
      }));
    }
    add(group, new THREE.PlaneGeometry(size, size), badgeMaterials.get(url), x, y, z, { ry });
  }

  /* ---------- the driver ---------- */
  function build(cfgIn, opt) {
    const o = opt || {}, cfg = typeof cfgIn === 'string' ? (cfgIn[0] === 'r' ? randomCfg(+cfgIn.slice(1) || 1) : dec(cfgIn)) : Object.assign({}, DEF, cfgIn || {});
    const rank = o.rank ?? 9;
    for (const key of ['head', 'top']) {
      const item = ITEMS[key].find(i => i.id === cfg[key]);
      if (item?.club && (!o.club || rank < item.club)) cfg[key] = DEF[key];
    }
    const clubC = o.club || null;
    const skin = M(SKIN[cfg.skin], { roughness: .76 });
    const hair = M(HAIR[cfg.hair], { roughness: .9 });
    const col = COLS[cfg.col];
    const fitted = cfg.top === 'pitjacket';
    const work = cfg.top === 'coveralls';
    const race = cfg.top === 'suit';
    const leather = M('#222630', { roughness: .65 });
    const rubber = M('#30343e', { roughness: .88 });
    const tread = M('#575761', { roughness: .91 });
    const alloy = M('#aeb6c2', { roughness: .33, metalness: .26 });
    const cream = M('#f3dbad', { roughness: .82 });
    const accent = M(clubC?.c1 || col, { roughness: .76 });
    const jersey = M(col, { roughness: .81 });
    const textile = M(work ? '#343841' : '#2f3440', { roughness: .91 });
    const camo = M('#fff', { map: camoTex('uniform', ['#63634a','#464d37','#7e7d5c','#343725']), roughness: .92 });
    const tm = {
      suit: jersey, coveralls: textile, pitjacket: M(clubC?.c2 || '#243e64', { roughness: .84 }),
      clubjk: accent, flame: M('#fff', { map: flameTex(1), roughness: .67 }),
      leather, camo
    }[cfg.top] || jersey;
    const lm = {
      race: jersey, jeans: M('#374767', { roughness: .92 }),
      camo, shorts: M('#81755d', { roughness: .9 }), leather: textile
    }[cfg.legs];
    const BM = cfg.boots === 'sneaker' ? M('#d4d0c4') : cfg.boots === 'gold' ? M('#ba8833', { metalness: .46 })
      : cfg.boots === 'cowboy' ? M('#744832') : leather;
    const root = new THREE.Group(), body = new THREE.Group(), torso = new THREE.Group();
    root.add(body);
    torso.position.y = spineY;
    body.add(torso);
    const R = { root, body, torso, cfg, limbs: {} };

    add(body, loft([
      [1.00, .155, .115], [1.048, .279, .173], [1.16, .281, .17], [1.22, .233, .145]
    ]), lm);
    add(body, RBox(.499, .081, .327, .028), rubber, 0, beltY + .074, .015);
    add(body, RBox(.111, .092, .042, .012), alloy, 0, beltY + .071, .188);
    add(body, RBox(.056, .047, .014, .006), leather, .013, beltY + .071, .214);
    for (const x of [-.18, .17]) add(body, RBox(.064, .093, .022, .009), lm, x, beltY + .07, .177);

    add(torso, loft([
      [.005, .237, .148], [.095, fitted ? .213 : .249, .158],
      [.247, fitted ? .240 : .28, .179], [.408, work ? .357 : .314, .188],
      [.523, work ? .346 : .298, .171, -.006], [.607, .185, .124, -.011],
      [.631, .115, .098, -.007]
    ]), tm);
    add(torso, loft([[.596,.095,.079],[.733,.101,.084]], 12), skin);
    if (race || work || fitted || cfg.top === 'clubjk' || cfg.top === 'leather') {
      add(torso, RBox(.031, .494, .021, .007), M('#242630'), .014, .27, .196);
      add(torso, RBox(.019, .058, .024, .004), alloy, .014, .451, .208);
      for (const sign of [-1, 1]) {
        const collar = work ? M('#525561') : tm;
        add(torso, RBox(work ? .162 : .086, .117, .075, .012), collar, .096 * sign, .567, .108, { rz: sign * -.29, rx: -.26 });
      }
      if (race) {
        for (const x of [-.174, -.114]) {
          add(torso, RBox(.034, .40, .022, .004), cream, x, .22, .184);
          add(torso, RBox(.035, .141, .031, .005), cream, x * 1.12, .471, .177, { rx: -.26, rz: .17 });
        }
      } else if (work) {
        for (const sign of [-1, 1]) {
          add(torso, RBox(.184, .082, .029, .01), accent, sign * .218, .495, .162, { rz: sign * -.27, rx: -.25 });
          add(torso, RBox(.118, .093, .035, .012), M('#444952'), sign * .155, .332, .183);
          add(torso, RBox(.126, .031, .041, .006), textile, sign * .155, .389, .189);
        }
      } else if (fitted) {
        add(torso, RBox(.066, .465, .025, .007), accent, -.132, .279, .197, { rz: -.289 });
        add(torso, RBox(.027, .448, .018, .004), M('#375582'), -.087, .255, .199, { rz: -.289 });
      }
      clubBadge(torso, clubC?.badge, .175, .158, work ? .415 : .403, .221, .11);
      if (cfg.top === 'clubjk') clubBadge(torso, clubC?.badge, .29, 0, .313, -.197, Math.PI);
    }
    if (cfg.top === 'camo') {
      for (const sign of [-1,1]) add(torso, RBox(.14,.115,.04,.012), M('#444b37'), sign*.145,.339,.177);
    }
    if (cfg.top === 'hoodie') {
      add(torso, RBox(.28,.13,.038,.022), tm, 0,.158,.176);
      add(torso, Sph(.20, 16, 12), tm, 0,.483,-.143, { s:[1,.75,.66] });
    }

    for (const s of [-1, 1]) {
      const suffix = s < 0 ? 'L' : 'R';
      const leg = new THREE.Group(), knee = new THREE.Group(), foot = new THREE.Group();
      leg.position.set(s * .158, beltY, -.007);
      knee.position.y = -THIGH;
      foot.position.y = -SHIN;
      body.add(leg); leg.add(knee); knee.add(foot);
      const shorts = cfg.legs === 'shorts';
      add(leg, loft([
        [-.548,.093,.096,.01], [-.46,.107,.106,.012], [-.313,.129,.129,.016],
        [-.155,.138,.141,.001], [.057,.137,.132,-.007]
      ]), lm);
      add(knee, loft([
        [-.515,.079,.078], [-.402,.093,.079,-.023], [-.297,.112,.102,-.029],
        [-.235,.113,.106,-.019], [-.115,.100,.096,.006], [.036,.103,.1,.01]
      ]), shorts ? skin : lm);
      if (cfg.legs === 'race') {
        for (const offset of [-.025, .035]) {
          add(leg, RBox(.031,.419,.016,.006), cream, s * .134, -.209, offset, { ry: s * Math.PI / 2, rz: s * -.08 });
          add(knee, RBox(.029,.345,.015,.005), cream, s * .105, -.196, offset-.002, { ry: s * Math.PI / 2 });
        }
      }
      if (!shorts) {
        const pad = work ? accent : lm;
        add(knee, RBox(.167,.166,.055,.027), pad, 0,-.056,.098, { rx:.06 });
        add(leg, RBox(.144,.203,.048,.019), lm, s*.085,-.22,.111, { ry:s*.41, rz:s*.081 });
        add(leg, RBox(.145,.044,.054,.009), work ? M('#464a55') : lm, s*.085,-.136,.124, { ry:s*.41 });
      }
      if (leagueBoot.includes(cfg.boots)) {
        add(knee, loft([[-.531,.093,.087],[-.430,.099,.105],[-.338,.101,.099]], 10), BM);
        add(knee, RBox(.16,.06,.035,.012), work || fitted ? accent : rubber, 0,-.393,.104);
      }
      add(foot, RBox(.19,.122,.299,.037), BM, 0,.012,.048);
      add(foot, RBox(.199,.044,.314,.015), tread, 0,-.053,.048);
      add(foot, RBox(.171,.044,.137,.021), BM, 0,-.079,.115);
      add(foot, RBox(.125,.031,.105,.011), rubber, 0,.065,.114, { rx:.15 });
      if (cfg.boots === 'spiked') for (const x of [-.065,.065]) add(foot, Cone(.022,.067,6), alloy,x,.044,.190,{rx:1.48});
      R.limbs['leg'+suffix] = [leg, knee, foot, THIGH, SHIN];
      R['leg'+suffix] = leg;

      const arm = new THREE.Group(), elbow = new THREE.Group(), hand = new THREE.Group();
      arm.position.set(s * (work ? .338 : .308), .461, 0);
      elbow.position.y = elbowY;
      hand.position.y = wristY;
      torso.add(arm); arm.add(elbow); elbow.add(hand);
      const bare = cfg.top === 'tank';
      add(arm, loft([
        [-.378,.075,.073], [-.288,.095,.085], [-.151,.108,.10], [-.049,.123,.109], [.061,.098,.091], [.094,.055,.063]
      ]), bare ? skin : tm);
      add(elbow, loft([
        [-.322,.055,.06], [-.226,.071,.071], [-.104,.087,.085], [.021,.08,.077]
      ]), bare || work || cfg.top === 'tee' ? skin : tm);
      if (race || fitted) {
        add(arm, RBox(.035,.291,.019,.005), race ? cream : accent, s*.071,-.117,.089, { ry:s*.46 });
        add(elbow, RBox(.031,.212,.018,.005), race ? cream : accent, s*.048,-.133,.073, { ry:s*.51, rz:s*.035 });
      }
      if (work) {
        add(arm, RBox(.167,.077,.181,.014), accent, s*.014,.015,.02);
        add(arm, RBox(.169,.085,.171,.014), M('#535661'), 0,-.265,.006);
      }
      const covered = cfg.extra === 'gloves';
      const glove = covered ? leather : skin;
      if (covered) add(elbow, Cyl(.057,.071,.098,10), rubber,0,-.276,0);
      add(hand, RBox(.122,.154,.102,.028), glove,0,-.029,.012);
      add(hand, RBox(.115,.044,.044,.013), covered ? M('#393d4b') : skin,0,-.063,.057);
      add(hand, Sph(.033,10,8), glove, -s*.05,-.023,.055, { s:[.85,1.3,.82] });
      if (cfg.extra === 'pads') {
        add(arm, Sph(.137, 16, 10, 0, 6.283, 0, 1.6), leather,0,.027,0);
        for (const z of [-.062,0,.062]) add(arm,Cone(.026,.096,6),alloy,s*.039,.159,z,{rz:-s*.43});
      }
      R.limbs['arm'+suffix] = [arm, elbow, hand, UPPER_ARM, LOWER_ARM];
      R['arm'+suffix] = arm;
      R['hand'+suffix] = hand;
    }
    // extras on the body
    if (cfg.extra === 'chain') add(torso, Tor(.13, .018, 6, 20), M('#f2c14e', { metalness: .9, roughness: .2 }), 0, .509, .122, { rx: 1.25 });
    if (cfg.extra === 'scarf') { add(torso, Tor(.13, .05, 8, 20), M(COLS[(cfg.col + 3) % COLS.length]), 0, .62, 0, { rx: 1.57 }); add(torso, Box(.09, .2, .04), M(COLS[(cfg.col + 3) % COLS.length]), .08, .51, .17, { rz: .2 }); }
    if (cfg.extra === 'pack') { add(torso, RBox(.3, .32, .14, .05), M('#5a3b22', { roughness: .8 }), 0, .35, -.22); const w = new THREE.Group(); w.position.set(.1, .52, -.29); w.rotation.z = -.4; torso.add(w); add(w, Box(.035, .3, .025), M('#b9bfc8', { metalness: .9, roughness: .3 }), 0, .1, 0); add(w, Tor(.04, .015, 6, 12, 4.4), M('#b9bfc8', { metalness: .9, roughness: .3 }), 0, .27, 0, { rz: 2.2 }); }
    if (cfg.extra === 'cape') { const cape = new THREE.Mesh(new THREE.PlaneGeometry(.5, .8, 4, 6), M(COLS[(cfg.col + 5) % COLS.length], { side: THREE.DoubleSide, roughness: .7 })); cape.position.set(0, .03, -.17); cape.rotation.x = .12; cape.castShadow = true; const g = cape.geometry, p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, -Math.pow((.4 - p.getY(i)) / .8, 2) * .08 - Math.cos(p.getX(i) * 6) * .02); g.computeVertexNormals(); const cg = new THREE.Group(); cg.position.set(0, .56, 0); cape.position.y = -.4; cg.add(cape); torso.add(cg); R.cape = cg; }
    // The face, helmet shell and chin share the same proportions.
    const head = new THREE.Group();
    head.position.set(0, .7, 0);
    if (fitted) head.scale.set(.91, .98, .95);
    torso.add(head);
    R.head = head;
    add(head, loft([[-.061,.099,.086],[.096,.107,.093]], 12), skin);
    R.skull = add(head, sculptedSkull(work ? 1.06 : fitted ? .88 : .96), skin, 0, 0, 0);
    const face = new THREE.Group();
    face.position.y = .3;
    head.add(face);
    R.face = face;
    const eyeWhite = M('#f0deca', { roughness: .48 });
    const iris = M(cfg.hair === 2 ? '#454936' : '#38241b', { roughness: .35 });
    const lash = M('#332320', { roughness: .8 });
    const lips = M(['#995c4f','#965b4e','#8d4f38','#713c2e','#65352a','#572d24'][cfg.skin]);
    const skinTone = new THREE.Color(SKIN[cfg.skin]);
    const upper = M('#' + skinTone.clone().multiplyScalar(.83).getHexString(), { roughness:.82 });
    for (const s of [-1, 1]) {
      add(head, Sph(.065,12,10), skin, s*.221,.258,.008,{s:[.56,1.09,.68],rz:-s*.20});
      add(head, Sph(.036,10,8), upper, s*.24,.265,.032,{s:[.38,1,.47]});
    }
    R.eyes = [];
    R.brows = [];
    for (const s of [-1, 1]) {
      const e = new THREE.Group();
      e.position.set(s*.094,.041,.199);
      e.rotation.set(0,s*.245,s*.085);
      face.add(e);
      add(e,Sph(.056,14,9),lash,0,.005,0,{s:[1,.46,.27]});
      add(e,Sph(.051,14,9),eyeWhite,0,-.002,.008,{s:[1,.35,.24]});
      add(e,Sph(.022,14,9),iris,-.004,.001,.019,{s:[1,.95,.35]});
      add(e,Sph(.010,10,8),lash,-.004,.001,.025,{s:[1,1,.30]});
      add(e,Sph(.0046,8,6),eyeWhite,-.008,.008,.028);
      R.eyes.push(e);
      R.brows.push(add(face,RBox(.124,.031,.026,.011),hair,s*.096,.102,.205,
        { rz:s*.12, ry:s*.25 }));

    }
    add(face,loft([[-.056,.031,.027,.213],[-.029,.039,.044,.213],[.006,.027,.031,.216],[.072,.023,.017,.206]],12),skin);
    for (const sign of [-1,1]) add(face,Sph(.013,10,8),upper,sign*.025,-.047,.24,{s:[.75,.38,.52]});

    const mouthLine = new THREE.CatmullRomCurve3([
      V3(-.066,.01,-.012), V3(-.029,-.008,.002), V3(.012,-.011,.006), V3(.068,.017,-.012)
    ]);
    R.mouth = add(face,new THREE.TubeGeometry(mouthLine,13,.007,6,false),lips,0,-.102,.217);
    add(face,Sph(.044,12,8),upper,0,-.125,.204,{s:[1,.16,.32]});
    R.mouthO = add(face,Sph(.046,14,10),M('#3a1f20'),0,-.105,.216,{s:[1,.55,.36]});
    add(R.mouthO,Sph(.034,10,8),eyeWhite,0,.018,.016,{s:[.92,.46,.38]});
    R.mouthO.visible = false;
    // hair / headwear
    const hw = cfg.head;
    if (hw === 'none' || hw === 'goggle' || hw === 'cowboy' || hw === 'mil') add(head, Sph(.242, 22, 14, 0, 6.283, 0, 1.44), hair, 0, .397, -.025, {s:[1,.9,.98]});
    if (hw === 'curls') {
      add(head, Sph(.237,20,14,0,6.283,0,1.57),hair,0,.401,-.025,{s:[1,.83,.95]});
      for (let row = 0; row < 3; row++) {
        const count = [11,9,6][row];
        for (let i = 0; i < count; i++) {
          const a = Math.PI*2*(i+.35*row)/count;
          const r = [.205,.178,.102][row], size = [.065,.078,.075][row];
          add(head,new THREE.IcosahedronGeometry(size,1),hair,
            Math.sin(a)*r,[.402,.495,.553][row] + .018*Math.cos(a),Math.cos(a)*r-.022,
            {s:[1,1,.93],ry:i*.71});
        }
      }
      for (const s of [-1,1]) for (let i = 0; i < 3; i++) {
        add(head,new THREE.IcosahedronGeometry(.064,1),hair,s*.207,.321,-.049-.065*i,{rz:i*.66});
      }
    }
    if (hw === 'pitcap') {
      const canvas = M('#353741',{roughness:.94});
      const panel = M('#4d4f59',{roughness:.94});
      add(head,loft([[.413,.238,.204,-.003],[.478,.248,.207,-.002],[.56,.201,.169,-.013],[.602,.109,.119,-.019],[.621,.022,.034,-.02]],16),canvas);
      add(head,RBox(.384,.035,.239,.015),canvas,0,.426,.237,{rx:-.095});
      add(head,RBox(.391,.017,.217,.006),panel,0,.441,.237,{rx:-.095});
      add(head,RBox(.325,.051,.055,.012),M('#292933'),0,.529,.156,{rx:-.36});
      for (const x of [-.094,.094]) {
        add(head,RBox(.152,.113,.053,.021),M('#b1aba2',{roughness:.4,metalness:.22}),x,.545,.175,{rx:-.42});
        add(head,RBox(.117,.083,.033,.017),M('#46546a',{roughness:.24,metalness:.19}),x,.547,.207,{rx:-.42});
        add(head,RBox(.076,.018,.013,.004),M('#8499ad',{roughness:.41}),x-.013,.569,.226,{rx:-.42});
      }
    }
    if (hw === 'openface') {
      const shell = M(col,{roughness:.35,metalness:.12});
      const lining = M('#252b3b',{roughness:.89});
      const helmet = Sph(.298,22,14);
      const vertices = helmet.attributes.position;
      for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
        // Raise the opening at the brow, retaining the shell low behind the ears.
        const front = ease((z+.03)/.24);
        const lower = -.197 + front*.244;
        vertices.setY(i, .5*(1+y/.298)*(.293-lower)+lower);
        vertices.setX(i,x*.93);
      }
      helmet.computeVertexNormals();
      add(head,helmet,shell,0,.348,-.026);
      for (const s of [-1,1]) {
        add(head,RBox(.087,.204,.189,.035),lining,s*.209,.308,-.029,{rz:-s*.087});
        add(head,RBox(.085,.182,.212,.034),shell,s*.24,.322,-.049,{rz:-s*.11});
        add(head,Cyl(.032,.032,.024,14),M('#bbbcc0',{roughness:.36,metalness:.4}),s*.284,.397,.027,{rz:Math.PI/2});
        add(head,Sph(.089,13,10),hair,s*.161,.19,-.21,{s:[.60,1.29,.97],rz:s*.33});
      }
      add(head,RBox(.37,.052,.148,.022),M('#424c64',{roughness:.31,metalness:.17}),0,.461,.225,{rx:.25});
      for (const x of [-.034,.034]) {
        add(head,RBox(.03,.029,.156,.009),cream,x,.625,.043,{rx:-.14});
        add(head,RBox(.031,.094,.036,.009),cream,x,.583,.151,{rx:-.55});
      }
    }
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
    if (fi === 'beard') {
      add(head,loft([[.038,.102,.083,.073],[.077,.153,.125,.067],[.127,.183,.172,.043],
        [.181,.199,.168,.021]],16,.88),hair);
      for (const sign of [-1,1]) {
        add(face,RBox(.055,.159,.043,.018),hair,sign*.177,-.108,.131,{rz:sign*-.34,ry:sign*.52});
        add(face,RBox(.078,.034,.031,.012),hair,sign*.039,-.068,.219,{rz:sign*.09});
      }

    }
    if (fi === 'stache') for (const sign of [-1,1]) {
      add(face,RBox(.079,.035,.037,.012),hair,sign*.037,-.070,.225,{rz:sign*-.12});
    }
    if (fi === 'patch') { add(face, Cyl(.06, .06, .02), M('#0d0f13'), .1, .02, .3, { rx: 1.57 }); add(head, Tor(.305, .012, 6, 30), M('#0d0f13'), 0, .33, 0, { rx: 1.4, rz: .5 }); }
    root.traverse(m => { if (m.isMesh) { m.castShadow = !m.material.transparent; m.receiveShadow = true; } });
    R.expr = e => setExpr(R, e); setExpr(R, 'smile');
    return R;
  }
  function setExpr(R, expression) {
    const open = expression === 'shock' || expression === 'laugh';
    R.mouth.visible = !open;
    R.mouthO.visible = open;
    R.mouth.rotation.z = expression === 'sad' || expression === 'angry' ? .24 : .03;
    R.mouthO.scale.set(expression === 'laugh' ? 1.34 : .81, expression === 'laugh' ? .65 : .94, .38);
    R.brows.forEach((brow, index) => {
      const sign = index ? 1 : -1;
      brow.rotation.z = sign * (expression === 'angry' ? .34 : expression === 'sad' ? -.32 : .10);
      brow.position.y = expression === 'shock' ? .129 : .104;
    });
    R.eyes.forEach(eye => {
      eye.scale.y = expression === 'laugh' ? .55 : expression === 'shock' ? 1.14 : 1;
    });
  }
  const ease = value => {
    const k = THREE.MathUtils.clamp(value, 0, 1);
    return k * k * (3 - 2 * k);
  };
  const blend = (t, start, end) => ease((t - start) / (end - start));
  const down = V3(0, -1, 0);

  // Solve the joint in parent space. The bend direction keeps elbows outside the
  // suit and knees facing forward while the wrists or boot soles stay planted.
  function reach(limb, target, bend, endRotation) {
    const [upper, lower, end, a, b] = limb;
    const direction = target.clone().sub(upper.position);
    const d = THREE.MathUtils.clamp(direction.length(), Math.abs(a - b) + .001, a + b - .001);
    direction.normalize();
    const along = (a * a - b * b + d * d) / (2 * d);
    const away = Math.sqrt(Math.max(0, a * a - along * along));
    bend.addScaledVector(direction, -bend.dot(direction)).normalize();
    const joint = direction.clone().multiplyScalar(along).addScaledVector(bend, away);
    upper.quaternion.setFromUnitVectors(down, joint.clone().normalize());
    const lowerVector = direction.multiplyScalar(d).sub(joint).normalize();
    const upperInverse = upper.quaternion.clone().invert();
    lower.quaternion.setFromUnitVectors(down, lowerVector.applyQuaternion(upperInverse));
    end.quaternion.copy(lower.quaternion).invert().multiply(upperInverse).multiply(endRotation);
  }

  function pose(rig, p) {
    rig.body.position.set(p.shift ?? 0, p.bob ?? 0, 0);
    rig.torso.rotation.set(p.lean ?? 0, p.twist ?? 0, p.tilt ?? 0);
    const head = p.head || [0, 0, 0];
    rig.head.rotation.set(...head);
    for (const side of ['L', 'R']) {
      const s = side === 'L' ? -1 : 1;
      const foot = p['foot'+side] || [s*.207,.102,.015+s*.055];
      const shoe = new THREE.Quaternion().setFromEuler(new THREE.Euler(
        p['pitch'+side] || 0, s*.10, p['bank'+side] || 0
      ));
      reach(rig.limbs['leg'+side], V3(...foot).sub(rig.body.position), V3(s*.1,0,1), shoe);
      reachHand(rig, side, V3(...(p['hand'+side] || [s*.43,1.085,.127])), p['grip'+side] || 0);
    }
    if (rig.cape) rig.cape.rotation.x = .19 + (p.lean ?? 0) * -.4;
  }

  function reachHand(rig, side, point, roll) {
    const limb = rig.limbs['arm'+side];
    const s = side === 'L' ? -1 : 1;
    const offset = point.clone().sub(rig.body.position).sub(rig.torso.position);
    const torsoInverse = rig.torso.quaternion.clone().invert();
    offset.applyQuaternion(torsoInverse);
    const grip = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.32, 0, roll));
    reach(limb, offset, V3(s*.94, -.22, -.26), torsoInverse.multiply(grip));
  }

  function gripProp(rig, side, prop, x, y, z, roll = 0) {
    const world = prop.localToWorld(V3(x, y, z));
    reachHand(rig, side, rig.root.worldToLocal(world), roll);
  }

  const POSE = {
    idle: t => ({bob: -.015 + Math.sin(t*2)*.008, head:[.015,Math.sin(t*.8)*.13,-.035]}),
    garage: (t, cfg) => {
      const stand = {bob:-.032 + Math.sin(t*2)*.005,head:[.015,-.11,-.025]};
      if (cfg?.top === 'coveralls') return {...stand,
        bob: -.036,handL:[-.467,1.047,.072],handR:[.467,1.045,.106],
        footL:[-.24,.102,.069],footR:[.236,.102,-.042],head:[.011,-.14,.01]};
      if (cfg?.top === 'pitjacket') return {...stand,
        shift:-.065,tilt:.07,twist:-.035,handL:[-.267,1.2,.161],handR:[.392,1.025,.133],
        gripL:.78,footL:[-.25,.102,.123],footR:[.218,.102,-.068],head:[.016,-.20,-.04]};
      return {...stand,shift:.043,tilt:-.043,twist:.08,
        handL:[-.259,1.207,.166],handR:[.423,1.019,.099],gripL:.65,
        footL:[-.241,.102,.158],footR:[.225,.102,-.043],head:[.012,-.114,-.057]};
    },
    cheer: t => ({bob:-.01-Math.abs(Math.sin(t*5))*.042,
      handL:[-.64,2.077+Math.sin(t*6)*.09,.128],handR:[.64,2.077-Math.sin(t*6)*.09,.128],
      gripL:-2.7,gripR:2.7,head:[-.08,0,0]}),
    wave: t => ({handR:[.61+Math.sin(t*9)*.10,2.08,.115],gripR:2.7+Math.sin(t*9)*.4,
      handL:[-.291,1.20,.19],gripL:.54,head:[-.03,.10,.06]}),
    clap: t => {
      const x = .072 + Math.abs(Math.cos(t * 7))*.118;
      return {handL:[-x,1.569,.459],handR:[x,1.569,.459],gripL:-1.2,gripR:1.2,
        bob:-.015,head:[-.02,Math.sin(t)*.12,.026]};
    },
    dance: t => {
      const step = Math.sin(t * 5.8), sway = .095 * step;
      return {shift:sway,bob:-.052 + Math.abs(step)*.034,tilt:-sway*1.1,
        footL:[-.231, .102 + Math.max(0, -step)*.14,.039],
        footR:[.231, .102 + Math.max(0, step)*.14,.081],
        handL:[-.455+step*.138,1.53+step*.30,.357],
        handR:[.455+step*.138,1.53-step*.30,.357],
        gripL:-.72,gripR:.72,head:[.02,step*.14,-step*.12]};
    },
    sulk: t => ({lean:.082,bob:-.056,head:[.30,0,Math.sin(t)*.06]}),
    angry: t => ({lean:.06,handL:[-.446,1.371,.311],handR:[.446,1.371,.311],gripL:-.7,gripR:.7,
      head:[.059,Math.sin(t*5)*.19,0]}),
    laugh: t => ({lean:-.083+Math.sin(t*13)*.032,bob:-.035,head:[-.17+Math.sin(t*12)*.062,.10,0],
      handL:[-.382,1.326,.280],handR:[.407,1.151,.326]}),
    dizzy: t => ({bob:-.08, lean:.09, head:[.12,0,Math.sin(t*4)*.15],
      handL:[-.45,1.395,.25],handR:[.45,1.395,.25]})
  };

  function studio(scene, shadowSpan) {
    const ambient = new THREE.HemisphereLight('#dce5ff', '#4b3c46', 1.18);
    const key = new THREE.DirectionalLight('#fff3e3', 2.13);
    key.position.set(-3.5, 6, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1536, 1536);
    Object.assign(key.shadow.camera, { left:-shadowSpan, right:shadowSpan, bottom:-shadowSpan, top:shadowSpan, far:16 });
    key.shadow.bias = -.0003;
    key.shadow.normalBias = .015;
    const rim = new THREE.DirectionalLight('#a8c8ff', 1.56);
    rim.position.set(2.4, 4, -4);
    scene.add(ambient, key, rim);
  }

  const GAGS = ['champagne', 'kick', 'pie', 'steal', 'dance'];
  const Duration = [5.7, 4.6, 4.8, 5.9, 6.6];

  function podium(host, tops, gagIdx, title, onDone, onTime) {
    const ren = new THREE.WebGLRenderer({ antialias:true });
    ren.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    ren.outputColorSpace = THREE.SRGBColorSpace;
    ren.toneMapping = THREE.ACESFilmicToneMapping; ren.toneMappingExposure = .91;
    ren.shadowMap.enabled = true;
    ren.shadowMap.type = THREE.PCFSoftShadowMap;
    host.append(ren.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#3d4960');
    scene.fog = new THREE.Fog('#3d4960',13,26);
    studio(scene, 5);
    const cam = new THREE.PerspectiveCamera(35, 1, .1, 60);
    let width = 0, height = 0;
    function resize() {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h || (w === width && h === height)) return;
      width = w; height = h;
      ren.setSize(w, h);
      cam.aspect = w/h;
      cam.position.set(.02, 2.87, Math.max(7.05, 9.78 / cam.aspect + .85));
      cam.lookAt(0, 1.76, .12);
      cam.updateProjectionMatrix();
    }
    resize();

    const floor = add(scene,new THREE.CircleGeometry(16,64),M('#49546a',{roughness:.89}),0,0,0,{rx:-Math.PI/2});
    floor.receiveShadow = true;
    const podiumRing = add(scene, new THREE.RingGeometry(3.20,3.24,72),
      M('#797c88',{roughness:.92}),0,.006,0,{rx:-Math.PI/2});
    podiumRing.castShadow = false;
    const steps = [
      {x:0,h:.68,width:1.51,tone:'#d7a34f',n:'1'},
      {x:-1.54,h:.43,width:1.45,tone:'#a6b7c9',n:'2'},
      {x:1.54,h:.34,width:1.45,tone:'#c78969',n:'3'}
    ];
    for (const step of steps) {
      const box = add(scene,RBox(step.width,step.h,1.38,.052),M('#262c38',{roughness:.69}),step.x,step.h/2,0);
      box.receiveShadow = true;
      const top = add(scene,RBox(step.width,.065,1.38,.021),M(step.tone,{roughness:.62,metalness:.21}),step.x,step.h-.032,0);
      top.receiveShadow = true;
      add(scene,RBox(step.width*.89,.026,.037,.006),M(step.tone),step.x,step.h-.127,.694);
      add(scene,new THREE.PlaneGeometry(.37,.27),new THREE.MeshStandardMaterial({
        map:numTex(step.n,step.tone),roughness:.67
      }),step.x,step.h*.37,.7);
    }
    const drivers = tops.slice(0,3).map((entry,index) => {
      const driver = build(entry.cfg, {club:entry.club, rank:entry.rank});
      const step = steps[index];
      driver.base = V3(step.x,step.h,0);
      scene.add(driver.root);
      return driver;
    });
    const [winner, second, third] = drivers;
    const rival = second || third;
    const side = rival?.base.x < 0 ? -1 : 1;
    const spectator = rival === second ? third : second;

    const trophy = new THREE.Group();
    const brass = M('#d7a548',{roughness:.29,metalness:.43});
    const brassEdge = M('#ffe2a1',{roughness:.33,metalness:.31});
    add(trophy,RBox(.36,.092,.25,.026),M('#312935'),0,.047,0);
    add(trophy,RBox(.20,.042,.016,.006),brassEdge,0,.051,.126);
    add(trophy,Cyl(.051,.102,.105,12),brass,0,.136,0);
    add(trophy,loft([[.16,.072,.061],[.22,.123,.093],[.315,.177,.132],[.379,.20,.149]],16,.89),brass);
    add(trophy,Tor(.192,.018,8,32),brassEdge,0,.37,0,{rx:Math.PI/2,s:[1,.77,1]});
    for (const s of [-1,1]) {
      add(trophy,Tor(.095,.018,8,24),brassEdge,s*.192,.287,0,{s:[.81,.92,1]});
    }
    add(trophy,new THREE.IcosahedronGeometry(.052,1),brassEdge,0,.286,.124,{s:[1,.95,.31]});
    scene.add(trophy);

    const bottle = new THREE.Group(), glass = M('#26563d',{roughness:.28,metalness:.15});
    add(bottle,loft([[-.145,.075,.075],[-.102,.082,.082],[.078,.081,.081],[.145,.039,.039],[.246,.033,.033]],14,1),glass);
    add(bottle,Cyl(.084,.084,.083,16),M('#f1dec0',{roughness:.89}),0,-.052,0);
    add(bottle,Cyl(.037,.035,.085,12),brass,0,.207,0);
    const cork = add(bottle,Cyl(.024,.024,.048,10),M('#a7804e'),0,.262,0);
    scene.add(bottle);

    const pie = new THREE.Group();
    const pastry = M('#d9a766',{roughness:.85}), cream = M('#fff0d5',{roughness:.72});
    add(pie,Cyl(.168,.134,.063,18),pastry,0,0,0);
    add(pie,Sph(.159,18,12,0,6.283,0,1.57),cream,0,.021,0,{s:[1,.39,1]});
    for (let i=0; i<8; i++) {
      const a = i * Math.PI/4;
      add(pie,Sph(.032,10,8),cream,Math.sin(a)*.110,.045,Math.cos(a)*.110,{s:[1,1.05,1]});
    }
    add(pie,Sph(.029,12,8),M('#ad3a3e'),0,.083,0);
    scene.add(pie);

    const splat = new THREE.Group();
    const visor = winner && ['helmet','clubhelm'].includes(winner.cfg.head);
    if (winner) {
      winner.head.add(splat);
      splat.position.set(0,.277,visor ? .374 : .255);
      for (const [x,y,s] of [[0,0,.104],[-.072,.025,.067],[.072,.011,.065],[.018,-.071,.052],[-.119,.057,.023],[.124,-.041,.033]]) {
        add(splat,Sph(s,12,8),cream,x,y,0,{s:[1,.77,.25]});
      }
    }
    const sparkles = new THREE.Group();
    for (let i=0; i<5; i++) {
      const a=i*Math.PI*2/5;
      add(sparkles,new THREE.OctahedronGeometry(.047),brassEdge,Math.sin(a)*.32,0,Math.cos(a)*.22);
    }
    scene.add(sparkles);

    const cloud = new THREE.Group(), smoke = M('#6d788e',{roughness:.94});
    for (let i=0; i<5; i++) add(cloud,Sph(.150+(i%2)*.053,14,10),smoke,(i-2)*.117,(i%2)*.075,0,{s:[1,.70,.89]});
    scene.add(cloud);
    const droplets = Array.from({length:48},(_,i) => {
      const color = i%3 === 0 ? '#ffc866' : '#fff1ce';
      return add(scene,Sph(.022,8,6),M(color,{roughness:.5}),0,0,0,{s:[.80,1.65,.80]});
    });
    const gagIndex = ((gagIdx|0)%GAGS.length+GAGS.length)%GAGS.length;
    const gag = GAGS[gagIndex], duration = Duration[gagIndex];
    const headWorld = driver => driver.head.localToWorld(V3(0,.32,0));
    const reset = (driver, t, p = POSE.idle(t), expression = 'smile') => {
      driver.root.position.copy(driver.base);
      driver.root.rotation.set(0, 0, 0);
      pose(driver,p);
      driver.expr(expression);
    };
    const holdTrophy = (owner, at, sideOnly) => {
      trophy.position.copy(at);
      if (sideOnly !== 1) gripProp(owner,'L',trophy,-.270,.291,.012,-.96);
      if (sideOnly !== -1) gripProp(owner,'R',trophy,.270,.291,.012,.96);
    };
    const favoriteCup = () => winner.base.clone().add(V3(0,1.444,.492));
    const stamp = (t, index) => .5 + .5*Math.sin(t + index*9.341);

    function champagne(t) {
      const lift = blend(t,.47,1.12), settle = blend(t,3.47,4.51);
      const shake = Math.sin(t*24)*.046 * blend(t,1,1.28) * (1-blend(t,2,2.24));
      pose(winner, {head:[-.10,-.19,-.035],bob:-.035,handL:[-.454,1.38,.238],gripL:-.76});
      winner.expr(t < 2.22 ? 'smile' : 'laugh');
      bottle.visible = true;
      const hand = V3(.43+.161*lift-.137*settle,1.14+.708*lift-.49*settle,.316+shake);
      bottle.position.copy(winner.root.localToWorld(hand));
      bottle.rotation.set(-.19,0,-.18-.50*lift+.4*settle);
      gripProp(winner,'R',bottle,0,-.020,.007,1.32);
      trophy.position.copy(winner.base).add(V3(-.54, .002,.44));
      cork.visible = t < 2.24;
      if (t >= 2.24 && t < 3.8) {
        const source = bottle.localToWorld(V3(0,.256,0));
        for (const [i, drop] of droplets.entries()) {
          const age = (t-2.24-i*.047) % .76;
          if (age < 0) continue;
          drop.visible = true;
          drop.position.copy(source).add(V3(age*(.64+stamp(0,i)*1.36),
            age*(2.15+stamp(3,i)*.97)-3.92*age*age,age*(-.28+stamp(7,i)*1.10)));
        }
      }
      if (third) {
        const duck = blend(t,2.25,2.49)*(1-blend(t,3.52,4.17));
        pose(third,{bob:-.015-.158*duck, lean:-.08*duck, head:[.13*duck,-.37, .28*duck],
          handL:[-.43,1.08+.73*duck,.17], handR:[.43,1.08+.57*duck,.15]});
        third.expr(duck > .4 ? 'shock' : 'smile');
      }
    }

    function kick(t) {
      const contact = 1.69;
      const extend = blend(t,1.32,contact)*(1-blend(t,contact+.06,2.11));
      const wind = blend(t,.58,1.1)*(1-blend(t,1.34,1.57));
      const lean = blend(t,.55,1.48)*(1-blend(t,2.05,2.45));
      const nudge = blend(t,contact,2.55);
      const landing = blend(t,2.45,2.84);
      const hop = Math.sin(Math.PI*nudge)*.20;
      if (third) {
        pose(third,{
          ...POSE.dizzy(t),bob:-.035-.12*blend(t,contact,1.84)+.12*landing,tilt: -.24 * (nudge-landing),
          footR:[.189+.20*(nudge-landing),.102,.083],
          footL:[-.196-.06*(nudge-landing),.102,.115]
        });
        third.root.position.set(third.base.x+1.08*nudge, third.base.y*(1-landing)+hop, .24*nudge);
        third.root.rotation.y = -.28 + .62*nudge;
        third.expr(t < contact ? 'smile' : 'shock');
        sparkles.visible = t >= 2.84 && t < 4.1;
        sparkles.position.copy(headWorld(third)).add(V3(0,.46,0));
        sparkles.rotation.y = t*3;
      }
      pose(winner, {shift:.111*lean,tilt:.135*extend, bob:-.067*lean,
        head:[.03,.52*lean,0], handL:[-.43,1.48,.37],
        handR:[.46,1.23,.28], footL:[-.139-.206*lean,.102,-.025],
        footR:[.23+.71*extend-.11*wind,.102+.70*extend+.26*wind,.064+.16*extend],
        pitchR:-.63*extend,bankR:.65*extend});
      winner.root.position.x = .206*lean;
      winner.expr(t > contact ? 'laugh' : 'smile');
      trophy.position.copy(winner.base).add(V3(-.51,.002,.446));
    }

    function pieGag(t) {
      trophy.position.copy(winner.base).add(V3(.51,.002,.443));
      if (!rival) return;
      const windup = blend(t,.65,1.26);
      const toss = blend(t,1.26,1.65);
      const release = 1.65, hit = 2.27;
      const recoil = blend(t,hit,2.45)*(1-blend(t,2.52,3.08));
      pose(winner,{bob:-.021-.047*recoil,lean:-.11*recoil,
        head:[-.10*recoil, .09*(1-recoil),-.12*recoil],
        handL:[-.423,1.17+.53*recoil,.246], handR:[.431,1.21+.45*recoil,.241]});
      winner.expr(t < hit ? 'smile' : 'shock');
      splat.visible = t >= hit;
      const throwing = side < 0 ? 'R' : 'L';
      const start = rival.base.clone().add(V3(-side*.47,1.93,.465));
      const held = rival.base.clone().add(V3(side*(.28-.32*windup),1.405+.277*windup,.35));
      if (t < release) {
        pose(rival,{head:[-.04,-side*.35,0],bob:-.031,twist:-side*.17});
        pie.visible = true;
        pie.position.copy(held.lerp(start,toss));
        pie.rotation.set(.1+toss*.46,0,side*toss*.15);
        gripProp(rival,throwing,pie,0,-.055,0,-side*.75);
      } else {
        pose(rival, t < 2.18 ? { head:[-.09,-side*.35,0], ['hand'+throwing]:[-side*.51,1.75,.41]} : POSE.laugh(t));
        rival.expr(t > hit ? 'laugh' : 'smile');
        pie.visible = t < hit;
        const q = THREE.MathUtils.clamp((t-release)/(hit-release),0,1);
        const target = winner.head.localToWorld(V3(0,.278,visor ? .50 : .386));
        pie.position.copy(start).lerp(target,q);
        pie.position.y += Math.sin(q*Math.PI)*.31;
        pie.rotation.set(.56+q*.96, side*q*.32,side*.15*(1-q));
      }
    }

    function steal(t) {
      const start = favoriteCup();
      if (!rival) {
        holdTrophy(winner,start);
        return;
      }
      const nearer = side < 0 ? 'L' : 'R';
      const thiefHand = side < 0 ? 'R' : 'L';
      const moveIn = blend(t,.68,1.77);
      const carry = blend(t,2.32,3.08);
      const depart = blend(t,3.16,4.43);
      const lower = blend(t,4.02,4.46);
      const hop = Math.sin(Math.PI*depart)*.13;
      const release = 2.38;
      rival.root.position.set(rival.base.x-side*.318*moveIn+side*1.12*depart,
        rival.base.y*(1-lower)+hop,.067*moveIn+1.10*depart);
      rival.root.rotation.y = -side*.30*moveIn+side*.66*depart;
      pose(rival,{
        bob:-.034,head:[-.025,-side*.18*(1-depart),0],
        footL:[-.202,.102+Math.max(0,Math.sin(t*19))*.19*Math.sin(depart*Math.PI),.069],
        footR:[.202,.102+Math.max(0,-Math.sin(t*19))*.19*Math.sin(depart*Math.PI),-.023]
      });
      rival.expr(t < release ? 'smile' : 'laugh');
      const shift = blend(t,1.11,2.14);
      const handoff = start.clone().add(V3(side*.47*shift,-.20*shift,-.012));
      const carried = rival.root.localToWorld(V3(-side*.185,1.40,.402));
      trophy.rotation.y = rival.root.rotation.y * carry;
      const cupPosition = handoff.lerp(carried,carry);
      const lunge = blend(t,release,2.73)*(1-blend(t,2.89,3.35));
      pose(winner,{shift:side*.065*shift, bob:-.035,twist:side*.11,head:[.06,side*.40*shift,-side*.08],
        ['hand'+nearer]:[side*(.43+.22*lunge),1.07+.47*lunge,.29]});
      winner.expr(t <= release ? 'smile' : 'shock');
      if (t < release) holdTrophy(winner,cupPosition,t < 1.55 ? 0 : side);
      else trophy.position.copy(cupPosition);
      if (t >= 1.51) {
        const grip = side < 0 ? .96 : -.96;
        const g = blend(t,1.51,2.06);
        rival.root.updateMatrixWorld(true);
        const limb = rival['hand'+thiefHand];
        const target = limb.getWorldPosition(V3()).lerp(trophy.localToWorld(V3(side*.268,.285,.012+.118*(1-blend(t,release,release+.20)))),g);
        reachHand(rival,thiefHand,rival.root.worldToLocal(target),grip);
      }
    }

    function dance(t) {
      const groove = Math.max(0,t-.49);
      trophy.position.copy(winner.base).add(V3(.54,.002,.44));
      if (groove <= 0) return;
      pose(winner,POSE.dance(groove));
      winner.expr('laugh');
      if (second) {
        pose(second,POSE.dance(groove+.42));
        second.expr('laugh');
      }
      if (third) {
        pose(third,POSE.sulk(t));
        third.expr('sad');
        cloud.visible = true;
        cloud.position.copy(headWorld(third)).add(V3(0,.5+Math.sin(t*3)*.036,.017));
        for (let i=0;i<18;i++) {
          const q = (groove*2.7+i*.1517)%1;
          const drop=droplets[i];
          drop.visible = true;
          drop.position.copy(cloud.position).add(V3(.23*(stamp(5,i)-.5),-.10-q*.47,.229+stamp(6,i)*.11));
        }
      }
    }

    const choreograph = {champagne,kick,pie:pieGag,steal,dance};
    function draw(t) {
      resize();
      drivers.forEach((driver,index) => reset(driver,t,
        index === 0 ? POSE.idle(t) : POSE.clap(t),
        'smile'));
      if (second) second.root.rotation.y = .18;
      if (third) third.root.rotation.y = -.18;
      for (const prop of [bottle,pie,splat,sparkles,cloud,...droplets]) prop.visible = false;
      trophy.rotation.set(0,0,0);
      trophy.visible = Boolean(winner);
      if (winner) choreograph[gag](t);
      ren.render(scene,cam);
      onTime?.(t,duration);
    }

    const start = performance.now();
    let raf = 0, time = 0;
    function frame(now) {
      time = Math.min(duration,(now-start)/1000);
      draw(time);
      if (time < duration) raf = requestAnimationFrame(frame);
      else onDone?.();
    }
    raf = requestAnimationFrame(frame);
    return {
      canvas:ren.domElement, gag, drivers, duration,
      project: (r,dy) => {
        const v=headWorld(r);
        v.y += dy ?? .6;
        v.project(cam);
        return [(v.x+1)/2,(1-v.y)/2];
      },
      seek(t) {cancelAnimationFrame(raf); time=THREE.MathUtils.clamp(t,0,duration);draw(time);},
      resize() {draw(time);},
      dispose() {
        cancelAnimationFrame(raf);
        scene.traverse(o => o.geometry?.dispose());
        ren.dispose();
        ren.forceContextLoss?.();
        ren.domElement.remove();
      }
    };
  }
  /* ---------- garage preview: one driver on a turntable, drag to spin ---------- */
  function preview(host, cfg, club) {
    const W = host.clientWidth || 300, H = host.clientHeight || 300;
    const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true }); ren.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); ren.setSize(W, H); ren.outputColorSpace = THREE.SRGBColorSpace; ren.toneMapping = THREE.ACESFilmicToneMapping; ren.toneMappingExposure = .91; ren.shadowMap.enabled = true; ren.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(ren.domElement);
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(30,W/H,.1,30);
    function aim() {
      cam.position.set(0,1.54,Math.max(5.87,3.05/cam.aspect));
      cam.lookAt(0,1.26,0);
      cam.updateProjectionMatrix();
    }
    aim();
    studio(scene,2.0);
    const disc = add(scene,Cyl(.901,.939,.085,48),M('#4a5263',{roughness:.85}),0,-.041,0);
    disc.receiveShadow = true;
    const ringM = add(scene,Tor(.91,.009,6,64),M('#8a8e9b',{roughness:.87}),0,-.008,0,{rx:Math.PI/2});
    let R = null, yaw = .22, vy = 0, drag = null, raf = 0, t0 = performance.now(), last = t0, act = 'garage', actT = 0;
    const set = (c, cl) => { if (R) { scene.remove(R.root); R.root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } R = build(c, { club: cl }); scene.add(R.root); act = 'garage'; actT = 0; };
    set(cfg, club);
    const down = e => { const p = e.touches ? e.touches[0] : e; drag = { x: p.clientX, yaw }; vy = 0; }, move = e => { if (!drag) return; const p = e.touches ? e.touches[0] : e; const ny = drag.yaw + (p.clientX - drag.x) * .012; vy = ny - yaw; yaw = ny; e.preventDefault && e.cancelable && e.preventDefault(); }, up = () => { drag = null; };
    ren.domElement.addEventListener('pointerdown', down); addEventListener('pointermove', move, { passive: false }); addEventListener('pointerup', up); addEventListener('pointercancel', up); ren.domElement.style.touchAction = 'none';
    function frame() { const now = performance.now(), t = (now - t0) / 1000, dt = Math.min(.05, (now - last) / 1000); last = now; if (!drag) { yaw += vy; vy *= Math.pow(.93, dt * 60);  } if (actT > 0) actT -= dt; pose(R, (actT > 0 ? POSE[act] : POSE.garage)(t,R.cfg)); if (R.cape) R.cape.rotation.x = .12 + Math.sin(t * 2) * .04; R.root.rotation.y = yaw; disc.rotation.y = yaw; ren.render(scene, cam); raf = requestAnimationFrame(frame); }
    raf = requestAnimationFrame(frame);
    return { set, play(a) { if (Object.hasOwn(POSE, a)) { act = a; actT = 1.6; } }, snapshot(size) { // head-and-shoulders portrait for the profile badge
        const c2 = new THREE.PerspectiveCamera(26, 1, .1, 20); c2.position.set(.0, 2.31, 2.32); c2.lookAt(0, 2.07, 0); const y0 = R.root.rotation.y; R.root.rotation.y = .25; pose(R, POSE.idle(0)); R.expr('smile');
        const rt = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); rt.setSize(size, size); rt.outputColorSpace = THREE.SRGBColorSpace; rt.toneMapping = THREE.ACESFilmicToneMapping; rt.toneMappingExposure = .91; disc.visible = ringM.visible = false; rt.render(scene, c2); const url = rt.domElement.toDataURL('image/png'); disc.visible = ringM.visible = true; rt.dispose(); rt.forceContextLoss && rt.forceContextLoss(); R.root.rotation.y = y0; return url; },
      resize() { const w = host.clientWidth, h = host.clientHeight; if (w && h) { ren.setSize(w, h); cam.aspect = w / h; aim(); } },
      dispose() { cancelAnimationFrame(raf); removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); scene.traverse(o => { if (o.geometry) o.geometry.dispose(); }); ren.dispose(); ren.forceContextLoss && ren.forceContextLoss(); ren.domElement.remove(); } };
  }
  return { build, podium, preview, ITEMS, CATS, SKIN, COLS, HAIR, DEF, enc, dec, randomCfg, GAGS, pose, POSE };
}
