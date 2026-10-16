// ---------- Цикл ----------
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
let last=performance.now(), dirty=true;
// одна ошибка в кадре не должна останавливать игру: показываем её и рисуем дальше
let frameErrs=0;
function frame(now){ try{ frameBody(now); }catch(e){ if(frameErrs++<3) showGameError(e&&e.message||e,e&&e.stack?String(e.stack).split("\n").slice(1,4).join("\n"):""); requestAnimationFrame(frame); } }
function frameBody(now){
  const dt=Math.min(0.05,(now-last)/1000); last=now;
  T+=dt; updateWind(dt); updateFishing(dt); updateChopping(dt); updateSmoke(dt); updateNPC(dt); updateMerchant(dt); updateClock(dt); updateFires(dt); prog.st.time+=dt; updateCombat(dt); updateSkills(dt); updateBossBar(); updateAnimalsNet(dt); updateRemotes(dt); updateHitFx(dt); sendPresence(now); tickSave(dt); tickPlayerDoc(); updateFireflies(); syncActions(); syncFishUI(); dirty=true;
  if(anim){
    const t=Math.min(1,(now-anim.t0)/anim.dur), e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    setRot(anim.from+(anim.to-anim.from)*e); if(t>=1){setRot(anim.to);anim=null} dirty=true;
  }
  updateHero(dt);
  if(marker){marker.t+=dt;dirty=true}
  if(hero.moving) dirty=true;
  if(follow){ // камера мягко держит героя в центре
    const r=cv.getBoundingClientRect(), [hx,hy]=proj(hero.x-MX,hero.y-MY,hero.z);
    const tx=r.width/2-hx*scale, ty=r.height/2-(hy-14)*scale;
    const k=Math.min(1,dt*6); const nx=panX+(tx-panX)*k, ny=panY+(ty-panY)*k;
    if(Math.abs(nx-panX)>0.01||Math.abs(ny-panY)>0.01){panX=nx;panY=ny;dirty=true}
  }
  if(dirty){render(now);dirty=false}
  requestAnimationFrame(frame);
}

// ---------- Ввод ----------
// тап по кроне/стволу — это клик по дереву, а не по клетке за ним
function pickTree(mx,my){
  const wx=(mx-panX)/scale, wy=(my-panY)/scale;
  for(let i=cells.length-1;i>=0;i--){
    const c=cells[i], n=treeName(c); if(!n||c.falling) continue;
    const im=img[n], p=proj(c.x-MX,c.y-MY,c.L), s=c.grow;
    if(Math.abs(wx-p[0])<=im.width*0.38*s && wy<=p[1]+4 && wy>=p[1]+4-im.height*0.9*s) return c;
  }
  return null;
}
function pick(mx,my){
  const wx=(mx-panX)/scale, wy=(my-panY)/scale;
  // сверху вниз по порядку отрисовки: ближние клетки перекрывают дальние
  for(let i=cells.length-1;i>=0;i--){
    const q=cellQuad(cells[i]); let inside=false;
    for(let a=0,b=3;a<4;b=a++){const [xa,ya]=q[a],[xb,yb]=q[b]; if((ya>wy)!==(yb>wy)&&wx<(xb-xa)*(wy-ya)/(yb-ya)+xa) inside=!inside;}
    if(inside) return cells[i];
  }
  return null;
}
function rotate(dir){
  rotTarget+=dir; anim={from:rot,to:rotTarget,t0:performance.now(),dur:reduce?1:650}; hover=null;
}
// ---------- Зум: шаги кратны плотности экрана, чтобы пиксели были ровными ----------
let zoomK=2; // сколько физических пикселей экрана на один пиксель игры
const kMin=()=>Math.max(1,Math.round(dprNow()*0.75)), kMax=()=>Math.round(dprNow()*5);
function setZoomK(k,cx,cy){
  const r=cv.getBoundingClientRect(); cx??=r.width/2; cy??=r.height/2;
  k=Math.max(kMin(),Math.min(kMax(),k)); if(k===zoomK&&scale===k/dprNow()) return;
  const ns=k/dprNow();
  panX=cx-(cx-panX)*ns/scale; panY=cy-(cy-panY)*ns/scale; scale=ns; zoomK=k;
  dirty=true;
}
function zoom(d,cx,cy){
  // одна ступень ≈ +50% на компьютере, на телефоне — +1 физ. пиксель
  const step=Math.max(1,Math.round(dprNow()/2));
  setZoomK(zoomK+d*step,cx,cy);
}

