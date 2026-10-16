let mbSel=null, mbDraft=null, mbDelAsk=false;
const mbRid=()=>"m"+Math.random().toString(36).slice(2,9).replace(/[^a-z0-9]/g,"x");
const mbName=m=>LANG==="ru"?m.ru:m.pl;
function renderAdminMobs(body){
  if(!isAdmin){ closeWin(); return; }
  if(mbSel&&mbDraft&&mbDraft.builtin){ renderBuiltinMob(body); return; }
  if(mbSel){ renderMobCard(body); return; }
  adHead(body);
  const nb=adBtn(tr("mb_new"),()=>{ mbSel=mbRid(); mbDelAsk=false; adMsg="";
    mbDraft={id:mbSel,ru:"",pl:"",b:"wolf",hue:0,sz:100,zn:CAVE?"cave":"island",ai:"night",hp:6,dmg:1,spd:2,range:5,xp:15,d:1,dn:2,n:1,nn:3,cn:3,isNew:true}; renderWin(); },"big");
  nb.style.width="100%"; nb.style.marginBottom="8px"; body.appendChild(nb);
  const ids=Object.keys(CMOBS).filter(k=>!CMOBS[k].boss);
  body.appendChild(mkEl("b","sub",tr("mb_custom")));
  if(!ids.length) body.appendChild(mkEl("p","muted",tr("mb_none")));
  const l=mkEl("div","pllist");
  for(const id of ids){ const m=CMOBS[id], b=mkEl("button","btn itrow"); b.type="button";
    const im=mkEl("img"); im.src=mobPreview(id,32); im.alt=""; b.appendChild(im);
    const nm=mkEl("span","nm"); nm.appendChild(mkEl("b",null,mbName(m)));
    const when=zoneKind(m.zn)==="cave"?zoneName(m.zn)+" \u00D7"+m.cn:zoneName(m.zn)+(m.d&&m.dn?" \u2600"+m.dn:"")+(m.n&&m.nn?" \u263E"+m.nn:"");
    nm.appendChild(mkEl("small",null,tr("mb_ai_"+m.ai)+" \u00B7 HP "+m.hp+" \u00B7 "+tr("mb_dmg").split(" ")[0]+" "+m.dmg+" \u00B7 "+when)); b.appendChild(nm);
    b.onclick=()=>{ mbSel=id; mbDelAsk=false; adMsg=""; mbDraft={...m}; renderWin(); }; l.appendChild(b); }
  body.appendChild(l);
  body.appendChild(mkEl("b","sub",tr("mb_builtin")));
  const l2=mkEl("div","pllist");
  for(const k of ["wolf","bat","spider"]){ const b=mkEl("button","btn itrow"); b.type="button"; const im=mkEl("img"); im.src=SPRITES[k+"_se_0"]||""; im.alt=""; b.appendChild(im);
    const nm=mkEl("span","nm"); nm.appendChild(mkEl("b",null,tr("ed_src_"+k)));
    const t=k==="spider"?" \u26F0"+mobCount(k,"n"):(mobT(k,"d")&&mobCount(k,"d")?" \u2600"+mobCount(k,"d"):"")+(mobT(k,"n")&&mobCount(k,"n")?" \u263E"+mobCount(k,"n"):"");
    nm.appendChild(mkEl("small",null,"HP "+mobHp(k)+" \u00B7 "+tr("mb_dmg").split(" ")[0]+" "+(CFG.mobDmg[k]||1)+" \u00B7 "+xpOf(k)+" XP"+t)); b.appendChild(nm);
    b.onclick=()=>{ mbSel="b:"+k; adMsg=""; mbDraft={id:k,builtin:true,hp:mobHp(k),dmg:CFG.mobDmg[k]||1,spd:CFG.mobSpd[k]||2,xp:xpOf(k)??0,d:mobT(k,"d")?1:0,dn:mobCount(k,"d"),n:mobT(k,"n")?1:0,nn:mobCount(k,"n")}; renderWin(); }; l2.appendChild(b); }
  body.appendChild(l2);

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
}
function renderMobCard(body){
  const E=mbDraft; if(!E){ mbSel=null; return renderAdminMobs(body); }
  adHead(body,()=>{ mbSel=null; mbDraft=null; adMsg=""; renderWin(); });
  const pv=mkEl("div","mbprev"), pc=mkEl("canvas"); pc.width=pc.height=96; pv.appendChild(pc); const pt=mkEl("b",null,""); pv.appendChild(pt); body.appendChild(pv);
  const prev=()=>{ const g=pc.getContext("2d"); g.clearRect(0,0,96,96); g.imageSmoothingEnabled=false; const sp=draftSprite(E,()=>prev());
    if(sp){ const t=document.createElement("canvas"); t.width=sp.width; t.height=sp.height; t.getContext("2d").drawImage(sp,0,0); hueShift(t,E.hue);
      const k=Math.min(2,80/Math.max(sp.width,sp.height)*1.25)*E.sz/100*0.8; g.drawImage(t,48-sp.width*k/2,90-sp.height*k,sp.width*k,sp.height*k); }
    pt.textContent=(LANG==="ru"?E.ru||E.pl:E.pl||E.ru)||"\u2026"; };
  const f=mkEl("div","plform");
  const field=(lab,el)=>{ f.appendChild(mkEl("label",null,tr(lab))); f.appendChild(el); return el; };
  const txt=(k,max)=>{ const i=mkEl("input"); i.maxLength=max; i.value=E[k]; i.spellcheck=false; i.oninput=()=>{ E[k]=i.value; prev(); }; return i; };
  const num=(k,lo,hi)=>{ const i=mkEl("input"); i.type="number"; i.min=String(lo); i.max=String(hi); i.inputMode="numeric"; i.value=String(E[k]); i.oninput=()=>{ E[k]=Math.max(lo,Math.min(hi,Math.round(+i.value||0))); }; return i; };
  const seg=(k,opts,lab)=>{ const w=mkEl("div","mbseg"); for(const [v,t] of opts){ const b=adBtn(t,()=>{ E[k]=v; renderWin(); },E[k]===v?"on":""); w.appendChild(b); } return w; };
  field("it_name_ru",txt("ru",24)); field("it_name_pl",txt("pl",24));
  body.appendChild(f);
  body.appendChild(mkEl("b",null,tr("mb_look")));
  const bases=mkEl("div","mbbase");
  for(const bk of MB_BASES){ const b=mkEl("button","btn"+(E.b===bk?" on":"")); b.type="button"; const im=mkEl("img"); im.src=SPRITES[bk+"_se_0"]||""; im.alt=""; b.appendChild(im); b.appendChild(mkEl("span",null,tr("mb_b_"+bk)));
    b.onclick=()=>{ E.b=bk; renderWin(); }; bases.appendChild(b); }
  body.appendChild(bases);
  renderUpSlots(body,E,64);
  const f2=mkEl("div","plform");
  const rng=(k,lo,hi,lab)=>{ const r=mkEl("input"); r.type="range"; r.min=String(lo); r.max=String(hi); r.value=String(E[k]); r.oninput=()=>{ E[k]=+r.value; prev(); }; f2.appendChild(mkEl("label",null,tr(lab))); f2.appendChild(r); };
  rng("hue",0,359,"it_hue"); rng("sz",60,200,"mb_size");
  f2.appendChild(mkEl("label",null,tr("mb_where"))); f2.appendChild(seg("zn",allZones().map(z=>[z,zoneName(z)])));
  body.appendChild(f2);
  body.appendChild(mkEl("b",null,tr("mb_ai")));
  body.appendChild(seg("ai",MB_AI.map(a=>[a,tr("mb_ai_"+a)])));
  body.appendChild(mkEl("p","adnote",tr("mb_ai_"+E.ai+"_d")));
  const f3=mkEl("div","plform"); const fd=(lab,el)=>{ f3.appendChild(mkEl("label",null,tr(lab))); f3.appendChild(el); };
  fd("mb_hp",num("hp",1,999)); fd("mb_dmg",num("dmg",1,10));
  f3.appendChild(mkEl("label",null,tr("mb_spd"))); f3.appendChild(seg("spd",[1,2,3,4].map(v=>[v,tr("mb_spd_"+v)])));
  fd("mb_range",num("range",2,10)); fd("mb_xp",num("xp",0,5000));
  if(zoneKind(E.zn)==="cave") fd("mb_count",num("cn",0,20));
  else { const dl=mkEl("label","chk"), dc=mkEl("input"); dc.type="checkbox"; dc.checked=!!E.d; dc.onchange=()=>{ E.d=dc.checked?1:0; }; dl.append(dc,document.createTextNode(tr("mb_day"))); f3.appendChild(dl); f3.appendChild(num("dn",0,20));
    const nl=mkEl("label","chk"), nc=mkEl("input"); nc.type="checkbox"; nc.checked=!!E.n; nc.onchange=()=>{ E.n=nc.checked?1:0; }; nl.append(nc,document.createTextNode(tr("mb_night"))); f3.appendChild(nl); f3.appendChild(num("nn",0,20)); }
  body.appendChild(f3);
  body.appendChild(mkEl("p","adnote",tr("mb_note")));
  prev();
  const bt=mkEl("div","plbtns");
  bt.appendChild(adBtn(tr("it_save"),mbSave,"big"));
  if(!E.isNew&&CMOBS[E.id]){
    bt.appendChild(adBtn(tr("mb_loot"),()=>{ closeWin(); edEnter("drop"); edDropSel="mob:"+E.id; edRender(); }));
    if(E.zn===ZONE) bt.appendChild(adBtn(tr("mb_zone"),()=>{ closeWin(); edEnter("map"); edCat="places"; edTool="zone_"+E.id; edRender(); }));
    else bt.appendChild(adBtn(tr("mb_zone"),()=>{ adMsg=tr("mb_zone_other",{z:zoneName(E.zn)}); renderWin(); }));
    bt.appendChild(adBtn(tr(mbDelAsk?"it_del_ok":"it_del"),()=>{ if(!mbDelAsk){ mbDelAsk=true; renderWin(); return; } mbWrite(E.id,null); mbSel=null; mbDraft=null; renderWin(); },"warn")); }
  body.appendChild(bt);
  if(adMsg) body.appendChild(mkEl("div","adok",adMsg));
}
// «Своя картинка»: 5 ячеек, обязательна только первая
function renderUpSlots(body,E,max){
  body.appendChild(mkEl("b",null,tr("up_title")));
  const w=mkEl("div","upgrid");
  for(const k of UP_KEYS){ const cell=mkEl("div","upcell"+(k==="se0"?" req":"")), has=E.up&&E.up[k];
    const prevI=mkEl("div","upimg"); if(has){ const i=mkEl("img"); i.src=has; i.alt=""; prevI.appendChild(i); } else prevI.appendChild(mkEl("span",null,"+"));
    cell.appendChild(prevI); cell.appendChild(mkEl("small",null,tr("up_"+k)));
    const inp=mkEl("input"); inp.type="file"; inp.accept="image/png,image/*"; inp.style.display="none";
    inp.onchange=()=>{ const fl=inp.files&&inp.files[0]; if(!fl) return; upLoadFile(fl,max,url=>{ if(!url){ adMsg=tr("up_empty"); renderWin(); return; }
      if(k!=="se0"&&!(E.up&&E.up.se0)){ adMsg=tr("up_need_first"); renderWin(); return; }
      E.up={...(E.up||{}),[k]:url}; if(k==="se0") E.hue=0; adMsg=""; renderWin(); }); };
    prevI.onclick=()=>inp.click(); cell.appendChild(inp);
    if(has){ const x=adBtn("\u2715",()=>{ if(k==="se0") E.up=null; else { const u={...E.up}; delete u[k]; E.up=u; } renderWin(); },"upx"); cell.appendChild(x); }
    w.appendChild(cell); }
  body.appendChild(w);
  body.appendChild(mkEl("p","adnote",tr(E.up&&E.up.se0?"up_note_on":"up_note")));
}
function mbWrite(id,val){
  const list={}; for(const [k,v] of Object.entries(mobsRaw)) list[k]=v;
  if(val) list[id]=val; else delete list[id];
  applyMobs({list}); if(NET.db) NET.db.doc("world/mobs").set({list}).catch(()=>{});
}
function mbSave(){
  const E=mbDraft, m=mbSanitize(E.id,E); if(!m){ adMsg=tr("it_noname"); renderWin(); return; }
  delete m.id; mbWrite(E.id,m); mbDraft={...CMOBS[E.id]}; adMsg=tr("mb_saved"); renderWin();
}
