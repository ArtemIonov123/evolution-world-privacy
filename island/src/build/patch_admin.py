import sys
p=sys.argv[1]; s=open(p,encoding="utf-8").read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a)
    assert n==cnt,(n,a[:80])
    s=s.replace(a,b)

# ---------- CSS ----------
rep(".edtabs{display:flex;gap:4px;flex-wrap:wrap}",
""".edtabs{display:flex;gap:4px;flex-wrap:wrap}
.edsec{font-weight:700;color:var(--accent);font-size:14px;margin:2px 0 0}
.adhub{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.adcard{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:10px;min-height:76px;font-family:var(--f-body);letter-spacing:0}
.adcard b{font-size:15px}.adcard small{font-weight:400;opacity:.75;font-size:11.5px;line-height:1.3}
.adcard .ic{font-size:22px;line-height:1}
.adtop{display:flex;gap:6px;align-items:center;margin-bottom:8px}
.adtop .btn{font-family:var(--f-body);letter-spacing:0;font-size:13px;min-height:34px;padding:4px 10px}
.adsearch{flex:1;min-width:0;font:inherit;font-size:15px;padding:8px 10px;background:#1b1528;color:#f4efe0;border:2px solid #000;border-radius:0}
.adchips{display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap}
.adchips .btn{font-family:var(--f-body);letter-spacing:0;font-size:12px;min-height:30px;padding:2px 10px}
.adchips .btn.on{background:var(--accent);color:var(--panel)}
.pllist{display:flex;flex-direction:column;gap:4px}
.plrow{display:flex;align-items:center;gap:8px;text-align:left;padding:7px 9px;font-family:var(--f-body);letter-spacing:0;min-height:44px}
.plrow .dot{width:9px;height:9px;flex:none;background:#6b6478;border:1px solid #000}.plrow .dot.on{background:#5fe35f}
.plrow .nm{flex:1;min-width:0;display:flex;flex-direction:column}.plrow .nm b{font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.plrow .nm small,.plmeta{font-size:11.5px;opacity:.75;font-weight:400}
.plrow .ban{color:#ff7a7a;font-weight:700;font-size:11px}
.plform{display:grid;grid-template-columns:auto 1fr;gap:6px 8px;align-items:center;margin:8px 0}
.plform label{font-size:13px;opacity:.85}
.plform input,.plform select,.plinv input,.plinv select,.adarea{font:inherit;font-size:14px;padding:6px 8px;background:#1b1528;color:#f4efe0;border:2px solid #000;border-radius:0;min-width:0;width:100%;box-sizing:border-box}
.plinv{display:flex;flex-direction:column;gap:4px;margin:6px 0}
.plinv .r{display:flex;gap:6px;align-items:center}.plinv .r span{flex:1;font-size:13px}.plinv .r input{width:80px;flex:none}
.plbtns{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.plbtns .btn{flex:1;font-family:var(--f-body);letter-spacing:0;font-size:13px;min-height:38px}
.plbtns .big{background:var(--accent);color:var(--panel)}.plbtns .warn{background:#a33;color:#fff}
.adnote{font-size:12px;opacity:.8;margin:6px 0}.adok{color:#7fe07f;font-size:13px;margin-top:6px}
.adarea{min-height:90px;resize:vertical}
.banwrap{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#2b2340;color:#f4efe0;text-align:center;padding:24px;font:16px/1.5 system-ui,sans-serif}""")

