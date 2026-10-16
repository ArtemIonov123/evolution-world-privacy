import sys
p=sys.argv[1]; s=open(p,encoding="utf-8").read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a); assert n==cnt,(n,a[:100]); s=s.replace(a,b)

# ---------- registry declared early ----------
rep('''const ZONE=(()=>{''','''const CMOBS={};   // свои мобы из админки (world/mobs)
const ZONE=(()=>{''')

# ---------- CSS ----------
rep(".plform .wide{grid-column:1 / -1}",""".plform .wide{grid-column:1 / -1}
.mbprev{display:flex;align-items:center;gap:10px;margin:6px 0}.mbprev canvas{width:96px;height:96px;background:#3d6b3a;border:2px solid #000;image-rendering:pixelated;flex:none}
.mbbase{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin:4px 0 8px}.mbbase button{padding:2px;min-height:48px;display:flex;flex-direction:column;align-items:center;font-size:10px;font-family:var(--f-body);letter-spacing:0}
.mbbase button.on{background:var(--accent);color:var(--panel)}.mbbase img{width:34px;height:34px;object-fit:contain;image-rendering:pixelated}
.mbseg{display:flex;gap:4px;flex-wrap:wrap}.mbseg .btn{flex:1;font-family:var(--f-body);letter-spacing:0;font-size:12px;min-height:34px;padding:3px 6px}.mbseg .btn.on{background:var(--accent);color:var(--panel)}""")

# ---------- i18n ----------
rep('''    ad_items:"Przedmioty",''','''    ad_mobs:"Potwory", ad_mobs_d:"Własne potwory, ich siła i strefy", win_admin_mobs:"Potwory",
    mb_new:"+ Nowy potwór", mb_none:"Brak własnych potworów. Stwórz pierwszego!", mb_look:"Wygląd", mb_size:"Rozmiar %", mb_where:"Gdzie żyje", mb_island:"Wyspa", mb_cave:"Jaskinia",
    mb_ai:"Zachowanie", mb_ai_aggr:"Agresywny", mb_ai_night:"Agresywny nocą", mb_ai_passive:"Spokojny", mb_ai_aggr_d:"atakuje każdego, kto podejdzie", mb_ai_night_d:"w dzień spokojny, nocą atakuje", mb_ai_passive_d:"oddaje tylko, gdy go uderzysz",
    mb_hp:"HP", mb_dmg:"Obrażenia (ukąszenie)", mb_spd:"Szybkość", mb_spd_1:"Wolny", mb_spd_2:"Zwykły", mb_spd_3:"Szybki", mb_spd_4:"Bardzo szybki", mb_range:"Zasięg agresji (pola)", mb_xp:"XP za zabicie",
    mb_day:"W dzień (ile naraz)", mb_night:"Nocą (ile naraz)", mb_count:"Ile naraz", mb_loot:"Łup →", mb_zone:"Strefa na mapie →", mb_zone_other:"Strefę rysuje się w edytorze tej mapy (przejdź do: {z})",
    mb_note:"Bez strefy pojawia się w losowym miejscu. Łup ustawiasz w «Drop i potwory».", mb_saved:"Zapisano — potwory pojawią się u wszystkich",
    mb_b_wolf:"Wilk", mb_b_spider:"Pająk", mb_b_bear:"Niedźwiedź", mb_b_dwolf:"Duch", mb_b_golem:"Golem", mb_b_hare:"Zając", mb_in_editor:"HP, XP i czas pojawiania się — w sekcji «Potwory».",
    mob_killed:"{m} pokonany!",
    ad_items:"Przedmioty",''')
