let itSel=null, itDraft=null, itDelAsk=false;
const itRid=()=>"c"+Math.random().toString(36).slice(2,9).replace(/[^a-z0-9]/g,"x");
function itLabel(it){ return LANG==="ru"?it.ru:it.pl; }
function renderAdminItems(body){
  if(!isAdmin){ closeWin(); return; }
  if(itSel){ renderItemCard(body); return; }
  adHead(body);
  const nb=adBtn(tr("it_new"),()=>{ itSel=itRid(); itDelAsk=false; adMsg=""; itDraft={id:itSel,t:"weapon",ru:"",pl:"",d:"",atk:3,def:0,hp:0,heal:0,lv:1,cl:"",seller:"merchant",price:50,sell:0,b:"",hue:0,img:"",isNew:true}; renderWin(); },"big");
  nb.style.width="100%"; nb.style.marginBottom="8px"; body.appendChild(nb);
  const ids=Object.keys(CUSTOM);
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
    nm.appendChild(mkEl("small",null,(BASE.gear[id]&&ds?ds:tr("it_t_"+baseType(id))+(ds?" · "+ds:""))+(OVR[id]?" · \u270E "+tr("it_edited"):""))); b.appendChild(nm);
    b.onclick=()=>{ itSel=id; itDelAsk=false; adMsg=""; itDraft=OVR[id]?{...OVR[id],id,builtin:true}:baseDraft(id); renderWin(); }; l2.appendChild(b); }
  body.appendChild(l2);
}
function renderItemCard(body){
  const E=itDraft; if(!E){ itSel=null; return renderAdminItems(body); }
  adHead(body,()=>{ itSel=null; itDraft=null; adMsg=""; renderWin(); });
  const pv=mkEl("div","itprev"), pim=mkEl("img"); pim.alt=""; pv.appendChild(pim); const pt=mkEl("b",null,E.ru||E.pl||"…"); pv.appendChild(pt); body.appendChild(pv);
  const prev=()=>{ const cv=customIcon(E,()=>{ pim.src=cv.toDataURL(); }); pim.src=cv.toDataURL(); pt.textContent=(LANG==="ru"?E.ru||E.pl:E.pl||E.ru)||"…"; };
  const f=mkEl("div","plform");
  const field=(lab,el,cls)=>{ const L=mkEl("label",null,tr(lab)); f.appendChild(L); f.appendChild(el); if(cls){ L.classList.add(cls); el.classList.add(cls); } return el; };
  const txt=(k,max)=>{ const i=mkEl("input"); i.maxLength=max; i.value=E[k]; i.spellcheck=false; i.oninput=()=>{ E[k]=i.value; prev(); }; return i; };
  const num=(k,hi)=>{ const i=mkEl("input"); i.type="number"; i.min="0"; i.max=String(hi); i.inputMode="numeric"; i.value=String(E[k]); i.oninput=()=>{ E[k]=itNum(i.value,hi); }; return i; };
  field("it_name_ru",txt("ru",24)); field("it_name_pl",txt("pl",24)); field("it_desc",txt("d",120));
  const ts=mkEl("select"); if(E.builtin){ const o=mkEl("option",null,tr("it_t_"+E.t)+" \u2014 "+tr("it_type_fixed")); ts.appendChild(o); ts.disabled=true; } else for(const t of IT_TYPES){ const o=mkEl("option",null,tr("it_t_"+t)); o.value=t; o.selected=E.t===t; ts.appendChild(o); }
  ts.onchange=()=>{ E.t=ts.value; if(!E.img&&!E.b) prev(); renderWin(); }; field("it_type",ts);
  const gear=["weapon","head","body","feet","neck"].includes(E.t);
  if(E.t==="weapon") field("it_atk",num("atk",99));
  if(gear&&E.t!=="weapon") field("it_def",num("def",99));
  if(gear) field("it_hp",num("hp",99));
  if(E.t==="potion") field("it_heal",num("heal",99));
  if(gear){ field("it_lv",num("lv",60));
    const cs=mkEl("select"); for(const c of ["",...CLASSES]){ const o=mkEl("option",null,c?tr("cl_"+c):tr("it_any")); o.value=c; o.selected=E.cl===c; cs.appendChild(o); }
    cs.onchange=()=>{ E.cl=cs.value; }; field("it_cl",cs); }
  if(E.seller===undefined) E.seller=E.shop?"merchant":"";
  const sh=mkEl("label","chk wide"), cb=mkEl("input"); cb.type="checkbox"; cb.checked=!!E.seller; cb.onchange=()=>{ E.seller=cb.checked?(E.lastSeller||"merchant"):""; renderWin(); };
  sh.appendChild(cb); sh.appendChild(document.createTextNode(tr("it_shop"))); f.appendChild(sh);
  if(E.seller){ const ss=mkEl("select"); for(const v of ["merchant","npc"]){ const o=mkEl("option",null,tr("seller_"+v)); o.value=v; o.selected=E.seller===v; ss.appendChild(o); }
    ss.onchange=()=>{ E.seller=ss.value; E.lastSeller=ss.value; }; field("it_seller",ss); field("it_price",num("price",999999)); }
  else { const n=mkEl("p","adnote wide",tr("it_nobuy")); f.appendChild(n); }
  field("it_sell",num("sell",999999));
  const na=mkEl("p","adnote wide",tr("it_sell_auto")); f.appendChild(na);
  body.appendChild(f);
  // иконка: готовая из игры (+ сдвиг цвета) или своя картинка
  body.appendChild(mkEl("b",null,tr("it_icon")));
  const grid=mkEl("div","itgrid");
  for(const it of ITEMS){ if(it.custom||!ICONS[it.id]) continue; const ic=BASE&&BASE.icons[it.id]||ICONS[it.id]; const b=mkEl("button","btn"+(!E.img&&E.b===it.id?" on":"")); b.type="button"; b.title=tr("fish_"+it.id);
    const im=mkEl("img"); im.src=ic.toDataURL(); im.alt=""; b.appendChild(im); b.onclick=()=>{ E.b=it.id; E.img=""; renderWin(); }; grid.appendChild(b); }
  body.appendChild(grid);
  const f2=mkEl("div","plform");
  const hue=mkEl("input"); hue.type="range"; hue.min="0"; hue.max="359"; hue.value=String(E.hue); hue.oninput=()=>{ E.hue=+hue.value; prev(); }; f2.appendChild(mkEl("label",null,tr("it_hue"))); f2.appendChild(hue);
  const up=mkEl("input"); up.type="file"; up.accept="image/png,image/*"; up.style.display="none";
  up.onchange=()=>{ const fl=up.files&&up.files[0]; if(!fl) return; const rd=new FileReader(); rd.onload=()=>{ const im=new Image(); im.onload=()=>{
      const c=document.createElement("canvas"); c.width=c.height=32; const g=c.getContext("2d"), sc=Math.min(32/im.width,32/im.height);
      g.imageSmoothingEnabled=sc<0.5; g.imageSmoothingQuality="high"; const w=Math.round(im.width*sc), h=Math.round(im.height*sc); g.drawImage(im,(32-w)>>1,(32-h)>>1,w,h);
      E.img=c.toDataURL("image/png"); E.hue=0; renderWin(); }; im.src=rd.result; }; rd.readAsDataURL(fl); };
  const ub=adBtn(tr("it_upload"),()=>up.click()); f2.appendChild(mkEl("label",null,"")); f2.appendChild(ub); body.appendChild(f2); body.appendChild(up);
  prev();
  const bt=mkEl("div","plbtns");
  bt.appendChild(adBtn(tr("it_save"),itSave,"big"));
  if(!E.isNew){ bt.appendChild(adBtn(tr("it_give"),()=>{ giveItem(E.id); saveNow(); adMsg=tr("it_given"); renderWin(); }));
    if(E.builtin){ if(OVR[E.id]) bt.appendChild(adBtn(tr(itDelAsk?"it_reset_ok":"it_reset"),()=>{ if(!itDelAsk){ itDelAsk=true; renderWin(); return; } itWrite(E.id,null); itDelAsk=false; itDraft=baseDraft(E.id); adMsg=""; renderWin(); },"warn")); }
    else bt.appendChild(adBtn(tr(itDelAsk?"it_del_ok":"it_del"),()=>{ if(!itDelAsk){ itDelAsk=true; renderWin(); return; } itWrite(E.id,null); itSel=null; itDraft=null; renderWin(); },"warn")); }
  body.appendChild(bt);
  if(adMsg) body.appendChild(mkEl("div","adok",adMsg));
}
function itWrite(id,val){
  const list={}; for(const [k,v] of Object.entries(itemsRaw)) list[k]=v;
  if(val) list[id]=val; else delete list[id];
  applyItems({list}); if(NET.db) NET.db.doc("world/items").set({list}).catch(()=>{});
}
function itSave(){
  const E=itDraft; const it=itSanitize(E.id,E,!!E.builtin); if(!it){ adMsg=tr("it_noname"); renderWin(); return; }
  delete it.id; itWrite(E.id,it); itDraft=E.builtin?{...OVR[E.id],id:E.id,builtin:true}:{...CUSTOM[E.id]}; adMsg=tr("it_saved"); renderWin();
}
