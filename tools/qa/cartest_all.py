import asyncio
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
CARS=['cruiser','dart','bruiser','drifter','hauler','rocket','fortress','phantom']
S='/home/claude/shots/'
async def shoot(b, car):
    ctx=await b.new_context(viewport={'width':858,'height':395}, is_mobile=True, has_touch=True, device_scale_factor=2); pg=await ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    await pg.goto('file:///home/claude/car-smash.html?api=http://127.0.0.1:8787&cartest='+car); await pg.wait_for_function("window.__ct && window.__ct.P", timeout=20000); await pg.wait_for_timeout(2300)
    ev=pg.evaluate; click=lambda k: ev(f"document.querySelector('[data-ct={k}]').click()")
    tiles=[]
    async def grab():
        await pg.wait_for_timeout(450); im=Image.open(__import__('io').BytesIO(await pg.screenshot())); w,h=im.size
        tiles.append(im.crop((w//2-150,h//2-210,w//2+150,h//2+210)))
    await click('zoom'); await click('zoom'); await pg.wait_for_timeout(300)
    await grab()                                   # intact, stock
    await click('hood'); await click('doorL'); await pg.wait_for_timeout(900); await grab()
    for k in ['bumper','trunk','doorR']: await click(k)
    await pg.wait_for_timeout(1400); await grab()  # all off
    await click('fix'); await click('paint'); await grab()   # paint 2
    for _ in range(3): await click('paint')
    await grab()                                   # paint 5
    await click('wreck'); await pg.wait_for_timeout(1200); await grab(); await click('wreck')
    await ctx.close(); return tiles, errs
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        allerr=[]
        for i in range(0,8,4):
            rows=[]
            for car in CARS[i:i+4]:
                t,e=await shoot(b,car); rows.append((car,t)); allerr+=e
            out=Image.new('RGB',(300*6,420*len(rows)),(0,0,0))
            for r,(car,t) in enumerate(rows):
                for j,im in enumerate(t): out.paste(im,(j*300,r*420))
                ImageDraw.Draw(out).text((8,r*420+6),car.upper(),fill=(255,220,120))
            out.save(S+f'all_cars_{i//4}.png')
        print('errs',allerr[:4]); await b.close()
asyncio.run(main())
