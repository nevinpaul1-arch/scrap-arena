import asyncio
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
S='/home/claude/shots/'
def P(*a): print(*a, flush=True)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        ctx=await b.new_context(viewport={'width':844,'height':390}, is_mobile=True, has_touch=True, device_scale_factor=2)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa")
        ev=pg.evaluate
        # waves: pick a different car, die, replay
        await ev("document.getElementById('tWaves').click()"); await pg.wait_for_timeout(500)
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(1200)
        car0=await ev("__hr.player.name || __hr.player.car || __hr.player.type")
        await ev("__hr.player.dead=true; __hr.player.deadT=0"); await pg.wait_for_function("__hr.state==='over'", timeout=10000); await pg.wait_for_timeout(400)
        P('waves over: again', await ev("[!document.getElementById('goAgain').classList.contains('hidden'), document.getElementById('goAgain').innerText.replace(/\\n/g,' | ')]"))
        await pg.screenshot(path=S+'again_waves.png')
        await pg.tap('#goAgain'); await pg.wait_for_timeout(1500)
        P('waves replay', await ev("[__hr.state, __hr.cars.length]"), 'same car', await ev("__hr.player.name || __hr.player.car || __hr.player.type")==car0)
        # hide: escape, replay
        await ev("document.getElementById('pauseBtn').click()"); await pg.wait_for_timeout(200); await pg.tap('#pmMenu'); await pg.wait_for_timeout(600)
        P('after quit -> card', await ev("[__hr.state, document.querySelector('#card h1').innerText]"))
        await ev("document.getElementById('goHome').click()"); await pg.wait_for_timeout(400)
        await pg.click('#tHide'); await pg.wait_for_timeout(300); await pg.click('#hsBots [data-n="3"]'); await pg.click('#hsGo'); await pg.wait_for_function("__hr.HR.phase==='head'")
        await ev("__hr.HR.phase='hunt'; __hr.HR.clock=89.8"); await pg.wait_for_function("__hr.state==='over'", timeout=15000); await pg.wait_for_timeout(500)
        P('hide over: again', await ev("document.getElementById('goAgain').innerText.replace(/\\n/g,' | ')"), 'hud hidden', await ev("document.getElementById('hrHud').classList.contains('hidden')"))
        await pg.screenshot(path=S+'again_hide.png')
        await pg.tap('#goAgain'); await pg.wait_for_function("__hr.HR.phase==='intro'||__hr.HR.phase==='head'", timeout=8000)
        P('hide replay', await ev("[__hr.state, __hr.cars.length-1, __hr.HR.phase]"))
        # bomb: quit -> replay
        await ev("document.getElementById('pauseBtn').click()"); await pg.wait_for_timeout(200); await pg.tap('#pmMenu'); await pg.wait_for_timeout(500)
        await ev("document.getElementById('tBomb').click()"); await pg.wait_for_timeout(400); await ev("document.getElementById('bsGo').click()"); await pg.wait_for_timeout(1500)
        await ev("document.getElementById('pauseBtn').click()"); await pg.wait_for_timeout(200); await pg.tap('#pmMenu'); await pg.wait_for_timeout(800)
        P('bomb quit: again', await ev("[!document.getElementById('goAgain').classList.contains('hidden'), document.getElementById('goAgain').innerText.replace(/\\n/g,' | ')]"))
        await pg.screenshot(path=S+'again_bomb.png')
        await pg.tap('#goAgain'); await pg.wait_for_timeout(1500)
        P('bomb replay', await ev("[__hr.state, __hr.cars.length]"))
        await ev("document.getElementById('pauseBtn').click()"); await pg.wait_for_timeout(200); await pg.tap('#pmMenu'); await pg.wait_for_timeout(500)
        await ev("document.getElementById('goHome').click()"); await pg.wait_for_timeout(500)
        P('home: again hidden', await ev("document.getElementById('goAgain').classList.contains('hidden')"))
        P('errs', errs[:3]); await b.close()
asyncio.run(main())
