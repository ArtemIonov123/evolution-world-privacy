let LANG="ru";
try{ const v=localStorage.getItem("island_lang"); if(v==="ru"||v==="pl") LANG=v; }catch(e){}
// перевод; параметр вида "#ключ" тоже переводится (например, название рыбы)
const TOUCH=matchMedia("(pointer: coarse)").matches;
// тексты и цены, которые админ поменял в редакторе (world/config)
const CFG={mobDmg:{},mobSpd:{},texts:{pl:{},ru:{}},buy:{},sell:{},off:{},drops:{},xp:{},xpFish:{},fishW:{},logs:{},fisher:{},mobHp:{},rods:{},mobTime:{}};
function tr(k,p){
  const ck=CFG.texts[LANG]&&CFG.texts[LANG][k];
  if(TOUCH&&I18N.pl[k+"_t"]) k=k+"_t";   // на телефоне — подсказки для пальцев вместо клавиш
  const s=typeof ck==="string"&&ck?ck:(I18N[LANG][k]??I18N.pl[k]??k);
  return p?s.replace(/\{(\w+)\}/g,(_,n)=>{const v=p[n]; return typeof v==="string"&&v[0]==="#"?tr(v.slice(1)):(v??"")}):s;
}
let lastStatus=["hint","hint_sub",null];
// короткая всплывашка над панелью кнопок; рутинные статусы (иду, пришёл…) не показываем
const QUIET_SAY=new Set(["hint","going","arrived","waiting","go_talk","go_fish","go_chop","go_attack","go_trade","chopping","casting","building","growing","ed_hint","loaded"]);
let toastT=0;
function say(main,sub,p,force){
  const same=lastStatus[0]===main&&lastStatus[1]===sub;
  lastStatus=[main,sub,p||null];
  if(force===false||QUIET_SAY.has(main)) return;
  const el=document.getElementById("toast"); if(!el) return;
  el.innerHTML=`${tr(main,p)}${sub?` <span>· ${tr(sub,p)}</span>`:""}`;
  el.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove("show"),same?2200:3200);
}
function applyLang(){
  document.documentElement.lang=LANG;
  document.querySelectorAll("[data-i18n]").forEach(el=>el.textContent=tr(CAVE&&el.dataset.i18n==="title_h"?"title_h_cave":el.dataset.i18n));
  { const sk=document.getElementById("skipTime"); if(sk&&(CAVE||ALWAYS_DAY)) sk.hidden=true; }
  document.querySelectorAll("[data-i18n-ph]").forEach(el=>el.placeholder=tr(el.dataset.i18nPh));
  document.querySelectorAll("[data-q]").forEach(el=>el.textContent=tr(el.dataset.q));
  if(typeof renderPlayers==="function") renderPlayers();
  if(typeof renderChatLog==="function"&&document.getElementById("chatLog")) renderChatLog();
  document.querySelectorAll("[data-i18n-label]").forEach(el=>{const t=tr(el.dataset.i18nLabel);el.setAttribute("aria-label",t);el.title=t;});
  document.querySelectorAll("[data-lang]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.lang===LANG));
  say(lastStatus[0],lastStatus[1],lastStatus[2],false);
  if(typeof renderInv==="function"&&ICONS.karas) renderInv();
  if(typeof renderWin==="function"&&ICONS.karas) renderWin();
  if(typeof renderDialog==="function") renderDialog();
  if(typeof lastClockText!=="undefined") lastClockText="";
  if(typeof renderHP==="function"&&document.getElementById("hp").innerHTML) renderHP();
}
function setLang(l){ LANG=l; try{localStorage.setItem("island_lang",l)}catch(e){} applyLang(); }