rep('''    ad_items:"Вещи",''','''    ad_mobs:"Мобы", ad_mobs_d:"Свои монстры, сила и зоны", win_admin_mobs:"Мобы",
    mb_new:"+ Новый моб", mb_none:"Своих мобов пока нет. Создай первого!", mb_look:"Вид", mb_size:"Размер %", mb_where:"Где живёт", mb_island:"Остров", mb_cave:"Пещера",
    mb_ai:"Поведение", mb_ai_aggr:"Агрессивный", mb_ai_night:"Злой ночью", mb_ai_passive:"Мирный", mb_ai_aggr_d:"нападает на всех, кто подойдёт", mb_ai_night_d:"днём мирный, ночью нападает", mb_ai_passive_d:"бьёт только в ответ",
    mb_hp:"HP", mb_dmg:"Урон за укус", mb_spd:"Скорость", mb_spd_1:"Медленный", mb_spd_2:"Обычный", mb_spd_3:"Быстрый", mb_spd_4:"Очень быстрый", mb_range:"Замечает (клеток)", mb_xp:"Опыт за убийство",
    mb_day:"Днём (сколько сразу)", mb_night:"Ночью (сколько сразу)", mb_count:"Сколько сразу", mb_loot:"Лут →", mb_zone:"Зона на карте →", mb_zone_other:"Зона рисуется в редакторе этой карты (перейди: {z})",
    mb_note:"Без зоны появляется в случайном месте. Лут настраивается в «Дроп и мобы».", mb_saved:"Сохранено — мобы появятся у всех",
    mb_b_wolf:"Волк", mb_b_spider:"Паук", mb_b_bear:"Медведь", mb_b_dwolf:"Дух", mb_b_golem:"Голем", mb_b_hare:"Заяц", mb_in_editor:"HP, опыт и время появления — в разделе «Мобы».",
    mob_killed:"{m} побеждён!",
    ad_items:"Вещи",''')

# ---------- rules ----------
rep('''const mobHp=k=>CFG.mobHp&&CFG.mobHp[k]!=null?CFG.mobHp[k]:(MOB_HP[k]??3);
const isMob=a=>a&&(a.kind==="wolf"||a.kind==="bat"||a.kind==="spider"||a.kind==="golem");''','''const mobHp=k=>CMOBS[k]?CMOBS[k].hp:CFG.mobHp&&CFG.mobHp[k]!=null?CFG.mobHp[k]:(MOB_HP[k]??3);
const isMob=a=>a&&(a.kind==="wolf"||a.kind==="bat"||a.kind==="spider"||a.kind==="golem"||!!CMOBS[a.kind]);''')
rep('''const mobT=(k,f)=>CFG.mobTime''','''const mobT=(k,f)=>CMOBS[k]?CMOBS[k][f]|0:CFG.mobTime''')
rep('''const xpOf=k=>CFG.xp[k]!=null?CFG.xp[k]:XP_DEF[k];''','''const xpOf=k=>CMOBS[k]?CMOBS[k].xp:CFG.xp[k]!=null?CFG.xp[k]:XP_DEF[k];''')
rep('''function mobLeave(a){ a.leaving=true;''','''function mobLeave(a){ a.leaving=true; if(CMOBS[a.kind]){ a.path=[]; return; }''')
rep('''function spawnMob(kind,per,farFromAll,existing){''','''function spawnMob(kind,per,farFromAll,existing){
  if(CMOBS[kind]){ const z=zonePick(kind,c=>freeCell(c)&&farFromAll(c,6)), c=z!==undefined?z:randomCell(c=>freeCell(c)&&(CAVE||GRASSY.includes(c.t))&&farFromAll(c,7));
    if(!c) return; spawnAnimal(kind,c); const m=animals[animals.length-1]; m.home={x:c.x,y:c.y}; m.attackT=1.2; return; }''')
# island loop: skip custom mobs of the other zone
rep('''    if(per) for(const kind of MOBS){
      const list=''','''    if(per) for(const kind of MOBS){
      if(CMOBS[kind]&&CMOBS[kind].zn!==ZONE) continue;
      const list=''')
