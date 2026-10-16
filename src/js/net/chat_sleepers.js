// ================= Игра по очереди: спящие игроки и история чата =================
const sleepers=new Map();       // id -> {kind:"sleeper", by, x,y,z,c,last}
const chatLog=[];               // [{id,t,by,ts,c}] — последние сообщения из базы
let lastPlayerWrite=0, lastPlayerJSON="", lastReadTs=0;
try{ lastReadTs=+localStorage.getItem("pa_chat_read")||0; }catch(e){}
// моя запись «где я и когда был» — чтобы друзья видели меня спящим, когда меня нет
function tickPlayerDoc(){
  if(!NET.db||!NET.myId) return;
  const now=Date.now(), rec={x:Math.round(hero.x*10)/10,y:Math.round(hero.y*10)/10,z:Math.round(hero.z*10)/10,c:myHueIdx,n:myNick,zn:ZONE,cl:heroClass||"",lv:heroLevel(),tg:window.__islandTG?1:0};
  const j=JSON.stringify(rec);
  if(j===lastPlayerJSON&&now-lastPlayerWrite<60000) return;
  if(now-lastPlayerWrite<3000) return;
  lastPlayerWrite=now; lastPlayerJSON=j;
  NET.db.doc("players/"+NET.myId).set({...rec,last:now}).catch(()=>{});
}
function applyPlayers(docs){
  const now=Date.now(), seen=new Set();
  for(const s of docs){
    if(s.id===NET.myId) continue;
    const d=s.data(); if(!d) continue;
    const last=num(d.last,0,1e15,0); if(now-last>7*24*3600*1000) continue;   // неделю не заходил — не показываем
    if((d.zn||"island")!==ZONE) continue;
    seen.add(s.id);
    let p=sleepers.get(s.id); if(!p){ p={kind:"sleeper",by:s.id,phase:Math.random()*6}; sleepers.set(s.id,p); }
    p.x=num(d.x,0,W-1,MX); p.y=num(d.y,0,D-1,MY); p.c=num(d.c|0,0,PLAYER_HUES.length-1,0)|0; p.last=last; p.nick=nickOf(d.n);
    const c=cellAt(Math.round(p.x),Math.round(p.y)); p.z=c?walkZ(c):num(d.z,0,12,1);
  }
  for(const k of [...sleepers.keys()]) if(!seen.has(k)){ sleepers.delete(k); const el=document.getElementById("tag-s-"+k); if(el) el.remove(); }
  renderPlayers();
}
// спит тот, кого сейчас нет в комнате
const onlineIds=()=>new Set([...remotes.values()].map(r=>r.by).filter(Boolean));
function activeSleepers(){ const on=onlineIds(); return [...sleepers.values()].filter(s=>!on.has(s.by)); }
function agoText(ts){
  const m=Math.max(1,Math.round((Date.now()-ts)/60000));
  if(m<60) return tr("ago_min",{n:m});
  const h=Math.round(m/60); if(h<48) return tr("ago_h",{n:h});
  return tr("ago_d",{n:Math.round(h/24)});
}
function drawSleeper(p){
  worldTransform(); ctx.imageSmoothingEnabled=false;
  const [fx,fy]=proj(p.x-MX,p.y-MY,p.z);
  ctx.fillStyle="rgba(20,10,40,.25)"; ctx.beginPath(); ctx.ellipse(fx,fy,14,5,0,0,Math.PI*2); ctx.fill();
  const sp=heroSprite("hero_se_0",p.c);
  // лежит на боку поверх своей клетки: рост героя идёт вдоль экрана по горизонтали
  ctx.save(); ctx.translate(Math.round(fx),Math.round(fy)-9); ctx.rotate(-Math.PI/2);
  if(sp) ctx.drawImage(sp,-Math.round(sp.width/2),-Math.round(sp.height/2)); else { ctx.fillStyle=hueCss(p.c); ctx.fillRect(-5,-22,10,44); }
  ctx.restore();
  // «Zzz»
  ctx.font="8px Silkscreen, monospace"; ctx.textAlign="left"; ctx.textBaseline="bottom";
  const k=((T*0.6+p.phase)%1);
  ctx.globalAlpha=1-k; ctx.lineWidth=3; ctx.strokeStyle="#1b1528"; ctx.strokeText("z",Math.round(fx+6+k*6),Math.round(fy-14-k*14));
  ctx.fillStyle="#e8e4ff"; ctx.fillText("z",Math.round(fx+6+k*6),Math.round(fy-14-k*14)); ctx.globalAlpha=1;
}

