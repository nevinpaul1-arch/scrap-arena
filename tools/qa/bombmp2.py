import asyncio, json, time
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
async def page(b,n):
    ctx=await b.new_context(viewport={'width':1000,'height':600}); pg=await ctx.new_page(); pg.errs=[]
    pg.on('pageerror',lambda e: pg.errs.append(str(e)))
    await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa"); await pg.fill('#pname',n); return pg
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); R={}
        h=await page(b,'Host'); g=await page(b,'Guest')
        await h.evaluate("__sa.joinClub('reapers')"); await g.evaluate("__sa.joinClub('vipers')")
        await h.click('#tOnline'); await h.click('#mpPanel .mpTabs button[data-m=versus]'); await h.click('#mpCreateVs'); await h.wait_for_function("__sa.net.lobby",timeout=8000)
        code=await h.evaluate("__sa.net.room")
        await g.click('#tOnline'); await g.fill('#mpCode',code); await g.click('#mpJoin'); await g.wait_for_timeout(1200)
        await h.click('#mpPlayers [data-kind=bomb]'); await h.wait_for_timeout(600)
        R['guest_sees_kind']=await g.evaluate("[__sa.net.vs.kind, !!document.querySelector('#mpPlayers .vsKind.on[data-kind=bomb]'), document.getElementById('mpModeTxt').textContent.slice(0,40)]")
        R['clubs_in_lobby']=await g.evaluate("[...document.querySelectorAll('#mpPlayers .vsBox img.cb')].length")
        await h.screenshot(path='/home/claude/shots/bm_lobby.png')
        R['start_btn']=await h.evaluate("document.getElementById('mpStart').textContent")
        await h.click('#mpStart'); await g.wait_for_function("__sa.net.started && __sa.me",timeout=10000); await g.wait_for_timeout(1500)
        R['host_cars']=await h.evaluate("__sa.cars.filter(c=>c.isPlayer).map(c=>[c.pname,c.team,!!c.bot,c.club])")
        R['guest_cars']=await g.evaluate("__sa.cars.filter(c=>c.isPlayer).map(c=>[c.pname,c.team,!!c.bot,c.club])")
        seq=[]; t0=time.time(); prev=None
        while time.time()-t0<30:
            hs=await h.evaluate("[__sa.bomb.st, __sa.VS.score.join('-')]"); gs=await g.evaluate("[__sa.bomb.st, __sa.VS.score.join('-'), document.getElementById('bombMsg').textContent, __sa.VS.kind]")
            k=hs[0]+'|'+gs[0]+'|'+gs[1]
            if k!=prev: seq.append([round(time.time()-t0,1),hs,gs]); prev=k
            await h.wait_for_timeout(200)
        R['seq']=seq[:16]
        await g.screenshot(path='/home/claude/shots/bm_guest.png')
        R['guest_round']=await g.evaluate("[__sa.bomb.round, __sa.VS.matchT|0, document.querySelector('#vsBar .ap.b').children.length, document.querySelector('#vsBar .ap.r').children.length]")
        await h.evaluate("__sa.VS.matchT=0.3"); await h.wait_for_timeout(1200)
        R['after_clock']=[await h.evaluate("[__sa.bomb.st, __sa.bomb.how, __sa.VS.score.join('-')]"), await g.evaluate("[__sa.bomb.st, __sa.bomb.how, __sa.VS.score.join('-'), document.getElementById('bombMsg').textContent]")]
        await h.wait_for_timeout(3500)
        # kill the guest: no respawn for the round, guest spectates
        await h.evaluate("(()=>{const c=__sa.cars.find(o=>o.pname==='Guest'); c.inv=0; c.dead=true; c.deadT=0;})()"); await g.wait_for_timeout(5000)
        R['guest_dead']=await g.evaluate("[__sa.me.dead, getComputedStyle(document.getElementById('respawnMsg')).display, document.getElementById('respawnMsg').textContent]")
        await h.evaluate("(()=>{__sa.VS.score=[2,2]; for (const c of __sa.cars) if (c.isPlayer && c.team===1) { c.inv=0; c.dead=true; c.deadT=0; } })()"); await g.wait_for_timeout(9000)
        R['guest_over']=await g.evaluate("[document.querySelector('#card h1').textContent, document.getElementById('final').innerText.slice(0,160), !!document.querySelector('#clubAwardBox .clubAward')]")
        R['host_over']=await h.evaluate("[document.querySelector('#card h1').textContent, !!document.querySelector('#clubAwardBox .clubAward'), __sa.club.week.pts]")
        await g.screenshot(path='/home/claude/shots/bm_over.png')
        R['errors']=[h.errs[:3], g.errs[:3]]
        for k,v in R.items(): print(k, json.dumps(v))
        await b.close()
asyncio.run(main())
