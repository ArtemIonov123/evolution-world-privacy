// ================= Классы и скилы =================
const CLASSES=["warrior","druid"], CLASS_CHANGE_COST=50;
const SKILLS={warrior:[{id:"rush",lv:1,cd:6},{id:"shield",lv:1,cd:12},{id:"whirl",lv:10,cd:10}],
  druid:[{id:"thorn",lv:1,cd:1.2},{id:"heal",lv:3,cd:20},{id:"bear",lv:5,cd:30},{id:"wolf",lv:10,cd:30}]};
let heroClass=null, classLoaded=false, form=null, formT=0, shieldT=0, hitsTaken=0, regenT=0, lastCombat=0, afterHeroFx=null, healSeq=0;
const skillCd={}, projectiles=[], healOut=[], lastHeal={};
const SK_ICON={rush:'<path d="M3 12h11M10 6l6 6-6 6M14 6l6 6-6 6" stroke="#ffd66b" stroke-width="2.6" fill="none"/>',
  shield:'<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z" fill="#8ab4ff" stroke="#1b1528" stroke-width="1.6"/><path d="M12 6v12" stroke="#fff" stroke-width="1.6"/>',
  whirl:'<path d="M12 4a8 8 0 1 1-7.5 5.2M12 8a4 4 0 1 1-3.8 2.7" stroke="#ff9a5a" stroke-width="2.6" fill="none"/><path d="M3 6l2 4 4-1" stroke="#ff9a5a" stroke-width="2" fill="none"/>',
  thorn:'<path d="M4 20L18 6" stroke="#7a4a24" stroke-width="2.6"/><path d="M18 6l3-3-1 5zM9 15l-3-1M13 11l-1-3M12 12l3 1" stroke="#7cd05a" stroke-width="2.2" fill="#7cd05a"/>',
  heal:'<path d="M12 4v16M4 12h16" stroke="#7cf07a" stroke-width="4.5"/><circle cx="12" cy="12" r="9.5" stroke="#3a9a40" stroke-width="1.5" fill="none"/>',
  bear:'<circle cx="12" cy="15" r="5" fill="#8a5a32"/><circle cx="6" cy="9" r="2.3" fill="#8a5a32"/><circle cx="10" cy="6" r="2.3" fill="#8a5a32"/><circle cx="14" cy="6" r="2.3" fill="#8a5a32"/><circle cx="18" cy="9" r="2.3" fill="#8a5a32"/>',
  wolf:'<path d="M4 6l4 4h8l4-4-1 9-7 6-7-6z" fill="#9aa0b4" stroke="#1b1528" stroke-width="1.2"/><circle cx="9" cy="13" r="1.2" fill="#7cf07a"/><circle cx="15" cy="13" r="1.2" fill="#7cf07a"/>',
  temper:'<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z" fill="#c8a040" stroke="#1b1528" stroke-width="1.6"/>',
  forest:'<path d="M12 3c5 3 7 8 4 14-2 3-6 3-8 0-3-6-1-11 4-14z" fill="#5ac05a" stroke="#1b1528" stroke-width="1.4"/><path d="M12 7v13" stroke="#2a6a2a" stroke-width="1.6"/>'};
function skillIcon(id,size){ const sp=img["skill_"+id]; if(sp){ const i=mkEl("img","skic"); i.src=SPRITES["skill_"+id]; i.alt=""; i.width=i.height=size; return i; }
  const d=mkEl("span","skic"); d.innerHTML=`<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${SK_ICON[id]||""}</svg>`; return d; }
