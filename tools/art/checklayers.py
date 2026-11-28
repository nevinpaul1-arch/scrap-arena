import sys, os, numpy as np
from PIL import Image
car, d = sys.argv[1], sys.argv[2]
ks=['00_master','01_chassis','02_hood','03_bumper','04_rear','05_doorL','06_doorR','07_paint','08_wreck']
L={}
for k in ks:
    f=os.path.join(d,f'{car}_{k}.png')
    if not os.path.exists(f): print(car,'MISSING',k); sys.exit()
    im=Image.open(f); L[k]=np.array(im.convert('RGB')).astype(int)
    if im.size!=(1024,1536): print(car,k,'SIZE',im.size)
def mask(a,t=60): return np.sqrt(((a-[255,0,255])**2).sum(-1))>t
M=mask(L['00_master']); comp=L['01_chassis'].copy(); pu=np.zeros_like(M); ov=0
for k in ks[2:7]:
    m=mask(L[k]); ov+=(m&pu).sum(); pu|=m; comp[m]=L[k][m]
d24=((np.abs(comp-L['00_master']).max(-1)>24)&M).sum()/M.sum()
out=(pu&~M).sum(); g=(np.abs(L['07_paint']-[0,255,0]).max(-1)<60)
ch=mask(L['01_chassis']); wr=mask(L['08_wreck'])
fr=sum((((np.sqrt(((L[k]-[255,0,255])**2).sum(-1)))>20)&((np.sqrt(((L[k]-[255,0,255])**2).sum(-1)))<120)).sum() for k in ks[:7])
print(f"{car:9s} diff>24 {d24*100:.2f}%  overlap {ov}  outside {out}  green {g.sum()/M.sum()*100:.0f}%  green outside car {(g&~M).sum()}  chassis-outline-vs-master {(ch^M).sum()}  wreck-vs-master {(wr^M).sum()}  fringe {fr}  parts px {[int(mask(L[k]).sum()) for k in ks[2:7]]}")
