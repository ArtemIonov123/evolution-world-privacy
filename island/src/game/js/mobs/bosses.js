// ================= Свои боссы из админки (world/bosses) =================
// Босс — тот же «свой моб» (CMOBS[kind].boss=true): общие отрисовка, сеть и лут, но своё появление и ИИ.
// Появляется один в своём месте (pos), после смерти — через rsp минут (время смерти в world/boss_dead).
const BOSS_DEAD={};
let bossesRaw={};
const isBossKind=k=>k==="golem"||!!(CMOBS[k]&&CMOBS[k].boss);
const isBossA=a=>!!a&&isBossKind(a.kind);
function bsSanitize(id,o){
  if(!/^bs[a-z0-9]{4,12}$/.test(id)||!o||typeof o!=="object") return null;
  const ru=itClean(o.ru).slice(0,24), pl=itClean(o.pl).slice(0,24)||ru; if(!ru&&!pl) return null;
  const pos=Array.isArray(o.pos)&&o.pos.length===2&&o.pos.every(v=>Number.isInteger(v)&&v>=0&&v<60)?[o.pos[0],o.pos[1]]:null;
  return {id,boss:true,ru:ru||pl,pl,b:MB_BASES.includes(o.b)?o.b:"golem",hue:itNum(o.hue,359),sz:Math.max(80,Math.min(260,itNum(o.sz,260)||160)),zn:o.zn==="island"?"island":"cave",
    hp:Math.max(5,itNum(o.hp,99999)),dmg:Math.max(1,itNum(o.dmg,20)),spd:Math.max(1,Math.min(4,itNum(o.spd,4)||1)),range:Math.max(2,Math.min(12,itNum(o.range,12)||6)),
    up:upSanitize(o.up),xp:itNum(o.xp,99999),rsp:Math.max(1,Math.min(1440,itNum(o.rsp,1440)||10)),pos,
    slam:o.slam?1:0,slamDmg:Math.max(1,itNum(o.slamDmg,30)||2),slamR:Math.max(15,Math.min(45,itNum(o.slamR,45)||23)),slamCd:Math.max(3,Math.min(30,itNum(o.slamCd,30)||7)),
    sum:o.sum?1:0,sumK:typeof o.sumK==="string"&&/^[a-z0-9]{2,14}$/.test(o.sumK)?o.sumK:"bat",sumN:Math.max(1,Math.min(5,itNum(o.sumN,5)||2)),
    rage:o.rage?1:0,rageAt:Math.max(5,Math.min(90,itNum(o.rageAt,90)||30)),
    // поля «как у моба», чтобы общие функции не спотыкались
    ai:"aggr",d:0,dn:0,n:0,nn:0,cn:0};
}
function applyBosses(d){
  const list=d&&d.list&&typeof d.list==="object"?d.list:{}; bossesRaw={};
  for(const k of Object.keys(CMOBS)){ if(!CMOBS[k].boss) continue; const i=BOSSES.indexOf(k); if(i>=0) BOSSES.splice(i,1);
    delete I18N.ru["ed_src_"+k]; delete I18N.pl["ed_src_"+k]; delete CMOBS[k]; }
  mobTintCache.clear();
  for(const [id,o] of Object.entries(list).slice(0,30)){ const m=bsSanitize(id,o); if(!m) continue;
    CMOBS[id]=m; bossesRaw[id]=m; BOSSES.push(id); regMobImgs(id,m.up);
    I18N.ru["ed_src_"+id]=m.ru+" (босс)"; I18N.pl["ed_src_"+id]=m.pl+" (boss)";
    if(!DROP_DEF[id]) DROP_DEF[id]=[{id:"coin",ch:100,a:20,b:50},{id:"potion_big",ch:60,a:1,b:1}]; }
  for(let i=animals.length-1;i>=0;i--){ const a=animals[i]; if(/^bs[a-z0-9]{4,12}$/.test(a.kind)&&!CMOBS[a.kind]) animals.splice(i,1); }
  if(winKind==="admin_bosses") renderWin();
}
function applyBossDead(d){ for(const k of Object.keys(BOSS_DEAD)) delete BOSS_DEAD[k]; if(d&&typeof d==="object") for(const [k,v] of Object.entries(d)) if(typeof v==="number") BOSS_DEAD[k]=v; }
// хозяин мира следит, чтобы каждый босс стоял на своём месте
function customBossSpawn(farFromAll){
  for(const [k,m] of Object.entries(CMOBS)){
    if(!m.boss||m.zn!==ZONE||!m.pos) continue;
    if(animals.some(a=>a.kind===k&&!a.dead)) continue;
    if(Date.now()-(BOSS_DEAD[k]||0)<m.rsp*60000) continue;
    const c=cellAt(m.pos[0],m.pos[1]); if(!c||c.water||!farFromAll(c,2.5)) continue;
    spawnAnimal(k,c); const b=animals[animals.length-1]; b.home={x:c.x,y:c.y}; b.slamCd=4; b.attackT=1.2; b.hp=m.hp; }
}
// помощники босса: любые звери (летучие мыши, волки, пауки или свои мобы)
function summonMinions(a,kind,n){
  if(kind==="bat") return summonBats(a,n);
  if(!(kind==="wolf"||kind==="spider"||(CMOBS[kind]&&!CMOBS[kind].boss))) return;
  for(let i=0,got=0;i<n*6&&got<n;i++){ const ang=Math.random()*Math.PI*2, r=1.2+Math.random()*1.8, c=cellAt(Math.round(a.x+Math.cos(ang)*r),Math.round(a.y+Math.sin(ang)*r)); if(!freeCell(c)) continue;
    got++; spawnAnimal(kind,c); const m=animals[animals.length-1]; m.home={x:c.x,y:c.y}; m.aggro=true; m.attackT=1; m.alpha=0.6; m.summoned=true; }
  floats.push({key:"boss_summon2",p:{m:LANG==="ru"?CMOBS[a.kind].ru:CMOBS[a.kind].pl},col:"#c8a0ff",t:0});
}
function updateCBoss(a,dt,tp,dh,P){
  const m=CMOBS[a.kind], max=m.hp, hp=a.hp??max;
  a.rage=!!(m.rage&&hp<=max*m.rageAt/100);
  const run=(MB_SPD[m.spd]||1.6)*0.6*(a.rage?1.4:1);
  a.speed=run; a.slamCd=(a.slamCd??4)-dt; a.slamFx=Math.max(0,(a.slamFx||0)-dt);
  if(a.slamT>0){ a.path=[]; a.slamT-=dt;
    if(a.slamT<=0){ a.slamT=0; a.slamFx=0.5; const R=m.slamR/10;
      for(const p of P) if(p.hp>0&&Math.hypot(p.x-a.x,p.y-a.y)<R) biteTarget(p,a,m.slamDmg+(a.rage?1:0));
      for(let i=0;i<28;i++){ const an=i/28*Math.PI*2; chips.push({x:a.x+Math.cos(an)*0.6,y:a.y+Math.sin(an)*0.6,z:a.z*LH+2,vx:Math.cos(an)*2.4,vy:Math.sin(an)*2.4,vz:12+Math.random()*16,t:0,life:0.6,col:i%2?"#b0a890":"#8a8270"}); } }
    return; }
  if(!tp||dh>m.range+4){ a.idleT=(a.idleT||0)+dt;
    if(a.idleT>6&&a.home){ if(Math.hypot(a.x-a.home.x,a.y-a.home.y)>0.5&&!a.path.length) setPath(a,cellAt(a.home.x,a.home.y));
      a.hp=Math.min(max,hp+dt*Math.max(5,max*0.05)); a.sum1=a.sum2=false; a.aggro=false; a.hitters=null; }
    return; }
  a.idleT=0; if(dh>m.range&&!a.aggro) return;     // ждёт, пока подойдут
  a.aggro=true;
  if(m.sum){ if(!a.sum1&&hp<=max*0.5){ a.sum1=true; summonMinions(a,m.sumK,m.sumN); }
    if(!a.sum2&&hp<=max*0.25){ a.sum2=true; summonMinions(a,m.sumK,m.sumN+1); } }
  if(m.slam&&a.slamCd<=0&&dh<m.slamR/10+0.1){ a.slamT=GOLEM_SLAM_T; a.slamR=m.slamR/10; a.slamCd=m.slamCd*(a.rage?0.7:1); a.path=[]; a.facing=facingTo(a,tp.x,tp.y); return; }
  if(dh<1.4+(m.sz>140?0.35:0)){ a.path=[]; a.facing=facingTo(a,tp.x,tp.y); a.lungeTo=[tp.x,tp.y];
    if(!tp.busy){ a.attackT-=dt; if(a.attackT<=0){ a.attackT=a.rage?1.2:1.7; a.lunge=0.3; biteTarget(tp,a,m.dmg+(a.rage?1:0)); } } }
  else if(a.think<=0){ a.think=0.5; setPath(a,cellAt(Math.round(tp.x),Math.round(tp.y))); a.attackT=Math.min(a.attackT,0.8); }
}
function customBossKilled(a){
  BOSS_DEAD[a.kind]=Date.now();
  if(NET.db) NET.db.doc("world/boss_dead").set({...BOSS_DEAD}).catch(()=>{});
}
