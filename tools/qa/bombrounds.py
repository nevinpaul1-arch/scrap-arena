import asyncio, json, time, sys
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        ctx=await b.new_context(viewport={'width':844,'height':390}, is_mobile=True, has_touch=True, device_scale_factor=2); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa"); await pg.wait_for_timeout(500)
        await pg.evaluate("__sa.startBombSP()"); await pg.wait_for_timeout(300)
        await pg.evaluate("window.__simK=4")
        ev=[]; prev=None; t0=time.time(); resp=0; lastDead={}; kits=0; shots=set(); spec=None
        while time.time()-t0<160:
            st=await pg.evaluate("""(()=>{const B=__sa.bomb,cs=__sa.cars.filter(c=>c.isPlayer);return {st:B.st,how:B.how||'',r:B.round,sc:__sa.VS.score.join('-'),t:Math.round(__sa.VS.matchT),dead:cs.map(c=>c.dead?1:0).join(''),kit:(window.__sa&&document.querySelector('#vsBar .ap.b')?document.querySelector('#vsBar .ap.b').children.length:0),pk:__sa.mode, state:document.body.classList.contains('playing'), over:document.getElementById('card').classList.contains('over'), resp:document.getElementById('respawnMsg').textContent}})()""")
            if prev and prev['st']==st['st'] and st['st'] not in ('boom','end'):
                for i,(a,c) in enumerate(zip(prev['dead'],st['dead'])):
                    if a=='1' and c=='0' and prev['r']==st['r']: resp+=1
            k=(st['st'],st['sc'],st['r'],st['dead'])
            if prev is None or k!=(prev['st'],prev['sc'],prev['r'],prev['dead']): ev.append([round(time.time()-t0,1),st['st'],st['how'],st['r'],st['sc'],st['t'],st['dead']])
            if 'WRECKED' in st['resp'] and 'resp' not in shots: shots.add('resp'); spec=st['resp']; await pg.screenshot(path='/home/claude/shots/br_spec.png')
            if st['st']=='boom' and st['how'] in('wipe','time') and st['how'] not in shots: shots.add(st['how']); await pg.screenshot(path=f"/home/claude/shots/br_{st['how']}.png")
            nk=await pg.evaluate("__sa.cars&&0||0")
            if st['over']: break
            prev=st; await pg.wait_for_timeout(120)
        for e in ev: print(e)
        print('respawns within a round:',resp,' spectate msg:',spec)
        await pg.wait_for_timeout(3500); await pg.screenshot(path='/home/claude/shots/br_res.png')
        print('final h1', await pg.evaluate("document.querySelector('#card h1').textContent"), await pg.evaluate("document.querySelector('.vsRes .sub')&&document.querySelector('.vsRes .sub').textContent"))
        print('err', errs[:3])
        await b.close()
asyncio.run(main())
