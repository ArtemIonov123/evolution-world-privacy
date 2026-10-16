import sys
p=sys.argv[1]; s=open(p,encoding="utf-8").read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a); assert n==cnt,(n,a[:90]); s=s.replace(a,b)

# ---------- CSS ----------
rep(".adarea{min-height:90px;resize:vertical}",""".adarea{min-height:90px;resize:vertical}
.itrow{display:flex;align-items:center;gap:8px;text-align:left;padding:6px 9px;font-family:var(--f-body);letter-spacing:0;min-height:48px}
.itrow img,.itprev img{width:32px;height:32px;image-rendering:pixelated;flex:none}
.itrow .nm{flex:1;min-width:0;display:flex;flex-direction:column}.itrow .nm b{font-size:14px}.itrow .nm small{font-size:11.5px;opacity:.75;font-weight:400}
.itprev{display:flex;align-items:center;gap:10px;margin:6px 0}.itprev img{width:64px;height:64px;background:#1b1528;border:2px solid #000;padding:4px}
.itgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(40px,1fr));gap:4px;max-height:132px;overflow-y:auto;margin:4px 0;padding:2px}
.itgrid button{padding:2px;min-height:40px;display:grid;place-items:center}.itgrid button.on{background:var(--accent)}
.itgrid img{width:30px;height:30px;image-rendering:pixelated}
.plform input[type=range]{padding:0}
.plform .chk{display:flex;align-items:center;gap:6px;font-size:13px}.plform .chk input{width:auto}
.plform .wide{grid-column:1 / -1}""")

# ---------- i18n ----------
rep('''    ban_title:"Jesteś zablokowany",''','''    ad_items:"Przedmioty", ad_items_d:"Twórz broń, zbroję, mikstury", win_admin_items:"Przedmioty",
    it_new:"+ Nowy przedmiot", it_none:"Brak własnych przedmiotów. Stwórz pierwszy!", it_name_ru:"Nazwa (RU)", it_name_pl:"Nazwa (PL)", it_desc:"Opis",
    it_type:"Typ", it_t_weapon:"Broń", it_t_head:"Hełm", it_t_body:"Zbroja", it_t_feet:"Buty", it_t_neck:"Amulet", it_t_potion:"Mikstura / jedzenie", it_t_mat:"Materiał",
    it_atk:"Obrażenia", it_def:"Obrona", it_hp:"+HP max", it_heal:"Leczy HP", it_lv:"Od poziomu", it_cl:"Klasa", it_any:"każda",
    it_shop:"Sprzedawaj w sklepie", it_price:"Cena w sklepie", it_sell:"Kupiec skupi za", it_icon:"Ikona", it_upload:"Wgraj PNG", it_hue:"Kolor",
    it_save:"Zapisz", it_del:"Usuń", it_del_ok:"Na pewno usunąć?", it_give:"Daj sobie", it_given:"Dodano do twojej torby", it_saved:"Zapisano — gracze widzą od razu",
    it_noname:"Wpisz nazwę", ci_atk:"Obrażenia +{n}", ci_def:"Obrona +{n}", ci_hp:"HP max +{n}", ci_heal:"Leczy {n} HP", ci_lv:"od poz. {n}", ci_cl:"tylko: {c}", ci_sell:"kupiec da {c} monet",
    need_lv:"Potrzebny poziom {n}", need_cl:"Tylko dla klasy: {c}",
    ban_title:"Jesteś zablokowany",''')
