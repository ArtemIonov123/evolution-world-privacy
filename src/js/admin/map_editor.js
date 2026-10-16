// ================= Редактор карты (только для админа) =================
// Карта хранится в базе (world/map) и в кэше браузера; игроки получают её сразу после сохранения.
let EDIT=false, isAdmin=false, edTool="g", edBrush=1, edDir="left", edDraft=null, edSaving=false, edPaint=true;
let edAdd={t:0,b:0,l:0,r:0}, edStroke=null, edGenPending=null;
const edUndo=[], netTreeIds=new Set();
const ED_MIN=10, ED_MAX=40;
const edW=()=>W+edAdd.l+edAdd.r, edD=()=>D+edAdd.t+edAdd.b;
const ED_GROUPS=[
  ["ed_g_terrain",[["g","block_grass"],["G","block_grass_2"],["d","block_grass_dark"],["f","block_grass_flowers"],["u","block_grass_autumn"],["o","block_moss"],
    ["e","block_dirt"],["m","block_mud"],["n","block_sand"],["N","block_sand_wet"],["r","block_gravel"],["s","block_stone_path"],["c","block_cobble_dark"],["p","block_planks"],["z","block_snow"]],"land"],
  ["ed_g_cave",[["k","block_cave_floor"],["K","block_cave_floor_2"],["j","block_cave_mud"],["q","block_cave_crystal"],["l","block_cave_lava"],["x","block_cave_wall"]],"land"],
  ["ed_g_height",[["up",null],["down",null],["stairs","stairs_left"],["stairs_del",null]],"land"],
  ["ed_g_water",[["w","water_deep_0"],["v","water_shallow_0"],["prop_lily_pad","prop_lily_pad"],["prop_reeds","prop_reeds"],["prop_rock_water","prop_rock_water"],["erase",null]],"water"],
  ["ed_g_objects",[["tree_big","tree_big"],["tree_small","tree_small"],["bush","bush"],["rock_big","rock_big"],["rock_small","rock_small"],["grass_tuft","grass_tuft"],["fence","fence_left"],["prop_crystal",null],["prop_car",null],["prop_tires",null],["prop_barrier",null],["prop_bones",null],["erase",null]],"decor"],
  ...(CAVE?[["ed_g_places",[["start",null],["exit",null],["boss",null]],"places"],
    ["ed_g_zones",[["zone_spider",null],["zone_bat","bat_se_0"],["zone_erase",null]],"places"]]
  :[["ed_g_places",[["start",null],["cave",null],["hut",null],["npc","npc_se_0"],["merchant","merchant_se_0"],["stall","stall_left"],["pier","pier_left"]],"places"],
    ["ed_g_zones",[["zone_hare","hare_se_0"],["zone_wolf","wolf_se_0"],["zone_bat","bat_se_0"],["zone_spider",null],["zone_erase",null]],"places"]]),
];
// новые картинки prop_*.png от GPT сами попадают в «Декор» (водные — в «Воду»)
if(typeof SPRITES!=="undefined"){ const dec=ED_GROUPS.find(g=>g[0]==="ed_g_objects")[1];
  for(const k of Object.keys(SPRITES).sort()) if(k.startsWith("prop_")&&!isWaterProp(k)&&!dec.some(e=>e[0]===k)) dec.splice(dec.length-1,0,[k,k]); }
