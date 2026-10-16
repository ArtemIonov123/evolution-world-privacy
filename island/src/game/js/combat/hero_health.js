// ================= Здоровье героя =================
let HP_MAX=5; hero.hp=HP_MAX; hero.hurtT=0;
let fadeT=0, fainting=false;
const HEART='<svg viewBox="0 0 9 8" width="18" height="16" aria-hidden="true" shape-rendering="crispEdges"><path d="M1 0h2v1h1v1h1V1h1V0h2v1h1v3H8v1H7v1H6v1H5v1H4V7H3V6H2V5H1V4H0V1h1z" fill="#1b1528"/><path d="M1 1h2v1h1v1h1V2h1V1h2v3H7v1H6v1H5v1H4V6H3V5H2V4H1z" fill="FILL"/><path d="M2 1h1v1H2z" fill="HL"/></svg>';
let hudBarArt=false;
let crystals=0;   // донат-валюта (пока только счётчик)
let hudFaceKey="";
function updateHud(){
  const n=document.getElementById("hudName"); if(!n) return;
  const L=lvlInfo(prog.xp), nm=myNick||tr("hero");
  if(n.textContent!==nm) n.textContent=nm;
  document.getElementById("hudLv").textContent=String(L.l); document.getElementById("hudLvTag").textContent="Lv "+L.l;
  const setW=(el,f)=>{ f=Math.max(0,Math.min(1,f)); el.style.width=hudBarArt?`calc((100% - 12px) * ${f.toFixed(3)})`:Math.round(100*f)+"%"; el.style.visibility=f>0?"":"hidden"; };
  setW(document.getElementById("hudHpFill"),hero.hp/Math.max(1,HP_MAX));
  document.getElementById("hudHpTxt").textContent=hero.hp+" / "+HP_MAX; document.getElementById("hudHp").setAttribute("aria-label",tr("hp_label")+": "+hero.hp+"/"+HP_MAX);
  setW(document.getElementById("hudXpFill"),L.into/Math.max(1,L.need));
  document.getElementById("hudXpTxt").textContent=L.into+" / "+L.need+" XP";
  const cn=document.getElementById("hudCrN"); if(cn.textContent!==shortNum(crystals)){ cn.textContent=shortNum(crystals); document.getElementById("hudCr").setAttribute("aria-label",tr("cr_name")+": "+crystals); }
  const key=(heroClass||"")+"|"+myHueIdx+"|"+(img.druid_se_0?1:0);
  if(key!==hudFaceKey&&typeof heroSprite==="function"){ const sp=heroSprite(heroClass==="druid"&&img.druid_se_0?"druid_se_0":"hero_se_0",myHueIdx);
    if(sp){ hudFaceKey=key; const c=document.getElementById("hudFaceCv"), g=c.getContext("2d"); g.imageSmoothingEnabled=false; g.clearRect(0,0,48,48);
      const b=spriteBox(sp); const side=24; g.drawImage(sp,Math.round(b.cx-side/2),b.y,side,side,0,0,48,48); } }
}
const spriteBoxCache=new WeakMap();
function spriteBox(sp){ if(spriteBoxCache.has(sp)) return spriteBoxCache.get(sp);
  const g=document.createElement("canvas").getContext("2d"); g.canvas.width=sp.width; g.canvas.height=sp.height; g.drawImage(sp,0,0);
  const d=g.getImageData(0,0,sp.width,sp.height).data; let x0=sp.width,x1=0,y0=sp.height;
  for(let y=0;y<sp.height;y++)for(let x=0;x<sp.width;x++) if(d[(y*sp.width+x)*4+3]>128){ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; }
  // голова: верхняя часть фигуры; центр по верхним 12 строкам
  let s=0,c=0; for(let y=y0;y<Math.min(sp.height,y0+12);y++)for(let x=0;x<sp.width;x++) if(d[(y*sp.width+x)*4+3]>128){ s+=x; c++; }
  const r={x:x0,y:Math.max(0,y0-1),w:x1-x0+1,cx:c?s/c:(x0+x1)/2}; spriteBoxCache.set(sp,r); return r; }
