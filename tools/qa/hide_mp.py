import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
S='/home/claude/shots/'
def P(*a): print(*a, flush=True)
async def page(b,n,phone=False):
    ctx=await b.new_context(viewport={'width':844,'height':390},is_mobile=phone,has_touch=phone,device_scale_factor=2 if phone else 1)
    pg=await ctx.new_page(); pg.errs=[]; pg.on('pageerror',lambda e:pg.errs.append(str(e)+' | '+(e.stack or '')[:200]))
    await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa"); await pg.fill('#pname',n); return pg
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        h=await page(b,'Nevin'); g=await page(b,'Sam',True)
        await h.click('#tOnline'); await h.click('#mpPanel .mpTabs button[data-m=versus]'); await h.click('#mpCreateVs'); await h.wait_for_function("__sa.net.lobby",timeout=8000)
        code=await h.evaluate("__sa.net.room")
        await h.click('#mpPlayers [data-kind=hide]'); await h.wait_for_timeout(500)
        P('start_btn_alone', await h.evaluate("[document.getElementById('mpStart').textContent, document.getElementById('mpStart').disabled]"))
        await g.tap('#tOnline'); await g.fill('#mpCode',code); await g.tap('#mpJoin'); await g.wait_for_timeout(1500)
        P('start_btn', await h.evaluate("[document.getElementById('mpStart').textContent, document.getElementById('mpStart').disabled]"))
        await g.screenshot(path=S+'hrmp_lobby_guest.png')
        await h.click('#mpStart')
        await g.wait_for_function("__sa.net.started && window.__hr && __hr.HR.phase!=='idle'",timeout=10000)
        await h.wait_for_timeout(800)
        st=lambda pg: pg.evaluate("[__hr.HR.phase, __hr.HR.round, __hr.HR.hider===__hr.player.pid ? 'me' : 'other', __hr.player.hr, __hr.HR.order.length, __hr.arena]")
        P('host', await st(h)); P('guest', await st(g))
        await h.wait_for_function("__hr.HR.phase==='head'", timeout=8000); await g.wait_for_timeout(600)
        # whoever seeks tries to drive during the head start: must stay put
        seekerPg = h if await h.evaluate("__hr.player.hr")=='seeker' else g
        hiderPg = g if seekerPg is h else h
        x0=await seekerPg.evaluate("[Math.round(__hr.player.x),Math.round(__hr.player.y)]")
        await seekerPg.keyboard.down('ArrowUp'); await seekerPg.wait_for_timeout(1500); await seekerPg.keyboard.up('ArrowUp')
        x1=await seekerPg.evaluate("[Math.round(__hr.player.x),Math.round(__hr.player.y)]")
        P('seeker_locked_during_head', x0, x1, 'cover shown:', await seekerPg.evaluate("!document.getElementById('hrCover').classList.contains('hidden')"))
        await seekerPg.screenshot(path=S+'hrmp_seeker_head.png' if seekerPg is g else S+'hrmp_seeker_head_host.png')
        # hider drives off
        await hiderPg.keyboard.down('ArrowUp'); await hiderPg.wait_for_timeout(2000); await hiderPg.keyboard.up('ArrowUp')
        await h.wait_for_function("__hr.HR.phase==='hunt'", timeout=12000); await g.wait_for_timeout(1000)
        P('hunt host/guest', await h.evaluate("[__hr.HR.phase, +__hr.HR.clock.toFixed(1)]"), await g.evaluate("[__hr.HR.phase, +__hr.HR.clock.toFixed(1)]"))
        await g.screenshot(path=S+'hrmp_guest_hunt.png')
        # put the seeker right behind the hider (host moves cars) and nudge -> tag
        await h.evaluate("(()=>{const hd=__hr.cars.find(c=>c.hr==='hider'), sk=__hr.cars.find(c=>c.hr==='seeker'); __hr.setPos(sk, hd.x-Math.cos(hd.a)*58, hd.y-Math.sin(hd.a)*58, hd.a); sk.vx=Math.cos(hd.a)*80; sk.vy=Math.sin(hd.a)*80;})()")
        await h.wait_for_function("__hr.HR.phase==='end'", timeout=5000); await g.wait_for_timeout(800)
        P('round1 result host', await h.evaluate("JSON.stringify(__hr.HR.res)"))
        P('round1 result guest', await g.evaluate("JSON.stringify(__hr.HR.res)"), await g.evaluate("document.getElementById('banner').innerText"))
        # round 2: roles swap
        await h.wait_for_function("__hr.HR.round===2 && __hr.HR.phase==='head'", timeout=12000); await g.wait_for_timeout(600)
        P('round2 host', await st(h)); P('round2 guest', await st(g))
        # let round 2 run to the cap quickly: host jumps the clock
        await h.wait_for_function("__hr.HR.phase==='hunt'", timeout=12000)
        await h.evaluate("__hr.HR.clock=89.5"); await h.wait_for_function("__hr.HR.phase==='end'", timeout=5000)
        await g.wait_for_function("__hr.state==='over'", timeout=15000); await h.wait_for_timeout(800)
        P('final host', await h.evaluate("[document.querySelector('#card h1').innerText, document.getElementById('final').innerText]"))
        P('final guest', await g.evaluate("[document.querySelector('#card h1').innerText, document.getElementById('final').innerText]"))
        await g.screenshot(path=S+'hrmp_final_guest.png')
        P('errs', h.errs[:3], g.errs[:3])
        await b.close()
asyncio.run(main())