const ED_CATS=["land","water","decor","places"]; let edCat="land";
const edLabel=id=>{ if(id==="link_del") return tr("ed_t_link_del"); if(id==="link_new") return tr("ed_t_link_new"); if(/^bpos_/.test(id)&&CMOBS[id.slice(5)]) return "\u2620 "+(LANG==="ru"?CMOBS[id.slice(5)].ru:CMOBS[id.slice(5)].pl); if(/^zone_m/.test(id)&&CMOBS[id.slice(5)]) return LANG==="ru"?CMOBS[id.slice(5)].ru:CMOBS[id.slice(5)].pl; const t=tr("ed_t_"+id); return t==="ed_t_"+id?id.replace(/^prop_/,"").replace(/_/g," "):t; };
let edCellCtx=null;   // клетка, к которой сейчас применяется инструмент
const PLACE_TOOLS=["start","hut","npc","merchant","stall","pier","cave","exit","boss"];
const snapCell=c=>c?{L:c.L,t:c.t,st:c.st||null,props:[...c.props]}:null;
const isSpecial=c=>c&&(c.link||c.hutPart||c.npcHere||c.merchHere||c.stall||c.pier||c.fire||c.portal);
function setCellState(x,y,s){
  let c=cellAt(x,y);
  if(!s){ if(c&&!isSpecial(c)){ const i=cells.indexOf(c); if(i>=0) cells.splice(i,1); grid[y][x]=null; } return; }
  if(!c){ c={x,y,L:s.L,t:s.t,st:null,props:[],blocked:false,leaves:[],grow:1}; cells.push(c); grid[y][x]=c; }
  c.L=s.L; c.t=s.t; c.st=s.st||null; c.props=[...s.props]; c.water=c.t==="w"; c.shallow=c.t==="v"; c.falling=null; c.grow=1; c.stump=null;
  if(wet(c)){ c.props=c.props.filter(isWaterProp); c.st=null; } else c.props=c.props.filter(n=>!isWaterProp(n));
  refreshBlocked(c);
}
function rebuildTrees(){ TREES.length=0; for(const c of cells) for(const n of c.props) if(n.startsWith("tree")) TREES.push({c,big:n==="tree_big"}); dirty=true; }
// клетка под пальцем, даже если там пусто (для «выше» на пустом месте)
function pickGrid(mx,my){
  const wx=(mx-panX)/scale, wy=(my-panY)/scale, a=wx/HW, b=wy/HH, u=(a+b)/2, v=(b-a)/2;
  const X=u*ca+v*sa, Y=-u*sa+v*ca, x=Math.round(X+MX), y=Math.round(Y+MY);
  return x>=0&&y>=0&&x<W&&y<D?{x,y}:null;
}
const gridUnder=(mx,my)=>{ const c=pick(mx,my); return c?{x:c.x,y:c.y}:pickGrid(mx,my); };
// новое состояние клетки для текущего инструмента (null — клетку убрать, undefined — без изменений)
function edNewState(t,before){
  let s=before?{...before,props:[...before.props]}:null;
  if(t.length===1&&(LAND_TILES+"wv").includes(t)){ if(!s) return undefined; s.t=t; if(t==="w"||t==="v"){ s.props=s.props.filter(isWaterProp); s.st=null; } else s.props=s.props.filter(n=>!isWaterProp(n)); return s; }
  if(t==="up") return s?{...s,L:Math.min(9,s.L+1)}:{L:1,t:"g",st:null,props:[]};
  if(t==="down"){ if(!s) return undefined; return s.L>1?{...s,L:s.L-1}:null; }
  if(t==="stairs"){ if(!s||s.t==="w"||s.t==="v") return undefined;
    if(s.st){ s.st=STAIR_ORDER[(STAIR_ORDER.indexOf(s.st)+1)%4]; return s; }   // тап по лестнице — повернуть
    const up=STAIR_ORDER.find(d=>{ const n=edCellCtx&&cellAt(edCellCtx[0]+STAIR_DIR[d][0],edCellCtx[1]+STAIR_DIR[d][1]); return n&&!wet(n)&&n.L===s.L+1; });
    s.st=up||"L"; return s; }
  if(t==="stairs_del"){ if(!s||!s.st) return undefined; s.st=null; return s; }
  if(t==="erase"){ if(!s) return undefined; s.props=[]; return s; }
  if(!s) return undefined; const wt=s.t==="w"||s.t==="v";
  if(isWaterProp(t)){ if(!wt) return undefined; s.props=[t]; return s; }
  if(wt) return undefined; s.props=[t==="fence"?"fence_"+edDir:t]; return s;
}
function edApplyCell(x,y,stroke){
  const k=x+","+y; if(stroke.seen.has(k)) return; stroke.seen.add(k);
  if(x<0||y<0||x>=W||y>=D) return;
  if(edTool.startsWith("zone_")){ const c=cellAt(x,y); if(!c||c.water) return;
    if(edTool==="zone_erase"){ for(const z of Object.values(edDraft.zones)) delete z[k]; } else (edDraft.zones[edTool.slice(5)]||(edDraft.zones[edTool.slice(5)]={}))[k]=1; return; }
  const c=cellAt(x,y); if(isSpecial(c)) return;
  edCellCtx=[x,y]; const before=snapCell(c), s=edNewState(edTool,before); edCellCtx=null;
  if(s===undefined||JSON.stringify(before)===JSON.stringify(s)) return;
  stroke.changes.push([x,y,before]); setCellState(x,y,s);
}
function edApplyAt(mx,my,stroke){
  const g=gridUnder(mx,my); if(!g) return;
  // забор, проведённый пальцем, сам ложится вдоль линии
  if(edTool==="fence"&&edBrush===1){ const pv=stroke.fprev;
    if(pv&&(pv[0]!==g.x||pv[1]!==g.y)){ const d=pv[0]!==g.x?"right":"left";
      if(d!==edDir){ edDir=d; edRender(); }
      const c=cellAt(pv[0],pv[1]); if(c&&stroke.changes.some(ch=>ch[0]===pv[0]&&ch[1]===pv[1])){ const f=c.props.find(n=>n.startsWith("fence_"));
        if(f&&f!=="fence_"+d) setCellState(pv[0],pv[1],{...snapCell(c),props:["fence_"+d]}); } }
    stroke.fprev=[g.x,g.y]; }
  if(edBrush==="fill"&&edTool.length===1&&(LAND_TILES+"wv").includes(edTool)) return edFill(g.x,g.y,stroke);
  const r=edTool==="stairs"?0:edBrush===5?2:edBrush===3?1:0;
  for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++) edApplyCell(g.x+dx,g.y+dy,stroke);
}
// заливка: вся связанная область того же вида земли и той же высоты
function edFill(x,y,stroke){
  const c0=cellAt(x,y); if(!c0||isSpecial(c0)) return;
  const fam=t=>"gGd".includes(t)?"grass":t, f0=fam(c0.t), L0=c0.L, q=[c0], seen=new Set([c0]);   // все виды травы — одна область
  while(q.length&&seen.size<2500){ const c=q.shift();
    for(const [dx,dy] of DIRS4){ const n=cellAt(c.x+dx,c.y+dy); if(n&&!seen.has(n)&&fam(n.t)===f0&&n.L===L0&&!isSpecial(n)){ seen.add(n); q.push(n); } } }
  for(const c of seen) edApplyCell(c.x,c.y,stroke);
}
function edCommit(stroke,draftBefore){
  if(!stroke.changes.length&&draftBefore===JSON.stringify(edDraft)) return;
  edUndo.push({changes:stroke.changes,draft:draftBefore}); if(edUndo.length>200) edUndo.shift();
  rebuildTrees(); edRender(); edMini();
}
function edTap(mx,my){
  const g=gridUnder(mx,my); if(!g) return;
  const draftBefore=JSON.stringify(edDraft);
  if(edTool.startsWith("parr_")){ if(!ptPickAt(edTool.slice(5),cellAt(g.x,g.y))) say("ed_bad_place"); dirty=true; return; }
  if(edTool==="link_new"||edTool==="link_del"){ const c=cellAt(g.x,g.y);
    if(edTool==="link_new"&&c&&c.link){ ptOpen(c.link); return; }      // тап по порталу — его настройки
    const r=edTool==="link_del"?lkDelAt(c):lkAddAt(c,""); if(!r) say("ed_bad_place"); else if(edTool==="link_new") ptOpen(r); dirty=true; return; }
  if(edTool.startsWith("bpos_")){ if(!bsPlaceAt(edTool.slice(5),cellAt(g.x,g.y))) say("ed_bad_place"); dirty=true; return; }
  if(PLACE_TOOLS.includes(edTool)){ if(!edPlace(edTool,g.x,g.y)){ say("ed_bad_place"); return; }
    edCommit({changes:[]},draftBefore); dirty=true; say("ed_placed","ed_placed_sub"); return; }
  // тап забором по забору — повернуть его на 90°
  if(edTool==="fence"){ const c=cellAt(g.x,g.y), f=c&&c.props.find(n=>n.startsWith("fence_"));
    if(f&&!isSpecial(c)){ const before=snapCell(c), st={...before,props:before.props.map(n=>n===f?(f==="fence_left"?"fence_right":"fence_left"):n)};
      setCellState(g.x,g.y,st); edCommit({changes:[[g.x,g.y,before]]},draftBefore); dirty=true; return; } }
  const stroke={changes:[],seen:new Set()}; edApplyAt(mx,my,stroke); edCommit(stroke,draftBefore);
}
// рисование проведением пальца
function edStrokeStart(mx,my){ if(PLACE_TOOLS.includes(edTool)||edTool.startsWith("link_")||edTool.startsWith("parr_")||edTool.startsWith("bpos_")||edTool==="stairs"||edBrush==="fill") return false;
  edStroke={changes:[],seen:new Set(),draft:JSON.stringify(edDraft),last:[mx,my]}; edApplyAt(mx,my,edStroke); return true; }
