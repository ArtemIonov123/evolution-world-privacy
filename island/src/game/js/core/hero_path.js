// ---------- Герой ----------
const hero={x:MAP.start[0], y:MAP.start[1], z:0, path:[], facing:"se", phase:0, moving:false};
hero.z=walkZ(cellAt(hero.x,hero.y));
let marker=null; // {x,y,t,ok}
const HERO_SPEED=2.8; // клеток в секунду

// поиск пути: A* по 8 направлениям, подъём/спуск не больше 1 уровня
function canStep(a,b){ return b && !b.blocked && Math.abs(walkZ(a)-walkZ(b))<=1; }
function findPath(sx,sy,tx,ty){
  const start=cellAt(sx,sy), goal=cellAt(tx,ty); if(!start||!goal) return null;
  const key=c=>c.y*W+c.x, open=[[0,start]], g=new Map([[key(start),0]]), prev=new Map();
  const h=c=>{const dx=Math.abs(c.x-goal.x), dy=Math.abs(c.y-goal.y); return Math.max(dx,dy)+0.414*Math.min(dx,dy)};
  while(open.length){
    let bi=0; for(let i=1;i<open.length;i++) if(open[i][0]<open[bi][0]) bi=i;
    const [,cur]=open.splice(bi,1)[0];
    if(cur===goal) break;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy) continue;
      const nb=cellAt(cur.x+dx,cur.y+dy); if(!canStep(cur,nb)) continue;
      if(dx&&dy){ // по диагонали — только если оба боковых прохода свободны
        const s1=cellAt(cur.x+dx,cur.y), s2=cellAt(cur.x,cur.y+dy);
        if(!canStep(cur,s1)||!canStep(cur,s2)||!canStep(s1,nb)||!canStep(s2,nb)) continue;
      }
      const cost=g.get(key(cur))+(dx&&dy?1.414:1)+Math.abs(walkZ(nb)-walkZ(cur))*0.3;
      if(cost<(g.get(key(nb))??1e9)){g.set(key(nb),cost);prev.set(key(nb),cur);open.push([cost+h(nb),nb]);}
    }
  }
  if(!prev.has(key(goal)) && start!==goal) return null;
  const path=[goal]; while(path[0]!==start) path.unshift(prev.get(key(path[0])));
  return smooth(path.map(c=>[c.x,c.y]));
}
// прямая видимость между точками: клетки проходимы и без обрывов
function clearLine(a,b){
  const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*6);
  let prevC=cellAt(Math.round(a[0]),Math.round(a[1]));
  for(let i=1;i<=n;i++){
    const t=i/n, px=a[0]+(b[0]-a[0])*t, py=a[1]+(b[1]-a[1])*t;
    // запас 0.3 клетки по бокам, чтобы не цеплять деревья
    for(const [ox,oy] of [[0,0],[0.3,0.3],[-0.3,-0.3],[0.3,-0.3],[-0.3,0.3]]){
      const c=cellAt(Math.round(px+ox),Math.round(py+oy));
      if(!c||c.blocked) return false;
    }
    const c=cellAt(Math.round(px),Math.round(py));
    if(c!==prevC){ if(!canStep(prevC,c)) return false; prevC=c; }
  }
  return true;
}
// сглаживание: идём по прямой, где можно (как в Lineage 2)
function smooth(pts){
  const out=[pts[0]]; let i=0;
  while(i<pts.length-1){
    let j=pts.length-1;
    while(j>i+1 && !clearLine(pts[i],pts[j])) j--;
    out.push(pts[j]); i=j;
  }
  return out.slice(1);
}
function goTo(c){
  if(!c) return;
  stopFishing(); stopChopping(); closeDialog(); hero.pendingTalk=false; hero.pendingAction=null; building=null; hero.target=null;
  if(fainting) return;
  if(typeof c==="object"&&isMob(c)){ if(placing) return; attackWolf(c); return; }
  if(placing){ if(c&&typeof c==="object") placeFireAt(c); return; }
  if(typeof c==="object"&&c.fire){ goAdjacent(c,()=>openFireMenu(c.fire),"go_fire"); return; }
  if(c==="portal"||c.portal){ goAdjacent(PORTAL,usePortal,CAVE?"go_exit":"go_cave"); return; }
  if(c==="merchant"||c.merchHere||c.stall){ goTrade(); return; }
  if(c==="npc"||c==="hut"||c.hutPart||c.npcHere){ goTalk(); return; }
  if(c.water){ goFish(c); return; }
  if(treeName(c)){ goChop(c); return; }
  let target=c;
  if(c.blocked){ // кликнули по дереву — идём к ближайшей свободной клетке рядом
    let best=null,bd=1e9;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const n=cellAt(c.x+dx,c.y+dy); if(!n||n.blocked) continue;
      const d=Math.hypot(n.x-hero.x,n.y-hero.y); if(d<bd){bd=d;best=n}
    }
    if(!best){marker={x:c.x,y:c.y,t:0,ok:false};return}
    target=best;
  }
  const from=[Math.round(hero.x),Math.round(hero.y)];
  const p=findPath(from[0],from[1],target.x,target.y);
  if(!p){marker={x:c.x,y:c.y,t:0,ok:false};say("blocked");return}
  // первая точка — текущая позиция героя (он может стоять между клетками)
  hero.path=p.length?p:[[target.x,target.y]];
  marker={x:target.x,y:target.y,t:0,ok:true};
  follow=true; document.getElementById("follow").setAttribute("aria-pressed","true");
  say("going","going_sub",{x:target.x,y:target.y,h:target.L,kind:"#"+(target.st?"k_st":"k_"+target.t)});
}
function updateHero(dt){
  hero.moving=false;
  if(hero.path.length){
    const [tx,ty]=hero.path[0], dx=tx-hero.x, dy=ty-hero.y, dist=Math.hypot(dx,dy);
    if(hero.dash) return;
    const step=HERO_SPEED*(form==="wolf"?1.8:1)*dt;
    if(dist<=step){hero.x=tx;hero.y=ty;hero.path.shift(); if(!hero.path.length){marker=null;if(!hero.target) say("arrived","arrived_sub",{x:tx,y:ty});
      if(hero.pendingFish){const w=hero.pendingFish.water; hero.pendingFish=null; startFishing(w);}
      if(hero.pendingChop){const t=hero.pendingChop.tree; hero.pendingChop=null; startChopping(t);}
      if(hero.pendingTalk){hero.pendingTalk=false; openDialog();}
      if(hero.pendingAction){const fn=hero.pendingAction; hero.pendingAction=null; fn();}}}
    else{hero.x+=dx/dist*step;hero.y+=dy/dist*step}
    if(dist>0.001){
      hero.moving=true;
      { const hc=cellAt(Math.round(hero.x),Math.round(hero.y)); if(hc&&hc.shallow&&Math.random()<dt*5) ripples.push({x:hero.x,y:hero.y,z:walkZ(hc),t:0,small:true}); }
      // направление на экране с учётом поворота
      const u=dx*ca-dy*sa, v=dx*sa+dy*ca, sx=u-v, sy=u+v;
      hero.facing=(sy>=0?"s":"n")+(sx>=0?"e":"w");
    }
  }
  hero.phase = hero.moving ? hero.phase+dt*HERO_SPEED*Math.PI*1.6 : 0;
  const c=cellAt(Math.round(hero.x),Math.round(hero.y));
  if(c) hero.z += (walkZ(c)-hero.z)*Math.min(1,dt*14);  // мягкий шаг на ступеньку
}