// ---------- Ввод: мышь и пальцы ----------
// 1 палец/мышь: тап — идти (или подсечь), протянуть — двигать карту; 2 пальца — щипок-зум и сдвиг
const pointers=new Map(); let drag=null, pinch=null;
const TAP_SLOP=()=>pointers.size&&[...pointers.values()][0].type==="touch"?12:6;
function local(e){const r=cv.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top]}
function stopFollow(){follow=false;document.getElementById("follow").setAttribute("aria-pressed","false")}
cv.addEventListener("pointerdown",e=>{
  cv.setPointerCapture(e.pointerId);
  const [x,y]=local(e); pointers.set(e.pointerId,{x,y,type:e.pointerType});
  if(pointers.size===1){ drag={x,y,px:panX,py:panY,moved:false}; pinch=null; }
  else if(pointers.size===2){
    const [a,b]=[...pointers.values()];
    pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1, k:zoomK, mx:(a.x+b.x)/2, my:(a.y+b.y)/2, px:panX, py:panY};
    if(drag) drag.moved=true;   // второй палец — это уже не тап
    if(EDIT) edStrokeEnd();
    stopFollow();
  }
});
cv.addEventListener("pointermove",e=>{
  const [x,y]=local(e);
  if(pointers.has(e.pointerId)){ const p=pointers.get(e.pointerId); p.x=x; p.y=y; }
  if(pinch&&pointers.size>=2){
    const [a,b]=[...pointers.values()], d=Math.hypot(a.x-b.x,a.y-b.y)||1, mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
    panX=pinch.px+(mx-pinch.mx); panY=pinch.py+(my-pinch.my);   // масштаб зафиксирован: двумя пальцами только двигаем
    dirty=true; return;
  }
  if(drag&&pointers.size===1){
    const dx=x-drag.x, dy=y-drag.y;
    if(!drag.moved&&Math.hypot(dx,dy)>TAP_SLOP()){drag.moved=true;cv.classList.add("drag");stopFollow()}
    if(drag.moved&&EDIT&&edPaint){   // редактор: один палец рисует, двумя — двигаем карту
      if(!drag.stroke) drag.stroke=edStrokeStart(drag.x,drag.y)?1:-1;
      if(drag.stroke===1){ edStrokeMove(x,y); dirty=true; return; } }
    if(drag.moved){panX=drag.px+dx;panY=drag.py+dy;dirty=true;return}
  }
  // подсветка клетки — только для мыши (на телефоне «наведения» нет)
  if(e.pointerType==="mouse"&&!anim&&!drag){ const h=pick(x,y); if(h!==hover){hover=h;dirty=true} }
});
function endPointer(e){
  const [x,y]=local(e);
  const wasTap=drag&&!drag.moved&&pointers.size===1&&!pinch;
  pointers.delete(e.pointerId);
  if(wasTap&&!anim&&e.type==="pointerup"){
    if(EDIT) edTap(x,y);
    else if(fishing&&fishing.state==="bite") catchFish();
    else goTo((!placing&&pickWolf(x,y))||pickEntity(x,y)||pickTree(x,y)||pick(x,y));
  }
  if(pointers.size<2) pinch=null;
  if(pointers.size===1){ const p=[...pointers.values()][0]; drag={x:p.x,y:p.y,px:panX,py:panY,moved:true,stroke:-1}; }
  if(pointers.size===0){ drag=null; cv.classList.remove("drag"); if(EDIT) edStrokeEnd(); }
}
cv.addEventListener("pointerup",endPointer);
cv.addEventListener("pointercancel",endPointer);
cv.addEventListener("pointerleave",e=>{ if(e.pointerType==="mouse"){hover=null;dirty=true} });
cv.addEventListener("contextmenu",e=>e.preventDefault());   // долгое нажатие на телефоне не открывает меню
cv.addEventListener("wheel",e=>e.preventDefault(),{passive:false});   // зум колесом выключен
document.getElementById("rotL").onclick=()=>rotate(-1);
document.getElementById("rotR").onclick=()=>rotate(1);
const menuEl=document.getElementById("menu"), menuBtn=document.getElementById("menuBtn");
menuBtn.onclick=()=>{const o=!menuEl.classList.contains("open");menuEl.classList.toggle("open",o);menuBtn.setAttribute("aria-expanded",o)};
cv.addEventListener("pointerdown",()=>{menuEl.classList.remove("open");menuBtn.setAttribute("aria-expanded","false")});

