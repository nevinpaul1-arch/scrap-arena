import asyncio, json, random, sys
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
VPS={'phoneL':dict(viewport={'width':852,'height':393},is_mobile=True,has_touch=True),'desk':dict(viewport={'width':1280,'height':720}),'phoneP':dict(viewport={'width':393,'height':852},is_mobile=True,has_touch=True)}
PICK=r"""() => {
  const vis = el => { const r = el.getBoundingClientRect(); if (r.width < 3 || r.height < 3 || r.bottom < 0 || r.right < 0 || r.left > innerWidth || r.top > innerHeight) return false; for (let p = el; p && p !== document; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < .05) return false; } const cx = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), cy = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1); const t = document.elementFromPoint(cx, cy); return t && (el.contains(t) || t.contains(el)); };
  document.querySelectorAll('[data-mk]').forEach(e => e.removeAttribute('data-mk'));
  const skip = new Set(['hubFs', 'fsMenu', 'fsGame', 'hubInstall', 'installBtn', 'mpShare', 'devBtn']);
  const els = [...document.querySelectorAll('button, .tile, [data-gt], [data-gcar], [data-buy], [data-equip], [data-join-peek], .clubAward.none')].filter(e => !skip.has(e.id) && !e.disabled && vis(e));
  return els.map((e, i) => { e.dataset.mk = i; return (e.id ? '#' + e.id : e.tagName + '.' + (e.className || '')) + ' ' + (e.innerText || '').replace(/\s+/g, ' ').slice(0, 18); });
}"""
async def run(b, vn, seed, steps):
    random.seed(seed)
    ctx=await b.new_context(**VPS[vn]); await ctx.add_init_script("localStorage.setItem('scrapArenaMaxWave','12');localStorage.setItem('scrapArenaGarage',JSON.stringify({gp:3000,owned:['spikes'],equip:'spikes'}))")
    pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)[:200])); pg.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))
    await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa"); await pg.wait_for_timeout(600)
    log=[]; stuck=0
    for i in range(steps):
        st=await pg.evaluate("__sa.state")
        if st=='play' and random.random()<.5:
            act=random.choice(['wait','die','esc','mod'])
            if act=='wait': await pg.wait_for_timeout(1200)
            elif act=='die': await pg.evaluate("(()=>{const p=__sa.player;if(!p)return;const e=__sa.cars.find(c=>!c.isPlayer)||p;p.inv=0;for(let i=0;i<14&&!p.dead;i++){p.inv=0;p.armor=0;__sa.perkHit(p,['left','right','front','rear'][i%4],e)}})()"); await pg.wait_for_timeout(4500)
            elif act=='esc': await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
            else: await pg.keyboard.press('KeyC'); await pg.wait_for_timeout(300)
            log.append((st,act)); continue
        opts=await pg.evaluate(PICK)
        if not opts:
            stuck+=1; log.append((st,'NO-BUTTONS')); await pg.wait_for_timeout(800)
            if stuck>4: log.append(('STUCK',st)); break
            continue
        stuck=0
        k=random.randrange(len(opts)); log.append((st,opts[k]))
        try: await pg.locator(f'[data-mk="{k}"]').first.click(timeout=3000)
        except Exception as e: log.append(('CLICKFAIL',opts[k],str(e).split('\n')[0][:90]))
        await pg.wait_for_timeout(random.choice([150,300,700]))
        if random.random()<.06: await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
    fin=await pg.evaluate("[__sa.state, document.body.className]")
    await pg.screenshot(path=f'/home/claude/audit/monkey_{vn}_{seed}.png')
    await ctx.close()
    return {'vp':vn,'seed':seed,'errs':errs[:5],'final':fin,'fails':[l for l in log if l[0] in ('CLICKFAIL','STUCK')][:6],'tail':log[-6:]}
async def main():
    vn=sys.argv[1]; seeds=[int(x) for x in sys.argv[2].split(',')]; steps=int(sys.argv[3])
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for sd in seeds: print(json.dumps(await run(b,vn,sd,steps),ensure_ascii=False)[:1500], flush=True)
        await b.close()
asyncio.run(main())
