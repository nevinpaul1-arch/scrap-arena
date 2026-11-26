import asyncio, json, sys
from playwright.async_api import async_playwright
sys.path.insert(0,'/home/claude/test'); from audit_lib import CHECK, VIEWPORTS
URL=sys.argv[1] if len(sys.argv)>1 and sys.argv[1].startswith('file') else 'file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
ONLY=[a for a in sys.argv[1:] if not a.startswith('file')]
OUT='/home/claude/audit'
VET="localStorage.setItem('scrapArenaMaxWave','12');localStorage.setItem('scrapArenaName','Nevin');localStorage.setItem('scrapArenaGarage',JSON.stringify({gp:740,owned:['spikes','plow'],equip:'spikes',ach:{welcome:1,w5:1,w10:1}}))"
async def ready(pg):
    await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa"); await pg.wait_for_timeout(700)
async def home(pg):
    await pg.goto(URL); await ready(pg)
async def tap(pg, sel):
    el=pg.locator(sel).first
    try: await el.click(timeout=6000)
    except Exception as e: return 'FAIL '+sel+' '+str(e).split('\n')[0][:80]
    await pg.wait_for_timeout(450); return None
async def die(pg):
    await pg.evaluate("(()=>{const p=__sa.player,e=__sa.cars.find(c=>!c.isPlayer)||p; p.inv=0; for(let i=0;i<14&&!p.dead;i++){p.inv=0;p.armor=0;__sa.perkHit(p,['left','right','front','rear'][i%4],e)}})()"); await pg.wait_for_timeout(4200)
SCREENS=[]
def screen(name, root='body'):
    def d(f): SCREENS.append((name, root, f)); return f
    return d
@screen('hub', '#overlay')
async def s_hub(pg): await home(pg)
@screen('hub_fresh', '#overlay')
async def s_hubf(pg):
    await home(pg); await pg.evaluate("localStorage.clear()"); await pg.reload(); await ready(pg)
@screen('garage_cars', '#garageSheet')
async def s_g1(pg): await home(pg); return await tap(pg,'#hubGarage')
@screen('garage_mods', '#garageSheet')
async def s_g2(pg): await home(pg); await tap(pg,'#hubGarage'); return await tap(pg,'#garTabs [data-gt=mods]')
@screen('garage_ach', '#garageSheet')
async def s_g3(pg): await home(pg); await tap(pg,'#hubGarage'); return await tap(pg,'#garTabs [data-gt=ach]')
@screen('club_pick', '#clubSheet')
async def s_c1(pg): await home(pg); await pg.evaluate("__sa.openClub()"); await pg.wait_for_timeout(400)
@screen('club_hq', '#clubSheet')
async def s_c2(pg): await home(pg); await pg.evaluate("__sa.joinClub('bulls')"); await pg.evaluate("__sa.openClub()"); await pg.wait_for_timeout(600)
@screen('ranks', '#boardSheet')
async def s_r(pg): await home(pg); return await tap(pg,'#hubBoard')
@screen('how', '#howSheet')
async def s_how(pg): await home(pg); return await tap(pg,'#hubHow')
@screen('bomb_sheet', '#bombSheet')
async def s_bs(pg): await home(pg); return await tap(pg,'#tBomb')
@screen('online', '#mpPanel')
async def s_on(pg): await home(pg); return await tap(pg,'#tOnline')
@screen('online_vs', '#mpPanel')
async def s_on2(pg): await home(pg); await tap(pg,'#tOnline'); return await tap(pg,'#mpPanel .mpTabs button[data-m=versus]')
@screen('dev', '#devPanel')
async def s_dev(pg): await home(pg); return await tap(pg,'#hubDev')
@screen('online_lobby', '#mpPanel')
async def s_lob(pg): await home(pg); await tap(pg,'#tOnline'); r=await tap(pg,'#mpCreateCoop'); await pg.wait_for_timeout(1800); return r
@screen('gp_from_results', '#garageSheet')
async def s_gpr(pg):
    await home(pg); await tap(pg,'#tDaily'); await tap(pg,'#selGo'); await pg.wait_for_timeout(2600); await die(pg); await pg.wait_for_timeout(1500)
    return await tap(pg,'#gpEarn')
