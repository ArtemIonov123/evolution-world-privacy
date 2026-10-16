// ================= Острова и переходы между картами =================
// Зоны: "island" (главный остров), "cave" (пещера) и свои — z<id> (world/zones). У каждой своя карта (world/map_<id>).
// Переходы (world/links): клетка на одной карте → другая карта. Прибытие — у обратного перехода, иначе в точке старта.
// Оба списка кэшируются в браузере: при загрузке зона и место появления известны сразу, ещё до базы.
const ZID=/^z[a-z0-9]{4,10}$/, LID=/^l[a-z0-9]{4,12}$/, LINK_LOOKS=["portal","cave","ladder"];
let ZONES=ZONES0, LINKS={};
try{ const l=JSON.parse(localStorage.getItem("island_links")||"{}"); if(l&&typeof l==="object") LINKS=l; }catch(e){}
const zoneOk=z=>z==="island"||z==="cave"||ZID.test(z||"");
const zoneKind=z=>z==="cave"?"cave":z==="island"?"island":(ZONES[z]&&ZONES[z].k)||"island";
const allZones=()=>["island","cave",...Object.keys(ZONES)];
// где другой игрок: «на острове» / «в пещере»; если кто-то на своём острове (или я там) — по названию
function zoneWhere(z){ if(!CUSTOMZ&&z==="cave") return tr("where_cave"); if(!CUSTOMZ&&z==="island") return tr("where_island"); return zoneName(z); }
function zoneName(z){ if(z==="island") return tr("zn_main"); if(z==="cave") return tr("zn_cave"); const o=ZONES[z]; return o?((LANG==="ru"?o.ru:o.pl)||o.ru):"?"; }
function znSanitize(id,o){
  if(!ZID.test(id)||!o||typeof o!=="object") return null; const ru=itClean(o.ru).slice(0,24), pl=itClean(o.pl).slice(0,24)||ru; if(!ru&&!pl) return null;
  return {ru:ru||pl,pl,k:o.k==="cave"?"cave":"island",w:Math.max(12,Math.min(32,itNum(o.w,32)||20)),d:Math.max(12,Math.min(32,itNum(o.d,32)||20))};
}
function lkSanitize(id,o){
  if(!LID.test(id)||!o||typeof o!=="object"||!zoneOk(o.z)||!zoneOk(o.to)||o.z===o.to) return null;
  if(!Number.isInteger(o.x)||!Number.isInteger(o.y)||o.x<0||o.y<0||o.x>60||o.y>60) return null;
  return {z:o.z,x:o.x,y:o.y,to:o.to,look:LINK_LOOKS.includes(o.look)?o.look:"portal"};
}
let zonesLoaded=false;
function applyZones(d){
  const list=d&&d.list&&typeof d.list==="object"?d.list:{}; const z={};
  for(const [id,o] of Object.entries(list).slice(0,40)){ const v=znSanitize(id,o); if(v) z[id]=v; }
  ZONES=z; zonesLoaded=true; try{ localStorage.setItem("island_zones",JSON.stringify(z)); }catch(e){}
  if(ZID.test(ZONE)&&!ZONES[ZONE]&&!fainting){ setTimeout(()=>travelTo("island",""),300); return; }   // остров удалили — домой
  if(winKind==="admin_zones"||winKind==="admin_mobs"||winKind==="admin_bosses") renderWin(); try{ renderPlayers(); }catch(e){}
}
function applyLinks(d){
  const list=d&&d.list&&typeof d.list==="object"?d.list:{}; const l={};
  for(const [id,o] of Object.entries(list).slice(0,200)){ const v=lkSanitize(id,o); if(v) l[id]=v; }
  LINKS=l; try{ localStorage.setItem("island_links",JSON.stringify(l)); }catch(e){}
  markLinks(); if(winKind==="admin_zones") renderWin(); if(EDIT) edRender();
}
function markLinks(){
  for(const c of cells) if(c.link){ c.link=null; refreshBlocked(c); }
  for(const [id,l] of Object.entries(LINKS)){ if(l.z!==ZONE) continue; const c=cellAt(l.x,l.y); if(!c||wet(c)) continue; c.link=id; c.blocked=true; }
  try{ dirty=true; }catch(e){}   // при самой первой разметке цикл игры ещё не объявлен
}
markLinks();
// появление после перехода: у обратного перехода
{ const sp=window.__spawnReq||"";
  if(sp.startsWith("link:")){ const from=sp.slice(5), L=Object.values(LINKS).find(l=>l.z===ZONE&&l.to===from), t=L&&cellAt(L.x,L.y);
    const spot=t&&[...Array(9)].map((_,i)=>cellAt(t.x+(i%3)-1,t.y+((i/3)|0)-1)).filter(n=>n&&!n.blocked&&!wet(n)&&Math.abs(walkZ(n)-walkZ(t))<=1)
      .sort((a,b)=>depthOf(b.x-MX,b.y-MY)-depthOf(a.x-MX,a.y-MY))[0];
    if(spot){ hero.x=spot.x; hero.y=spot.y; hero.z=walkZ(spot); SPAWN_FIXED=true; }
    else if(ZID.test(ZONE)){ const s=cellAt(MAP.start[0],MAP.start[1]); if(s){ hero.x=s.x; hero.y=s.y; hero.z=walkZ(s); SPAWN_FIXED=true; } } }
  else if(sp==="start"){ const s=cellAt(MAP.start[0],MAP.start[1]); if(s){ hero.x=s.x; hero.y=s.y; hero.z=walkZ(s); SPAWN_FIXED=true; } } }
