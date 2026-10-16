// ошибки — прямо на экран (чтобы по скриншоту с телефона было видно причину)
window.showGameError=(msg,where)=>{ try{ let el=document.getElementById("gameErr");
  if(!el){ el=document.createElement("div"); el.id="gameErr"; el.style.cssText="position:fixed;left:8px;right:8px;top:90px;z-index:99999;background:#3a0d0d;color:#ffd7d7;border:2px solid #ff6060;border-radius:8px;padding:8px 10px;font:12px/1.35 monospace;white-space:pre-wrap;max-height:40vh;overflow:auto;pointer-events:auto";
    el.onclick=()=>el.remove(); (document.body||document.documentElement).appendChild(el); }
  if(el.childNodes.length>6) return;
  const line=document.createElement("div"); line.textContent="Ошибка: "+String(msg).slice(0,300)+(where?"\n  "+String(where).slice(0,300):""); el.appendChild(line);
  }catch(e){} };
addEventListener("error",e=>showGameError(e.message,(e.filename?"строка "+e.lineno+":"+e.colno:"")+(e.error&&e.error.stack?"\n"+String(e.error.stack).split("\n").slice(1,3).join("\n"):"")));
addEventListener("unhandledrejection",e=>showGameError(e.reason&&e.reason.message||e.reason,e.reason&&e.reason.stack?String(e.reason.stack).split("\n").slice(1,3).join("\n"):""));
const SPRITES = /*SPRITES*/;
const SPRITES_HD = /*SPRITES_HD*/{};   // картинки в повышенном качестве: имя → во сколько раз детальнее (name@2x.png, name@4x.png)
// зона: остров или пещера (общий данж). Пещера — отдельная карта; переход — перезагрузкой страницы
const CMOBS={};   // свои мобы из админки (world/mobs)
// свои острова/пещеры (список из админки, кэш браузера): id вида z<буквы/цифры>
const ZONES0=(()=>{ try{ const l=JSON.parse(localStorage.getItem("pa_zones")||"{}"); return l&&typeof l==="object"?l:{}; }catch(e){ return {}; } })();
const ZONE=(()=>{ try{ const z=sessionStorage.getItem("pa_zone")||""; return z==="cave"?"cave":/^z[a-z0-9]{4,10}$/.test(z)?z:"island"; }catch(e){ return "island"; } })();
const CUSTOMZ=ZONE!=="island"&&ZONE!=="cave", CAVE=ZONE==="cave"||(CUSTOMZ&&!!ZONES0[ZONE]&&ZONES0[ZONE].k==="cave");
const CAVE_DEFAULT = {"levels":["0000044444444444400000","0004442222222222444000","0044222222222222224400","0042222222222222222400","0042222222222222222400","0044222222222222224400","0004444111221114444000","0000033111111113300000","0003331111111111333000","0033111111111111113300","0331111111111111111330","0311111113333311111113","0311111133000331111113","0331111130000031111113","0031111330000033111133","0031111130000031111330","0033111113333311111300","0003311111111111111300","0000333311111113333300","0000000333333333000000"],"tops":[".....xxxxxxxxxxxx.....","...xxxkkkKkkkkkkxxx...","..xxkkkKkkkkkkkkkkxx..","..xkkKkkkkklkkkkKkkx..","..xKkkkkkkkkkkKkkkkx..","..xxkkkkkkkkKkkkkkxx..","...xxxxkkkKkkkkxxxx...",".....xxkkkkKkkkxx.....","...xxxkKkjwwwjkkxxx...","..xxkkqkkjwwwvjkKqxx..",".xxkkqqkkjvvvjkkkkkxx.",".xkkkkkkKxxxxxkkkkkkkx",".xkkjkkkxx...xxkkKkkkx",".xxkkkkkx.....xkkqqkkx","..xkkkkxx.....xxkkkkxx","..xkkKkkx.....xkkkKxx.","..xxkkkkkxxxxxKkkkkx..","...xxkkkkkKkkkkkkkkx..","....xxxxkkkkkkkxxxxx..",".......xxxxxxxxx......"],"stairs":{},"props":[[4,9,"prop_crystal"],[17,10,"prop_crystal"],[4,3,"prop_crystal"],[17,4,"prop_crystal"],[3,13,"prop_mushrooms"],[18,15,"prop_mushrooms"],[6,16,"rock_small"]],"start":[11,18],"exit":[12,18],"boss":[11,3],"zones":{"spider":[[2,11],[3,11],[4,11],[5,11],[6,11],[7,11],[14,11],[15,11],[16,11],[17,11],[18,11],[19,11],[20,11],[2,12],[3,12],[4,12],[5,12],[6,12],[7,12],[15,12],[16,12],[17,12],[18,12],[19,12],[20,12],[3,13],[4,13],[5,13],[6,13],[7,13],[15,13],[16,13],[17,13],[18,13],[19,13],[20,13],[3,14],[4,14],[5,14],[6,14],[16,14],[17,14],[18,14],[19,14],[3,15],[4,15],[5,15],[6,15],[7,15],[15,15],[16,15],[17,15],[18,15],[4,16],[5,16],[6,16],[7,16],[14,16],[15,16],[16,16],[17,16],[18,16]],"bat":[[6,8],[7,8],[8,8],[9,8],[13,8],[14,8],[15,8],[4,9],[5,9],[6,9],[7,9],[8,9],[9,9],[13,9],[14,9],[15,9],[16,9],[17,9],[3,10],[4,10],[5,10],[6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],[18,10]],"hare":[],"wolf":[]},"hut":null,"npc":null,"merchant":null,"stall":null,"pier":null};
const ISLAND_MAP = /*MAP*/;
const MAP = CAVE ? JSON.parse(JSON.stringify(CAVE_DEFAULT)) : ISLAND_MAP;
const ZC=n=>ZONE==="island"?n:ZONE==="cave"?"cave_"+n:ZONE+"_"+n, MAP_DOC=ZONE==="island"?"world/map":ZONE==="cave"?"world/map_cave":"world/map_"+ZONE;
// своя карта мира (из редактора): сначала из кэша браузера, база присылает свежую
function mapKey(z){ z=z||ZONE; return "pa_map_"+(window.__islandWorld||"claude")+(z==="island"?"":z==="cave"?"_cave":"_"+z); }
function validMap(m){ try{
  if(!m||!Array.isArray(m.levels)||!Array.isArray(m.tops)) return false;
  const d=m.levels.length, w=(m.levels[0]||"").length; if(d<8||d>40||w<8||w>40||m.tops.length!==d) return false;
  for(let y=0;y<d;y++){ if(typeof m.levels[y]!=="string"||m.levels[y].length!==w||!/^[0-9]+$/.test(m.levels[y])) return false;
    if(typeof m.tops[y]!=="string"||m.tops[y].length!==w) return false; }
  if(!m.stairs||typeof m.stairs!=="object"||!Array.isArray(m.props)||!Array.isArray(m.start)) return false;
  return /[1-9]/.test(m.levels.join("")); }catch(e){ return false; } }
let MAP_V=0;
try{ const raw=localStorage.getItem(mapKey()); if(raw){ const o=JSON.parse(raw);
  if(o&&validMap(o.m)){ Object.assign(MAP,{hut:null,npc:null,merchant:null,stall:null,pier:null,zones:null,cave:null,exit:null,boss:null},o.m); MAP_V=o.v||0; } } }catch(e){}

