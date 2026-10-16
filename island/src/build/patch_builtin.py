import sys
p=sys.argv[1]; s=open(p,encoding="utf-8").read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a); assert n==cnt,(n,a[:100]); s=s.replace(a,b)

# ---------- i18n ----------
rep('''    ad_mobs:"Potwory",''','''    it_custom:"Twoje", it_builtin:"Wbudowane w grę", it_reset:"Przywróć", it_reset_ok:"Na pewno przywrócić?", it_type_fixed:"typu wbudowanej rzeczy nie da się zmienić", it_t_rod:"Wędka",
    it_edited:"zmieniona", mb_builtin:"Wbudowane", mb_custom:"Twoje", mb_spdm:"Szybkość", mb_cave_only:"Pająki żyją w jaskini — tam liczy się «nocą».", mb_boss_later:"Golem (boss) — w sekcji «Bossy».",
    ad_mobs:"Potwory",''')
rep('''    ad_mobs:"Мобы",''','''    it_custom:"Твои", it_builtin:"Встроенные в игру", it_reset:"Вернуть как было", it_reset_ok:"Точно вернуть?", it_type_fixed:"тип встроенной вещи не меняется", it_t_rod:"Удочка",
    it_edited:"изменена", mb_builtin:"Встроенные", mb_custom:"Твои", mb_spdm:"Скорость", mb_cave_only:"Пауки живут в пещере — там считается «ночью».", mb_boss_later:"Голем (босс) — будет в разделе «Боссы».",
    ad_mobs:"Мобы",''')

# ---------- config fields for built-in mobs ----------
rep('''const CFG={texts:{pl:{},ru:{}},buy:{},sell:{},off:{},''','''const CFG={mobDmg:{},mobSpd:{},texts:{pl:{},ru:{}},buy:{},sell:{},off:{},''')
rep('''logs:{...CFG.logs},fisher:{...CFG.fisher}}; }''','''logs:{...CFG.logs},fisher:{...CFG.fisher},mobDmg:{...CFG.mobDmg},mobSpd:{...CFG.mobSpd}}; }''')
rep('''  CFG.xp=nmap(d&&d.xp,5000);''','''  CFG.mobDmg=nmap(d&&d.mobDmg,10); CFG.mobSpd=nmap(d&&d.mobSpd,4);
  CFG.xp=nmap(d&&d.xp,5000);''')
rep('''function biteTarget(tp,a,n=1){''','''function biteTarget(tp,a,n=1){
  if(a&&!CMOBS[a.kind]&&a.kind!=="golem"&&CFG.mobDmg&&CFG.mobDmg[a.kind]>0) n=CFG.mobDmg[a.kind];''')
rep('''    const [tx,ty]=a.path[0], dx=tx-a.x, dy=ty-a.y, dist=Math.hypot(dx,dy), step=a.speed*dt;''','''    const [tx,ty]=a.path[0], dx=tx-a.x, dy=ty-a.y, dist=Math.hypot(dx,dy), step=a.speed*dt*spdMul(a.kind);''')
rep('''  if(d>0.05){ const st=Math.min(d,sp*dt);''','''  if(d>0.05){ const st=Math.min(d,sp*dt*spdMul(a.kind));''')
rep('''const MB_SPD=[0,1.6,2.3,3.0,3.6];''','''const MB_SPD=[0,1.6,2.3,3.0,3.6], SPD_MUL=[1,0.7,1,1.3,1.6];
const spdMul=k=>!CMOBS[k]&&CFG.mobSpd&&CFG.mobSpd[k]?SPD_MUL[CFG.mobSpd[k]]||1:1;''')

