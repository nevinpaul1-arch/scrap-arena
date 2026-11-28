import asyncio
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        ctx=await b.new_context(viewport={'width':844,'height':390}, is_mobile=True, has_touch=True, device_scale_factor=2); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa")
        await pg.evaluate("__sa.startBombSP()"); await pg.wait_for_timeout(3500)
        for sc in ([1,0],[1,2],[2,2]):
            await pg.evaluate(f"__sa.VS.score={sc}"); await pg.wait_for_timeout(400)
            print(sc, await pg.evaluate("[document.querySelector('#vsBar b.b').textContent, document.querySelector('#vsBar b.r').textContent, document.querySelector('#vsBar .pb').children.length, document.querySelector('#vsBar .pr').children.length]"))
        await pg.screenshot(path='/home/claude/shots/bs_bar.png', clip={'x':560,'y':0,'width':284,'height':50})
        print('err',errs[:2]); await b.close()
asyncio.run(main())