# ---------- i18n ----------
rep('    ed_open:"Panel admina",',
'''    ed_open:"Panel admina", win_admin:"Panel admina", win_admin_pl:"Gracze", win_admin_nf:"Filtr nicków",
    ad_map:"Edytor mapy", ad_map_d:"Teren, obiekty, miejsca, strefy", ad_mapc:"Mapa jaskini", ad_mapi:"Mapa wyspy", ad_mapc_d:"Przejdź i edytuj",
    ad_pl:"Gracze", ad_pl_d:"Szukaj, edytuj, banuj", ad_texts:"Teksty i NPC", ad_texts_d:"Dialogi i napisy",
    ad_shop:"Sklep", ad_shop_d:"Ceny kupna i sprzedaży", ad_drop:"Drop i potwory", ad_drop_d:"Łup, HP, odrodzenie, XP",
    ad_nf:"Filtr nicków", ad_nf_d:"Zakazane słowa", ad_back:"← Sekcje", ad_search:"Nick lub ID…",
    ad_all:"Wszyscy", ad_online:"Online", ad_banned:"Bany", ad_none:"Nikogo nie znaleziono", ad_count:"{n} graczy",
    ad_tg:"Telegram", ad_web:"Przeglądarka", ad_now:"teraz w grze", ad_lv:"Poz. {n}", ad_noclass:"bez klasy",
    ad_nick:"Nick", ad_coins:"Monety", ad_cr:"Kryształy", ad_xp:"XP", ad_class:"Klasa", ad_inv:"Ekwipunek", ad_add:"+ przedmiot",
    ad_apply:"Zapisz zmiany", ad_ban:"Zbanuj", ad_unban:"Odbanuj", ad_ban_r:"Powód bana", ad_rename:"Reset nicka",
    ad_saved:"Zapisano. Gracz online dostanie zmiany od razu.", ad_loading:"Ładowanie…", ad_nosave:"Brak zapisu gracza",
    ad_me:"To ty", ad_bannedby:"Zbanowany: {r}", ad_nf_note:"Słowa oddzielaj przecinkami. Wbudowana lista działa zawsze.",
    ad_nf_save:"Zapisz", ad_id:"ID: {id}", adm_changed:"Administrator zmienił twoje dane",
    ban_title:"Jesteś zablokowany", ban_reason:"Powód: {r}", nick_bad:"Ten nick jest niedozwolony",''')
rep('    ed_open:"Админка",',
'''    ed_open:"Админка", win_admin:"Админка", win_admin_pl:"Игроки", win_admin_nf:"Фильтр ников",
    ad_map:"Редактор карты", ad_map_d:"Земля, объекты, места, зоны", ad_mapc:"Карта пещеры", ad_mapi:"Карта острова", ad_mapc_d:"Перейти и редактировать",
    ad_pl:"Игроки", ad_pl_d:"Поиск, правка, бан", ad_texts:"Тексты и NPC", ad_texts_d:"Диалоги и надписи",
    ad_shop:"Лавка", ad_shop_d:"Цены покупки и продажи", ad_drop:"Дроп и мобы", ad_drop_d:"Лут, HP, респаун, опыт",
    ad_nf:"Фильтр ников", ad_nf_d:"Запрещённые слова", ad_back:"← Разделы", ad_search:"Ник или ID…",
    ad_all:"Все", ad_online:"Онлайн", ad_banned:"Баны", ad_none:"Никого не нашлось", ad_count:"Игроков: {n}",
    ad_tg:"Telegram", ad_web:"Браузер", ad_now:"сейчас в игре", ad_lv:"Ур. {n}", ad_noclass:"без класса",
    ad_nick:"Ник", ad_coins:"Монеты", ad_cr:"Кристаллы", ad_xp:"Опыт", ad_class:"Класс", ad_inv:"Инвентарь", ad_add:"+ предмет",
    ad_apply:"Сохранить", ad_ban:"Забанить", ad_unban:"Разбанить", ad_ban_r:"Причина бана", ad_rename:"Сбросить ник",
    ad_saved:"Сохранено. Если игрок онлайн — получит сразу.", ad_loading:"Загрузка…", ad_nosave:"У игрока нет сохранения",
    ad_me:"Это ты", ad_bannedby:"Забанен: {r}", ad_nf_note:"Слова через запятую. Встроенный список работает всегда.",
    ad_nf_save:"Сохранить", ad_id:"ID: {id}", adm_changed:"Админ изменил твои данные",
    ban_title:"Вы заблокированы", ban_reason:"Причина: {r}", nick_bad:"Такой ник запрещён",''')