# ---------- built-in item overrides ----------
rep('''let itemsRaw={};
function applyItems(d){''','''// встроенные вещи: снимок «как было» и правки из админки (те же world/items, ключ = id вещи)
let BASE=null; const OVR={};
function baseSnap(){
  if(BASE) return BASE;
  const ids=ITEMS.map(f=>f.id).filter(id=>id!=="coin"&&!/^c[A-Za-z0-9]{4,12}$/.test(id));
  BASE={ids,gear:JSON.parse(JSON.stringify(GEAR)),edible:{...EDIBLE},sell:{...SELL_P},shop:SHOP.map(x=>({...x})),icons:{},ru:{},pl:{}};
  for(const id of ids){ BASE.icons[id]=ICONS[id]; BASE.ru[id]=I18N.ru["fish_"+id]; BASE.pl[id]=I18N.pl["fish_"+id]; }
  return BASE;
}
const isBuiltin=id=>!!baseSnap().ids.includes(id);
function baseType(id){ const g=BASE.gear[id]; if(g) return g.slot==="rod"?"rod":g.slot; if(BASE.edible[id]) return "potion"; return "mat"; }
function baseDraft(id){ baseSnap(); const g=BASE.gear[id]||{}, sh=BASE.shop.find(x=>x.id===id);
  return {id,t:baseType(id),ru:BASE.ru[id]||id,pl:BASE.pl[id]||BASE.ru[id]||id,d:"",atk:g.atk||0,def:g.def||0,hp:g.hp||0,heal:BASE.edible[id]||0,lv:0,cl:"",
    seller:sh?"merchant":"",price:sh?sh.p:0,sell:BASE.sell[id]||0,b:"",hue:0,img:"",builtin:true}; }
let itemsRaw={};
function applyItems(d){
  baseSnap();
  // встроенные — вернуть как было, потом наложить правки
  for(const id of BASE.ids){ if(BASE.gear[id]) GEAR[id]=JSON.parse(JSON.stringify(BASE.gear[id])); if(BASE.edible[id]!=null) EDIBLE[id]=BASE.edible[id]; else delete EDIBLE[id];
    if(BASE.sell[id]!=null) SELL_P[id]=BASE.sell[id]; else delete SELL_P[id]; ICONS[id]=BASE.icons[id]; I18N.ru["fish_"+id]=BASE.ru[id]; I18N.pl["fish_"+id]=BASE.pl[id]; delete OVR[id]; }
  SHOP.length=0; for(const x of BASE.shop) SHOP.push({...x});''')
rep('''  for(const [id,o] of Object.entries(list).slice(0,300)){ const it=itSanitize(id,o); if(!it) continue;
    CUSTOM[id]=it;''','''  for(const [id,o] of Object.entries(list).slice(0,400)){
    if(BASE.ids.includes(id)){ const it=itSanitize(id,o,true); if(!it) continue; itemsRaw[id]=it; OVR[id]=it;
      I18N.ru["fish_"+id]=it.ru; I18N.pl["fish_"+id]=it.pl;
      const g=GEAR[id]; if(g&&g.slot!=="rod"){ if(g.slot==="weapon") g.atk=it.atk; else { if(it.def) g.def=it.def; else delete g.def; } if(it.hp) g.hp=it.hp; else delete g.hp;
        if(it.lv>1) g.lv=it.lv; else delete g.lv; if(it.cl) g.cl=it.cl; else delete g.cl; }
      if(it.t==="potion") EDIBLE[id]=Math.max(1,it.heal);
      SELL_P[id]=it.sell||Math.max(1,Math.round(it.price*0.4));
      const si=SHOP.findIndex(x=>x.id===id), bn=(BASE.shop.find(x=>x.id===id)||{}).n;
      if(si>=0) SHOP.splice(si,1);
      if(it.seller==="merchant"&&it.price>0) SHOP.push({id,p:it.price,n:bn,ovr:1}); else if(it.seller==="npc"&&it.price>0) CUSTOM_SHOP.push({id,p:it.price,by:"npc",n:bn});
      if(it.img||it.b) ICONS[id]=customIcon(it,()=>{ renderInv(); if(winKind) renderWin(); });
      else if(it.hue&&BASE.icons[id]){ const c=document.createElement("canvas"); c.width=c.height=32; c.getContext("2d").drawImage(BASE.icons[id],0,0); ICONS[id]=hueShift(c,it.hue); }
      continue; }
    const it=itSanitize(id,o); if(!it) continue;
    CUSTOM[id]=it;''')
# sanitize: allow built-in ids with fixed type
rep('''function itSanitize(id,o){
  if(!/^c[A-Za-z0-9]{4,12}$/.test(id)||!o||typeof o!=="object") return null;
  const t=IT_TYPES.includes(o.t)?o.t:"mat",''','''function itSanitize(id,o,builtin){
  if(!(builtin||/^c[A-Za-z0-9]{4,12}$/.test(id))||!o||typeof o!=="object") return null;
  const t=builtin?baseType(id):IT_TYPES.includes(o.t)?o.t:"mat",''')
