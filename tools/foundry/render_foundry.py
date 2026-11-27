import asyncio, base64, sys, time, json
from playwright.async_api import async_playwright
SC=sys.argv[1] if len(sys.argv)>1 else '1'; MODES=sys.argv[2].split(',') if len(sys.argv)>2 else ['full','ground','id']
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--js-flags=--max-old-space-size=8192'])
        for mode in MODES:
            pg=await b.new_page(viewport={'width':800,'height':600})
            errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' and 'favicon' not in m.text else None)
            t=time.time(); await pg.goto(f'http://localhost:8765/foundry.html?mode={mode}&scale={SC}')
            try: await pg.wait_for_function('window.__done===true', timeout=1500000, polling=2000)
            except Exception as e: print(mode,'TIMEOUT',errs[:5]); continue
            data=await pg.evaluate("document.querySelector('canvas').toDataURL('image/png')")
            open(f'/home/claude/r3d/fd_{mode}.png','wb').write(base64.b64decode(data.split(',')[1]))
            if mode=='id': json.dump(await pg.evaluate("window.OVCOL"), open('/home/claude/r3d/fd_ovcol.json','w'))
            print(mode,'ok',round(time.time()-t),'s',errs[:5]); await pg.close()
        await b.close()
asyncio.run(main())
