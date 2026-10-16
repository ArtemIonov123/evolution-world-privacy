// ---- моё присутствие: что видят другие ----
let lastSent=0, lastPresJSON="", myChat=null, biteSeq=0; const bites=[];
// АФК: вкладка свёрнута или 10 минут без касаний — другие игроки нас не видят
const AFK_MS=10*60*1000; let lastInput=Date.now();
for(const ev of ["pointerdown","keydown","wheel"]) addEventListener(ev,()=>{ lastInput=Date.now(); },{passive:true,capture:true});
const isAfk=()=>document.hidden||Date.now()-lastInput>AFK_MS;
document.addEventListener("visibilitychange",()=>{ if(!document.hidden) lastInput=Date.now(); lastSent=0; lastPresJSON=""; try{ sendPresence(performance.now()); }catch(e){} });
function myAct(){
  if(fishing) return {k:"f",bx:+fishing.bx.toFixed(2),by:+fishing.by.toFixed(2)};
  if(chopping) return {k:"c",tx:chopping.tree.x,ty:chopping.tree.y};
  return null;
}
function sendPresence(now){
  if(!NET.room||now-lastSent<100) return; lastSent=now;
  const p={v:1,x:+hero.x.toFixed(2),y:+hero.y.toFixed(2),z:+hero.z.toFixed(2),f:convF(hero.facing,quarter(),0),m:hero.moving?1:0,c:myHueIdx,hp:hero.hp,
    id:NET.myId,n:myNick,act:myAct(),chat:myChat,zn:ZONE,hm:HP_MAX,cl:heroClass,fm:form?form[0]:null,sh:shieldT>0?1:0,hl:healOut.length?healOut.slice(-6):null,pj:partyLead,pk:myPartyKey(),pd:myDisband&&Date.now()-myDisband<60000?myDisband:0,kk:myKicks.length?myKicks.map(k=>k.u):null,inv:myInvite&&Date.now()-myInvite.ts<30000?myInvite:null,xs:NET.host&&xsList.length?xsList.slice(-8):null,hurt:hero.hurtAt||0,an:null,bt:null,ak:hero.atk?1:0,ht:myHits.length?myHits.slice(-6):null,kl:null,lv:heroLevel(),afk:isAfk()?1:0};
  if(NET.host&&remotes.size){
    p.an=animals.filter(a=>!a.dead).slice(0,16).map(a=>({i:a.nid,k:KIND_CODE[a.kind]||(CMOBS[a.kind]?a.kind:"h"),sn:a.stunT>0?1:0,tg:a.slamT>0?+a.slamT.toFixed(2):0,fy:+(a.fly||0).toFixed(2),x:+a.x.toFixed(2),y:+a.y.toFixed(2),z:+a.z.toFixed(2),
      f:convF(a.facing,quarter(),0),m:a.moving?1:0,a:+a.alpha.toFixed(2),l:a.lunge>0?1:0,h:a.howlT>0?1:0,lv:a.leaving?1:0,hp:a.hp??mobHp(a.kind),hu:a.hurtT>0?1:0,dy:a.dying>0?1:0}));
    p.bt=bites.slice(-6); p.kl=kills.length?kills.slice(-6):null;
  }
  const j=JSON.stringify(p); if(j===lastPresJSON) return; lastPresJSON=j;
  NET.room.presence(p).catch(()=>{});
}

