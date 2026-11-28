import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
S='/home/claude/shots/'
def P(*a): print(*a, flush=True)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        ctx=await b.new_context(viewport={'width':844,'height':390}, is_mobile=True, has_touch=True, device_scale_factor=2)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)+' | '+(e.stack or '')[:200]))
        await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa")
        await pg.evaluate("document.getElementById('tDeliver').click()"); await pg.wait_for_timeout(300); await pg.click('#dsGo')
        await pg.wait_for_function("__dr.DR.phase==='drive'", timeout=10000)
        ev=pg.evaluate
        await ev("__dr.DR.timeLeft=1e9")
        t0=await ev("__dr.cars.filter(c=>c.traffic).map(c=>[Math.round(c.x),Math.round(c.y)])")
        await pg.wait_for_timeout(8000)
        t1=await ev("__dr.cars.filter(c=>c.traffic).map(c=>[Math.round(c.x),Math.round(c.y),Math.round(Math.hypot(c.vx,c.vy))])")
        moved=[round(((a[0]-b2[0])**2+(a[1]-b2[1])**2)**.5) for a,b2 in zip(t0,t1)]
        P('traffic moved in 8s', moved); P('speeds', [x[2] for x in t1])
        # are they on roads?
        P('on roads', await ev("__dr.cars.filter(c=>c.traffic).map(c=>__hr.FDM.roads.some(r=>c.x>=r[0]-20&&c.x<=r[2]+20&&c.y>=r[1]-20&&c.y<=r[3]+20))"))
        await pg.screenshot(path=S+'dr_traffic.png')
        # light tap an ordinary car: honk, no part lost
        await ev("window.T=__dr.cars.find(c=>c.traffic&&!c.retal); T.tb.path=null; Object.assign(T,{x:600,y:1485,a:0,vx:0,vy:0}); Object.assign(__dr.player,{x:540,y:1485,a:0,vx:70,vy:0,lay:'g'});")
        await pg.wait_for_timeout(500)
        P('bumps0', await ev("JSON.stringify(window.__bumps||[])"))
        P('light tap', await ev("[__dr.player.lost, T.mad, T.honkT>0]"))
        # ram a retaliating car hard: it turns on you
        await ev("window.R=__dr.cars.find(c=>c.retal); Object.assign(R,{x:900,y:715,a:0,vx:0,vy:0}); Object.assign(__dr.player,{x:780,y:715,a:0,vx:420,vy:0,lay:'g'});")
        await pg.wait_for_timeout(500)
        P('bumps', await ev("JSON.stringify(window.__bumps||[])"))
        P('rammed retaliator', await ev("[R.mad>0, R.police, __dr.player.lost]"))
        await pg.wait_for_timeout(2500)
        P('retaliator chasing (distance to player)', await ev("Math.round(Math.hypot(R.x-__dr.player.x,R.y-__dr.player.y))"))
        # repair kit restores a part
        await ev("__dr.player.parts.hood=false; __dr.player.lost=Object.values(__dr.player.parts).filter(v=>!v).length; __dr.DR.kitsOn.push({x:2200,y:1485,t:0}); Object.assign(__dr.player,{x:2150,y:1485,a:0,vx:120,vy:0,lay:'g'}); for (const c of __dr.cars) if (c.traffic) c.mad=0;")
        l0=await ev("__dr.player.lost"); await pg.wait_for_timeout(700)
        P('kit', l0, '->', await ev("[__dr.player.lost, __dr.DR.kits, __dr.DR.kitsOn.length]"))
        # wreck: lose every part -> settles once
        await ev("(()=>{const p=__dr.player; for (const q in p.parts) p.parts[q]=false; p.lost=5; p.dead=true; p.deadT=0;})()")
        await pg.wait_for_function("__dr.state==='over'", timeout=8000); await pg.wait_for_timeout(1500)
        P('wreck settle', await ev("[document.querySelector('#card h1').innerText, JSON.stringify(__dr.DR.res)]"))
        await pg.screenshot(path=S+'dr_wreck.png')
        P('errs', errs[:3]); await b.close()
asyncio.run(main())