# cave spawns
rep('''  const b=MAP.boss&&cellAt(MAP.boss[0],MAP.boss[1]);
  if(b&&!animals.some(a=>a.kind==="golem")''','''  for(const [k,m] of Object.entries(CMOBS)){ if(m.zn!=="cave"||live(k)>=m.cn||Math.random()>0.3) continue; spawnMob(k,"n",farFromAll,0); }
  const b=MAP.boss&&cellAt(MAP.boss[0],MAP.boss[1]);
  if(b&&!animals.some(a=>a.kind==="golem")''')
# AI
rep('''    if(a.kind==="spider"){ updateSpider(a,dt,tp,dh); moveAnimal(a,dt); continue; }''','''    if(a.kind==="spider"){ updateSpider(a,dt,tp,dh); moveAnimal(a,dt); continue; }
    if(CMOBS[a.kind]){ if(!a.leaving) updateCMob(a,dt,tp,dh,night); moveAnimal(a,dt); continue; }''')
rep('''function summonBats(a,n){''','''// свой моб: агрессивный / злой ночью / мирный (бьёт в ответ)
const MB_SPD=[0,1.6,2.3,3.0,3.6];
function updateCMob(a,dt,tp,dh,night){
  const m=CMOBS[a.kind], run=MB_SPD[m.spd]||2.3, angry=m.ai==="aggr"||(m.ai==="night"&&night);
  a.speed=run*0.45;
  if(a.aggro&&(!tp||dh>m.range+5)){ a.aggroT=(a.aggroT||0)+dt; if(a.aggroT>5){ a.aggro=false; a.aggroT=0; } } else a.aggroT=0;
  if(tp&&dh<12&&(a.aggro||(angry&&dh<m.range))){ a.state="chase"; a.speed=run*(tp.cl==="druid"&&m.b==="spider"?0.8:1);
    if(dh<0.95+(m.sz>140?0.4:0)){ a.path=[]; a.facing=facingTo(a,tp.x,tp.y); a.lungeTo=[tp.x,tp.y];
      if(!tp.busy){ a.attackT-=dt; if(a.attackT<=0){ a.attackT=1.4; a.lunge=0.25; biteTarget(tp,a,m.dmg); } } }
    else if(a.think<=0){ a.think=0.4; setPath(a,cellAt(Math.round(tp.x),Math.round(tp.y))); a.attackT=Math.min(a.attackT,0.6); } }
  else if(m.ai==="passive"&&tp&&dh<2&&a.state!=="shy"&&!a.aggro){ a.state="shy"; setPath(a,fleeCell(a,tp.x,tp.y,2,3.5)); a.speed=run*0.8; }
  else if(a.think<=0&&!a.path.length){ a.state="wander"; a.think=2.5+Math.random()*3; const h=a.home||{x:a.x,y:a.y}; setPath(a,fleeCell({x:h.x,y:h.y},h.x,h.y,0.5,3)); }
}
function summonBats(a,n){''')
# draw
rep('''  if(a.kind==="spider"||a.kind==="golem") return drawBeast(a);''','''  if(a.kind==="spider"||a.kind==="golem"||CMOBS[a.kind]) return drawBeast(a);''')
rep('''  let [fx,fy]=proj(a.x-MX,a.y-MY,a.z); const big=a.kind==="golem";''','''  let [fx,fy]=proj(a.x-MX,a.y-MY,a.z); const cm=CMOBS[a.kind], pre=cm?cm.b:a.kind, big=a.kind==="golem", sc=cm?cm.sz/100:1;''')
rep('''  ctx.fillStyle="rgba(20,10,40,.3)"; ctx.beginPath(); ctx.ellipse(fx,fy,big?20:10,big?7:4,0,0,Math.PI*2); ctx.fill();
  const nf=img[a.kind+"_se_2"]?4:img[a.kind+"_se_1"]?2:4, frame=a.moving?Math.floor(a.phase*(nf===2?0.5:1))%nf:0;
  let sp=img[`${a.kind}_${a.facing}_${frame}`], mirror=false;
  if(!sp&&a.facing[1]==="w"){ sp=img[`${a.kind}_${a.facing[0]}e_${frame}`]; mirror=true; }
  if(a.dying>0&&img[a.kind+"_dead"]){ sp=img[a.kind+"_dead"]; mirror=a.facing[1]==="w"; }''','''  const shw=(big||pre==="golem"?20:pre==="bear"?14:10)*sc; ctx.fillStyle="rgba(20,10,40,.3)"; ctx.beginPath(); ctx.ellipse(fx,fy,shw,shw*0.36,0,0,Math.PI*2); ctx.fill();
  const nf=img[pre+"_se_2"]?4:img[pre+"_se_1"]?2:4, frame=a.moving?Math.floor(a.phase*(nf===2?0.5:1))%nf:0;
  let sp=img[`${pre}_${a.facing}_${frame}`], mirror=false;
  if(!sp&&a.facing[1]==="w"){ sp=img[`${pre}_${a.facing[0]}e_${frame}`]; mirror=true; }
  if(a.dying>0&&img[pre+"_dead"]){ sp=img[pre+"_dead"]; mirror=a.facing[1]==="w"; }
  if(cm&&sp) sp=mobTint(a.kind,sp);''')
