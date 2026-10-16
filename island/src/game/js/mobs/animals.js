// ================= Звери: зайцы днём, волки ночью =================
const animals=[]; let wolfWarned=false, spawnT=0;
function edgeCell(c){ return [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const n=cellAt(c.x+dx,c.y+dy);return !n;}); }
function randomCell(filter){ for(let i=0;i<80;i++){ const c=cells[(Math.random()*cells.length)|0]; if(filter(c)) return c; } return null; }
let animalSeq=0;
function spawnAnimal(kind,c){ animals.push({nid:"a"+(++animalSeq),kind,x:c.x,y:c.y,z:walkZ(c),path:[],speed:1.5,facing:"se",phase:0,think:Math.random()*2,alpha:0,leaving:false,state:"",attackT:1,lunge:0,howlT:0,fleeing:0}); }
function setPath(a,c){ if(!c) return; const p=findPath(Math.round(a.x),Math.round(a.y),c.x,c.y); a.path=p?(p.length?p:[[c.x,c.y]]):[]; }
function fleeCell(a,fx,fy,minD,maxD){
  let best=null,bs=-1;
  for(let i=0;i<24;i++){ const ang=Math.random()*Math.PI*2, r=minD+Math.random()*(maxD-minD);
    const c=cellAt(Math.round(a.x+Math.cos(ang)*r),Math.round(a.y+Math.sin(ang)*r)); if(!freeCell(c)) continue;
    const s=Math.hypot(c.x-fx,c.y-fy)+Math.random()*0.5; if(s>bs){bs=s;best=c;} }
  return best;
}
function nearestFire(x,y){ let best=null,d=1e9; for(const f of fires) if(f.fuel>0){ const dd=Math.hypot(f.c.x-x,f.c.y-y); if(dd<d){d=dd;best=f;} } return [best,d]; }
function moveAnimal(a,dt){
  a.moving=false;
  if(a.path.length){
    const [tx,ty]=a.path[0], dx=tx-a.x, dy=ty-a.y, dist=Math.hypot(dx,dy), step=a.speed*dt*spdMul(a.kind);
    if(dist<=step){a.x=tx;a.y=ty;a.path.shift();} else {a.x+=dx/dist*step;a.y+=dy/dist*step;}
    if(dist>1e-3){ a.moving=true; const u=dx*ca-dy*sa, v=dx*sa+dy*ca; a.facing=((u+v)>=0?"s":"n")+((u-v)>=0?"e":"w"); }
  }
  a.phase=a.moving?a.phase+dt*a.speed*4:0;
  const c=cellAt(Math.round(a.x),Math.round(a.y)); if(c) a.z+=(walkZ(c)-a.z)*Math.min(1,dt*12);
}
function updateAnimals(dt){
  const d=darkness(), night=isNight(), day=d<0.25, P=playersForAI();
  const nearestP=(x,y,a)=>{ let b=null,bd=1e9;
    for(const p of P){ if(p.hp<=0||(p.fw&&a&&a.kind==="wolf")) continue; const dd=Math.hypot(p.x-x,p.y-y); if(p.tn&&dd<4) return [p,dd]; if(dd<bd){bd=dd;b=p;} } return [b,bd]; };
  const farFromAll=(c,r)=>P.every(p=>Math.hypot(c.x-p.x,c.y-p.y)>r);
  spawnT-=dt;
  if(spawnT<=0){ spawnT=1; customBossSpawn(farFromAll);
    if(CAVE) caveSpawn(farFromAll); else {
    const hares=animals.filter(a=>a.kind==="hare"&&!a.leaving), wolves=animals.filter(a=>a.kind==="wolf"&&!a.leaving&&!(a.dying>0));
    if(day){ if(hares.length<3){ const z=zonePick("hare",c=>freeCell(c)&&farFromAll(c,4)), c=z!==undefined?z:randomCell(c=>freeCell(c)&&GRASSY.includes(c.t)&&farFromAll(c,5)); if(c) spawnAnimal("hare",c); }
    }
    else for(const a of hares){ a.leaving=true; const [tp]=nearestP(a.x,a.y); setPath(a,fleeCell(a,tp?tp.x:a.x,tp?tp.y:a.y,3,6)); a.speed=3; }
    // мобы: в редакторе для каждого — днём / ночью и сколько; днём нейтральны, пока их не тронешь
    const per=night?"n":(day?"d":null);
    if(per) for(const kind of MOBS){
      if(CMOBS[kind]&&CMOBS[kind].zn!==ZONE) continue;
      const list=animals.filter(a=>a.kind===kind&&!a.leaving&&!(a.dying>0));
      if(!mobOn(kind,per)){ for(const a of list) if(!a.aggro) mobLeave(a); continue; }
      const base=mobCount(kind,per), want=base+(per==="n"&&base>0&&(hourNow()>=23||hourNow()<4)?1:0);
      if(list.length>want+1){ const a=list.find(x=>!x.aggro); if(a) mobLeave(a); }
      else if(list.length<want&&Math.random()<(kind==="bat"?0.35:per==="n"?1:0.1)) spawnMob(kind,per,farFromAll,list.length);
    }
  } }
  let anyChase=false;
  for(let i=animals.length-1;i>=0;i--){
    const a=animals[i];
    if(a.dead){ animals.splice(i,1); continue; }
    a.hurtT=Math.max(0,(a.hurtT||0)-dt);
    if(a.dying>0){ a.dying-=dt; a.moving=false; if(a.dying<0.8) a.alpha=Math.max(0,a.dying/0.8); if(a.dying<=0) animals.splice(i,1); continue; }
    if(a.leaving){ if(!a.path.length) a.alpha-=dt*1.2; if(a.alpha<=0&&!a.path.length){ animals.splice(i,1); continue; } }
    else a.alpha=Math.min(1,a.alpha+dt*0.8);
    if(a.bleedT>0){ a.bleedT-=dt; a.bleedTick=(a.bleedTick||0)+dt; if(a.bleedTick>=1){ a.bleedTick=0; applyHit(a,a.bleedBy,a.x,a.y,1); if(a.dying>0) continue; } }
    if(a.stunT>0){ a.stunT-=dt; a.path=[]; a.moving=false; a.lunge=0; if(isBossA(a)) a.slamT=0; continue; }
    a.think-=dt; a.howlT=Math.max(0,a.howlT-dt); a.lunge=Math.max(0,a.lunge-dt);
    const [tp,dh]=nearestP(a.x,a.y,a);
    if(a.kind==="hare"&&!a.leaving){
      if(tp&&dh<2.6&&a.fleeing<=0){ setPath(a,fleeCell(a,tp.x,tp.y,3,5)); a.speed=3.6; a.fleeing=1.6; }
      if(a.fleeing>0) a.fleeing-=dt;
      else if(a.think<=0&&!a.path.length){ a.think=2+Math.random()*4; if(Math.random()<0.6){ setPath(a,fleeCell(a,a.x,a.y,1,3)); a.speed=1.5; } }
    }
    if(a.kind==="wolf"&&a.aggro){ if(!tp||dh>9){ a.aggroT=(a.aggroT||0)+dt; if(a.aggroT>6){ a.aggro=false; a.aggroT=0; } } else a.aggroT=0; }
    if(a.kind==="wolf"&&!a.leaving&&!night&&!a.aggro){            // днём волк мирный: бродит и сторонится людей
      if(tp&&dh<2.2&&a.state!=="shy"){ a.state="shy"; setPath(a,fleeCell(a,tp.x,tp.y,2.5,4)); a.speed=1.8; }
      else if(a.state==="shy"&&!a.path.length) a.state="";
      else if(a.state!=="shy"&&a.think<=0&&!a.path.length){ a.state="wander"; a.think=3+Math.random()*4; if(Math.random()<0.7) setPath(a,fleeCell(a,a.x,a.y,1.5,3.5)); a.speed=1.1; }
    } else if(a.kind==="wolf"&&!a.leaving){
      const [wf,df]=nearestFire(a.x,a.y), [hf,dhf]=tp?nearestFire(tp.x,tp.y):[null,1e9], safe=dhf<FIRE_SAFE;
      if(wf&&df<FIRE_SCARE){                                   // огонь пугает
        if(a.state!=="flee"||!a.path.length){ a.state="flee"; setPath(a,fleeCell(a,wf.c.x,wf.c.y,2.5,4.5)); a.speed=3; }
      } else if(tp&&dh<8&&!safe){                               // чует ближайшего игрока и бежит к нему
        if(tp.me) anyChase=true;
        if(a.state!=="chase"){ a.state="chase"; a.howlT=1.2; if(tp.me&&!wolfWarned){ wolfWarned=true; say("wolf_chase","hurt_sub"); } }
        a.speed=2.5;
        if(dh<0.95){
          a.path=[]; a.facing=facingTo(a,tp.x,tp.y); a.lungeTo=[tp.x,tp.y];
          if(!tp.busy){ a.attackT-=dt; if(a.attackT<=0){ a.attackT=1.4; a.lunge=0.25; biteTarget(tp,a); } }
        } else if(a.think<=0){ a.think=0.4; setPath(a,cellAt(Math.round(tp.x),Math.round(tp.y))); a.attackT=Math.min(a.attackT,0.7); }
      } else if(tp&&safe&&dh<10){                                // кружит в темноте вокруг костра
        if(a.state!=="circle"||a.think<=0){ a.state="circle"; a.think=1.6+Math.random();
          const ang=Math.atan2(a.y-hf.c.y,a.x-hf.c.x)+0.7, c=cellAt(Math.round(hf.c.x+Math.cos(ang)*5.2),Math.round(hf.c.y+Math.sin(ang)*5.2));
          if(freeCell(c)) setPath(a,c); a.speed=1.6; if(Math.random()<0.12) a.howlT=1.5; }
      } else if(a.state!=="wander"||(a.think<=0&&!a.path.length)){ a.state="wander"; a.think=3+Math.random()*3; setPath(a,fleeCell(a,a.x,a.y,2,4)); a.speed=1.3; }
    }
    if(a.kind==="spider"){ updateSpider(a,dt,tp,dh); moveAnimal(a,dt); continue; }
    if(CMOBS[a.kind]&&CMOBS[a.kind].boss){ updateCBoss(a,dt,tp,dh,P); moveAnimal(a,dt); continue; }
    if(CMOBS[a.kind]){ if(!a.leaving) updateCMob(a,dt,tp,dh,night); moveAnimal(a,dt); continue; }
    if(a.kind==="golem"){ updateGolem(a,dt,tp,dh,P); moveAnimal(a,dt); continue; }
    if(a.kind==="bat"){ if(a.aggro&&(!tp||dh>8)) a.aggro=false; updateBat(a,dt,tp,dh); continue; }
    moveAnimal(a,dt);
  }
  if(!anyChase) wolfWarned=false;
  hero.hurtT=Math.max(0,hero.hurtT-dt);
}
// к какой клетке «привязан» зверь в порядке отрисовки
function assignEnts(){
  for(const c of cells) c.ents=null;
  for(const a of [...animals,...remotes.values()]){   // офлайн-игроков на карте не показываем
    let anchor=null;
    for(const [ox,oy] of [[0,0],[.4,0],[-.4,0],[0,.4],[0,-.4]]){ const c=cellAt(Math.round(a.x+ox),Math.round(a.y+oy));
      if(c&&(!anchor||c.depth>anchor.depth)&&Math.abs(walkZ(c)-a.z)<1.2) anchor=c; }
    if(anchor) (anchor.ents||(anchor.ents=[])).push(a);
  }
}
// ---- отрисовка зверей: спрайты hare_/wolf_<se|ne>_<0..3> (влево — зеркально) или пиксели кодом ----
function drawHareP(g,frame,moving){
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)}, O="#1b1528", up=moving&&frame%2;
  R(-7,-9,13,7,O); R(2,-12,6,6,O); R(2,-18,3,7,O); R(4,-18,3,7,O); R(-9,-9,3,3,O);
  R(-6,-8,11,5,"#a07850"); R(-5,-4,9,1,"#dcc4a0"); R(3,-11,4,4,"#a07850"); R(6,-10,1,1,O); R(7,-9,1,1,"#e89a9a");
  R(3,-17,1,6,"#a07850"); R(5,-17,1,6,"#8a6440"); R(3,-16,1,3,"#e8b0a8"); R(-8,-8,2,2,"#f4f0e8");
  if(up){ R(-9,-4,4,1,"#8a6440"); R(4,-4,4,1,"#8a6440"); } else { R(-4,-3,2,3,"#8a6440"); R(2,-3,2,3,"#8a6440"); }
}
function drawWolfP(g,frame,moving,night){
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)}, O="#1b1528", legs=moving?[[0,2,2,0],[2,0,0,2]][frame%2]:[0,0,0,0];
  R(-15,-15,6,4,O); R(-14,-14,5,2,"#5a5a68");                         // хвост
  [-8,-5,3,6].forEach((x,i)=>{ R(x-1,-7,4,8-legs[i],O); R(x,-6,2,6-legs[i],"#4c4c5c"); });
  R(-11,-15,20,9,O); R(-10,-14,18,7,"#6c6c7c"); R(-10,-14,18,2,"#4c4c5c"); R(-8,-8,14,1,"#9a9aa8");
  R(6,-18,8,8,O); R(7,-17,6,6,"#6c6c7c"); R(12,-14,4,3,O); R(12,-13,3,2,"#5a5a68"); R(15,-13,1,1,O);
  R(7,-20,3,3,O); R(10,-20,3,3,O); R(8,-19,1,1,"#4c4c5c"); R(11,-19,1,1,"#4c4c5c");
  R(10,-15,1,1,night?"#fff070":"#2a2a30");
}
function drawAnimal(a){
  if(a.kind==="bat") return drawBat(a);
  if(a.kind==="spider"||a.kind==="golem"||CMOBS[a.kind]) return drawBeast(a);
  if(a.alpha<=0.01) return;
  worldTransform(); ctx.imageSmoothingEnabled=false;
  let [fx,fy]=proj(a.x-MX,a.y-MY,a.z);
  if(a.lunge>0){ const lt=a.lungeTo||[hero.x,hero.y], [hx,hy]=proj(lt[0]-MX,lt[1]-MY,a.z), dx=hx-fx, dy=hy-fy, dd=Math.hypot(dx,dy)||1, k=Math.sin(a.lunge/0.25*Math.PI)*5; fx+=dx/dd*k; fy+=dy/dd*k; }
  const hop=a.kind==="hare"&&a.moving?-Math.round(Math.abs(Math.sin(a.phase*0.8))*4):0;
  ctx.globalAlpha=a.alpha;
  ctx.fillStyle="rgba(20,10,40,.25)"; ctx.beginPath(); ctx.ellipse(fx,fy,a.kind==="wolf"?11:7,a.kind==="wolf"?4:3,0,0,Math.PI*2); ctx.fill();
  const frame=a.moving?Math.floor(a.phase)%4:0;
  let sp=img[`${a.kind}_${a.facing}_${frame}`], mirror=false;
  if(!sp&&a.facing[1]==="w"){ sp=img[`${a.kind}_${a.facing[0]}e_${frame}`]; mirror=true; }
  if(a.kind==="wolf"&&a.dying>0&&img.wolf_dead){ sp=img.wolf_dead; mirror=a.facing[1]==="w"; }
  else if(a.kind==="wolf"&&a.hurtT>0){ const h=img[`wolf_hurt_${a.facing[0]}e`]; if(h){ sp=h; mirror=a.facing[1]==="w"; } }
  const flat=a.kind==="wolf"&&a.dying>0&&!img.wolf_dead, flash=a.hurtT>0&&!(img[`wolf_hurt_${a.facing[0]}e`]);
  a.drawn={x:Math.round(fx),y:Math.round(fy)+hop,sp,name:sp&&!(a.dying>0)&&!(a.hurtT>0)?`${a.kind}_${mirror?a.facing[0]+"e":a.facing}_${frame}`:null,mirror};
  ctx.save(); ctx.translate(Math.round(fx),Math.round(fy)+hop);
  if(flat){ ctx.scale(1,0.55); ctx.rotate(mirror?0.25:-0.25); }
  if(flash) ctx.filter="brightness(2.4)";
  if(sp){ if(mirror) ctx.scale(-1,1); ctx.drawImage(sp,-Math.round(sp.width/2),-sp.height+2); }
  else { if(a.facing[1]==="w") ctx.scale(-1,1); a.kind==="hare"?drawHareP(ctx,frame,a.moving):drawWolfP(ctx,frame,a.moving,darkness()>0.4); }
  ctx.filter="none"; ctx.restore(); ctx.globalAlpha=1;
  if(a.kind==="wolf") drawMobHP(a,fx,fy);
  if(a.howlT>0&&a.kind==="wolf"){
    ctx.font="8px Silkscreen, monospace"; ctx.textAlign="center"; ctx.textBaseline="bottom";
    const y=Math.round(fy-26-(1.6-a.howlT)*6); ctx.globalAlpha=Math.min(1,a.howlT);
    ctx.lineWidth=3; ctx.strokeStyle="#1b1528"; ctx.strokeText("Auuu!",Math.round(fx),y); ctx.fillStyle="#c8d0ff"; ctx.fillText("Auuu!",Math.round(fx),y); ctx.globalAlpha=1;
  }
}

