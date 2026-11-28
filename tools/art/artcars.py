"""Turn a chat-made layer set (9 PNGs, 1024x1536, nose up, magenta background) into a game car atlas.

usage: python3 artcars.py <car_id> <layer_dir> [length_px] [width_px]
  - writes sprites_art/<car_id>.png (4x4 atlas of 512x256 frames) and updates sprites_art/meta.json
  - frames 0..13: (fixed, paint) pairs for lower, hood, trunk, bumper, doorL, doorR, upper; 14 wreck; 15 shadow
  - paint pass is a grey shading layer; the game multiplies it by the car colour, so the stock colour reproduces the art
"""
import sys, json, os, shutil
import numpy as np
from PIL import Image, ImageFilter

FW, FH, PIV = 512, 256, (256, 128)
SRC = 'sprites_k'; DST = 'sprites_art'
LAYER_FILES = {'lower': '01_chassis', 'hood': '02_hood', 'trunk': '04_rear', 'bumper': '03_bumper', 'doorL': '05_doorL', 'doorR': '06_doorR'}
ORDER = ['lower', 'hood', 'trunk', 'bumper', 'doorL', 'doorR', 'upper']
MAG = np.array([255, 0, 255], float); GRN = np.array([0, 255, 0], float)

def load(d, car, k):
    return np.array(Image.open(os.path.join(d, f'{car}_{k}.png')).convert('RGB')).astype(float)

def key(rgb):
    """alpha from distance to magenta, colour un-mixed from the magenta at soft edges"""
    dist = np.sqrt(((rgb - MAG) ** 2).sum(-1))
    a = np.clip((dist - 40) / 110, 0, 1)
    safe = np.maximum(a, 1e-3)[..., None]
    col = np.clip((rgb - (1 - a)[..., None] * MAG) / safe, 0, 255)
    col[a == 0] = 0
    return col, a

def rot(x):  # nose up -> nose right (clockwise); the car's left side ends up at the top (negative y)
    return np.rot90(x, -1).copy()

