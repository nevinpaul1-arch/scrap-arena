// Racing stripes + number roundels, painted in the shader so they wrap over hood, roof and trunk
// and split with the body panels (a stripe on the hood falls off with the hood).
import * as THREE from 'three';

// per-car livery. t: 1 single centre stripe, 2 twin stripes, 3 offset stripe. w/gap/off in metres.
export const LIVERY = {
  cruiser:  { t: 2, w: .28, gap: .22, col: '#f4f4f0', num: 7 },
  dart:     { t: 1, w: .5, col: '#f4f4f0', num: 23 },
  bruiser:  { t: 3, w: .36, off: .18, col: '#ffcc33', num: 88 },
  drifter:  { t: 2, w: .22, gap: .2, col: '#1d1f24', num: 3 },
  hauler:   { t: 2, w: .2, gap: .3, col: '#26282d', num: 41 },
  rocket:   { t: 2, w: .16, gap: .28, col: '#1d1f24', num: 1 },
  fortress: { t: 2, w: .2, gap: .26, col: '#e8b50c', num: 99 },
  phantom:  { t: 1, w: .3, col: '#e63946', num: 13 },
};

function numTexture(n) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.beginPath(); g.arc(128, 128, 122, 0, 6.283); g.fillStyle = '#16171b'; g.fill();
  g.beginPath(); g.arc(128, 128, 106, 0, 6.283); g.fillStyle = '#f7f6f1'; g.fill();
  g.fillStyle = '#16171b'; g.font = `900 ${String(n).length > 1 ? 128 : 150}px Arial Black, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String(n), 128, 136);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// geometry info after the car is normalised: hl half length, hsx hood start, tex trunk end, belt height
export function decalUniforms(liv, g) {
  const on = !!liv;
  liv = liv || { t: 0, w: 0, col: '#fff', num: 0 };
  const roofX = (g.hsx + g.tex) / 2 - .1, sideX = (g.hsx + g.tex) / 2;
  return {
    dStripe: { value: liv.t || 0 }, dW: { value: liv.w || 0 }, dGap: { value: liv.gap || 0 }, dOff: { value: liv.off || 0 },
    dCol: { value: new THREE.Color(liv.col) },
    dUseNum: { value: on && liv.num ? 1 : 0 }, dNum: { value: numTexture(liv.num || 0) },
    dNumC: { value: new THREE.Vector2(roofX, 0) }, dNumR: { value: g.roofR || .42 },
    dSide: { value: new THREE.Vector3(sideX, g.sideY || .62, g.sideR || .34) },
  };
}
export const DECAL_VERT_HEAD = 'varying vec3 vWN;\n';
export const DECAL_VERT = '\n vWN = normalize(mat3(modelMatrix) * objectNormal);';
export const DECAL_FRAG_HEAD = `varying vec3 vWN;
uniform int dStripe, dUseNum; uniform float dW, dGap, dOff, dNumR; uniform vec3 dCol, dSide; uniform vec2 dNumC; uniform sampler2D dNum;
float decal(inout vec3 c, vec3 p) {
  vec3 n = normalize(vWN);
  if (dUseNum == 1 && n.y > .55) { vec2 uv = vec2((p.x - dNumC.x), -(p.z - dNumC.y)) / (2.0 * dNumR) + .5;
    if (uv.x > 0. && uv.x < 1. && uv.y > 0. && uv.y < 1.) { vec4 t = texture2D(dNum, uv); if (t.a > .5) { c = t.rgb; return 1.0; } } }
  if (dUseNum == 1 && abs(n.z) > .6) { vec2 uv = vec2((p.x - dSide.x) * sign(p.z), p.y - dSide.y) / (2.0 * dSide.z) + .5;
    if (uv.x > 0. && uv.x < 1. && uv.y > 0. && uv.y < 1.) { vec4 t = texture2D(dNum, uv); if (t.a > .5) { c = t.rgb; return 1.0; } } }
  if (dStripe > 0 && (n.y > .3 || abs(n.x) > .55)) {
    float z = p.z, d = -1.0;
    if (dStripe == 1) d = dW * .5 - abs(z);
    if (dStripe == 2) d = min(abs(z) - dGap * .5, dGap * .5 + dW - abs(z));
    if (dStripe == 3) d = min(z - dOff, dOff + dW - z);
    if (d > 0.0) { c = d < .035 ? dCol * .35 : dCol; return 1.0; }
  }
  return 0.0;
}
`;
