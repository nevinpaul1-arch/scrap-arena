import asyncio
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
S="[...document.querySelectorAll('.modes .tile')].map(t=>{const m=new DOMMatrix(getComputedStyle(t).transform);return t.id.slice(1,5)+':'+Math.round(m.m41)+'/'+(+getComputedStyle(t).opacity).toFixed(1)}).join(' ')"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        ctx=await b.new_context(viewport={'width':858,'height':395}, is_mobile=True, has_touch=True, device_scale_factor=2); pg=await ctx.new_page()
        await pg.goto(URL); await pg.wait_for_function("window.__sa"); await pg.wait_for_timeout(1500)
        for name,openjs,backjs in [('bomb sheet',"document.getElementById('tBomb').click()","document.querySelector('[data-close=bombSheet]').click()"),
                                   ('waves select',"document.getElementById('tWaves').click()","document.getElementById('selBack').click()"),
                                   ('online',"document.getElementById('tOnline').click()","document.getElementById('mpClose').click()")]:
            await pg.evaluate(openjs); await pg.wait_for_timeout(700); await pg.evaluate(backjs)
            r=[]
            for t in (30,150,300,700): 
                await pg.wait_for_timeout(t - (r and [30,150,300,700][len(r)-1] or 0)); r.append(await pg.evaluate(S))
            print(name); [print('  ',x) for x in r]
        await b.close()
asyncio.run(main())
