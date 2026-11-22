// Liveries: racing stripes, a sash, and a race number, painted in the shader so they wrap over hood,
// roof and trunk and split with the body panels (a stripe on the hood falls off with the hood).
// Also tints the window glass dark.
import * as THREE from 'three';

// bands: up to 4 lengthwise stripes [z0, z1, colour] (metres across the car, 0 = centre line)
// sash: diagonal band over the roof and down the sides {x0, w, col}
// num: race number; roundel: white disc behind it; ncol: digit colour
const twin = (w, gap, col) => [[gap / 2, gap / 2 + w, col], [-gap / 2 - w, -gap / 2, col]];
export const LIVERY = {
  cruiser:  { bands: twin(.24, .22, '#f1e6cc'), num: '27', roundel: true, ncol: '#16171b' },
  dart:     { sash: { x0: -.15, w: .34, col: '#f2b705' }, num: '18', ncol: '#ffffff' },
  bruiser:  { bands: [[-.4, -.12, '#f26b1d']], num: '43', ncol: '#ffffff' },
  drifter:  { bands: [[.16, .25, '#d7263d'], [.31, .4, '#2e4fa3']], num: '08', ncol: '#2e4fa3' },
  hauler:   { bands: [[-.44, -.12, '#efe3c2']], num: '34', ncol: '#ffffff' },
  rocket:   { bands: twin(.16, .26, '#1d1f24'), num: '05', ncol: '#1d1f24', numAt: 'hood' },
  fortress: { bands: twin(.17, .24, '#7fa8e0'), num: '62', ncol: '#ffffff' },
  phantom:  { bands: twin(.17, .24, '#8a8d96'), num: '77', ncol: '#ffffff' },
};

function numTexture(L) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  if (L && L.num) {
    if (L.roundel) { g.beginPath(); g.arc(128, 128, 120, 0, 6.283); g.fillStyle = '#f7f6f1'; g.fill(); }
    g.font = '900 150px Arial Black, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    if (!L.roundel) { g.lineWidth = 16; g.strokeStyle = L.ncol === '#ffffff' ? 'rgba(15,16,20,.75)' : 'rgba(255,255,255,.8)'; g.strokeText(L.num, 128, 136); }
    g.fillStyle = L.ncol || '#ffffff'; g.fillText(L.num, 128, 136);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// g: car geometry after normalising. hsx hood start, tex trunk end, hw half width, belt (window line height), roofY
export function decalUniforms(L, g) {
  const bands = [], bcol = [];
  for (let i = 0; i < 4; i++) { const b = L && L.bands && L.bands[i]; bands.push(new THREE.Vector3(b ? b[0] : 0, b ? b[1] : 0, b ? 1 : 0)); bcol.push(new THREE.Color(b ? b[2] : '#fff')); }
  const sash = L && L.sash;
  return {
    dB: { value: bands }, dBC: { value: bcol },
    dSash: { value: new THREE.Vector3(sash ? sash.x0 : 0, sash ? sash.w : 0, sash ? 1 : 0) }, dSashC: { value: new THREE.Color(sash ? sash.col : '#fff') },
    dHW: { value: g.hw || .9 }, dRoofY: { value: g.roofY || 1.2 },
    dUseNum: { value: L && L.num ? 1 : 0 }, dNum: { value: numTexture(L) },
    dNumC: { value: new THREE.Vector2(g.numX ?? (g.hsx + g.tex) / 2, 0) }, dNumR: { value: g.numR || .4 },
    dGlass: { value: 1 }, dBelt: { value: g.belt || .8 },
  };
}
export const DECAL_VERT_HEAD = 'varying vec3 vWN;\n';
export const DECAL_VERT = '\n vWN = normalize(mat3(modelMatrix) * objectNormal);';
export const DECAL_FRAG_HEAD = `varying vec3 vWN;
uniform vec3 dB[4]; uniform vec3 dBC[4]; uniform vec3 dSash, dSashC; uniform float dHW, dRoofY, dNumR, dBelt; uniform int dUseNum, dGlass; uniform vec2 dNumC; uniform sampler2D dNum;
float decal(inout vec3 c, vec3 p) {
  vec3 n = normalize(vWN);
  if (dUseNum == 1 && n.y > .55) { vec2 uv = vec2(-(p.x - dNumC.x), (p.z - dNumC.y)) / (2.0 * dNumR) + .5;
    if (uv.x > 0. && uv.x < 1. && uv.y > 0. && uv.y < 1.) { vec4 t = texture2D(dNum, uv); if (t.a > .5) { c = t.rgb; return 1.0; } } }
  if (dSash.z > .5) { float d = -1.0;
    if (n.y > .45) d = dSash.y * .5 - abs((p.x - dSash.x) + p.z * .75);
    else if (abs(n.z) > .5) { float xe = dSash.x - sign(p.z) * dHW * .75; d = dSash.y * .5 - abs((p.x - xe) - sign(p.z) * (dRoofY - p.y) * .85); }
    if (d > 0.0) { c = dSashC; return 1.0; } }
  if (n.y > .3 || abs(n.x) > .55) for (int i = 0; i < 4; i++) { if (dB[i].z > .5) { float d = min(p.z - dB[i].x, dB[i].y - p.z); if (d > 0.0) { c = dBC[i]; return 1.0; } } }
  return 0.0;
}
vec3 glassTint(vec3 c, vec3 p, vec3 hc) {
  if (dGlass == 1 && p.y > dBelt && hc.z > .5 && ((hc.x > .5 && hc.x < .7 && hc.y < .5) || hc.y < .12) && normalize(vWN).y < .9) { vec3 n = normalize(vWN); float f = clamp(n.y, 0.0, 1.0); return mix(vec3(.035, .045, .07), vec3(.1, .13, .19), f); }
  return c;
}
`;
// where the roof is (highest flat stretch along the centre line) -> number placement
export function roofInfo(meshes, hl) {
  const ray = new THREE.Raycaster(), ys = [];
  for (let x = -hl * .8; x <= hl * .8; x += hl / 40) { ray.set(new THREE.Vector3(x, 10, 0), new THREE.Vector3(0, -1, 0)); const h = ray.intersectObjects(meshes, false)[0]; ys.push([x, h ? h.point.y : 0]); }
  const top = Math.max(...ys.map(v => v[1])), roof = ys.filter(v => v[1] > top * .93).map(v => v[0]);
  const x0 = Math.min(...roof), x1 = Math.max(...roof);
  return { numX: x1 - Math.min(.45, (x1 - x0) * .35), roofY: top, roofLen: x1 - x0 };
}