rep('''  ctx.save(); ctx.translate(Math.round(fx),Math.round(fy)+(a.dying>0&&!img[a.kind+"_dead"]?Math.round((3-a.dying)*3):0));''','''  ctx.save(); ctx.translate(Math.round(fx),Math.round(fy)+(a.dying>0&&!img[pre+"_dead"]?Math.round((3-a.dying)*3):0)); if(sc!==1) ctx.scale(sc,sc);''')
rep('''  if(!big) drawMobHP(a,fx,fy);
}''','''  if(!big) drawMobHP(a,fx,fy-(sc>1?Math.round((sc-1)*26):0));
}''')
# hitbox for big custom mobs
rep('''    const big=a.kind==="golem", dx=wx-a.drawn.x''','''    const big=a.kind==="golem"||(CMOBS[a.kind]&&(CMOBS[a.kind].b==="golem"||CMOBS[a.kind].sz>=140)), dx=wx-a.drawn.x''')
# loot message
rep('''  else if(kind==="golem"){ say("boss_killed","boss_killed_sub"); prog.st.bosses=(prog.st.bosses||0)+1; }''','''  else if(kind==="golem"){ say("boss_killed","boss_killed_sub"); prog.st.bosses=(prog.st.bosses||0)+1; }
  else if(CMOBS[kind]){ say("mob_killed","bat_killed_sub",{m:LANG==="ru"?CMOBS[kind].ru:CMOBS[kind].pl}); prog.st.mobs=(prog.st.mobs||0)+1; }''')
# network
rep('''k:KIND_CODE[a.kind]||"h",''','''k:KIND_CODE[a.kind]||(CMOBS[a.kind]?a.kind:"h"),''')
rep('''p.an=animals.filter(a=>!a.dead).slice(0,10)''','''p.an=animals.filter(a=>!a.dead).slice(0,16)''')
rep('''    const kind=CODE_KIND[e.k]||"hare";''','''    const kind=CODE_KIND[e.k]||(CMOBS[e.k]?e.k:null); if(!kind){ ids.delete(id); continue; }''')

# ---------- drop editor: custom mob cards ----------
rep('''  const when=m=>{ if(BOSSES.includes(m))''','''  const when=m=>{ if(CMOBS[m]){ const c=CMOBS[m]; return c.zn==="cave"?" · \\u26F0"+c.cn:(c.d&&c.dn?" · \\u2600"+c.dn:"")+(c.n&&c.nn?" · \\u263E"+c.nn:"")||" · \\u2014"; } if(BOSSES.includes(m))''')
rep('''key:"mob:"+m,img:SPRITES[m+"_se_0"]||''','''key:"mob:"+m,img:CMOBS[m]?mobPreview(m,40):SPRITES[m+"_se_0"]||''')
rep('''    p.appendChild(mkEl("b","sub",tr("ed_drop_reward")));
    row(tr("ed_xp_kill"),numInput(edCfg.xp,mob,XP_DEF[mob]??10));''','''    if(CMOBS[mob]){ p.appendChild(mkEl("p","muted",tr("mb_in_editor"))); return; }
    p.appendChild(mkEl("b","sub",tr("ed_drop_reward")));
    row(tr("ed_xp_kill"),numInput(edCfg.xp,mob,XP_DEF[mob]??10));''')

