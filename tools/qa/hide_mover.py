# a scripted hider: drives to a cover in another district at the start and after every clue
import asyncio, sys
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
JS="""
window.H=__hr.cars.find(c=>c.hr==='hider'); H.bot=true; window.__mv={n:-1};
window.__pick=()=>{ const N=__hr.FDM.nodes, cl=__hr.HR.clue, far=N.map((n,i)=>[i,n]).filter(([i,n])=>n[3]&&n[2]==='g'&&(!cl||(cl.k==='d'?!(n[0]>=cl.r[0]&&n[0]<=cl.r[2]&&n[1]>=cl.r[1]&&n[1]<=cl.r[3]):Math.hypot(n[0]-cl.x,n[1]-cl.y)>cl.r+200)));
  const s=__hr.cars.filter(c=>c.hr==='seeker'); far.sort((a,b)=>Math.min(...s.map(q=>Math.hypot(q.x-b[1][0],q.y-b[1][1])))-Math.min(...s.map(q=>Math.hypot(q.x-a[1][0],q.y-a[1][1]))));
  const k=far[(Math.random()*Math.min(3,far.length))|0]; H.hb=null; H.testDone=false; H.testGoal=k?k[0]:null; };
setInterval(()=>{ const n=__hr.HR.clue?__hr.HR.clue.n:0; if(n!==__mv.n){ __mv.n=n; __pick(); } },200);
"""
async def run(b, nb, seed):
    ctx=await b.new_context(viewport={'width':640,'height':360}, device_scale_factor=1); pg=await ctx.new_page()
    await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa")
    await pg.click('#tHide'); await pg.wait_for_timeout(200); await pg.click(f'#hsBots [data-n="{nb}"]'); await pg.wait_for_timeout(100); await pg.click('#hsGo')
    await pg.wait_for_function("__hr.HR.phase==='head'"); await pg.evaluate("window.__simK=3;"+JS)
    await pg.wait_for_function("__hr.HR.phase==='end'||__hr.HR.phase==='final'||__hr.state==='over'", timeout=240000, polling=500)
    r=await pg.evaluate("Object.values(__hr.HR.res).map(x=>[+x.t.toFixed(1),x.caught])[0]"); await ctx.close(); return r
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for nb in (1,2,3):
            res=await asyncio.gather(*[run(b,nb,i) for i in range(4)])
            print(nb,'seeker(s): moving hider', res, flush=True)
        await b.close()
asyncio.run(main())
