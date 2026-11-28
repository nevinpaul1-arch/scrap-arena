import asyncio, sys
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787&cartest='+(sys.argv[1] if len(sys.argv)>1 else 'cruiser')
S='/home/claude/shots/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        ctx=await b.new_context(viewport={'width':858,'height':395}, is_mobile=True, has_touch=True, device_scale_factor=3); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_function("window.__ct && window.__ct.P", timeout=20000); await pg.wait_for_timeout(2500)
        ev=pg.evaluate
        print('cars', await ev("__sa.cars.length"), 'state', await ev("__sa.state"))
        async def crop(name, zoom=False):
            r=await ev("(()=>{const P=__ct.P;return [P.x,P.y]})()")
            await pg.screenshot(path=S+f'ct_{name}.png')
        click=lambda k: ev(f"document.querySelector('[data-ct={k}]').click()")
        # set heading to drive up a bit, centred camera; 1x shot
        await pg.wait_for_timeout(300); await crop('intact1x')
        await click('zoom'); await click('zoom'); await pg.wait_for_timeout(500); await crop('intact3x')
        for k in ['hood','bumper','trunk','doorL','doorR']:
            await click(k); await pg.wait_for_timeout(250)
        await pg.wait_for_timeout(600); await crop('allOff3x')
        await click('fix'); await click('doorL'); await click('hood'); await pg.wait_for_timeout(700); await crop('twoOff3x')
        await click('paint'); await pg.wait_for_timeout(300); await crop('gold3x')
        await click('fix'); await pg.wait_for_timeout(200); await crop('goldIntact3x')
        await click('paint'); await click('paint'); await click('paint'); await pg.wait_for_timeout(300); await crop('blue3x')
        await click('wreck'); await pg.wait_for_timeout(400); await crop('wreck3x'); await click('wreck')
        # kit: lose trunk, spawn kit ahead, drive forward
        await click('paint'); await click('paint'); await click('zoom'); await pg.wait_for_timeout(200)
        await click('trunk'); await click('kit'); await pg.wait_for_timeout(200)
        lost0=await ev("__ct.P.lost")
        await pg.keyboard.down('ArrowUp'); await pg.wait_for_timeout(1500); await pg.keyboard.up('ArrowUp'); await pg.wait_for_timeout(400)
        print('lost before kit',lost0,'after',await ev("__ct.P.lost"), 'trunk', await ev("__ct.P.parts.trunk"), 'pickups', await ev("__sa.pickups.length"))
        await crop('afterkit1x')
        print('errs',errs[:3]); await b.close()
asyncio.run(main())
