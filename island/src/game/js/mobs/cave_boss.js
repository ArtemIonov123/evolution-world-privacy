// ================= Пещера: пауки и босс-голем =================
const KIND_CODE={wolf:"w",bat:"b",hare:"h",spider:"s",golem:"g"}, CODE_KIND={w:"wolf",b:"bat",h:"hare",s:"spider",g:"golem"};
const GOLEM_SLAM_R=2.3, GOLEM_SLAM_T=1.25;
let bossDeadAt=0;
const bossRespawnMs=()=>Math.max(0.5,(CFG.mobHp&&CFG.mobHp.golem_rsp!=null?CFG.mobHp.golem_rsp:5))*60000;
function caveSpawn(farFromAll){
  const live=k=>animals.filter(a=>a.kind===k&&!a.leaving&&!(a.dying>0)).length;
  for(const [k,want] of [["spider",mobCount("spider","n")||0],["bat",Math.max(2,mobCount("bat","n"))]]){
    if(live(k)>=want||Math.random()>0.3) continue;
    const z=zonePick(k,c=>freeCell(c)&&farFromAll(c,5)), c=z!==undefined?z:randomCell(c=>freeCell(c)&&farFromAll(c,6));
    if(!c) continue; spawnAnimal(k,c); const a=animals[animals.length-1]; a.home={x:c.x,y:c.y};
    if(k==="bat"){ a.fly=2.2; a.phase=Math.random(); a.attackT=1.5; } }
  for(const [k,m] of Object.entries(CMOBS)){ if(m.zn!=="cave"||live(k)>=m.cn||Math.random()>0.3) continue; spawnMob(k,"n",farFromAll,0); }
  const b=MAP.boss&&cellAt(MAP.boss[0],MAP.boss[1]);
  if(b&&!animals.some(a=>a.kind==="golem")&&Date.now()-bossDeadAt>bossRespawnMs()&&farFromAll(b,2.5)){
    spawnAnimal("golem",b); const g=animals[animals.length-1]; g.home={x:b.x,y:b.y}; g.slamCd=4; g.attackT=1.2; }
}
function updateSpider(a,dt,tp,dh){
  a.speed=1.1; const slow=tp&&tp.cl==="druid"?0.8:1;
  if(tp&&(dh<5.5||a.aggro)&&dh<9){ a.state="chase"; a.speed=2.3*slow;
    if(dh<0.95){ a.path=[]; a.facing=facingTo(a,tp.x,tp.y); a.lungeTo=[tp.x,tp.y];
      if(!tp.busy){ a.attackT-=dt; if(a.attackT<=0){ a.attackT=1.3; a.lunge=0.25; biteTarget(tp,a,1); } } }
    else if(a.think<=0){ a.think=0.4; setPath(a,cellAt(Math.round(tp.x),Math.round(tp.y))); a.attackT=Math.min(a.attackT,0.6); } }
  else { a.aggro=false; if(a.think<=0&&!a.path.length){ a.state="wander"; a.think=2+Math.random()*3; const h=a.home||{x:a.x,y:a.y}; setPath(a,fleeCell({x:h.x,y:h.y},h.x,h.y,0.5,2.5)); } }
}
// свой моб: агрессивный / злой ночью / мирный (бьёт в ответ)
const MB_SPD=[0,1.6,2.3,3.0,3.6], SPD_MUL=[1,0.7,1,1.3,1.6];
const spdMul=k=>!CMOBS[k]&&CFG.mobSpd&&CFG.mobSpd[k]?SPD_MUL[CFG.mobSpd[k]]||1:1;
function updateCMob(a,dt,tp,dh,night){
  const m=CMOBS[a.kind], run=MB_SPD[m.spd]||2.3, angry=m.ai==="aggr"||(m.ai==="night"&&night);
  a.speed=run*0.45;
  if(a.aggro&&(!tp||dh>m.range+5)){ a.aggroT=(a.aggroT||0)+dt; if(a.aggroT>5){ a.aggro=false; a.aggroT=0; } } else a.aggroT=0;
  if(tp&&dh<12&&(a.aggro||(angry&&dh<m.range))){ a.state="chase"; a.speed=run*(tp.cl==="druid"&&m.b==="spider"?0.8:1);
    if(dh<1.4+(m.sz>140?0.3:0)){ a.path=[]; a.facing=facingTo(a,tp.x,tp.y); a.lungeTo=[tp.x,tp.y];
      if(!tp.busy){ a.attackT-=dt; if(a.attackT<=0){ a.attackT=1.4; a.lunge=0.25; biteTarget(tp,a,m.dmg); } } }
    else if(a.think<=0){ a.think=0.4; setPath(a,cellAt(Math.round(tp.x),Math.round(tp.y))); a.attackT=Math.min(a.attackT,0.6); } }
  else if(m.ai==="passive"&&tp&&dh<2&&a.state!=="shy"&&!a.aggro){ a.state="shy"; setPath(a,fleeCell(a,tp.x,tp.y,2,3.5)); a.speed=run*0.8; }
  else if(a.think<=0&&!a.path.length){ a.state="wander"; a.think=2.5+Math.random()*3; const h=a.home||{x:a.x,y:a.y}; setPath(a,fleeCell({x:h.x,y:h.y},h.x,h.y,0.5,3)); }
}
function summonBats(a,n){
  for(let i=0;i<n;i++){ const ang=Math.random()*Math.PI*2, c=cellAt(Math.round(a.x+Math.cos(ang)*2),Math.round(a.y+Math.sin(ang)*2)); if(!c||c.blocked) continue;
    spawnAnimal("bat",c); const b=animals[animals.length-1]; b.fly=2.4; b.home={x:c.x,y:c.y}; b.aggro=true; b.attackT=1.2; b.alpha=0.6; }
  floats.push({key:"boss_summon",col:"#c8a0ff",t:0});
}
function updateGolem(a,dt,tp,dh,P){
  const max=mobHp("golem"); a.speed=1.0; a.slamCd=(a.slamCd??4)-dt; a.slamFx=Math.max(0,(a.slamFx||0)-dt);
  if(a.slamT>0){ a.path=[]; a.slamT-=dt;
    if(a.slamT<=0){ a.slamT=0; a.slamFx=0.5;
      for(const p of P) if(p.hp>0&&Math.hypot(p.x-a.x,p.y-a.y)<GOLEM_SLAM_R) biteTarget(p,a,CFG.mobDmg&&CFG.mobDmg.golem||2);
      for(let i=0;i<28;i++){ const an=i/28*Math.PI*2; chips.push({x:a.x+Math.cos(an)*0.6,y:a.y+Math.sin(an)*0.6,z:a.z*LH+2,vx:Math.cos(an)*2.4,vy:Math.sin(an)*2.4,vz:12+Math.random()*16,t:0,life:0.6,col:i%2?"#b0a890":"#8a8270"}); } }
    return; }
  if(!tp||dh>9){ a.idleT=(a.idleT||0)+dt;
    if(a.idleT>6&&a.home){ if(Math.hypot(a.x-a.home.x,a.y-a.home.y)>0.5&&!a.path.length) setPath(a,cellAt(a.home.x,a.home.y));
      a.hp=Math.min(max,(a.hp??max)+dt*5); a.sum1=a.sum2=false; a.aggro=false; a.hitters=null; }
    return; }
  a.idleT=0; if(dh>6.5&&!a.aggro) return;     // ждёт, пока подойдут
  a.aggro=true; const hp=a.hp??max;
  if(!a.sum1&&hp<=max*0.5){ a.sum1=true; summonBats(a,2); }
  if(!a.sum2&&hp<=max*0.25){ a.sum2=true; summonBats(a,3); }
  if(a.slamCd<=0&&dh<2.4){ a.slamT=GOLEM_SLAM_T; a.slamCd=6.5; a.path=[]; a.facing=facingTo(a,tp.x,tp.y); return; }
  if(dh<1.35){ a.path=[]; a.facing=facingTo(a,tp.x,tp.y); a.lungeTo=[tp.x,tp.y];
    if(!tp.busy){ a.attackT-=dt; if(a.attackT<=0){ a.attackT=1.7; a.lunge=0.3; biteTarget(tp,a,1); } } }
  else if(a.think<=0){ a.think=0.5; setPath(a,cellAt(Math.round(tp.x),Math.round(tp.y))); a.attackT=Math.min(a.attackT,0.8); }
}
function drawSpiderP(g,frame,moving){
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)}, O="#1b1528", k=moving?frame%2:0;
  for(let i=0;i<4;i++){ const x=-6+i*4, up=(i+k)%2;            // лапки
    R(x-1,-9+up,1,4,O); R(x-2,-5+up,1,5-up,O); R(x+1,-9+up,1,4,O); R(x+2,-5+up,1,5-up,O); }
  R(-9,-12,10,8,O); R(-8,-11,8,6,"#4a3458"); R(-7,-10,3,2,"#6c5080"); R(-5,-8,2,2,"#c03040");   // брюшко
  R(0,-10,7,6,O); R(1,-9,5,4,"#3a2a48"); R(5,-8,1,1,"#ff4848"); R(5,-6,1,1,"#ff4848"); R(3,-8,1,1,"#ff4848");
}
function drawGolemP(g,frame,moving,raise,glow){
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)}, O="#1b1528", S1="#7c7686", S2="#9a94a4", S3="#5c5666", M="#5a8a3c", b=moving?[0,-1,0,-1][frame%4]:0;
  R(-11,-12,9,12,O); R(-10,-11,7,10,S3); R(3,-12,9,12,O); R(4,-11,7,10,S3);
  R(-15,-37+b,30,27,O); R(-14,-36+b,28,25,S1); R(-14,-36+b,28,4,S2); R(-12,-20+b,8,3,S3); R(4,-27+b,9,3,S3); R(-14,-36+b,6,3,M); R(8,-35+b,5,2,M);
  R(-3,-28+b,7,7,O); R(-2,-27+b,5,5,glow); R(-1,-26+b,2,2,"#ffffff");
  R(-7,-47+b,14,11,O); R(-6,-46+b,12,9,S2); R(-4,-43+b,3,2,glow); R(2,-43+b,3,2,glow); R(-6,-46+b,4,2,M);
  const ay=raise?-56:-34, ah=raise?22:24;
  R(-23,ay+b,9,ah,O); R(-22,ay+1+b,7,ah-2,S1); R(-22,ay+1+b,7,3,S2); R(14,ay+b,9,ah,O); R(15,ay+1+b,7,ah-2,S1); R(15,ay+1+b,7,3,S2);
}
function drawBeast(a){
  if(a.alpha<=0.01) return;
  worldTransform(); ctx.imageSmoothingEnabled=false;
  let [fx,fy]=proj(a.x-MX,a.y-MY,a.z); const cm=CMOBS[a.kind], pre=cm?mobPre(cm,a.kind):a.kind, big=a.kind==="golem", boss=big||!!(cm&&cm.boss), sc=cm?cm.sz/100:1;
  if(boss&&(a.slamT>0||a.slamFx>0)){   // красный круг — куда ударит голем; белая волна — удар
    const k=a.slamT>0?1-a.slamT/GOLEM_SLAM_T:1, SR=a.slamR||(cm&&cm.boss?cm.slamR/10:GOLEM_SLAM_R), rr=a.slamT>0?SR:SR*(1.2-a.slamFx*0.4);
    ctx.beginPath(); for(let i=0;i<=32;i++){ const an=i/32*Math.PI*2, q=proj(a.x-MX+Math.cos(an)*rr,a.y-MY+Math.sin(an)*rr,a.z); i?ctx.lineTo(...q):ctx.moveTo(...q); }
    if(a.slamT>0){ ctx.fillStyle=`rgba(255,60,40,${0.12+0.3*k})`; ctx.fill(); ctx.strokeStyle=`rgba(255,120,90,${0.5+0.5*k})`; ctx.lineWidth=1; ctx.stroke(); }
    else { ctx.strokeStyle=`rgba(255,255,255,${a.slamFx*1.6})`; ctx.lineWidth=2; ctx.stroke(); } }
  if(a.lunge>0){ const lt=a.lungeTo||[hero.x,hero.y], [hx,hy]=proj(lt[0]-MX,lt[1]-MY,a.z), dx=hx-fx, dy=hy-fy, dd=Math.hypot(dx,dy)||1, k=Math.sin(a.lunge/0.25*Math.PI)*(big?4:5); fx+=dx/dd*k; fy+=dy/dd*k; }
  ctx.globalAlpha=a.dying>0?Math.min(1,a.dying/1.2)*a.alpha:a.alpha;
  const shw=(big||pre==="golem"?20:pre==="bear"?14:10)*sc; ctx.fillStyle="rgba(20,10,40,.3)"; ctx.beginPath(); ctx.ellipse(fx,fy,shw,shw*0.36,0,0,Math.PI*2); ctx.fill();
  const nf=img[pre+"_se_2"]?4:img[pre+"_se_1"]?2:4, frame=a.moving?Math.floor(a.phase*(nf===2?0.5:1))%nf:0;
  let sp=img[`${pre}_${a.facing}_${frame}`], mirror=false;
  if(!sp&&a.facing[1]==="w"){ sp=img[`${pre}_${a.facing[0]}e_${frame}`]; mirror=true; }
  if(a.dying>0&&img[pre+"_dead"]){ sp=img[pre+"_dead"]; mirror=a.facing[1]==="w"; }
  if(cm&&sp&&!sp.width) sp=null;
  if(cm&&sp) sp=mobTint(a.kind,sp);
  if(boss&&a.slamT>0) fx+=Math.round(Math.sin(T*60)*(1-a.slamT/GOLEM_SLAM_T)*2);   // дрожит перед ударом
  a.drawn={x:Math.round(fx),y:Math.round(fy),sp,name:null,mirror};
  ctx.save(); ctx.translate(Math.round(fx),Math.round(fy)+(a.dying>0&&!img[pre+"_dead"]?Math.round((3-a.dying)*3):0)); if(sc!==1) ctx.scale(sc,sc);
  if(a.hurtT>0) ctx.filter="brightness(2.2)";
  else if(cm&&cm.boss&&a.rage&&sp&&!(a.slamT>0)) ctx.filter=`drop-shadow(0 0 ${2+Math.round(Math.sin(T*8)*1.5+1.5)}px #ff3a2a)`;
  else if(boss&&a.slamT>0&&sp) ctx.filter=`sepia(1) saturate(${2+3*(1-a.slamT/GOLEM_SLAM_T)}) hue-rotate(-35deg)`;
  if(sp){ if(mirror) ctx.scale(-1,1); ctx.drawImage(sp,-Math.round(sp.width/2),-sp.height+(big?4:3)); }
  else { if(a.facing[1]==="w") ctx.scale(-1,1);
    if(big) drawGolemP(ctx,frame,a.moving,a.slamT>0,a.slamT>0?"#ff6a4a":"#7ae0ff"); else drawSpiderP(ctx,frame,a.moving); }
  ctx.filter="none"; ctx.restore(); ctx.globalAlpha=1;
  if(!boss) drawMobHP(a,fx,fy-(sc>1?Math.round((sc-1)*26):0));
}
function updateBossBar(){
  const el=document.getElementById("bossBar"); if(!el) return;
  const g=animals.find(a=>((a.kind==="golem"&&CAVE)||(CMOBS[a.kind]&&CMOBS[a.kind].boss))&&!(a.dying>0)&&a.alpha>0.3&&Math.hypot(a.x-hero.x,a.y-hero.y)<11);
  if(!g){ if(!el.hidden) el.hidden=true; return; }
  const nmB=g.kind==="golem"?tr("boss_name"):String(LANG==="ru"?CMOBS[g.kind].ru:CMOBS[g.kind].pl).toUpperCase()+(g.rage?" \u{1F525}":"");
  if(el.hidden||el.dataset.k!==nmB){ el.hidden=false; el.dataset.k=nmB; document.getElementById("bossName").textContent=nmB; }
  const max=mobHp(g.kind), hp=Math.max(0,g.hp??max); document.getElementById("bossHp").style.width=(100*hp/max).toFixed(1)+"%";
  document.getElementById("bossNum").textContent=hp+" / "+max;
}
