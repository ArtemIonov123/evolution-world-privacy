// ================= Мультиплеер =================
// room — кто сейчас в игре (позиции, чат, звери от «хозяина»); db — общий мир (деревья, костры, время)
// и личное сохранение каждого. Без платформы (скачанный файл) игра остаётся одиночной.
const NET={room:null,db:null,user:null,myId:null,myPeer:null,host:true,hostPeer:null};
const remotes=new Map();                  // peer -> другой игрок
const PLAYER_HUES=[null,0,130,32,285,178]; // null — родной синий цвет туники
let myHueIdx=0;
const hashStr=s=>{let h=7;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))|0;return Math.abs(h);};
const num=(v,lo,hi,def)=>typeof v==="number"&&isFinite(v)?Math.max(lo,Math.min(hi,v)):def;
const FACINGS=["se","sw","ne","nw"];

// ---- перекраска туники героя для разных игроков ----
const tintCache={};
function rgb2hsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0;const l=(mx+mn)/2;
  if(mx!==mn){const d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;}return [h,s,l];}
function hsl2rgb(h,s,l){h/=360;if(!s)return [l*255,l*255,l*255];const q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;
  const f=t=>{t=(t+1)%1;return t<1/6?p+(q-p)*6*t:t<1/2?q:t<2/3?p+(q-p)*(2/3-t)*6:p;};return [f(h+1/3)*255,f(h)*255,f(h-1/3)*255];}
function heroSprite(name,hueIdx){
  const base=img[name]; const hue=PLAYER_HUES[hueIdx]; if(!base||hue===null||hue===undefined) return base;
  const key=name+"|"+hueIdx; if(tintCache[key]) return tintCache[key];
  const c=document.createElement("canvas"); c.width=base.width; c.height=base.height; const g=c.getContext("2d"); g.drawImage(base,0,0);
  const d=g.getImageData(0,0,c.width,c.height), a=d.data;
  for(let i=0;i<a.length;i+=4){ if(!a[i+3]) continue; const [h,s,l]=rgb2hsl(a[i],a[i+1],a[i+2]);
    if(h>=190&&h<=255&&s>0.22){ const [r,gg,b]=hsl2rgb(hue,Math.min(1,s*1.05),l); a[i]=r;a[i+1]=gg;a[i+2]=b; } }
  g.putImageData(d,0,0); return tintCache[key]=c;
}
const hueCss=i=>PLAYER_HUES[i]===null?"#3a7be0":`hsl(${PLAYER_HUES[i]},70%,55%)`;

// ---- ник игрока ----
// фильтр ников: встроенный список + слова из админки (world/nickfilter)
const NICK_BAD=["hitler","gitler","nazi","fuck","shit","cunt","bitch","whore","nigger","nigga","faggot","kurwa","chuj","jebac","pierdol","cipa",
  "гитлер","хитлер","нацист","хуй","хуе","хуё","пизд","ебат","ебан","ебал","ёб","бляд","блят","сука","пидор","пидар","шлюх","залуп","мудак","гандон","даун"];
let NICK_EXTRA=[];
const LOOK={"a":"а","e":"е","o":"о","p":"р","c":"с","x":"х","y":"у","k":"к","m":"м","t":"т","h":"н","b":"в","0":"о","3":"е","@":"а","4":"а","6":"б"};
const LAT={"а":"a","е":"e","о":"o","р":"p","с":"c","х":"x","у":"y","к":"k","м":"m","т":"t","н":"h","в":"b","і":"i","ё":"e"};
function badNick(v){
  const low=String(v||"").toLowerCase().replace(/[1!|]/g,"i").replace(/[0]/g,"o").replace(/[3]/g,"e").replace(/[@4]/g,"a").replace(/[\$5]/g,"s").replace(/[^a-zа-яёі]/g,"");
  const cyr=low.replace(/[a-z0-9@]/g,ch=>LOOK[ch]||ch), lat=low.replace(/[а-яёі]/g,ch=>LAT[ch]||ch);
  for(const w of NICK_BAD.concat(NICK_EXTRA)){ if(!w) continue; if(low.includes(w)||cyr.includes(w)||lat.includes(w)) return true; }
  return false;
}
let myNick="";
try{ myNick=cleanNick(localStorage.getItem("island_nick")||""); }catch(e){}
// в Telegram ник берём из профиля Telegram
{ const t=window.__islandTG; if(t){ let n=cleanNick((t.first+" "+t.last).trim()); if(n.length<2||badNick(n)) n=cleanNick(t.user); if(n.length<2||badNick(n)) n=cleanNick("Hero"+t.id.slice(-4));
    myNick=n; try{ localStorage.setItem("island_nick",n); }catch(e){}
    if(!localStorage.getItem("island_lang")&&/^(ru|uk|be|kk)/.test(t.lang)) try{ LANG="ru"; }catch(e){} } }
function cleanNick(v){
  return String(v||"").replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]/g,"").replace(/\s+/g," ").trim().slice(0,16);
}
function fsSupported(){ const d=document; return !!(d.fullscreenEnabled||d.webkitFullscreenEnabled); }
function isFull(){ return !!(document.fullscreenElement||document.webkitFullscreenElement); }
function goFull(){ if(!fsSupported()||isFull()) return; const el=document.documentElement, rq=el.requestFullscreen||el.webkitRequestFullscreen;
  try{ const r=rq.call(el,{navigationUI:"hide"}); if(r&&r.catch) r.catch(()=>{}); }catch(e){} }
function exitFull(){ const d=document, ex=d.exitFullscreen||d.webkitExitFullscreen; try{ const r=ex.call(d); if(r&&r.catch) r.catch(()=>{}); }catch(e){} }