// ---- выбор класса ----
function openClassPick(change){
  if(document.getElementById("classWrap")) return;
  const w=mkEl("div","nickwrap"); w.id="classWrap";
  const f=mkEl("div","nickdlg panel classdlg"); f.setAttribute("role","dialog"); f.setAttribute("aria-modal","true");
  f.appendChild(mkEl("b",null,tr(change?"cl_change_title":"cl_pick_title"))); f.appendChild(mkEl("p",null,tr(change?"cl_change_sub":"cl_pick_sub",{c:CLASS_CHANGE_COST})));
  const row=mkEl("div","clrow");
  for(const c of CLASSES){ const card=mkEl("button","clcard"+(heroClass===c?" on":"")); card.type="button";
    const cv2=mkEl("canvas","clpic"); cv2.width=48; cv2.height=60; const g=cv2.getContext("2d"); g.imageSmoothingEnabled=false;
    const sp=heroSprite(c==="druid"&&img.druid_se_0?"druid_se_0":"hero_se_0",myHueIdx); if(sp) g.drawImage(sp,Math.round(24-sp.width/2),58-sp.height);
    if(c==="druid"){ const sv=ctx; ctx=g; drawDruidMark(24,58,"se",sp?sp.height:48); ctx=sv; }
    card.appendChild(cv2); card.appendChild(mkEl("b",null,tr("cl_"+c))); card.appendChild(mkEl("small",null,tr("cl_"+c+"_d")));
    const ul=mkEl("ul"); for(const sk of SKILLS[c]) ul.appendChild(mkEl("li",null,tr("sk_n_"+sk.id))); card.appendChild(ul);
    card.onclick=()=>{ if(change&&c!==heroClass){ if((inv.coin||0)<CLASS_CHANGE_COST){ say("cl_no_money"); return; } inv.coin-=CLASS_CHANGE_COST; if(!inv.coin) delete inv.coin; }
      setClass(c); w.remove(); };
    row.appendChild(card); }
  f.appendChild(row);
  if(change){ const x=mkEl("button","btn",tr("close")); x.type="button"; x.onclick=()=>w.remove(); f.appendChild(x); }
  w.appendChild(f); document.querySelector(".stage").appendChild(w);
}
function setClass(c){
  if(form) endForm(); heroClass=c; recalcHP(); hero.hp=Math.min(HP_MAX,Math.max(hero.hp,1)); renderHP(); renderInv(); renderSkills();
  lastSaveJSON=""; lastPresJSON=""; say("cl_chosen","cl_chosen_sub",{c:"#cl_"+c});
}
setInterval(()=>{ if(classLoaded&&!heroClass&&!document.getElementById("classWrap")&&document.getElementById("nickWrap").hidden&&!EDIT) openClassPick(false); },700);
// ---- кнопки скилов ----
function renderSkills(){
  const el=document.getElementById("skills"); if(!el) return;
  el.textContent=""; el.hidden=!heroClass;
  if(!heroClass) return;
  SKILLS[heroClass].forEach((sk,i)=>{ const b=mkEl("button","skb"); b.type="button"; b.dataset.sk=sk.id;
    b.setAttribute("aria-label",tr("sk_n_"+sk.id)+" ("+(i+1)+")"); b.title=tr("sk_n_"+sk.id)+" · "+(i+1);
    b.appendChild(skillIcon(sk.id,32)); b.appendChild(mkEl("em","sklv",tr("sk_lv",{n:sk.lv})));
    b.onclick=()=>useSkill(sk.id); el.appendChild(b); });
  placeSkillArc();
  updateSkillBar(true);
}
// скилы — по дуге вокруг кнопки атаки (центр дуги = правый нижний угол контейнера)
function placeSkillArc(){
  const el=document.getElementById("skills"); if(!el) return;
  const bs=[...el.children];
  if(!document.body.classList.contains("bhud")){ for(const b of bs){ b.style.left=b.style.top=""; } return; }
  const A=el.clientWidth||170, sz=bs[0]?bs[0].offsetWidth||48:48, R=A*0.795, n=bs.length, a0=177, a1=93;
  bs.forEach((b,i)=>{ const t=n>2?a0+(a1-a0)*i/(n-1):n===2?[160,110][i]:135, rad=t*Math.PI/180;
    b.style.left=Math.round(A+R*Math.cos(rad)-sz/2)+"px"; b.style.top=Math.round(A-R*Math.sin(rad)-sz/2)+"px"; });
}
addEventListener("resize",()=>setTimeout(placeSkillArc,50));
// большая кнопка атаки: бьём ближайшего врага
function attackNearest(){
  if(fainting||EDIT||dialogOpen||placing) return;
  let best=null, bd=1e9;
  for(const a of animals){ if(!isMob(a)||a.dying>0||a.alpha<0.3) continue; const d=Math.hypot(a.x-hero.x,a.y-hero.y); if(d<bd){ bd=d; best=a; } }
  if(!best||bd>9){ say("atk_none"); return; }
  if(heroClass==="druid"&&!hasWeapon()){ if(bd<=6&&!(skillCd.thorn>0)){ useSkill("thorn"); return; } if(bd<=6) return; }
  attackWolf(best);
}
let skBarT=0;
function updateSkillBar(force){
  const el=document.getElementById("skills"); if(!el||el.hidden) return;
  for(const b of el.children){ const sk=SKILLS[heroClass].find(s=>s.id===b.dataset.sk); if(!sk) continue;
    const locked=heroLevel()<sk.lv, cd=skillCd[sk.id]||0, active=(sk.id==="bear"&&form==="bear")||(sk.id==="wolf"&&form==="wolf")||(sk.id==="shield"&&shieldT>0);
    b.classList.toggle("locked",locked); b.classList.toggle("active",active); b.disabled=locked;
    b.style.setProperty("--cd",locked?0:Math.max(0,Math.min(1,cd/sk.cd)).toFixed(3)); }
}
function skillTarget(range){
  if(hero.target&&animals.includes(hero.target)&&!(hero.target.dying>0)&&Math.hypot(hero.target.x-hero.x,hero.target.y-hero.y)<=range) return hero.target;
  let best=null,bd=range; for(const a of animals){ if(!isMob(a)||a.dying>0||a.alpha<0.3) continue; const d=Math.hypot(a.x-hero.x,a.y-hero.y); if(d<=bd){bd=d;best=a;} } return best;
}
function useSkill(id){
  if(!heroClass||fainting||EDIT||dialogOpen) return;
  const sk=SKILLS[heroClass].find(s=>s.id===id); if(!sk) return;
  if(heroLevel()<sk.lv){ say("sk_need_lv",null,{n:sk.lv}); return; }
  if((skillCd[id]||0)>0) return;
  stopFishing(); stopChopping();
  if(id==="rush"){ const a=skillTarget(4.5); if(!a){ say("sk_no_target"); return; }
    let best=null,bd=1e9; for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){ const c=cellAt(Math.round(a.x)+dx,Math.round(a.y)+dy); if(!c||c.blocked||(!dx&&!dy)) continue; const d=Math.hypot(c.x-hero.x,c.y-hero.y); if(d<bd){bd=d;best=c;} }
    if(!best){ say("no_reach"); return; }
    hero.path=[]; hero.dash={x0:hero.x,y0:hero.y,x1:best.x,y1:best.y,t:0,a}; hero.target=a; }
  else if(id==="shield"){ shieldT=3; lastPresJSON=""; }
  else if(id==="whirl"){ let n=0; for(const a of animals) if(isMob(a)&&!(a.dying>0)&&a.alpha>0.3&&Math.hypot(a.x-hero.x,a.y-hero.y)<1.9){ dealHit(a,Math.max(1,heroAtk())*2,false); n++; }
    for(let i=0;i<24;i++){ const an=i/24*Math.PI*2; chips.push({x:hero.x+Math.cos(an)*0.5,y:hero.y+Math.sin(an)*0.5,z:hero.z*LH+12,vx:Math.cos(an)*2,vy:Math.sin(an)*2,vz:8,t:0,life:0.45,col:"#ffcf8a",spark:true}); }
    if(!n) floats.push({key:"sk_miss",col:"#c8c0e0",t:0}); }
  else if(id==="thorn"){ const a=skillTarget(5.5); if(!a){ say("sk_no_target"); return; } faceTo(a.x,a.y);
    projectiles.push({x:hero.x,y:hero.y,z:hero.z+1.3,a,t:0}); hero.castT=0.35; }
  else if(id==="heal"){ hero.hp=Math.min(HP_MAX,hero.hp+2); renderHP(); healFx(hero.x,hero.y,hero.z);
    for(const r of remotes.values()) if(Math.hypot(r.tx-hero.x,r.ty-hero.y)<4.5){ healOut.push({p:r.peer,s:++healSeq,n:2}); healFx(r.x,r.y,r.z); }
    while(healOut.length>6) healOut.shift(); lastPresJSON=""; floats.push({key:"sk_healed",col:"#7cf07a",t:0}); }
  else if(id==="bear"||id==="wolf"){ if(form===id){ endForm(); return; } if(form) endForm();
    form=id; formT=10; recalcHP(); if(id==="bear"){ hero.hp=Math.min(HP_MAX,hero.hp+3); renderHP(); } lastPresJSON="";
    for(let i=0;i<20;i++) chips.push({x:hero.x,y:hero.y,z:hero.z*LH+14,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,vz:20+Math.random()*20,t:0,life:0.6,col:"#7cf07a",spark:true}); }
  skillCd[id]=sk.cd; lastCombat=Date.now(); updateSkillBar(true);
}
function endForm(){ const was=form; form=null; formT=0; recalcHP(); if(hero.hp>HP_MAX) hero.hp=HP_MAX; renderHP(); lastPresJSON="";
  if(was) for(let i=0;i<12;i++) chips.push({x:hero.x,y:hero.y,z:hero.z*LH+14,vx:(Math.random()-.5)*1.6,vy:(Math.random()-.5)*1.6,vz:16,t:0,life:0.5,col:"#b0e0a0",spark:true}); }
