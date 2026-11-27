import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
S='/home/claude/shots/'
def P(*a): print(*a, flush=True)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for name,vp,mob in [('desk',{'width':1280,'height':720},False),('phone',{'width':844,'height':390},True)]:
            ctx=await b.new_context(viewport=vp, is_mobile=mob, has_touch=mob, device_scale_factor=2 if mob else 1)
            pg=await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa")
            await pg.click('#tHide'); await pg.wait_for_timeout(300); await pg.click('#hsGo'); await pg.wait_for_function("__hr.HR.phase==='head'")
            await pg.keyboard.down('ArrowUp'); await pg.wait_for_timeout(2500); await pg.keyboard.up('ArrowUp')
            await pg.screenshot(path=S+f'hr_{name}_play.png')
            # leave through the pause menu, then a normal Waves run
            await pg.evaluate("document.getElementById('pauseBtn').click()"); await pg.wait_for_timeout(300)
            await pg.click('#pmMenu'); await pg.wait_for_timeout(800)
            P(name,'after menu', await pg.evaluate("[__hr.state, document.body.classList.contains('hr'), __hr.W]"))
            await pg.click('#tWaves'); await pg.wait_for_timeout(900)
            # car select -> go
            await pg.evaluate("document.getElementById('selGo') ? document.getElementById('selGo').click() : null"); await pg.wait_for_timeout(300)
            await pg.keyboard.press('Enter'); await pg.wait_for_timeout(3500)
            await pg.keyboard.down('ArrowUp'); await pg.wait_for_timeout(1500); await pg.keyboard.up('ArrowUp')
            P(name,'waves', await pg.evaluate("[__hr.state, __hr.arena, __hr.W, __hr.cars.length, __sa.introT!=null, document.getElementById('hrHud').classList.contains('hidden'), document.getElementById('hud').offsetParent!==null]"))
            await pg.screenshot(path=S+f'hr_{name}_waves_after.png')
            P(name,'errs', errs[:3]); await ctx.close()
        await b.close()
asyncio.run(main())
