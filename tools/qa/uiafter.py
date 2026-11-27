import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
ARGS=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
S='/home/claude/shots/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=ARGS); R={}
        ctx=await b.new_context(viewport={'width':844,'height':390}, is_mobile=True, has_touch=True, device_scale_factor=2)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("""if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');localStorage.setItem('scrapArenaGarage',JSON.stringify({gp:500,owned:[],equip:'',ach:{},rep:0,st:{},av:'',avOwned:['head:beanie','top:hoodie','extra:pads']}));}""")
        await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa")
        await pg.wait_for_timeout(3200)
        R['gp_after_refund']=await pg.evaluate("JSON.parse(localStorage.getItem('scrapArenaGarage')).gp")
        R['toast']=await pg.evaluate("document.getElementById('achToast').innerText")
        await pg.reload(); await pg.wait_for_function("window.__sa"); await pg.wait_for_timeout(3000)
        R['gp_no_double']=await pg.evaluate("JSON.parse(localStorage.getItem('scrapArenaGarage')).gp")
        # bomb + online back buttons
        await pg.click('#tBomb') if await pg.query_selector('#tBomb') else await pg.evaluate("document.getElementById('bombSheet').classList.remove('hidden')")
        await pg.wait_for_timeout(400); await pg.screenshot(path=S+'ui_after_bomb.png')
        await pg.click('#bombSheet .backBtn'); R['bomb_closed']=await pg.evaluate("document.getElementById('bombSheet').classList.contains('hidden')")
        await pg.click('#tOnline'); await pg.wait_for_timeout(400); await pg.screenshot(path=S+'ui_after_online.png')
        await pg.click('#mpClose'); R['online_closed']=await pg.evaluate("document.getElementById('mpPanel').classList.contains('hidden')")
        # club HQ
        await pg.evaluate("__openClub()"); await pg.wait_for_timeout(300); await pg.click('[data-join=owls]'); await pg.evaluate("__sa.cloudSync && __sa.cloudSync()"); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=S+'ui_after_club.png')
        await pg.click('[data-cqlv="3"]'); await pg.wait_for_timeout(200); R['pip']=await pg.evaluate("document.querySelector('.cqPipInfo').innerText")
        R['scroll_club']=await pg.evaluate("(()=>{const b=document.querySelector('#clubSheet .bs');return [b.scrollHeight,b.clientHeight]})()")
        await pg.click('#cqTabs [data-cq=crew]'); await pg.wait_for_timeout(700)
        await pg.fill('#cqChatIn','owls rule, damn right'); await pg.click('#cqChatSend'); await pg.wait_for_timeout(900)
        R['club_chat']=await pg.evaluate("[...document.querySelectorAll('#cqChatB .chL p')].slice(-2).map(p=>p.textContent)")
        R['chat_err']=await pg.evaluate("document.getElementById('cqChatErr').textContent")
        await pg.fill('#cqChatIn','typing...'); await pg.wait_for_timeout(3500)
        R['input_kept_after_poll']=await pg.evaluate("document.getElementById('cqChatIn').value")
        R['scroll_crew']=await pg.evaluate("(()=>{const b=document.querySelector('#clubSheet .bs');return [b.scrollHeight,b.clientHeight]})()")
        await pg.screenshot(path=S+'ui_after_crew.png')
        await pg.click('[data-openchat=c]'); await pg.wait_for_timeout(500); R['full_chat_tab']=await pg.evaluate("[!document.getElementById('chatSheet').classList.contains('hidden'), document.querySelector('#chatTabs .on').textContent]")
        await pg.evaluate("document.getElementById('chatSheet').classList.add('hidden');document.getElementById('clubSheet').classList.add('hidden')")
        # driver tab
        await pg.evaluate("__sa.openGarage('driver')"); await pg.wait_for_function("window.__av && __av.pv", timeout=30000); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=S+'ui_after_driver.png')
        R['head_items']=await pg.evaluate("[...document.querySelectorAll('#drvItems [data-ditem]')].map(b=>b.dataset.ditem+':'+b.querySelector('small').textContent)")
        R['errs']=errs
        for k,v in R.items(): print(k, json.dumps(v, ensure_ascii=False))
        await b.close()
asyncio.run(main())
