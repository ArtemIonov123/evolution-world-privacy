// ================= RPG: уровень, навыки, снаряжение, ремесло и окна =================
const GEAR={club:{slot:"weapon",atk:1}, sword_wood:{slot:"weapon",atk:2}, cap_leather:{slot:"head",def:1},
  armor_leather:{slot:"body",def:2}, boots_leather:{slot:"feet",def:1}, amulet_fang:{slot:"neck",hp:1},
  sword_iron:{slot:"weapon",atk:3}, helm_iron:{slot:"head",def:2}, sword_steel:{slot:"weapon",atk:4},
  rod_wood:{slot:"rod",rod:1}, rod_bamboo:{slot:"rod",rod:2}, rod_steel:{slot:"rod",rod:3}};
const SLOTS=["head","neck","body","weapon","feet","rod"];
const RECIPES=[{id:"rod_wood",need:{wood:2},coin:0},{id:"sword_wood",need:{wood:4},coin:10},{id:"cap_leather",need:{pelt:1},coin:5},{id:"boots_leather",need:{pelt:2},coin:5},
  {id:"armor_leather",need:{pelt:3},coin:10},{id:"amulet_fang",need:{fang:3},coin:10}];
const equip={weapon:null,head:null,body:null,feet:null,neck:null,rod:null};
const prog={xp:0, ri:0, sk:{fight:0,fish:0,chop:0}, st:{wolves:0,bats:0,spiders:0,bosses:0,fish:0,trees:0,fires:0,faints:0,time:0}};
function lvlInfo(xp){ let l=1,need=20; while(xp>=need&&l<60){ xp-=need; l++; need=20*l; } return {l,into:xp,need}; }
const heroLevel=()=>lvlInfo(prog.xp).l;
const skillLvl=k=>1+Math.floor(Math.sqrt((prog.sk[k]||0)/8));
const skillNext=k=>{ const l=skillLvl(k), a=8*(l-1)**2, b=8*l**2; return {l,into:(prog.sk[k]||0)-a,need:b-a}; };
function heroAtk(){ return (equip.weapon&&GEAR[equip.weapon]?GEAR[equip.weapon].atk||0:0)+Math.floor(heroLevel()/5)+(form==="bear"?2:form==="wolf"?1:0); }
function gearHP(){ let h=0; for(const s of SLOTS){ const g=equip[s]&&GEAR[equip[s]]; if(g&&g.hp) h+=g.hp; } return h; }
function heroDef(){ let d=0; for(const s of SLOTS){ const g=equip[s]&&GEAR[equip[s]]; if(g&&g.def) d+=g.def; } return d; }
const blockChance=()=>Math.min(0.5,heroDef()*0.12);
const critChance=()=>Math.min(0.3,0.05*(skillLvl("fight")-1));
const fishSpeed=()=>Math.max(0.55,1-0.07*(skillLvl("fish")-1));
const extraLogChance=()=>Math.min(0.5,0.1*(skillLvl("chop")-1));
function recalcHP(){ const old=HP_MAX; HP_MAX=5+Math.floor(heroLevel()/3)+gearHP()+(heroClass==="warrior"?1:0)+(form==="bear"?3:0);
  if(hero.hp>HP_MAX) hero.hp=HP_MAX; if(HP_MAX!==old) renderHP(); }
function addXP(n,skill){
  const before=heroLevel(); prog.xp+=n; if(skill) prog.sk[skill]=(prog.sk[skill]||0)+n;
  floats.push({key:"xp",p:{n},col:"#c8b0ff",t:-0.15});
  const after=heroLevel();
  if(after>before){ recalcHP(); hero.hp=HP_MAX; renderHP(); lastPresJSON="";
    floats.push({key:"lvl_float",p:{n:after},col:"#ffd66b",t:-0.6}); say("lvl_up","lvl_up_sub",{n:after});
    for(let i=0;i<24;i++) chips.push({x:hero.x,y:hero.y,z:hero.z*LH+20,vx:(Math.random()-.5)*1.4,vy:(Math.random()-.5)*1.4,vz:30+Math.random()*40,t:0,life:0.9,col:i%2?"#ffd66b":"#fff4b0",spark:true}); }
  refreshUI();
}
// ---- место в сумке: 30 видов вещей (монеты место не занимают, к уже лежащей вещи добавить можно всегда) ----
const BAG_SIZE=30;
const bagUsed=()=>ITEMS.filter(f=>f.id!=="coin"&&inv[f.id]>0).length;
const bagRoom=id=>id==="coin"||inv[id]>0||bagUsed()<BAG_SIZE;
let bagFullT=0;
function bagFull(){ const now=Date.now(); if(now-bagFullT>2500){ bagFullT=now; say("bag_full","bag_full_sub"); floats.push({key:"bag_full",col:"#ff8a7a",t:0}); } }
// предмет в сумку; снаряжение само надевается, если слот пуст
function canWear(g){ return !(g.lv&&heroLevel()<g.lv)&&!(g.cl&&g.cl!==heroClass); }
function giveItem(id,n=1){ inv[id]=(inv[id]||0)+n; const g=GEAR[id]; if(g&&!equip[g.slot]&&canWear(g)) equipItem(id); else renderInv(); }
function equipItem(id){
  const g=GEAR[id]; if(!g||!inv[id]) return;
  if(g.lv&&heroLevel()<g.lv){ say("need_lv",null,{n:g.lv}); return; }
  if(g.cl&&g.cl!==heroClass){ say("need_cl",null,{c:"#cl_"+g.cl}); return; }
  const old=equip[g.slot]; inv[id]--; if(!inv[id]) delete inv[id];
  if(old) inv[old]=(inv[old]||0)+1;
  if(g.slot==="rod"){ if(old) rodWear[old]=rodDur; rodDur=rodWear[id]??rodMax(id); delete rodWear[id]; }
  equip[g.slot]=id; recalcHP(); renderInv(); lastSaveJSON="";
}
function unequip(slot){ const id=equip[slot]; if(!id) return; if(!bagRoom(id)){ bagFull(); return; } equip[slot]=null; if(slot==="rod"){ rodWear[id]=rodDur; rodDur=0; } inv[id]=(inv[id]||0)+1; recalcHP(); renderInv(); lastSaveJSON=""; }
// ---- ремесло у рыбака ----
const canCraft=r=>(inv.coin||0)>=r.coin&&Object.entries(r.need).every(([k,n])=>(inv[k]||0)>=n);
const costText=r=>Object.entries(r.need).map(([k,n])=>`${n}× ${tr("fish_"+k).toLowerCase()}`).concat(r.coin?[`${r.coin} ${tr("coins")}`]:[]).join(", ");
function craft(r){
  if(!canCraft(r)) return;
  if(!bagRoom(r.id)){ bagFull(); return; }
  for(const [k,n] of Object.entries(r.need)){ inv[k]-=n; if(!inv[k]) delete inv[k]; }
  inv.coin-=r.coin; if(!inv.coin) delete inv.coin;
  giveItem(r.id); floats.push({key:"plus",p:{n:1,fish:"#fish_"+r.id},col:"#ffe0a0",t:0});
  dlgParams={item:"#fish_"+r.id}; dlgNode="crafted"; renderDialog();
}
