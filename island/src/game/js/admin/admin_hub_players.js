// ---- админка: разделы ----
let BANS={}, adQ="", adFilter="all", adSel=null, adSave=null, adMsg="", adEdit=null;
function adBtn(label,fn,cls){ const b=mkEl("button","btn"+(cls?" "+cls:""),label); b.type="button"; b.onclick=fn; return b; }
function renderAdminHub(body){
  if(!isAdmin){ closeWin(); return; }
  const g=mkEl("div","adhub");
  const card=(ic,t,d,fn)=>{ const b=mkEl("button","btn adcard"); b.type="button"; b.appendChild(mkEl("span","ic",ic)); b.appendChild(mkEl("b",null,tr(t))); b.appendChild(mkEl("small",null,tr(d))); b.onclick=fn; g.appendChild(b); };
  card("\u{1F5FA}\uFE0F",CAVE?"ad_mapc":"ad_map","ad_map_d",()=>{ closeWin(); edEnter("map"); });
  card(CAVE?"\u{1F3DD}\uFE0F":"\u26F0\uFE0F",CAVE?"ad_mapi":"ad_mapc","ad_mapc_d",()=>{ closeWin(); adSwitchZone(); });
  card("\u{1F465}","ad_pl","ad_pl_d",()=>{ adSel=null; adMsg=""; winKind="admin_pl"; renderWin(); });
  card("\u{1F5E1}\uFE0F","ad_items","ad_items_d",()=>{ itSel=null; adMsg=""; winKind="admin_items"; renderWin(); });
  card("\u{1F43A}","ad_mobs","ad_mobs_d",()=>{ mbSel=null; adMsg=""; winKind="admin_mobs"; renderWin(); });
  card("\u{1F4AC}","ad_texts","ad_texts_d",()=>{ closeWin(); edEnter("texts"); });
  card("\u{1F6D2}","ad_shop","ad_shop_d",()=>{ closeWin(); edEnter("shop"); });
  card("\u{1F480}","ad_drop","ad_drop_d",()=>{ closeWin(); edEnter("drop"); });
  card("\u{1F6AB}","ad_nf","ad_nf_d",()=>{ adMsg=""; winKind="admin_nf"; renderWin(); });
  body.appendChild(g);
}
function adSwitchZone(){
  saveNow(); try{ sessionStorage.setItem("island_zone",CAVE?"island":"cave"); sessionStorage.setItem("island_spawn","portal"); sessionStorage.setItem("island_reedit","map"); }catch(e){}
  document.getElementById("fade").style.opacity="1"; setTimeout(()=>location.reload(),500);
}
function adHead(body,backFn){ const t=mkEl("div","adtop"); t.appendChild(adBtn(tr("ad_back"),backFn||(()=>{ winKind="admin"; renderWin(); }))); body.appendChild(t); return t; }
// все игроки: записи players/<id> (кто когда был), онлайн — по комнате
let adPlayers=[];
function adCollect(docs){ adPlayers=docs.map(s=>({id:s.id,d:s.data()||{}})).filter(p=>p.d); if(winKind==="admin_pl"&&!adSel) adRenderList(); }
function adMine(){ return {id:NET.myId,d:{n:myNick,last:Date.now(),cl:heroClass||"",lv:heroLevel(),tg:window.__islandTG?1:0}}; }
function adRows(){
  const on=onlineIds(); if(NET.myId) on.add(NET.myId);
  const all=adPlayers.filter(p=>p.id!==NET.myId).concat(NET.myId?[adMine()]:[]);
  const q=adQ.trim().toLowerCase();
  let rows=all.map(p=>({...p,on:on.has(p.id),ban:BANS[p.id]||null}));
  if(q) rows=rows.filter(r=>String(r.d.n||"").toLowerCase().includes(q)||r.id.toLowerCase().includes(q)||r.id.replace(/^utg/,"").includes(q));
  if(adFilter==="online") rows=rows.filter(r=>r.on); else if(adFilter==="banned") rows=rows.filter(r=>r.ban);
  rows.sort((a,b)=>(b.on-a.on)||((+b.d.last||0)-(+a.d.last||0)));
  return rows;
}
function adRenderList(){
  const el=document.getElementById("adList"); if(!el) return; el.textContent="";
  const rows=adRows();
  const cnt=document.getElementById("adCnt"); if(cnt) cnt.textContent=tr("ad_count",{n:rows.length});
  if(!rows.length){ el.appendChild(mkEl("p","muted",tr("ad_none"))); return; }
  for(const r of rows.slice(0,200)){
    const b=mkEl("button","btn plrow"); b.type="button";
    b.appendChild(mkEl("span","dot"+(r.on?" on":"")));
    const nm=mkEl("span","nm"); nm.appendChild(mkEl("b",null,cleanNick(r.d.n||"")||r.id));
    const meta=[r.id.startsWith("utg")?tr("ad_tg"):tr("ad_web")];
    if(typeof r.d.lv==="number") meta.push(tr("ad_lv",{n:r.d.lv}));
    if(r.d.cl) meta.push(tr("cl_"+r.d.cl));
    meta.push(r.on?tr("ad_now"):(r.d.last?agoText(+r.d.last):"—"));
    nm.appendChild(mkEl("small",null,meta.join(" · "))); b.appendChild(nm);
    if(r.ban) b.appendChild(mkEl("span","ban","BAN"));
    b.onclick=()=>adOpen(r.id);
    el.appendChild(b);
  }
}
function renderAdminPlayers(body){
  if(!isAdmin){ closeWin(); return; }
  if(adSel){ adRenderCard(body); return; }
  const t=adHead(body);
  const inp=mkEl("input","adsearch"); inp.type="search"; inp.placeholder=tr("ad_search"); inp.value=adQ; inp.id="adSearch"; inp.autocomplete="off"; inp.spellcheck=false;
  inp.oninput=()=>{ adQ=inp.value; adRenderList(); }; t.appendChild(inp);
  const ch=mkEl("div","adchips");
  for(const f of ["all","online","banned"]) ch.appendChild(adBtn(tr("ad_"+f),()=>{ adFilter=f; renderWin(); },adFilter===f?"on":""));
  const c=mkEl("span","plmeta"); c.id="adCnt"; c.style.alignSelf="center"; c.style.marginLeft="auto"; ch.appendChild(c);
  body.appendChild(ch);
  const l=mkEl("div","pllist"); l.id="adList"; body.appendChild(l);
  adRenderList();
}
async function adOpen(id){
  adSel=id; adSave=null; adMsg=""; adEdit=null; renderWin();
  try{ const s=await NET.db.doc(`data/users/${id}/save`).get(); if(adSel!==id) return; adSave=s.exists?(s.data()||{}):false; }catch(e){ adSave=false; }
  const p=adPlayers.find(x=>x.id===id)||(id===NET.myId?adMine():{d:{}});
  const sv=adSave||{}, iv=sv.inv&&typeof sv.inv==="object"?{...sv.inv}:{};
  adEdit={nick:cleanNick(sv.nf||sv.nick||p.d.n||""),coin:Math.floor(iv.coin||0),cr:Math.floor(sv.cr||0),xp:(sv.pg&&sv.pg.xp)|0,cl:CLASSES.includes(sv.cl)?sv.cl:"",inv:Object.fromEntries(Object.entries(iv).filter(([k,v])=>k!=="coin"&&typeof v==="number"&&v>0))};
  if(id===NET.myId) adEdit={nick:myNick,coin:inv.coin||0,cr:crystals,xp:prog.xp,cl:heroClass||"",inv:Object.fromEntries(Object.entries(inv).filter(([k])=>k!=="coin"))};
  if(winKind==="admin_pl"&&adSel===id) renderWin();
}
function adRenderCard(body){
  const id=adSel, p=adPlayers.find(x=>x.id===id)||(id===NET.myId?adMine():{id,d:{}}), on=onlineIds().has(id)||id===NET.myId, ban=BANS[id];
  adHead(body,()=>{ adSel=null; adMsg=""; renderWin(); });
  body.appendChild(mkEl("b",null,cleanNick(p.d.n||"")||id));
  const meta=[id.startsWith("utg")?tr("ad_tg")+" "+id.slice(3):tr("ad_web")+" · "+tr("ad_id",{id}),on?tr("ad_now"):(p.d.last?agoText(+p.d.last):"—")];
  if(id===NET.myId) meta.push(tr("ad_me"));
  body.appendChild(mkEl("div","plmeta",meta.join(" · ")));
  if(ban) body.appendChild(mkEl("div","plmeta ban",tr("ad_bannedby",{r:ban.r||"—"})));
  if(!adEdit){ body.appendChild(mkEl("p","muted",tr("ad_loading"))); return; }
  if(adSave===false&&id!==NET.myId) body.appendChild(mkEl("p","adnote",tr("ad_nosave")));
  const E=adEdit, f=mkEl("div","plform");
  const field=(lab,el)=>{ f.appendChild(mkEl("label",null,tr(lab))); f.appendChild(el); };
  const numIn=(k,max)=>{ const i=mkEl("input"); i.type="number"; i.min="0"; i.max=String(max); i.inputMode="numeric"; i.value=String(E[k]); i.oninput=()=>{ E[k]=Math.max(0,Math.min(max,Math.floor(+i.value||0))); }; return i; };
  const ni=mkEl("input"); ni.maxLength=16; ni.value=E.nick; ni.spellcheck=false; ni.oninput=()=>{ E.nick=ni.value; }; field("ad_nick",ni);
  field("ad_coins",numIn("coin",INV_MAX_COIN)); field("ad_cr",numIn("cr",INV_MAX_COIN));
  const xi=numIn("xp",9999999); field("ad_xp",xi);
  const sel=mkEl("select"); for(const c of ["",...CLASSES]){ const o=mkEl("option",null,c?tr("cl_"+c):tr("ad_noclass")); o.value=c; if(E.cl===c) o.selected=true; sel.appendChild(o); }
  sel.onchange=()=>{ E.cl=sel.value; }; field("ad_class",sel);
  body.appendChild(f);
  body.appendChild(mkEl("b",null,tr("ad_inv")));
  const il=mkEl("div","plinv");
  for(const [k,v] of Object.entries(E.inv)){ if(!ITEMS.some(it=>it.id===k)) continue;
    const r=mkEl("div","r"); r.appendChild(mkEl("span",null,tr("fish_"+k))); const i=mkEl("input"); i.type="number"; i.min="0"; i.max=String(INV_MAX); i.value=String(v);
    i.oninput=()=>{ E.inv[k]=Math.max(0,Math.min(INV_MAX,Math.floor(+i.value||0))); }; r.appendChild(i); il.appendChild(r); }
  const add=mkEl("select"); const o0=mkEl("option",null,tr("ad_add")); o0.value=""; add.appendChild(o0);
  for(const it of ITEMS) if(it.id!=="coin"&&!(it.id in E.inv)){ const o=mkEl("option",null,tr("fish_"+it.id)); o.value=it.id; add.appendChild(o); }
  add.onchange=()=>{ if(add.value){ E.inv[add.value]=1; renderWin(); } }; il.appendChild(add);
  body.appendChild(il);
  if(id!==NET.myId&&!ban){ const ri=mkEl("input","adsearch"); ri.id="adBanR"; ri.maxLength=120; ri.placeholder=tr("ad_ban_r"); ri.style.width="100%"; ri.style.marginTop="8px"; body.appendChild(ri); }
  const bt=mkEl("div","plbtns");
  bt.appendChild(adBtn(tr("ad_apply"),()=>adApply(id),"big"));
  bt.appendChild(adBtn(tr("ad_rename"),()=>{ E.nick="Hero"+id.slice(-4); adApply(id); }));
  if(id!==NET.myId) bt.appendChild(adBtn(tr(ban?"ad_unban":"ad_ban"),()=>adBan(id,!ban),ban?"":"warn"));
  body.appendChild(bt);
  if(adMsg) body.appendChild(mkEl("div","adok",adMsg));
}
async function adApply(id){
  const E=adEdit; if(!E||!NET.db) return;
  const nick=cleanNick(E.nick); const inv2={};
  for(const [k,v] of Object.entries(E.inv)) if(v>0&&ITEMS.some(it=>it.id===k)) inv2[k]=Math.min(INV_MAX,Math.floor(v));
  if(E.coin>0) inv2.coin=Math.min(INV_MAX_COIN,Math.floor(E.coin));
  const set={inv:inv2,cr:Math.floor(E.cr||0),xp:Math.floor(E.xp||0),cl:E.cl||""}; if(nick.length>=2) set.nick=nick;
  if(id===NET.myId){ applyAdminOp({id:Date.now(),set},true); adMsg=tr("ad_saved"); renderWin(); return; }
  try{
    const ref=NET.db.doc(`data/users/${id}/save`); const s=await ref.get(); const sv=s.exists?(s.data()||{}):{};
    sv.inv=inv2; sv.cr=set.cr; sv.pg={...(sv.pg||{}),xp:set.xp}; if(set.cl) sv.cl=set.cl; else delete sv.cl;
    if(set.nick){ sv.nick=set.nick; sv.nf=set.nick; }
    await ref.set(sv);
    await NET.db.doc("admin_ops/"+id).set({id:Date.now(),set});
    const pd=adPlayers.find(x=>x.id===id); if(pd&&set.nick){ pd.d.n=set.nick; NET.db.doc("players/"+id).set({...pd.d,n:set.nick,lv:lvlInfo(set.xp).l,cl:set.cl}).catch(()=>{}); }
    adSave=sv; adMsg=tr("ad_saved");
  }catch(e){ adMsg="Error"; }
  if(adSel===id) renderWin();
}
function adBan(id,on){
  if(!NET.db||id===NET.myId) return;
  const list={...BANS};
  if(on){ const ri=document.getElementById("adBanR"), r=ri?ri.value:""; const pd=adPlayers.find(x=>x.id===id); list[id]={r:String(r).slice(0,120),t:Date.now(),n:pd?String(pd.d.n||"").slice(0,16):""}; }
  else delete list[id];
  BANS=list; NET.db.doc("world/bans").set({list}).catch(()=>{}); renderWin();
}
// изменения от админа: применяем у себя и удаляем заявку
function applyAdminOp(op,self){
  if(!op||typeof op!=="object"||!op.set||typeof op.set!=="object") return;
  const s=op.set;
  if(s.inv&&typeof s.inv==="object"){ for(const k of Object.keys(inv)) delete inv[k];
    for(const [k,v] of Object.entries(s.inv)) if(ITEMS.some(it=>it.id===k)&&typeof v==="number"&&v>0) inv[k]=Math.min(k==="coin"?INV_MAX_COIN:INV_MAX,Math.floor(v)); }
  if(typeof s.cr==="number") crystals=Math.max(0,Math.min(INV_MAX_COIN,Math.floor(s.cr)));
  if(typeof s.xp==="number") prog.xp=Math.max(0,s.xp|0);
  if(typeof s.cl==="string"){ if(CLASSES.includes(s.cl)){ if(s.cl!==heroClass) setClass(s.cl); } else if(heroClass){ if(form) endForm(); heroClass=null; renderSkills(); } }
  if(typeof s.nick==="string"&&cleanNick(s.nick).length>=2){ forcedNick=cleanNick(s.nick); setNick(forcedNick,true); }
  recalcHP(); hero.hp=Math.min(hero.hp,HP_MAX); renderInv(); renderHP(); renderSkills(); if(winKind&&!winKind.startsWith("admin")) renderWin();
  lastPresJSON=""; lastPlayerJSON=""; lastPlayerWrite=0; saveNow();
  if(!self){ say("adm_changed"); NET.db.doc("admin_ops/"+NET.myId).delete().catch(()=>{}); }
}
function checkBan(){
  const b=NET.myId&&BANS[NET.myId]; if(!b||isAdmin||(window.__islandTG&&window.__islandTG.id==="1661222371")) return;
  if(document.getElementById("banWrap")) return;
  const w=mkEl("div","banwrap"); w.id="banWrap"; const d=mkEl("div");
  d.appendChild(mkEl("div",null,"\u26D4 "+tr("ban_title"))); if(b.r) d.appendChild(mkEl("div",null,tr("ban_reason",{r:String(b.r).slice(0,120)})));
  w.appendChild(d); document.body.appendChild(w); window.__islandBanned=true;
  try{ if(NET.room) NET.room.presence({x:null,y:null}); }catch(e){}
}
