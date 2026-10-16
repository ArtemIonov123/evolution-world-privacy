// ---- режим редактора ----
let edPrevGrid=false, edExitConfirm=false;
function edEnter(sec){
  if(!isAdmin) return; if(typeof sec!=="string") sec="map"; EDIT=true; closeWin(); if(dialogOpen) closeDialog(); stopFishing(); stopChopping(); hero.path=[]; hero.target=null; marker=null;
  edAdd={t:0,b:0,l:0,r:0}; edUndo.length=0;
  const zk=z=>Object.fromEntries((MAP.zones&&Array.isArray(MAP.zones[z])?MAP.zones[z]:[]).map(p=>[p[0]+","+p[1],1]));
  edDraft={start:MAP.start,hut:MAP.hut||null,npc:MAP.npc||null,merchant:MERCH_POS,stall:STALL_POS,pier:PIER_POS,cave:CAVE?null:(PORTAL?[PORTAL.x,PORTAL.y]:null),exit:CAVE&&PORTAL?[PORTAL.x,PORTAL.y]:null,boss:CAVE?(MAP.boss||null):null,
    zones:{hare:zk("hare"),wolf:zk("wolf"),bat:zk("bat"),spider:zk("spider")}};
  for(const k of Object.keys(CMOBS)) if(!CMOBS[k].boss&&CMOBS[k].zn===ZONE) edDraft.zones[k]=zk(k);
  edTab=sec; edCfg=edCfgFrom(); cfgDirty=false; edTxtLang=LANG; edDropSel=null;
  edPrevGrid=showGrid; showGrid=true; follow=false; document.getElementById("follow").setAttribute("aria-pressed","false");
  document.body.classList.add("editing"); document.getElementById("edPanel").hidden=false; edRender(); say("ed_hint","ed_hint_sub"); dirty=true;
}
function edBack(){ edExit(true); }
function edExit(toHub){
  if((edUndo.length||cfgDirty)&&!edExitConfirm){ edExitConfirm=true; edRender(); setTimeout(()=>{edExitConfirm=false; edRender();},4000); return; }
  edExitConfirm=false; EDIT=false; showGrid=edPrevGrid; document.body.classList.remove("editing"); document.getElementById("edPanel").hidden=true;
  cfgDirty=false;
  if(edUndo.length){ if(toHub===true) try{ sessionStorage.setItem("pa_adhub","1"); }catch(e){} setTimeout(()=>location.reload(),300); return; }   // несохранённые правки — вернуть как было
  say("hint","hint_sub"); dirty=true;
  if(toHub===true) openWin("admin");
}
function edRender(){
  const p=document.getElementById("edPanel"); if(!p||p.hidden) return; p.textContent="";
  const btn=(label,fn,cls,dis)=>{ const b=mkEl("button","btn"+(cls?" "+cls:""),label); b.type="button"; b.onclick=fn; b.disabled=!!dis; return b; };
  const top=mkEl("div","edtop");
  top.appendChild(btn(tr("ad_back"),edBack,""));
  if(edTab==="map") top.appendChild(btn(tr("ed_undo"),edUndoLast,"",!edUndo.length));
  top.appendChild(btn(tr("ed_save"),()=>edTab==="map"?edSave():saveConfig(),"big"));
  top.appendChild(btn(tr(edExitConfirm?"ed_exit_confirm":"ed_exit"),()=>edExit(false),edExitConfirm?"warn":""));
  p.appendChild(top);
  p.appendChild(mkEl("div","edsec",tr({map:CAVE?"ad_mapc":"ad_map",texts:"ad_texts",shop:"ad_shop",drop:"ad_drop"}[edTab]||"ad_map")));
  if(edTab==="texts"){ renderTextsTab(p); return; }
  if(edTab==="shop"){ renderShopTab(p); return; }
  if(edTab==="drop"){ renderDropTab(p); return; }
  // мини-карта и режим пальца
  const mrow=mkEl("div","edmrow"), mc=mkEl("canvas","edmini"); mc.id="edMini"; mc.width=150; mc.height=150; mrow.appendChild(mc);
  const side=mkEl("div","edside");
  side.appendChild(btn(tr(edPaint?"ed_mode_paint":"ed_mode_move"),()=>{ edPaint=!edPaint; edRender(); },"on"));
  side.appendChild(btn(tr("ed_brush",{n:edBrush==="fill"?tr("ed_fill"):edBrush+"×"+edBrush}),()=>{ edBrush=edBrush===1?3:edBrush===3?5:edBrush===5?"fill":1; edRender(); }));
  side.appendChild(btn(tr("ed_dir"),()=>{ edDir=edDir==="left"?"right":"left"; edRender(); }));
  side.appendChild(mkEl("small","muted",tr("ed_mini_hint")));
  mrow.appendChild(side); p.appendChild(mrow);
  mc.onclick=e=>{ const r=mc.getBoundingClientRect(); edMiniJump((e.clientX-r.left)*mc.width/r.width,(e.clientY-r.top)*mc.height/r.height); };
  const cats=mkEl("div","tabs edcats");
  for(const k of ED_CATS){ const b=mkEl("button","btn"+(edCat===k?" on":""),tr("ed_cat_"+k)); b.type="button"; b.setAttribute("aria-pressed",edCat===k); b.onclick=()=>{ edCat=k; edRender(); }; cats.appendChild(b); }
  p.appendChild(cats);
  const tools=mkEl("div","edtools");
  for(const [gk,items0,cat] of ED_GROUPS){ if(cat!==edCat) continue; const grp=mkEl("div","edgrp"); grp.appendChild(mkEl("b",null,tr(gk)));
    const row=mkEl("div","edrow");
    const items=gk==="ed_g_places"?[...items0.filter(([id])=>!CUSTOMZ||id==="start"||id==="boss"),["link_new",null],["link_del",null],...Object.keys(CMOBS).filter(k=>CMOBS[k].boss&&CMOBS[k].zn===ZONE).map(k=>["bpos_"+k,"mob:"+k])]:gk==="ed_g_zones"?[...items0.slice(0,-1),...Object.keys(CMOBS).filter(k=>!CMOBS[k].boss&&CMOBS[k].zn===ZONE).map(k=>["zone_"+k,"mob:"+k]),items0[items0.length-1]]:items0;
    for(const [id,spr] of items){
      if(spr&&spr.startsWith("mob:")){ const b=mkEl("button","edb"+(edTool===id?" on":"")); b.type="button"; const k=spr.slice(4), im=mkEl("img"); im.src=mobPreview(k,40); im.alt=""; b.appendChild(im);
        b.appendChild(mkEl("small",null,LANG==="ru"?CMOBS[k].ru:CMOBS[k].pl)); b.onclick=()=>{ edTool=id; edRender(); }; row.appendChild(b); continue; } const b=mkEl("button","edb"+(edTool===id?" on":"")); b.type="button"; b.title=edLabel(id);
      const name=spr&&(id==="fence"||id==="stall"||id==="pier")?spr.replace("_left","_"+edDir):spr;
      if(name&&typeof SPRITES!=="undefined"&&SPRITES[name]){ const im=mkEl("img"); im.src=SPRITES[name]; im.alt=""; b.appendChild(im); }
      else if(id==="w"||id==="v"||isWaterProp(id)){ const cv2=mkEl("canvas"); cv2.width=38; cv2.height=28; const g2=cv2.getContext("2d");
        g2.fillStyle=WATER_COL[id==="v"?"shallow":"deep"][0]; g2.beginPath(); g2.moveTo(19,4); g2.lineTo(37,14); g2.lineTo(19,24); g2.lineTo(1,14); g2.closePath(); g2.fill();
        if(isWaterProp(id)){ const sv=ctx; ctx=g2; drawPropFallback(id,19,18); ctx=sv; } else { g2.fillStyle="rgba(230,246,255,.8)"; g2.fillRect(12,12,6,1); g2.fillRect(21,16,5,1); }
        b.appendChild(cv2); }
      else b.appendChild(mkEl("span","edic",{w:"≈",up:"▲",down:"▼",erase:"✕",start:"★",hut:"⌂",zone_erase:"⌫",stairs_del:"⌫",cave:"⛰",exit:"⇡",boss:"☠",zone_spider:"✳",prop_crystal:"◆",link_del:"⌫",link_new:"🌀"}[id]||"?"));
      b.appendChild(mkEl("small",null,edLabel(id)));
      b.onclick=()=>{ edTool=id; edRender(); say("ed_t_"+id,id==="fence"?"ed_fence_sub":id==="stairs"?"ed_stairs_sub":PLACE_TOOLS.includes(id)?"ed_tap_sub":edPaint?"ed_drag_sub":"ed_tap_sub"); }; row.appendChild(b); }
    grp.appendChild(row); if(gk==="ed_g_zones") grp.appendChild(mkEl("p","muted",tr("ed_zone_note"))); tools.appendChild(grp); }
  p.appendChild(tools);
  // размер: добавить/убрать ряды с любой стороны
  const sz=mkEl("div","edgrp"); sz.appendChild(mkEl("b",null,tr("ed_g_size",{w:edW(),d:edD()})));
  const sg=mkEl("div","edsizegrid");
  for(const k of ["t","b","l","r"]){ const r=mkEl("div","edsz"); r.appendChild(mkEl("span",null,tr("ed_side_"+k)+(edAdd[k]?` (${edAdd[k]>0?"+":""}${edAdd[k]})`:"")));
    r.appendChild(btn("−",()=>{ const vert=k==="t"||k==="b"; if((vert?edD():edW())>ED_MIN){ edAdd[k]--; edRender(); edMini(); } }));
    r.appendChild(btn("+",()=>{ const vert=k==="t"||k==="b"; if((vert?edD():edW())<ED_MAX){ edAdd[k]++; edRender(); edMini(); } }));
    sg.appendChild(r); }
  sz.appendChild(sg); if(edAdd.t||edAdd.b||edAdd.l||edAdd.r) sz.appendChild(mkEl("p","muted",tr("ed_size_note")));
  p.appendChild(sz);
  const opt=mkEl("div","edopt");
  if(!CAVE) opt.appendChild(btn(tr(edGenPending?"ed_gen_confirm":"ed_gen",{w:edW(),d:edD()}),edGenerate,edGenPending?"warn":""));
  opt.appendChild(btn(tr(confirmReset?"ed_reset_confirm":"ed_reset"),edReset,confirmReset?"warn":""));
  p.appendChild(opt);
  edMini();
}
// ---- мини-карта: весь остров сверху, тап — перейти туда ----
let edMiniGeom=null;
function edMini(){
  const mc=document.getElementById("edMini"); if(!mc) return; const g=mc.getContext("2d");
  const w=edW(), d=edD(), ox=edAdd.l, oy=edAdd.t, k=Math.min(mc.width/w,mc.height/d), offX=(mc.width-w*k)/2, offY=(mc.height-d*k)/2;
  edMiniGeom={k,offX,offY,ox,oy};
  g.fillStyle="#2a6aa8"; g.fillRect(0,0,mc.width,mc.height);
  g.fillStyle="rgba(255,255,255,.08)"; g.fillRect(offX,offY,w*k,d*k);
  const COL={k:[70,74,92],K:[70,84,110],x:[44,44,54],q:[60,110,160],l:[150,60,30],j:[70,52,40],g:[110,180,70],G:[96,168,60],d:[60,120,48],s:[170,166,150],e:[150,104,64],w:[60,120,200],v:[110,200,225],n:[232,206,140],N:[196,166,110],r:[150,150,150],m:[96,66,44],f:[120,186,80],o:[50,100,40],c:[80,80,86],p:[176,120,70],z:[236,244,250],u:[226,150,40]};
  for(const c of cells){ const x=c.x+ox, y=c.y+oy; if(x<0||y<0||x>=w||y>=d) continue;
    const col=COL[c.t]||COL.g, f=0.75+0.07*Math.min(5,c.L); g.fillStyle=`rgb(${col.map(v=>Math.min(255,Math.round(v*f))).join(",")})`;
    g.fillRect(offX+x*k,offY+y*k,Math.ceil(k),Math.ceil(k));
    if(c.props.some(n=>n.startsWith("tree"))){ g.fillStyle="#1f4a1a"; g.fillRect(offX+(x+0.25)*k,offY+(y+0.25)*k,Math.max(1,k*0.5),Math.max(1,k*0.5)); } }
  if(edDraft&&edDraft.zones) for(const [z,col] of zoneCols(0.75)) for(const kk of Object.keys(edDraft.zones[z]||{})){
    const [x,y]=kk.split(",").map(Number); g.fillStyle=col; g.fillRect(offX+(x+ox)*k+k*0.2,offY+(y+oy)*k+k*0.2,Math.max(1,k*0.6),Math.max(1,k*0.6)); }
  const dot=(p,col)=>{ if(!p) return; g.fillStyle=col; g.fillRect(offX+(p[0]+ox)*k-1,offY+(p[1]+oy)*k-1,Math.max(3,k+2),Math.max(3,k+2)); };
  if(edDraft){ dot(edDraft.hut,"#d84a2a"); dot(edDraft.npc,"#ffd66b"); dot(edDraft.merchant,"#ff9a3a"); dot(edDraft.start,"#ffffff"); }
  g.strokeStyle="#1b1528"; g.lineWidth=1; g.strokeRect(offX+0.5,offY+0.5,w*k-1,d*k-1);
}
function edMiniJump(px,py){
  if(!edMiniGeom) return; const {k,offX,offY,ox,oy}=edMiniGeom;
  const x=Math.max(0,Math.min(W-1,Math.round((px-offX)/k-0.5-ox))), y=Math.max(0,Math.min(D-1,Math.round((py-offY)/k-0.5-oy)));
  const c=cellAt(x,y), [fx,fy]=proj(x-MX,y-MY,c?c.L:1), r=cv.getBoundingClientRect();
  panX=r.width*0.62-fx*scale; panY=r.height*0.42-fy*scale; dirty=true;
}
// метки мест (старт, хижина, NPC…) в режиме редактора
function zoneCols(al){ return [["hare",`rgba(200,255,120,${al})`],["wolf",`rgba(255,70,70,${al})`],["bat",`rgba(170,110,255,${al})`],["spider",`rgba(255,170,60,${al})`],
  ...Object.keys(CMOBS).map(k=>[k,`hsla(${(CMOBS[k].hue+200)%360},90%,60%,${al})`])]; }
