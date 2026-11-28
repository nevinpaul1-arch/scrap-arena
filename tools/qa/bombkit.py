import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        ctx=await b.new_context(viewport={'width':844,'height':390}, is_mobile=True, has_touch=True, device_scale_factor=2); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa"); await pg.wait_for_timeout(500)
        # podium button is cleared by a new game
        await pg.evaluate("__sa.lastPod={tops:[['a',{}],['b',{}]],gag:0}")
        vis1=await pg.evaluate("getComputedStyle(document.getElementById('podReplay')).display")
        await pg.evaluate("__sa.startBombSP()"); await pg.wait_for_timeout(3200)
        vis2=await pg.evaluate("getComputedStyle(document.getElementById('podReplay')).display")
        print('podium btn before/after new game:',vis1,vis2, 'lastPod', await pg.evaluate("__sa.lastPod"))
        # kits: a full-health car can't take one, a damaged one can
        r=await pg.evaluate("""(()=>{__sa.bombKit(); const k=__sa.pickups[0]; if(!k) return 'no kit'; const P=__sa.player; P.inv=1e9; P.x=k.x; P.y=k.y; P.vx=P.vy=0; return [k.k, Math.round(k.x), Math.round(k.y)]})()""")
        await pg.wait_for_timeout(400)
        full=await pg.evaluate("[__sa.pickups.length, __sa.player.lost]")
        await pg.evaluate("""(()=>{const P=__sa.player; P.parts.hood=false; P.parts.trunk=false; P.lost=2; P._key=''; const k=__sa.pickups[0]; P.x=k.x+1; P.y=k.y;})()""")
        await pg.wait_for_timeout(500)
        dmg=await pg.evaluate("[__sa.pickups.length, __sa.player.lost]")
        print('kit',r,' full-health car on it -> [kits, lost]',full,' damaged car on it ->',dmg)
        await pg.evaluate("__sa.bombKit()"); await pg.wait_for_timeout(200); await pg.screenshot(path='/home/claude/shots/br_kit.png')
        # wrecked: no respawn, spectate a team-mate
        await pg.evaluate("(()=>{const P=__sa.player; P.inv=0; P.dead=true; P.deadT=0; P._deadAt=performance.now()-2000;})()")
        await pg.wait_for_timeout(5500)
        print('dead after 5.5 s:', await pg.evaluate("__sa.player.dead"), ' watching:', await pg.evaluate("__sa.spec()"), ' msg:', await pg.evaluate("document.getElementById('respawnMsg').textContent"), ' pips:', await pg.evaluate("document.querySelector('#vsBar .ap.b').innerHTML"))
        await pg.screenshot(path='/home/claude/shots/br_spec.png')
        print('err', errs[:3])
        await b.close()
asyncio.run(main())
