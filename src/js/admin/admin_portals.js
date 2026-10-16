// ---- админка: порталы (каждый настраивается отдельно: куда ведёт, где появится игрок, вид, уровень) ----
let ptSel=null, ptDraft=null, ptDelAsk=false;
function ptOpen(id){
  if(!LINKS[id]) return; ptSel=id; ptDraft={...LINKS[id],id}; ptDelAsk=false; adMsg="";
  if(winKind==="admin_portals"&&!document.getElementById("win").hidden) renderWin(); else { winKind=null; openWin("admin_portals"); }
}
const ptLabel=L=>L.name||(L.to?"→ "+zoneName(L.to):tr("pt_nowhere_short"));
function ptArrText(L){
  if(!L.to) return tr("pt_to_none");
  if(L.arr==="start") return tr("pt_arr_start");
  if(L.arr==="cell") return L.ac?tr("pt_cell",{x:L.ac[0],y:L.ac[1]}):tr("pt_cell_none");
  const t=L.ap&&LINKS[L.ap]&&LINKS[L.ap].z===L.to?LINKS[L.ap]:Object.values(LINKS).find(x=>x.z===L.to&&x.to===L.z);
  return t?tr("pt_arr_link")+": "+ptLabel(t):tr("pt_arr_start");
}
function renderAdminPortals(body){
  if(!isAdmin){ closeWin(); return; }
  if(ptSel&&LINKS[ptSel]){ renderPortalCard(body); return; }
  ptSel=null; adHead(body);
  const ids=Object.keys(LINKS);
  if(!ids.length) body.appendChild(mkEl("p","muted",tr("pt_none")));
  for(const z of allZones()){ const here=ids.filter(id=>LINKS[id].z===z); if(!here.length) continue;
    body.appendChild(mkEl("b","sub",zoneName(z)+(z===ZONE?" ⭐":"")));
    const l=mkEl("div","pllist");
    for(const id of here){ const L=LINKS[id], b=mkEl("button","btn itrow"); b.type="button";
      b.appendChild(mkEl("span","znic",L.on?"\u{1F300}":"\u{1F512}"));
      const nm=mkEl("span","nm"); nm.appendChild(mkEl("b",null,ptLabel(L)));
      const meta=[tr("zn_at",{x:L.x,y:L.y}),ptArrText(L)]; if(L.lv>1) meta.push(tr("pt_lv_short",{n:L.lv})); if(!L.on) meta.push(tr("pt_closed_tag"));
      nm.appendChild(mkEl("small",null,meta.join(" · "))); b.appendChild(nm);
      b.onclick=()=>ptOpen(id); l.appendChild(b); }
    body.appendChild(l); }
  body.appendChild(mkEl("p","adnote",tr("pt_how")));
}
function renderPortalCard(body){
  const E=ptDraft, id=E.id;
  adHead(body,()=>{ ptSel=null; ptDraft=null; adMsg=""; renderWin(); });
  body.appendChild(mkEl("b",null,"\u{1F300} "+ptLabel(E)));
  body.appendChild(mkEl("div","plmeta",tr("pt_on_map",{z:zoneName(E.z),x:E.x,y:E.y})));
  const f=mkEl("div","plform");
  const nm=mkEl("input"); nm.maxLength=28; nm.value=E.name||""; nm.placeholder=E.to?"→ "+zoneName(E.to):""; nm.oninput=()=>{ E.name=nm.value; }; bsField(f,"pt_name",nm);
  const to=mkEl("select"); { const o=mkEl("option",null,tr("pt_to_none")); o.value=""; to.appendChild(o); }
  for(const z of allZones()) if(z!==E.z){ const o=mkEl("option",null,zoneName(z)); o.value=z; o.selected=E.to===z; to.appendChild(o); }
  to.onchange=()=>{ E.to=to.value; E.ap=""; if(E.arr==="cell") E.ac=null; E.look=zoneKind(E.to)==="cave"&&zoneKind(E.z)!=="cave"?"cave":zoneKind(E.z)==="cave"&&zoneKind(E.to)!=="cave"?"ladder":"portal"; renderWin(); };
  bsField(f,"pt_to",to);
  body.appendChild(f);
  if(E.to){
    body.appendChild(mkEl("b",null,tr("pt_arr")));
    const sg=mkEl("div","mbseg"); for(const a of ["link","start","cell"]) sg.appendChild(adBtn(tr("pt_arr_"+a),()=>{ E.arr=a; renderWin(); },E.arr===a?"on":"")); body.appendChild(sg);
    const f2=mkEl("div","plform");
    if(E.arr==="link"){ const there=Object.keys(LINKS).filter(k=>LINKS[k].z===E.to&&k!==id);
      if(!there.length) f2.appendChild(mkEl("p","adnote wide",tr("pt_no_portals")));
      else { const s=mkEl("select"); { const o=mkEl("option",null,tr("pt_ap_auto")); o.value=""; s.appendChild(o); }
        for(const k of there){ const o=mkEl("option",null,ptLabel(LINKS[k])+" · "+tr("zn_at",{x:LINKS[k].x,y:LINKS[k].y})); o.value=k; o.selected=E.ap===k; s.appendChild(o); }
        s.onchange=()=>{ E.ap=s.value; renderWin(); }; bsField(f2,"pt_ap",s);
        const tgt=E.ap&&LINKS[E.ap]; if(tgt&&!(tgt.to===E.z&&tgt.ap===id)){ const bb=adBtn(tr("pt_backlink"),()=>{
            lkWrite({...LINKS,[E.ap]:{...LINKS[E.ap],to:E.z,arr:"link",ap:id}}); adMsg=tr("pt_backlinked"); renderWin(); }); bb.classList.add("wide"); f2.appendChild(bb); } } }
    if(E.arr==="cell"){ f2.appendChild(mkEl("p","adnote wide",E.ac?tr("pt_cell",{x:E.ac[0],y:E.ac[1]}):tr("pt_cell_none")));
      const pb=adBtn(tr("pt_pick"),()=>{ if(!LINKS[id]||LINKS[id].to!==E.to){ adMsg=tr("pt_save_first"); renderWin(); return; }
        try{ sessionStorage.setItem("pa_pt_pick",id); }catch(e){} closeWin();
        if(E.to===ZONE){ if(!EDIT) edEnter("map"); ptAfterReedit(); } else travelTo(E.to,"start",true); }); pb.classList.add("wide"); f2.appendChild(pb); }
    body.appendChild(f2); }
  const f3=mkEl("div","plform");
  const lk=mkEl("select"); for(const v of LINK_LOOKS){ const o=mkEl("option",null,tr("zn_look_"+v)); o.value=v; o.selected=E.look===v; lk.appendChild(o); } lk.onchange=()=>{ E.look=lk.value; }; bsField(f3,"pt_look",lk);
  bsField(f3,"pt_lv",bsNum(E,"lv",0,60));
  f3.appendChild(bsChk(E,"on","pt_on","wide"));
  body.appendChild(f3);
  const bt=mkEl("div","plbtns");
  bt.appendChild(adBtn(tr("it_save"),()=>{ const v=lkSanitize(id,E); if(!v) return; lkWrite({...LINKS,[id]:v}); ptDraft={...LINKS[id],id}; adMsg=tr("pt_saved"); renderWin(); },"big"));
  bt.appendChild(adBtn(tr("pt_show"),()=>{ closeWin(); if(E.z===ZONE) ptCenter(E); else travelTo(E.z,"lid:"+id); }));
  bt.appendChild(adBtn(tr(ptDelAsk?"it_del_ok":"it_del"),()=>{ if(!ptDelAsk){ ptDelAsk=true; renderWin(); return; } const l={...LINKS}; delete l[id]; lkWrite(l); ptSel=null; ptDraft=null; renderWin(); },"warn"));
  body.appendChild(bt);
  if(adMsg) body.appendChild(mkEl("div","adok",adMsg));
}
function ptCenter(L){ const c=cellAt(L.x,L.y); if(!c) return; follow=false; document.getElementById("follow").setAttribute("aria-pressed","false");
  const [fx,fy]=proj(c.x-MX,c.y-MY,c.L), r=cv.getBoundingClientRect(); panX=r.width/2-fx*scale; panY=r.height/2-(fy-20)*scale; dirty=true; }
// после перехода «выбрать клетку появления»: включаем инструмент в редакторе
function ptAfterReedit(){
  let id=null; try{ id=sessionStorage.getItem("pa_pt_pick"); sessionStorage.removeItem("pa_pt_pick"); }catch(e){}
  if(!id||!LINKS[id]||!EDIT) return; edCat="places"; edTool="parr_"+id; edRender(); say("pt_pick_hint");
}
function ptPickAt(id,c){
  const L=LINKS[id]; if(!L||!c||c.blocked||wet(c)||L.to!==ZONE) return false;
  lkWrite({...LINKS,[id]:{...L,arr:"cell",ac:[c.x,c.y]}}); say("pt_arr_set"); edTool="start"; edRender(); ptOpen(id); return true;
}
