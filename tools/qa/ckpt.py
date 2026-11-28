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
        await pg.add_init_script("localStorage.setItem('scrapArenaCheckpoint', JSON.stringify({v:1,wave:5,score:777,scrap:20,up:{armor:1,nitro:0,ram:0},kills:12,ms:90000,seen:[],car:'dart',at:Date.now()}))")
        await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa")
        await pg.evaluate("document.getElementById('tWaves').click()"); await pg.wait_for_timeout(700)
        P('select continue btn', await pg.evaluate("[!document.getElementById('selCont').classList.contains('hidden'), document.getElementById('selCont').innerText.replace(/\\n/g,' | ')]"))
        await pg.screenshot(path=S+'ck_select.png')
        await pg.tap('#selCont'); await pg.wait_for_timeout(1500)
        P('continued', await pg.evaluate("[__hr.state, __sa.wave !== undefined ? __sa.wave : null]"), await pg.evaluate("[document.getElementById('hud').innerText.slice(0,60)]"))
        await pg.evaluate("__hr.player.dead=true; __hr.player.deadT=0"); await pg.wait_for_function("__hr.state==='over'", timeout=10000); await pg.wait_for_timeout(500)
        P('results', await pg.evaluate("[document.getElementById('goAgain').innerText, !document.getElementById('againCont').classList.contains('hidden'), document.getElementById('againCont').innerText]"))
        await pg.screenshot(path=S+'ck_results.png')
        await pg.tap('#againCont'); await pg.wait_for_timeout(1500)
        P('continued again', await pg.evaluate("[__hr.state, document.getElementById('hud').innerText.slice(0,60)]"))
        # a fresh restart from the results starts at wave 1
        await pg.evaluate("__hr.player.dead=true; __hr.player.deadT=0"); await pg.wait_for_function("__hr.state==='over'", timeout=10000); await pg.wait_for_timeout(400)
        await pg.tap('#goAgain'); await pg.wait_for_timeout(1500)
        P('restart', await pg.evaluate("[__hr.state, document.getElementById('hud').innerText.slice(0,60)]"))
        P('errs', errs[:3]); await b.close()
asyncio.run(main())
