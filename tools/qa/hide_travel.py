import asyncio, json, time, sys
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
def P(*a): print(*a, flush=True)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        ctx=await b.new_context(viewport={'width':844,'height':390}, is_mobile=True, has_touch=True, device_scale_factor=1)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa")
        await pg.evaluate("localStorage.setItem('scrapArenaHideBots','2')")
        await pg.click('#tHide'); await pg.wait_for_timeout(300); await pg.click('#hsGo'); await pg.wait_for_function("__hr.HR.phase==='head'")
        ev=pg.evaluate
        await ev("__hr.HRC.cap=1e9; __hr.HR.phase='hunt'; __hr.HR.clock=0; __hr.HR.sched=[]; window.H=__hr.cars.find(c=>c.hr==='hider'); window.S1=__hr.cars.filter(c=>c.hr==='seeker')[0]; window.S2=__hr.cars.filter(c=>c.hr==='seeker')[1]; S2.testGoal=-1; __hr.setPos(H, 1650, 1100, 1.57); __hr.setPos(S2, 3200, 2150, 0);")
        async def travel(x0, y0, a0, x1, y1, lim=70):
            await ev(f"__hr.setPos(S1, {x0}, {y0}, {a0}); S1.hb=null; S1.testDone=false; S1.testGoal=__hr.near({x1},{y1});")
            t0=await ev("performance.now()"); trace=[]
            for i in range(lim*2):
                await pg.wait_for_timeout(500)
                st=await ev("[S1.testDone, Math.round(S1.x), Math.round(S1.y), S1.lay, Math.round(Math.hypot(S1.vx,S1.vy))]")
                if st[0]: return round((await ev("performance.now()")-t0)/1000,1)
                trace.append(st[1:])
            return ['STUCK', trace[-6:]]
        legs=[('corner NW->SE', (85,85,0), (3215,2115)), ('W->E middle', (85,1100,0), (3215,1100)),
              ('loop N', (85,85,0),(3215,85)), ('loop E',(3215,85,1.57),(3215,2115)), ('loop S',(3215,2115,3.14),(85,2115)), ('loop W',(85,2115,-1.57),(85,85)),
              ('stage->repair row', (1652,1300,1.57),(2597,420)), ('stage->scrap', (1652,1300,1.57),(450,1700))]
        for name,(x0,y0,a0),(x1,y1) in legs:
            P(name, await travel(x0,y0,a0,x1,y1))
        P('errs', errs[:3])
        await b.close()
asyncio.run(main())