function healFx(x,y,z){ for(let i=0;i<14;i++) chips.push({x:x+(Math.random()-.5)*0.6,y:y+(Math.random()-.5)*0.6,z:z*LH+4,vx:0,vy:0,vz:24+Math.random()*24,t:0,life:0.8,col:i%2?"#7cf07a":"#d8ffd0",spark:true}); }
function updateSkills(dt){
  for(const k of Object.keys(skillCd)) if(skillCd[k]>0) skillCd[k]=Math.max(0,skillCd[k]-dt);
  if(hero.castT>0) hero.castT-=dt;
  if(shieldT>0){ shieldT-=dt; if(shieldT<=0){ shieldT=0; lastPresJSON=""; } dirty=true; }
  if(form){ formT-=dt; if(formT<=0) endForm(); dirty=true; }
  if(hero.dash){ const d=hero.dash; d.t+=dt/0.18; const k=Math.min(1,d.t); hero.x=d.x0+(d.x1-d.x0)*k; hero.y=d.y0+(d.y1-d.y0)*k;
    const c=cellAt(Math.round(hero.x),Math.round(hero.y)); if(c) hero.z=walkZ(c); faceTo(d.a.x,d.a.y);
    chips.push({x:hero.x,y:hero.y,z:hero.z*LH+6,vx:0,vy:0,vz:4,t:0,life:0.3,col:"#ffd66b",spark:true});
    if(k>=1){ hero.dash=null; dealHit(d.a,Math.max(1,heroAtk())+1,false,{stun:1}); } dirty=true; }
  for(let i=projectiles.length-1;i>=0;i--){ const p=projectiles[i]; p.t+=dt; const a=p.a;
    if(!animals.includes(a)||a.dying>0||p.t>1.5){ projectiles.splice(i,1); continue; }
    const dx=a.x-p.x, dy=a.y-p.y, d=Math.hypot(dx,dy), st=9*dt;
    if(d<=st+0.2){ projectiles.splice(i,1); dealHit(a,Math.max(1,heroAtk())+1,false,{ranged:true}); continue; }
    p.x+=dx/d*st; p.y+=dy/d*st; p.z+=((a.z+(a.fly||0)+0.8)-p.z)*Math.min(1,dt*6); dirty=true; }
  if(heroClass==="druid"&&!fainting&&hero.hp>0&&hero.hp<HP_MAX&&Date.now()-lastCombat<10000){ regenT+=dt; if(regenT>=10){ regenT=0; hero.hp++; renderHP(); healFx(hero.x,hero.y,hero.z); } } else regenT=0;
  // лечение от друида-соседа
  for(const r of remotes.values()) for(const h of r.hl||[]){ if(!h||h.p!==NET.myPeer) continue; const s=num(h.s,0,1e9,0);
    if(s>(lastHeal[r.peer]||0)){ lastHeal[r.peer]=s; if(!fainting&&hero.hp>0){ hero.hp=Math.min(HP_MAX,hero.hp+num(h.n|0,1,3,2)); renderHP(); healFx(hero.x,hero.y,hero.z); floats.push({key:"sk_healed_by",p:{n:playerName(r)},col:"#7cf07a",t:0}); } } }
  skBarT-=dt; if(skBarT<=0){ skBarT=0.1; updateSkillBar(); }
}
function druidAtk(facing,hue){ return heroSprite(`druid_atk_${facing[0]}e_0`,hue); }
function drawShieldFx(fx,fy){
  ctx.save(); const a=0.45+0.25*Math.sin(T*10); ctx.strokeStyle=`rgba(255,214,107,${a})`; ctx.lineWidth=2;
  ctx.beginPath(); ctx.ellipse(fx,fy-14,14,20,0,0,Math.PI*2); ctx.stroke(); ctx.fillStyle=`rgba(255,230,150,${a*0.25})`; ctx.fill(); ctx.restore();
}
function drawDruidMark(fx,fy,facing,h){   // венок из листьев и посох — пока нет своих картинок друида
  const sp=img.druid_se_0; if(sp) return;
  const H=h||46, R=(x,y,w,hh,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(fx+x),Math.round(fy+y),w,hh)}, top=-H+4, d=facing&&facing[1]==="w"?-1:1;
  R(-7,top+1,14,3,"#1b1528"); R(-6,top+1,12,2,"#4caa3c"); R(-5,top,3,2,"#7cd05a"); R(2,top,3,2,"#7cd05a"); R(-1,top-1,2,2,"#e85a8a");
  R(d*9-1,-30,3,30,"#1b1528"); R(d*9,-29,1,28,"#8a5a32"); R(d*9-2,-33,5,5,"#1b1528"); R(d*9-1,-32,3,3,"#7cf07a");
}
function drawForm(fx,fy,f,facing,moving,phase,atk){
  const fr=moving?Math.floor(phase/Math.PI*2)%4:0, mirror=facing[1]==="w";
  ctx.save(); ctx.translate(Math.round(fx),Math.round(fy)); ctx.imageSmoothingEnabled=false;
  ctx.fillStyle="rgba(20,10,40,.3)"; ctx.beginPath(); ctx.ellipse(0,0,f==="bear"?14:11,5,0,0,Math.PI*2); ctx.fill();
  { const gl=0.28+0.12*Math.sin(T*4); ctx.strokeStyle=`rgba(124,240,122,${gl+0.2})`; ctx.lineWidth=1; ctx.fillStyle=`rgba(124,240,122,${gl*0.5})`;
    ctx.beginPath(); ctx.ellipse(0,0,f==="bear"?17:14,6,0,0,Math.PI*2); ctx.fill(); ctx.stroke(); }   // зелёный круг — это оборотень-друид
  const key=f==="wolf"?(img.dwolf_se_0?"dwolf":"wolf"):f;
  let sp=key==="wolf"?img[`wolf_${facing[0]}e_${fr}`]:(img[`${key}_${facing}_${fr%2}`]||img[`${key}_${facing[0]}e_${fr%2}`]);
  if(key==="wolf"&&sp) ctx.filter="hue-rotate(70deg) saturate(1.4) brightness(1.15)";
  if(mirror) ctx.scale(-1,1);
  const lunge=atk?3:0;
  if(sp) ctx.drawImage(sp,-Math.round(sp.width/2)+lunge,-sp.height+2);
  else if(f==="bear"){ const R=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x+lunge,y,w,h)}, O="#1b1528", b=moving&&fr%2?-1:0, B="#7a4a24", L="#9a6434";
    R(-14,-22+b,26,16,O); R(-13,-21+b,24,14,B); R(-13,-21+b,24,3,L); R(-12,-7,5,7,O); R(-11,-7,3,6,B); R(4,-7,5,7,O); R(5,-7,3,6,B);
    R(8,-27+b,11,11,O); R(9,-26+b,9,9,B); R(9,-29+b,3,3,O); R(15,-29+b,3,3,O); R(15,-22+b,4,3,"#c89a6a"); R(17,-23+b,2,1,O); R(13,-24+b,1,1,"#ffd66b"); }
  else { const R=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x+lunge,y,w,h)}; R(-10,-14,20,9,"#1b1528"); R(-9,-13,18,7,"#9aa0b4"); R(7,-18,8,8,"#1b1528"); R(8,-17,6,6,"#9aa0b4"); R(12,-15,1,1,"#7cf07a"); }
  ctx.filter="none"; ctx.restore();
}
function drawProjectiles(){
  if(!projectiles.length) return; worldTransform();
  for(const p of projectiles){ const [x,y]=proj(p.x-MX,p.y-MY,p.z), [ax,ay]=proj(p.a.x-MX,p.a.y-MY,p.z), d=Math.hypot(ax-x,ay-y)||1, ux=(ax-x)/d, uy=(ay-y)/d;
    ctx.strokeStyle="#1b1528"; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x-ux*8,y-uy*8); ctx.lineTo(x+ux*3,y+uy*3); ctx.stroke();
    ctx.strokeStyle="#7cd05a"; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(x-ux*7,y-uy*7); ctx.lineTo(x+ux*3,y+uy*3); ctx.stroke(); }
}
function drawStatusFx(){   // звёздочки над оглушёнными
  worldTransform();
  for(const a of animals){ if(!(a.stunT>0)||!a.drawn) continue; const h=a.kind==="golem"?60:a.kind==="bat"?30:26;
    for(let i=0;i<3;i++){ const an=T*5+i*2.1, x=a.drawn.x+Math.cos(an)*8, y=a.drawn.y-h+Math.sin(an)*2.5; ctx.fillStyle="#1b1528"; ctx.fillRect(Math.round(x)-2,Math.round(y)-2,4,4); ctx.fillStyle="#ffe066"; ctx.fillRect(Math.round(x)-1,Math.round(y)-1,2,2); } }
}
window.addEventListener("keydown",e=>{ if(e.target&&(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")) return;
  const n=["1","2","3","4"].indexOf(e.key); if(n>=0&&heroClass&&SKILLS[heroClass][n]) useSkill(SKILLS[heroClass][n].id); });
