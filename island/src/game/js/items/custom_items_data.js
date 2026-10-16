// ---- свои вещи из админки (world/items) ----
const CUSTOM={}, CUSTOM_SHOP=[], IT_TYPES=["weapon","head","body","feet","neck","potion","mat"];
const itClean=v=>String(v||"").replace(/[<>&"'`\u0000-\u001f]/g,"").replace(/\s+/g," ").trim();
const itNum=(v,hi)=>Math.max(0,Math.min(hi,Math.round(+v||0)));
function itSanitize(id,o,builtin){
  if(!(builtin||/^c[A-Za-z0-9]{4,12}$/.test(id))||!o||typeof o!=="object") return null;
  const t=builtin?baseType(id):IT_TYPES.includes(o.t)?o.t:"mat", ru=itClean(o.ru).slice(0,24), pl=itClean(o.pl).slice(0,24)||ru; if(!ru&&!pl) return null;
  const gear=["weapon","head","body","feet","neck"].includes(t);
  return {id,t,ru:ru||pl,pl,d:itClean(o.d).slice(0,120),atk:t==="weapon"?itNum(o.atk,99):0,def:gear&&t!=="weapon"?itNum(o.def,99):0,hp:gear?itNum(o.hp,99):0,heal:t==="potion"?itNum(o.heal,99):0,
    lv:gear?itNum(o.lv,60):0,cl:gear&&CLASSES.includes(o.cl)?o.cl:"",seller:["merchant","npc"].includes(o.seller)?o.seller:(o.shop===true?"merchant":""),price:itNum(o.price,999999),sell:itNum(o.sell,999999),
    b:typeof o.b==="string"&&/^[a-z_]{2,20}$/.test(o.b)?o.b:"",hue:itNum(o.hue,359),img:typeof o.img==="string"&&/^data:image\/png;base64,[A-Za-z0-9+\/=]{20,20000}$/.test(o.img)?o.img:""};
}
function hueShift(cv,deg){
  if(!deg) return cv; const g=cv.getContext("2d"), d=g.getImageData(0,0,cv.width,cv.height), a=d.data, k=deg/360;
  for(let i=0;i<a.length;i+=4){ if(!a[i+3]) continue; let r=a[i]/255,gg=a[i+1]/255,b=a[i+2]/255; const mx=Math.max(r,gg,b), mn=Math.min(r,gg,b), l=(mx+mn)/2;
    const dd=mx-mn; let sat=mx===mn?0:(l>0.5?dd/(2-mx-mn):dd/(mx+mn)), h=mx===mn?0:(mx===r?(gg-b)/dd+(gg<b?6:0):mx===gg?(b-r)/dd+2:(r-gg)/dd+4)/6;
    if(sat<0.22){ if(l<0.06||l>0.97) continue; h=k; sat=Math.max(sat,0.42); } else h=(h+k)%1;
    const q=l<0.5?l*(1+sat):l+sat-l*sat, pp=2*l-q, f=t=>{ t=(t+1)%1; return t<1/6?pp+(q-pp)*6*t:t<1/2?q:t<2/3?pp+(q-pp)*(2/3-t)*6:pp; };
    a[i]=f(h+1/3)*255; a[i+1]=f(h)*255; a[i+2]=f(h-1/3)*255; }
  g.putImageData(d,0,0); return cv;
}
function customIcon(it,done){
  const cv2=document.createElement("canvas"); cv2.width=cv2.height=32; const g=cv2.getContext("2d"); g.imageSmoothingEnabled=false;
  if(it.img){ const im=new Image(); im.onload=()=>{ g.clearRect(0,0,32,32); g.drawImage(im,0,0,32,32); hueShift(cv2,it.hue); done&&done(); }; im.src=it.img; return cv2; }
  const base=(BASE&&BASE.icons[it.b])||ICONS[it.b]||(it.builtin&&BASE&&BASE.icons[it.id])||(BASE&&BASE.icons[it.id])||ICONS[{weapon:"sword_iron",head:"helm_iron",body:"armor_leather",feet:"boots_leather",neck:"amulet_fang",potion:"potion",mat:"fang"}[it.t]];
  if(base) g.drawImage(base,0,0,32,32); return hueShift(cv2,it.hue);
}
function customDesc(it){
  const out=[]; if(it.atk) out.push(tr("ci_atk",{n:it.atk})); if(it.def) out.push(tr("ci_def",{n:it.def})); if(it.hp) out.push(tr("ci_hp",{n:it.hp}));
  if(it.t==="potion"&&it.heal) out.push(tr("ci_heal",{n:it.heal})); if(it.lv>1) out.push(tr("ci_lv",{n:it.lv})); if(it.cl) out.push(tr("ci_cl",{c:"#cl_"+it.cl}));
  out.push(tr("ci_sell",{c:it.sell||Math.max(1,Math.round(it.price*0.4))}));
  return (it.d?it.d+" · ":"")+out.join(" · ");
}
// встроенные вещи: снимок «как было» и правки из админки (те же world/items, ключ = id вещи)
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
  SHOP.length=0; for(const x of BASE.shop) SHOP.push({...x});
  const list=d&&d.list&&typeof d.list==="object"?d.list:{}; itemsRaw={};
  for(const id of Object.keys(CUSTOM)){ const i=ITEMS.findIndex(f=>f.id===id); if(i>=0) ITEMS.splice(i,1);
    delete GEAR[id]; delete EDIBLE[id]; delete SELL_P[id]; delete I18N.ru["fish_"+id]; delete I18N.pl["fish_"+id]; delete ICONS[id]; delete CUSTOM[id]; }
  CUSTOM_SHOP.length=0;
  for(const [id,o] of Object.entries(list).slice(0,400)){
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
    CUSTOM[id]=it; itemsRaw[id]=it; ITEMS.push({id,custom:true});
    I18N.ru["fish_"+id]=it.ru; I18N.pl["fish_"+id]=it.pl;
    if(["weapon","head","body","feet","neck"].includes(it.t)){ const gg={slot:it.t}; if(it.atk) gg.atk=it.atk; if(it.def) gg.def=it.def; if(it.hp) gg.hp=it.hp; if(it.lv>1) gg.lv=it.lv; if(it.cl) gg.cl=it.cl; GEAR[id]=gg; }
    if(it.t==="potion") EDIBLE[id]=Math.max(1,it.heal);
    SELL_P[id]=it.sell||Math.max(1,Math.round(it.price*0.4));
    if(it.seller&&it.price>0) CUSTOM_SHOP.push({id,p:it.price,by:it.seller});
    ICONS[id]=customIcon(it,()=>{ renderInv(); if(winKind) renderWin(); }); }
  let changed=false; for(const sl of SLOTS) if(equip[sl]&&!GEAR[equip[sl]]){ equip[sl]=null; changed=true; }
  if(changed){ recalcHP(); lastSaveJSON=""; }
  renderInv(); if(winKind) renderWin();
  if(lastCfgDoc) applyConfig(lastCfgDoc);
}
