import json
A=[
"     ############     ",
"   ###,,,,,,,,,,###   ",
"  ##,,,,,,,,,,,,,,##  ",
"  #,,,,,,,,B,,,,,,,#  ",
"  #,,,,,,,,,,,,,,,,#  ",
"  ##,,,,,,,,,,,,,,##  ",
"   ####...,,...####   ",
"     ##........##     ",
"   ###....~~~...###   ",
"  ##..o...~~~v...o##  ",
" ##..oo...vvv......## ",
" #.......#####.......#",
" #..m...##   ##......#",
" ##.....#     #..oo..#",
"  #....##     ##....##",
"  #.....#     #....## ",
"  ##.....#####.....#  ",
"   ##..............#  ",
"    ####...EX..#####  ",
"       #########      ",
]
W=max(len(r) for r in A); A=[r.ljust(W) for r in A]; D=len(A)
lv=[];tp=[];start=exit=boss=None
spider=[];bat=[];props=[]
for y,r in enumerate(A):
  l="";t=""
  for x,ch in enumerate(r):
    if ch==" ": l+="0";t+="."
    elif ch=="#": l+=("4" if y<=6 else "3");t+="x"
    elif ch==",": l+="2";t+="K" if (x*7+y*3)%11==0 else "k"
    elif ch=="B": l+="2";t+="l";boss=[x,y]
    elif ch=="~": l+="1";t+="w"
    elif ch=="v": l+="1";t+="v"
    elif ch=="o": l+="1";t+="q"
    elif ch=="m": l+="1";t+="j"
    else:
      l+="1";t+=("K" if (x*5+y*7)%13==0 else "j" if (A[y][x-1:x+2].count("~")+A[y][x-1:x+2].count("v"))>0 else "k")
      if ch=="E": start=[x,y]
      if ch=="X": exit=[x,y]
  lv.append(l);tp.append(t)
# зоны: пауки в боковых туннелях, мыши у озера
for y in range(D):
  for x in range(W):
    ch=A[y][x]
    if ch in ".om" and 11<=y<=16 and (x<=7 or x>=14): spider.append([x,y])
    if ch in ".ov" and 8<=y<=10: bat.append([x,y])
# кристаллы и декор
props=[[4,9,"prop_crystal"],[17,10,"prop_crystal"],[4,3,"prop_crystal"],[17,4,"prop_crystal"],[3,13,"prop_mushrooms"],[18,15,"prop_mushrooms"],[6,16,"rock_small"],[15,7,"rock_big"],[12,14+0,"prop_crystal"]]
props=[p for p in props if A[p[1]][p[0]] in ".,om"]
m={"levels":lv,"tops":tp,"stairs":{},"props":props,"start":start,"exit":exit,"boss":boss,"zones":{"spider":spider,"bat":bat,"hare":[],"wolf":[]},
   "hut":None,"npc":None,"merchant":None,"stall":None,"pier":None}
# связность
import collections
L=lambda x,y:int(lv[y][x]) if 0<=y<D and 0<=x<W else 0
def wz(x,y):
  t=tp[y][x]; return L(x,y)-0.3 if t in "wv" else L(x,y)
blocked=lambda x,y: tp[y][x]=="w" or [x,y]==exit or any(p[0]==x and p[1]==y and p[2] in("rock_big",) for p in props)
q=collections.deque([tuple(start)]);seen={tuple(start)}
while q:
  x,y=q.popleft()
  for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
    nx,ny=x+dx,y+dy
    if L(nx,ny)>0 and (nx,ny) not in seen and not blocked(nx,ny) and abs(wz(nx,ny)-wz(x,y))<=1: seen.add((nx,ny));q.append((nx,ny))
print("size",W,D,"reach boss",tuple(boss) in seen,"reach count",len(seen),"spider",len(spider),"bat",len(bat),"start",start,"exit",exit)
open('cave_map.json','w').write(json.dumps(m,separators=(',',':')))
