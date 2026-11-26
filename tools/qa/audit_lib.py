CHECK = r"""(root) => {
  const R = document.querySelector(root) || document.body;
  const vis = el => { const r = el.getBoundingClientRect(); if (r.width < 3 || r.height < 3) return false; for (let p = el; p && p !== document; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < .05) return false; } return true; };
  const scroller = el => { for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 2) return p; if (/(auto|scroll)/.test(s.overflowX) && p.scrollWidth > p.clientWidth + 2) return p; } return null; };
  const clipper = el => { for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) { const s = getComputedStyle(p); if (s.overflow === 'hidden' || s.overflowY === 'hidden' || s.overflowX === 'hidden') return p; } return null; };
  const nm = b => (b.id ? '#' + b.id : b.tagName.toLowerCase() + (b.classList[0] ? '.' + b.classList[0] : '')) + ' "' + (b.innerText || b.value || b.placeholder || '').replace(/\s+/g, ' ').trim().slice(0, 22) + '"';
  const out = [];
  const els = [...R.querySelectorAll('button, input, select, a[href], [data-gt], [data-gcar], [data-buy], [data-equip]')].filter(vis);
  const seen = new Set();
  for (const b of els) {
    if (seen.has(b)) continue; seen.add(b);
    const r = b.getBoundingClientRect(), sc = scroller(b);
    if (!sc) {
      if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) out.push(['OFFSCREEN', nm(b), [r.left, r.top, r.right, r.bottom].map(Math.round)]);
      const cl = clipper(b); if (cl) { const c = cl.getBoundingClientRect(); if (r.bottom > c.bottom + 2 || r.right > c.right + 2 || r.top < c.top - 2 || r.left < c.left - 2) out.push(['CLIPPED', nm(b), 'by', nm(cl)]); }
    }
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (cx > 0 && cy > 0 && cx < innerWidth && cy < innerHeight) {
      const t = document.elementFromPoint(cx, cy);
      if (t && !b.contains(t) && !t.contains(b) && !(sc && !sc.contains(t) && false)) out.push(['COVERED', nm(b), 'by', nm(t)]);
    }
    if (b.tagName === 'BUTTON' && b.scrollWidth > b.clientWidth + 3) out.push(['TEXT-OVERFLOW-X', nm(b), b.scrollWidth, b.clientWidth]);
    if (b.tagName === 'BUTTON' && r.height < 26 && matchMedia('(pointer:coarse)').matches) out.push(['SMALL-TAP', nm(b), Math.round(r.width) + 'x' + Math.round(r.height)]);
  }
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
    const a = els[i], c = els[j]; if (a.contains(c) || c.contains(a)) continue;
    const r1 = a.getBoundingClientRect(), r2 = c.getBoundingClientRect();
    const ox = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left), oy = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
    if (ox > 3 && oy > 3) out.push(['OVERLAP', nm(a), nm(c), Math.round(ox) + 'x' + Math.round(oy)]);
  }
  // text that overflows its own box (non-button text blocks with clipping)
  for (const el of R.querySelectorAll('h1,h2,h3,h4,b,small,span,p,div,em')) {
    if (!vis(el) || el.children.length > 3) continue; const s = getComputedStyle(el);
    if ((s.overflow === 'hidden' || s.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 4 && el.innerText.trim().length > 2 && s.webkitLineClamp === 'none') out.push(['TEXT-CLIP', nm(el), el.scrollWidth, el.clientWidth]);
  }
  if (document.documentElement.scrollWidth > innerWidth + 1) out.push(['PAGE-HSCROLL', document.documentElement.scrollWidth]);
  return out;
}"""
VIEWPORTS = {
  'phoneL': dict(viewport={'width':852,'height':393}, is_mobile=True, has_touch=True),
  'phoneS': dict(viewport={'width':667,'height':375}, is_mobile=True, has_touch=True),
  'phoneP': dict(viewport={'width':393,'height':852}, is_mobile=True, has_touch=True),
  'tabL':   dict(viewport={'width':1180,'height':820}, is_mobile=True, has_touch=True),
  'tabP':   dict(viewport={'width':820,'height':1180}, is_mobile=True, has_touch=True),
  'desk':   dict(viewport={'width':1280,'height':720}),
  'deskXL': dict(viewport={'width':1920,'height':1080}),
}
