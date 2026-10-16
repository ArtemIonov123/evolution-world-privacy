// ---- админка: острова, пещеры и переходы ----
let znSel=null, znDraft=null, znDelAsk=false;
function zoneSize(z){ if(z===ZONE) return W+"×"+D; const o=ZONES[z]; return o?o.w+"×"+o.d:""; }
function renderAdminZones(body){
  if(!isAdmin){ closeWin(); return; }
  if(znSel){ renderZoneCard(body); return; }
  adHead(body);
  const nb=adBtn(tr("zn_new"),()=>{ znSel="new"; znDelAsk=false; adMsg=""; znDraft={ru:"",pl:"",k:"island",w:20,d:20,isNew:true}; renderWin(); },"big");
  nb.style.width="100%"; nb.style.marginBottom="8px"; body.appendChild(nb);
  body.appendChild(mkEl("b","sub",tr("zn_list")));
  const l=mkEl("div","pllist");
  for(const z of allZones()){ const row=mkEl("div","btn itrow znrow");
    row.appendChild(mkEl("span","znic",zoneKind(z)==="cave"?"⛰️":"\u{1F3DD}️"));
    const nm=mkEl("span","nm"); nm.appendChild(mkEl("b",null,zoneName(z)));
    const meta=[tr("zn_k_"+zoneKind(z))]; const sz=zoneSize(z); if(sz) meta.push(sz); if(z==="island"||z==="cave") meta.push(tr("zn_builtin"));
    meta.push(tr("zn_links_n",{n:Object.values(LINKS).filter(x=>x.z===z).length})); if(z===ZONE) meta.push("⭐ "+tr("zn_here"));
    nm.appendChild(mkEl("small",null,meta.join(" · "))); row.appendChild(nm);
    const acts=mkEl("span","znacts");
    if(z!==ZONE) acts.appendChild(adBtn(tr("zn_go"),()=>{ closeWin(); travelTo(z,"start"); },"mini"));
    acts.appendChild(adBtn("✎",()=>{ if(z===ZONE){ closeWin(); edEnter("map"); } else { closeWin(); travelTo(z,"start",true); } },"mini"));
    if(ZID.test(z)) acts.appendChild(adBtn("⚙",()=>{ znSel=z; znDelAsk=false; adMsg=""; znDraft={...ZONES[z],id:z}; renderWin(); },"mini"));
    row.appendChild(acts); l.appendChild(row); }
  body.appendChild(l);
  // переходы
  body.appendChild(mkEl("b","sub",tr("zn_links")));
  const ids=Object.keys(LINKS);
  if(!ids.length) body.appendChild(mkEl("p","muted",tr("zn_links_none")));
  const ll=mkEl("div","pllist");
  for(const id of ids){ const L=LINKS[id], row=mkEl("div","btn itrow znrow");
    const nm=mkEl("span","nm"); nm.appendChild(mkEl("b",null,zoneName(L.z)+" → "+zoneName(L.to)));
    const back=Object.values(LINKS).some(x=>x.z===L.to&&x.to===L.z);
    nm.appendChild(mkEl("small",null,tr("zn_at",{x:L.x,y:L.y})+(back?"":" · ⚠ "+tr("zn_noback")))); row.appendChild(nm);
    const sel=mkEl("select","znlook"); for(const lk of LINK_LOOKS){ const o=mkEl("option",null,tr("zn_look_"+lk)); o.value=lk; o.selected=L.look===lk; sel.appendChild(o); }
    sel.onchange=()=>{ const list={...LINKS,[id]:{...L,look:sel.value}}; lkWrite(list); };
    row.appendChild(sel);
    row.appendChild(adBtn("✕",()=>{ const list={...LINKS}; delete list[id]; lkWrite(list); },"mini warn"));
    ll.appendChild(row); }
  body.appendChild(ll);
  body.appendChild(mkEl("p","adnote",tr("zn_links_how")));
  if(adMsg) body.appendChild(mkEl("div","adok",adMsg));
}
function renderZoneCard(body){
  const E=znDraft; if(!E){ znSel=null; return renderAdminZones(body); }
  adHead(body,()=>{ znSel=null; znDraft=null; adMsg=""; renderWin(); });
  const f=mkEl("div","plform");
  const txt=k=>{ const i=mkEl("input"); i.maxLength=24; i.value=E[k]||""; i.spellcheck=false; i.oninput=()=>{ E[k]=i.value; }; return i; };
  bsField(f,"it_name_ru",txt("ru")); bsField(f,"it_name_pl",txt("pl"));
  if(E.isNew){
    const ks=mkEl("div","mbseg"); for(const k of ["island","cave"]) ks.appendChild(adBtn(tr("zn_k_"+k),()=>{ E.k=k; renderWin(); },E.k===k?"on":"")); bsField(f,"zn_kind",ks);
    if(E.k==="island"){ const ss=mkEl("div","mbseg"); for(const v of [16,20,24,28]) ss.appendChild(adBtn(v+"×"+v,()=>{ E.w=E.d=v; renderWin(); },E.w===v?"on":"")); bsField(f,"zn_size",ss); }
  } else bsField(f,"zn_kind",mkEl("span",null,tr("zn_k_"+E.k)+" · "+E.w+"×"+E.d));
  body.appendChild(f);
  body.appendChild(mkEl("p","adnote",tr(E.isNew?(E.k==="cave"?"zn_new_cave":"zn_new_island"):"zn_edit_note")));
  const bt=mkEl("div","plbtns");
  bt.appendChild(adBtn(tr(E.isNew?"zn_create":"it_save"),()=>znSave(),"big"));
  if(!E.isNew){
    bt.appendChild(adBtn(tr("zn_go"),()=>{ closeWin(); travelTo(E.id,"start"); }));
    bt.appendChild(adBtn(tr(znDelAsk?"it_del_ok":"it_del"),()=>{ if(!znDelAsk){ znDelAsk=true; renderWin(); return; } znDelete(E.id); },"warn")); }
  body.appendChild(bt);
  if(adMsg) body.appendChild(mkEl("div","adok",adMsg));
}
async function znSave(){
  const E=znDraft; const id=E.id||("z"+Math.random().toString(36).slice(2,9).replace(/[^a-z0-9]/g,"x"));
  if(E.k==="cave"){ E.w=CAVE_DEFAULT.levels[0].length; E.d=CAVE_DEFAULT.levels.length; }
  const z=znSanitize(id,E); if(!z){ adMsg=tr("it_noname"); renderWin(); return; }
  if(E.isNew&&NET.db){   // новая карта: остров — случайный, пещера — из шаблона
    const m=E.k==="cave"?(()=>{ const c=JSON.parse(JSON.stringify(CAVE_DEFAULT)); delete c.exit; delete c.boss; return c; })():(()=>{ const g=genIsland(z.w,z.d); for(const k of ["hut","npc","merchant","stall","pier","cave","exit","boss"]) delete g[k]; return g; })();
    const v=Date.now(); await NET.db.doc("world/map_"+id).set({v,m:JSON.stringify(m)}).catch(()=>{});
    try{ localStorage.setItem(mapKey(id),JSON.stringify({v,m})); }catch(e){}
  }
  const list={...ZONES,[id]:z}; applyZones({list}); if(NET.db) await NET.db.doc("world/zones").set({list}).catch(()=>{});
  znSel=id; znDraft={...ZONES[id],id}; adMsg=tr(E.isNew?"zn_created":"it_saved"); renderWin();
}
async function znDelete(id){
  const list={...ZONES}; delete list[id];
  const links={}; for(const [k,v] of Object.entries(LINKS)) if(v.z!==id&&v.to!==id) links[k]=v;
  if(NET.db){ await NET.db.doc("world/zones").set({list}).catch(()=>{}); await NET.db.doc("world/links").set({list:links}).catch(()=>{}); NET.db.doc("world/map_"+id).delete().catch(()=>{}); }
  applyLinks({list:links}); applyZones({list}); znSel=null; znDraft=null; adMsg=""; renderWin();
}
