import asyncio, sys, json
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
CENSUS="""(()=>{const out={};const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
while(n=w.nextNode()){const t=n.textContent.trim();if(!t)continue;const e=n.parentElement;const r=e.getBoundingClientRect();if(!r.width||!r.height)continue;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||+cs.opacity===0)continue;
let vis=true;for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'){vis=false;break}}if(!vis)continue;
if(r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)continue;
const fs=Math.round(parseFloat(cs.fontSize)*10)/10;const k=fs;(out[k]=out[k]||[]).push((e.id?'#'+e.id:e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.split(' ')[0]:''))+': '+t.slice(0,28));}
return out})()"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        ctx=await b.new_context(viewport={'width':844,'height':390}, is_mobile=True, has_touch=True, device_scale_factor=2); pg=await ctx.new_page()
        await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa"); await pg.wait_for_timeout(1200)
        screens=[('hub',None)]+[(s,js) for s,js in json.loads(sys.argv[1])]
        for name,js in screens:
            if js:
                await pg.evaluate(js); await pg.wait_for_timeout(700)
            c=await pg.evaluate(CENSUS)
            await pg.screenshot(path=f'/home/claude/shots/fc_{name}.png')
            print('==',name)
            for k in sorted(c,key=float):
                print('  %5s px (%d): %s'%(k,len(c[k]),' | '.join(c[k][:5])))
        await b.close()
asyncio.run(main())
