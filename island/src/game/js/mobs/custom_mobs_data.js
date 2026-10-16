// ---- свои мобы из админки (world/mobs) ----
const MB_BASES=["wolf","spider","bear","dwolf","golem","hare"], MB_AI=["aggr","night","passive"];
const mobTintCache=new Map();
function mobTint(kind,sp){
  const m=CMOBS[kind]; if(!m||!m.hue) return sp; const key=kind+"|"+(sp.__id||(sp.__id=Math.random().toString(36).slice(2)));
  let c=mobTintCache.get(key); if(c) return c;
  c=document.createElement("canvas"); c.width=sp.width; c.height=sp.height; const g=c.getContext("2d"); g.drawImage(sp,0,0); hueShift(c,m.hue); mobTintCache.set(key,c); return c;
}
function mobPreview(kind,size,def){
  const m=def||CMOBS[kind]; const c=document.createElement("canvas"); c.width=c.height=size; const g=c.getContext("2d"); g.imageSmoothingEnabled=false;
  const sp=m&&img[m.b+"_se_0"]; if(!sp) return c.toDataURL();
  const t=document.createElement("canvas"); t.width=sp.width; t.height=sp.height; t.getContext("2d").drawImage(sp,0,0); hueShift(t,m.hue);
  const k=Math.min(size/sp.width,size/sp.height)*Math.min(1,0.55+m.sz/400); const w=sp.width*k, h=sp.height*k; g.drawImage(t,(size-w)/2,size-h,w,h); return c.toDataURL();
}
function mbSanitize(id,o){
  if(!/^m[a-z0-9]{4,12}$/.test(id)||!o||typeof o!=="object") return null;
  const ru=itClean(o.ru).slice(0,24), pl=itClean(o.pl).slice(0,24)||ru; if(!ru&&!pl) return null;
  return {id,ru:ru||pl,pl,b:MB_BASES.includes(o.b)?o.b:"wolf",hue:itNum(o.hue,359),sz:Math.max(60,Math.min(200,itNum(o.sz,200)||100)),zn:o.zn==="cave"?"cave":"island",
    ai:MB_AI.includes(o.ai)?o.ai:"aggr",hp:Math.max(1,itNum(o.hp,999)),dmg:Math.max(1,itNum(o.dmg,10)),spd:Math.max(1,Math.min(4,itNum(o.spd,4)||2)),range:Math.max(2,Math.min(10,itNum(o.range,10)||5)),
    xp:itNum(o.xp,5000),d:o.d?1:0,dn:itNum(o.dn,20),n:o.n?1:0,nn:itNum(o.nn,20),cn:itNum(o.cn,20)};
}
let mobsRaw={};
function applyMobs(d){
  const list=d&&d.list&&typeof d.list==="object"?d.list:{}; mobsRaw={};
  for(const k of Object.keys(CMOBS)){ const i=MOBS.indexOf(k); if(i>=0) MOBS.splice(i,1); delete I18N.ru["ed_src_"+k]; delete I18N.pl["ed_src_"+k]; delete CMOBS[k]; }
  mobTintCache.clear();
  for(const [id,o] of Object.entries(list).slice(0,60)){ const m=mbSanitize(id,o); if(!m) continue;
    CMOBS[id]=m; mobsRaw[id]=m; MOBS.push(id); I18N.ru["ed_src_"+id]=m.ru; I18N.pl["ed_src_"+id]=m.pl;
    if(!DROP_DEF[id]) DROP_DEF[id]=[{id:"coin",ch:100,a:1,b:3}]; }
  for(let i=animals.length-1;i>=0;i--){ const a=animals[i]; if(/^m[a-z0-9]{4,12}$/.test(a.kind)&&!CMOBS[a.kind]) animals.splice(i,1); }
  if(winKind==="admin_mobs") renderWin();
}