document.getElementById("grid").onclick=e=>{showGrid=!showGrid;e.currentTarget.setAttribute("aria-pressed",showGrid);dirty=true};
document.getElementById("wind").setAttribute("aria-pressed",windOn);
document.getElementById("wind").onclick=e=>{windOn=!windOn;e.currentTarget.setAttribute("aria-pressed",windOn);if(!windOn){leaves.length=0;streaks.length=0;for(const c of cells)c.leaves.length=0}dirty=true};
document.querySelectorAll("[data-lang]").forEach(b=>b.onclick=()=>setLang(b.dataset.lang));
document.getElementById("hook").onclick=()=>catchFish();
document.getElementById("reelIn").onclick=()=>{ if(fishing){ stopFishing(); say("reeled"); } };
document.getElementById("follow").onclick=e=>{follow=!follow;e.currentTarget.setAttribute("aria-pressed",follow)};
window.addEventListener("keydown",e=>{
  if(e.target&&(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")) return;
  const k=e.key.toLowerCase();
  if(k==="q"||k==="й") rotate(-1);
  if(k==="e"||k==="у") rotate(1);
  if(e.key==="Escape") closeDialog();
  if(e.key==="Escape"&&winKind) closeWin();
  if(e.code==="Space"&&fishing){ e.preventDefault(); catchFish(); }
});
function resize(){const r=cv.getBoundingClientRect(),d=dprNow();cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);
  if(Math.abs(zoomK/d-scale)>1e-6){zoomK=Math.max(kMin(),Math.round(scale*d));scale=zoomK/d;} dirty=true}
window.addEventListener("resize",resize);

loadAll.then(()=>{
  if(window.__islandBlocked) return;   // открыто не из Telegram
  buildTextures(); setRot(0); resize();
  for(const f of ITEMS) ICONS[f.id]=makeIcon(f); ICONS.campfire=makeIcon({id:"campfire"}); applyLang(); initRPG();
  renderHP(); initFireflies(); initNet();
  const invEl=document.getElementById("inv");
  invEl.addEventListener("click",e=>{ const s=e.target.closest(".slot.edible"); if(s) eatCooked(s.dataset.id); });
  invEl.addEventListener("keydown",e=>{ const s=e.target.closest(".slot.edible"); if((e.key==="Enter"||e.key===" ")&&s){ e.preventDefault(); eatCooked(s.dataset.id); } });
  document.getElementById("buildFire").onclick=startPlacing;
  // формы работают и там, где «отправка формы» запрещена (просмотр файла внутри приложения, песочницы):
  // кнопка и Enter вызывают действие сами, без submit
  window.formAct=(id,fn)=>{ const f=document.getElementById(id); if(!f) return;
    f.onsubmit=e=>{ e.preventDefault(); fn(); };
    const b=f.querySelector("button"); if(b){ b.type="button"; b.onclick=e=>{ e.preventDefault(); fn(); }; }
    for(const i of f.querySelectorAll("input")) i.addEventListener("keydown",e=>{ if(e.key==="Enter"&&!e.isComposing){ e.preventDefault(); fn(); } }); };
  formAct("nickForm",()=>{
    if(setNick(document.getElementById("nickIn").value)){ document.getElementById("nickWrap").hidden=true; say("nick_hi","hint_sub",{n:myNick}); if(TOUCH) goFull(); }
    else { const er=document.getElementById("nickErr"); er.textContent=tr(badNick(document.getElementById("nickIn").value)?"nick_bad":"nick_err"); er.hidden=false; } });
  document.getElementById("nickBtn").onclick=()=>{ menuEl.classList.remove("open"); openNick(); };
  { const ab=document.getElementById("atkBtn"); ab.onclick=()=>{ attackNearest(); ab.classList.add("press"); setTimeout(()=>ab.classList.remove("press"),140); }; }
  document.getElementById("editBtn").onclick=()=>{ menuEl.classList.remove("open"); if(winKind!=="admin") openWin("admin"); };
  if(window.__islandWorld){ const ib=document.getElementById("inviteBtn"); ib.hidden=false;
    ib.onclick=async()=>{ menuEl.classList.remove("open"); const url=location.origin+location.pathname+"#world="+window.__islandWorld;
      try{ if(navigator.share&&TOUCH){ await navigator.share({title:document.title,url}); return; } }catch(e){ if(e&&e.name==="AbortError") return; }
      try{ await navigator.clipboard.writeText(url); say("invite_ok","invite_sub"); }catch(e){ prompt(tr("invite"),url); } }; }
  if(!myNick&&!window.__islandTG) openNick();
  // полный экран: на телефоне — сам при первом касании, везде — кнопкой в меню
  const fsBtn=document.getElementById("fsBtn");
  if(fsSupported()){ fsBtn.hidden=false; fsBtn.onclick=()=>{ menuEl.classList.remove("open"); isFull()?exitFull():goFull(); };
    const syncFs=()=>{ fsBtn.dataset.i18n=isFull()?"fs_off":"fs_on"; fsBtn.textContent=tr(fsBtn.dataset.i18n); setTimeout(resize,60); };
    document.addEventListener("fullscreenchange",syncFs); document.addEventListener("webkitfullscreenchange",syncFs);
    if(TOUCH){ const once=e=>{ if(e.target.closest&&e.target.closest("#nickWrap,#fsBtn")) return; document.removeEventListener("pointerup",once,true); goFull(); };
      document.addEventListener("pointerup",once,true); } }
  initUpdates(); applyHudArt();
  document.getElementById("crPlus").onclick=()=>{ crMsg=null; crAsk=null; openWin("crystals"); };
  document.getElementById("hudFace").onclick=()=>{ if(winKind==="hero") closeWin(); else openWin("hero"); }; renderSkills();
  document.getElementById("partyYes").onclick=acceptInvite; document.getElementById("partyNo").onclick=declineInvite;
  const chatbar=document.getElementById("chatbar"), chatIn=document.getElementById("chatIn");
  const closeChat=()=>{ chatbar.hidden=true; chatIn.blur(); };
  document.getElementById("chatBtn").onclick=()=>{ chatbar.hidden=!chatbar.hidden; if(!chatbar.hidden){ renderChatLog(); markChatRead(); chatIn.focus(); } };
  formAct("chatForm",()=>{ sendChat(chatIn.value); chatIn.value=""; closeChat(); });
  chatIn.addEventListener("keydown",e=>{ if(e.key==="Escape"){ e.preventDefault(); closeChat(); } });
  document.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{ sendChat(tr(b.dataset.q)); closeChat(); });
  document.getElementById("cancelPlace").onclick=cancelPlacing;
  document.getElementById("skipTime").onclick=()=>{ skipTime(); menuEl.classList.remove("open"); };
  const r=cv.getBoundingClientRect(), [hx,hy]=proj(hero.x-MX,hero.y-MY,hero.z);
  // телефон: ~1.3x, компьютер: 2x — в ровных физических пикселях
  zoomK=Math.max(kMin(),Math.round((Math.min(r.width,r.height)<560?1.34:2)*dprNow())); scale=zoomK/dprNow();
  panX=r.width/2-hx*scale; panY=r.height/2-(hy-14)*scale;
  requestAnimationFrame(frame);
});