# ---------- nick filter ----------
rep('''function cleanNick(v){''','''// фильтр ников: встроенный список + слова из админки (world/nickfilter)
const NICK_BAD=["hitler","gitler","nazi","fuck","shit","cunt","bitch","whore","nigger","nigga","faggot","kurwa","chuj","jebac","pierdol","cipa",
  "гитлер","хитлер","нацист","хуй","хуе","хуё","пизд","ебат","ебан","ебал","ёб","бляд","блят","сука","пидор","пидар","шлюх","залуп","мудак","гандон","даун"];
let NICK_EXTRA=[];
const LOOK={"a":"а","e":"е","o":"о","p":"р","c":"с","x":"х","y":"у","k":"к","m":"м","t":"т","h":"н","b":"в","0":"о","3":"е","@":"а","4":"а","6":"б"};
const LAT={"а":"a","е":"e","о":"o","р":"p","с":"c","х":"x","у":"y","к":"k","м":"m","т":"t","н":"h","в":"b","і":"i","ё":"e"};
function badNick(v){
  const low=String(v||"").toLowerCase().replace(/[1!|]/g,"i").replace(/[0]/g,"o").replace(/[3]/g,"e").replace(/[@4]/g,"a").replace(/[\\$5]/g,"s").replace(/[^a-zа-яёі]/g,"");
  const cyr=low.replace(/[a-z0-9@]/g,ch=>LOOK[ch]||ch), lat=low.replace(/[а-яёі]/g,ch=>LAT[ch]||ch);
  for(const w of NICK_BAD.concat(NICK_EXTRA)){ if(!w) continue; if(low.includes(w)||cyr.includes(w)||lat.includes(w)) return true; }
  return false;
}
function cleanNick(v){''')
rep('''{ const t=window.__islandTG; if(t){ let n=cleanNick((t.first+" "+t.last).trim()); if(n.length<2) n=cleanNick(t.user); if(n.length<2) n=cleanNick("Hero"+t.id.slice(-4));''',
'''{ const t=window.__islandTG; if(t){ let n=cleanNick((t.first+" "+t.last).trim()); if(n.length<2||badNick(n)) n=cleanNick(t.user); if(n.length<2||badNick(n)) n=cleanNick("Hero"+t.id.slice(-4));''')
rep('''function setNick(v){
  const n=cleanNick(v); if(n.length<2) return false;''','''function setNick(v,force){
  const n=cleanNick(v); if(n.length<2) return false; if(!force&&badNick(n)) return false;''')
rep('''const nickOf=v=>typeof v==="string"?cleanNick(v):"";''','''const nickOf=v=>typeof v==="string"?(badNick(v)?"***":cleanNick(v)):"";''')
rep('''    else document.getElementById("nickErr").hidden=false; };''','''    else { const er=document.getElementById("nickErr"); er.textContent=tr(badNick(document.getElementById("nickIn").value)?"nick_bad":"nick_err"); er.hidden=false; } };''')

# forced nick (admin rename survives the Telegram profile name)
rep('''    if(!myNick&&typeof d.nick==="string"&&cleanNick(d.nick).length>=2){''','''    if(typeof d.nf==="string"&&cleanNick(d.nf).length>=2){ forcedNick=cleanNick(d.nf); setNick(forcedNick,true); }
    else if(myNick&&badNick(myNick)) setNick("Hero"+String(NET.myId||"").slice(-4),true);
    if(!myNick&&typeof d.nick==="string"&&cleanNick(d.nick).length>=2){''')
rep('''let saveT=3, saving=false, lastSaveJSON="";''','''let saveT=3, saving=false, lastSaveJSON="", forcedNick=null;''')
rep('''x:Math.round(hero.x),y:Math.round(hero.y),nick:myNick};''','''x:Math.round(hero.x),y:Math.round(hero.y),nick:myNick}; if(forcedNick) s.nf=forcedNick;''')

# players doc: class, level, platform
rep('''c:myHueIdx,n:myNick,zn:ZONE};''','''c:myHueIdx,n:myNick,zn:ZONE,cl:heroClass||"",lv:heroLevel(),tg:window.__islandTG?1:0};''')

# admin ops + bans subscription after the save is loaded
rep('''    if(NET.myId) await loadSave();
    classLoaded=true;''','''    if(NET.myId) await loadSave();
    classLoaded=true;
    if(NET.myId){
      db.doc("admin_ops/"+NET.myId).onSnapshot(s=>{ if(s.exists) applyAdminOp(s.data()); },()=>{});
      db.doc("world/bans").onSnapshot(s=>{ BANS=(s.exists&&s.data()&&s.data().list)||{}; checkBan(); if(winKind==="admin_pl") renderWin(); },()=>{});
    }
    db.doc("world/nickfilter").onSnapshot(s=>{ const d=s.exists?s.data():null; NICK_EXTRA=d&&Array.isArray(d.w)?d.w.filter(w=>typeof w==="string").map(w=>w.toLowerCase().trim()).filter(Boolean).slice(0,300):[]; },()=>{});''')

