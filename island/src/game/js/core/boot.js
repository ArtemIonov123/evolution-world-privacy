const SPRITES = /*SPRITES*/;
// зона: остров или пещера (общий данж). Пещера — отдельная карта; переход — перезагрузкой страницы
const CMOBS={};   // свои мобы из админки (world/mobs)
const ZONE=(()=>{ try{ return sessionStorage.getItem("island_zone")==="cave"?"cave":"island"; }catch(e){ return "island"; } })(), CAVE=ZONE==="cave";
const CAVE_DEFAULT = {"levels":["0000044444444444400000","0004442222222222444000","0044222222222222224400","0042222222222222222400","0042222222222222222400","0044222222222222224400","0004444111221114444000","0000033111111113300000","0003331111111111333000","0033111111111111113300","0331111111111111111330","0311111113333311111113","0311111133000331111113","0331111130000031111113","0031111330000033111133","0031111130000031111330","0033111113333311111300","0003311111111111111300","0000333311111113333300","0000000333333333000000"],"tops":[".....xxxxxxxxxxxx.....","...xxxkkkKkkkkkkxxx...","..xxkkkKkkkkkkkkkkxx..","..xkkKkkkkklkkkkKkkx..","..xKkkkkkkkkkkKkkkkx..","..xxkkkkkkkkKkkkkkxx..","...xxxxkkkKkkkkxxxx...",".....xxkkkkKkkkxx.....","...xxxkKkjwwwjkkxxx...","..xxkkqkkjwwwvjkKqxx..",".xxkkqqkkjvvvjkkkkkxx.",".xkkkkkkKxxxxxkkkkkkkx",".xkkjkkkxx...xxkkKkkkx",".xxkkkkkx.....xkkqqkkx","..xkkkkxx.....xxkkkkxx","..xkkKkkx.....xkkkKxx.","..xxkkkkkxxxxxKkkkkx..","...xxkkkkkKkkkkkkkkx..","....xxxxkkkkkkkxxxxx..",".......xxxxxxxxx......"],"stairs":{},"props":[[4,9,"prop_crystal"],[17,10,"prop_crystal"],[4,3,"prop_crystal"],[17,4,"prop_crystal"],[3,13,"prop_mushrooms"],[18,15,"prop_mushrooms"],[6,16,"rock_small"]],"start":[11,18],"exit":[12,18],"boss":[11,3],"zones":{"spider":[[2,11],[3,11],[4,11],[5,11],[6,11],[7,11],[14,11],[15,11],[16,11],[17,11],[18,11],[19,11],[20,11],[2,12],[3,12],[4,12],[5,12],[6,12],[7,12],[15,12],[16,12],[17,12],[18,12],[19,12],[20,12],[3,13],[4,13],[5,13],[6,13],[7,13],[15,13],[16,13],[17,13],[18,13],[19,13],[20,13],[3,14],[4,14],[5,14],[6,14],[16,14],[17,14],[18,14],[19,14],[3,15],[4,15],[5,15],[6,15],[7,15],[15,15],[16,15],[17,15],[18,15],[4,16],[5,16],[6,16],[7,16],[14,16],[15,16],[16,16],[17,16],[18,16]],"bat":[[6,8],[7,8],[8,8],[9,8],[13,8],[14,8],[15,8],[4,9],[5,9],[6,9],[7,9],[8,9],[9,9],[13,9],[14,9],[15,9],[16,9],[17,9],[3,10],[4,10],[5,10],[6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],[18,10]],"hare":[],"wolf":[]},"hut":null,"npc":null,"merchant":null,"stall":null,"pier":null};
const ISLAND_MAP = /*MAP*/;
const MAP = CAVE ? JSON.parse(JSON.stringify(CAVE_DEFAULT)) : ISLAND_MAP;
const ZC=n=>CAVE?"cave_"+n:n, MAP_DOC=CAVE?"world/map_cave":"world/map";
// своя карта мира (из редактора): сначала из кэша браузера, база присылает свежую
function mapKey(){ return "island_map_"+(window.__islandWorld||"claude")+(CAVE?"_cave":""); }
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