# sell/buy price priority for edited built-ins
rep('''const sellPrice=id=>CFG.sell[id]!=null?''','''const sellPrice=id=>OVR[id]?SELL_P[id]:CFG.sell[id]!=null?''')
rep('''.filter(s=>!CFG.off[s.id]).map(s=>({...s,p:CFG.buy[s.id]!=null?CFG.buy[s.id]:s.p}));''','''.filter(s=>OVR[s.id]||!CFG.off[s.id]).map(s=>({...s,p:!OVR[s.id]&&CFG.buy[s.id]!=null?CFG.buy[s.id]:s.p}));''')

# ---------- items list: custom + built-in ----------
rep('''  const ids=Object.keys(CUSTOM);
  if(!ids.length){ body.appendChild(mkEl("p","muted",tr("it_none"))); return; }
  const l=mkEl("div","pllist");
  for(const id of ids){ const it=CUSTOM[id], b=mkEl("button","btn itrow"); b.type="button";
    const im=mkEl("img"); im.src=iconURL(id); im.alt=""; b.appendChild(im);
    const nm=mkEl("span","nm"); nm.appendChild(mkEl("b",null,itLabel(it))); nm.appendChild(mkEl("small",null,tr("it_t_"+it.t)+" · "+customDesc(it))); b.appendChild(nm);
    b.onclick=()=>{ itSel=id; itDelAsk=false; adMsg=""; itDraft={...it}; renderWin(); }; l.appendChild(b); }
  body.appendChild(l);''','''  const ids=Object.keys(CUSTOM);
  body.appendChild(mkEl("b","sub",tr("it_custom")));
  if(!ids.length) body.appendChild(mkEl("p","muted",tr("it_none")));
  const l=mkEl("div","pllist");
  for(const id of ids){ const it=CUSTOM[id], b=mkEl("button","btn itrow"); b.type="button";
    const im=mkEl("img"); im.src=iconURL(id); im.alt=""; b.appendChild(im);
    const nm=mkEl("span","nm"); nm.appendChild(mkEl("b",null,itLabel(it))); nm.appendChild(mkEl("small",null,tr("it_t_"+it.t)+" · "+customDesc(it))); b.appendChild(nm);
    b.onclick=()=>{ itSel=id; itDelAsk=false; adMsg=""; itDraft={...it}; renderWin(); }; l.appendChild(b); }
  body.appendChild(l);
  body.appendChild(mkEl("b","sub",tr("it_builtin")));
  const l2=mkEl("div","pllist");
  for(const id of baseSnap().ids){ const b=mkEl("button","btn itrow"); b.type="button";
    const im=mkEl("img"); im.src=iconURL(id); im.alt=""; b.appendChild(im);
    const nm=mkEl("span","nm"); nm.appendChild(mkEl("b",null,tr("fish_"+id))); const ds=itemDesc(id);
    nm.appendChild(mkEl("small",null,tr("it_t_"+baseType(id))+(ds?" · "+ds:"")+(OVR[id]?" · \\u270E "+tr("it_edited"):""))); b.appendChild(nm);
    b.onclick=()=>{ itSel=id; itDelAsk=false; adMsg=""; itDraft=OVR[id]?{...OVR[id],id,builtin:true}:baseDraft(id); renderWin(); }; l2.appendChild(b); }
  body.appendChild(l2);''')
