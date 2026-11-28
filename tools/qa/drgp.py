import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
S='/home/claude/shots/'
def P(*a): print(*a, flush=True)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        ctx=await b.new_context(viewport={'width':858,'height':395}, is_mobile=True, has_touch=True, device_scale_factor=2)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_function("window.__sa"); ev=pg.evaluate
        gp0=await ev("__sa.UP && 0 || JSON.parse(localStorage.scrapArenaGarage||'{}').gp||0")
        async def drop(i):
            z=await ev(f"__dr.DR.pk[{i}].a.zone"); lay=await ev(f"__dr.DR.pk[{i}].a.lay||'g'")
            await ev(f"Object.assign(__dr.player,{{x:{(z[0]+z[2])/2},y:{(z[1]+z[3])/2},vx:0,vy:0,lay:'{lay}'}})"); await pg.wait_for_timeout(1300)
        async def depot():
            for k in range(3):
                await ev("Object.assign(__dr.player,{x:1375,y:1290,vx:0,vy:0,lay:'g'})")
                try: await pg.wait_for_function("__dr.DR.phase==='preview'", timeout=4000); return
                except Exception: pass
        async def gp(): return await ev("(()=>{try{return JSON.parse(localStorage.getItem('scrapArenaGarage')).gp}catch(e){return null}})()")
        # run 1: clear level 1 (2 drops), drop 1 of level 2, then wreck with 2 parts missing
        await ev("__dr.startDelivery(1)"); await pg.wait_for_function("__dr.DR.phase==='drive'", timeout=20000)
        g0=await gp()
        await drop(0); await drop(1); P('L1 earn', await ev("__dr.DR.earn"))
        await depot(); await pg.wait_for_function("__dr.DR.phase==='drive'", timeout=20000)
        await drop(0); P('L2 1 drop earn', await ev("__dr.DR.earn"))
        await ev("(()=>{const pl=__dr.player; pl.parts.hood=false; pl.parts.trunk=false; pl.lost=2; pl._key=''; __dr.DR.timeLeft=0.1;})()")
        await pg.wait_for_function("__dr.state==='over'", timeout=8000); await pg.wait_for_timeout(300)
        r=json.loads(await ev("JSON.stringify(__dr.DR.res)")); P('run1 res earn',r['earn'],'charge',r['charge'],'gp',r['old'],'->',r['bank'],' paid', await ev("localStorage.scrapArenaDeliveryPaid"))
        P('final', await ev("document.getElementById('final').innerText.replace(/\\n/g,' / ')"))
        await pg.screenshot(path=S+'gp_res.png')
        # run 2: replay level 1 -> 1 GP each; level 2 -> one more full (5), then replay rate
        await ev("__dr.startDelivery(1)"); await pg.wait_for_function("__dr.DR.phase==='drive'", timeout=20000)
        await drop(0); await drop(1); P('replay L1 earn (expect 2)', await ev("__dr.DR.earn"))
        await depot(); await pg.wait_for_function("__dr.DR.phase==='drive'", timeout=20000)
        await drop(0); await drop(1); P('L2 second run earn (expect 2+5+1=8)', await ev("__dr.DR.earn"))
        await ev("__dr.DR.timeLeft=0.1"); 
        await depot()
        await pg.wait_for_function("__dr.DR.phase==='drive'", timeout=20000); await ev("__dr.DR.timeLeft=0.1"); await pg.wait_for_function("__dr.state==='over'", timeout=8000)
        P('run2 res', await ev("JSON.stringify(__dr.DR.res)"), await ev("localStorage.scrapArenaDeliveryPaid"))
        # sheet
        await ev("document.getElementById('goHome').click()"); await pg.wait_for_timeout(500)
        await ev("document.getElementById('tDeliver').click()"); await pg.wait_for_timeout(500); await pg.screenshot(path=S+'gp_sheet.png')
        P('chips', await ev("[...document.querySelectorAll('#dsLv button')].map(b=>b.textContent+(b.disabled?'x':'')+(b.classList.contains('on')?'*':'')).join(' ')"), '|', await ev("document.getElementById('dsStats').textContent"))
        await ev("document.getElementById('hubGarage').click()"); await pg.wait_for_timeout(400)
        for t in ['mods','ach']:
            await ev(f"document.querySelector('#garTabs [data-gt={t}]').click()"); await pg.wait_for_timeout(300)
            P(t, await ev("(()=>{const n=document.querySelector('#garageSheet .gNote.foot');const c=document.getElementById('garBody')||n.parentElement;return [getComputedStyle(n).fontSize, n===n.parentElement.lastElementChild]})()"))
            await ev("document.querySelector('#garageSheet .gNote.foot').scrollIntoView()"); await pg.wait_for_timeout(200); await pg.screenshot(path=S+f'gp_gar_{t}.png')
        P('errs', errs[:4]); await b.close()
asyncio.run(main())
