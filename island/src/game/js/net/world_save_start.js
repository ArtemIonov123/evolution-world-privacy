// ================= Общий мир в db =================
let clockDoc=null;
const netClock=()=>clockDoc?(((clockDoc.c0+(Date.now()-clockDoc.t0)/1000/DAY_LEN)%1)+1)%1:null;
function netSetClock(c){ if(!NET.db) return; clockDoc={t0:Date.now(),c0:c}; NET.db.doc("world/clock").set({t0:clockDoc.t0,c0:c}).catch(()=>{}); }
const treeKey=c=>`t_${c.x}_${c.y}`, fireKey=c=>`f_${c.x}_${c.y}`;
function netWrite(path,data){ if(!NET.db) return; NET.db.doc(path).set(data).catch(()=>{}); }
function netTreeGone(c){ netWrite(ZC("trees")+"/"+treeKey(c),{s:"gone",at:Date.now()}); }
function netTreeGrow(c,name){ netWrite(ZC("trees")+"/"+treeKey(c),{s:"grow",k:name,at:Date.now(),dur:Math.round((c.growTime||40)*1000)}); }
function netFire(f){ netWrite(ZC("fires")+"/"+fireKey(f.c),{x:f.c.x,y:f.c.y,until:Math.round(f.until)}); }
function applyTreeDoc(c,d){
  if(!c||!d||typeof d!=="object") return;
  const now=Date.now(), at=num(d.at,0,1e15,now);
  const has=treeName(c);
  if(d.s==="gone"){
    if(!has||c.falling) return;
    if(now-at<3000){ c.falling={t:0,dx:0.6,dy:0.2,name:has}; c.remoteFall=true; }
    else { c.props=c.props.filter(n=>!n.startsWith("tree")); refreshBlocked(c); const i=TREES.findIndex(t=>t.c===c); if(i>=0) TREES.splice(i,1);
      if(now-at<30000) c.stump={t:(now-at)/1000,big:false}; }
  } else if(d.s==="grow"&&(d.k==="tree_big"||d.k==="tree_small")){
    const dur=num(d.dur,5000,600000,40000);
    if(!has){ if(c.water||c.hutPart||c.npcHere||c.merchHere||c.stall||c.fire) return; c.props.push(d.k); refreshBlocked(c); TREES.push({c,big:d.k==="tree_big"}); }
    c.growTime=dur/1000; c.grow=Math.max(0.02,Math.min(1,(now-at)/dur));
  }
}
const fireDocs=new Set();
function applyFires(docs){
  const now=Date.now(), keep=new Set();
  fireDocs.clear();
  for(const s of docs){
    const d=s.data(); if(!d) continue; fireDocs.add(s.id);
    const c=cellAt(num(d.x,0,W-1,0)|0,num(d.y,0,D-1,0)|0); if(!c) continue;
    const until=num(d.until,0,1e15,0);
    if(until<now-10*60*1000){ NET.db.doc(ZC("fires")+"/"+s.id).delete().catch(()=>{}); continue; }   // давно потухшие убираем
    keep.add(c);
    if(c.fire){ if(Math.abs(c.fire.until-until)>500) c.fire.until=until; }
    else if(!c.water&&!c.hutPart&&!c.npcHere&&!treeName(c)){ addFire(c,until,false); }
  }
  for(let i=fires.length-1;i>=0;i--){ const f=fires[i]; if(!keep.has(f.c)&&f.synced){ fires.splice(i,1); f.c.fire=null; refreshBlocked(f.c); } }
  for(const f of fires) if(keep.has(f.c)) f.synced=true;
}
// ---- личное сохранение ----
let saveT=3, saving=false, lastSaveJSON="", forcedNick=null, savedCr=0;
// вход через сервер (подпись Telegram проверена): правила базы защищают кошелёк, баны и настройки мира
const secureOn=()=>!!(window.__islandAuth&&window.__islandAuth.ok);
const INV_MAX_COIN=2e9, INV_MAX=1e6;   // сколько можно хранить: монет/кристаллов и любой другой вещи
async function loadSave(){
  try{
    let s=await NET.db.doc(`data/users/${NET.myId}/save`).get();
    // первый вход через Telegram: переносим прогресс, который был в этом браузере
    if(!s.exists&&window.__islandOldUid){ const o=await NET.db.doc(`data/users/${window.__islandOldUid}/save`).get(); if(o.exists){ s=o; lastSaveJSON=""; saveT=0; } }
    if(!s.exists) return;
    const d=s.data()||{};
    if(d.inv&&typeof d.inv==="object") for(const [k,v] of Object.entries(d.inv)) if(ITEMS.some(it=>it.id===k)&&typeof v==="number"&&v>0&&isFinite(v)) inv[k]=Math.min(k==="coin"?INV_MAX_COIN:INV_MAX,Math.floor(v));
    if(["none","active","done"].includes(d.quest)) quest=d.quest;
    if(["none","active","done"].includes(d.q2)) quest2=d.q2;
    rodLevel=d.rod===2?2:1;
    if(CLASSES.includes(d.cl)) heroClass=d.cl;
    savedCr=Math.floor(num(d.cr,0,INV_MAX_COIN,0)); if(!secureOn()) crystals=savedCr; renderSkills();
    if(d.eq&&typeof d.eq==="object") for(const sl of SLOTS){ const id=d.eq[sl]; equip[sl]=typeof id==="string"&&GEAR[id]&&GEAR[id].slot===sl?id:null; }
    if(d.pg&&typeof d.pg==="object"){ prog.xp=num(d.pg.xp,0,1e7,0)|0;
      for(const k of Object.keys(prog.sk)) prog.sk[k]=num(d.pg.sk&&d.pg.sk[k],0,1e7,0)|0;
      for(const k of Object.keys(prog.st)) prog.st[k]=num(d.pg.st&&d.pg.st[k],0,1e9,0); prog.ri=d.pg.ri?1:0; }
    if(d.rd&&typeof d.rd==="object"){ rodDur=num(d.rd.d,0,9999,0)|0; if(d.rd.w&&typeof d.rd.w==="object") for(const k of RODS) if(typeof d.rd.w[k]==="number") rodWear[k]=Math.max(1,d.rd.w[k]|0); }
    if(equip.rod&&rodDur<=0) rodDur=rodMax(equip.rod);
    if(!equip.weapon&&inv.club){ equip.weapon="club"; inv.club--; if(!inv.club) delete inv.club; }
    recalcHP(); hero.hp=num(d.hp,1,HP_MAX,HP_MAX)|0;
    if(typeof d.nf==="string"&&cleanNick(d.nf).length>=2){ forcedNick=cleanNick(d.nf); setNick(forcedNick,true); }
    else if(myNick&&badNick(myNick)) setNick("Hero"+String(NET.myId||"").slice(-4),true);
    if(!myNick&&typeof d.nick==="string"&&cleanNick(d.nick).length>=2){ setNick(d.nick); const w=document.getElementById("nickWrap"); if(w) w.hidden=true; }
    const c=cellAt(num(d.x,0,W-1,-1)|0,num(d.y,0,D-1,-1)|0);
    if(c&&!c.blocked&&!SPAWN_FIXED&&(d.zn||"island")===ZONE){ hero.x=c.x; hero.y=c.y; hero.z=walkZ(c); hero.path=[]; }
    renderInv(); renderHP(); say(CAVE?"cave_hello":"loaded");
  }catch(e){}
}
function tickSave(dt){
  if(!NET.db||!NET.myId||saving) return;
  saveT-=dt; if(saveT>0) return; saveT=4;
  const s={inv:{...inv},hp:hero.hp,quest,q2:quest2,eq:{...equip},pg:{xp:prog.xp,ri:prog.ri||0,sk:{...prog.sk},st:{...prog.st,time:Math.round(prog.st.time)}},rd:{d:rodDur,w:{...rodWear}},rod:rodLevel,zn:ZONE,cl:heroClass,cr:crystals,x:Math.round(hero.x),y:Math.round(hero.y),nick:myNick}; if(forcedNick) s.nf=forcedNick;
  const j=JSON.stringify(s); if(j===lastSaveJSON) return;
  saving=true; lastSaveJSON=j;
  NET.db.doc(`data/users/${NET.myId}/save`).set(s).catch(()=>{lastSaveJSON="";}).finally(()=>{saving=false;});
}

