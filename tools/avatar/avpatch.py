# Applies Scrap Arena's phone-performance and safety tweaks to a vendor avatar3d.js.
# usage: python3 avpatch.py parts/avatar3d.vendor.js parts/avatar3d.js
import sys
s=open(sys.argv[1]).read()
def rep(a,b,n=1):
    global s; c=s.count(a); assert c==n,(c,a[:70]); s=s.replace(a,b)
rep("function makeAV(THREE) {", """function makeAV(THREE, Q) {
  Q = Q || {}; if (!Object.hasOwn) Object.hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  // quality: Q.low starts light; watch() steps down live if frames run slow (sharpness first, then shadows)
  const PR = cap => Q.low ? 1 : Math.min(devicePixelRatio || 1, cap);
  function watch(ren, scene) { let n = 0, acc = 0, lvl = 0, warm = 24;
    return dt => { if (warm > 0) { warm--; return; } acc += dt; if (++n < 40) return; const avg = acc / n; n = 0; acc = 0; if (avg < .03 || lvl > 1) return;
      lvl++; Q.onSlow && Q.onSlow(lvl);
      if (lvl === 1 && ren.getPixelRatio() > 1) { ren.setPixelRatio(1); const c = ren.domElement; ren.setSize(c.clientWidth, c.clientHeight, false); }
      else { lvl = 2; ren.shadowMap.enabled = false; scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); }); } }; }""")
rep("ren.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));","ren.setPixelRatio(PR(1.5));")
rep("ren.shadowMap.type = THREE.PCFSoftShadowMap;","ren.shadowMap.type = Q.low ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;", 2)
rep("key.shadow.mapSize.set(1536, 1536);","key.shadow.mapSize.set(Q.low ? 512 : 1024, Q.low ? 512 : 1024);")
rep("ren.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); ren.setSize(W, H);","ren.setPixelRatio(PR(1.75)); ren.setSize(W, H);")
# podium frame watchdog
rep("""    function frame(now) {
      time = Math.min(duration,(now-start)/1000);""","""    let lastF = 0; const wd = watch(ren, scene);
    function frame(now) {
      if (lastF) wd(Math.min(.2, (now - lastF) / 1000)); lastF = now;
      time = Math.min(duration,(now-start)/1000);""")
# preview frame watchdog
rep("function frame() { const now = performance.now(), t = (now - t0) / 1000, dt = Math.min(.05, (now - last) / 1000); last = now;",
    "const wd = watch(ren, scene); function frame() { const now = performance.now(), t = (now - t0) / 1000, dt = Math.min(.05, (now - last) / 1000); wd(Math.min(.2, (now - last) / 1000)); last = now;")
open(sys.argv[2],'w').write(s)
print('patched')
s=open(sys.argv[2]).read()
rep("cam.position.set(0,1.54,Math.max(5.87,3.05/cam.aspect));\n      cam.lookAt(0,1.26,0);","cam.position.set(0,1.5,Math.max(6.45,3.35/cam.aspect));\n      cam.lookAt(0,1.2,0);")
open(sys.argv[2],'w').write(s)
print('framing patched')
s=open(sys.argv[2]).read()
rep("{ id: 'curls', name: 'Short curls', icon: '↟',","{ id: 'curls', name: 'Short curls', icon: '🧑‍🦱',")
open(sys.argv[2],'w').write(s)
# more free gear (Nov 2026): the rest stays for GP
import re
s=open(sys.argv[2]).read()
FREE=['Short curls','Beanie','Badass bandana','Moustache','Goggles','Tank top','Hoodie','Cargo shorts','Cowboy boots','Scarf']
for nm in FREE:
    pat=re.compile(r"(name: '"+re.escape(nm)+r"', icon: '[^']*', price: )\d+")
    s,n=pat.subn(r"\g<1>0",s); assert n==1,(nm,n)
open(sys.argv[2],'w').write(s)
print('free gear patched')
