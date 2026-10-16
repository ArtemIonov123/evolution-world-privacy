// ---- свои мобы из админки (world/mobs) ----
const MB_BASES=["wolf","spider","bear","dwolf","golem","hare"], MB_AI=["aggr","night","passive"];
const mobTintCache=new Map();
// свои картинки моба/босса: кадры кладутся в общий img под именами cm_<kind>_se_0 … — дальше рисуются как обычные спрайты
const UP_KEYS=["se0","se1","ne0","ne1","dead"];
const upOk=v=>typeof v==="string"&&/^data:image\/png;base64,[A-Za-z0-9+\/=]{20,90000}$/.test(v);
function upSanitize(u){ if(!u||typeof u!=="object"||!upOk(u.se0)) return null; const o={}; for(const k of UP_KEYS) if(upOk(u[k])) o[k]=u[k]; return o; }
const mobPre=(m,kind)=>m&&m.up&&m.up.se0?"cm_"+kind:m?m.b:kind;
function regMobImgs(kind,up){
  for(const k of Object.keys(img)) if(k.startsWith("cm_"+kind+"_")) delete img[k];
  if(!up) return;
  const mk=src=>{ const i=new Image(); i.onload=()=>{ dirty=true; mobTintCache.clear(); }; i.src=src; return i; };
  const se0=up.se0, se1=up.se1||se0, ne0=up.ne0||se0, ne1=up.ne1||(up.ne0?up.ne0:se1);
  img["cm_"+kind+"_se_0"]=mk(se0); img["cm_"+kind+"_se_1"]=mk(se1); img["cm_"+kind+"_ne_0"]=mk(ne0); img["cm_"+kind+"_ne_1"]=mk(ne1);
  if(up.dead) img["cm_"+kind+"_dead"]=mk(up.dead);
}
// загрузка картинки: обрезаем пустые края, вписываем в max×max (крупные — сглаживая), сохраняем PNG
function upLoadFile(file,max,done){
  const rd=new FileReader(); rd.onload=()=>{ const im=new Image(); im.onload=()=>{
    const c0=document.createElement("canvas"); c0.width=im.width; c0.height=im.height; const g0=c0.getContext("2d"); g0.drawImage(im,0,0);
    let x0=im.width,y0=im.height,x1=-1,y1=-1; try{ const d=g0.getImageData(0,0,im.width,im.height).data;
      for(let y=0;y<im.height;y++) for(let x=0;x<im.width;x++) if(d[(y*im.width+x)*4+3]>12){ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; } }catch(e){ x0=0;y0=0;x1=im.width-1;y1=im.height-1; }
    if(x1<0){ done(null); return; }
    const w=x1-x0+1, h=y1-y0+1, k=Math.min(1,max/Math.max(w,h)), W2=Math.max(1,Math.round(w*k)), H2=Math.max(1,Math.round(h*k));
    const c=document.createElement("canvas"); c.width=W2; c.height=H2; const g=c.getContext("2d"); g.imageSmoothingEnabled=k<0.5; g.imageSmoothingQuality="high";
    g.drawImage(c0,x0,y0,w,h,0,0,W2,H2); done(c.toDataURL("image/png")); }; im.src=rd.result; }; rd.readAsDataURL(file);
}
// спрайт для превью в карточке (черновик ещё не зарегистрирован)
const draftImgCache=new Map();
function draftSprite(E,redraw){
  if(E.up&&E.up.se0){ let i=draftImgCache.get(E.up.se0); if(!i){ i=new Image(); i.onload=redraw; i.src=E.up.se0; draftImgCache.set(E.up.se0,i); } return i.complete&&i.width?i:null; }
  return img[E.b+"_se_0"];
}
function mobTint(kind,sp){
  const m=CMOBS[kind]; if(!m||!m.hue) return sp; const key=kind+"|"+(sp.__id||(sp.__id=Math.random().toString(36).slice(2)));
  let c=mobTintCache.get(key); if(c) return c;
  c=document.createElement("canvas"); c.width=sp.width; c.height=sp.height; const g=c.getContext("2d"); g.drawImage(sp,0,0); hueShift(c,m.hue); mobTintCache.set(key,c); return c;
}
function mobPreview(kind,size,def){
  const m=def||CMOBS[kind]; const c=document.createElement("canvas"); c.width=c.height=size; const g=c.getContext("2d"); g.imageSmoothingEnabled=false;
  const sp=m&&img[mobPre(m,kind)+"_se_0"]; if(!sp||!sp.width) return c.toDataURL();
  const t=document.createElement("canvas"); t.width=sp.width; t.height=sp.height; t.getContext("2d").drawImage(sp,0,0); hueShift(t,m.hue);
  const k=Math.min(size/sp.width,size/sp.height)*Math.min(1,0.55+m.sz/400); const w=sp.width*k, h=sp.height*k; g.drawImage(t,(size-w)/2,size-h,w,h); return c.toDataURL();
}
function mbSanitize(id,o){
  if(!/^m[a-z0-9]{4,12}$/.test(id)||!o||typeof o!=="object") return null;
  const ru=itClean(o.ru).slice(0,24), pl=itClean(o.pl).slice(0,24)||ru; if(!ru&&!pl) return null;
  return {id,ru:ru||pl,pl,b:MB_BASES.includes(o.b)?o.b:"wolf",hue:itNum(o.hue,359),sz:Math.max(60,Math.min(200,itNum(o.sz,200)||100)),zn:zoneOk(o.zn)?o.zn:"island",
    ai:MB_AI.includes(o.ai)?o.ai:"aggr",hp:Math.max(1,itNum(o.hp,999)),dmg:Math.max(1,itNum(o.dmg,10)),spd:Math.max(1,Math.min(4,itNum(o.spd,4)||2)),range:Math.max(2,Math.min(10,itNum(o.range,10)||5)),
    up:upSanitize(o.up),xp:itNum(o.xp,5000),d:o.d?1:0,dn:itNum(o.dn,20),n:o.n?1:0,nn:itNum(o.nn,20),cn:itNum(o.cn,20)};
}
let mobsRaw={};
function applyMobs(d){
  const list=d&&d.list&&typeof d.list==="object"?d.list:{}; mobsRaw={};
  for(const k of Object.keys(CMOBS)){ if(CMOBS[k].boss) continue; const i=MOBS.indexOf(k); if(i>=0) MOBS.splice(i,1); delete I18N.ru["ed_src_"+k]; delete I18N.pl["ed_src_"+k]; delete CMOBS[k]; }
  mobTintCache.clear();
  for(const [id,o] of Object.entries(list).slice(0,60)){ const m=mbSanitize(id,o); if(!m) continue;
    CMOBS[id]=m; mobsRaw[id]=m; MOBS.push(id); regMobImgs(id,m.up); I18N.ru["ed_src_"+id]=m.ru; I18N.pl["ed_src_"+id]=m.pl;
    if(!DROP_DEF[id]) DROP_DEF[id]=[{id:"coin",ch:100,a:1,b:3}]; }
  for(let i=animals.length-1;i>=0;i--){ const a=animals[i]; if(/^m[a-z0-9]{4,12}$/.test(a.kind)&&!CMOBS[a.kind]) animals.splice(i,1); }
  if(winKind==="admin_mobs") renderWin();
}