// ---- другие игроки ----
const away=new Map();   // игроки в другой зоне (на острове / в пещере): только в списке
function onPeersChange(change){
  const me=change.peers.find(p=>p.sameTab); if(me) NET.myPeer=me.peer;
  const seen=new Set(); away.clear(); online.clear();
  for(const p of change.peers){
    if(p.sameTab||p.kind!=="viewer") continue;
    const pr=p.presence||{}; if(pr.v!==1||pr.afk===1) continue;   // АФК (свернул игру или долго бездействует) — как будто нет
    const zn=pr.zn==="cave"?"cave":"island", uid=(typeof pr.id==="string"&&pr.id.length<80&&pr.id)||p.by||null;
    if(uid&&uid!==NET.myId){ const str=v=>typeof v==="string"&&v.length<80?v:null;
      online.set(uid,{uid,peer:p.peer,nick:nickOf(pr.n),c:num(pr.c|0,0,PLAYER_HUES.length-1,0)|0,hp:num(pr.hp,0,99,5)|0,hm:num(pr.hm,1,99,5)|0,zn,lv:num(pr.lv|0,1,99,1),
        pj:str(pr.pj),pk:str(pr.pk),pd:num(pr.pd,0,1e15,0),kk:Array.isArray(pr.kk)?pr.kk.slice(0,6).map(String):[],
        inv:pr.inv&&typeof pr.inv==="object"&&str(pr.inv.to)?{to:pr.inv.to,lead:str(pr.inv.lead),ts:num(pr.inv.ts,0,1e15,0)}:null}); }
    if(zn!==ZONE){ away.set(p.peer,{nick:nickOf(pr.n),c:num(pr.c|0,0,PLAYER_HUES.length-1,0)|0,zn,by:p.by||null}); continue; }
    seen.add(p.peer);
    let r=remotes.get(p.peer);
    const x=num(pr.x,-1,W,MX), y=num(pr.y,-1,D,MY);
    if(!r){ r={kind:"player",peer:p.peer,x,y,z:num(pr.z,0,12,1),phase:0,chatSeen:null,chatAt:0,isNew:true}; remotes.set(p.peer,r); if(NET.myPeer) say("player_joined"); }
    r.tx=x; r.ty=y; r.tz=num(pr.z,0,12,r.z); r.f=FACINGS.includes(pr.f)?convF(pr.f,0,quarter()):"se"; r.m=pr.m===1; r.c=num(pr.c|0,0,PLAYER_HUES.length-1,0)|0;
    r.hp=num(pr.hp,0,HP_MAX,HP_MAX); r.hurt=num(pr.hurt,0,1e15,0); r.nick=nickOf(pr.n);
    r.by=p.by||(typeof pr.id==="string"&&pr.id.length<80?pr.id:null);
    r.act=pr.act&&typeof pr.act==="object"?{k:pr.act.k==="f"?"f":pr.act.k==="c"?"c":null,bx:num(pr.act.bx,-1,W,0),by:num(pr.act.by,-1,D,0),tx:num(pr.act.tx,0,W,0)|0,ty:num(pr.act.ty,0,D,0)|0}:null;
    const ch=pr.chat&&typeof pr.chat==="object"&&typeof pr.chat.t==="string"?{t:pr.chat.t.slice(0,90),ts:num(pr.chat.ts,0,1e15,0)}:null;
    if(ch&&(!r.chatSeen||r.chatSeen.ts!==ch.ts)){ r.chatSeen=ch; r.chatAt=performance.now(); }
    r.an=Array.isArray(pr.an)?pr.an.slice(0,10):null; r.bt=Array.isArray(pr.bt)?pr.bt.slice(0,6):null;
    r.pk=typeof pr.pk==="string"&&pr.pk.length<80?pr.pk:null; r.uid=uid;
    r.cl=CLASSES.includes(pr.cl)?pr.cl:null; r.fm=pr.fm==="b"||pr.fm==="w"?pr.fm:null; r.sh=pr.sh===1; r.hl=Array.isArray(pr.hl)?pr.hl.slice(0,6):null;
    r.lv=num(pr.lv|0,1,99,1); r.ht=Array.isArray(pr.ht)?pr.ht.slice(0,6):null; r.kl=Array.isArray(pr.kl)?pr.kl.slice(0,6):null;
    if(pr.ak===1&&!r.ak) r.akT=0; r.ak=pr.ak===1;
  }
  for(const k of [...remotes.keys()]) if(!seen.has(k)){ remotes.delete(k); const el=document.getElementById("tag-"+k); if(el) el.remove(); }
  // свой цвет: если такой уже у игрока с меньшим peer — берём первый свободный
  const taken=new Set([...remotes.values()].filter(r=>NET.myPeer&&r.peer<NET.myPeer).map(r=>r.c));
  if(taken.has(myHueIdx)){ for(let i=0;i<PLAYER_HUES.length;i++){ const k=(myHueIdx+i)%PLAYER_HUES.length; if(!taken.has(k)){ myHueIdx=k; break; } } }
  // «хозяин» зверей — игрок с наименьшим peer
  const cands=[NET.myPeer,...seen].filter(Boolean).sort();
  const wasHost=NET.host; NET.hostPeer=cands[0]||NET.myPeer; NET.host=!NET.hostPeer||NET.hostPeer===NET.myPeer;
  if(NET.host&&!wasHost) for(const a of animals){ a.path=[]; a.think=0; a.state=""; }
  partyTick(); renderPlayers();
}
function updateRemotes(dt){
  const k=Math.min(1,dt*9);
  for(const r of remotes.values()){
    if(Math.hypot(r.tx-r.x,r.ty-r.y)>3){ r.x=r.tx; r.y=r.ty; }
    r.x+=(r.tx-r.x)*k; r.y+=(r.ty-r.y)*k; r.z+=(r.tz-r.z)*k;
    r.phase=r.m?r.phase+dt*HERO_SPEED*Math.PI*1.6:0;
    if(r.ak) r.akT=((r.akT||0)+dt)%ATK_CD;
  }
  // звери от хозяина и укусы по мне
  if(NET.room&&!NET.host){
    const h=remotes.get(NET.hostPeer); if(h){ mirrorAnimals(h,dt); checkMyKills(h); checkXpShares(h); }
  }
}
let lastBite={};
function mirrorAnimals(h,dt){
  const list=h.an||[], ids=new Set();
  for(const e of list){
    if(!e||typeof e!=="object") continue;
    const id=String(e.i).slice(0,20); ids.add(id);
    let a=animals.find(x=>x.nid===id);
    const kind=CODE_KIND[e.k]||(CMOBS[e.k]?e.k:null); if(!kind){ ids.delete(id); continue; }
    if(!a){ a={kind,nid:id,x:num(e.x,-1,W,0),y:num(e.y,-1,D,0),z:num(e.z,0,12,1),path:[],speed:1.5,facing:"se",phase:0,think:1,alpha:0,leaving:false,state:"",attackT:1,lunge:0,howlT:0,fleeing:0}; animals.push(a); }
    a.tx=num(e.x,-1,W,a.x); a.ty=num(e.y,-1,D,a.y); a.tz=num(e.z,0,12,a.z); a.facing=FACINGS.includes(e.f)?convF(e.f,0,quarter()):a.facing; a.moving=e.m===1;
    a.alpha+=(num(e.a,0,1,1)-a.alpha)*Math.min(1,dt*6); a.leaving=e.lv===1;
    if(e.l===1&&a.lunge<=0){ a.lunge=0.25; }
    if(e.h===1) a.howlT=Math.max(a.howlT,0.5);
    a.hp=num(e.hp,0,999,mobHp(a.kind)); if(a.kind==="bat") a.fly=num(e.fy,0,6,1.5); if(e.hu===1) a.hurtT=Math.max(a.hurtT||0,0.12);
    if(e.dy===1){ if(!(a.dying>0)) a.dying=2.4; } else a.dying=0;
    a.stunT=e.sn===1?Math.max(a.stunT||0,0.25):0;
    if(a.kind==="golem"){ const tg=num(e.tg,0,3,0); if(a.slamT>0&&tg<=0) a.slamFx=0.5; a.slamT=tg; }
  }
  for(let i=animals.length-1;i>=0;i--){ const a=animals[i]; if(!ids.has(a.nid)) animals.splice(i,1); }
  const k=Math.min(1,dt*8);
  for(const a of animals){ if(a.tx===undefined) continue;
    if(Math.hypot(a.tx-a.x,a.ty-a.y)>3){a.x=a.tx;a.y=a.ty;}
    a.x+=(a.tx-a.x)*k; a.y+=(a.ty-a.y)*k; a.z+=(a.tz-a.z)*k;
    a.phase=a.moving?a.phase+dt*(a.kind==="wolf"?2.5:2)*4:0;
    a.lunge=Math.max(0,a.lunge-dt); a.howlT=Math.max(0,a.howlT-dt); a.hurtT=Math.max(0,(a.hurtT||0)-dt);
    if(a.dying>0) a.moving=false;
    if(a.lunge>0) a.lungeTo=[hero.x,hero.y];
  }
  for(const b of h.bt||[]){
    if(!b||b.p!==NET.myPeer) continue; const s=num(b.s,0,1e9,0);
    if(s>(lastBite[NET.hostPeer]||0)){ lastBite[NET.hostPeer]=s;
      const w=animals.filter(isMob).sort((p,q)=>Math.hypot(p.x-hero.x,p.y-hero.y)-Math.hypot(q.x-hero.x,q.y-hero.y))[0];
      hurtHero(num(b.n,1,5,1)|0,w||null); }
  }
  hero.hurtT=Math.max(0,hero.hurtT-dt);
}
// цели для зверей: я и все остальные игроки
function playersForAI(){
  const L=[{x:hero.x,y:hero.y,hp:fainting?0:hero.hp,me:true,peer:NET.myPeer,busy:dialogOpen||EDIT,cl:heroClass,tn:shieldT>0,fw:form==="wolf"}];
  for(const r of remotes.values()) L.push({x:r.tx,y:r.ty,hp:r.hp,me:false,peer:r.peer,busy:false,cl:r.cl,tn:!!r.sh,fw:r.fm==="w"});
  return L;
}
function biteTarget(tp,a,n=1){
  if(a&&!CMOBS[a.kind]&&a.kind!=="golem"&&CFG.mobDmg&&CFG.mobDmg[a.kind]>0) n=CFG.mobDmg[a.kind];
  if(tp.me){ hurtHero(n,a); return; }
  biteSeq++; bites.push({p:tp.peer,s:biteSeq,n}); if(bites.length>6) bites.shift();
}
function updateAnimalsNet(dt){ if(!NET.room||NET.host){ if(NET.room) processRemoteHits(); updateAnimals(dt); } }

// ---- подписи над головами и облачка чата (HTML поверх холста: чёткий текст на любом языке) ----
const names={};
async function resolveNames(){
  if(!NET.user) return;
  const ids=[...remotes.values(),...sleepers.values()].map(r=>r.by).filter(Boolean); if(!ids.length) return;
  try{ const ps=await NET.user.profiles(ids); for(const id of ids) names[id]=ps[id]&&ps[id].name||""; }catch(e){}
  renderPlayers();
}
function playerName(r){ return r.nick||(r.by&&names[r.by])||tr("someone"); }
