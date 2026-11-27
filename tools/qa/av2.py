import asyncio, json, time
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
ARGS=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
S='/home/claude/shots/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=ARGS); R={}
        ctx=await b.new_context(viewport={'width':844,'height':390}, is_mobile=True, has_touch=True, device_scale_factor=2)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('requestfailed', lambda r: errs.append('reqfail:'+r.url[:90]))
        # returning player with an old-version look and no portrait
        await pg.add_init_script("""if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');const g={gp:2000,owned:[],equip:'',ach:{},rep:0,st:{},av:'3.2.1.helmet.shades.camo.cargo.spiky.cape',avOwned:['face:shades','top:camo','legs:cargo','boots:spiky','extra:cape']};localStorage.setItem('scrapArenaGarage',JSON.stringify(g));localStorage.setItem('scrapArenaName',JSON.stringify('Nevin').slice(1,-1));}""")
        await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa")
        t=time.time(); await pg.wait_for_function("window.__av && __av.AV", timeout=30000); R['warm_loaded_s']=round(time.time()-t+0)
        await pg.wait_for_timeout(1500)
        R['portrait']=await pg.evaluate("[!!localStorage.getItem('scrapArenaAvatarPic'), localStorage.getItem('scrapArenaAvPicV'), document.querySelectorAll('canvas').length]")
        await pg.screenshot(path=S+'av_hub.png')
        # garage driver tab: open/close many times (leaks?)
        for i in range(6):
            await pg.evaluate("__sa.openGarage('driver')"); await pg.wait_for_timeout(700)
            await pg.evaluate("document.querySelector('[data-close=garageSheet]').click()"); await pg.wait_for_timeout(200)
        R['canvases_after_cycles']=await pg.evaluate("document.querySelectorAll('canvas').length")
        t=time.time(); await pg.evaluate("__sa.openGarage('driver')"); await pg.wait_for_function("__av.pv", timeout=10000); R['garage_open_ms']=round((time.time()-t)*1000)
        await pg.wait_for_timeout(1500); await pg.screenshot(path=S+'av_garage.png')
        # try the new items
        for cat,item in [('head','curls'),('head','pitcap'),('head','openface'),('top','coveralls'),('top','pitjacket')]:
            await pg.click(f'[data-dcat={cat}]'); await pg.wait_for_timeout(150)
            await pg.click(f'[data-ditem={item}]'); await pg.wait_for_timeout(500)
            if item in ('openface','pitjacket'): await pg.screenshot(path=S+f'av_item_{item}.png')
        R['items_listed']=await pg.evaluate("[...document.querySelectorAll('[data-ditem]')].map(b=>b.dataset.ditem)")
        await pg.wait_for_timeout(2500)
        R['quality_after_garage']=await pg.evaluate("[__av.AVQ.low, localStorage.getItem('scrapArenaAvLow')]")
        await pg.evaluate("document.querySelector('[data-close=garageSheet]').click()"); await pg.wait_for_timeout(300)
        # podium, every gag
        tops=[['Nevin','3.2.1.openface.shades.pitjacket.cargo.spiky.cape','owls',5200,4],['Bob','1.0.5.pitcap.beard.coveralls.race.combat.gloves','bulls',4100,1],['Ana','r123','',2900,0]]
        for gag in range(5):
            t=time.time(); await pg.evaluate("p=>__av.show(p)", {'tops':tops,'gag':gag}); await pg.wait_for_function("__av.POD", timeout=15000)
            R[f'pod{gag}_ms']=round((time.time()-t)*1000)
            await pg.wait_for_timeout(3600 if gag in (0,2) else 3000); await pg.screenshot(path=S+f'av_pod{gag}.png')
            R[f'pod{gag}_labels']=await pg.evaluate("[...document.querySelectorAll('.podLab')].map(l=>[l.innerText.replace(/\\s+/g,' '), l.style.left, l.style.top])")
            await pg.evaluate("__av.close()"); await pg.wait_for_timeout(300)
        # podium ends on its own and cleans up
        await pg.evaluate("p=>__av.show(p)", {'tops':tops[:2],'gag':1}); await pg.wait_for_function("!document.getElementById('podium')", timeout=40000)
        R['pod_self_closed']=await pg.evaluate("[!!document.getElementById('podium'), document.querySelectorAll('canvas').length]")
        R['errs']=errs[:6]
        for k,v in R.items(): print(k, json.dumps(v))
        await b.close()
asyncio.run(main())
