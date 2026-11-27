import asyncio, json, sys
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
SPOTS={'garage2':(2597,420,-1.57),'tunnel':(1650,1100,1.57),'parklow':(2900,1250,0),'parktop':(2500,950,0,'u'),'wash':(2675,1780,1.57),'containers':(330,1120,0),'docks_bay':(1775,330,-1.57),'scrapyard':(560,1840,0),'market_alley':(1650,1775,0),'railyard':(475,400,0)}
SIM=int(sys.argv[2]) if len(sys.argv)>2 else 3
async def run(b, spot, nb):
    ctx=await b.new_context(viewport={'width':640,'height':360}, device_scale_factor=1); pg=await ctx.new_page()
    await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa")
    await pg.click('#tHide'); await pg.wait_for_timeout(200); await pg.click(f'#hsBots [data-n="{nb}"]'); await pg.wait_for_timeout(100); await pg.click('#hsGo'); await pg.wait_for_function("__hr.HR.phase==='head'")
    s=SPOTS[spot]; lay=s[3] if len(s)>3 else 'g'
    await pg.evaluate(f"window.__simK={SIM}; window.H=__hr.cars.find(c=>c.hr==='hider'); __hr.setPos(H,{s[0]},{s[1]},{s[2]},'{lay}');")
    # keep the hider parked there for the whole round
    await pg.evaluate("setInterval(()=>{ if(__hr.HR.phase==='head'||__hr.HR.phase==='intro'){} }, 100)")
    await pg.wait_for_function("__hr.HR.phase==='end'||__hr.HR.phase==='final'||__hr.state==='over'", timeout=200000, polling=500)
    r=await pg.evaluate("[__hr.cars.length-1, Object.values(__hr.HR.res).map(x=>[+x.t.toFixed(1),x.caught])]")
    await ctx.close(); return r
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        spots=sys.argv[1].split(',')
        for nb in (1,2):
            res=await asyncio.gather(*[run(b, s, nb) for s in spots])
            for s,r in zip(spots,res): print(nb,'bot(s)', s, r, flush=True)
        await b.close()
asyncio.run(main())