# ---------- map editor: zones for custom mobs ----------
rep('''    if(edTool==="zone_erase"){ delete edDraft.zones.hare[k]; delete edDraft.zones.wolf[k]; delete edDraft.zones.bat[k]; delete edDraft.zones.spider[k]; } else edDraft.zones[edTool.slice(5)][k]=1; return; }''',
'''    if(edTool==="zone_erase"){ for(const z of Object.values(edDraft.zones)) delete z[k]; } else (edDraft.zones[edTool.slice(5)]||(edDraft.zones[edTool.slice(5)]={}))[k]=1; return; }''')
rep('''  const zones={}; for(const z of ["hare","wolf","bat","spider"]){ zones[z]=''','''  const zones={}; for(const z of Object.keys(edDraft.zones)){ zones[z]=''')
rep('''    zones:{hare:zk("hare"),wolf:zk("wolf"),bat:zk("bat"),spider:zk("spider")}};''','''    zones:{hare:zk("hare"),wolf:zk("wolf"),bat:zk("bat"),spider:zk("spider")}};
  for(const k of Object.keys(CMOBS)) if(CMOBS[k].zn===ZONE) edDraft.zones[k]=zk(k);''')
rep('''  if(edDraft&&edDraft.zones) for(const [z,col] of [["hare","rgba(200,255,120,.75)"],["wolf","rgba(255,70,70,.75)"],["bat","rgba(170,110,255,.8)"],["spider","rgba(255,170,60,.8)"]]) for''','''  if(edDraft&&edDraft.zones) for(const [z,col] of zoneCols(0.75)) for''')
rep('''  for(const [z,col] of [["hare","rgba(190,255,110,.38)"],["wolf","rgba(255,80,80,.38)"],["bat","rgba(170,110,255,.42)"],["spider","rgba(255,170,60,.42)"]]) for''','''  for(const [z,col] of zoneCols(0.4)) for''')
rep('''function edDrawMarks(){''','''function zoneCols(al){ return [["hare",`rgba(200,255,120,${al})`],["wolf",`rgba(255,70,70,${al})`],["bat",`rgba(170,110,255,${al})`],["spider",`rgba(255,170,60,${al})`],
  ...Object.keys(CMOBS).map(k=>[k,`hsla(${(CMOBS[k].hue+200)%360},90%,60%,${al})`])]; }
function edDrawMarks(){''')
rep('''  for(const [gk,items,cat] of ED_GROUPS){ if(cat!==edCat) continue; const grp=mkEl("div","edgrp"); grp.appendChild(mkEl("b",null,tr(gk)));
    const row=mkEl("div","edrow");
    for(const [id,spr] of items){''','''  for(const [gk,items0,cat] of ED_GROUPS){ if(cat!==edCat) continue; const grp=mkEl("div","edgrp"); grp.appendChild(mkEl("b",null,tr(gk)));
    const row=mkEl("div","edrow");
    const items=gk==="ed_g_zones"?[...items0.slice(0,-1),...Object.keys(CMOBS).filter(k=>CMOBS[k].zn===ZONE).map(k=>["zone_"+k,"mob:"+k]),items0[items0.length-1]]:items0;
    for(const [id,spr] of items){
      if(spr&&spr.startsWith("mob:")){ const b=mkEl("button","edb"+(edTool===id?" on":"")); b.type="button"; const k=spr.slice(4), im=mkEl("img"); im.src=mobPreview(k,40); im.alt=""; b.appendChild(im);
        b.appendChild(mkEl("small",null,LANG==="ru"?CMOBS[k].ru:CMOBS[k].pl)); b.onclick=()=>{ edTool=id; edRender(); }; row.appendChild(b); continue; }''')

