// ================= Группа (пати) =================
// лидер — тот, к кому присоединились (pj участников = id лидера); всё — через «присутствие», без базы
const online=new Map();          // uid -> сведения о каждом игроке в сети (любая зона)
const PARTY_MAX=4, partyKeyLS="pa_party_"+(window.__islandWorld||"c")+"_"+(()=>{ try{ return localStorage.getItem("pa_uid")||""; }catch(e){ return ""; } })();
let partyPdSeen=null, partyLead=null, partyJoinTs=0, myInvite=null, myDisband=0, selPlayer=null, partyAsk=null, partyMissT=0, lastLeadZn=null;
const myKicks=[], xsList=[]; let xsSeq=0; const lastXs={}; const answered=new Set(); const invSeen=new Map();
try{ const o=JSON.parse(localStorage.getItem(partyKeyLS)||"null"); if(o&&typeof o.lead==="string"&&Date.now()-(o.j||0)<6*3600e3){ partyLead=o.lead; partyJoinTs=o.j; } }catch(e){}
const savePartyLS=()=>{ try{ partyLead?localStorage.setItem(partyKeyLS,JSON.stringify({lead:partyLead,j:partyJoinTs})):localStorage.removeItem(partyKeyLS); }catch(e){} };
const followersOf=L=>[...online.values()].filter(o=>o.pj===L);
function myPartyKey(){ if(partyLead) return partyLead; return NET.myId&&followersOf(NET.myId).length?NET.myId:null; }
function partyMembers(){   // [{uid,me,o}] — лидер первым
  const L=myPartyKey(); if(!L) return [];
  const out=[], add=uid=>{ if(out.some(m=>m.uid===uid)) return; out.push({uid,me:uid===NET.myId,o:online.get(uid)||null}); };
  add(L); for(const o of followersOf(L)) add(o.uid); if(partyLead) add(NET.myId);
  return out;
}
const inMyParty=uid=>!!uid&&!!myPartyKey()&&partyMembers().some(m=>m.uid===uid);
function leaveParty(silent){
  if(partyLead){ partyLead=null; partyJoinTs=0; savePartyLS(); if(!silent) say("party_left"); }
  else if(myPartyKey()){ myDisband=Date.now(); if(!silent) say("party_disband"); }
  selPlayer=null; lastPresJSON=""; renderPlayers(); renderParty();
}
function invitePlayer(uid){
  const L=myPartyKey()||NET.myId; if(partyMembers().length>=PARTY_MAX){ say("party_full"); return; }
  if(partyLead&&partyLead!==NET.myId){ /* участник зовёт в группу лидера */ }
  for(let i=myKicks.length-1;i>=0;i--) if(myKicks[i].u===uid) myKicks.splice(i,1);
  myInvite={to:uid,lead:L,ts:Date.now()}; myDisband=0; selPlayer=null; lastPresJSON=""; say("party_invited"); renderPlayers();
}
function kickPlayer(uid){ myKicks.push({u:uid,t:Date.now()}); while(myKicks.length>6) myKicks.shift(); selPlayer=null; lastPresJSON=""; renderPlayers(); }
function acceptInvite(){
  const a=partyAsk; if(!a) return; partyAsk=null; renderPartyAsk();
  if(a.kind==="follow"){ travelZone(a.zn); return; }
  answered.add(a.key);
  const size=1+followersOf(a.lead).length; if(size>=PARTY_MAX){ say("party_full"); return; }
  partyLead=a.lead; partyJoinTs=Date.now(); partyPdSeen=null; savePartyLS(); lastPresJSON=""; say("party_joined","party_joined_sub"); renderPlayers(); renderParty();
}
function declineInvite(){ if(partyAsk&&partyAsk.key) answered.add(partyAsk.key); partyAsk=null; renderPartyAsk(); }
function travelZone(zn){
  if(CUSTOMZ||ZID.test(zn)){ travelTo(zn,"start"); return; }
  if(zn===ZONE||fainting) return; fainting=true; hero.path=[]; document.getElementById("fade").style.opacity="1"; say(zn==="cave"?"cave_enter":"cave_leave");
  saveNow(); try{ sessionStorage.setItem("pa_zone",zn); sessionStorage.setItem("pa_spawn","portal"); }catch(e){}
  setTimeout(()=>location.reload(),1100);
}
function partyTick(){
  const now=Date.now();
  while(myKicks.length&&now-myKicks[0].t>60000) myKicks.shift();
  if(partyLead){
    const L=online.get(partyLead);
    if(!L){ if(!partyMissT) partyMissT=now; if(now-partyMissT>45000){ partyMissT=0; leaveParty(true); say("party_disband"); } }
    else { partyMissT=0;
      if(partyPdSeen===null) partyPdSeen=L.pd;
      if(L.pd&&L.pd!==partyPdSeen){ partyLead=null; partyPdSeen=null; savePartyLS(); say("party_disband"); }
      else if(L.kk.includes(NET.myId)&&now-partyJoinTs>3000){ partyLead=null; savePartyLS(); say("party_kicked"); }
      else if(L.pj===NET.myId){ partyLead=null; savePartyLS(); }      // лидер сам вступил ко мне — разрываем петлю
      else { if(lastLeadZn&&L.zn!==lastLeadZn&&L.zn!==ZONE&&!partyAsk) partyAsk={kind:"follow",zn:L.zn,nick:L.nick}; lastLeadZn=L.zn; } } }
  // приглашения мне
  if(!partyAsk&&!myPartyKey()) for(const o of online.values()){
    if(!o.inv||o.inv.to!==NET.myId||!o.inv.lead) continue; const key=o.uid+":"+o.inv.ts; if(answered.has(key)) continue;
    if(!invSeen.has(key)) invSeen.set(key,now); if(now-invSeen.get(key)>30000) continue;
    partyAsk={kind:"invite",key,lead:o.inv.lead,nick:o.nick||tr("someone")}; break; }
  if(partyAsk&&partyAsk.kind==="invite"&&now-(invSeen.get(partyAsk.key)||now)>30000) partyAsk=null;
  if(myInvite&&now-myInvite.ts>30000) myInvite=null;
  renderPartyAsk(); renderParty();
}
setInterval(()=>{ if(NET.room) partyTick(); },1000);
function playerMenu(uid){
  const box=mkEl("div","pmenu"), b=(k,fn)=>{ const x=mkEl("button","btn mini",tr(k)); x.type="button"; x.onclick=e=>{ e.stopPropagation(); fn(); }; box.appendChild(x); };
  const me=uid==="me", o=online.get(uid), L=myPartyKey(), lead=L===NET.myId;
  if(me){ if(L) b(lead?"party_disband_btn":"party_leave",()=>leaveParty()); }
  else {
    if(L&&lead&&o&&o.pj===NET.myId) b("party_kick",()=>kickPlayer(uid));
    else if(o&&!o.pk&&!o.pj&&!inMyParty(uid)&&partyMembers().length<PARTY_MAX) b("party_invite",()=>invitePlayer(uid));
    else if(inMyParty(uid)) box.appendChild(mkEl("small","muted",tr("party_in")));
    if(o&&o.zn!==ZONE&&inMyParty(uid)) b("party_travel",()=>travelZone(o.zn)); }
  b("close",()=>{ selPlayer=null; renderPlayers(); });
  return box;
}
function renderParty(){
  const el=document.getElementById("party"); if(!el) return;
  const ms=partyMembers(); if(!ms.length){ if(!el.hidden){ el.hidden=true; el.textContent=""; } return; }
  el.hidden=false; el.textContent="";
  el.appendChild(mkEl("b",null,tr("party_title")+" · "+ms.length));
  ms.forEach((m,i)=>{ const row=mkEl("div","pm"), o=m.o;
    const hp=m.me?hero.hp:(o?o.hp:0), hm=m.me?HP_MAX:(o?o.hm:5), c=m.me?myHueIdx:(o?o.c:0);
    const sw=mkEl("i"); sw.style.background=hueCss(c); row.appendChild(sw);
    row.appendChild(mkEl("span",null,(i===0?"★ ":"")+(m.me?(myNick||tr("you")):(o?o.nick||tr("someone"):"…"))));
    const bar=mkEl("em","hpb"), fill=mkEl("s"); fill.style.width=Math.round(100*Math.max(0,hp)/Math.max(1,hm))+"%"; bar.appendChild(fill); row.appendChild(bar);
    if(!m.me&&o&&o.zn!==ZONE){ const t=mkEl("button","btn mini zn",zoneWhere(o.zn)); t.type="button"; t.title=tr("party_travel"); t.onclick=()=>travelZone(o.zn); row.appendChild(t); }
    el.appendChild(row); });
}
function renderPartyAsk(){
  const el=document.getElementById("partyAsk"); if(!el) return;
  if(!partyAsk){ el.hidden=true; return; }
  el.hidden=false;
  document.getElementById("partyAskText").textContent=partyAsk.kind==="follow"?tr("party_follow",{n:partyAsk.nick||tr("someone"),w:(ZID.test(partyAsk.zn)||CUSTOMZ)?"\u2192 "+zoneName(partyAsk.zn):"#"+(partyAsk.zn==="cave"?"where_to_cave":"where_to_island")}):tr("party_ask",{n:partyAsk.nick});
  document.getElementById("partyYes").textContent=tr(partyAsk.kind==="follow"?"party_go":"party_yes");
  document.getElementById("partyNo").textContent=tr("party_no");
}
// опыт группе: хозяин зверей раздаёт долю тем, кто в группе убившего и рядом
function shareXP(kind,killer,x,y){
  if(!NET.room) return;
  const kpk=killer===NET.myPeer?myPartyKey():(remotes.get(killer)||{}).pk; if(!kpk) return;
  const amt=Math.max(1,Math.round((xpOf(kind)||0)*0.6)); if(!amt) return;
  if(killer!==NET.myPeer&&myPartyKey()===kpk&&Math.hypot(hero.x-x,hero.y-y)<12) addXP(amt,"fight");
  for(const r of remotes.values()) if(r.peer!==killer&&r.pk===kpk&&Math.hypot(r.tx-x,r.ty-y)<12){ xsList.push({p:r.peer,s:++xsSeq,x:amt}); if(xsList.length>8) xsList.shift(); }
}
function checkXpShares(h){
  for(const e of h.xs||[]){ if(!e||e.p!==NET.myPeer) continue; const s=num(e.s,0,1e9,0);
    if(s>(lastXs[NET.hostPeer]||0)){ lastXs[NET.hostPeer]=s; addXP(num(e.x|0,1,500,1),"fight"); } }
}
function renderPlayers(){
  const el=document.getElementById("players"); if(!el) return;
  if(!NET.room&&!NET.db){ el.hidden=true; return; }
  el.hidden=false;
  const sl=[];   // в списке — только те, кто сейчас в игре
  el.textContent="";
  const head=document.createElement("b"); head.textContent=(CUSTOMZ?zoneName(ZONE):tr(CAVE?"players_title_cave":"players_title"))+" · "+(remotes.size+1+away.size); el.appendChild(head);
  const row=(color,text,off,uid)=>{ const d=document.createElement(uid?"button":"div"); d.className="prow"+(off?" off":"")+(uid?" pick":""); if(uid){ d.type="button"; d.onclick=()=>{ selPlayer=selPlayer===uid?null:uid; renderPlayers(); }; }
    const i=document.createElement("i"); i.style.background=color; const sp=document.createElement("span"); sp.textContent=(inMyParty(uid==="me"?NET.myId:uid)&&myPartyKey()?"◆ ":"")+text; d.append(i,sp); el.appendChild(d);
    if(uid&&selPlayer===uid) el.appendChild(playerMenu(uid)); };
  row(hueCss(myHueIdx),myNick?myNick+" ("+tr("you")+")":tr("you"),false,myPartyKey()?"me":null);
  for(const r of remotes.values()) row(hueCss(r.c),playerName(r),false,r.uid||null);
  for(const a of away.values()){ const uid=[...online.values()].find(o=>o.peer===a.peer)?.uid; row(hueCss(a.c),(a.nick||(a.by&&names[a.by])||tr("someone"))+" · "+zoneWhere(a.zn),true,uid||null); }
  for(const p of sl.slice(0,5)) row(hueCss(p.c),(p.nick||(names[p.by])||tr("someone"))+" · "+tr("sleeping")+" "+agoText(p.last),true);
  if([...remotes.values(),...sl].some(r=>r.by&&!(r.by in names))) resolveNames();
}
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function tagFor(id,isMe){
  let el=document.getElementById("tag-"+id);
  if(!el){ el=document.createElement("div"); el.className="tag"; el.id="tag-"+id;
    el.innerHTML='<div class="bubble" hidden></div><div class="nm"></div>'; document.getElementById("tags").appendChild(el); }
  return el;
}
function updateTags(){
  const host=document.getElementById("tags"); if(!host) return;
  const now=performance.now(), r0=cv.getBoundingClientRect();
  const place=(id,x,y,z,label,color,chat,chatAt,isMe)=>{
    const el=tagFor(id,isMe), [px,py]=proj(x-MX,y-MY,z), sx=panX+px*scale, sy=panY+(py-50)*scale;
    const vis=sx>-60&&sx<r0.width+60&&sy>-40&&sy<r0.height+40;
    el.style.display=vis?"":"none"; if(!vis) return;
    el.style.transform=`translate(${Math.round(sx)}px,${Math.round(sy)}px)`;
    const nm=el.querySelector(".nm"); if(nm.textContent!==label) nm.textContent=label; nm.style.borderColor=color; nm.hidden=!label; nm.classList.toggle("mine",isMe);
    const b=el.querySelector(".bubble"), show=chat&&now-chatAt<6500;
    b.hidden=!show; if(show&&b.textContent!==chat.t) b.textContent=chat.t;
  };
  place("me",hero.x,hero.y,hero.z,myNick?"["+heroLevel()+"] "+myNick:"",hueCss(myHueIdx),myChat,myChatAt,true);
  for(const r of remotes.values()) place(r.peer,r.x,r.y,r.z,(inMyParty(r.uid)?"◆ ":"")+(r.lv?"["+r.lv+"] ":"")+playerName(r),hueCss(r.c),r.chatSeen,r.chatAt,false);
  const sl=[], slIds=new Set();   // офлайн-игроки — только в списке «На острове»
  for(const p of sl) place("s-"+p.by,p.x,p.y,p.z-2.6,(p.nick||(names[p.by])||tr("someone"))+" · "+tr("sleeping"),hueCss(p.c),null,0,false);
  for(const p of sleepers.values()) if(!slIds.has(p.by)){ const el=document.getElementById("tag-s-"+p.by); if(el) el.style.display="none"; }
}
let myChatAt=0;
function sendChat(text){
  text=String(text||"").replace(/[\u0000-\u001f\u007f​-‏‪-‮⁠-⁤﻿]/g,"").trim().slice(0,80);
  if(!text) return;
  myChat={t:text,ts:Date.now()}; myChatAt=performance.now(); lastPresJSON="";
  postChat(text);
}