rep('''    ban_title:"Вы заблокированы",''','''    ad_items:"Вещи", ad_items_d:"Создавай оружие, броню, зелья", win_admin_items:"Вещи",
    it_new:"+ Новая вещь", it_none:"Своих вещей пока нет. Создай первую!", it_name_ru:"Название (RU)", it_name_pl:"Название (PL)", it_desc:"Описание",
    it_type:"Тип", it_t_weapon:"Оружие", it_t_head:"Шлем", it_t_body:"Броня", it_t_feet:"Сапоги", it_t_neck:"Амулет", it_t_potion:"Зелье / еда", it_t_mat:"Материал",
    it_atk:"Урон", it_def:"Защита", it_hp:"+HP макс", it_heal:"Лечит HP", it_lv:"С уровня", it_cl:"Класс", it_any:"любой",
    it_shop:"Продавать в лавке", it_price:"Цена в лавке", it_sell:"Купец купит за", it_icon:"Иконка", it_upload:"Загрузить PNG", it_hue:"Цвет",
    it_save:"Сохранить", it_del:"Удалить", it_del_ok:"Точно удалить?", it_give:"Выдать себе", it_given:"Добавлено в твою сумку", it_saved:"Сохранено — игроки видят сразу",
    it_noname:"Впиши название", ci_atk:"Урон +{n}", ci_def:"Защита +{n}", ci_hp:"HP макс +{n}", ci_heal:"Лечит {n} HP", ci_lv:"с {n} ур.", ci_cl:"только: {c}", ci_sell:"купец даст {c} монет",
    need_lv:"Нужен уровень {n}", need_cl:"Только для класса: {c}",
    ban_title:"Вы заблокированы",''')

# ---------- game rules: generic HP bonus, requirements, safe lookups ----------
rep('''function heroAtk(){ return (equip.weapon?GEAR[equip.weapon].atk:0)+''','''function heroAtk(){ return (equip.weapon&&GEAR[equip.weapon]?GEAR[equip.weapon].atk||0:0)+''')
rep('''HP_MAX=5+Math.floor(heroLevel()/3)+(equip.neck==="amulet_fang"?1:0)+''','''HP_MAX=5+Math.floor(heroLevel()/3)+gearHP()+''')
rep('''function heroDef(){''','''function gearHP(){ let h=0; for(const s of SLOTS){ const g=equip[s]&&GEAR[equip[s]]; if(g&&g.hp) h+=g.hp; } return h; }
function heroDef(){''')
rep('''function giveItem(id,n=1){ inv[id]=(inv[id]||0)+n; const g=GEAR[id]; if(g&&!equip[g.slot]) equipItem(id); else renderInv(); }
function equipItem(id){
  const g=GEAR[id]; if(!g||!inv[id]) return;''','''function canWear(g){ return !(g.lv&&heroLevel()<g.lv)&&!(g.cl&&g.cl!==heroClass); }
function giveItem(id,n=1){ inv[id]=(inv[id]||0)+n; const g=GEAR[id]; if(g&&!equip[g.slot]&&canWear(g)) equipItem(id); else renderInv(); }
function equipItem(id){
  const g=GEAR[id]; if(!g||!inv[id]) return;
  if(g.lv&&heroLevel()<g.lv){ say("need_lv",null,{n:g.lv}); return; }
  if(g.cl&&g.cl!==heroClass){ say("need_cl",null,{c:"#cl_"+g.cl}); return; }''')
rep('''function itemDesc(id){
  if(EDIBLE[id])''','''function itemDesc(id){
  if(CUSTOM[id]) return customDesc(CUSTOM[id]);
  if(EDIBLE[id])''')
rep('''const shopList=()=>SHOP.filter(''','''const shopList=()=>SHOP.concat(CUSTOM_SHOP).filter(''')