# ---------- registry / tint / preview / apply ----------
rep('''// ---- свои вещи из админки (world/items) ----''','''// ---- свои мобы из админки (world/mobs) ----
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
// ---- свои вещи из админки (world/items) ----''')

# load with items, before the save
rep('''    db.doc("world/items").onSnapshot(s=>applyItems(s.exists?s.data():null),()=>{});''','''    db.doc("world/items").onSnapshot(s=>applyItems(s.exists?s.data():null),()=>{});
    try{ const s=await db.doc("world/mobs").get(); applyMobs(s.exists?s.data():null); }catch(e){}
    db.doc("world/mobs").onSnapshot(s=>applyMobs(s.exists?s.data():null),()=>{});''')
# config may come before custom items: re-apply it after items
rep('''function applyConfig(d){''','''let lastCfgDoc=null;
function applyConfig(d){ lastCfgDoc=d;''')
rep('''  renderInv(); if(winKind) renderWin();
}
// ---- описание предмета ----''','''  renderInv(); if(winKind) renderWin();
  if(lastCfgDoc) applyConfig(lastCfgDoc);
}
// ---- описание предмета ----''')

# ---------- admin hub + section ----------
rep('''  card("\\u{1F5E1}\\uFE0F","ad_items","ad_items_d",()=>{ itSel=null; adMsg=""; winKind="admin_items"; renderWin(); });''','''  card("\\u{1F5E1}\\uFE0F","ad_items","ad_items_d",()=>{ itSel=null; adMsg=""; winKind="admin_items"; renderWin(); });
  card("\\u{1F43A}","ad_mobs","ad_mobs_d",()=>{ mbSel=null; adMsg=""; winKind="admin_mobs"; renderWin(); });''')
