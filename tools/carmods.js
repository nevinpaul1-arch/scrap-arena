// Front/back readability pass for the Kenney cars.
// 1) Long-nose stretch: hood gets longer, trunk shorter, cabin sits further back (classic front-engine silhouette).
// 2) Front kit: black grille band, big bright headlights, dark hood scoop.
// 3) Rear kit: red tail-light bars and a dark rear diffuser band.
// Works on a normalised car (front = +x, wheels on y=0, centred). Returns { root, hsx, tex } in world metres.
import * as THREE from 'three';

export function applyCarMods(car, P, len) {
  const S = Object.assign({ nose: .22, tail: .3, kit: true }, P.mod || {});
  car.updateMatrixWorld(true);
  let bb = new THREE.Box3().setFromObject(car);
  const L0 = bb.max.x - bb.min.x, hs0 = L0 * (P.hs ?? .16), te0 = L0 * (P.te ?? -.24);
  // bake every mesh into world space so we can bend it
  const root = new THREE.Group(), meshes = [];
  car.traverse(o => { if (o.isMesh && o.visible) meshes.push(o); });
  const f = x => x > hs0 ? x + (x - hs0) * S.nose : x < te0 ? te0 + (x - te0) * (1 - S.tail) : x;
  for (const o of meshes) {
    const g0 = o.geometry.clone();
    for (const [n, at] of Object.entries(g0.attributes)) { // de-quantise (Kenney GLBs pack positions as normalised ints)
      const c = at.itemSize, arr = new Float32Array(at.count * c);
      for (let i = 0; i < at.count; i++) for (let j = 0; j < c; j++) arr[i * c + j] = at.getComponent ? at.getComponent(i, j) : [at.getX(i), at.getY(i), at.getZ(i), at.getW(i)][j];
      g0.setAttribute(n, new THREE.BufferAttribute(arr, c));
    }
    g0.boundingBox = null; g0.boundingSphere = null;
    const g = g0.applyMatrix4(o.matrixWorld), p = g.attributes.position;
    if (/wheel/i.test(o.name)) { // wheels move, never stretch
      g.computeBoundingBox(); const c = (g.boundingBox.min.x + g.boundingBox.max.x) / 2, d = f(c) - c;
      g.translate(d, 0, 0);
    } else { for (let i = 0; i < p.count; i++) p.setX(i, f(p.getX(i))); p.needsUpdate = true; g.computeVertexNormals(); }
    g.boundingBox = null; g.boundingSphere = null; g.computeBoundingBox(); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, o.material); m.name = o.name; root.add(m);
  }
  // renormalise to the requested length, centred
  bb = new THREE.Box3().setFromObject(root); let k = len / (bb.max.x - bb.min.x);
  root.scale.setScalar(k); bb = new THREE.Box3().setFromObject(root);
  root.position.set(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2); root.updateMatrixWorld(true);
  const off = root.position.x, hsx = f(hs0) * k + off, tex = f(te0) * k + off;
  bb = new THREE.Box3().setFromObject(root);
  const hl = bb.max.x, hw = bb.max.z, body = root.children.filter(m => !/wheel/i.test(m.name));
  // height of the top surface at (x, z)
  const ray = new THREE.Raycaster();
  const topY = (x, z) => { ray.set(new THREE.Vector3(x, 10, z), new THREE.Vector3(0, -1, 0)); const h = ray.intersectObjects(body, false)[0]; return h ? h.point.y : 0; };
  if (S.kit) {
    const kit = new THREE.Group();
    const M = (c, e = 0, rough = .5, metal = 0) => new THREE.MeshStandardMaterial({ color: c, emissive: e ? c : '#000', emissiveIntensity: e, roughness: rough, metalness: metal });
    const black = M('#16171a', 0, .7), chrome = M('#cfd5dc', 0, .25, .9), head = M('#fff3c4', 1.6, .3), tail = M('#d40000', .55, .4);
    const box = (sx, sy, sz, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); b.position.set(x, y, z); b.name = 'kit'; kit.add(b); return b; };
    const wIn = hw - .1;
    const hray = new THREE.Raycaster();
    const faceX = (y, z, dir) => { hray.set(new THREE.Vector3(dir * 10, y, z), new THREE.Vector3(-dir, 0, 0)); const h = hray.intersectObjects(body, false)[0]; return h ? h.point.x : dir * hl; };
    const hoodY = Math.max(.35, topY(hl - .4, 0)), trunkY = Math.max(.35, topY(-hl + .35, 0));
    const glass = M('#fff6dc', .45, .25), frame = M('#1a1b1f', 0, .6), slat = M('#3a3d44', 0, .5, .3), tailM = M('#c81414', .35, .4);
    // front face: dark grille with slats between two inset headlights (nothing on top, so the hood stays clean)
    { const y = hoodY - .2, zg = Math.max(.2, hw - .62), x = faceX(y, 0, 1);
      box(.06, .2, zg * 2, x - .02, y, 0, frame); for (const dy of [-.05, .02]) box(.065, .025, zg * 2 - .06, x - .015, y + dy, 0, slat); }
    for (const s of [-1, 1]) { const y = hoodY - .17, z = s * (hw - .36), x = faceX(y, z, 1);
      box(.06, .17, .42, x - .02, y, z, frame); box(.06, .12, .34, x - .012, y, z, glass); }
    // rear face: tail lights only
    for (const s of [-1, 1]) { const y = trunkY - .14, z = s * (hw - .34), x = faceX(y, z, -1);
      box(.06, .15, .4, x + .02, y, z, frame); box(.06, .1, .32, x + .012, y, z, tailM); }
    // hood scoop: dark intake on the hood
    { const x = (hsx + hl) / 2, y = topY(x, 0); box(.55, .09, .46, x, y + .03, 0, black); box(.07, .1, .46, x + .27, y + .03, 0, M('#050506', 0, .9)); }
    // car materials get injected later; keep the kit in the same root so it splits into hood/bumper/trunk with the body
    for (const m of [...kit.children]) { const w = m.position.clone(); m.position.copy(root.worldToLocal(w)); m.scale.setScalar(1 / k); root.add(m); }
  }
  root.updateMatrixWorld(true); const bf = new THREE.Box3().setFromObject(root);
  globalThis.__dbg = { hl, hw, off, k, minx: bb.min.x, maxx: bb.max.x, after: [bf.min.x, bf.max.x], kit: root.children.filter(m => m.name === 'kit').map(m => { const v = new THREE.Vector3(); m.getWorldPosition(v); return +v.x.toFixed(2); }) };
  return { root, hsx, tex };
}