setInterval(()=>{ try{ updateHud(); }catch(e){} },400);
// нарисованные детали панели (если есть картинки от GPT)
function applyHudArt(){
  if(typeof SPRITES==="undefined") return; const S=SPRITES;
  const face=document.getElementById("hudFace");
  if(S.hud_portrait_frame&&face&&!face.querySelector(".hframe")){ const f=document.createElement("img"); f.className="hframe"; f.src=S.hud_portrait_frame; f.alt=""; face.appendChild(f); face.classList.add("art"); }

  if(S.icon_crystal){ const cr=document.getElementById("hudCr"), sv=cr.querySelector("svg"); if(sv){ const i=document.createElement("img"); i.src=S.icon_crystal; i.alt=""; i.width=i.height=20; sv.replaceWith(i); } }

  if(S.hud_bar_frame&&S.hud_bar_hp&&S.hud_bar_xp){ hudBarArt=true;
    for(const [id,fill] of [["hudHp",S.hud_bar_hp],["hudXp",S.hud_bar_xp]]){ const b=document.getElementById(id); b.classList.add("art");
      b.style.borderImage=`url(${S.hud_bar_frame}) 6 7 fill / 7px 9px stretch`;
      const i=b.querySelector("i"); i.style.borderImage=`url(${fill}) 0 5 fill / 0 6px stretch`; } }
  if(S.hud_slot_frame&&S.hud_skill_ring&&S.hud_attack_btn&&S.hud_skill_arc&&S.hud_round_btn){
    const r=document.documentElement.style;
    for(const [k,v] of [["--hud-slot","hud_slot_frame"],["--hud-ring","hud_skill_ring"],["--hud-atk","hud_attack_btn"],["--hud-atk-p","hud_attack_btn_press"],["--hud-arc","hud_skill_arc"],["--hud-round","hud_round_btn"],["--hud-badge","hud_badge"]])
      if(S[v]) r.setProperty(k,`url(${S[v]})`);
    document.body.classList.add("bhud"); setTimeout(()=>{ try{ placeSkillArc(); }catch(e){} },0); }
  if(S.hud_btn_menu){ const m=document.getElementById("menuBtn"), sv=m.querySelector("svg"); if(sv){ const i=document.createElement("img"); i.src=S.hud_btn_menu; i.alt=""; i.width=i.height=40; sv.replaceWith(i); m.classList.add("art"); } }
}
function renderHP(){
  try{ updateHud(); }catch(e){}
  const el=document.getElementById("hp"); let h="";
  for(let i=0;i<HP_MAX;i++) h+=HEART.replace("FILL",i<hero.hp?"#e8402c":"#3d3257").replace("HL",i<hero.hp?"#ff9a8a":"#3d3257");
  el.innerHTML=h; el.setAttribute("aria-label",tr("hp_label")+": "+hero.hp+"/"+HP_MAX);
}
function hurtHero(n,from){
  if(hero.hp<=0||fainting) return;
  lastCombat=Date.now(); if(isMob(from)){ hero.attacker=from; hero.attackedAt=Date.now(); }
  if(shieldT>0&&Math.random()<0.8){ floats.push({key:"sk_shield_block",col:"#ffd66b",t:0}); return; }
  if(heroClass==="warrior"&&(++hitsTaken)%4===0){ floats.push({key:"sk_temper_block",col:"#ffd66b",t:0}); return; }
  if(Math.random()<blockChance()){ floats.push({key:"blocked_bite",col:"#9fe0ff",t:0}); return; }
  hero.hp=Math.max(0,hero.hp-n); hero.hurtT=0.6; hero.hurtAt=Date.now(); renderHP();
  floats.push({key:"minus_hp",p:{n},col:"#ff6a5a",t:0});
  stopFishing(); stopChopping();
  // отбрасывает от волка
  if(from){ const dx=hero.x-from.x, dy=hero.y-from.y, dd=Math.hypot(dx,dy)||1, nx=hero.x+dx/dd*0.35, ny=hero.y+dy/dd*0.35, c=cellAt(Math.round(nx),Math.round(ny));
    if(c&&!c.blocked&&Math.abs(walkZ(c)-hero.z)<1.2){ hero.x=nx; hero.y=ny; } }
  if(hero.hp<=0) faint(); else if(CAVE) say(from&&from.kind==="golem"?"hurt_golem":"hurt_cave","hurt_cave_sub"); else say("hurt","hurt_sub");
}
function faint(){
  fainting=true; fadeT=0; hero.path=[]; marker=null; closeDialog(); prog.st.faints++;
  document.getElementById("fade").style.opacity="1";
  if(ZONE!=="island"){ setTimeout(()=>{ const lost=Math.floor((inv.coin||0)*0.3); if(lost){ inv.coin-=lost; if(!inv.coin) delete inv.coin; }
    hero.hp=HP_MAX; saveNow(); try{ sessionStorage.setItem("island_zone","island"); sessionStorage.setItem("island_spawn","faint"); }catch(e){}
    setTimeout(()=>location.reload(),900); },1100); return; }
  setTimeout(()=>{
    // очнулся утром у хижины Богдана
    const spot=[...Array(9)].map((_,i)=>cellAt(NPCC.x+(i%3)-1,NPCC.y+((i/3)|0)-1)).find(c=>c&&!c.blocked)||NPCC;
    hero.x=spot.x; hero.y=spot.y; hero.z=walkZ(spot); hero.hp=HP_MAX; renderHP();
    const lost=Math.floor((inv.coin||0)*0.3); if(lost){ inv.coin-=lost; if(!inv.coin) delete inv.coin; renderInv(); }
    if(!NET.room){ for(const a of animals) if(a.kind==="wolf") a.alpha=0, a.dead=true;
      clock=7/24; wasNight=false; lastClockText=""; netSetClock(clock); }
    follow=true; document.getElementById("follow").setAttribute("aria-pressed","true");
    document.getElementById("fade").style.opacity="0"; fainting=false;
    say(NET.room?"fainted_net":"fainted",null,{c:lost});
  },1300);
}
function eatCooked(id){
  if(!EDIBLE[id]){ id=["cooked","meat_cooked","potion"].find(k=>inv[k]); }
  if(!id||!inv[id]) return;
  if(hero.hp>=HP_MAX){ say("full_hp"); return; }
  inv[id]--; if(!inv[id]) delete inv[id];
  const before=hero.hp; hero.hp=Math.min(HP_MAX,hero.hp+EDIBLE[id]); renderHP(); renderInv();
  floats.push({key:"heal",p:{n:hero.hp-before},col:"#8aff8a",t:0});
  say("ate","",{hp:hero.hp});
}