function edDrawMarks(){
  if(!EDIT||!edDraft) return; worldTransform();
  for(const [z,col] of zoneCols(0.4)) for(const k of Object.keys(edDraft.zones[z]||{})){
    const [x,y]=k.split(",").map(Number), c=cellAt(x,y); if(!c) continue; const q=cellQuad(c);
    ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(...q[0]); for(const pt of q.slice(1)) ctx.lineTo(...pt); ctx.closePath(); ctx.fill(); }
  ctx.font="8px Silkscreen, monospace"; ctx.textAlign="center"; ctx.textBaseline="bottom";
  for(const [k,p] of Object.entries(edDraft)){ if(!p||k==="zones") continue; const c=cellAt(p[0],p[1]); if(!c) continue;
    const [x,y]=proj(c.x-MX+(k==="hut"?0.5:0),c.y-MY+(k==="hut"?0.5:0),walkZ(c)), txt=tr("ed_t_"+k), yy=Math.round(y-(k==="hut"?70:56));
    ctx.lineWidth=3; ctx.strokeStyle="#1b1528"; ctx.strokeText(txt,Math.round(x),yy); ctx.fillStyle="#9fe0ff"; ctx.fillText(txt,Math.round(x),yy);
    ctx.fillStyle="rgba(159,224,255,.35)"; ctx.beginPath(); const q=cellQuad(c); ctx.moveTo(...q[0]); for(const pt of q.slice(1)) ctx.lineTo(...pt); ctx.closePath(); ctx.fill(); }
  for(const L of Object.values(LINKS)){ if(L.to!==ZONE||L.arr!=="cell"||!L.ac) continue; const c=cellAt(L.ac[0],L.ac[1]); if(!c) continue;
    const [x,y]=proj(c.x-MX,c.y-MY,walkZ(c)), txt="\u2B07 "+(L.name||zoneName(L.z)), yy=Math.round(y-30);
    ctx.lineWidth=3; ctx.strokeStyle="#1b1528"; ctx.strokeText(txt,Math.round(x),yy); ctx.fillStyle="#b8a0ff"; ctx.fillText(txt,Math.round(x),yy);
    ctx.fillStyle="rgba(154,123,255,.35)"; ctx.beginPath(); const q=cellQuad(c); ctx.moveTo(...q[0]); for(const pt of q.slice(1)) ctx.lineTo(...pt); ctx.closePath(); ctx.fill(); }
  for(const [k,m] of Object.entries(CMOBS)){ if(!m.boss||m.zn!==ZONE||!m.pos) continue; const c=cellAt(m.pos[0],m.pos[1]); if(!c) continue;
    const [x,y]=proj(c.x-MX,c.y-MY,walkZ(c)), txt="\u2620 "+(LANG==="ru"?m.ru:m.pl), yy=Math.round(y-56);
    ctx.lineWidth=3; ctx.strokeStyle="#1b1528"; ctx.strokeText(txt,Math.round(x),yy); ctx.fillStyle="#ff8a7a"; ctx.fillText(txt,Math.round(x),yy);
    ctx.fillStyle="rgba(255,90,70,.35)"; ctx.beginPath(); const q=cellQuad(c); ctx.moveTo(...q[0]); for(const pt of q.slice(1)) ctx.lineTo(...pt); ctx.closePath(); ctx.fill(); }
}
