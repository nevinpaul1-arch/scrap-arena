import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
def P(*a): print(*a, flush=True)
async def run(b, nb):
    ctx=await b.new_context(viewport={'width':640,'height':360}, device_scale_factor=1); pg=await ctx.new_page()
    await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa")
    await pg.click('#tHide'); await pg.wait_for_timeout(200); await pg.click(f'#hsBots [data-n="{nb}"]'); await pg.click('#hsGo')
    await pg.wait_for_function("__hr.HR.phase==='head'")
    await pg.evaluate("""window.__simK=4; window.H=__hr.cars.find(c=>c.hr==='hider'); for (const s of __hr.cars) if (s.hr==='seeker') s.testGoal=-1;
      window.__cl=[]; window.__last=0; setInterval(()=>{ const c=__hr.HR.clue; if(c && c.n!==__last){ __last=c.n; __cl.push([+__hr.HR.clock.toFixed(2), c.k, c.name]); } }, 20);
      // the hider wanders between districts so the clue district changes
      const pts=[[450,300],[2600,1800],[2597,420],[450,1700],[1650,1775]]; let i=0; setInterval(()=>{ if(__hr.HR.phase==='hunt'){ const p=pts[i++%pts.length]; __hr.setPos(H,p[0],p[1],0); } }, 2500);""")
    await pg.wait_for_function("__hr.HR.phase==='end'||__hr.state==='over'", timeout=120000, polling=300)
    r=await pg.evaluate("[__cl, JSON.stringify(__hr.HR.res)]"); await ctx.close(); return r
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        r1, r3 = await asyncio.gather(run(b,1), run(b,3))
        P('1 seeker clues', r1[0]); P('1 seeker result', r1[1])
        P('3 seekers clues', r3[0]); P('3 seekers result', r3[1])
        # standings: ties share a rank, tags don't break ties
        ctx=await b.new_context(); pg=await ctx.new_page(); await pg.goto(URL); await pg.wait_for_function("window.__hr")
        P('standings', await pg.evaluate("""(()=>{ const H=__hr.HR; H.order=['a','b','c','d']; H.res={a:{t:90,caught:false},b:{t:90,caught:false},c:{t:51.8,caught:true,by:'a'},d:{t:74.2,caught:true,by:'b'}}; H.tags={a:1,b:3}; return __hr.hrStandings().map(x=>[x.pid,x.rank,x.t,x.tags]); })()"""))
        await b.close()
asyncio.run(main())
