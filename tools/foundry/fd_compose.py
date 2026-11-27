# Cut Foundry District renders into: ground tiles, overlay sprites (one per structure group), minimap.
import json, math, io, base64
import numpy as np
from PIL import Image, ImageFilter
F = json.load(open('/home/claude/r3d/foundry.json'))
OVC = json.load(open('/home/claude/r3d/fd_ovcol.json'))
full = np.array(Image.open('/home/claude/r3d/fd_full.png').convert('RGB'))
ground = np.array(Image.open('/home/claude/r3d/fd_ground.png').convert('RGB'))
lit = np.array(Image.open('/home/claude/r3d/fd_lit.png').convert('RGB'))
idim = np.array(Image.open('/home/claude/r3d/fd_id.png').convert('RGB')).astype(np.int32)
Hh, Ww = full.shape[:2]
T = math.radians(25); BPU = F['bpu']; TK = math.cos(T)
px = lambda x: (x - F['bx0']) * BPU
py = lambda y: (y - F['by0']) * BPU * TK
# 1) ground: shadowed ground everywhere, lit floor inside every cover
bg = ground.copy()
for cv in F['covers']:
    x0, y0, x1, y1 = cv['r']
    a, b, c, d = int(px(x0)), int(py(y0)), int(math.ceil(px(x1))), int(math.ceil(py(y1)))
    bg[b:d, a:c] = (lit[b:d, a:c].astype(np.float32) * .82 + ground[b:d, a:c].astype(np.float32) * .18).astype(np.uint8)
def webp_url(im, q):
    buf = io.BytesIO(); im.save(buf, 'WEBP', quality=q, method=6); return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode(), len(buf.getvalue())
out = {'bg': [], 'ov': {}, 'mini': None}
tot = 0
NX, NY = 2, 2
for j in range(NY):
    for i in range(NX):
        a, b = i * Ww // NX, j * Hh // NY; c, d = (i + 1) * Ww // NX, (j + 1) * Hh // NY
        url, n = webp_url(Image.fromarray(bg[b:d, a:c]), 80); tot += n
        out['bg'].append([url, a, b, c - a, d - b])
# 2) overlay sprites
base = {}
for it in F['items']:
    if it.get('ov'): base[it['ov']] = max(base.get(it['ov'], -1e9), it['r'][3])
for k, col in OVC.items():
    mask = (np.abs(idim - np.array(col)).sum(axis=2) <= 6)
    if not mask.any(): print('empty', k); continue
    mi = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))
    m2 = np.array(mi) > 0
    ys, xs = np.where(m2)
    a, b, c, d = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    rgba = np.zeros((d - b, c - a, 4), np.uint8)
    rgba[..., :3] = full[b:d, a:c]; rgba[..., 3] = (m2[b:d, a:c] * 255).astype(np.uint8)
    url, n = webp_url(Image.fromarray(rgba, 'RGBA'), 84); tot += n
    out['ov'][k] = [url, int(a), int(b), int(c - a), int(d - b), base.get(k, 0)]
# 3) minimap: the full render, small
mini = Image.fromarray(full).resize((420, int(420 * Hh / Ww)), Image.LANCZOS)
url, n = webp_url(mini, 80); tot += n; out['mini'] = url
out['img'] = [Ww, Hh]
json.dump(out, open('/home/claude/r3d/fd_assets.json', 'w'), separators=(',', ':'))
print('sprites', len(out['ov']), 'total KB', tot // 1024)
Image.fromarray(bg).resize((Ww // 3, Hh // 3)).save('/home/claude/shots/fd_bg_small.png')
