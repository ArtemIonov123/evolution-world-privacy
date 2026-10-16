// ================= Бой: дубинка, волки с HP, добыча =================
const WOLF_HP=4, ATK_TIME=0.36, ATK_HIT=0.14, ATK_CD=0.75, ATK_RANGE=1.15;
const LOOT_PRICE={pelt:4, fang:3, meat_raw:2, meat_cooked:5};
// ---- дроп, опыт и цены рыбака (настраиваются во вкладке «Дроп») ----
const DROP_DEF={wolf:[{id:"pelt",ch:100,a:1,b:1},{id:"meat_raw",ch:100,a:1,b:1},{id:"fang",ch:50,a:1,b:1}],
  bat:[{id:"bat_wing",ch:100,a:1,b:1},{id:"coin",ch:40,a:1,b:2}],
  spider:[{id:"spider_silk",ch:100,a:1,b:2},{id:"coin",ch:50,a:1,b:3}],
  golem:[{id:"coin",ch:100,a:30,b:60},{id:"potion_big",ch:100,a:1,b:2},{id:"golem_core",ch:100,a:1,b:1},{id:"sword_steel",ch:35,a:1,b:1}]};
const MOBS=["wolf","bat","spider"], BOSSES=["golem"];                       // сюда добавятся новые мобы и боссы
const XP_DEF={wolf:10,bat:6,spider:12,golem:150,tree:3,quest:20}, XP_FISH_DEF={karas:2,okun:2,shchuka:4,gold:10,boot:1};
const FISHER_EDIT=["karas","okun","shchuka","gold","boot","cooked","pelt","fang","meat_raw","meat_cooked","wood"];
const dropTable=m=>CFG.drops[m]||DROP_DEF[m]||[];
const xpOf=k=>CMOBS[k]?CMOBS[k].xp:CFG.xp[k]!=null?CFG.xp[k]:XP_DEF[k];
const xpFish=id=>CFG.xpFish[id]!=null?CFG.xpFish[id]:(XP_FISH_DEF[id]??2);
const fishW=f=>CFG.fishW[f.id]!=null?CFG.fishW[f.id]:f.w;
const logsOf=name=>CFG.logs[name]!=null?CFG.logs[name]:LOGS[name];
const fisherPrice=id=>CFG.fisher[id]!=null?CFG.fisher[id]:(PRICE[id]??LOOT_PRICE[id]??(id==="wood"?1:0));
function rollDrops(mob){
  const got=[];
  for(const r of dropTable(mob)){ if(Math.random()*100>=r.ch) continue; const n=r.a+Math.floor(Math.random()*(r.b-r.a+1)); if(n>0) got.push([r.id,n]); }
  return got;
}