# ---------- custom items: registry ----------
rep('''// ---- описание предмета ----''','''// ---- свои вещи из админки (world/items) ----
const CUSTOM={}, CUSTOM_SHOP=[], IT_TYPES=["weapon","head","body","feet","neck","potion","mat"];
const itClean=v=>String(v||"").replace(/[<>&"'`\\u0000-\\u001f]/g,"").replace(/\\s+/g," ").trim();
const itNum=(v,hi)=>Math.max(0,Math.min(hi,Math.round(+v||0)));
function itSanitize(id,o){
  if(!/^c[A-Za-z0-9]{4,12}$/.test(id)||!o||typeof o!=="object") return null;
  const t=IT_TYPES.includes(o.t)?o.t:"mat", ru=itClean(o.ru).slice(0,24), pl=itClean(o.pl).slice(0,24)||ru; if(!ru&&!pl) return null;
  return {id,t,ru:ru||pl,pl,d:itClean(o.d).slice(0,120),atk:itNum(o.atk,99),def:itNum(o.def,99),hp:itNum(o.hp,99),heal:itNum(o.heal,99),
    lv:itNum(o.lv,60),cl:CLASSES.includes(o.cl)?o.cl:"",shop:!!o.shop,price:itNum(o.price,999999),sell:itNum(o.sell,999999),
    b:typeof o.b==="string"&&/^[a-z_]{2,20}$/.test(o.b)?o.b:"",hue:itNum(o.hue,359),img:typeof o.img==="string"&&/^data:image\\/png;base64,[A-Za-z0-9+\\/=]{20,20000}$/.test(o.img)?o.img:""};
}
function hueShift(cv,deg){
  if(!deg) return cv; const g=cv.getContext("2d"), d=g.getImageData(0,0,cv.width,cv.height), a=d.data, k=deg/360;
  for(let i=0;i<a.length;i+=4){ if(!a[i+3]) continue; let r=a[i]/255,gg=a[i+1]/255,b=a[i+2]/255; const mx=Math.max(r,gg,b), mn=Math.min(r,gg,b), l=(mx+mn)/2;
    if(mx===mn) continue; const dd=mx-mn, sat=l>0.5?dd/(2-mx-mn):dd/(mx+mn); let h=mx===r?(gg-b)/dd+(gg<b?6:0):mx===gg?(b-r)/dd+2:(r-gg)/dd+4; h=(h/6+k)%1;
    const q=l<0.5?l*(1+sat):l+sat-l*sat, pp=2*l-q, f=t=>{ t=(t+1)%1; return t<1/6?pp+(q-pp)*6*t:t<1/2?q:t<2/3?pp+(q-pp)*(2/3-t)*6:pp; };
    a[i]=f(h+1/3)*255; a[i+1]=f(h)*255; a[i+2]=f(h-1/3)*255; }
  g.putImageData(d,0,0); return cv;
}
function customIcon(it,done){
  const cv2=document.createElement("canvas"); cv2.width=cv2.height=32; const g=cv2.getContext("2d"); g.imageSmoothingEnabled=false;
  if(it.img){ const im=new Image(); im.onload=()=>{ g.clearRect(0,0,32,32); g.drawImage(im,0,0,32,32); hueShift(cv2,it.hue); done&&done(); }; im.src=it.img; return cv2; }
  const base=ICONS[it.b]||ICONS[{weapon:"sword_iron",head:"helm_iron",body:"armor_leather",feet:"boots_leather",neck:"amulet_fang",potion:"potion",mat:"fang"}[it.t]];
  if(base) g.drawImage(base,0,0,32,32); return hueShift(cv2,it.hue);
}
function customDesc(it){
  const out=[]; if(it.atk) out.push(tr("ci_atk",{n:it.atk})); if(it.def) out.push(tr("ci_def",{n:it.def})); if(it.hp) out.push(tr("ci_hp",{n:it.hp}));
  if(it.t==="potion"&&it.heal) out.push(tr("ci_heal",{n:it.heal})); if(it.lv>1) out.push(tr("ci_lv",{n:it.lv})); if(it.cl) out.push(tr("ci_cl",{c:"#cl_"+it.cl}));
  if(it.sell) out.push(tr("ci_sell",{c:it.sell}));
  return (it.d?it.d+" · ":"")+out.join(" · ");
}
let itemsRaw={};
function applyItems(d){
  const list=d&&d.list&&typeof d.list==="object"?d.list:{}; itemsRaw={};
  for(const id of Object.keys(CUSTOM)){ const i=ITEMS.findIndex(f=>f.id===id); if(i>=0) ITEMS.splice(i,1);
    delete GEAR[id]; delete EDIBLE[id]; delete SELL_P[id]; delete I18N.ru["fish_"+id]; delete I18N.pl["fish_"+id]; delete ICONS[id]; delete CUSTOM[id]; }
  CUSTOM_SHOP.length=0;
  for(const [id,o] of Object.entries(list).slice(0,300)){ const it=itSanitize(id,o); if(!it) continue;
    CUSTOM[id]=it; itemsRaw[id]=it; ITEMS.push({id,custom:true});
    I18N.ru["fish_"+id]=it.ru; I18N.pl["fish_"+id]=it.pl;
    if(["weapon","head","body","feet","neck"].includes(it.t)){ const gg={slot:it.t}; if(it.atk) gg.atk=it.atk; if(it.def) gg.def=it.def; if(it.hp) gg.hp=it.hp; if(it.lv>1) gg.lv=it.lv; if(it.cl) gg.cl=it.cl; GEAR[id]=gg; }
    if(it.t==="potion") EDIBLE[id]=Math.max(1,it.heal);
    if(it.sell) SELL_P[id]=it.sell;
    if(it.shop&&it.price>0) CUSTOM_SHOP.push({id,p:it.price});
    ICONS[id]=customIcon(it,()=>{ renderInv(); if(winKind) renderWin(); }); }
  let changed=false; for(const sl of SLOTS) if(equip[sl]&&!GEAR[equip[sl]]){ equip[sl]=null; changed=true; }
  if(changed){ recalcHP(); lastSaveJSON=""; }
  renderInv(); if(winKind) renderWin();
}
// ---- описание предмета ----''')