rep('''if(winKind==="admin_items") renderAdminItems(body); else''','''if(winKind==="admin_items") renderAdminItems(body); else if(winKind==="admin_mobs") renderAdminMobs(body); else''')
rep('''function renderNickFilter(body){''','''let mbSel=null, mbDraft=null, mbDelAsk=false;
const mbRid=()=>"m"+Math.random().toString(36).slice(2,9).replace(/[^a-z0-9]/g,"x");
const mbName=m=>LANG==="ru"?m.ru:m.pl;
function renderAdminMobs(body){
  if(!isAdmin){ closeWin(); return; }
  if(mbSel){ renderMobCard(body); return; }
  adHead(body);
  const nb=adBtn(tr("mb_new"),()=>{ mbSel=mbRid(); mbDelAsk=false; adMsg="";
    mbDraft={id:mbSel,ru:"",pl:"",b:"wolf",hue:0,sz:100,zn:CAVE?"cave":"island",ai:"night",hp:6,dmg:1,spd:2,range:5,xp:15,d:1,dn:2,n:1,nn:3,cn:3,isNew:true}; renderWin(); },"big");
  nb.style.width="100%"; nb.style.marginBottom="8px"; body.appendChild(nb);
  const ids=Object.keys(CMOBS);
  if(!ids.length){ body.appendChild(mkEl("p","muted",tr("mb_none"))); return; }
  const l=mkEl("div","pllist");
  for(const id of ids){ const m=CMOBS[id], b=mkEl("button","btn itrow"); b.type="button";
    const im=mkEl("img"); im.src=mobPreview(id,32); im.alt=""; b.appendChild(im);
    const nm=mkEl("span","nm"); nm.appendChild(mkEl("b",null,mbName(m)));
    const when=m.zn==="cave"?tr("mb_cave")+" \\u00D7"+m.cn:tr("mb_island")+(m.d&&m.dn?" \\u2600"+m.dn:"")+(m.n&&m.nn?" \\u263E"+m.nn:"");
    nm.appendChild(mkEl("small",null,tr("mb_ai_"+m.ai)+" \\u00B7 HP "+m.hp+" \\u00B7 "+tr("mb_dmg").split(" ")[0]+" "+m.dmg+" \\u00B7 "+when)); b.appendChild(nm);
    b.onclick=()=>{ mbSel=id; mbDelAsk=false; adMsg=""; mbDraft={...m}; renderWin(); }; l.appendChild(b); }
  body.appendChild(l);
}
function renderMobCard(body){
  const E=mbDraft; if(!E){ mbSel=null; return renderAdminMobs(body); }
  adHead(body,()=>{ mbSel=null; mbDraft=null; adMsg=""; renderWin(); });
  const pv=mkEl("div","mbprev"), pc=mkEl("canvas"); pc.width=pc.height=96; pv.appendChild(pc); const pt=mkEl("b",null,""); pv.appendChild(pt); body.appendChild(pv);
  const prev=()=>{ const g=pc.getContext("2d"); g.clearRect(0,0,96,96); g.imageSmoothingEnabled=false; const sp=img[E.b+"_se_0"];
    if(sp){ const t=document.createElement("canvas"); t.width=sp.width; t.height=sp.height; t.getContext("2d").drawImage(sp,0,0); hueShift(t,E.hue);
      const k=Math.min(2,80/Math.max(sp.width,sp.height)*1.25)*E.sz/100*0.8; g.drawImage(t,48-sp.width*k/2,90-sp.height*k,sp.width*k,sp.height*k); }
    pt.textContent=(LANG==="ru"?E.ru||E.pl:E.pl||E.ru)||"\\u2026"; };
  const f=mkEl("div","plform");
  const field=(lab,el)=>{ f.appendChild(mkEl("label",null,tr(lab))); f.appendChild(el); return el; };
  const txt=(k,max)=>{ const i=mkEl("input"); i.maxLength=max; i.value=E[k]; i.spellcheck=false; i.oninput=()=>{ E[k]=i.value; prev(); }; return i; };
  const num=(k,lo,hi)=>{ const i=mkEl("input"); i.type="number"; i.min=String(lo); i.max=String(hi); i.inputMode="numeric"; i.value=String(E[k]); i.oninput=()=>{ E[k]=Math.max(lo,Math.min(hi,Math.round(+i.value||0))); }; return i; };
  const seg=(k,opts,lab)=>{ const w=mkEl("div","mbseg"); for(const [v,t] of opts){ const b=adBtn(t,()=>{ E[k]=v; renderWin(); },E[k]===v?"on":""); w.appendChild(b); } return w; };
  field("it_name_ru",txt("ru",24)); field("it_name_pl",txt("pl",24));
  body.appendChild(f);
  body.appendChild(mkEl("b",null,tr("mb_look")));
  const bases=mkEl("div","mbbase");
  for(const bk of MB_BASES){ const b=mkEl("button","btn"+(E.b===bk?" on":"")); b.type="button"; const im=mkEl("img"); im.src=SPRITES[bk+"_se_0"]||""; im.alt=""; b.appendChild(im); b.appendChild(mkEl("span",null,tr("mb_b_"+bk)));
    b.onclick=()=>{ E.b=bk; renderWin(); }; bases.appendChild(b); }
  body.appendChild(bases);
  const f2=mkEl("div","plform");
  const rng=(k,lo,hi,lab)=>{ const r=mkEl("input"); r.type="range"; r.min=String(lo); r.max=String(hi); r.value=String(E[k]); r.oninput=()=>{ E[k]=+r.value; prev(); }; f2.appendChild(mkEl("label",null,tr(lab))); f2.appendChild(r); };
  rng("hue",0,359,"it_hue"); rng("sz",60,200,"mb_size");
  f2.appendChild(mkEl("label",null,tr("mb_where"))); f2.appendChild(seg("zn",[["island",tr("mb_island")],["cave",tr("mb_cave")]]));
  body.appendChild(f2);
  body.appendChild(mkEl("b",null,tr("mb_ai")));
  body.appendChild(seg("ai",MB_AI.map(a=>[a,tr("mb_ai_"+a)])));
  body.appendChild(mkEl("p","adnote",tr("mb_ai_"+E.ai+"_d")));
  const f3=mkEl("div","plform"); const fd=(lab,el)=>{ f3.appendChild(mkEl("label",null,tr(lab))); f3.appendChild(el); };
  fd("mb_hp",num("hp",1,999)); fd("mb_dmg",num("dmg",1,10));
  f3.appendChild(mkEl("label",null,tr("mb_spd"))); f3.appendChild(seg("spd",[1,2,3,4].map(v=>[v,tr("mb_spd_"+v)])));
  fd("mb_range",num("range",2,10)); fd("mb_xp",num("xp",0,5000));
  if(E.zn==="cave") fd("mb_count",num("cn",0,20));
  else { const dl=mkEl("label","chk"), dc=mkEl("input"); dc.type="checkbox"; dc.checked=!!E.d; dc.onchange=()=>{ E.d=dc.checked?1:0; }; dl.append(dc,document.createTextNode(tr("mb_day"))); f3.appendChild(dl); f3.appendChild(num("dn",0,20));
    const nl=mkEl("label","chk"), nc=mkEl("input"); nc.type="checkbox"; nc.checked=!!E.n; nc.onchange=()=>{ E.n=nc.checked?1:0; }; nl.append(nc,document.createTextNode(tr("mb_night"))); f3.appendChild(nl); f3.appendChild(num("nn",0,20)); }
  body.appendChild(f3);
  body.appendChild(mkEl("p","adnote",tr("mb_note")));
  prev();
  const bt=mkEl("div","plbtns");
  bt.appendChild(adBtn(tr("it_save"),mbSave,"big"));
  if(!E.isNew&&CMOBS[E.id]){
    bt.appendChild(adBtn(tr("mb_loot"),()=>{ closeWin(); edEnter("drop"); edDropSel="mob:"+E.id; edRender(); }));
    if(E.zn===ZONE) bt.appendChild(adBtn(tr("mb_zone"),()=>{ closeWin(); edEnter("map"); edCat="places"; edTool="zone_"+E.id; edRender(); }));
    else bt.appendChild(adBtn(tr("mb_zone"),()=>{ adMsg=tr("mb_zone_other",{z:"#"+(E.zn==="cave"?"ad_mapc":"ad_mapi")}); renderWin(); }));
    bt.appendChild(adBtn(tr(mbDelAsk?"it_del_ok":"it_del"),()=>{ if(!mbDelAsk){ mbDelAsk=true; renderWin(); return; } mbWrite(E.id,null); mbSel=null; mbDraft=null; renderWin(); },"warn")); }
  body.appendChild(bt);
  if(adMsg) body.appendChild(mkEl("div","adok",adMsg));
}
function mbWrite(id,val){
  const list={}; for(const [k,v] of Object.entries(mobsRaw)) list[k]=v;
  if(val) list[id]=val; else delete list[id];
  applyMobs({list}); if(NET.db) NET.db.doc("world/mobs").set({list}).catch(()=>{});
}
function mbSave(){
  const E=mbDraft, m=mbSanitize(E.id,E); if(!m){ adMsg=tr("it_noname"); renderWin(); return; }
  delete m.id; mbWrite(E.id,m); mbDraft={...CMOBS[E.id]}; adMsg=tr("mb_saved"); renderWin();
}
function renderNickFilter(body){''')

open(p,"w",encoding="utf-8").write(s); print("ok")
s=open(p,encoding="utf-8").read()
a='''const edLabel=id=>{ const t=tr("ed_t_"+id);'''
assert s.count(a)==1
s=s.replace(a,'''const edLabel=id=>{ if(/^zone_m/.test(id)&&CMOBS[id.slice(5)]) return LANG==="ru"?CMOBS[id.slice(5)].ru:CMOBS[id.slice(5)].pl; const t=tr("ed_t_"+id);''')
open(p,"w",encoding="utf-8").write(s); print("ok2")