@screen('select', '#select')
async def s_sel(pg): await home(pg); return await tap(pg,'#tWaves')
@screen('daily_select', '#select')
async def s_dsel(pg): await home(pg); return await tap(pg,'#tDaily')
@screen('play', 'body')
async def s_play(pg): await home(pg); await tap(pg,'#tWaves'); r=await tap(pg,'#selGo'); await pg.wait_for_timeout(2600); return r
@screen('pause', '#pauseMenu')
async def s_pause(pg): await home(pg); await tap(pg,'#tWaves'); await tap(pg,'#selGo'); await pg.wait_for_timeout(2600); return await tap(pg,'#pauseBtn')
@screen('waves_over', '#overlay')
async def s_wo(pg): await home(pg); await tap(pg,'#tWaves'); await tap(pg,'#selGo'); await pg.wait_for_timeout(2600); await die(pg); await pg.wait_for_timeout(2800)
@screen('daily_over', '#overlay')
async def s_do(pg): await home(pg); await tap(pg,'#tDaily'); await tap(pg,'#selGo'); await pg.wait_for_timeout(2600); await die(pg); await pg.wait_for_timeout(2800)
@screen('bomb_play', 'body')
async def s_bp(pg): await home(pg); await tap(pg,'#tBomb'); r=await tap(pg,'#bsGo'); await pg.wait_for_timeout(2500); return r
@screen('bomb_over', '#overlay')
async def s_bo(pg):
    await home(pg); await tap(pg,'#tBomb'); await tap(pg,'#bsGo'); await pg.wait_for_timeout(1500)
    await pg.evaluate("(()=>{const p=__sa.player; p.kos=2; p.plants=1; __sa.VS.score=[2,1]; __sa.VS.matchT=0.3})()"); await pg.wait_for_timeout(6500)
@screen('between_waves', '#select')
async def s_bw(pg):
    await home(pg); await tap(pg,'#tWaves'); await tap(pg,'#selGo'); await pg.wait_for_timeout(2600)
    for i in range(2):
        await pg.evaluate("__sa.player.inv=99"); await pg.evaluate("(()=>{for(const c of __sa.cars) if(!c.isPlayer&&!c.dead){c.dead=true;c.deadT=0}})()"); await pg.wait_for_timeout(5200)
    await pg.wait_for_timeout(1500)
async def main():
    vps=[v for v in VIEWPORTS if not ONLY or v in ONLY] ; scr=[s for s in SCREENS if not ONLY or s[0] in ONLY]
    if not [v for v in VIEWPORTS if v in ONLY]: vps=list(VIEWPORTS)
    if not [s for s in SCREENS if s[0] in ONLY]: scr=SCREENS
    rep={}
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for vn in vps:
            for name,root,fn in scr:
                if vn in ('phoneP','tabP') and name in ('play','pause','bomb_play'): continue
                ctx=await b.new_context(**VIEWPORTS[vn]); await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){"+VET+";sessionStorage.setItem('seeded','1')}")
                pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)[:160]))
                try:
                    r=await asyncio.wait_for(fn(pg), 60)
                    issues=await pg.evaluate(CHECK, root)
                    if r: issues.insert(0,['NAV',r])
                except Exception as e: issues=[['SCRIPT', str(e).split('\n')[0][:160]]]
                await pg.screenshot(path=f'{OUT}/{vn}_{name}.png')
                rep[f'{vn}/{name}']=issues+([['JS-ERROR']+errs[:3]] if errs else [])
                await ctx.close()
        await b.close()
    json.dump(rep, open(f'{OUT}/report_'+'_'.join(vps)+'.json','w'), indent=1)
    for k,v in rep.items():
        if v: print(k, len(v)); [print('   ', json.dumps(x)[:200]) for x in v[:14]]
asyncio.run(main())