# load before the save (иначе инвентарь выкинет неизвестные вещи)
rep('''    if(NET.myId) await loadSave();
    classLoaded=true;''','''    try{ const s=await db.doc("world/items").get(); applyItems(s.exists?s.data():null); }catch(e){}
    db.doc("world/items").onSnapshot(s=>applyItems(s.exists?s.data():null),()=>{});
    if(NET.myId) await loadSave();
    classLoaded=true;''')

# ---------- admin: hub card + section ----------
rep('''  card("\\u{1F465}","ad_pl","ad_pl_d",()=>{ adSel=null; adMsg=""; winKind="admin_pl"; renderWin(); });''','''  card("\\u{1F465}","ad_pl","ad_pl_d",()=>{ adSel=null; adMsg=""; winKind="admin_pl"; renderWin(); });
  card("\\u{1F5E1}\\uFE0F","ad_items","ad_items_d",()=>{ itSel=null; adMsg=""; winKind="admin_items"; renderWin(); });''')
rep('''if(winKind==="admin_nf") renderNickFilter(body); else''','''if(winKind==="admin_nf") renderNickFilter(body); else if(winKind==="admin_items") renderAdminItems(body); else''')
rep('''function renderNickFilter(body){''','''let itSel=null, itDraft=null, itDelAsk=false;
const itRid=()=>"c"+Math.random().toString(36).slice(2,9).replace(/[^a-z0-9]/g,"x");
function itLabel(it){ return LANG==="ru"?it.ru:it.pl; }
function renderAdminItems(body){
  if(!isAdmin){ closeWin(); return; }
  if(itSel){ renderItemCard(body); return; }
  adHead(body);
  const nb=adBtn(tr("it_new"),()=>{ itSel=itRid(); itDelAsk=false; adMsg=""; itDraft={id:itSel,t:"weapon",ru:"",pl:"",d:"",atk:3,def:0,hp:0,heal:0,lv:1,cl:"",shop:true,price:50,sell:20,b:"",hue:0,img:"",isNew:true}; renderWin(); },"big");
  nb.style.width="100%"; nb.style.marginBottom="8px"; body.appendChild(nb);
  const ids=Object.keys(CUSTOM);
  if(!ids.length){ body.appendChild(mkEl("p","muted",tr("it_none"))); return; }
  const l=mkEl("div","pllist");
  for(const id of ids){ const it=CUSTOM[id], b=mkEl("button","btn itrow"); b.type="button";
    const im=mkEl("img"); im.src=iconURL(id); im.alt=""; b.appendChild(im);
    const nm=mkEl("span","nm"); nm.appendChild(mkEl("b",null,itLabel(it))); nm.appendChild(mkEl("small",null,tr("it_t_"+it.t)+" · "+customDesc(it))); b.appendChild(nm);
    b.onclick=()=>{ itSel=id; itDelAsk=false; adMsg=""; itDraft={...it}; renderWin(); }; l.appendChild(b); }
  body.appendChild(l);
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
  const ts=mkEl("select"); for(const t of IT_TYPES){ const o=mkEl("option",null,tr("it_t_"+t)); o.value=t; o.selected=E.t===t; ts.appendChild(o); }
  ts.onchange=()=>{ E.t=ts.value; if(!E.img&&!E.b) prev(); renderWin(); }; field("it_type",ts);
  const gear=["weapon","head","body","feet","neck"].includes(E.t);
  if(E.t==="weapon") field("it_atk",num("atk",99));
  if(gear&&E.t!=="weapon") field("it_def",num("def",99));
  if(gear) field("it_hp",num("hp",99));
  if(E.t==="potion") field("it_heal",num("heal",99));
  if(gear){ field("it_lv",num("lv",60));
    const cs=mkEl("select"); for(const c of ["",...CLASSES]){ const o=mkEl("option",null,c?tr("cl_"+c):tr("it_any")); o.value=c; o.selected=E.cl===c; cs.appendChild(o); }
    cs.onchange=()=>{ E.cl=cs.value; }; field("it_cl",cs); }
  const sh=mkEl("label","chk wide"), cb=mkEl("input"); cb.type="checkbox"; cb.checked=E.shop; cb.onchange=()=>{ E.shop=cb.checked; renderWin(); };
  sh.appendChild(cb); sh.appendChild(document.createTextNode(tr("it_shop"))); f.appendChild(sh);
  if(E.shop) field("it_price",num("price",999999));
  field("it_sell",num("sell",999999));
  body.appendChild(f);
  // иконка: готовая из игры (+ сдвиг цвета) или своя картинка
  body.appendChild(mkEl("b",null,tr("it_icon")));
  const grid=mkEl("div","itgrid");
  for(const it of ITEMS){ if(it.custom||!ICONS[it.id]) continue; const b=mkEl("button","btn"+(!E.img&&E.b===it.id?" on":"")); b.type="button"; b.title=tr("fish_"+it.id);
    const im=mkEl("img"); im.src=iconURL(it.id); im.alt=""; b.appendChild(im); b.onclick=()=>{ E.b=it.id; E.img=""; renderWin(); }; grid.appendChild(b); }
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
    bt.appendChild(adBtn(tr(itDelAsk?"it_del_ok":"it_del"),()=>{ if(!itDelAsk){ itDelAsk=true; renderWin(); return; } itWrite(E.id,null); itSel=null; itDraft=null; renderWin(); },"warn")); }
  body.appendChild(bt);
  if(adMsg) body.appendChild(mkEl("div","adok",adMsg));
}
function itWrite(id,val){
  const list={}; for(const [k,v] of Object.entries(itemsRaw)) list[k]=v;
  if(val) list[id]=val; else delete list[id];
  applyItems({list}); if(NET.db) NET.db.doc("world/items").set({list}).catch(()=>{});
}
function itSave(){
  const E=itDraft; const it=itSanitize(E.id,E); if(!it){ adMsg=tr("it_noname"); renderWin(); return; }
  delete it.id; itWrite(E.id,it); itDraft={...CUSTOM[E.id]}; adMsg=tr("it_saved"); renderWin();
}
function renderNickFilter(body){''')

open(p,"w",encoding="utf-8").write(s); print("ok")
