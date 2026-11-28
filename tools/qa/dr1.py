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
        await pg.screenshot(path=S+'dr_hub.png')
        await pg.evaluate("document.getElementById('tDeliver').click()"); await pg.wait_for_timeout(500); await pg.screenshot(path=S+'dr_sheet.png')
        await pg.click('#dsGo'); await pg.wait_for_function("window.__dr && __dr.DR.phase==='preview'", timeout=8000)
        ev=pg.evaluate
        P('wave1', await ev("[__dr.DR.wave, __dr.DR.pk.map(p=>p.a.name), __dr.DR.limit, +__dr.DR.route.toFixed(1), __dr.cars.length]"))
        x0=await ev("[Math.round(__dr.player.x),Math.round(__dr.player.y)]")
        await pg.keyboard.down('ArrowUp'); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=S+'dr_preview.png')
        P('held during preview', x0, await ev("[Math.round(__dr.player.x),Math.round(__dr.player.y)]"), 'timer', await ev("__dr.DR.timeLeft"))
        await pg.keyboard.up('ArrowUp')
        await pg.wait_for_function("__dr.DR.phase==='drive'", timeout=6000); await pg.wait_for_timeout(300)
        await pg.keyboard.down('ArrowUp'); await pg.wait_for_timeout(1200); await pg.keyboard.up('ArrowUp'); await pg.wait_for_timeout(600)
        await pg.screenshot(path=S+'dr_drive.png')
        P('driving', await ev("[__dr.DR.phase, +__dr.DR.timeLeft.toFixed(1), Math.round(__dr.player.x), Math.round(__dr.player.y)]"))
        # teleport into the first address zone and stop
        async def drop(i):
            z=await ev(f"__dr.DR.pk[{i}].a.zone"); lay=await ev(f"__dr.DR.pk[{i}].a.lay||'g'")
            await ev(f"Object.assign(__dr.player,{{x:{(z[0]+z[2])/2},y:{(z[1]+z[3])/2},vx:0,vy:0,lay:'{lay}'}})"); await pg.wait_for_timeout(1300)
        await drop(1)
        P('after drop 2nd first', await ev("[__dr.DR.done, __dr.DR.earn, __dr.DR.pk.map(p=>p.done)]"))
        # a wrong address
        await ev("(()=>{const a=__dr.DR_ADDR.find(a=>!__dr.DR.pk.some(p=>p.a===a)&&!a.lay); Object.assign(__dr.player,{x:(a.zone[0]+a.zone[2])/2,y:(a.zone[1]+a.zone[3])/2,vx:0,vy:0,lay:'g'});})()"); await pg.wait_for_timeout(1300)
        P('wrong address', await ev("[__dr.DR.done, __dr.DR.earn]"))
        # same address again pays nothing
        await drop(1); P('repeat drop', await ev("[__dr.DR.done, __dr.DR.earn]"))
        await drop(0)
        P('wave cleared', await ev("[__dr.DR.phase, __dr.DR.done, __dr.DR.earn, +__dr.DR.timeLeft.toFixed(1)]"))
        await pg.wait_for_timeout(1500); await pg.screenshot(path=S+'dr_return.png')
        # back to the depot -> wave 2 with 3
        await ev("Object.assign(__dr.player,{x:1375,y:1290,vx:0,vy:0,lay:'g'})"); await pg.wait_for_function("__dr.DR.phase==='preview'", timeout=6000)
        P('wave2', await ev("[__dr.DR.wave, __dr.DR.pk.length, new Set(__dr.DR.pk.map(p=>p.a.id)).size, __dr.DR.limit]"))
        await pg.screenshot(path=S+'dr_preview2.png')
        await pg.wait_for_function("__dr.DR.phase==='drive'", timeout=6000)
        for i in range(3): await drop(i)
        await ev("Object.assign(__dr.player,{x:1375,y:1290,vx:0,vy:0,lay:'g'})"); await pg.wait_for_function("__dr.DR.phase==='preview'", timeout=6000)
        P('wave3', await ev("[__dr.DR.wave, __dr.DR.pk.length, new Set(__dr.DR.pk.map(p=>p.a.id)).size, __dr.DR.limit]"))
        # damage carries: knock off two parts, then run out of time
        await pg.wait_for_function("__dr.DR.phase==='drive'", timeout=6000)
        await ev("(()=>{const pl=__dr.player; for (const q of ['hood','doorL']) { pl.parts[q]=false; } pl.lost=2; pl._key=''; __dr.DR.timeLeft=0.2;})()")
        await pg.wait_for_function("__dr.state==='over'", timeout=8000); await pg.wait_for_timeout(400)
        P('settle', await ev("JSON.stringify(__dr.DR.res)"))
        P('final', await ev("document.getElementById('final').innerText"))
        await pg.screenshot(path=S+'dr_settle.png')
        P('errs', errs[:4]); await b.close()
asyncio.run(main())
