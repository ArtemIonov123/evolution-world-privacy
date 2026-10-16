// ================= Постапо: «пыльная» перекраска старых картинок острова =================
// Пока GPT не нарисовал новый арт, старые картинки земли, травы, деревьев и воды перекрашиваются кодом:
// зелень → сухая жёлтая трава, остальное — тусклее и теплее, вода → ядовито-зелёная.
// КОГДА ПРИХОДИТ НОВАЯ КАРТИНКА ОТ GPT — впиши её имя в POSTAPO_ART, тогда её не перекрашиваем.
const POSTAPO_ART=new Set([
  // сюда — имена новых картинок, например "block_grass", "hero_se_0"
  "block_grass","block_grass_2","block_grass_dark","block_dirt","block_sand","block_stone_path",
  "block_cobble_dark","block_gravel","block_planks","block_mud",            // набор 1: земля (16.10)
  "hero_ne_0","hero_ne_1","hero_ne_2","hero_ne_3",                          // набор 2: герой со спины (16.10)
]);
const DUST_RE=/^(block_|stairs_|tree_|bush$|grass_tuft|prop_bush_berry|prop_flowers|prop_stump|prop_log|prop_mushrooms|stone_slab|rock_|fence_|hut_|cave_entrance|prop_signpost|prop_crate|prop_barrel|stall_|pier_)/;
const TOXIC_RE=/^water_/;
function rgb2hsl(r,g,b){ r/=255; g/=255; b/=255; const mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2; let h=0,s=0;
  if(mx!==mn){ const d=mx-mn; s=l>0.5?d/(2-mx-mn):d/(mx+mn);
    h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4; h*=60; } return [h,s,l]; }
function hsl2rgb(h,s,l){ const f=n=>{ const k=(n+h/30)%12, a=s*Math.min(l,1-l); return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))); }; return [f(0),f(8),f(4)]; }
function postapoRecolor(im,mode){
  const c=document.createElement("canvas"); c.width=im.width; c.height=im.height;
  const g=c.getContext("2d"); g.drawImage(im,0,0);
  const d=g.getImageData(0,0,c.width,c.height), p=d.data;
  for(let i=0;i<p.length;i+=4){ if(!p[i+3]) continue;
    let [h,s,l]=rgb2hsl(p[i],p[i+1],p[i+2]);
    if(mode==="toxic"){ h=72+(h-200)*0.1; s=Math.min(1,s*0.28+0.12); l=l*0.36+0.08; }   // мутная ядовитая
    else if(h>=55&&h<=175&&s>0.18){ h=38+(h-55)*0.06; s=s*0.55; l=l*0.92+0.02; }   // зелень → сухая трава
    else { s*=0.62; if(s>0.05) h=h+(30-h)*0.12; l=l*0.95; }                          // остальное — пыльнее
    const [r,gg,b]=hsl2rgb(((h%360)+360)%360,s,Math.max(0,Math.min(1,l))); p[i]=r; p[i+1]=gg; p[i+2]=b; }
  g.putImageData(d,0,0); c.src=im.src; return c;   // .src — некоторые места кэшируют по нему
}
// HD-картинки (@2x): везде, где их рисуют «по размеру картинки», рисуем в логическом размере (вдвое меньше),
// а при вырезании кусочка (ветер, анимация) пересчитываем координаты в пиксели исходника
{ const di=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(im,...a){
    const f=im&&im.__hd; if(!f) return di.call(this,im,...a);
    if(a.length===2) return di.call(this,im,a[0],a[1],im.width,im.height);
    if(a.length===8) return di.call(this,im,a[0]*f,a[1]*f,a[2]*f,a[3]*f,a[4],a[5],a[6],a[7]);
    return di.call(this,im,...a); }; }
// вызывается для каждой картинки при загрузке (map_camera.js → loadAll)
function postapoLook(k,im){
  if(POSTAPO_ART.has(k)||im.__hd) return im;
  if(TOXIC_RE.test(k)) return postapoRecolor(im,"toxic");
  if(DUST_RE.test(k)) return postapoRecolor(im,"dust");
  return im;
}