# card: type locked for built-ins, reset instead of delete
rep('''  const ts=mkEl("select"); for(const t of IT_TYPES){''','''  const ts=mkEl("select"); if(E.builtin){ const o=mkEl("option",null,tr("it_t_"+E.t)+" \\u2014 "+tr("it_type_fixed")); ts.appendChild(o); ts.disabled=true; } else for(const t of IT_TYPES){''')
rep('''  for(const it of ITEMS){ if(it.custom||!ICONS[it.id]) continue; const b=mkEl("button","btn"+(!E.img&&E.b===it.id?" on":""));''','''  for(const it of ITEMS){ if(it.custom||!ICONS[it.id]) continue; const ic=BASE&&BASE.icons[it.id]||ICONS[it.id]; const b=mkEl("button","btn"+(!E.img&&E.b===it.id?" on":""));''')
rep('''    const im=mkEl("img"); im.src=iconURL(it.id); im.alt=""; b.appendChild(im); b.onclick=()=>{ E.b=it.id; E.img=""; renderWin(); }; grid.appendChild(b); }''','''    const im=mkEl("img"); im.src=ic.toDataURL(); im.alt=""; b.appendChild(im); b.onclick=()=>{ E.b=it.id; E.img=""; renderWin(); }; grid.appendChild(b); }''')
rep('''  if(!E.isNew){ bt.appendChild(adBtn(tr("it_give"),()=>{ giveItem(E.id); saveNow(); adMsg=tr("it_given"); renderWin(); }));
    bt.appendChild(adBtn(tr(itDelAsk?"it_del_ok":"it_del"),()=>{ if(!itDelAsk){ itDelAsk=true; renderWin(); return; } itWrite(E.id,null); itSel=null; itDraft=null; renderWin(); },"warn")); }''','''  if(!E.isNew){ bt.appendChild(adBtn(tr("it_give"),()=>{ giveItem(E.id); saveNow(); adMsg=tr("it_given"); renderWin(); }));
    if(E.builtin){ if(OVR[E.id]) bt.appendChild(adBtn(tr(itDelAsk?"it_reset_ok":"it_reset"),()=>{ if(!itDelAsk){ itDelAsk=true; renderWin(); return; } itWrite(E.id,null); itDelAsk=false; itDraft=baseDraft(E.id); adMsg=""; renderWin(); },"warn")); }
    else bt.appendChild(adBtn(tr(itDelAsk?"it_del_ok":"it_del"),()=>{ if(!itDelAsk){ itDelAsk=true; renderWin(); return; } itWrite(E.id,null); itSel=null; itDraft=null; renderWin(); },"warn")); }''')
rep('''function itSave(){
  const E=itDraft; const it=itSanitize(E.id,E);''','''function itSave(){
  const E=itDraft; const it=itSanitize(E.id,E,!!E.builtin);''')
rep('''  delete it.id; itWrite(E.id,it); itDraft={...CUSTOM[E.id]}; adMsg=tr("it_saved"); renderWin();''','''  delete it.id; itWrite(E.id,it); itDraft=E.builtin?{...OVR[E.id],id:E.id,builtin:true}:{...CUSTOM[E.id]}; adMsg=tr("it_saved"); renderWin();''')
# preview of built-in icon: start from its own picture
rep('''  const base=ICONS[it.b]||ICONS[{weapon:"sword_iron",''','''  const base=(BASE&&BASE.icons[it.b])||ICONS[it.b]||(it.builtin&&BASE&&BASE.icons[it.id])||(BASE&&BASE.icons[it.id])||ICONS[{weapon:"sword_iron",''')

# ---------- built-in mobs in the mobs section ----------
rep('''  const ids=Object.keys(CMOBS);
  if(!ids.length){ body.appendChild(mkEl("p","muted",tr("mb_none"))); return; }
  const l=mkEl("div","pllist");''','''  const ids=Object.keys(CMOBS);
  body.appendChild(mkEl("b","sub",tr("mb_custom")));
  if(!ids.length) body.appendChild(mkEl("p","muted",tr("mb_none")));
  const l=mkEl("div","pllist");''')