function edStrokeMove(mx,my){
  if(!edStroke) return; const [lx,ly]=edStroke.last, n=Math.max(1,Math.ceil(Math.hypot(mx-lx,my-ly)/6));
  for(let i=1;i<=n;i++) edApplyAt(lx+(mx-lx)*i/n,ly+(my-ly)*i/n,edStroke);
  edStroke.last=[mx,my]; rebuildTrees();
}
function edStrokeEnd(){ if(!edStroke) return; const s=edStroke; edStroke=null; edCommit(s,s.draft); }
function edPlace(t,x,y){
  const c=cellAt(x,y), land=c&&!c.water;
  if(t==="hut"){ const cs=[[0,0],[1,0],[0,1],[1,1]].map(([a,b])=>cellAt(x+a,y+b));
    if(cs.some(k=>!k||k.water||k.L!==cs[0].L)) return false; edDraft.hut=[x,y]; return true; }
  if(t==="pier"){ if(!c||!c.water) return false; edDraft.pier=[x,y,"pier_"+edDir]; return true; }
  if(!land) return false;
  if(t==="cave"||t==="exit"){ if(c.st||c.hutPart||c.npcHere||c.merchHere||c.stall||wet(c)) return false; edDraft[t]=[x,y]; return true; }
  if(t==="boss"){ edDraft.boss=[x,y]; return true; }
  if(t==="start") edDraft.start=[x,y]; else if(t==="npc") edDraft.npc=[x,y]; else if(t==="merchant") edDraft.merchant=[x,y];
  else if(t==="stall") edDraft.stall=[x,y,"stall_"+edDir];
  return true;
}
function edUndoLast(){
  const u=edUndo.pop(); if(!u) return;
  for(let i=u.changes.length-1;i>=0;i--){ const [x,y,s]=u.changes[i]; setCellState(x,y,s); }
  edDraft=JSON.parse(u.draft); rebuildTrees(); edRender(); edMini();
}
// ---- зоны зверей, тексты NPC и цены лавки ----
const NPC_KEYS=["npc_name","npc_hello","npc_hello_active","npc_hello_done","npc_who","npc_quest","npc_accepted","npc_reward","npc_wolfq","npc_wolf_acc","npc_reward2","npc_craft"];
const MERCH_KEYS=["merch_name","shop_hello","shop_bought","shop_sold","shop_no_money","shop_nothing"];
const TEXT_KEYS=[...NPC_KEYS,...MERCH_KEYS];
const SELL_EDIT=["karas","okun","shchuka","gold","boot","cooked","pelt","fang","meat_raw","meat_cooked","wood","potion","potion_big","club","sword_wood","sword_iron","cap_leather","helm_iron","armor_leather","boots_leather","amulet_fang","rod_wood","rod_bamboo","rod_steel","bat_wing"];
let edTab="map", edCfg=null, cfgDirty=false, edTxtLang=null, edTxtWho="npc";
let lastCfgDoc=null;
function applyConfig(d){ lastCfgDoc=d;
  const t=d&&d.texts&&typeof d.texts==="object"?d.texts:{};
  for(const L of ["pl","ru"]){ CFG.texts[L]={}; const src=t[L]&&typeof t[L]==="object"?t[L]:{};
    for(const k of TEXT_KEYS) if(typeof src[k]==="string"&&src[k].trim()) CFG.texts[L][k]=src[k].slice(0,400); }
  for(const f of ["buy","sell"]){ CFG[f]={}; const src=d&&d[f]&&typeof d[f]==="object"?d[f]:{};
    for(const [k,v] of Object.entries(src)) if(typeof v==="number"&&isFinite(v)&&v>=0) CFG[f][k]=Math.min(9999,Math.round(v)); }
  CFG.off={}; const off=d&&d.off&&typeof d.off==="object"?d.off:{}; for(const [k,v] of Object.entries(off)) if(v===true) CFG.off[k]=true;
  const ids=new Set(ITEMS.map(i=>i.id)), nmap=(src,hi)=>{ const o={}; if(src&&typeof src==="object") for(const [k,v] of Object.entries(src)) if(typeof v==="number"&&isFinite(v)&&v>=0) o[k]=Math.min(hi,Math.round(v)); return o; };
  CFG.mobTime={}; if(d&&d.mobTime&&typeof d.mobTime==='object') for(const k of MOBS){ const o=d.mobTime[k]; if(o&&typeof o==='object') CFG.mobTime[k]={d:o.d?1:0,n:o.n?1:0,dn:Math.max(0,Math.min(20,o.dn|0)),nn:Math.max(0,Math.min(20,o.nn|0))}; }
  CFG.mobHp=nmap(d&&d.mobHp,999); CFG.rods={}; if(d&&d.rods&&typeof d.rods==='object') for(const id of RODS){ const o=nmap(d.rods[id],1000); if(o.dur===0) delete o.dur; if(Object.keys(o).length) CFG.rods[id]=o; }
  CFG.mobDmg=nmap(d&&d.mobDmg,10); CFG.mobSpd=nmap(d&&d.mobSpd,4);
  CFG.xp=nmap(d&&d.xp,5000); CFG.xpFish=nmap(d&&d.xpFish,5000); CFG.fishW=nmap(d&&d.fishW,1000); CFG.logs=nmap(d&&d.logs,20); CFG.fisher=nmap(d&&d.fisher,9999);
  CFG.drops={}; const dr=d&&d.drops&&typeof d.drops==="object"?d.drops:{};
  for(const [m,list] of Object.entries(dr)) if(Array.isArray(list)) CFG.drops[m]=list.filter(r=>r&&ids.has(r.id)).slice(0,12).map(r=>{
    const a=Math.max(0,Math.min(99,Math.round(+r.a||0))), b=Math.max(a,Math.min(99,Math.round(+r.b||0)));
    return {id:r.id,ch:Math.max(0,Math.min(100,Math.round(+r.ch||0))),a,b}; });
  if(winKind) renderWin(); if(dialogOpen) renderDialog(); if(EDIT&&edTab!=="map"&&!cfgDirty) edRender();
}
let shopNpc="merchant";
const shopList=()=>(shopNpc==="npc"?CUSTOM_SHOP.filter(s=>s.by==="npc"):SHOP.concat(CUSTOM_SHOP.filter(s=>s.by!=="npc"))).filter(s=>OVR[s.id]||!CFG.off[s.id]).map(s=>({...s,p:!OVR[s.id]&&CFG.buy[s.id]!=null?CFG.buy[s.id]:s.p}));
function zonePick(kind,filter){
  const z=MAP.zones&&MAP.zones[kind]; if(!Array.isArray(z)||!z.length) return undefined;   // зон нет — по всему острову
  for(let i=0;i<30;i++){ const p=z[(Math.random()*z.length)|0], c=Array.isArray(p)&&cellAt(p[0],p[1]); if(c&&filter(c)) return c; }
  return null;
}
function edCfgFrom(){ return {texts:{pl:{...CFG.texts.pl},ru:{...CFG.texts.ru}},buy:{...CFG.buy},sell:{...CFG.sell},off:{...CFG.off},
  drops:JSON.parse(JSON.stringify(CFG.drops)),mobTime:JSON.parse(JSON.stringify(CFG.mobTime)),mobHp:{...CFG.mobHp},rods:JSON.parse(JSON.stringify(CFG.rods)),xp:{...CFG.xp},xpFish:{...CFG.xpFish},fishW:{...CFG.fishW},logs:{...CFG.logs},fisher:{...CFG.fisher},mobDmg:{...CFG.mobDmg},mobSpd:{...CFG.mobSpd}}; }
