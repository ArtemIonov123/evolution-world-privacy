// ---------- Геометрия (по реальным спрайтам) ----------
const HW = 32, HH = 17;  // половина ромба 64x34
const LH = 10;           // высота уровня
const TOP_Y = 2;         // отступ верха ромба в спрайте блока

// ---------- Карта ----------
// MAP.levels — высота клетки цифрой (0 = пусто)
// MAP.tops   — g/G трава, d тёмная трава, s тропа, e земля
// MAP.stairs — "x,y": L (подъём к x-1) или R (подъём к y-1)
// MAP.props  — [x, y, спрайт]
const LEVELS = MAP.levels.map(r=>[...r].map(Number));
const TOPS = MAP.tops;
const W = LEVELS[0].length, D = LEVELS.length;
const MX = (W-1)/2, MY = (D-1)/2;
const TOP_SPRITE = {g:"block_grass",G:"block_grass_2",d:"block_grass_dark",s:"block_stone_path",e:"block_dirt",w:"block_dirt",v:"block_dirt",
  n:"block_sand",N:"block_sand_wet",r:"block_gravel",m:"block_mud",f:"block_grass_flowers",o:"block_moss",c:"block_cobble_dark",p:"block_planks",z:"block_snow",u:"block_grass_autumn",
  k:"block_cave_floor",K:"block_cave_floor_2",x:"block_cave_wall",q:"block_cave_crystal",l:"block_cave_lava",j:"block_cave_mud"};
const LAND_TILES="gGdsenNrmfocpzukKxqlj", GRASSY="gGdfou";   // виды земли; «травяные» — где растут деревья и бегают зайцы
const TOP_NAME = {g:"трава",G:"трава",d:"тёмная трава",s:"каменная тропа",e:"земля",w:"вода"};
const BLOCKING = new Set(["tree_big","tree_small","bush","rock_big","fence_left","fence_right","prop_reeds","prop_rock_water",
  "prop_barrel","prop_crate","prop_stump","prop_log","prop_signpost","prop_bush_berry","prop_crystal","prop_car","prop_tires","prop_barrier"]);
// водный декор ставится только на воду; любые другие prop_* — только на сушу
const WATER_PROPS=new Set(["prop_lily_pad","prop_reeds","prop_rock_water"]);
const isWaterProp=n=>WATER_PROPS.has(n);
const STAIR_DIR = {L:[-1,0], R:[0,-1], P:[1,0], Q:[0,1]};   // куда лестница поднимается
const STAIR_ORDER=["L","R","P","Q"];

const img = {};
const loadAll = Promise.all(Object.entries(SPRITES).map(([k,src])=>new Promise(r=>{const i=new Image();i.onload=()=>{img[k]=postapoLook(k,i);r()};i.src=src})));

const cells=[], grid=[...Array(D)].map(()=>Array(W).fill(null));
for(let y=0;y<D;y++)for(let x=0;x<W;x++){
  const L=LEVELS[y][x]; if(!L) continue;
  const c={x,y,L,t:TOPS[y][x],st:MAP.stairs[x+","+y]||null,props:[],blocked:false};
  cells.push(c); grid[y][x]=c;
}
for(const [x,y,name] of MAP.props){const c=grid[y]?.[x]; if(!c) continue; c.props.push(name); if(BLOCKING.has(name)) c.blocked=true;}
for(const c of cells){ if(c.t==="w"){c.water=true;c.blocked=true;} else if(c.t==="v") c.shallow=true; }  // глубокая вода — не пройти, мелководье — вброд
const cellAt=(x,y)=> (x>=0&&y>=0&&x<W&&y<D)?grid[y][x]:null;
const wet=c=>!!c&&(c.water||c.shallow);
const walkZ=c=> wet(c) ? c.L-0.3 : c.st ? c.L+0.5 : c.L;  // вода чуть ниже берега
// места из карты должны стоять на суше
{ const land=p=>p&&cellAt(p[0],p[1])&&!wet(cellAt(p[0],p[1]));
  if(MAP.hut&&[[0,0],[1,0],[0,1],[1,1]].some(([a,b])=>!land([MAP.hut[0]+a,MAP.hut[1]+b]))) MAP.hut=null;
  if(MAP.npc&&!land(MAP.npc)) MAP.npc=null;
  if(!land(MAP.start)){ const c=cells.find(c=>!c.water&&!c.blocked)||cells[0]; MAP.start=[c.x,c.y]; } }
   // высота поверхности, по которой идёт герой

// ---------- Камера и поворот ----------
let rot=0, rotTarget=0, anim=null, ca=1, sa=0;
const SKY=CAVE?"#120d1c":(getComputedStyle(document.documentElement).getPropertyValue("--sky").trim()||"#a99ad6");
let scale=2, panX=0, panY=0, follow=true, showGrid=false, hover=null;
let rotQPrev=0;
function setRot(r){rot=r; const a=r*Math.PI/2; ca=Math.cos(a); sa=Math.sin(a);
  // при повороте камеры на четверть все «экранные» направления пересчитываем, чтобы в мире они не менялись
  const q=((Math.round(r)%4)+4)%4; if(q!==rotQPrev){ const from=rotQPrev; rotQPrev=q; if(typeof remapFacings==="function") remapFacings(from,q); } }
// направление спрайта (se/sw/ne/nw — на экране) <-> направление в мире; q — четверть поворота камеры
const QCS=[[1,0],[0,1],[-1,0],[0,-1]];
function faceToWorldQ(f,q){ const sx=f[1]==="e"?1:-1, sy=f[0]==="s"?1:-1, u=(sx+sy)/2, v=(sy-sx)/2, [c,s]=QCS[q]; return [u*c+v*s,-u*s+v*c]; }
function worldToFaceQ(dx,dy,q){ const [c,s]=QCS[q], u=dx*c-dy*s, v=dx*s+dy*c, sx=u-v, sy=u+v; return (sy>=0?"s":"n")+(sx>=0?"e":"w"); }
const convF=(f,from,to)=>typeof f==="string"&&f.length===2&&from!==to?worldToFaceQ(...faceToWorldQ(f,from),to):f;
function remapFacings(from,to){
  const fix=o=>{ if(o&&typeof o.facing==="string") o.facing=convF(o.facing,from,to); };
  fix(hero); if(typeof npc!=="undefined") fix(npc); if(typeof merch!=="undefined") fix(merch);
  if(typeof animals!=="undefined") for(const a of animals) fix(a);
  if(typeof remotes!=="undefined") for(const r of remotes.values()) if(r.f) r.f=convF(r.f,from,to);
}
// точка карты (X,Y от центра в клетках, Z в уровнях) -> мировые пиксели
const proj=(X,Y,Z)=>{const u=X*ca-Y*sa, v=X*sa+Y*ca; return [(u-v)*HW, (u+v)*HH-(Z-1)*LH]};
const depthOf=(X,Y)=>{const u=X*ca-Y*sa, v=X*sa+Y*ca; return u+v};
const quarter=()=>((Math.round(rot)%4)+4)%4;
const rotQ=(v,q)=>{let [a,b]=v;for(let i=0;i<q;i++)[a,b]=[-b,a];return [a,b]};