const EDIBLE={cooked:2, meat_cooked:3, potion:3, potion_big:5};
let quest2="none";                 // волчье задание рыбака: none → active → done
let hitSeq=0, killSeq=0; const myHits=[], kills=[]; const lastHitFrom={}; let lastKill={};
const hitFx=[];                    // цифры урона и искры над зверями {x,y,z,t,txt,col}
hero.atk=null; hero.atkCd=0; hero.target=null; hero.retarget=0;
const hasWeapon=()=>!!equip.weapon||!!form;
// клик по волку: по картинке, а не по клетке
function pickWolf(mx,my){
  const wx=(mx-panX)/scale, wy=(my-panY)/scale; let best=null, bd=1e9;
  for(const a of animals){ if(!isMob(a)||a.dying>0||a.alpha<0.3||!a.drawn) continue;
    const big=a.kind==="golem"||(CMOBS[a.kind]&&(CMOBS[a.kind].b==="golem"||CMOBS[a.kind].sz>=140)), dx=wx-a.drawn.x, dy=wy-(a.drawn.y-(big?24:12));
    if(Math.abs(dx)<=(big?28:20)&&dy>=(big?-30:-22)&&dy<=(big?26:14)){ const d=Math.hypot(dx,dy); if(d<bd){bd=d;best=a;} } }
  return best;
}
function attackWolf(a){
  if(!hasWeapon()){ say("need_weapon","need_weapon_sub"); marker={x:Math.round(a.x),y:Math.round(a.y),t:0,ok:false}; return; }
  hero.target=a; hero.retarget=0; marker=null;
  follow=true; document.getElementById("follow").setAttribute("aria-pressed","true");
  say("go_attack","attack_sub");
}
// ответный удар: если моб напал, а герой стоит без дела — герой сам бьёт его
function autoRetaliate(){
  if(hero.target||hero.path.length||hero.dash||fainting||dialogOpen||EDIT||placing||fishing||chopping) return;
  const a=hero.attacker; if(!a||Date.now()-(hero.attackedAt||0)>5000) return;
  if(!animals.includes(a)||a.dying>0||a.alpha<0.3||Math.hypot(a.x-hero.x,a.y-hero.y)>3){ hero.attacker=null; return; }
  if(hasWeapon()){ hero.target=a; hero.retarget=0; return; }
  if(heroClass==="druid"&&!(skillCd.thorn>0)&&heroLevel()>=1) useSkill("thorn");
}
function updateCombat(dt){
  hero.atkCd=Math.max(0,hero.atkCd-dt); autoRetaliate();
  if(hero.atk){ const k=hero.atk; k.t+=dt;
    if(!k.hit&&k.t>=ATK_HIT){ k.hit=true; landHit(k.a); }
    if(k.t>=ATK_TIME) hero.atk=null; }
  const a=hero.target; if(!a) return;
  if(!animals.includes(a)||a.dying>0||a.alpha<0.2||fainting||dialogOpen){ hero.target=null; return; }
  const d=Math.hypot(a.x-hero.x,a.y-hero.y);
  if(d<=ATK_RANGE){ hero.path=[]; faceTo(a.x,a.y);
    if(!hero.atk&&hero.atkCd<=0){ hero.atk={t:0,a,hit:false}; hero.atkCd=ATK_CD; } }
  else if(!hero.atk){ hero.retarget-=dt;
    if(hero.retarget<=0||!hero.path.length){ hero.retarget=0.3;
      const p=findPath(Math.round(hero.x),Math.round(hero.y),Math.round(a.x),Math.round(a.y));
      if(p) hero.path=p.length?p:[[Math.round(a.x),Math.round(a.y)]]; else { hero.target=null; say("no_reach"); } } }
}
function landHit(a){
  if(!a||!animals.includes(a)||a.dying>0) return;
  if(Math.hypot(a.x-hero.x,a.y-hero.y)>ATK_RANGE+0.5) return;          // волк отскочил — промах
  for(let i=0;i<8;i++) chips.push({x:a.x,y:a.y,z:a.z*LH+10,vx:(Math.random()-.5)*1.2,vy:(Math.random()-.5)*1.2,vz:25+Math.random()*25,t:0,life:0.4,col:Math.random()<.5?"#ffffff":"#ffd66b",spark:true});
  const crit=Math.random()<critChance(), dmg=Math.max(1,heroAtk())*(crit?2:1);
  dealHit(a,dmg,crit,{bleed:form==="wolf"});
  if(form==="bear") for(const b of animals) if(b!==a&&isMob(b)&&!(b.dying>0)&&b.alpha>0.3&&Math.hypot(b.x-hero.x,b.y-hero.y)<1.5) dealHit(b,Math.max(1,heroAtk()-1),false);
}
// урон зверю от меня: хозяин считает сам, остальные отправляют удар хозяину
function dealHit(a,dmg,crit,o={}){
  if(!a||!animals.includes(a)||a.dying>0) return; lastCombat=Date.now();
  if(!NET.room||NET.host) applyHit(a,NET.myPeer,hero.x,hero.y,dmg,crit,o);
  else { a.hurtT=0.3; hitFx.push({x:a.x,y:a.y,z:a.z,t:0,txt:"-"+dmg+(crit?"!":""),col:crit?"#ff8a2a":"#ffd66b"});
    if(o.stun) a.stunT=Math.max(a.stunT||0,o.stun);
    myHits.push({i:a.nid,s:++hitSeq,d:dmg,st:o.stun||0,bl:o.bleed?1:0,r:o.ranged?1:0}); if(myHits.length>8) myHits.shift(); }
}
// урон зверю — считает только хозяин зверей (или одиночная игра)
function applyHit(a,peer,fromX,fromY,dmg=1,crit=false,o={}){
  if(a.dying>0) return;
  if(o.stun) a.stunT=Math.max(a.stunT||0,isBossA(a)?o.stun/2:o.stun);
  if(o.bleed){ a.bleedT=3; a.bleedBy=peer; }
  a.hp=(a.hp??mobHp(a.kind))-dmg; a.hurtT=0.3; a.lunge=0;
  hitFx.push({x:a.x,y:a.y,z:a.z,t:0,txt:"-"+dmg+(crit?"!":""),col:crit?"#ff8a2a":"#ffd66b"});
  (a.hitters||(a.hitters=new Set())).add(peer||"me");
  if(!isBossA(a)){
    const dx=a.x-fromX, dy=a.y-fromY, dd=Math.hypot(dx,dy)||1, nx=a.x+dx/dd*0.4, ny=a.y+dy/dd*0.4, c=cellAt(Math.round(nx),Math.round(ny));
    if(c&&!c.blocked&&Math.abs(walkZ(c)-a.z)<1.2){ a.x=nx; a.y=ny; }
    a.path=[]; a.state="chase"; a.attackT=Math.max(a.attackT,0.25); }
  a.aggro=true; a.aggroT=0; a.think=0.2;
  if(a.hp<=0&&isBossA(a)){ a.dying=3; a.path=[]; a.slamT=0;
    if(a.kind==="golem"){ bossDeadAt=Date.now(); if(NET.db) NET.db.doc("world/cave_boss").set({dead:bossDeadAt}).catch(()=>{}); } else customBossKilled(a);
    for(const pr of a.hitters){ if(!NET.room||pr===NET.myPeer||pr==="me") giveLoot(a); else { kills.push({i:a.nid,p:pr,s:++killSeq,k:a.kind}); if(kills.length>6) kills.shift(); } }
    return; }
  if(a.hp<=0){ a.dying=2.4; a.path=[]; a.howlT=0;
    if(!NET.room||peer===NET.myPeer) giveLoot(a);
    else { kills.push({i:a.nid,p:peer,s:++killSeq,k:a.kind}); if(kills.length>6) kills.shift(); }
    shareXP(a.kind,peer,a.x,a.y); }
}
function giveLoot(a){
  const got=rollDrops(a&&a.kind?a.kind:"wolf");
  let lostLoot=false;
  for(const [id,n] of got){ if(!bagRoom(id)){ lostLoot=true; continue; } inv[id]=(inv[id]||0)+n; floats.push({key:"plus",p:{n,fish:"#fish_"+id},col:id==="coin"?"#ffd66b":"#f0e0c0",t:-0.25*floats.length}); }
  const kind=a&&a.kind||"wolf"; renderInv(); if(lostLoot) setTimeout(bagFull,900);
  if(kind==="bat"){ say("bat_killed","bat_killed_sub"); prog.st.bats=(prog.st.bats||0)+1; }
  else if(kind==="spider"){ say("spider_killed","bat_killed_sub"); prog.st.spiders=(prog.st.spiders||0)+1; }
  else if(kind==="golem"){ say("boss_killed","boss_killed_sub"); prog.st.bosses=(prog.st.bosses||0)+1; }
  else if(CMOBS[kind]&&CMOBS[kind].boss){ say("boss_killed2","boss_killed_sub",{m:LANG==="ru"?CMOBS[kind].ru:CMOBS[kind].pl}); prog.st.bosses=(prog.st.bosses||0)+1; }
  else if(CMOBS[kind]){ say("mob_killed","bat_killed_sub",{m:LANG==="ru"?CMOBS[kind].ru:CMOBS[kind].pl}); prog.st.mobs=(prog.st.mobs||0)+1; }
  else { say("wolf_killed","wolf_killed_sub"); prog.st.wolves++; }
  addXP(xpOf(kind),"fight");
  if(quest2==="active"&&(inv.pelt||0)>=2) setTimeout(()=>say("pelts_ready","pelts_ready_sub"),1600);
}
// хозяин: удары от других игроков и награды за убийства
function processRemoteHits(){
  for(const r of remotes.values()){ if(!Array.isArray(r.ht)) continue;
    for(const h of r.ht){ if(!h||typeof h!=="object") continue; const s=num(h.s,0,1e9,0);
      if(s<=(lastHitFrom[r.peer]||0)) continue; lastHitFrom[r.peer]=s;
      const a=animals.find(x=>x.nid===String(h.i)); if(isMob(a)&&Math.hypot(a.x-r.tx,a.y-r.ty)<(h.r?7:ATK_RANGE+2.2)) applyHit(a,r.peer,r.tx,r.ty,num(h.d|0,1,12,1),false,{stun:num(h.st,0,3,0),bleed:h.bl===1}); } }
}
function checkMyKills(h){
  for(const k of h.kl||[]){ if(!k||k.p!==NET.myPeer) continue; const s=num(k.s,0,1e9,0);
    if(s>(lastKill[NET.hostPeer]||0)){ lastKill[NET.hostPeer]=s; giveLoot({kind:[...MOBS,...BOSSES].includes(k.k)?k.k:"wolf"}); } }
}
function updateHitFx(dt){ for(let i=hitFx.length-1;i>=0;i--){ hitFx[i].t+=dt; if(hitFx[i].t>0.9) hitFx.splice(i,1); } }
function drawHitFx(){
  if(!hitFx.length) return; worldTransform();
  ctx.font="8px Silkscreen, monospace"; ctx.textAlign="center"; ctx.textBaseline="bottom";
  for(const f of hitFx){ const [x,y]=proj(f.x-MX,f.y-MY,f.z), yy=Math.round(y-30-f.t*22);
    ctx.globalAlpha=Math.min(1,(0.9-f.t)/0.3); ctx.lineWidth=3; ctx.strokeStyle="#1b1528"; ctx.strokeText(f.txt,Math.round(x),yy);
    ctx.fillStyle=f.col; ctx.fillText(f.txt,Math.round(x),yy); ctx.globalAlpha=1; }
}
// полоска здоровья над раненым волком
function drawMobHP(a,fx,fy){
  const mx=mobHp(a.kind), hp=a.hp??mx; if(hp>=mx||a.dying>0) return;
  const w=22, x=Math.round(fx-w/2), y=Math.round(fy-38);
  ctx.fillStyle="#1b1528"; ctx.fillRect(x-1,y-1,w+2,5); ctx.fillStyle="#3d3257"; ctx.fillRect(x,y,w,3);
  ctx.fillStyle=hp>1?"#e8402c":"#ff8a2a"; ctx.fillRect(x,y,Math.round(w*hp/mx),3);
}
// дубинка кодом (пока нет спрайтов атаки): взмах от плеча
function drawClubSwing(fx,fy,dir,t){
  const ph=Math.min(1,t/ATK_TIME), ang=ph<0.35?-2.0+0.4*(ph/0.35):ph<0.55?-1.6+2.6*((ph-0.35)/0.2):1.0+0.2*((ph-0.55)/0.45);
  ctx.save(); ctx.translate(Math.round(fx+dir*4),Math.round(fy-20)); ctx.scale(dir,1); ctx.rotate(ang);
  ctx.fillStyle="#1b1528"; ctx.fillRect(-1,-3,17,6); ctx.fillRect(11,-4,7,8);
  ctx.fillStyle="#b07a40"; ctx.fillRect(0,-2,12,3); ctx.fillStyle="#c89058"; ctx.fillRect(12,-3,5,6); ctx.fillStyle="#8a5a2e"; ctx.fillRect(12,1,5,1);
  ctx.restore();
}
// белая дуга в момент удара
function drawSlash(fx,fy,facing,t){
  if(t<0.1||t>0.3) return; const k=(t-0.1)/0.2, dir=facing[1]==="e"?1:-1, up=facing[0]==="n";
  ctx.save(); ctx.translate(Math.round(fx+dir*9),Math.round(fy-(up?24:16))); ctx.scale(dir,up?-1:1);
  ctx.globalAlpha=1-k; ctx.strokeStyle="#ffffff"; ctx.lineWidth=2; ctx.lineCap="round";
  ctx.beginPath(); ctx.arc(0,0,11+k*3,-1.5+k*0.6,0.9+k*0.4); ctx.stroke();
  ctx.globalAlpha=(1-k)*0.5; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(0,0,8+k*3,-1.0+k*0.6,0.6+k*0.4); ctx.stroke();
  ctx.restore();
}
const atkLunge=(facing,t)=>atkFrame(t)===1?[(facing[1]==="e"?1:-1)*2,facing[0]==="n"?-1:1]:[0,0];
// кадр атаки героя: hero_atk_<se|ne>_<0..2> (48×48), влево — зеркально
function atkFrame(t){ return t<0.12?0:t<0.24?1:2; }
const ATK_FRAMES={s:[0,1,2], n:[0,1,1]};
function atkSprite(facing,t,hue){
  const fr=ATK_FRAMES[facing[0]][atkFrame(t)];
  let name=`hero_atk_${facing}_${fr}`, mirror=false;
  if(!img[name]&&facing[1]==="w"){ name=`hero_atk_${facing[0]}e_${fr}`; mirror=true; }
  return img[name]?{sp:heroSprite(name,hue),mirror}:null;
}
// иконки добычи кодом (если GPT ещё не нарисовал)

