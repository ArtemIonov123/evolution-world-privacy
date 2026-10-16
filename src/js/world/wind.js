// ================= Ветер и листья =================
let T=0, windOn=!matchMedia("(prefers-reduced-motion: reduce)").matches;
const WIND=[1,-0.45];                         // направление ветра на карте (не зависит от поворота камеры)
const SWAY={tree_big:4, tree_small:3, bush:1, grass_tuft:1.5, grass_tuft_2:1.5, prop_reeds:2, prop_flowers:1.2, prop_bush_berry:1};
// сила ветра 0..1: спокойный фон + порывы
function windAt(t){
  const g=Math.sin(t*0.45)*0.6+Math.sin(t*0.17+1)*0.5+Math.sin(t*1.1+2)*0.2;
  return Math.max(0,Math.min(1,0.3+0.7*Math.max(0,g)));
}
// куда ветер дует на экране (по горизонтали), с учётом поворота карты
function windScreenX(){const u=WIND[0]*ca-WIND[1]*sa, v=WIND[0]*sa+WIND[1]*ca; return (u-v)/1.45}
// отклонение верхушки в пикселях для объекта в клетке (x,y): порыв идёт по карте волной
function swayAt(x,y,amp){
  if(!windOn) return 0;
  const w=windAt(T-(x+y)*0.12);
  return amp*(windScreenX()*w*(0.65+0.35*Math.sin(T*2.6+x*1.7+y*1.3)) + 0.25*Math.sin(T*1.3+x*2.1+y*0.7));
}
// рисует декор; деревья и трава гнутся полосками по 3 px (ствол на месте, крона сильнее)
function drawProp(im,name,px,py,c){
  if(name.startsWith("tree")){
    if((c.falling||c.grow<1)&&drawTreeSpecial(im,px,py,c)) return;
    if(c.shake>0) px+=Math.round(Math.sin(c.shake*70)*2*(c.shake/0.3));
  }
  // забор: середина его основания — ровно в центре клетки
  const x0=Math.round(px-im.width/2), y0=Math.round(name.startsWith("fence")?py-FENCE_BASE:py-im.height+4), amp=SWAY[name]||0;
  if(!amp||!windOn){ ctx.drawImage(im,x0,y0); return; }
  const s=swayAt(c.x,c.y,amp), base=im.height-4, strip=3;
  for(let r=0;r<im.height;r+=strip){
    const h=Math.min(strip,im.height-r), k=Math.max(0,(base-r)/base), off=Math.round(s*Math.pow(k,1.6));
    ctx.drawImage(im,0,r,im.width,h,x0+off,y0+r,im.width,h);
  }
}

