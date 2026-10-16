// ---- админка: боссы (свои + встроенный Голем) ----
let bsSel=null, bsDraft=null, bsDelAsk=false;
const bsRid=()=>"bs"+Math.random().toString(36).slice(2,9).replace(/[^a-z0-9]/g,"x");
function renderAdminBosses(body){
  if(!isAdmin){ closeWin(); return; }
  if(bsSel&&bsDraft&&bsDraft.golem){ renderGolemCard(body); return; }
  if(bsSel){ renderBossCard(body); return; }
  adHead(body);
  const nb=adBtn(tr("bs_new"),()=>{ bsSel=bsRid(); bsDelAsk=false; adMsg="";
    bsDraft={id:bsSel,ru:"",pl:"",b:"golem",hue:0,sz:160,zn:CAVE?"cave":"island",hp:80,dmg:2,spd:1,range:6,xp:200,rsp:10,pos:null,
      slam:1,slamDmg:2,slamR:23,slamCd:7,sum:0,sumK:"bat",sumN:2,rage:1,rageAt:30,isNew:true}; renderWin(); },"big");
  nb.style.width="100%"; nb.style.marginBottom="8px"; body.appendChild(nb);
  body.appendChild(mkEl("b","sub",tr("mb_custom")));
  const ids=Object.keys(CMOBS).filter(k=>CMOBS[k].boss);
  if(!ids.length) body.appendChild(mkEl("p","muted",tr("bs_none")));
  const l=mkEl("div","pllist");
  for(const id of ids){ const m=CMOBS[id], b=mkEl("button","btn itrow"); b.type="button";
    const im=mkEl("img"); im.src=mobPreview(id,32); im.alt=""; b.appendChild(im);
    const nm=mkEl("span","nm"); nm.appendChild(mkEl("b",null,mbName(m)));
    const sk=[m.slam?"\u{1F4A5}":"",m.sum?"\u{1F987}":"",m.rage?"\u{1F525}":""].join("");
    nm.appendChild(mkEl("small",null,(m.zn==="cave"?tr("mb_cave"):tr("mb_island"))+" · HP "+m.hp+" · "+tr("bs_rsp_short",{n:m.rsp})+(sk?" · "+sk:"")+(m.pos?"":" · ⚠ "+tr("bs_nopos_short")))); b.appendChild(nm);
    b.onclick=()=>{ bsSel=id; bsDelAsk=false; adMsg=""; bsDraft={...m}; renderWin(); }; l.appendChild(b); }
  body.appendChild(l);
  body.appendChild(mkEl("b","sub",tr("mb_builtin")));
  const g=mkEl("button","btn itrow"); g.type="button"; const gi=mkEl("img"); gi.src=SPRITES.golem_se_0||""; gi.alt=""; g.appendChild(gi);
  const gn=mkEl("span","nm"); gn.appendChild(mkEl("b",null,tr("ed_src_golem")));
  gn.appendChild(mkEl("small",null,tr("mb_cave")+" · HP "+mobHp("golem")+" · "+tr("bs_rsp_short",{n:CFG.mobHp.golem_rsp??5})+" · \u{1F4A5}\u{1F987}")); g.appendChild(gn);
  g.onclick=()=>{ bsSel="golem"; adMsg=""; bsDraft={golem:true,hp:mobHp("golem"),xp:xpOf("golem")??150,rsp:CFG.mobHp.golem_rsp??5,slamDmg:CFG.mobDmg.golem||2}; renderWin(); };
  body.appendChild(g);
}
function bsField(f,lab,el){ f.appendChild(mkEl("label",null,tr(lab))); f.appendChild(el); return el; }
function bsNum(E,k,lo,hi){ const i=mkEl("input"); i.type="number"; i.min=String(lo); i.max=String(hi); i.inputMode="numeric"; i.value=String(E[k]); i.oninput=()=>{ E[k]=Math.max(lo,Math.min(hi,Math.round(+i.value||0))); }; return i; }
function bsChk(E,k,lab,cls){ const l=mkEl("label","chk"+(cls?" "+cls:"")), c=mkEl("input"); c.type="checkbox"; c.checked=!!E[k]; c.onchange=()=>{ E[k]=c.checked?1:0; renderWin(); }; l.append(c,document.createTextNode(tr(lab))); return l; }
function renderBossCard(body){
  const E=bsDraft; if(!E){ bsSel=null; return renderAdminBosses(body); }
  adHead(body,()=>{ bsSel=null; bsDraft=null; adMsg=""; renderWin(); });
  const pv=mkEl("div","mbprev"), pc=mkEl("canvas"); pc.width=pc.height=96; pv.appendChild(pc); const pt=mkEl("b",null,""); pv.appendChild(pt); body.appendChild(pv);
  const prev=()=>{ const g=pc.getContext("2d"); g.clearRect(0,0,96,96); g.imageSmoothingEnabled=false; const sp=img[E.b+"_se_0"];
    if(sp){ const t=document.createElement("canvas"); t.width=sp.width; t.height=sp.height; t.getContext("2d").drawImage(sp,0,0); hueShift(t,E.hue);
      const k=Math.min(2.4,88/Math.max(sp.width,sp.height))*Math.min(1,E.sz/180); g.drawImage(t,48-sp.width*k/2,92-sp.height*k,sp.width*k,sp.height*k); }
    pt.textContent=(LANG==="ru"?E.ru||E.pl:E.pl||E.ru)||"…"; };
  const f=mkEl("div","plform");
  const txt=k=>{ const i=mkEl("input"); i.maxLength=24; i.value=E[k]; i.spellcheck=false; i.oninput=()=>{ E[k]=i.value; prev(); }; return i; };
  bsField(f,"it_name_ru",txt("ru")); bsField(f,"it_name_pl",txt("pl")); body.appendChild(f);
  body.appendChild(mkEl("b",null,tr("mb_look")));
  const bases=mkEl("div","mbbase");
  for(const bk of MB_BASES){ const b=mkEl("button","btn"+(E.b===bk?" on":"")); b.type="button"; const im=mkEl("img"); im.src=SPRITES[bk+"_se_0"]||""; im.alt=""; b.appendChild(im); b.appendChild(mkEl("span",null,tr("mb_b_"+bk)));
    b.onclick=()=>{ E.b=bk; renderWin(); }; bases.appendChild(b); }
  body.appendChild(bases);
  const f2=mkEl("div","plform");
  const rng=(k,lo,hi,lab)=>{ const r=mkEl("input"); r.type="range"; r.min=String(lo); r.max=String(hi); r.value=String(E[k]); r.oninput=()=>{ E[k]=+r.value; prev(); }; bsField(f2,lab,r); };
  rng("hue",0,359,"it_hue"); rng("sz",80,260,"mb_size");
  const zs=mkEl("div","mbseg"); for(const [v,t] of [["island","mb_island"],["cave","mb_cave"]]) zs.appendChild(adBtn(tr(t),()=>{ if(E.zn!==v){ E.zn=v; E.pos=null; } renderWin(); },E.zn===v?"on":""));
  bsField(f2,"mb_where",zs); body.appendChild(f2);
  const f3=mkEl("div","plform");
  bsField(f3,"mb_hp",bsNum(E,"hp",5,99999)); bsField(f3,"bs_dmg",bsNum(E,"dmg",1,20));
  const sg=mkEl("div","mbseg"); for(const v of [1,2,3,4]) sg.appendChild(adBtn(tr("mb_spd_"+v),()=>{ E.spd=v; renderWin(); },E.spd===v?"on":"")); bsField(f3,"mb_spd",sg);
  bsField(f3,"mb_range",bsNum(E,"range",2,12)); bsField(f3,"mb_xp",bsNum(E,"xp",0,99999)); bsField(f3,"bs_rsp",bsNum(E,"rsp",1,1440));
  body.appendChild(f3);
  // приёмы
  body.appendChild(mkEl("b",null,tr("bs_skills")));
  const f4=mkEl("div","plform");
  f4.appendChild(bsChk(E,"slam","bs_slam","wide"));
  if(E.slam){ bsField(f4,"bs_slam_dmg",bsNum(E,"slamDmg",1,30)); const r=mkEl("select"); for(const v of [15,20,23,28,35,45]){ const o=mkEl("option",null,(v/10).toFixed(1)); o.value=v; o.selected=E.slamR===v; r.appendChild(o); }
    r.onchange=()=>{ E.slamR=+r.value; }; bsField(f4,"bs_slam_r",r); bsField(f4,"bs_slam_cd",bsNum(E,"slamCd",3,30)); }
  f4.appendChild(bsChk(E,"sum","bs_sum","wide"));
  if(E.sum){ const s=mkEl("select"); const kinds=["bat","wolf","spider",...Object.keys(CMOBS).filter(k=>!CMOBS[k].boss)];
    for(const k of kinds){ const o=mkEl("option",null,tr("ed_src_"+k)); o.value=k; o.selected=E.sumK===k; s.appendChild(o); }
    s.onchange=()=>{ E.sumK=s.value; }; bsField(f4,"bs_sum_who",s); bsField(f4,"bs_sum_n",bsNum(E,"sumN",1,5)); f4.appendChild(mkEl("p","adnote wide",tr("bs_sum_note"))); }
  f4.appendChild(bsChk(E,"rage","bs_rage","wide"));
  if(E.rage){ bsField(f4,"bs_rage_at",bsNum(E,"rageAt",5,90)); f4.appendChild(mkEl("p","adnote wide",tr("bs_rage_note"))); }
  body.appendChild(f4);
  body.appendChild(mkEl("p","adnote",E.pos?tr("bs_pos",{x:E.pos[0],y:E.pos[1]}):"⚠ "+tr("bs_nopos")));
  prev();
  const bt=mkEl("div","plbtns");
  bt.appendChild(adBtn(tr("it_save"),bsSave,"big"));
  if(!E.isNew&&CMOBS[E.id]){
    bt.appendChild(adBtn(tr("bs_place"),()=>{ if(E.zn!==ZONE){ adMsg=tr("mb_zone_other",{z:"#"+(E.zn==="cave"?"ad_mapc":"ad_mapi")}); renderWin(); return; }
      closeWin(); edEnter("map"); edCat="places"; edTool="bpos_"+E.id; edRender(); say("bs_place_hint"); }));
    bt.appendChild(adBtn(tr("mb_loot"),()=>{ closeWin(); edEnter("drop"); edDropSel="mob:"+E.id; edRender(); }));
    bt.appendChild(adBtn(tr(bsDelAsk?"it_del_ok":"it_del"),()=>{ if(!bsDelAsk){ bsDelAsk=true; renderWin(); return; } bsWrite(E.id,null); bsSel=null; bsDraft=null; renderWin(); },"warn")); }
  body.appendChild(bt);
  if(adMsg) body.appendChild(mkEl("div","adok",adMsg));
}
function renderGolemCard(body){
  const E=bsDraft;
  adHead(body,()=>{ bsSel=null; bsDraft=null; adMsg=""; renderWin(); });
  const pv=mkEl("div","itprev"), im=mkEl("img"); im.src=SPRITES.golem_se_0||""; im.alt=""; pv.appendChild(im); pv.appendChild(mkEl("b",null,tr("ed_src_golem"))); body.appendChild(pv);
  const f=mkEl("div","plform");
  bsField(f,"mb_hp",bsNum(E,"hp",5,99999)); bsField(f,"mb_xp",bsNum(E,"xp",0,99999)); bsField(f,"bs_rsp",bsNum(E,"rsp",1,1440)); bsField(f,"bs_slam_dmg",bsNum(E,"slamDmg",1,10));
  body.appendChild(f);
  body.appendChild(mkEl("p","adnote",tr("bs_golem_note")));
  const bt=mkEl("div","plbtns");
  bt.appendChild(adBtn(tr("it_save"),()=>{
    const c=JSON.parse(JSON.stringify(lastCfgDoc||{})); for(const f2 of ["mobHp","xp","mobDmg"]) if(!c[f2]||typeof c[f2]!=="object") c[f2]={};
    c.mobHp.golem=E.hp; c.mobHp.golem_rsp=E.rsp; c.xp.golem=E.xp; c.mobDmg.golem=E.slamDmg;
    applyConfig(c); if(NET.db) NET.db.doc("world/config").set(c).catch(()=>{}); adMsg=tr("mb_saved"); renderWin(); },"big"));
  bt.appendChild(adBtn(tr("mb_loot"),()=>{ closeWin(); edEnter("drop"); edDropSel="mob:golem"; edRender(); }));
  if(CAVE) bt.appendChild(adBtn(tr("bs_place"),()=>{ closeWin(); edEnter("map"); edCat="places"; edTool="boss"; edRender(); }));
  body.appendChild(bt);
  if(adMsg) body.appendChild(mkEl("div","adok",adMsg));
}
function bsWrite(id,val){
  const list={}; for(const [k,v] of Object.entries(bossesRaw)) list[k]=v;
  if(val) list[id]=val; else delete list[id];
  applyBosses({list}); if(NET.db) NET.db.doc("world/bosses").set({list}).catch(()=>{});
}
function bsSave(){
  const E=bsDraft, m=bsSanitize(E.id,E); if(!m){ adMsg=tr("it_noname"); renderWin(); return; }
  delete m.id; bsWrite(E.id,m); bsDraft={...CMOBS[E.id]}; adMsg=tr("bs_saved"); renderWin();
}
// инструмент редактора карты: «место босса» (сохраняется сразу)
function bsPlaceAt(kind,c){
  const m=bossesRaw[kind]; if(!m||!c||c.water) return false;
  bsWrite(kind,{...m,pos:[c.x,c.y]}); say("bs_placed",null,{m:mbName(CMOBS[kind])}); return true;
}