async function saveConfig(){
  if(!NET.db||!edCfg) return; const d=JSON.parse(JSON.stringify(edCfg));
  await NET.db.doc("world/config").set(d).catch(()=>{});
  cfgDirty=false; applyConfig(d); say("ed_cfg_saved","ed_cfg_saved_sub"); edRender();
}
function renderTextsTab(p){
  const L=edTxtLang||LANG, keys=edTxtWho==="npc"?NPC_KEYS:MERCH_KEYS;
  const row=mkEl("div","edtabs");
  for(const l of ["pl","ru"]){ const b=mkEl("button","btn"+(L===l?" on":""),l.toUpperCase()); b.type="button"; b.onclick=()=>{ edTxtLang=l; edRender(); }; row.appendChild(b); }
  for(const w of ["npc","merch"]){ const b=mkEl("button","btn"+(edTxtWho===w?" on":""),tr(w==="npc"?"ed_txt_npc":"ed_txt_merch")); b.type="button"; b.onclick=()=>{ edTxtWho=w; edRender(); }; row.appendChild(b); }
  p.appendChild(row); p.appendChild(mkEl("p","muted",tr("ed_txt_hint")));
  for(const k of keys){
    const box=mkEl("div","edtxt"), head=mkEl("div","edtxth"); head.appendChild(mkEl("b",null,tr("edk_"+k)));
    const def=I18N[L][k]??I18N.pl[k]??"", cur=edCfg.texts[L][k];
    const ta=mkEl("textarea"); ta.value=cur!=null?cur:def; ta.maxLength=400; ta.rows=k.endsWith("name")?1:3; ta.spellcheck=false;
    const rs=mkEl("button","btn mini",tr("ed_txt_reset")); rs.type="button"; rs.disabled=cur==null;
    ta.oninput=()=>{ const v=ta.value; if(!v.trim()||v===def) delete edCfg.texts[L][k]; else edCfg.texts[L][k]=v; cfgDirty=true; rs.disabled=edCfg.texts[L][k]==null; };
    rs.onclick=()=>{ delete edCfg.texts[L][k]; ta.value=def; cfgDirty=true; rs.disabled=true; };
    head.appendChild(rs); box.appendChild(head); box.appendChild(ta); p.appendChild(box);
  }
}
let edDropSel=null;
// карточки «источников» дропа; новые мобы и боссы добавляются в MOBS и появятся здесь сами
function dropCards(){
  const n=k=>dropTable(k).length;
  const when=m=>{ if(CMOBS[m]){ const c=CMOBS[m]; return c.zn==="cave"?" · \u26F0"+c.cn:(c.d&&c.dn?" · \u2600"+c.dn:"")+(c.n&&c.nn?" · \u263E"+c.nn:"")||" · \u2014"; } if(BOSSES.includes(m)) return " · "+tr("ed_boss_rsp_short",{n:edCfg.mobHp[m+"_rsp"]??5}); const t=edCfg.mobTime[m]||MOB_TIME[m]||{}; return (t.d&&t.dn?" · ☀"+t.dn:"")+(t.n&&t.nn?" · ☾"+t.nn:"")||" · —"; };
  return [...[...MOBS,...BOSSES].map(m=>({key:"mob:"+m,img:CMOBS[m]?mobPreview(m,40):SPRITES[m+"_se_0"]||iconURL({bat:"bat_wing",spider:"spider_silk",golem:"golem_core"}[m]||"pelt"),label:tr("ed_src_"+m),sub:tr("ed_src_mob_sub",{n:(edCfg.drops[m]||DROP_DEF[m]||[]).length,xp:edCfg.xp[m]??XP_DEF[m]??0})+when(m)})),
    {key:"trees",img:SPRITES.tree_small,label:tr("ed_drop_trees"),sub:tr("ed_src_trees_sub",{a:edCfg.logs.tree_big??LOGS.tree_big,b:edCfg.logs.tree_small??LOGS.tree_small})},
    {key:"fish",img:iconURL("karas"),label:tr("ed_drop_fish"),sub:tr("ed_src_fish_sub",{n:FISH.length})},
    {key:"quests",img:SPRITES.ui_quests||iconURL("coin"),label:tr("ed_drop_quests"),sub:tr("ed_src_quest_sub",{xp:edCfg.xp.quest??XP_DEF.quest})},
    {key:"rods",img:iconURL("rod_bamboo"),label:tr("ed_src_rods"),sub:tr("ed_src_rods_sub")},
    {key:"fisher",img:SPRITES.npc_se_0,label:tr("ed_src_fisher"),sub:tr("ed_src_fisher_sub")}];
}
function renderDropTab(p){
  const row=(label,...els)=>{ const r=mkEl("div","edshop"); if(typeof label==="string") r.appendChild(mkEl("span",null,label)); else r.appendChild(label); for(const e of els) r.appendChild(e); p.appendChild(r); return r; };
  const itemLabel=id=>{ const w=mkEl("span","edil"); const im=mkEl("img"); im.src=iconURL(id); im.alt=""; w.appendChild(im); w.appendChild(document.createTextNode(tr("fish_"+id))); return w; };
  if(!edDropSel){
    p.appendChild(mkEl("p","muted",tr("ed_drop_pick")));
    const grid=mkEl("div","edcards");
    for(const c of dropCards()){ const b=mkEl("button","edcard"); b.type="button";
      const im=mkEl("img"); if(c.img) im.src=c.img; im.alt=""; b.appendChild(im);
      b.appendChild(mkEl("b",null,c.label)); b.appendChild(mkEl("small",null,c.sub));
      b.onclick=()=>{ edDropSel=c.key; edRender(); }; grid.appendChild(b); }
    p.appendChild(grid); return;
  }
  const card=dropCards().find(c=>c.key===edDropSel); if(!card){ edDropSel=null; return renderDropTab(p); }
  const head=mkEl("div","edchead"), back=mkEl("button","btn mini",tr("ed_back")); back.type="button"; back.onclick=()=>{ edDropSel=null; edRender(); };
  const im=mkEl("img"); if(card.img) im.src=card.img; im.alt=""; head.append(back,im,mkEl("b",null,card.label)); p.appendChild(head);
  if(edDropSel.startsWith("mob:")){
    const mob=edDropSel.slice(4);
    if(!edCfg.drops[mob]) edCfg.drops[mob]=JSON.parse(JSON.stringify(DROP_DEF[mob]||[]));
    const list=edCfg.drops[mob];
    p.appendChild(mkEl("b","sub",tr("ed_drop_loot")));
    const hdr=mkEl("div","eddrh"); for(const k of ["ed_drop_item","ed_drop_ch","ed_drop_min","ed_drop_max",""]) hdr.appendChild(mkEl("small",null,k?tr(k):"")); p.appendChild(hdr);
    list.forEach((r,i)=>{
      const sel=mkEl("select","edsel"); for(const it of ITEMS){ const o=mkEl("option",null,tr("fish_"+it.id)); o.value=it.id; o.selected=it.id===r.id; sel.appendChild(o); }
      sel.onchange=()=>{ r.id=sel.value; cfgDirty=true; edRender(); };
      const icon=mkEl("img","edicon"); icon.src=iconURL(r.id); icon.alt="";
      const wrap=mkEl("span","edil"); wrap.appendChild(icon); wrap.appendChild(sel);
      const del=mkEl("button","btn mini","✕"); del.type="button"; del.onclick=()=>{ list.splice(i,1); cfgDirty=true; edRender(); };
      row(wrap,valInput(r,"ch",0,100),valInput(r,"a",0,99),valInput(r,"b",0,99),del).classList.add("eddr");
    });
    const add=mkEl("button","btn mini",tr("ed_drop_add")); add.type="button"; add.onclick=()=>{ list.push({id:"coin",ch:100,a:1,b:3}); cfgDirty=true; edRender(); }; p.appendChild(add);
    if(CMOBS[mob]){ p.appendChild(mkEl("p","muted",tr("mb_in_editor"))); return; }
    p.appendChild(mkEl("b","sub",tr("ed_drop_reward")));
    row(tr("ed_xp_kill"),numInput(edCfg.xp,mob,XP_DEF[mob]??10));
    row(tr("ed_mob_hp"),numInput(edCfg.mobHp,mob,MOB_HP[mob]??3));
    if(BOSSES.includes(mob)){ row(tr("ed_boss_rsp"),numInput(edCfg.mobHp,mob+"_rsp",5)); p.appendChild(mkEl("p","muted",tr("ed_boss_note"))); }
    else { p.appendChild(mkEl("b","sub",tr("ed_mob_when")));
    const mt=edCfg.mobTime[mob]||(edCfg.mobTime[mob]={...MOB_TIME[mob]});
    for(const [per,lab] of [["d","ed_mob_day"],["n","ed_mob_night"]]){
      const l=mkEl("label","edchk big"), cb=mkEl("input"); cb.type="checkbox"; cb.checked=!!mt[per];
      cb.onchange=()=>{ mt[per]=cb.checked?1:0; cfgDirty=true; }; l.append(cb,document.createTextNode(tr(lab)));
      const cnt=valInput(mt,per+"n",0,20); row(l,mkEl("small","muted",tr("ed_mob_count")),cnt); }
    p.appendChild(mkEl("p","muted",tr(mob==="spider"?"ed_spider_note":"ed_mob_day_note"))); }
  } else if(edDropSel==="trees"){
    row(tr("ed_logs_big"),numInput(edCfg.logs,"tree_big",LOGS.tree_big)); row(tr("ed_logs_small"),numInput(edCfg.logs,"tree_small",LOGS.tree_small));
    row(tr("ed_xp_tree"),numInput(edCfg.xp,"tree",XP_DEF.tree));
  } else if(edDropSel==="fish"){
    p.appendChild(mkEl("p","muted",tr("ed_fish_hint")));
    const tot=FISH.reduce((a,f)=>a+(edCfg.fishW[f.id]!=null?edCfg.fishW[f.id]:f.w),0)||1;
    const hf=mkEl("div","eddrh eddrf"); for(const k of ["ed_drop_item","ed_fish_w","","XP"]) hf.appendChild(mkEl("small",null,k&&k!=="XP"?tr(k):k)); p.appendChild(hf);
    for(const f of FISH){ const w=edCfg.fishW[f.id]!=null?edCfg.fishW[f.id]:f.w;
      row(itemLabel(f.id),numInput(edCfg.fishW,f.id,f.w,true),mkEl("small","edpct",Math.round(w/tot*100)+"%"),numInput(edCfg.xpFish,f.id,XP_FISH_DEF[f.id]??2)); }
  } else if(edDropSel==="rods"){
    p.appendChild(mkEl("p","muted",tr("ed_rod_hint")));
    for(const id of RODS){ const o=edCfg.rods[id]||(edCfg.rods[id]={});
      p.appendChild(mkEl("b","sub",tr("fish_"+id)));
      row(tr("ed_rod_dur"),numInput(o,"dur",ROD_DEF[id].dur)); row(tr("ed_rod_sp"),numInput(o,"sp",ROD_DEF[id].sp)); row(tr("ed_rod_rare"),numInput(o,"rare",ROD_DEF[id].rare)); }
  } else if(edDropSel==="quests"){
    row(tr("ed_xp_quest"),numInput(edCfg.xp,"quest",XP_DEF.quest));
  } else if(edDropSel==="fisher"){
    p.appendChild(mkEl("p","muted",tr("ed_fisher_buy")));
    for(const id of FISHER_EDIT) row(itemLabel(id),numInput(edCfg.fisher,id,PRICE[id]??LOOT_PRICE[id]??(id==="wood"?1:0)));
  }
}
function valInput(obj,key,lo,hi){
  const i=mkEl("input","ednum"); i.type="number"; i.min=String(lo); i.max=String(hi); i.step="1"; i.inputMode="numeric"; i.value=String(obj[key]);
  i.oninput=()=>{ const v=Math.round(+i.value); if(isFinite(v)){ obj[key]=Math.max(lo,Math.min(hi,v)); cfgDirty=true; } };
  return i;
}
function renderShopTab(p){
  p.appendChild(mkEl("b","sub",tr("ed_shop_buy")));
  for(const s of SHOP){
    const r=mkEl("div","edshop"), im=mkEl("img"); im.src=iconURL(s.id); im.alt=""; r.appendChild(im);
    r.appendChild(mkEl("span",null,tr("fish_"+s.id)+(s.n>1?" ×"+s.n:"")));
    const lab=mkEl("label","edchk"), cb=mkEl("input"); cb.type="checkbox"; cb.checked=!edCfg.off[s.id];
    cb.onchange=()=>{ if(cb.checked) delete edCfg.off[s.id]; else edCfg.off[s.id]=true; cfgDirty=true; };
    lab.appendChild(cb); lab.appendChild(document.createTextNode(tr("ed_shop_on"))); r.appendChild(lab);
    r.appendChild(numInput(edCfg.buy,s.id,s.p)); p.appendChild(r);
  }
  p.appendChild(mkEl("b","sub",tr("ed_shop_sell")));
  for(const id of SELL_EDIT){
    const r=mkEl("div","edshop"), im=mkEl("img"); im.src=iconURL(id); im.alt=""; r.appendChild(im);
    r.appendChild(mkEl("span",null,tr("fish_"+id))); r.appendChild(numInput(edCfg.sell,id,SELL_P[id]??PRICE[id]??0)); p.appendChild(r);
  }
}
function numInput(obj,id,def,noRedraw){
  const i=mkEl("input","ednum"); i.type="number"; i.min="0"; i.max="9999"; i.step="1"; i.inputMode="numeric";
  i.placeholder=String(def); i.value=obj[id]!=null?String(obj[id]):"";
  i.oninput=()=>{ const v=i.value.trim(); if(v===""||+v===def) delete obj[id]; else { const n=Math.max(0,Math.min(9999,Math.round(+v))); if(isFinite(n)) obj[id]=n; } cfgDirty=true; };
  if(noRedraw) i.onchange=()=>edRender();   // пересчитать проценты
  return i;
}
// ---- сохранение ----
function edSerialize(){
  const w=edW(), d=edD(), ox=edAdd.l, oy=edAdd.t, levels=[], tops=[], stairs={}, props=[];
  for(let y=0;y<d;y++){ let l="",t=""; for(let x=0;x<w;x++){ const c=cellAt(x-ox,y-oy); if(c){ l+=String(Math.min(9,c.L)); t+=c.t||"g"; } else { l+="0"; t+="."; } } levels.push(l); tops.push(t); }
  const inb=(x,y)=>x>=0&&y>=0&&x<w&&y<d;
  for(const c of cells){ const x=c.x+ox, y=c.y+oy; if(!inb(x,y)) continue; if(c.st) stairs[x+","+y]=c.st;
    for(const n of c.props) if(!/^(stall|pier)_/.test(n)) props.push([x,y,n]); }
  const mv=p=>p&&inb(p[0]+ox,p[1]+oy)?[p[0]+ox,p[1]+oy,...p.slice(2)]:null;
  const zones={}; for(const z of Object.keys(edDraft.zones)){ zones[z]=Object.keys(edDraft.zones[z]).map(k=>k.split(",").map(Number)).map(([x,y])=>[x+ox,y+oy]).filter(([x,y])=>inb(x,y)); }
  return {zones,levels,tops,stairs,props,start:mv(edDraft.start)||[Math.floor(w/2),Math.floor(d/2)],hut:mv(edDraft.hut),npc:mv(edDraft.npc),
    merchant:mv(edDraft.merchant),stall:mv(edDraft.stall),pier:mv(edDraft.pier),cave:mv(edDraft.cave),exit:mv(edDraft.exit),boss:mv(edDraft.boss)};
}
const sameP=(a,b)=>JSON.stringify(a||null)===JSON.stringify(b||null);
function edNeedsReload(m){ return edW()!==W||edD()!==D||edAdd.l||edAdd.t||!sameP(m.hut,MAP.hut)||!sameP(m.npc,MAP.npc)||!sameP(m.merchant,MAP.merchant)||!sameP(m.stall,MAP.stall)||!sameP(m.pier,MAP.pier)||!sameP(m.cave||null,PORTAL&&!CAVE?[PORTAL.x,PORTAL.y]:null)||!sameP(m.exit||null,PORTAL&&CAVE?[PORTAL.x,PORTAL.y]:null)||!sameP(m.boss||null,MAP.boss||null); }
async function edSaveMap(m,reload){
  if(!validMap(m)){ say("ed_bad_map"); return; }
  const v=Date.now(); edSaving=true; MAP_V=v; Object.assign(MAP,m);
  try{ localStorage.setItem(mapKey(),JSON.stringify({v,m})); }catch(e){}
  if(NET.db){
    await NET.db.doc(MAP_DOC).set({v,m:JSON.stringify(m)}).catch(()=>{});
    for(const id of netTreeIds) NET.db.doc(ZC("trees")+"/"+id).delete().catch(()=>{});
    for(const id of fireDocs) NET.db.doc(ZC("fires")+"/"+id).delete().catch(()=>{});
  }
  edUndo.length=0; edSaving=false;
  if(reload){ say("ed_saved_reload"); try{ sessionStorage.setItem("island_reedit",edTab); lastSaveJSON=""; tickSave(99); }catch(e){} setTimeout(()=>location.reload(),900); }
  else { say("ed_saved","ed_saved_sub"); edRender(); }
}
function edSave(){ const m=edSerialize(); edSaveMap(m,edNeedsReload(m)); }
let confirmReset=false;
async function edReset(){
  if(!confirmReset){ confirmReset=true; edRender(); setTimeout(()=>{confirmReset=false; edRender();},4000); return; }
  try{ localStorage.removeItem(mapKey()); sessionStorage.setItem("island_reedit","1"); }catch(e){}
  if(NET.db) await NET.db.doc(MAP_DOC).delete().catch(()=>{});
  MAP_V=0; setTimeout(()=>location.reload(),400);
}
// ---- генератор случайного острова ----
function genIsland(w,d){
  let seed=(Math.random()*1e9)|0; const rnd=()=>((seed=(seed*1664525+1013904223)|0)>>>0)/4294967296;
  const noise=(cs)=>{ const gw=Math.ceil(w/cs)+2, gd=Math.ceil(d/cs)+2, g=[...Array(gd)].map(()=>[...Array(gw)].map(rnd));
    return (x,y)=>{ const fx=x/cs, fy=y/cs, x0=Math.floor(fx), y0=Math.floor(fy), tx=fx-x0, ty=fy-y0, s=t=>t*t*(3-2*t);
      const a=g[y0][x0], b=g[y0][x0+1], c=g[y0+1][x0], e=g[y0+1][x0+1];
      return (a+(b-a)*s(tx))*(1-s(ty))+(c+(e-c)*s(tx))*s(ty); }; };
  const n1=noise(Math.max(4,w/4)), n2=noise(3), n3=noise(5);
  const H=[...Array(d)].map((_,y)=>[...Array(w)].map((_,x)=>{
    const dx=(x-(w-1)/2)/(w/2), dy=(y-(d-1)/2)/(d/2), r=Math.sqrt(dx*dx+dy*dy);
    const v=n1(x,y)*0.65+n2(x,y)*0.35-r*r*0.95+0.35; return v<0.12?0:Math.max(1,Math.min(5,1+Math.floor((v-0.12)*7))); }));
  for(let it=0;it<6;it++) for(let y=0;y<d;y++) for(let x=0;x<w;x++){ if(!H[y][x]) continue;   // соседние клетки — не круче 1 уровня
    for(const [a,b] of DIRS4){ const v=H[y+b]?.[x+a]; if(v&&H[y][x]>v+1) H[y][x]=v+1; } }
  const T=[...Array(d)].map((_,y)=>[...Array(w)].map((_,x)=>{ if(!H[y][x]) return "."; const v=n3(x,y);
    return v<0.3?"d":v<0.62?(rnd()<0.5?"g":"G"):v<0.8?"G":"e"; }));
  // пруды: низкие ямки внутри острова
  const inner=(x,y)=>DIRS4.every(([a,b])=>H[y+b]?.[x+a]>0)&&[[1,1],[-1,1],[1,-1],[-1,-1]].every(([a,b])=>H[y+b]?.[x+a]>0);
  const ponds=Math.max(1,Math.round(w*d/350));
  for(let p=0;p<ponds;p++){ for(let tries=0;tries<200;tries++){ const x=1+Math.floor(rnd()*(w-2)), y=1+Math.floor(rnd()*(d-2));
      if(!H[y][x]||H[y][x]>2||!inner(x,y)) continue; const L=H[y][x], q=[[x,y]], set=[[x,y]], seen=new Set([x+","+y]); const size=4+Math.floor(rnd()*6);
      while(q.length&&set.length<size){ const [cx,cy]=q.shift(); for(const [a,b] of DIRS4){ const nx=cx+a, ny=cy+b, k=nx+","+ny;
        if(!seen.has(k)&&H[ny]?.[nx]===L&&inner(nx,ny)&&rnd()<0.8){ seen.add(k); q.push([nx,ny]); set.push([nx,ny]); } } }
      if(set.length>=3){ for(const [a,b] of set) T[b][a]="w"; break; } } }
  const land=(x,y)=>H[y]?.[x]>0&&T[y][x]!=="w", used=new Set(), mark=(x,y)=>used.add(x+","+y);
  const cx=Math.floor(w/2), cy=Math.floor(d/2), near=(f)=>{ let best=null,bd=1e9; for(let y=0;y<d;y++)for(let x=0;x<w;x++){ if(!f(x,y)) continue; const dd=Math.hypot(x-cx,y-cy)+rnd()*0.5; if(dd<bd){bd=dd;best=[x,y];} } return best; };
  const start=near((x,y)=>land(x,y)); mark(...start);
  const hut=near((x,y)=>[[0,0],[1,0],[0,1],[1,1]].every(([a,b])=>land(x+a,y+b)&&H[y+b][x+a]===H[y][x]&&!used.has((x+a)+","+(y+b)))&&Math.hypot(x-start[0],y-start[1])>3);
  if(hut) for(const [a,b] of [[0,0],[1,0],[0,1],[1,1],[2,0],[2,1],[0,2],[1,2]]) mark(hut[0]+a,hut[1]+b);
  const npc=hut?near((x,y)=>land(x,y)&&!used.has(x+","+y)&&Math.abs(x-hut[0]-0.5)<=2.5&&Math.abs(y-hut[1]-0.5)<=2.5):null; if(npc) mark(...npc);
  let merchant=null, stall=null, pier=null;
  for(let y=0;y<d&&!merchant;y++) for(let x=0;x<w&&!merchant;x++){ if(!land(x,y)||used.has(x+","+y)) continue;
    const wn=DIRS4.find(([a,b])=>T[y+b]?.[x+a]==="w"), ln=DIRS4.find(([a,b])=>land(x+a,y+b)&&!used.has((x+a)+","+(y+b))&&!(wn&&a===-wn[0]&&b===-wn[1]));
    if(wn&&ln){ merchant=[x,y]; pier=[x+wn[0],y+wn[1],wn[0]?"pier_right":"pier_left"]; stall=[x+ln[0],y+ln[1],ln[0]?"stall_left":"stall_right"]; } }
  if(!merchant){ merchant=near((x,y)=>land(x,y)&&!used.has(x+","+y)&&Math.hypot(x-start[0],y-start[1])>4); }
  if(merchant) mark(...merchant); if(stall) mark(stall[0],stall[1]);
  const props=[];
  const keep=[start,npc,merchant,hut&&[hut[0]+0.5,hut[1]+0.5]].filter(Boolean);   // вокруг жилья и NPC — свободно
  const nf=noise(4);   // деревья растут рощами, а не равномерно
  for(let y=0;y<d;y++) for(let x=0;x<w;x++){ if(!land(x,y)||used.has(x+","+y)||keep.some(p=>Math.hypot(x-p[0],y-p[1])<2.3)) continue; const r=rnd(), t=T[y][x], grove=nf(x,y)>0.6;
    if(t==="e"&&r<0.1) props.push([x,y,r<0.04?"rock_big":"rock_small"]);
    else if(grove&&r<0.22) props.push([x,y,r<0.1?"tree_big":"tree_small"]);
    else if(r<0.025) props.push([x,y,"tree_small"]);
    else if(r<0.05) props.push([x,y,"bush"]); else if(r<0.07) props.push([x,y,"rock_small"]); else if(r<0.14) props.push([x,y,rnd()<0.5?"grass_tuft":"grass_tuft_2"]); }
  return {levels:H.map(r=>r.join("")),tops:T.map(r=>r.join("")),stairs:{},props,start,hut,npc,merchant,stall,pier};
}
function edGenerate(){
  if(!edGenPending){ edGenPending=true; edRender(); setTimeout(()=>{ edGenPending=null; edRender(); },4000); return; }
  edGenPending=null; const m=genIsland(edW(),edD()); edSaveMap(m,true);
}
// ---- карта от других: перезагрузка ----
function onMapDoc(s){
  if(EDIT||edSaving) return;
  const d=s.exists?s.data():null;
  if(d&&typeof d.m==="string"&&typeof d.v==="number"){
    if(d.v===MAP_V) return; let m; try{ m=JSON.parse(d.m); }catch(e){ return; } if(!validMap(m)) return;
    try{ localStorage.setItem(mapKey(),JSON.stringify({v:d.v,m})); }catch(e){}
    reloadForMap();
  } else if(!d&&MAP_V&&!(s.metadata&&s.metadata.fromCache)){ try{ localStorage.removeItem(mapKey()); }catch(e){} reloadForMap(); }
}
let mapReloading=false;
function reloadForMap(){ if(mapReloading) return; mapReloading=true; say("map_changed","map_changed_sub");
  try{ lastSaveJSON=""; tickSave(99); }catch(e){} setTimeout(()=>location.reload(),1800); }