// переход на другую карту: свежую карту забираем заранее, чтобы не мигала старая
async function travelTo(z,spawn,reedit){
  if(!zoneOk(z)||(z===ZONE&&!reedit)||fainting) return;
  fainting=true; hero.path=[]; document.getElementById("fade").style.opacity="1"; say("zn_going",null,{z:zoneName(z)});
  saveNow();
  try{ if(ZID.test(z)&&NET.db){ const s=await NET.db.doc("world/map_"+z).get(); const d=s.exists?s.data():null;
      if(d&&typeof d.m==="string"&&typeof d.v==="number") localStorage.setItem(mapKey(z),JSON.stringify({v:d.v,m:JSON.parse(d.m)})); } }catch(e){}
  try{ sessionStorage.setItem("island_zone",z); sessionStorage.setItem("island_spawn",spawn||""); if(reedit) sessionStorage.setItem("island_reedit","map"); }catch(e){}
  setTimeout(()=>location.reload(),700);
}
function useLink(id){ const L=LINKS[id]; if(!L) return; travelTo(L.to,"link:"+ZONE); }
// отрисовка перехода: портал (кодом), вход в пещеру, лестница наверх (спрайты пещеры, если есть)
function drawLink(c){
  const L=LINKS[c.link]; if(!L) return;
  worldTransform(); ctx.imageSmoothingEnabled=false;
  const [px,py]=proj(c.x-MX,c.y-MY,c.L);
  const sprite=L.look==="cave"?img.cave_entrance:L.look==="ladder"?img.cave_exit:null;
  if(sprite) ctx.drawImage(sprite,Math.round(px-sprite.width/2),Math.round(py-sprite.height+12));
  else if(L.look==="ladder"){ ctx.save(); ctx.globalAlpha=0.28+0.06*Math.sin(T*2); ctx.fillStyle="#fff2c8";
    ctx.beginPath(); ctx.moveTo(px-10,py-70); ctx.lineTo(px+10,py-70); ctx.lineTo(px+18,py+4); ctx.lineTo(px-18,py+4); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.fillStyle="#6a4422"; ctx.fillRect(Math.round(px-7),Math.round(py-62),2,64); ctx.fillRect(Math.round(px+5),Math.round(py-62),2,64); }
  else if(L.look==="cave"){ const R=(x,y,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(Math.round(px+x),Math.round(py+y),w,h)};
    for(const [x,y,w,h] of [[-22,-14,14,14],[-14,-26,12,14],[-4,-32,12,12],[8,-26,12,14],[14,-14,10,14],[-20,-4,40,8]]){ R(x-1,y-1,w+2,h+2,"#1b1528"); R(x,y,w,h,"#8a8494"); R(x,y,w,2,"#aaa4b4"); }
    R(-9,-20,18,20,"#1b1528"); R(-7,-18,14,18,"#0a0710"); }
  else {   // портал: светящееся кольцо с искрами
    const k=0.5+0.5*Math.sin(T*3), cy=py-22;
    ctx.save(); ctx.globalAlpha=0.35; ctx.fillStyle="#1b1528"; ctx.beginPath(); ctx.ellipse(px,py,14,5,0,0,Math.PI*2); ctx.fill(); ctx.restore();
    ctx.lineWidth=4; ctx.strokeStyle="#1b1528"; ctx.beginPath(); ctx.ellipse(px,cy,11,19,0,0,Math.PI*2); ctx.stroke();
    ctx.lineWidth=2; ctx.strokeStyle=`rgb(${150+80*k|0},${120+60*k|0},255)`; ctx.beginPath(); ctx.ellipse(px,cy,11,19,0,0,Math.PI*2); ctx.stroke();
    ctx.save(); ctx.globalAlpha=0.35+0.25*k; ctx.fillStyle="#9a7bff"; ctx.beginPath(); ctx.ellipse(px,cy,9,17,0,0,Math.PI*2); ctx.fill(); ctx.restore();
    for(let i=0;i<5;i++){ const a=T*1.7+i*1.26, r=13+((T*9+i*3)%6); ctx.fillStyle=i%2?"#e8e0ff":"#b8a0ff"; ctx.fillRect(Math.round(px+Math.cos(a)*r*0.7),Math.round(cy+Math.sin(a)*r),2,2); } }
  // подпись: куда ведёт
  const near=Math.hypot(hero.x-c.x,hero.y-c.y)<6||EDIT;
  if(near){ const txt="→ "+zoneName(L.to); ctx.font="8px Silkscreen, monospace"; ctx.textAlign="center"; ctx.textBaseline="bottom";
    const yy=Math.round(py-(L.look==="portal"?46:58)); ctx.lineWidth=3; ctx.strokeStyle="#1b1528"; ctx.strokeText(txt,Math.round(px),yy); ctx.fillStyle="#ffe9a8"; ctx.fillText(txt,Math.round(px),yy); }
}
function pickLink(wx,wy){
  for(const [id,L] of Object.entries(LINKS)){ if(L.z!==ZONE) continue; const c=cellAt(L.x,L.y); if(!c||c.link!==id) continue;
    const [fx,fy]=proj(c.x-MX,c.y-MY,c.L); if(Math.abs(wx-fx)<=20&&wy>=fy-(L.look==="portal"?44:56)&&wy<=fy+8) return c; }
  return null;
}
// редактор карты: поставить / убрать переход (сохраняется сразу)
function lkWrite(list){ applyLinks({list}); if(NET.db) NET.db.doc("world/links").set({list}).catch(()=>{}); }
function lkAddAt(c,to){
  if(!c||wet(c)||c.portal||c.hutPart||c.npcHere||c.merchHere||c.stall||c.st||c.props.some(n=>BLOCKING.has(n))||!zoneOk(to)||to===ZONE) return false;
  const list={}; for(const [k,v] of Object.entries(LINKS)) if(!(v.z===ZONE&&v.x===c.x&&v.y===c.y)) list[k]=v;
  const look=zoneKind(to)==="cave"&&zoneKind(ZONE)!=="cave"?"cave":zoneKind(ZONE)==="cave"&&zoneKind(to)!=="cave"?"ladder":"portal";
  list["l"+Math.random().toString(36).slice(2,10).replace(/[^a-z0-9]/g,"x")]={z:ZONE,x:c.x,y:c.y,to,look};
  lkWrite(list); say("zn_link_placed",null,{z:zoneName(to)}); return true;
}
function lkDelAt(c){ const list={}; let hit=false; for(const [k,v] of Object.entries(LINKS)){ if(v.z===ZONE&&v.x===c.x&&v.y===c.y){ hit=true; continue; } list[k]=v; }
  if(hit) lkWrite(list); return hit; }