# window router
rep('''  if(winKind==="shop") renderShop(body); else if(winKind==="bag")''','''  if(winKind==="admin") renderAdminHub(body); else if(winKind==="admin_pl") renderAdminPlayers(body); else if(winKind==="admin_nf") renderNickFilter(body); else
  if(winKind==="shop") renderShop(body); else if(winKind==="bag")''')

# editor: one section at a time, "back to sections" button instead of tabs
rep('''function edEnter(){
  if(!isAdmin) return;''','''function edEnter(sec){
  if(!isAdmin) return; if(typeof sec!=="string") sec="map";''')
rep('''  edTab="map"; edCfg=edCfgFrom();''','''  edTab=sec; edCfg=edCfgFrom();''')
rep('''  if(ok){ let re=null; try{ re=sessionStorage.getItem("island_reedit"); sessionStorage.removeItem("island_reedit"); }catch(e){} if(re) setTimeout(edEnter,300); }''',
'''  if(ok){ let re=null, hub=null; try{ re=sessionStorage.getItem("island_reedit"); sessionStorage.removeItem("island_reedit"); hub=sessionStorage.getItem("island_adhub"); sessionStorage.removeItem("island_adhub"); }catch(e){}
    if(re) setTimeout(()=>edEnter(re==="1"?"map":re),300); else if(hub) setTimeout(()=>openWin("admin"),300); }''')
rep('''  if(reload){ say("ed_saved_reload"); try{ sessionStorage.setItem("island_reedit","1");''','''  if(reload){ say("ed_saved_reload"); try{ sessionStorage.setItem("island_reedit",edTab);''')
rep('''function edExit(){''','''function edBack(){ edExit(true); }
function edExit(toHub){''')
rep('''  if(edUndo.length){ setTimeout(()=>location.reload(),300); return; }   // несохранённые правки — вернуть как было
  say("hint","hint_sub"); dirty=true;''','''  if(edUndo.length){ if(toHub===true) try{ sessionStorage.setItem("island_adhub","1"); }catch(e){} setTimeout(()=>location.reload(),300); return; }   // несохранённые правки — вернуть как было
  say("hint","hint_sub"); dirty=true;
  if(toHub===true) openWin("admin");''')
rep('''  const top=mkEl("div","edtop");
  top.appendChild(btn(tr("ed_undo"),edUndoLast,"",edTab!=="map"||!edUndo.length));''','''  const top=mkEl("div","edtop");
  top.appendChild(btn(tr("ad_back"),edBack,""));
  if(edTab==="map") top.appendChild(btn(tr("ed_undo"),edUndoLast,"",!edUndo.length));''')
rep('''  top.appendChild(btn(tr(edExitConfirm?"ed_exit_confirm":"ed_exit"),edExit,edExitConfirm?"warn":""));
  p.appendChild(top);
  const tabs=mkEl("div","edtabs");
  for(const t of ["map","texts","shop","drop"]){ const b=btn(tr("ed_tab_"+t),()=>{ edTab=t; edRender(); },edTab===t?"on":""); tabs.appendChild(b); }
  p.appendChild(tabs);''','''  top.appendChild(btn(tr(edExitConfirm?"ed_exit_confirm":"ed_exit"),()=>edExit(false),edExitConfirm?"warn":""));
  p.appendChild(top);
  p.appendChild(mkEl("div","edsec",tr({map:CAVE?"ad_mapc":"ad_map",texts:"ad_texts",shop:"ad_shop",drop:"ad_drop"}[edTab]||"ad_map")));''')
rep('''document.getElementById("editBtn").onclick=()=>{ menuEl.classList.remove("open"); edEnter(); };''','''document.getElementById("editBtn").onclick=()=>{ menuEl.classList.remove("open"); if(winKind!=="admin") openWin("admin"); };''')