// ---- история чата в базе ----
function postChat(text){
  if(!NET.db) return;
  const ts=Date.now();
  NET.db.collection("chat").doc(ts+"-"+Math.random().toString(36).slice(2,7)).set({t:text,by:NET.myId||"",n:myNick,ts,c:myHueIdx}).catch(()=>{});
}
function applyChat(docs){
  const list=[];
  for(const s of docs){ const d=s.data(); if(!d||typeof d.t!=="string") continue;
    list.push({id:s.id,t:d.t.slice(0,90),by:typeof d.by==="string"?d.by:"",n:nickOf(d.n),ts:num(d.ts,0,1e15,0),c:num(d.c|0,0,PLAYER_HUES.length-1,0)|0}); }
  list.sort((a,b)=>a.ts-b.ts);
  // храним только 40 последних — старые удаляем
  if(list.length>40) for(const m of list.slice(0,list.length-40)) NET.db.collection("chat").doc(m.id).delete().catch(()=>{});
  chatLog.length=0; chatLog.push(...list.slice(-40));
  renderChatLog(); updateUnread(true);
}
function unreadCount(){ return chatLog.filter(m=>m.ts>lastReadTs&&m.by!==NET.myId).length; }
let unreadAnnounced=false;
function updateUnread(fromSnapshot){
  const n=unreadCount(), dot=document.getElementById("chatDot");
  if(dot){ dot.hidden=!n; dot.textContent=n>9?"9+":String(n); }
  if(fromSnapshot&&n&&!unreadAnnounced){ unreadAnnounced=true; say("unread","unread_sub",{n}); }
}
function markChatRead(){
  if(chatLog.length) lastReadTs=Math.max(lastReadTs,chatLog[chatLog.length-1].ts);
  try{ localStorage.setItem("pa_chat_read",String(lastReadTs)); }catch(e){}
  updateUnread(false);
}
function personName(by){ if(by&&by===NET.myId) return tr("you"); return (by&&names[by])||tr("someone"); }
function renderChatLog(){
  const el=document.getElementById("chatLog"); if(!el) return;
  el.textContent="";
  if(!chatLog.length){ const e=document.createElement("div"); e.className="empty"; e.textContent=tr("chat_empty"); el.appendChild(e); return; }
  const ids=[...new Set(chatLog.map(m=>m.by).filter(b=>b&&!(b in names)))];
  if(ids.length&&NET.user) NET.user.profiles(ids).then(ps=>{ for(const id of ids) names[id]=ps[id]&&ps[id].name||""; renderChatLog(); renderPlayers(); }).catch(()=>{});
  for(const m of chatLog.slice(-12)){
    const row=document.createElement("div"); row.className="msg";
    const t=new Date(m.ts), hh=String(t.getHours()).padStart(2,"0")+":"+String(t.getMinutes()).padStart(2,"0");
    const tm=document.createElement("time"); tm.textContent=hh;
    const nm=document.createElement("b"); nm.textContent=(m.by&&m.by===NET.myId)?(myNick||tr("you")):(m.n||personName(m.by)); nm.style.color=hueCss(m.c);
    const tx=document.createElement("span"); tx.textContent=m.t;
    row.append(tm,nm,tx); el.appendChild(row);
  }
  el.scrollTop=el.scrollHeight;
}

