import asyncio, sys
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        for nm,vp in [('se',(667,375)),('std',(844,390)),('max',(932,430)),('desk',(1280,760))]:
            mob = nm!='desk'
            ctx=await b.new_context(viewport={'width':vp[0],'height':vp[1]}, is_mobile=mob, has_touch=mob, device_scale_factor=2 if mob else 1); pg=await ctx.new_page(); errs=[]
            pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa"); await pg.wait_for_timeout(1500)
            await pg.screenshot(path=f'/home/claude/shots/sz_{nm}_hub.png')
            ov=await pg.evaluate("""(()=>{const r=[];document.querySelectorAll('.modes .tile').forEach(t=>{const b=t.getBoundingClientRect();const tt=t.querySelector('b');r.push([t.id,Math.round(b.width),Math.round(b.height),tt.scrollWidth>tt.clientWidth?'CLIP':''])});const m=document.querySelector('.modes').getBoundingClientRect();return [r, Math.round(m.bottom), innerHeight, document.getElementById('hub').scrollHeight]})()""")
            print(nm, ov, errs[:2])
            await ctx.close()
        await b.close()
asyncio.run(main())