// ---- рисуем другого игрока (вызывается из порядка отрисовки, как зверь) ----
function drawRemote(r){
  worldTransform(); ctx.imageSmoothingEnabled=false;
  if(r.hurt&&Date.now()-r.hurt<600&&Math.floor(Date.now()/70)%2) return;
  const [fx,fy]=proj(r.x-MX,r.y-MY,r.z);
  if(r.sh) drawShieldFx(fx,fy);
  if(r.fm){ drawForm(fx,fy,r.fm==="b"?"bear":"wolf",r.f,r.m,r.phase,!!r.ak); return; }
  ctx.fillStyle="rgba(20,10,40,.28)"; ctx.beginPath(); ctx.ellipse(fx,fy,9,4.5,0,0,Math.PI*2); ctx.fill();
  const frame=r.m?[1,2,3,2][Math.floor(r.phase/Math.PI*2)%4]:0;
  const pre=r.cl==="druid"&&img.druid_se_0?"druid":"hero";
  let name=`${pre}_${r.f}_${frame}`, mirror=false;
  if(!img[name]&&r.f[1]==="w"){ name=`${pre}_${r.f[0]}e_${frame}`; mirror=true; }
  const at=r.ak?Math.min(r.akT||0,ATK_TIME-0.01):-1, as=at>=0?(pre==="druid"?{sp:druidAtk(r.f,r.c),mirror:r.f[1]==="w"}:atkSprite(r.f,at,r.c)):null;
  const sp=as&&as.sp?as.sp:heroSprite(name,r.c); if(as&&as.sp) mirror=as.mirror;
  const [lx,ly]=at>=0?atkLunge(r.f,at):[0,0];
  ctx.save(); ctx.translate(Math.round(fx)+lx,Math.round(fy)+ly); if(mirror) ctx.scale(-1,1);
  if(sp) ctx.drawImage(sp,-Math.round(sp.width/2),-sp.height+2); else { ctx.fillStyle=hueCss(r.c); ctx.fillRect(-5,-28,10,26); }
  ctx.restore();
  if(r.cl==="druid") drawDruidMark(fx,fy,r.f);
  if(at>=0) drawSlash(fx,fy,r.f,at);
  if(at>=0&&!(as&&as.sp)){ ctx.save(); drawClubSwing(fx,fy,r.f[1]==="e"?1:-1,at); ctx.restore(); }
  const dir=r.f[1]==="e"?1:-1;
  if(r.act&&r.act.k==="f"){   // удочка и поплавок
    const c=cellAt(Math.round(r.act.bx),Math.round(r.act.by)), b=proj(r.act.bx-MX,r.act.by-MY,c?walkZ(c):r.z), tip=[fx+dir*17,fy-37];
    pixLine(fx+dir*6,fy-20,tip[0],tip[1],"#9a6430");
    ctx.strokeStyle="rgba(255,255,255,.6)"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(tip[0],tip[1]); ctx.quadraticCurveTo((tip[0]+b[0])/2,Math.max(tip[1],b[1])+6,b[0],b[1]); ctx.stroke();
    drawBobber(b[0],b[1]+Math.round(Math.sin(T*3)*0.7),false);
  }
  if(r.act&&r.act.k==="c"){   // машет топором
    const ph=(T%0.75)/0.75, ang=ph<0.6?-0.3-1.9*(ph/0.6):ph<0.68?-2.2+3.1*((ph-0.6)/0.08):0.9-1.2*((ph-0.68)/0.32);
    ctx.save(); ctx.translate(Math.round(fx+dir*4),Math.round(fy-20)); ctx.scale(dir,1); ctx.rotate(ang);
    ctx.fillStyle="#1b1528"; ctx.fillRect(-1,-2,16,4); ctx.fillRect(11,-6,6,9); ctx.fillStyle="#9a6430"; ctx.fillRect(0,-1,14,2);
    ctx.fillStyle="#b8c0cc"; ctx.fillRect(12,-5,4,7); ctx.restore();
  }
}
function drawEnt(a){ if(a.kind==="player") drawRemote(a); else if(a.kind==="sleeper") drawSleeper(a); else drawAnimal(a); }