def main():
    car, d = sys.argv[1], sys.argv[2]
    meta = json.load(open(os.path.join(SRC, 'meta.json')))
    old = meta['cars'][car]['boxes']['lower']
    tgtL = float(sys.argv[3]) if len(sys.argv) > 3 else old[2] - old[0]
    tgtW = float(sys.argv[4]) if len(sys.argv) > 4 else old[3] - old[1]
    colhex = sys.argv[5] if len(sys.argv) > 5 else None
    stock = np.array([int(colhex[i:i + 2], 16) for i in (1, 3, 5)], float) / 255 if colhex else None

    master_c, master_a = key(load(d, car, '00_master'))
    paint_rgb = load(d, car, '07_paint')
    pm = np.clip((170 - np.sqrt(((paint_rgb - GRN) ** 2).sum(-1))) / 90, 0, 1) * (master_a > 0)

    layers = {}
    for ly, f in LAYER_FILES.items():
        layers[ly] = key(load(d, car, f))
    wreck_c, wreck_a = key(load(d, car, '08_wreck'))

    # paint on the chassis where it shows new surfaces (under removed parts): pixels that look like the body paint
    pc = master_c[pm > .9]; ref = np.median(pc, 0); refn = ref / (np.linalg.norm(ref) + 1e-6)
    ch_c, ch_a = layers['lower']
    changed = np.abs(ch_c - master_c).max(-1) > 24
    n = ch_c / (np.linalg.norm(ch_c, axis=-1, keepdims=True) + 1e-6)
    mx, mn = ch_c.max(-1), ch_c.min(-1); sat = (mx - mn) / np.maximum(mx, 1)
    like = ((n * refn).sum(-1) > .975) & (sat > .3) & (mx > 60)
    pm_ch = np.where(changed, like.astype(float), pm)

    # placement: fit the master into the old footprint, centred on the pivot
    A = rot(master_a); ys, xs = np.where(A > .05)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    L, Wd = x1 - x0, y1 - y0
    s = min(tgtL / L, tgtW / Wd)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    big = Image.new('RGBA', (1, 1))

    def place(col, a, paintmask=None):
        """rotate, scale (premultiplied) and drop into a 512x256 frame; returns fixed RGBA and paint RGBA"""
        col, a = rot(col), rot(a)
        H, W = a.shape
        nw, nh = max(1, round(W * s)), max(1, round(H * s))
        def rs(ch): return np.array(Image.fromarray(ch.astype(np.float32), 'F').resize((nw, nh), Image.LANCZOS))
        aa = np.clip(rs(a), 0, 1)
        prem = [rs(col[..., i] * a) for i in range(3)]
        ox, oy = round(PIV[0] - cx * s), round(PIV[1] - cy * s)
        def frame(ch, fill=0.):
            out = np.full((FH, FW), fill, np.float32)
            sx0, sy0 = max(0, -ox), max(0, -oy); dx0, dy0 = max(0, ox), max(0, oy)
            w = min(nw - sx0, FW - dx0); h = min(nh - sy0, FH - dy0)
            out[dy0:dy0 + h, dx0:dx0 + w] = ch[sy0:sy0 + h, sx0:sx0 + w]; return out
        Af = frame(aa); P = [frame(c) for c in prem]
        rgb = np.stack([p / np.maximum(Af, 1e-4) for p in P], -1); rgb = np.clip(rgb, 0, 255); rgb[Af < 1e-3] = 0
        fixed = np.dstack([rgb, Af * 255])
        if paintmask is None: return fixed, None
        pmf = frame(np.clip(rs(rot(paintmask) * a) / np.maximum(aa, 1e-4), 0, 1))
        # shading relative to the art's own body paint: 1.0 = plain paint, R = shade up to 1, G = highlight above it
        refc = ref / 255; g = (rgb / 255 * refc).sum(-1) / (refc * refc).sum()
        R = np.clip(g, 0, 1) * 255; G = np.clip(g - 1, 0, 1) * 255
        paint = np.dstack([R, G, R, Af * pmf * 255])
        return fixed, paint

    frames, boxes, clipped = [], {}, []
    for ly in ORDER:
        if ly == 'upper':
            z = np.zeros((FH, FW, 4)); frames += [z, z]; continue
        c, a = layers[ly]
        mask = pm_ch if ly == 'lower' else pm
        fx, pt = place(c, a, mask)
        frames += [fx, pt]
        al = np.maximum(fx[..., 3], pt[..., 3]); ys, xs = np.where(al > 10)
        boxes[ly] = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
        m = pt[..., 3] > 128
        if m.any(): clipped.append(float((pt[..., 1][m] > 250).mean()))
    boxes['upper'] = boxes['lower']
    wf, _ = place(wreck_c, wreck_a)
    ma = place(master_c, master_a)[0][..., 3]
    sh = Image.fromarray(ma.astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(7))
    sa = np.array(sh).astype(float) * .6
    shadow = np.dstack([np.zeros((FH, FW, 3)), sa])
    frames += [wf, shadow]

    atlas = np.zeros((FH * 4, FW * 4, 4), np.uint8)
    for i, fr in enumerate(frames):
        x, y = (i % 4) * FW, (i // 4) * FH
        atlas[y:y + FH, x:x + FW] = np.clip(fr, 0, 255).astype(np.uint8)
    os.makedirs(DST, exist_ok=True)
    if not os.path.exists(os.path.join(DST, 'meta.json')):
        for f in os.listdir(SRC):
            shutil.copy(os.path.join(SRC, f), DST)
    Image.fromarray(atlas, 'RGBA').save(os.path.join(DST, f'{car}.png'), optimize=True)
    Image.fromarray(atlas, 'RGBA').save(os.path.join(DST, f'{car}.webp'), 'WEBP', quality=95, alpha_quality=100, method=6)
    m2 = json.load(open(os.path.join(DST, 'meta.json')))
    m2['cars'][car] = {'boxes': boxes, 'fw': FW, 'fh': FH, 'mw': meta['mw'], 'mh': meta['mh'], 'art': 1}
    json.dump(m2, open(os.path.join(DST, 'meta.json'), 'w'))
    print(json.dumps({'car': car, 'scale': round(s, 4), 'assembled_px': [round(L * s), round(Wd * s)], 'boxes': boxes,
                      'highlight_saturated': [round(float(c), 3) for c in clipped], 'kb_webp': os.path.getsize(os.path.join(DST, f'{car}.webp')) // 1024}))

main()
