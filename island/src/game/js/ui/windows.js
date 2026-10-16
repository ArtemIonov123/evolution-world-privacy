// ---- описание предмета ----
function itemDesc(id){
  if(CUSTOM[id]) return customDesc(CUSTOM[id]);
  if(EDIBLE[id]) return tr("d_heal",{n:EDIBLE[id]});
  const g=GEAR[id];
  if(g) return g.atk?tr("d_weapon",{n:g.atk}):g.def?tr("d_armor",{slot:"#slot_"+g.slot,n:g.def}):tr("d_amulet");
  if(id==="boot") return tr("d_boot");
  if(GEAR[id]&&GEAR[id].rod) return tr("d_rod",{d:rodMax(id),s:Math.max(0,100-rodCfg(id,"sp")),r:rodCfg(id,"rare")});
  if(id==="bat_wing") return tr("d_wing",{c:sellPrice(id)});
  if(id==="bait") return tr("d_bait");
  if(PRICE[id]) return tr("d_fish",{c:PRICE[id]});
  if(id==="pelt"||id==="fang"||id==="spider_silk"||id==="golem_core") return tr("d_mat",{c:sellPrice(id)});
  if(id==="meat_raw") return tr("d_meat");
  if(id==="wood") return tr("d_wood");
  if(id==="coin") return tr("d_coin");
  return "";
}
// ---- окна ----
let winKind=null, bagSel=null;
const iconURL=id=>ICONS[id]?ICONS[id].toDataURL():"";
function openWin(k){
  if(winKind===k){ closeWin(); return; }
  if(dialogOpen) closeDialog();
  winKind=k; bagSel=null; document.getElementById("win").hidden=false;
  document.querySelectorAll(".hb").forEach(b=>b.setAttribute("aria-pressed",b.dataset.win===k?"true":"false"));
  renderWin();
}
function closeWin(){ winKind=null; document.getElementById("win").hidden=true; document.querySelectorAll(".hb").forEach(b=>b.setAttribute("aria-pressed","false")); }
function mkEl(tag,cls,txt){ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }
function slotBtn(id,count,onclick,sel){
  const b=mkEl("button","slot"+(sel?" sel":"")); b.type="button"; b.title=tr("fish_"+id);
  const im=mkEl("img"); im.alt=tr("fish_"+id); im.src=iconURL(id); b.appendChild(im);
  if(count>1) b.appendChild(mkEl("span",null,String(count)));
  b.onclick=onclick; return b;
}
function mkBar(into,need,col){ const w=mkEl("div","bar"); const f=mkEl("i"); f.style.width=Math.round(100*Math.min(1,into/need))+"%"; if(col) f.style.background=col; w.appendChild(f); return w; }
function renderWin(){
  if(!winKind) return;
  document.getElementById("winTitle").textContent=tr("win_"+winKind);
  const body=document.getElementById("winBody"); body.textContent="";
  if(winKind==="admin") renderAdminHub(body); else if(winKind==="admin_pl") renderAdminPlayers(body); else if(winKind==="admin_nf") renderNickFilter(body); else if(winKind==="admin_items") renderAdminItems(body); else if(winKind==="admin_mobs") renderAdminMobs(body); else
  if(winKind==="shop") renderShop(body); else if(winKind==="bag") renderBag(body); else if(winKind==="equip") renderEquip(body); else if(winKind==="hero") renderHero(body); else renderQuests(body);
}
function renderBag(body){
  const got=ITEMS.filter(f=>inv[f.id]);
  if(!got.length){ body.appendChild(mkEl("p","muted",tr("bag_empty"))); return; }
  if(bagSel&&!inv[bagSel]) bagSel=null;
  const grid=mkEl("div","grid");
  for(const f of got) grid.appendChild(slotBtn(f.id,inv[f.id],()=>{ bagSel=f.id; renderWin(); },bagSel===f.id));
  body.appendChild(grid);
  const det=mkEl("div","detail");
  if(!bagSel){ det.appendChild(mkEl("p","muted",tr("bag_pick"))); body.appendChild(det); return; }
  const id=bagSel, row=mkEl("div","drow"), im=mkEl("img"); im.src=iconURL(id); im.alt=""; row.appendChild(im);
  const tx=mkEl("div"); tx.appendChild(mkEl("b",null,tr("fish_"+id)+(inv[id]>1?" ×"+inv[id]:""))); tx.appendChild(mkEl("p",null,itemDesc(id))); row.appendChild(tx); det.appendChild(row);
  const acts=mkEl("div","acts");
  const act=(k,fn,big)=>{ const b=mkEl("button","btn"+(big?" big":""),tr(k)); b.type="button"; b.onclick=fn; acts.appendChild(b); };
  if(EDIBLE[id]) act(id==="potion"?"act_drink":"act_eat",()=>{ eatCooked(id); renderWin(); },true);
  if(GEAR[id]) act("act_equip",()=>{ equipItem(id); renderWin(); },true);
  if(id!=="coin") act("act_drop",()=>{ inv[id]--; if(!inv[id]) delete inv[id]; renderInv(); },false);
  det.appendChild(acts); body.appendChild(det);
}
function renderEquip(body){
  const doll=mkEl("div","doll");
  const slot=(s)=>{ const w=mkEl("div","eslot"); w.style.gridArea=s; const id=equip[s];
    const b=mkEl("button","slot"+(id?"":" empty")); b.type="button";
    if(id){ const im=mkEl("img"); im.src=iconURL(id); im.alt=tr("fish_"+id); b.appendChild(im); b.title=tr("act_unequip")+": "+tr("fish_"+id); b.onclick=()=>{ unequip(s); renderWin(); }; }
    else { b.disabled=true; b.title=tr("slot_"+s); }
    w.appendChild(b); w.appendChild(mkEl("small",null,id?tr("fish_"+id)+(s==="rod"?" · "+rodDur+"/"+rodMax(id):""):tr("slot_"+s))); return w; };
  for(const s of SLOTS) doll.appendChild(slot(s));
  const cvs=mkEl("canvas","heroPrev"); cvs.width=96; cvs.height=144; cvs.style.gridArea="hero"; doll.appendChild(cvs);
  const g=cvs.getContext("2d"); g.imageSmoothingEnabled=false; const sp=heroSprite(heroClass==="druid"&&img.druid_se_0?"druid_se_0":"hero_se_0",myHueIdx);
  if(sp) g.drawImage(sp,Math.round(48-sp.width*1.5),0,sp.width*3,sp.height*3);
  body.appendChild(doll);
  const st=mkEl("div","stats3");
  for(const [k,v] of [["st_atk",heroAtk()],["st_def",heroDef()],["st_hp",HP_MAX]]){ const c=mkEl("div"); c.appendChild(mkEl("b",null,String(v))); c.appendChild(mkEl("small",null,tr(k))); st.appendChild(c); }
  body.appendChild(st);
  if(heroDef()) body.appendChild(mkEl("p","muted center",tr("st_block",{n:Math.round(blockChance()*100)})));
  body.appendChild(mkEl("p","muted",equip.weapon||heroDef()||equip.neck?tr("eq_hint"):""));
  const can=ITEMS.filter(f=>GEAR[f.id]&&inv[f.id]);
  body.appendChild(mkEl("b","sub",tr("eq_bag")));
  if(!can.length) body.appendChild(mkEl("p","muted",tr("eq_none")));
  else { const grid=mkEl("div","grid"); for(const f of can) grid.appendChild(slotBtn(f.id,inv[f.id],()=>{ equipItem(f.id); renderWin(); })); body.appendChild(grid); }
}
function renderHero(body){
  const L=lvlInfo(prog.xp), head=mkEl("div","hhead");
  head.appendChild(mkEl("b",null,(myNick||tr("hero"))+" · "+tr("lvl",{n:L.l})));
  head.appendChild(mkBar(L.into,L.need,"#9a7bff")); head.appendChild(mkEl("small",null,tr("xp_bar",{a:L.into,b:L.need})));
  body.appendChild(head);
  const st=mkEl("div","stats3");
  for(const [k,v] of [["st_hp",hero.hp+"/"+HP_MAX],["st_atk",heroAtk()],["st_def",heroDef()]]){ const c=mkEl("div"); c.appendChild(mkEl("b",null,String(v))); c.appendChild(mkEl("small",null,tr(k))); st.appendChild(c); }
  body.appendChild(st);
  if(heroClass){ body.appendChild(mkEl("b","sub",tr("cl_title")+": "+tr("cl_"+heroClass)));
    for(const sk of [{id:heroClass==="warrior"?"temper":"forest",lv:1,passive:true},...SKILLS[heroClass]]){ const r=mkEl("div","skrow");
      r.appendChild(skillIcon(sk.id,22)); const t=mkEl("div"); t.appendChild(mkEl("b",null,tr("sk_n_"+sk.id)+(sk.passive?" · "+tr("sk_passive"):heroLevel()<sk.lv?" · "+tr("sk_locked",{n:sk.lv}):"")));
      t.appendChild(mkEl("small",null,tr("sk_d_"+sk.id))); r.appendChild(t); body.appendChild(r); }
    const ch=mkEl("button","btn",tr("cl_change",{c:CLASS_CHANGE_COST})); ch.type="button"; ch.onclick=()=>{ closeWin(); openClassPick(true); }; body.appendChild(ch); }
  body.appendChild(mkEl("b","sub",tr("skills")));
  for(const k of ["fight","fish","chop"]){ const s=skillNext(k), r=mkEl("div","skill");
    r.appendChild(mkEl("span",null,tr("sk_"+k)+" "+s.l)); r.appendChild(mkBar(s.into,s.need,"#ffd66b")); r.appendChild(mkEl("small",null,tr("sk_"+k+"_d",{n:Math.round((k==="fight"?critChance():k==="fish"?1-fishSpeed():extraLogChance())*100)})));
    body.appendChild(r); }
  body.appendChild(mkEl("b","sub",tr("stats")));
  const tb=mkEl("div","statlist");
  const t=Math.round(prog.st.time/60);
  for(const [k,v] of [["s_wolves",prog.st.wolves],["s_bats",prog.st.bats||0],["s_fish",prog.st.fish],["s_trees",prog.st.trees],["s_fires",prog.st.fires],["s_faints",prog.st.faints],["s_time",t<60?t+" min":Math.floor(t/60)+" h "+(t%60)+" min"]]){
    const r=mkEl("div"); r.appendChild(mkEl("span",null,tr(k))); r.appendChild(mkEl("b",null,String(v))); tb.appendChild(r); }
  body.appendChild(tb);
}
const questReady=()=>(quest==="active"&&(inv.wood||0)>=5)||(quest2==="active"&&(inv.pelt||0)>=2);
function renderQuests(body){
  const list=[];
  if(quest!=="none") list.push({t:"q_wood",d:tr("q_wood_d",{n:Math.min(5,inv.wood||0)}),done:quest==="done",ready:quest==="active"&&(inv.wood||0)>=5});
  if(quest2!=="none") list.push({t:"q_wolf",d:tr("q_wolf_d",{n:Math.min(2,inv.pelt||0)}),done:quest2==="done",ready:quest2==="active"&&(inv.pelt||0)>=2});
  if(!list.length){ body.appendChild(mkEl("p","muted",tr("q_none"))); return; }
  list.sort((a,b)=>a.done-b.done);
  for(const q of list){ const r=mkEl("div","quest"+(q.done?" done":""));
    r.appendChild(mkEl("b",null,(q.done?"✓ ":q.ready?"! ":"")+tr(q.t))); r.appendChild(mkEl("p",null,q.done?tr("q_done"):q.ready?tr("q_ready"):q.d)); body.appendChild(r); }
  if(quest==="none"||quest2==="none") body.appendChild(mkEl("p","muted",tr("q_more")));
}
function refreshUI(){ try{ updateHud(); }catch(e){}
  const qb=document.getElementById("qDot"); if(qb) qb.hidden=!questReady();
  if(winKind) renderWin();
}
function initRPG(){
  const ic={bag:"ui_bag",equip:"ui_equip",hero:"ui_hero",quests:"ui_quests"};
  document.querySelectorAll(".hb").forEach(b=>{ const k=b.dataset.win, name=ic[k];
    if(typeof SPRITES!=="undefined"&&SPRITES[name]){ const s=b.querySelector("svg"); if(s) s.remove(); const im=mkEl("img"); im.src=SPRITES[name]; im.alt=""; b.prepend(im); }
    b.onclick=()=>openWin(k); });
  document.getElementById("winClose").onclick=closeWin;
  addEventListener("keydown",e=>{ if(e.target&&e.target.tagName==="INPUT") return; if(EDIT) return;
    if(e.key==="Escape"&&winKind){ closeWin(); return; }
    const m={i:"bag",b:"bag",c:"hero",k:"equip",j:"quests"}[e.key.toLowerCase()]; if(m&&!e.ctrlKey&&!e.metaKey&&!e.altKey) openWin(m); });
  recalcHP(); refreshUI();
}