rep('''    b.onclick=()=>{ mbSel=id; mbDelAsk=false; adMsg=""; mbDraft={...m}; renderWin(); }; l.appendChild(b); }
  body.appendChild(l);
}''','''    b.onclick=()=>{ mbSel=id; mbDelAsk=false; adMsg=""; mbDraft={...m}; renderWin(); }; l.appendChild(b); }
  body.appendChild(l);
  body.appendChild(mkEl("b","sub",tr("mb_builtin")));
  const l2=mkEl("div","pllist");
  for(const k of ["wolf","bat","spider"]){ const b=mkEl("button","btn itrow"); b.type="button"; const im=mkEl("img"); im.src=SPRITES[k+"_se_0"]||""; im.alt=""; b.appendChild(im);
    const nm=mkEl("span","nm"); nm.appendChild(mkEl("b",null,tr("ed_src_"+k)));
    const t=k==="spider"?" \\u26F0"+mobCount(k,"n"):(mobT(k,"d")&&mobCount(k,"d")?" \\u2600"+mobCount(k,"d"):"")+(mobT(k,"n")&&mobCount(k,"n")?" \\u263E"+mobCount(k,"n"):"");
    nm.appendChild(mkEl("small",null,"HP "+mobHp(k)+" \\u00B7 "+tr("mb_dmg").split(" ")[0]+" "+(CFG.mobDmg[k]||1)+" \\u00B7 "+xpOf(k)+" XP"+t)); b.appendChild(nm);
    b.onclick=()=>{ mbSel="b:"+k; adMsg=""; mbDraft={id:k,builtin:true,hp:mobHp(k),dmg:CFG.mobDmg[k]||1,spd:CFG.mobSpd[k]||2,xp:xpOf(k)??0,d:mobT(k,"d")?1:0,dn:mobCount(k,"d"),n:mobT(k,"n")?1:0,nn:mobCount(k,"n")}; renderWin(); }; l2.appendChild(b); }
  body.appendChild(l2);
  body.appendChild(mkEl("p","adnote",tr("mb_boss_later")));
}
function renderBuiltinMob(body){
  const E=mbDraft, k=E.id;
  adHead(body,()=>{ mbSel=null; mbDraft=null; adMsg=""; renderWin(); });
  const pv=mkEl("div","itprev"), im=mkEl("img"); im.src=SPRITES[k+"_se_0"]||""; im.alt=""; pv.appendChild(im); pv.appendChild(mkEl("b",null,tr("ed_src_"+k))); body.appendChild(pv);
  const f=mkEl("div","plform"); const fd=(lab,el)=>{ f.appendChild(mkEl("label",null,tr(lab))); f.appendChild(el); };
  const num=(key,lo,hi)=>{ const i=mkEl("input"); i.type="number"; i.min=String(lo); i.max=String(hi); i.inputMode="numeric"; i.value=String(E[key]); i.oninput=()=>{ E[key]=Math.max(lo,Math.min(hi,Math.round(+i.value||0))); }; return i; };
  fd("mb_hp",num("hp",1,999)); fd("mb_dmg",num("dmg",1,10));
  const sg=mkEl("div","mbseg"); for(const v of [1,2,3,4]) sg.appendChild(adBtn(tr("mb_spd_"+v),()=>{ E.spd=v; renderWin(); },E.spd===v?"on":"")); fd("mb_spdm",sg);
  fd("mb_xp",num("xp",0,5000));
  if(k==="spider") fd("mb_count",num("nn",0,20));
  else { const dl=mkEl("label","chk"), dc=mkEl("input"); dc.type="checkbox"; dc.checked=!!E.d; dc.onchange=()=>{ E.d=dc.checked?1:0; }; dl.append(dc,document.createTextNode(tr("mb_day"))); f.appendChild(dl); f.appendChild(num("dn",0,20));
    const nl=mkEl("label","chk"), nc=mkEl("input"); nc.type="checkbox"; nc.checked=!!E.n; nc.onchange=()=>{ E.n=nc.checked?1:0; }; nl.append(nc,document.createTextNode(tr("mb_night"))); f.appendChild(nl); f.appendChild(num("nn",0,20)); }
  body.appendChild(f);
  if(k==="spider") body.appendChild(mkEl("p","adnote",tr("mb_cave_only")));
  const bt=mkEl("div","plbtns");
  bt.appendChild(adBtn(tr("it_save"),()=>{
    const c=JSON.parse(JSON.stringify(lastCfgDoc||{})); for(const f2 of ["mobHp","xp","mobDmg","mobSpd","mobTime"]) if(!c[f2]||typeof c[f2]!=="object") c[f2]={};
    c.mobHp[k]=E.hp; c.xp[k]=E.xp; c.mobDmg[k]=E.dmg; c.mobSpd[k]=E.spd;
    c.mobTime[k]={d:k==="spider"?0:E.d,n:k==="spider"?1:E.n,dn:k==="spider"?0:E.dn,nn:E.nn};
    applyConfig(c); if(NET.db) NET.db.doc("world/config").set(c).catch(()=>{}); adMsg=tr("mb_saved"); renderWin(); },"big"));
  bt.appendChild(adBtn(tr("mb_loot"),()=>{ closeWin(); edEnter("drop"); edDropSel="mob:"+k; edRender(); }));
  if(k!=="spider"||CAVE) bt.appendChild(adBtn(tr("mb_zone"),()=>{ closeWin(); edEnter("map"); edCat="places"; edTool="zone_"+k; edRender(); }));
  body.appendChild(bt);
  if(adMsg) body.appendChild(mkEl("div","adok",adMsg));
}''')
rep('''  if(mbSel){ renderMobCard(body); return; }''','''  if(mbSel&&mbDraft&&mbDraft.builtin){ renderBuiltinMob(body); return; }
  if(mbSel){ renderMobCard(body); return; }''')

open(p,"w",encoding="utf-8").write(s); print("ok")