# ---------- admin hub, players, nick filter, ops, bans ----------
rep('''// ---- режим редактора ----''','''// ---- админка: разделы ----
let BANS={}, adQ="", adFilter="all", adSel=null, adSave=null, adMsg="", adEdit=null;
function adBtn(label,fn,cls){ const b=mkEl("button","btn"+(cls?" "+cls:""),label); b.type="button"; b.onclick=fn; return b; }
function renderAdminHub(body){
  if(!isAdmin){ closeWin(); return; }
  const g=mkEl("div","adhub");
  const card=(ic,t,d,fn)=>{ const b=mkEl("button","btn adcard"); b.type="button"; b.appendChild(mkEl("span","ic",ic)); b.appendChild(mkEl("b",null,tr(t))); b.appendChild(mkEl("small",null,tr(d))); b.onclick=fn; g.appendChild(b); };
  card("\\u{1F5FA}\\uFE0F",CAVE?"ad_mapc":"ad_map","ad_map_d",()=>{ closeWin(); edEnter("map"); });
  card(CAVE?"\\u{1F3DD}\\uFE0F":"\\u26F0\\uFE0F",CAVE?"ad_mapi":"ad_mapc","ad_mapc_d",()=>{ closeWin(); adSwitchZone(); });
  card("\\u{1F465}","ad_pl","ad_pl_d",()=>{ adSel=null; adMsg=""; winKind="admin_pl"; renderWin(); });
  card("\\u{1F4AC}","ad_texts","ad_texts_d",()=>{ closeWin(); edEnter("texts"); });
  card("\\u{1F6D2}","ad_shop","ad_shop_d",()=>{ closeWin(); edEnter("shop"); });
  card("\\u{1F480}","ad_drop","ad_drop_d",()=>{ closeWin(); edEnter("drop"); });
  card("\\u{1F6AB}","ad_nf","ad_nf_d",()=>{ adMsg=""; winKind="admin_nf"; renderWin(); });
  body.appendChild(g);
}
function adSwitchZone(){
  saveNow(); try{ sessionStorage.setItem("island_zone",CAVE?"island":"cave"); sessionStorage.setItem("island_spawn","portal"); sessionStorage.setItem("island_reedit","map"); }catch(e){}
  document.getElementById("fade").style.opacity="1"; setTimeout(()=>location.reload(),500);
}
function adHead(body,backFn){ const t=mkEl("div","adtop"); t.appendChild(adBtn(tr("ad_back"),backFn||(()=>{ winKind="admin"; renderWin(); }))); body.appendChild(t); return t; }
// все игроки: записи players/<id> (кто когда был), онлайн — по комнате
let adPlayers=[];
function adCollect(docs){ adPlayers=docs.map(s=>({id:s.id,d:s.data()||{}})).filter(p=>p.d); if(winKind==="admin_pl"&&!adSel) adRenderList(); }
function adMine(){ return {id:NET.myId,d:{n:myNick,last:Date.now(),cl:heroClass||"",lv:heroLevel(),tg:window.__islandTG?1:0}}; }
function adRows(){
  const on=onlineIds(); if(NET.myId) on.add(NET.myId);
  const all=adPlayers.filter(p=>p.id!==NET.myId).concat(NET.myId?[adMine()]:[]);
  const q=adQ.trim().toLowerCase();
  let rows=all.map(p=>({...p,on:on.has(p.id),ban:BANS[p.id]||null}));
  if(q) rows=rows.filter(r=>String(r.d.n||"").toLowerCase().includes(q)||r.id.toLowerCase().includes(q)||r.id.replace(/^utg/,"").includes(q));
  if(adFilter==="online") rows=rows.filter(r=>r.on); else if(adFilter==="banned") rows=rows.filter(r=>r.ban);
  rows.sort((a,b)=>(b.on-a.on)||((+b.d.last||0)-(+a.d.last||0)));
  return rows;
}
function adRenderList(){
  const el=document.getElementById("adList"); if(!el) return; el.textContent="";
  const rows=adRows();
  const cnt=document.getElementById("adCnt"); if(cnt) cnt.textContent=tr("ad_count",{n:rows.length});
  if(!rows.length){ el.appendChild(mkEl("p","muted",tr("ad_none"))); return; }
  for(const r of rows.slice(0,200)){
    const b=mkEl("button","btn plrow"); b.type="button";
    b.appendChild(mkEl("span","dot"+(r.on?" on":"")));
    const nm=mkEl("span","nm"); nm.appendChild(mkEl("b",null,cleanNick(r.d.n||"")||r.id));
    const meta=[r.id.startsWith("utg")?tr("ad_tg"):tr("ad_web")];
    if(typeof r.d.lv==="number") meta.push(tr("ad_lv",{n:r.d.lv}));
    if(r.d.cl) meta.push(tr("cl_"+r.d.cl));
    meta.push(r.on?tr("ad_now"):(r.d.last?agoText(+r.d.last):"—"));
    nm.appendChild(mkEl("small",null,meta.join(" · "))); b.appendChild(nm);
    if(r.ban) b.appendChild(mkEl("span","ban","BAN"));
    b.onclick=()=>adOpen(r.id);
    el.appendChild(b);
  }
}
function renderAdminPlayers(body){
  if(!isAdmin){ closeWin(); return; }
  if(adSel){ adRenderCard(body); return; }
  const t=adHead(body);
  const inp=mkEl("input","adsearch"); inp.type="search"; inp.placeholder=tr("ad_search"); inp.value=adQ; inp.id="adSearch"; inp.autocomplete="off"; inp.spellcheck=false;
  inp.oninput=()=>{ adQ=inp.value; adRenderList(); }; t.appendChild(inp);
  const ch=mkEl("div","adchips");
  for(const f of ["all","online","banned"]) ch.appendChild(adBtn(tr("ad_"+f),()=>{ adFilter=f; renderWin(); },adFilter===f?"on":""));
  const c=mkEl("span","plmeta"); c.id="adCnt"; c.style.alignSelf="center"; c.style.marginLeft="auto"; ch.appendChild(c);
  body.appendChild(ch);
  const l=mkEl("div","pllist"); l.id="adList"; body.appendChild(l);
  adRenderList();
}
async function adOpen(id){
  adSel=id; adSave=null; adMsg=""; adEdit=null; renderWin();
  try{ const s=await NET.db.doc(`data/users/${id}/save`).get(); if(adSel!==id) return; adSave=s.exists?(s.data()||{}):false; }catch(e){ adSave=false; }
  const p=adPlayers.find(x=>x.id===id)||(id===NET.myId?adMine():{d:{}});
  const sv=adSave||{}, iv=sv.inv&&typeof sv.inv==="object"?{...sv.inv}:{};
  adEdit={nick:cleanNick(sv.nf||sv.nick||p.d.n||""),coin:iv.coin|0,cr:sv.cr|0,xp:(sv.pg&&sv.pg.xp)|0,cl:CLASSES.includes(sv.cl)?sv.cl:"",inv:Object.fromEntries(Object.entries(iv).filter(([k,v])=>k!=="coin"&&typeof v==="number"&&v>0))};
  if(id===NET.myId) adEdit={nick:myNick,coin:inv.coin||0,cr:crystals,xp:prog.xp,cl:heroClass||"",inv:Object.fromEntries(Object.entries(inv).filter(([k])=>k!=="coin"))};
  if(winKind==="admin_pl"&&adSel===id) renderWin();
}
function adRenderCard(body){
  const id=adSel, p=adPlayers.find(x=>x.id===id)||(id===NET.myId?adMine():{id,d:{}}), on=onlineIds().has(id)||id===NET.myId, ban=BANS[id];
  adHead(body,()=>{ adSel=null; adMsg=""; renderWin(); });
  body.appendChild(mkEl("b",null,cleanNick(p.d.n||"")||id));
  const meta=[id.startsWith("utg")?tr("ad_tg")+" "+id.slice(3):tr("ad_web")+" · "+tr("ad_id",{id}),on?tr("ad_now"):(p.d.last?agoText(+p.d.last):"—")];
  if(id===NET.myId) meta.push(tr("ad_me"));
  body.appendChild(mkEl("div","plmeta",meta.join(" · ")));
  if(ban) body.appendChild(mkEl("div","plmeta ban",tr("ad_bannedby",{r:ban.r||"—"})));
  if(!adEdit){ body.appendChild(mkEl("p","muted",tr("ad_loading"))); return; }
  if(adSave===false&&id!==NET.myId) body.appendChild(mkEl("p","adnote",tr("ad_nosave")));
  const E=adEdit, f=mkEl("div","plform");
  const field=(lab,el)=>{ f.appendChild(mkEl("label",null,tr(lab))); f.appendChild(el); };
  const numIn=(k,max)=>{ const i=mkEl("input"); i.type="number"; i.min="0"; i.max=String(max); i.inputMode="numeric"; i.value=String(E[k]); i.oninput=()=>{ E[k]=Math.max(0,Math.min(max,Math.floor(+i.value||0))); }; return i; };
  const ni=mkEl("input"); ni.maxLength=16; ni.value=E.nick; ni.spellcheck=false; ni.oninput=()=>{ E.nick=ni.value; }; field("ad_nick",ni);
  field("ad_coins",numIn("coin",9999999)); field("ad_cr",numIn("cr",9999999));
  const xi=numIn("xp",9999999); field("ad_xp",xi);
  const sel=mkEl("select"); for(const c of ["",...CLASSES]){ const o=mkEl("option",null,c?tr("cl_"+c):tr("ad_noclass")); o.value=c; if(E.cl===c) o.selected=true; sel.appendChild(o); }
  sel.onchange=()=>{ E.cl=sel.value; }; field("ad_class",sel);
  body.appendChild(f);
  body.appendChild(mkEl("b",null,tr("ad_inv")));
  const il=mkEl("div","plinv");
  for(const [k,v] of Object.entries(E.inv)){ if(!ITEMS.some(it=>it.id===k)) continue;
    const r=mkEl("div","r"); r.appendChild(mkEl("span",null,tr("fish_"+k))); const i=mkEl("input"); i.type="number"; i.min="0"; i.max="9999"; i.value=String(v);
    i.oninput=()=>{ E.inv[k]=Math.max(0,Math.min(9999,Math.floor(+i.value||0))); }; r.appendChild(i); il.appendChild(r); }
  const add=mkEl("select"); const o0=mkEl("option",null,tr("ad_add")); o0.value=""; add.appendChild(o0);
  for(const it of ITEMS) if(it.id!=="coin"&&!(it.id in E.inv)){ const o=mkEl("option",null,tr("fish_"+it.id)); o.value=it.id; add.appendChild(o); }
  add.onchange=()=>{ if(add.value){ E.inv[add.value]=1; renderWin(); } }; il.appendChild(add);
  body.appendChild(il);
  const bt=mkEl("div","plbtns");
  bt.appendChild(adBtn(tr("ad_apply"),()=>adApply(id),"big"));
  bt.appendChild(adBtn(tr("ad_rename"),()=>{ E.nick="Hero"+id.slice(-4); adApply(id); }));
  if(id!==NET.myId) bt.appendChild(adBtn(tr(ban?"ad_unban":"ad_ban"),()=>adBan(id,!ban),ban?"":"warn"));
  body.appendChild(bt);
  if(adMsg) body.appendChild(mkEl("div","adok",adMsg));
}
async function adApply(id){
  const E=adEdit; if(!E||!NET.db) return;
  const nick=cleanNick(E.nick); const inv2={};
  for(const [k,v] of Object.entries(E.inv)) if(v>0&&ITEMS.some(it=>it.id===k)) inv2[k]=Math.min(9999,v|0);
  if(E.coin>0) inv2.coin=E.coin|0;
  const set={inv:inv2,cr:E.cr|0,xp:E.xp|0,cl:E.cl||""}; if(nick.length>=2) set.nick=nick;
  if(id===NET.myId){ applyAdminOp({id:Date.now(),set},true); adMsg=tr("ad_saved"); renderWin(); return; }
  try{
    const ref=NET.db.doc(`data/users/${id}/save`); const s=await ref.get(); const sv=s.exists?(s.data()||{}):{};
    sv.inv=inv2; sv.cr=set.cr; sv.pg={...(sv.pg||{}),xp:set.xp}; if(set.cl) sv.cl=set.cl; else delete sv.cl;
    if(set.nick){ sv.nick=set.nick; sv.nf=set.nick; }
    await ref.set(sv);
    await NET.db.doc("admin_ops/"+id).set({id:Date.now(),set});
    const pd=adPlayers.find(x=>x.id===id); if(pd&&set.nick){ pd.d.n=set.nick; NET.db.doc("players/"+id).set({...pd.d,n:set.nick,lv:lvlInfo(set.xp).l,cl:set.cl}).catch(()=>{}); }
    adSave=sv; adMsg=tr("ad_saved");
  }catch(e){ adMsg="Error"; }
  if(adSel===id) renderWin();
}
function adBan(id,on){
  if(!NET.db||id===NET.myId) return;
  const list={...BANS};
  if(on){ const r=(window.prompt?prompt(tr("ad_ban_r"),""):"")||""; const pd=adPlayers.find(x=>x.id===id); list[id]={r:String(r).slice(0,120),t:Date.now(),n:pd?String(pd.d.n||"").slice(0,16):""}; }
  else delete list[id];
  BANS=list; NET.db.doc("world/bans").set({list}).catch(()=>{}); renderWin();
}
// изменения от админа: применяем у себя и удаляем заявку
function applyAdminOp(op,self){
  if(!op||typeof op!=="object"||!op.set||typeof op.set!=="object") return;
  const s=op.set;
  if(s.inv&&typeof s.inv==="object"){ for(const k of Object.keys(inv)) delete inv[k];
    for(const [k,v] of Object.entries(s.inv)) if(ITEMS.some(it=>it.id===k)&&typeof v==="number"&&v>0) inv[k]=Math.min(9999999,v|0); }
  if(typeof s.cr==="number") crystals=Math.max(0,s.cr|0);
  if(typeof s.xp==="number") prog.xp=Math.max(0,s.xp|0);
  if(typeof s.cl==="string"){ if(CLASSES.includes(s.cl)){ if(s.cl!==heroClass) setClass(s.cl); } else if(heroClass){ if(form) endForm(); heroClass=null; renderSkills(); } }
  if(typeof s.nick==="string"&&cleanNick(s.nick).length>=2){ forcedNick=cleanNick(s.nick); setNick(forcedNick,true); }
  recalcHP(); hero.hp=Math.min(hero.hp,HP_MAX); renderInv(); renderHP(); renderSkills(); if(winKind&&!winKind.startsWith("admin")) renderWin();
  lastPresJSON=""; lastPlayerJSON=""; lastPlayerWrite=0; saveNow();
  if(!self){ say("adm_changed"); NET.db.doc("admin_ops/"+NET.myId).delete().catch(()=>{}); }
}
function checkBan(){
  const b=NET.myId&&BANS[NET.myId]; if(!b||isAdmin||(window.__islandTG&&window.__islandTG.id==="1661222371")) return;
  if(document.getElementById("banWrap")) return;
  const w=mkEl("div","banwrap"); w.id="banWrap"; const d=mkEl("div");
  d.appendChild(mkEl("div",null,"\\u26D4 "+tr("ban_title"))); if(b.r) d.appendChild(mkEl("div",null,tr("ban_reason",{r:String(b.r).slice(0,120)})));
  w.appendChild(d); document.body.appendChild(w); window.__islandBanned=true;
  try{ if(NET.room) NET.room.presence({x:null,y:null}); }catch(e){}
}
function renderNickFilter(body){
  if(!isAdmin){ closeWin(); return; }
  adHead(body);
  body.appendChild(mkEl("p","adnote",tr("ad_nf_note")));
  const a=mkEl("textarea","adarea"); a.value=NICK_EXTRA.join(", "); body.appendChild(a);
  const bt=mkEl("div","plbtns");
  bt.appendChild(adBtn(tr("ad_nf_save"),()=>{ const w=a.value.split(/[,\\n]/).map(x=>x.trim().toLowerCase()).filter(Boolean).slice(0,300); NICK_EXTRA=w;
    NET.db&&NET.db.doc("world/nickfilter").set({w}).catch(()=>{}); adMsg=tr("ad_saved").split(".")[0]+"."; renderWin(); },"big"));
  body.appendChild(bt);
  if(adMsg) body.appendChild(mkEl("div","adok",adMsg));
}
// ---- режим редактора ----''')

# players collection also feeds the admin list
rep('''    db.collection("players").onSnapshot(snap=>applyPlayers(snap.docs),()=>{});''','''    db.collection("players").onSnapshot(snap=>{ applyPlayers(snap.docs); adCollect(snap.docs); },()=>{});''')

open(p,"w",encoding="utf-8").write(s)
print("ok")
