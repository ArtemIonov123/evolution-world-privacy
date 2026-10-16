// ================= Рыбалка =================
// Улов: вес = как часто попадается
const FISH=[
  {id:"karas",  name:"Карась",        w:40, body:"#c9a043", belly:"#f0d888", fin:"#a06a1c", len:9},
  {id:"okun",   name:"Окунь",         w:28, body:"#8aa848", belly:"#e8e2a8", fin:"#d8502a", len:9, stripes:true},
  {id:"shchuka",name:"Щука",          w:14, body:"#5f8a3a", belly:"#d8e2b0", fin:"#6a7a30", len:12, slim:true, spots:true},
  {id:"gold",   name:"Золотая рыбка", w:5,  body:"#ffb020", belly:"#ffe680", fin:"#ff6a1a", len:8},
  {id:"boot",   name:"Старый сапог",  w:13},
];
// если GPT нарисует иконки — берём их, иначе рисуем кодом
const ICON_SPRITE={karas:"fish_karas",okun:"fish_okun",shchuka:"fish_shchuka",gold:"fish_gold",boot:"item_boot"};
const ICONS={};
const ICON_FALLBACK={
  spider_silk:(x,y)=>{ const dx=x-16, dy=y-16, r=Math.hypot(dx,dy); if(r>13) return null; const a=Math.atan2(dy,dx);
    if(Math.abs(Math.sin(a*4))<0.12||Math.abs(r-4)<0.6||Math.abs(r-8)<0.6||Math.abs(r-12)<0.6) return r>12.4?"#9a94b4":"#f4f0ff"; return null; },
  golem_core:(x,y)=>{ const d=Math.abs(x-16)/9+Math.abs(y-16)/12; if(d>1) return null; if(d>0.85) return "#1b1528"; return d<0.35?"#e8fbff":x<16?"#7ae0ff":"#3aa8d8"; },
  sword_steel:(x,y)=>{ const along=((x-6)-(y-26))/Math.SQRT2, d=Math.abs((x-6)+(y-26))/Math.SQRT2; if(along<0||along>28) return null;
    if(along<7){ if(d>1.6) return null; return "#7a4a24"; } if(along<9){ if(d>4.5) return null; return "#c8a040"; } if(d>2.2) return null; return d<0.8?"#ffffff":"#b8c4d0"; },
  club:(x,y)=>{ const along=((x-6)-(y-26))/Math.SQRT2, d=Math.abs((x-6)+(y-26))/Math.SQRT2;
    if(along<0||along>27) return null; const r=along>17?3.4:1.8; if(d>r) return null; return along>17?(d>2.2?"#8a5a2e":"#c89058"):(d>1?"#7a4a24":"#b07a40"); },
  pelt:(x,y)=>{ const e=((x-16)/11)**2+((y-17)/8)**2; if(e>1) return null; if(e>0.75) return "#4c4c5c"; return (x+y*2)%7===0?"#5a5a68":((y<15)?"#8a8a98":"#6c6c7c"); },
  fang:(x,y)=>{ if(y<7||y>25) return null; const w=(25-y)*0.32+1, cx=14+(y-7)*0.25; if(Math.abs(x-cx)>w) return null; return x<cx?"#fffdf4":"#d8d0c0"; },
  meat_raw:(x,y)=>{ if(y>=21&&y<=23&&x>=20&&x<=28) return "#f4f0e8"; if(((x-28)**2+(y-20)**2)<=4||((x-28)**2+(y-24)**2)<=4) return "#f4f0e8";
    const e=((x-13)/9)**2+((y-16)/7)**2; if(e>1) return null; return e<0.25?"#ff8a8a":(x+y)%6===0?"#f0c0b0":"#d8403a"; },
  meat_cooked:(x,y)=>{ if(y>=21&&y<=23&&x>=20&&x<=28) return "#f4f0e8"; if(((x-28)**2+(y-20)**2)<=4||((x-28)**2+(y-24)**2)<=4) return "#f4f0e8";
    const e=((x-13)/9)**2+((y-16)/7)**2; if(e>1) return null; return e<0.25?"#d8904a":(x*2+y)%7===0?"#5a2a10":"#a8602a"; },
  sword_wood:(x,y)=>{ const along=((x-6)-(y-26))/Math.SQRT2, d=Math.abs((x-6)+(y-26))/Math.SQRT2;
    if(along<0||along>28) return null; if(along<7) return d<=1.5?((x+y)%3?"#6a3e1c":"#8a5a2e"):null; if(along<9) return d<=4?"#5a3418":null;
    return d<=(along>25?1.2:2.2)?(d<0.8?"#f0d8a8":"#c89a60"):null; },
  cap_leather:(x,y)=>{ if(y>=20&&y<=23&&x>=6&&x<=26) return "#8a8a98"; if((x-9)**2+(y-9)**2<=6||(x-23)**2+(y-9)**2<=6) return "#6c6c7c";
    const e=((x-16)/10)**2+((y-20)/10)**2; if(e>1||y>20) return null; return (x+y)%5===0?"#5a5a68":"#7a5a3a"; },
  armor_leather:(x,y)=>{ if(y<6||y>27) return null; if(y<10&&(x>=7&&x<=12||x>=20&&x<=25)) return "#8a8a98";
    if(y>=10&&x>=8&&x<=24){ if(x===16) return "#4a2a12"; return (y===20)?"#3a2414":"#8a5a2e"; } return null; },
  boots_leather:(x,y)=>{ const boot=(bx)=>{ if(y>=6&&y<=9&&x>=bx&&x<=bx+6) return "#8a8a98"; if(y>=10&&y<=22&&x>=bx&&x<=bx+6) return "#7a4a24";
      if(y>=23&&y<=26&&x>=bx&&x<=bx+9) return y===26?"#3a2414":"#6a3e1c"; return null; }; return boot(5)||boot(17); },
  amulet_fang:(x,y)=>{ const r=Math.hypot(x-16,(y-10)*1.3); if(Math.abs(r-9)<0.8&&y<17) return "#7a4a24";
    if(y>=17&&y<=28){ const w=(28-y)*0.3+0.6; if(Math.abs(x-16)<=w) return x<16?"#fffdf4":"#d8d0c0"; } return null; },
  rod_wood:(x,y)=>{ const al=((x-4)-(28-y))/Math.SQRT2, dd=Math.abs((x-4)+(y-28))/Math.SQRT2; if(al>=0&&al<=32&&dd<=1) return al<6?"#5a3418":"#b08050";
    if(x===27&&y>=5&&y<=14) return "#e8e8f0"; if(y>=15&&y<=17&&x>=26&&x<=28) return y===15?"#e8402c":"#fff"; return null; },
  rod_bamboo:(x,y)=>{ const al=((x-4)-(28-y))/Math.SQRT2, dd=Math.abs((x-4)+(y-28))/Math.SQRT2; if(al>=0&&al<=32&&dd<=1.2) return Math.round(al)%6===0?"#6a8a20":"#c8c060";
    if((x-9)**2+(y-23)**2<=5) return "#8a5a2e"; if(x===27&&y>=5&&y<=14) return "#e8e8f0"; return null; },
  rod_steel:(x,y)=>{ const al=((x-4)-(28-y))/Math.SQRT2, dd=Math.abs((x-4)+(y-28))/Math.SQRT2; if(al>=0&&al<=32&&dd<=1.2) return Math.round(al)%7===0?"#d0d8e0":"#2a3a6a";
    if((x-9)**2+(y-23)**2<=6) return "#a8b0bc"; if(x===27&&y>=5&&y<=14) return "#e8e8f0"; return null; },
  bat_wing:(x,y)=>{ if(y<6||y>26) return null; const top=6+Math.abs(x-16)*0.4, bot=26-((x%6)<3?4:0)-Math.abs(x-16)*0.5; if(x<4||x>28||y<top||y>bot) return null;
    return (x%6===0)?"#2a1f38":(y<top+2?"#5c4870":"#4a3a5c"); },
  potion_big:(x,y)=>{ if(y>=2&&y<=5&&x>=13&&x<=19) return "#e8b030"; if(y>=6&&y<=10&&x>=13&&x<=19) return "#d8e8f0";
    const e=((x-16)/11)**2+((y-20)/9.5)**2; if(e>1) return null; if(y<14) return "#d8e8f0"; return (x===9&&y<22)?"#ffb0b0":"#e8302c"; },
  bait:(x,y)=>{ if(y>=8&&y<=10&&x>=8&&x<=24) return "#5a3418"; if((y===7&&(x===11||x===12||x===19))||(y===6&&(x===12||x===13||x===18||x===19))) return "#ff9aa8";
    if(y>=11&&y<=26&&x>=9&&x<=23) return (y===26)?"#7a4a24":(x===11?"#e0a070":"#c87a48"); return null; },
  sword_iron:(x,y)=>{ const along=((x-6)-(y-26))/Math.SQRT2, d=Math.abs((x-6)+(y-26))/Math.SQRT2;
    if(along<0||along>28) return null; if(along<7) return d<=1.5?"#7a4a24":null; if(along<9) return d<=4?"#5a5a68":null;
    return d<=(along>25?1.2:2.2)?(d<0.8?"#f0f4f8":"#a8b0bc"):null; },
  helm_iron:(x,y)=>{ if(y>=22&&y<=24&&x>=6&&x<=26) return "#5a5a68"; if(x>=15&&x<=17&&y>=12&&y<=28) return "#6c6c7c";
    const e=((x-16)/10)**2+((y-22)/14)**2; if(e>1||y>22) return null; return x<13?"#d0d8e0":(x+y)%9===0?"#6c6c7c":"#9aa2ae"; },
  potion:(x,y)=>{ if(y>=4&&y<=7&&x>=14&&x<=18) return "#a87840"; if(y>=8&&y<=12&&x>=14&&x<=18) return "#d8e8f0";
    const e=((x-16)/8)**2+((y-20)/7.5)**2; if(e>1) return null; if(y<16) return "#d8e8f0"; return (x===12&&y<22)?"#ffb0b0":"#e8302c"; },
};
function makeIcon(f){
  const cv2=document.createElement("canvas"); cv2.width=cv2.height=32; const g=cv2.getContext("2d");
  const sp=img[ICON_SPRITE[f.id]]; if(sp){g.imageSmoothingEnabled=false;g.drawImage(sp,0,0,32,32);return cv2;}
  let colorAt=ICON_FALLBACK[f.id];
  if(colorAt){} else if(f.id==="cooked"){   // жареная рыба на палочке
    colorAt=(x,y)=>{ const inB=((x-17)/9)**2+((y-14)/5)**2<=1, inT=x<=9&&x>=4&&Math.abs(y-14)<=(9-x)*0.8+1;
      if(y>=19&&y<=20&&x>=4&&x<=28) return "#8a5a2a";
      if(inB){ if((x+y)%5===0) return "#5a2a10"; return y>15?"#e0a050":"#b8662a"; } if(inT) return "#8a4a1c"; return null; };
  } else if(f.id==="campfire"){   // иконка костра
    colorAt=(x,y)=>{ if(y>=22&&y<=25&&x>=6&&x<=26) return (x+y)%4?"#7a4a24":"#5a3418";
      const fl=Math.abs(x-16)<=(23-y)*0.42&&y>=8&&y<22; if(fl) return Math.abs(x-16)<=(23-y)*0.18?"#fff2a0":(Math.abs(x-16)<=(23-y)*0.3?"#ffb030":"#ff6a1a");
      if(y>=24&&y<=27&&(x===5||x===9||x===23||x===27)) return "#9a98a6"; return null; };
  } else if(f.id==="coin"){   // золотая монета
    colorAt=(x,y)=>{ const e=((x-16)/8.5)**2+((y-16)/8.5)**2; if(e>1) return null;
      if(e>0.7) return "#c8901e"; if((x-y)===-2&&x<15&&x>9) return "#fff4b0"; if(x>=15&&x<=17&&y>=12&&y<=20) return "#e0a828"; return "#ffd040"; };
  } else if(f.id==="wood"){   // бревно: кора и светлый срез с кольцами
    const cx=23, cy=16;
    colorAt=(x,y)=>{
      const e=((x-cx)/3.5)**2+((y-cy)/5.5)**2;
      if(e<=1){ const r=Math.sqrt(e); return r<0.3?"#a87840":(r>0.62&&r<0.8?"#b88a50":"#e6c088"); }
      if(x>=6&&x<cx&&y>=cy-5&&y<=cy+5){ if(y===cy-5) return "#a06a38"; if((x*3+y)%7===0) return "#5a3418"; return y>cy+2?"#6a3e1c":"#7d4c26"; }
      if(x>=4&&x<6&&y>=cy-4&&y<=cy+4) return "#6a3e1c";
      return null;
    };
  } else if(f.id==="boot"){
    colorAt=(x,y)=>{
      if(x>=11&&x<=18&&y>=5&&y<=19) return x===12?"#a8703a":(y===7?"#5a3418":"#7d4c26");
      if(x>=11&&x<=25&&y>=18&&y<=24) return y===24?"#3a2414":(x>=23&&y<=19?null:"#7d4c26");
      return null;
    };
  } else {
    const cx=18, cy=16, rx=f.len, ry=f.slim?4:6, tx=cx-rx;
    colorAt=(x,y)=>{
      const inBody=((x-cx)/rx)**2+((y-cy)/ry)**2<=1;
      const inTail=x<=tx+1&&x>=tx-6&&Math.abs(y-cy)<=(tx+1-x)*0.85+1;
      const inFin=y===cy-ry-1&&x>=cx-3&&x<=cx+2 || y===cy-ry-2&&x>=cx-2&&x<=cx;
      if(inBody){
        if(f.stripes&&x%4===0&&y<cy+2) return "#4f6a28";
        if(f.spots&&(x*7+y*3)%9===0&&y<cy+1) return f.belly;
        return y>cy+1?f.belly:f.body;
      }
      if(inTail||inFin) return f.fin;
      return null;
    };
  }
  const O="#1b1528";
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){
    const col=colorAt(x,y);
    if(col){g.fillStyle=col;g.fillRect(x,y,1,1);continue;}
    if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>colorAt(x+a,y+b))){g.fillStyle=O;g.fillRect(x,y,1,1);}
  }
  if(!ICON_FALLBACK[f.id]&&f.id!=="boot"&&f.id!=="wood"&&f.id!=="coin"&&f.id!=="cooked"&&f.id!=="campfire"){ g.fillStyle=O; g.fillRect(18+f.len-4,14,2,2); g.fillStyle="#fff"; g.fillRect(18+f.len-4,14,1,1);
    g.fillStyle="rgba(255,255,255,.55)"; g.fillRect(16,16-(f.slim?3:4),3,1); }
  return cv2;
}
const WOOD={id:"wood"}, ITEMS=[{id:"coin"},{id:"club"},{id:"sword_wood"},{id:"cap_leather"},{id:"armor_leather"},{id:"boots_leather"},{id:"amulet_fang"},{id:"sword_iron"},{id:"helm_iron"},{id:"rod_wood"},{id:"rod_bamboo"},{id:"rod_steel"},{id:"potion"},{id:"potion_big"},{id:"bait"},...FISH,{id:"cooked"},{id:"meat_raw"},{id:"meat_cooked"},WOOD,{id:"pelt"},{id:"fang"},{id:"bat_wing"},{id:"spider_silk"},{id:"golem_core"},{id:"sword_steel"}];
for(const k of ["club","pelt","fang","meat_raw","meat_cooked","potion","sword_wood","cap_leather","armor_leather","boots_leather","amulet_fang","sword_iron","helm_iron","potion_big","bait","rod_wood","rod_bamboo","rod_steel","bat_wing","spider_silk","golem_core","sword_steel"]) ICON_SPRITE[k]="item_"+k;
ICON_SPRITE.cooked="fish_cooked"; ICON_SPRITE.campfire="item_campfire";
ICON_SPRITE.coin="item_coin";
ICON_SPRITE.wood="item_wood";
const inv={};

