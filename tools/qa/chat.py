import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
async def page(b, name):
    ctx=await b.new_context(viewport={'width':844,'height':390}, is_mobile=True, has_touch=True, device_scale_factor=2)
    pg=await ctx.new_page(); pg.errs=[]; pg.on('pageerror', lambda e: pg.errs.append(str(e)))
    await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa")
    await pg.fill('#pname', name); await pg.wait_for_timeout(300); return pg
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); R={}
        a=await page(b,'Nevin'); g=await page(b,'Bob')
        R['typeofCH']=await a.evaluate("typeof __chat")
        for pg in (a,g):
            await pg.evaluate("__sa.openClub && __sa.openClub()"); await pg.wait_for_timeout(500)
            await pg.click('[data-join=owls]'); await pg.wait_for_timeout(300)
            await pg.evaluate("document.getElementById('clubSheet').classList.add('hidden')")
            await pg.evaluate("__sa.cloudSync && __sa.cloudSync()"); await pg.wait_for_timeout(1200)
        # global chat
        await a.click('#hubChat'); await a.wait_for_timeout(600)
        await a.fill('#chatIn','hey all, shit that was close'); await a.click('#chatSend'); await a.wait_for_timeout(800)
        await a.fill('#chatIn','second one'); await a.click('#chatSend'); await a.wait_for_timeout(500)
        R['a_err_fast']=await a.evaluate("document.getElementById('chatErr').textContent")
        await a.wait_for_timeout(1600); await a.click('[data-chq=\"GG 🤝\"]'); await a.wait_for_timeout(700)
        await a.screenshot(path='/home/claude/shots/chat_global_a.png')
        # B sees badge, opens
        await g.evaluate("__chat.pull('g')"); await g.wait_for_timeout(500)
        R['b_badge']=await g.evaluate("document.getElementById('hubChatN').textContent")
        await g.click('#hubChat'); await g.wait_for_timeout(800)
        R['b_global']=await g.evaluate("[...document.querySelectorAll('#chatBody .chL p')].slice(-3).map(p=>p.textContent)")
        # club tab
        await g.click('[data-cht=c]'); await g.fill('#chatIn','owls meet at 8'); await g.click('#chatSend'); await g.wait_for_timeout(800)
        await g.screenshot(path='/home/claude/shots/chat_club_b.png')
        await a.click('[data-cht=c]'); await a.wait_for_timeout(900)
        R['a_club']=await a.evaluate("[...document.querySelectorAll('#chatBody .chL p')].map(p=>p.textContent)")
        # mute Bob on A
        await a.click('#chatBody [data-cu]'); await a.wait_for_timeout(150); await a.click('#chatBody [data-cu]'); await a.wait_for_timeout(300)
        R['a_after_mute']=[await a.evaluate("document.querySelectorAll('#chatBody .chL').length"), await a.evaluate("document.getElementById('chatMuted').textContent")]
        await a.click('[data-chunmute]'); await a.wait_for_timeout(200)
        for pg in (a,g): await pg.evaluate("document.getElementById('chatSheet').classList.add('hidden')")
        # room chat
        await a.click('#tOnline'); await a.click('#mpCreateCoop'); await a.wait_for_function("__sa.net.lobby", timeout=8000)
        code=await a.evaluate("__sa.net.room")
        await g.click('#tOnline'); await g.fill('#mpCode', code); await g.click('#mpJoin')
        await a.wait_for_function("__sa.net.lobby && __sa.net.lobby.players.length===2", timeout=8000)
        await a.click('#lobChat [data-openchat]'); await a.wait_for_timeout(400)
        R['a_room_tab']=await a.evaluate("__chat.CH.tab")
        R['quick_has_room']=await a.evaluate("[...document.querySelectorAll('#chatQuick button')][0].textContent")
        await a.click('#chatQuick button'); await a.wait_for_timeout(700)
        await a.screenshot(path='/home/claude/shots/chat_room_a.png')
        await a.evaluate("document.getElementById('chatSheet').classList.add('hidden')")
        R['g_lobby_preview']=await g.evaluate("document.getElementById('lobChat').innerText")
        await g.screenshot(path='/home/claude/shots/chat_lobby_b.png')
        await a.click('#mpStart'); await g.wait_for_function("__sa.net.started && __sa.me", timeout=8000); await g.wait_for_timeout(1500)
        R['g_chatbtn_visible']=await g.evaluate("getComputedStyle(document.getElementById('chatBtn')).display")
        await a.evaluate("__chat.room('cover me! damn')"); await g.wait_for_timeout(600)
        R['g_feed']=await g.evaluate("document.getElementById('chatFeed').innerText")
        await g.screenshot(path='/home/claude/shots/chat_match_b.png')
        await g.click('#chatBtn'); await g.wait_for_timeout(500); await g.screenshot(path='/home/claude/shots/chat_match_open_b.png')
        R['g_match_tab']=await g.evaluate("[__chat.CH.tab, __chat.CH.msgs.r.length]")
        R['errs']=[a.errs[:3], g.errs[:3]]
        for k,v in R.items(): print(k, json.dumps(v, ensure_ascii=False))
        await b.close()
asyncio.run(main())