// водный декор, пока нет картинок от GPT
function drawPropFallback(n,px,py){
  const R=(x,y,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(Math.round(px+x),Math.round(py+y),w,h)};
  if(n==="prop_lily_pad"){ for(const [x,y] of [[-8,-2],[3,-4],[-1,2]]){ R(x-1,y-1,9,5,"#1b1528"); R(x,y,7,3,"#4caa3c"); R(x+1,y,3,1,"#7cd05a"); } R(4,-6,3,2,"#ff9ac8"); return; }
  if(n==="prop_reeds"){ for(const x of [-5,-2,1,4]){ const h=18+((x*7)&7); R(x,-h,1,h,"#3c7a2c"); if(x%2===0) R(x-1,-h-1,3,6,"#7a4a24"); } R(-7,-1,15,2,"rgba(230,246,255,.6)"); return; }
  if(n==="prop_rock_water"){ R(-8,-7,16,9,"#1b1528"); R(-7,-6,14,7,"#8a8a96"); R(-5,-6,8,2,"#a8a8b4"); R(-6,-6,5,1,"#5a8a3c"); R(-10,1,20,2,"rgba(240,250,255,.7)"); return; }
  if(n==="prop_crystal"){ const gl=0.75+0.25*Math.sin(T*2+px*0.1);
    for(const [x,h,w] of [[-7,12,5],[-2,18,6],[4,11,5]]){ R(x-1,-h-1,w+2,h+1,"#1b1528"); R(x,-h,w,h,"#3aa8d8"); R(x,-h,2,h,`rgba(200,245,255,${gl})`); R(x+1,-h-1,w-2,1,"#e8fbff"); }
    R(-9,-1,19,2,"#1b1528"); return; }
  // постапо: заглушки, пока GPT не нарисовал prop_car / prop_tires / prop_barrier / prop_bones
  if(n==="prop_car"){ R(-25,-23,50,20,"#1b1528"); R(-24,-22,48,18,"#7a3a26"); R(-24,-22,48,3,"#9a5232"); R(-14,-32,30,11,"#1b1528"); R(-13,-31,28,10,"#6a3020");
    R(-11,-29,10,6,"#2a2a2e"); R(2,-29,10,6,"#2a2a2e"); R(-20,-15,8,3,"#4a2418"); R(6,-12,10,4,"#a8683a"); R(-22,-6,9,8,"#1b1528"); R(14,-6,9,8,"#1b1528"); R(-20,-4,5,4,"#3a3a3e"); R(16,-4,5,4,"#3a3a3e"); return; }
  if(n==="prop_tires"){ for(const [x,y] of [[-8,-6],[0,-4],[-4,-12]]){ R(x-6,y-4,13,8,"#1b1528"); R(x-5,y-3,11,6,"#2e2e34"); R(x-2,y-2,5,3,"#1b1528"); R(x-4,y-3,8,1,"#4a4a52"); } return; }
  if(n==="prop_barrier"){ R(-15,-16,30,17,"#1b1528"); R(-14,-15,28,15,"#9a9488"); R(-14,-15,28,3,"#bab4a6");
    for(let i=0;i<4;i++){ R(-12+i*7,-9,4,6,"#d8b830"); R(-8+i*7,-9,3,6,"#2a2a2e"); } return; }
  if(n==="prop_bones"){ R(-10,-4,20,4,"#1b1528"); R(-9,-3,18,2,"#d8d0b8"); for(let i=0;i<4;i++){ R(-6+i*4,-9,2,6,"#1b1528"); R(-6+i*4,-8,1,5,"#e8e0c8"); } R(7,-7,6,5,"#1b1528"); R(8,-6,4,3,"#e8e0c8"); R(9,-5,1,1,"#1b1528"); return; }
  R(-3,-6,6,6,"#ff00ff");
}
const FENCE_BASE=27;   // y середины основания забора в его картинке
const TREES=[]; // клетки с деревьями
for(const c of cells) for(const n of c.props) if(n.startsWith("tree")) TREES.push({c,big:n==="tree_big"});
for(const c of cells) c.leaves=[];
const leaves=[], streaks=[];
const LEAF_COLORS=[["#c8a860","#6a5428"],["#b89048","#5a4018"],["#a87a40","#4a3014"],["#8a6a48","#3a2a18"],["#c0b080","#5a5030"]];   // сухие листья
function updateWind(dt){
  if(!windOn) return;
  const w=windAt(T);
  // срываем листья с крон: чем сильнее ветер, тем чаще
  for(const tr of TREES){
    if(leaves.length>260) break;
    if(tr.c.grow<0.6||tr.c.falling) continue;
    if(Math.random()<dt*(0.2+1.2*w*w)){
      leaves.push({x:tr.c.x+(Math.random()-.5)*0.7, y:tr.c.y+(Math.random()-.5)*0.7,
        z:walkZ(tr.c)*LH+(tr.big?50+Math.random()*50:38+Math.random()*38),
        ph:Math.random()*6.28, spin:3+Math.random()*4, fall:9+Math.random()*7,
        col:LEAF_COLORS[(Math.random()*LEAF_COLORS.length)|0], drift:0.6+Math.random()*0.6});
    }
  }
  for(let i=leaves.length-1;i>=0;i--){
    const L=leaves[i], wl=windAt(T-(L.x+L.y)*0.12);
    L.ph+=dt*L.spin;
    // по ветру + покачивание поперёк (лист «планирует»)
    const flut=Math.sin(L.ph)*0.35;
    L.x+=(WIND[0]*wl*L.drift + WIND[1]*flut*0.5)*dt;
    L.y+=(WIND[1]*wl*L.drift - WIND[0]*flut*0.5)*dt;
    L.z-=(L.fall*(0.7+0.5*Math.abs(Math.sin(L.ph))))*dt;
    const c=cellAt(Math.round(L.x),Math.round(L.y)), gz=c?walkZ(c)*LH:-80;
    if(L.z<=gz){
      leaves.splice(i,1);
      if(c&&(!c.blocked||c.water)&&c.leaves.length<8) c.leaves.push({x:L.x,y:L.y,col:L.col,life:5+Math.random()*4,w:1+(Math.random()*2|0)});
    }
  }
  for(const c of cells) for(let i=c.leaves.length-1;i>=0;i--){ c.leaves[i].life-=dt; if(c.leaves[i].life<=0) c.leaves.splice(i,1); }
  // штрихи ветра в сильный порыв
  if(w>0.55&&streaks.length<10&&Math.random()<dt*3*(w-0.5)){
    const c=cells[(Math.random()*cells.length)|0];
    streaks.push({x:c.x-2, y:c.y+1, z:walkZ(c)*LH+15+Math.random()*45, t:0, life:1+Math.random()*0.6, len:10+Math.random()*12});
  }
  for(let i=streaks.length-1;i>=0;i--){const s=streaks[i]; s.t+=dt; s.x+=WIND[0]*2.6*dt; s.y+=WIND[1]*2.6*dt; if(s.t>=s.life) streaks.splice(i,1);}
}
// листья, лежащие на клетке (рисуются сразу после земли клетки)
function drawLandedLeaves(c){
  for(const L of c.leaves){
    const p=proj(L.x-MX,L.y-MY,walkZ(c)); ctx.globalAlpha=Math.min(1,L.life/1.5);
    const x=Math.round(p[0]), y=Math.round(p[1]);
    ctx.fillStyle=L.col[1]; ctx.fillRect(x,y+1,L.w+2,1); ctx.fillStyle=L.col[0]; ctx.fillRect(x,y,L.w+2,1);
  }
  ctx.globalAlpha=1;
}
// летящие листья и штрихи ветра — поверх сцены
function drawWindFx(){
  if(!windOn) return;
  worldTransform();
  for(const L of leaves){
    // лист кувыркается: ширина 1..4 px, снизу тёмная кромка
    const p=proj(L.x-MX,L.y-MY,L.z/LH), w=1+Math.round(Math.abs(Math.sin(L.ph))*3), x=Math.round(p[0]-w/2), y=Math.round(p[1]);
    ctx.globalAlpha=L.z<-20?Math.max(0,1+(L.z+20)/60):1;
    ctx.fillStyle=L.col[1]; ctx.fillRect(x,y+1,w,2);
    ctx.fillStyle=L.col[0]; ctx.fillRect(x,y,w,2);
  }
  ctx.globalAlpha=1;
  const dx=windScreenX(), dir=dx>=0?1:-1;
  for(const s of streaks){
    const p=proj(s.x-MX,s.y-MY,s.z/LH), k=s.t/s.life, a=Math.sin(k*Math.PI)*0.35;
    ctx.strokeStyle=`rgba(255,255,255,${a})`; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(Math.round(p[0])+.5,Math.round(p[1])+.5); ctx.lineTo(Math.round(p[0]-dir*s.len)+.5,Math.round(p[1]+s.len*0.2)+.5); ctx.stroke();
  }
}