// ---- запуск ----
async function initNet(){
  if(!window.claude||typeof window.claude.use!=="function"){ ensureStarterRod(); classLoaded=true; return; }
  const safe=p=>Promise.resolve(p).catch(()=>null);
  const [room,db,user]=await Promise.all([safe(claude.use("room")),safe(claude.use("db")),safe(claude.use("user"))]);
  NET.user=user;
  if(user){ try{ NET.myId=await user.id(); }catch(e){} }
  myHueIdx=hashStr(NET.myId||String(Math.random()))%PLAYER_HUES.length;
  if(db){
    NET.db=db;
    db.doc("world/clock").onSnapshot(s=>{
      const d=s.exists?s.data():null;
      if(d&&typeof d.t0==="number"&&typeof d.c0==="number"){ clockDoc={t0:d.t0,c0:d.c0}; lastClockText=""; }
      else if(!s.metadata.fromCache&&!clockDoc) netSetClock(clock);
    },()=>{});
    db.doc(MAP_DOC).onSnapshot(onMapDoc,()=>{});
    if(CAVE) db.doc("world/cave_boss").onSnapshot(s=>{ const d=s.exists?s.data():null; if(d) bossDeadAt=num(d.dead,0,1e15,0); },()=>{});
    db.doc("world/config").onSnapshot(s=>applyConfig(s.exists?s.data():null),()=>{});
    db.collection(ZC("trees")).onSnapshot(snap=>{ netTreeIds.clear(); for(const s of snap.docs){ netTreeIds.add(s.id); const m=/^t_(\d+)_(\d+)$/.exec(s.id); if(m) applyTreeDoc(cellAt(+m[1],+m[2]),s.data()); } },()=>{});
    db.collection(ZC("fires")).onSnapshot(snap=>applyFires(snap.docs),()=>{});
    db.collection("players").onSnapshot(snap=>{ applyPlayers(snap.docs); adCollect(snap.docs); },()=>{});
    db.collection("chat").onSnapshot(snap=>applyChat(snap.docs),()=>{});
    document.getElementById("chatBtn").hidden=false;
    try{ const s=await db.doc("world/items").get(); applyItems(s.exists?s.data():null); }catch(e){}
    db.doc("world/items").onSnapshot(s=>applyItems(s.exists?s.data():null),()=>{});
    try{ const s=await db.doc("world/mobs").get(); applyMobs(s.exists?s.data():null); }catch(e){}
    db.doc("world/mobs").onSnapshot(s=>applyMobs(s.exists?s.data():null),()=>{});
    try{ const s=await db.doc("world/bosses").get(); applyBosses(s.exists?s.data():null); }catch(e){}
    db.doc("world/bosses").onSnapshot(s=>applyBosses(s.exists?s.data():null),()=>{});
    db.doc("world/zones").onSnapshot(s=>{ if(s.metadata&&s.metadata.fromCache&&!s.exists) return; applyZones(s.exists?s.data():null); },()=>{});
    db.doc("world/links").onSnapshot(s=>{ if(s.metadata&&s.metadata.fromCache&&!s.exists) return; applyLinks(s.exists?s.data():null); },()=>{});
    db.doc("world/boss_dead").onSnapshot(s=>applyBossDead(s.exists?s.data():null),()=>{});
    if(NET.myId) await loadSave();
    classLoaded=true;
    if(NET.myId){
      db.doc("admin_ops/"+NET.myId).onSnapshot(s=>{ if(s.exists) applyAdminOp(s.data()); },()=>{});
      db.doc("wallet/"+NET.myId).onSnapshot(s=>{ const d=s.exists?s.data():null;
        if(d&&typeof d.cr==="number") crystals=Math.floor(num(d.cr,0,INV_MAX_COIN,0));
        else if(window.__islandAuth&&window.__islandAuth.admin&&savedCr>0) NET.db.doc("wallet/"+NET.myId).set({cr:savedCr}).catch(()=>{});   // перенос старого счёта админа
        else if(secureOn()) crystals=0;
        lastSaveJSON=""; },()=>{});
      db.doc("world/bans").onSnapshot(s=>{ BANS=(s.exists&&s.data()&&s.data().list)||{}; checkBan(); if(winKind==="admin_pl") renderWin(); },()=>{});
    }
    db.doc("world/nickfilter").onSnapshot(s=>{ const d=s.exists?s.data():null; NICK_EXTRA=d&&Array.isArray(d.w)?d.w.filter(w=>typeof w==="string").map(w=>w.toLowerCase().trim()).filter(Boolean).slice(0,300):[]; },()=>{});
  }
  if(room){
    NET.room=room;
    room.onPeers(onPeersChange,()=>{ NET.room=null; remotes.clear(); renderPlayers(); });
    document.getElementById("chatBtn").hidden=false;
    renderPlayers();
  }
  if(db) initAdmin();
  ensureStarterRod();
}


