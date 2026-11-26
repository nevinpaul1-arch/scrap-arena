import base64, json
s=open('/home/claude/build/game_src.html').read()
ar=json.load(open('/home/claude/r3d/arenas.json')); sp=json.load(open('/home/claude/r3d/sprites_k/meta.json'))
b64=lambda p,m: f'data:{m};base64,'+base64.b64encode(open(p,'rb').read()).decode()
assets={'bg':{a:b64(f'/home/claude/r3d/assets_k/bg_{a}.jpg','image/jpeg') for a in ['town','junk','docks','depot']},
        'cars':{c:b64(f'/home/claude/r3d/sprites_k/{c}.png','image/png') for c in sp['cars']},
        'obj':{a:{k:b64(f'/home/claude/r3d/assets_k/obj_{a}_{k}.webp','image/webp') for k in json.load(open('/home/claude/r3d/objs.json'))[a]} for a in ['town','junk','docks']},
        'objm':json.load(open('/home/claude/r3d/objs.json')),
        'tile':{c:b64(f'/home/claude/r3d/assets_k/tile_{c}.webp','image/webp') for c in ['cruiser','dart','bruiser','drifter','hauler','rocket','fortress','phantom']},
        'boss':{k:b64(f'/home/claude/r3d/assets_k/boss_{k}.webp','image/webp') for k in ['crane','dozer','twin']},
        'show':{c:b64(f'/home/claude/r3d/assets_k/show_{c}.webp','image/webp') for c in ['cruiser','dart','bruiser','drifter','hauler','rocket','fortress','phantom']},
        'icon':{'club':{c:{'':b64(f'/home/claude/r3d/icons/clubs_{c}.webp','image/webp'),'C':b64(f'/home/claude/r3d/icons/clubs_variants_{c}-champion.webp','image/webp'),'R':b64(f'/home/claude/r3d/icons/clubs_variants_{c}-chrome.webp','image/webp'),'CR':b64(f'/home/claude/r3d/icons/clubs_variants_{c}-champion-chrome.webp','image/webp')} for c in ['reapers','vipers','bulls','owls','kings','wolves']},
                'mod':{m:b64(f'/home/claude/r3d/icons/garage_{m}.webp','image/webp') for m in ['flipper','plow','spikes','doors','goo','smoke','harpoon','repair']},
                'daily':{m:b64(f'/home/claude/r3d/icons/daily_{m}.webp','image/webp') for m in ['oil','glass','nitro','heavy','barrels','bossrush','nogarage','scrap']}}}
s=s.replace('/*__ARENAS__*/null', json.dumps(ar,separators=(',',':'))).replace('/*__SPRITES__*/null', json.dumps(sp,separators=(',',':'))).replace('/*__ASSETS__*/null', json.dumps(assets,separators=(',',':')))
import sys; open(sys.argv[1] if len(sys.argv)>1 else '/home/claude/car-smash.html','w').write(s)
print(len(s)//1024,'KB')
