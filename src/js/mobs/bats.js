// ================= Летучие мыши и удочки =================
const MOB_HP={wolf:4,bat:2,spider:5,golem:60};
const mobHp=k=>CMOBS[k]?CMOBS[k].hp:CFG.mobHp&&CFG.mobHp[k]!=null?CFG.mobHp[k]:(MOB_HP[k]??3);
const isMob=a=>a&&(a.kind==="wolf"||a.kind==="bat"||a.kind==="spider"||a.kind==="golem"||!!CMOBS[a.kind]);
// когда и сколько мобов: d — днём (нейтральные), n — ночью
const MOB_TIME={wolf:{d:1,n:1,dn:2,nn:2},bat:{d:0,n:1,dn:2,nn:2},spider:{d:0,n:0,dn:2,nn:4}};
const mobT=(k,f)=>CMOBS[k]?CMOBS[k][f]|0:CFG.mobTime&&CFG.mobTime[k]&&CFG.mobTime[k][f]!=null?CFG.mobTime[k][f]:(MOB_TIME[k]?MOB_TIME[k][f]:0);
const mobOn=(k,per)=>!!mobT(k,per)&&mobCount(k,per)>0;
const mobCount=(k,per)=>mobT(k,per+"n")|0;
function mobLeave(a){ a.leaving=true; if(CMOBS[a.kind]){ a.path=[]; return; } if(a.kind==="wolf"){ setPath(a,randomCell(c=>freeCell(c)&&edgeCell(c))); a.speed=2.6; } else a.path=[]; }
function spawnMob(kind,per,farFromAll,existing){
  if(CMOBS[kind]){ const z=zonePick(kind,c=>freeCell(c)&&farFromAll(c,6)), c=z!==undefined?z:randomCell(c=>freeCell(c)&&(CAVE||GRASSY.includes(c.t))&&farFromAll(c,7));
    if(!c) return; spawnAnimal(kind,c); const m=animals[animals.length-1]; m.home={x:c.x,y:c.y}; m.attackT=1.2; return; }
  if(kind==="bat"){ const c=batSpawnCell(farFromAll); if(!c) return; spawnAnimal("bat",c); const b=animals[animals.length-1]; b.fly=2.2; b.home={x:c.x,y:c.y}; b.phase=Math.random(); b.attackT=1.5; return; }
  let c;
  if(per==="d"){ const z=zonePick("wolf",c=>freeCell(c)&&farFromAll(c,7)&&nearestFire(c.x,c.y)[1]>5); c=z!==undefined?z:randomCell(c=>freeCell(c)&&GRASSY.includes(c.t)&&farFromAll(c,7)&&nearestFire(c.x,c.y)[1]>5); }
  else { const z=zonePick("wolf",c=>freeCell(c)&&farFromAll(c,7)&&nearestFire(c.x,c.y)[1]>6); c=z!==undefined?z:randomCell(c=>freeCell(c)&&edgeCell(c)&&farFromAll(c,8)&&nearestFire(c.x,c.y)[1]>6); }
  if(!c) return; spawnAnimal(kind,c); const w=animals[animals.length-1];
  if(per==="n"){ w.howlT=1.6; if(!existing) say("wolf_near","night_sub"); }
}
// ---- летучая мышь: ночью кружит у деревьев, пикирует на игрока и кусает ----
function batSpawnCell(farFromAll){
  const z=zonePick("bat",c=>!c.water&&farFromAll(c,6)); if(z!==undefined) return z;
  return randomCell(c=>!c.water&&farFromAll(c,6)&&TREES.some(t=>Math.hypot(t.c.x-c.x,t.c.y-c.y)<2.5));
}
function updateBat(a,dt,tp,dh){
  a.flap=(a.flap||0)+dt;
  const home=a.home||(a.home={x:a.x,y:a.y});
  let tx,ty,sp;
  if(a.leaving){ a.fly=(a.fly||1.6)+dt*1.5; return; }
  if(a.retreatT>0){ a.retreatT-=dt; tx=a.rx; ty=a.ry; sp=2.8; }
  else if(tp&&(a.aggro||(dh<4.5&&isNight()))){ tx=tp.x+Math.sin(a.flap*3)*0.3; ty=tp.y+Math.cos(a.flap*2.6)*0.3; sp=2.6;
    if(dh<0.8&&!tp.busy){ a.attackT-=dt; if(a.attackT<=0){ a.attackT=2.2; a.lunge=0.25; a.lungeTo=[tp.x,tp.y]; biteTarget(tp,a);
      const ang=Math.random()*Math.PI*2; a.rx=tp.x+Math.cos(ang)*2.5; a.ry=tp.y+Math.sin(ang)*2.5; a.retreatT=0.9; } } }
  else { if(!a.wp||a.think<=0||Math.hypot(a.wp[0]-a.x,a.wp[1]-a.y)<0.3){ a.think=2+Math.random()*2; const an=Math.random()*Math.PI*2, r=Math.random()*3; a.wp=[home.x+Math.cos(an)*r,home.y+Math.sin(an)*r]; }
    [tx,ty]=a.wp; sp=1.3; }
  const dx=tx-a.x, dy=ty-a.y, d=Math.hypot(dx,dy);
  if(d>0.05){ const st=Math.min(d,sp*dt*spdMul(a.kind)); a.x+=dx/d*st+Math.sin(a.flap*7)*0.004; a.y+=dy/d*st; const u=dx*ca-dy*sa, v=dx*sa+dy*ca; a.facing=((u+v)>=0?"s":"n")+((u-v)>=0?"e":"w"); }
  a.x=Math.max(0,Math.min(W-1,a.x)); a.y=Math.max(0,Math.min(D-1,a.y));
  const c=cellAt(Math.round(a.x),Math.round(a.y)); if(c) a.z+=(walkZ(c)-a.z)*Math.min(1,dt*4);
  const target=(tp&&dh<1.6&&!(a.retreatT>0))?0.8:1.5+Math.sin(a.flap*1.7)*0.25; a.fly=(a.fly??target)+(target-(a.fly??target))*Math.min(1,dt*3);
  a.moving=true;
}
function drawBatP(g,frame){
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)}, O="#1b1528", up=[-5,-2,2,-1][frame%4];
  R(-3,-5,7,7,O); R(-2,-4,5,5,"#4a3a5c"); R(-2,-7,2,3,O); R(2,-7,2,3,O); R(-1,-3,1,1,"#ff4040"); R(1,-3,1,1,"#ff4040");
  for(const s of [-1,1]){ R(s<0?-11:4,-3+up,8,3,O); R(s<0?-10:5,-2+up,6,1,"#5c4870"); }
}
function drawBat(a){
  if(a.alpha<=0.01) return;
  worldTransform(); ctx.imageSmoothingEnabled=false;
  let [fx,fy]=proj(a.x-MX,a.y-MY,a.z);
  if(a.lunge>0&&a.lungeTo){ const [hx,hy]=proj(a.lungeTo[0]-MX,a.lungeTo[1]-MY,a.z), dx=hx-fx, dy=hy-fy, dd=Math.hypot(dx,dy)||1, k=Math.sin(a.lunge/0.25*Math.PI)*6; fx+=dx/dd*k; fy+=dy/dd*k; }
  if(a.dying>0) a.fly=Math.max(0,(a.fly||0)-0.08);
  const h=Math.round((a.fly??1.5)*LH*1.6);
  ctx.globalAlpha=a.alpha*0.8; ctx.fillStyle="rgba(20,10,40,.25)"; ctx.beginPath(); ctx.ellipse(fx,fy,6,2.5,0,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=a.alpha;
  const frame=Math.floor((T+(a.phase||0))*12)%4, mirror=a.facing[1]==="w";
  let sp=a.dying>0?img.bat_dead:a.hurtT>0?img.bat_hurt:img["bat_se_"+frame]; if(!sp&&!(a.dying>0)) sp=null;
  const cx=Math.round(fx), cy=Math.round(fy-h);
  ctx.save(); ctx.translate(cx,cy); if(mirror) ctx.scale(-1,1);
  if(a.hurtT>0&&!img.bat_hurt) ctx.filter="brightness(2.4)";
  if(sp) ctx.drawImage(sp,-Math.round(sp.width/2),-Math.round(sp.height/2));
  else { if(a.dying>0) ctx.scale(1,-0.7); drawBatP(ctx,frame); }
  ctx.filter="none"; ctx.restore(); ctx.globalAlpha=1;
  a.drawn={x:cx,y:cy+12,sp:null,name:null,mirror};
  drawMobHP(a,fx,fy-h+14);
}
