import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for vp in [(858,395),(667,375),(932,430)]:
            ctx=await b.new_context(viewport={'width':vp[0],'height':vp[1]}, is_mobile=True, has_touch=True, device_scale_factor=3); pg=await ctx.new_page()
            await pg.add_init_script("""if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('scrapArenaMaxWave','3');localStorage.setItem('scrapArenaName',JSON.stringify(JSON.stringify('Nev')));localStorage.setItem('scrapArenaHubCar',JSON.stringify('hauler'));}""")
            await pg.goto(URL); await pg.wait_for_function("window.__sa"); await pg.evaluate("__sa.joinClub('bulls')"); await pg.wait_for_timeout(1500)
            nm=await pg.evaluate("[localStorage.scrapArenaName, document.getElementById('pname').value]")
            hits=await pg.evaluate("[...document.querySelectorAll('.topBtns button,#hubPBadge')].filter(b=>b.offsetParent).map(b=>{const r=b.getBoundingClientRect();let bad=[];for(const fx of [.2,.5,.8])for(const fy of [.3,.7]){const e=document.elementFromPoint(r.x+r.width*fx,r.y+r.height*fy);if(!b.contains(e))bad.push(e&&(e.id||e.tagName))}return b.id+(bad.length?' BLOCKED by '+bad[0]:' ok')})")
            car=await pg.evaluate("(()=>{const r=document.getElementById('hubCar').getBoundingClientRect(), s=document.getElementById('hubStage').getBoundingClientRect(), pl=document.querySelector('.plate').getBoundingClientRect(), tb=document.querySelector('.hubTop').getBoundingClientRect();return {carCx:Math.round(r.x+r.width/2),stageCx:Math.round(s.x+s.width/2),carTop:r.y|0,topBarBottom:tb.bottom|0,carBottom:r.bottom|0,plateTop:pl.top|0,plateH:pl.height|0}})()")
            print(vp, nm, car); print('   ', hits)
            # tap the chat button for real and see what opens
            await pg.tap('#hubChat'); await pg.wait_for_timeout(600)
            print('    after tapping chat: garage open?', await pg.evaluate("!document.getElementById('garageSheet').classList.contains('hidden')"), ' chat open?', await pg.evaluate("!document.getElementById('chatSheet').classList.contains('hidden')"))
            await pg.evaluate("document.querySelectorAll('.bigSheet,#chatSheet').forEach(s=>s.classList.add('hidden'))"); await pg.wait_for_timeout(600)
            await pg.screenshot(path=f'/home/claude/shots/hd_{vp[0]}.png')
            await ctx.close()
        await b.close()
asyncio.run(main())
