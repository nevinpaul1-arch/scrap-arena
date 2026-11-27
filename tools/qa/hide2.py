import asyncio, json, time
from playwright.async_api import async_playwright
URL='file:///home/claude/car-smash.html?api=http://127.0.0.1:8787'
S='/home/claude/shots/'
R={}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        ctx=await b.new_context(viewport={'width':844,'height':390}, is_mobile=True, has_touch=True, device_scale_factor=2)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)+' | '+(e.stack or '')[:200]))
        await pg.goto(URL); await pg.wait_for_function("!document.getElementById('go').disabled && window.__sa")
        await pg.evaluate("localStorage.setItem('scrapArenaHideBots','2')")
        await pg.click('#tHide'); await pg.wait_for_timeout(300); await pg.click('#hsGo'); await pg.wait_for_function("__hr.HR.phase==='head'")
        # freeze the rules so we can stage scenes: hunt phase, clock parked
        ev = pg.evaluate
        await ev("__hr.HR.phase='hunt'; __hr.HR.clock=0; window.H=__hr.cars.find(c=>c.hr==='hider'); window.S1=__hr.cars.filter(c=>c.hr==='seeker')[0]; window.S2=__hr.cars.filter(c=>c.hr==='seeker')[1]; S1.testGoal=-1; S2.testGoal=-1;")
        # park bots out of the way (testGoal -1 makes them idle: no path)
        await ev("__hr.setPos(S2, 200, 2100, 0)")
        # ---- A: cover visibility ----
        await ev("__hr.setPos(H, 2597, 420, -1.57); __hr.setPos(S1, 2597, 640, -1.57)")
        R['garage_from_apron'] = await ev("__hr.fdSees(S1,H)")
        await ev("__hr.setPos(S1, 2597, 520, -1.57)")
        R['garage_inside_both'] = await ev("__hr.fdSees(S1,H)")
        await ev("__hr.setPos(S1, 2400, 640, 0)")
        R['garage_from_side'] = await ev("__hr.fdSees(S1,H)")
        await ev("__hr.setPos(H, 1650, 1100, 1.57); __hr.setPos(S1, 1650, 880, 1.57)")
        R['tunnel_from_road'] = await ev("__hr.fdSees(S1,H)")
        await ev("__hr.setPos(S1, 1650, 1100, 0, 'u')")
        R['tunnel_from_deck_above'] = await ev("__hr.fdSees(S1,H)")
        R['deck_from_tunnel'] = await ev("__hr.fdSees(H,S1)")
        await ev("__hr.setPos(H, 450, 1030, 0); __hr.setPos(S1, 450, 1250, 0)")   # containers between
        R['behind_containers'] = await ev("__hr.fdSees(S1,H)")
        await ev("__hr.setPos(H, 450, 945, 0); __hr.setPos(S1, 900, 945, 0)")     # same lane
        R['same_lane'] = await ev("__hr.fdSees(S1,H)")
        await ev("__hr.setPos(H, 2600, 1100, 0); __hr.setPos(S1, 2200, 1100, 0)") # parking lower level, seeker on V2 road
        R['parklow_from_road'] = await ev("__hr.fdSees(S1,H)")
        await ev("__hr.setPos(H, 2675, 1780, 1.57); __hr.setPos(S1, 2675, 1600, 1.57)") # wash bay lane, seeker at the entrance
        R['wash_from_entry'] = await ev("__hr.fdSees(S1,H)")
        # ---- B: bridge layers: overlap above/below = no tag, no push ----
        await ev("__hr.setPos(H, 1650, 1100, 1.57); __hr.setPos(S1, 1650, 1100, 0, 'u'); S1.lay='u';")
        await pg.wait_for_timeout(600)
        R['over_under'] = await ev("[__hr.HR.phase, Math.round(H.x), Math.round(H.y), H.lay, S1.lay, Math.round(S1.x), Math.round(S1.y)]")
        # same surface on the deck -> tag
        await ev("__hr.HR.phase='hunt'; __hr.setPos(H, 1600, 1100, 0, 'u'); __hr.setPos(S1, 1652, 1100, 0, 'u'); S1.vx=40;")
        await pg.wait_for_timeout(300)
        R['deck_tag'] = await ev("[__hr.HR.phase, __hr.HR.by===S1.pid]")
        # ramp foot meets road -> tag
        await ev("__hr.HR.phase='hunt'; __hr.HR.res={}; __hr.HR.tags={}; __hr.setPos(H, 1195, 1100, 0); __hr.setPos(S1, 1150, 1100, 0); S1.vx=60;")
        await pg.wait_for_timeout(300)
        R['ramp_foot_tag'] = await ev("[__hr.HR.phase, H.lay, __hr.HR.by===S1.pid]")
        # light touch: hider reversing into a parked seeker
        await ev("__hr.HR.phase='hunt'; __hr.HR.res={}; __hr.HR.tags={}; __hr.setPos(H, 600, 715, 0); __hr.setPos(S1, 545, 715, 0); H.vx=-25;")
        await pg.wait_for_timeout(400)
        R['reverse_tap_tag'] = await ev("[__hr.HR.phase, __hr.HR.by===S1.pid]")
        # seeker touching seeker: no tag
        await ev("__hr.HR.phase='hunt'; __hr.HR.res={}; __hr.HR.tags={}; __hr.setPos(H, 200, 200, 0); __hr.setPos(S1, 900, 715, 0); __hr.setPos(S2, 950, 715, 0); S2.vx=-60;")
        await pg.wait_for_timeout(400)
        R['seeker_seeker'] = await ev("__hr.HR.phase")
        # ---- C: drive up and over the bridge (player keyboard), log the surface ----
        await ev("__hr.HR.phase='hunt'; __hr.setPos(S1, 300, 2100, 0); __hr.setPos(S2, 200, 2100, 0); __hr.setPos(H, 1080, 1100, 0); H.testGoal=null;")
        await pg.keyboard.down('ArrowUp'); seq=[]
        for i in range(30):
            await pg.wait_for_timeout(150); seq.append(await ev("[Math.round(H.x), H.lay]"))
        await pg.keyboard.up('ArrowUp')
        lays=[]; [lays.append(l) for x,l in seq if not lays or lays[-1]!=l]
        R['bridge_drive_layers']=lays; R['bridge_drive_x']=[seq[0][0], seq[-1][0]]
        await pg.screenshot(path=S+'hr_bridge_end.png')
        # parking deck: drive north up the ramp
        await ev("__hr.setPos(H, 3035, 1470, -1.5708)")
        await pg.keyboard.down('ArrowUp'); seq=[]
        for i in range(22):
            await pg.wait_for_timeout(150); seq.append(await ev("[Math.round(H.y), H.lay]"))
        await pg.keyboard.up('ArrowUp'); await pg.wait_for_timeout(300)
        lays=[]; [lays.append(l) for y,l in seq if not lays or lays[-1]!=l]
        R['park_ramp_layers']=lays; R['park_ramp_y']=[seq[0][0], seq[-1][0]]
        await pg.screenshot(path=S+'hr_park_top.png')
        # drive-through garages: south -> north out the rear, all three
        for gx in (2397, 2597, 2797):
            await ev(f"__hr.setPos(H, {gx}, 700, -1.5708)")
            await pg.keyboard.down('ArrowUp'); await pg.wait_for_timeout(1700); await pg.keyboard.up('ArrowUp')
            R['garage_%d_y'%gx]=await ev("Math.round(H.y)")
        await ev("__hr.setPos(H, 2997, 700, -1.5708)")
        await pg.keyboard.down('ArrowUp'); await pg.wait_for_timeout(1700); await pg.keyboard.up('ArrowUp')
        R['garage_single_door_y']=await ev("Math.round(H.y)")
        for k,v in R.items(): print(k, json.dumps(v))
        R.clear()
        # ---- F: travel times with a bot on the standard tune ----
        async def travel(c, x0, y0, a0, x1, y1, lim=80):
            await ev(f"__hr.setPos({c}, {x0}, {y0}, {a0}); {c}.hb=null; {c}.testDone=false; {c}.testGoal=__hr.near({x1},{y1});")
            t0=time.time(); sim0=await ev("performance.now()")
            try: await pg.wait_for_function(f"{c}.testDone===true", timeout=lim*1000, polling=200)
            except Exception: return ['STUCK', await ev(f"[Math.round({c}.x),Math.round({c}.y),{c}.lay,{c}.hb&&{c}.hb.pi,{c}.hb&&{c}.hb.path&&{c}.hb.path.length, __hr.HR.phase]")]
            return round((await ev("performance.now()") - sim0)/1000,1)
        await ev("__hr.setPos(H, 1650, 1100, 1.57); __hr.setPos(S2, 3200, 2150, 0); H.testGoal=null;")
        R['t_corner_to_corner_perimeter'] = await travel('S1', 85, 85, 0, 3215, 2115)
        await ev("__hr.setPos(S1, 3215, 2115, 3.14)")
        R['t_west_to_east_middle'] = await travel('S1', 85, 1100, 0, 3215, 1100)
        loop=[]
        for (a,bx,by) in [((85,85,0),3215,85),((3215,85,1.57),3215,2115),((3215,2115,3.14),85,2115),((85,2115,-1.57),85,85)]:
            loop.append(await travel('S1', a[0], a[1], a[2], bx, by))
        R['t_outer_loop_sides']=loop; R['t_outer_loop']=round(sum(loop),1)
        # ---- E: clue timing + clue stays put ----
        await ev("__hr.HR.phase='hunt'; __hr.HR.clock=24.95; __hr.HR.si=0; __hr.HR.clue=null; __hr.setPos(H, 450, 300, 0); __hr.setPos(S1, 300, 2100, 0); S1.testGoal=-1; S2.testGoal=-1;")
        await pg.wait_for_timeout(300)
        R['clue1'] = await ev("__hr.HR.clue && [__hr.HR.clue.k, __hr.HR.clue.name, +__hr.HR.clue.at.toFixed(1)]")
        await ev("__hr.setPos(H, 2600, 1800, 0)"); await pg.wait_for_timeout(300)
        R['clue1_after_move'] = await ev("[__hr.HR.clue.name]")
        await ev("__hr.HR.clock=64.95"); await pg.wait_for_timeout(300)
        R['clues_fired'] = await ev("[__hr.HR.si, __hr.HR.clue.k, __hr.HR.clue.name, __hr.HR.clue.r]")
        await pg.screenshot(path=S+'hr_clue.png')
        # ---- G: escape at 90 s ----
        await ev("__hr.HR.clock=89.9"); await pg.wait_for_timeout(500)
        R['escape'] = await ev("[__hr.HR.phase, JSON.stringify(__hr.HR.res)]")
        await pg.wait_for_timeout(5500)
        R['after'] = await ev("[__hr.state, document.querySelector('#card h1').innerText, document.getElementById('final').innerText.slice(0,200)]")
        await pg.screenshot(path=S+'hr_result.png')
        R['errs']=errs[:5]
        for k,v in R.items(): print(k, json.dumps(v))
        await b.close()
asyncio.run(main())
