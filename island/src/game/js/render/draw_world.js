// ---------- Отрисовка ----------
const cv=document.getElementById("cv"), mainCtx=cv.getContext("2d");
let ctx=mainCtx;
const spriteLayer=document.createElement("canvas"), spriteCtx=spriteLayer.getContext("2d");
const dprNow=()=>window.devicePixelRatio||1;
// Кадр собирается в буфере 1:1 в «игровых» пикселях, потом выводится на экран одной картинкой.
// Так между плитками не бывает щелей, и ничего не мерцает, когда камера едет.
const buf=document.createElement("canvas"), bufCtx=buf.getContext("2d");
let RS=1, ROX=0, ROY=0;
function worldTransform(){ctx.setTransform(RS,0,0,RS,ROX,ROY)}

// порядок отрисовки: дальние клетки раньше; герой — после «своей» клетки
let hutAnchor=null;
function drawOrder(){
  for(const c of cells) c.depth=depthOf(c.x-MX,c.y-MY);
  cells.sort((a,b)=>a.depth-b.depth || (a.x-a.y)-(b.x-b.y));
  if(HUT) hutAnchor=HUT.cells.reduce((a,b)=>b.depth>a.depth?b:a);
  // герой рисуется после самой ближней к камере клетки из тех, на которых он стоит
  let anchor=null;
  for(const [ox,oy] of [[0,0],[.45,0],[-.45,0],[0,.45],[0,-.45]]){
    const c=cellAt(Math.round(hero.x+ox),Math.round(hero.y+oy));
    if(c&&(!anchor||c.depth>anchor.depth)&&Math.abs(walkZ(c)-hero.z)<1.2) anchor=c;
  }
  return anchor;
}

// клетка попадает на экран? (с запасом на деревья вверх и стенки вниз)
function cellVisible(c){
  const p=proj(c.x-MX,c.y-MY,c.L), x=p[0]+ROX, y=p[1]+ROY, w=ctx.canvas.width, h=ctx.canvas.height;
  return x>-80 && x<w+80 && y+c.L*LH+50>0 && y-140<h;
}
function stairSprite(dir,q){
  const [a,b]=rotQ(STAIR_DIR[dir],q);
  if(a===-1) return "stairs_left";
  if(b===-1) return "stairs_right";
  const back=a===1?"stairs_back_left":"stairs_back_right";
  return img[back]?back:"block_stone_path";
}

// лестница, которая поднимается к камере (видна «со спины»): три ступеньки кодом
function drawStairsBack(c){
  const [dx,dy]=STAIR_DIR[c.st], px=-dy, py=dx, X=c.x-MX, Y=c.y-MY, L=c.L;
  const P=(t,s,z)=>proj(X+dx*t+px*s,Y+dy*t+py*s,z);
  const poly=(pts,fill)=>{ ctx.beginPath(); ctx.moveTo(...pts[0]); for(const p of pts.slice(1)) ctx.lineTo(...p); ctx.closePath(); ctx.fillStyle=fill; ctx.fill(); ctx.strokeStyle="#1b1528"; ctx.lineWidth=1; ctx.stroke(); };
  const side=depthOf(px,py)>0?0.5:-0.5;
  for(let k=0;k<3;k++){
    const t0=-0.5+k/3, t1=t0+1/3, z=L+(k+1)/3;
    poly([P(t0,side,z),P(t1,side,z),P(t1,side,L),P(t0,side,L)],"#7a5232");              // бок
    poly([P(t1,-.5,z),P(t1,.5,z),P(t1,.5,L),P(t1,-.5,L)],"#958a74");                     // торец к камере
    poly([P(t0,-.5,z),P(t1,-.5,z),P(t1,.5,z),P(t0,.5,z)],k%2?"#c2b79e":"#b5aa92");       // ступень
  }
}
function drawSprites(anchor){
  worldTransform(); ctx.imageSmoothingEnabled=false;
  const q=quarter();
  for(const c of cells){
    if(c!==anchor&&c!==hutAnchor&&c!==NPCC&&c!==MERCHC&&!cellVisible(c)) continue;
    const X=c.x-MX, Y=c.y-MY;
    for(let z=0;z<c.L;z++){
      if(wet(c)&&z===c.L-1) continue;
      const p=proj(X,Y,z+1), top=z===c.L-1;
      const name=top?TOP_SPRITE[c.t]:CAVE?"block_cave_wall":(z<2?"block_rock":"block_grass");
      ctx.drawImage(img[name],Math.round(p[0]-HW),Math.round(p[1]-HH-TOP_Y));
    }
    if(c.st){ const sn=stairSprite(c.st,q); if(sn==="block_stone_path") drawStairsBack(c); else { const p=proj(X,Y,c.L+1); ctx.drawImage(img[sn],Math.round(p[0]-HW),Math.round(p[1]-HH-TOP_Y)); } }
    if(wet(c)){ drawWater(c); drawWaterFx(c); if(c.pier) drawMarketProp(c.pier,c); }
    if(c.leaves.length) drawLandedLeaves(c);
    if(c.fire) drawFire(c);
    if(c.stump) drawStump(c);
    if(c.portal) drawPortal(c);
    if(c.props.length){
      const p=proj(X,Y,wet(c)?walkZ(c):c.L);
      for(const name of c.props){
        if(MARKET_PROPS.test(name)){ drawMarketProp(name,c); continue; }
        let n=name; if(q%2===1){ if(n==="fence_left") n="fence_right"; else if(n==="fence_right") n="fence_left"; }
        if(img[n]) drawProp(img[n],n,p[0],p[1],c); else drawPropFallback(n,p[0],p[1]);
      }
    }
    if(c===anchor) drawHero();
    if(HUT&&c===hutAnchor) drawHut();
    if(npc&&c===NPCC) drawNPC();
    if(merch&&c===MERCHC) drawMerchant();
    if(c.ents) for(const a of c.ents) drawEnt(a);
  }
}

