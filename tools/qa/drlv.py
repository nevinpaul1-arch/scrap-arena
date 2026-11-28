import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
S='/home/claude/shots/'
def P(*a): print(*a, flush=True)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        ctx=await b.new_context(viewport={'width':844,'height':390}, is_mobile=True, has_touch=True, device_scale_factor=2)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)+' | '+(e.stack or '')[:240]))
        await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa")
        ev=pg.evaluate
        P('level table', await ev("JSON.stringify([1,2,3,4,5,6,8,10,12,15,18,22].map(L=>{const l=__dr.drLevel(L);return [L,l.n,l.preview,+l.slack.toFixed(2),l.traffic,Math.round(l.traffic*l.retal)]}))"))
        # sample batches per level: distinct, within reach, timer
        P('batches', await ev("""JSON.stringify([1,2,3,5,8,12].map(L=>{let r=[];for(let i=0;i<3;i++){const b=__dr.drBatch(L);r.push([b.pick.length,new Set(b.pick.map(a=>a.id)).size,Math.round(b.rt),Math.round(b.rt*__dr.drLevel(L).slack+3)])}return [L,r]}))"""))
        await ev("document.getElementById('tDeliver').click()"); await pg.wait_for_timeout(500); await pg.screenshot(path=S+'dl_sheet1.png')
        P('fresh sheet', await ev("[document.getElementById('dsLv').children.length, document.getElementById('dsGo').textContent, document.getElementById('dsLvInfo').textContent]"))
        await pg.click('#dsGo'); await pg.wait_for_function("__dr.DR.phase==='preview'", timeout=8000)
        P('L1 preview', await ev("[__dr.DR.wave, __dr.DR.pk.length, __dr.DR.prevT, __dr.DR.limit, __dr.cars.filter(c=>c.traffic).length]"))
        async def drop(i):
            z=await ev(f"__dr.DR.pk[{i}].a.zone"); lay=await ev(f"__dr.DR.pk[{i}].a.lay||'g'")
            await ev(f"Object.assign(__dr.player,{{x:{(z[0]+z[2])/2},y:{(z[1]+z[3])/2},vx:0,vy:0,lay:'{lay}'}})"); await pg.wait_for_timeout(1300)
        async def clear():
            await pg.wait_for_function("__dr.DR.phase==='drive'", timeout=20000)
            n=await ev("__dr.DR.pk.length")
            for i in range(n): await drop(i)
            for k in range(3):
                await ev("Object.assign(__dr.player,{x:1375,y:1290,vx:0,vy:0,lay:'g'})")
                try: await pg.wait_for_function("__dr.DR.phase==='preview'", timeout=4000); break
                except Exception: P('retry depot', await ev("[__dr.DR.phase,__dr.DR.done,__dr.DR.pk.map(p=>p.done),Math.round(__dr.player.x),Math.round(__dr.player.y),__dr.player.dead]"))
        await clear(); P('L2', await ev("[__dr.DR.wave, __dr.DR.pk.length, __dr.DR.prevT, __dr.DR.limit, __dr.cars.filter(c=>c.traffic).length, __dr.DR.top]"))
        await clear(); P('L3', await ev("[__dr.DR.wave, __dr.DR.pk.length, __dr.DR.prevT, __dr.DR.limit, __dr.cars.filter(c=>c.traffic).length, __dr.DR.top]"))
        await pg.screenshot(path=S+'dl_prev3.png')
        # lose on level 3
        await pg.wait_for_function("__dr.DR.phase==='drive'", timeout=20000); await ev("__dr.DR.timeLeft=0.1")
        await pg.wait_for_function("__dr.state==='over'", timeout=8000); await pg.wait_for_timeout(400)
        P('settle', await ev("JSON.stringify(__dr.DR.res)"), 'sel', await ev("__dr.DR.sel"), 'ls', await ev("[localStorage.scrapArenaDeliveryRetry, localStorage.scrapArenaDeliveryTop, localStorage.scrapArenaDeliveryBest]"))
        P('restart btn', await ev("document.getElementById('goAgain').textContent"), '|', await ev("document.getElementById('final').innerText.replace(/\\n/g,' / ')"))
        await pg.screenshot(path=S+'dl_res.png')
        await pg.click('#goAgain'); await pg.wait_for_function("__dr.DR.phase==='preview'", timeout=8000)
        P('retry starts at', await ev("[__dr.DR.wave, __dr.DR.pk.length, __dr.player.lost]"))
        # sheet after: chips 1-3, level 3 selected; pick level 1
        await ev("__sa.player && 0"); await pg.keyboard.press('Escape')
        await ev("document.getElementById('pmMenu').click()"); await pg.wait_for_timeout(600)
        await ev("document.getElementById('tDeliver').click()"); await pg.wait_for_timeout(500)
        P('sheet after', await ev("[document.getElementById('dsLv').children.length, document.querySelector('#dsLv .on').textContent, document.getElementById('dsGo').textContent]"))
        await pg.screenshot(path=S+'dl_sheet2.png')
        await ev("document.querySelector('[data-dlv=\"1\"]').click()"); P('picked', await ev("document.getElementById('dsGo').textContent"))
        P('errs', errs[:4]); await b.close()
asyncio.run(main())
