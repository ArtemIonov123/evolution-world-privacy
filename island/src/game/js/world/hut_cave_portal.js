// ================= Хижина и NPC (дед Богдан) =================
// Хижина 2×2 клетки. Если GPT нарисует hut_0..hut_3 (вид при каждом повороте камеры) — в покое рисуем спрайт,
// иначе (и всегда во время поворота) — строим домик кодом как 3D-коробку, поэтому видны все 4 стороны.
const HUT = MAP.hut ? {hx:MAP.hut[0], hy:MAP.hut[1]} : null;
if(HUT){
  HUT.cells=[[0,0],[1,0],[0,1],[1,1]].map(([dx,dy])=>cellAt(HUT.hx+dx,HUT.hy+dy));
  for(const c of HUT.cells){ c.hutPart=true; c.blocked=true; c.props=[]; }
  HUT.Z=HUT.cells[0].L;
}
const NPCC = MAP.npc ? cellAt(MAP.npc[0],MAP.npc[1]) : null;
const npc = NPCC ? {x:NPCC.x, y:NPCC.y, z:walkZ(NPCC), facing:"se", t:0, turnT:3} : null;
if(NPCC){ NPCC.npcHere=true; NPCC.blocked=true; NPCC.props=[]; }
// ================= Пещера: вход на острове, выход в пещере =================
const PORTAL=(()=>{
  const p=CAVE?MAP.exit:MAP.cave, ok=c=>c&&!wet(c)&&!c.hutPart&&!c.npcHere&&!c.merchHere&&!c.stall&&!c.st;
  let c=p&&cellAt(p[0],p[1]);
  if(!ok(c)){   // вход не задан — сами выбираем сухую клетку подальше от старта, с проходом рядом
    const st=MAP.start, free=n=>n&&!n.blocked&&!wet(n);
    const cand=cells.filter(k=>ok(k)&&!k.props.some(n=>n.startsWith("tree"))&&DIRS4.some(([dx,dy])=>{ const n=cellAt(k.x+dx,k.y+dy); return free(n)&&Math.abs(walkZ(n)-walkZ(k))<=1; }));
    cand.sort((a,b)=>(b.L*1.5+Math.min(9,Math.hypot(b.x-st[0],b.y-st[1])))-(a.L*1.5+Math.min(9,Math.hypot(a.x-st[0],a.y-st[1])))||a.y-b.y||a.x-b.x);
    c=cand[0]||null; }
  if(c){ c.portal=true; c.props=[]; c.blocked=true; }
  return c;
})();
// где появиться после перехода: у входа/выхода или (после обморока в пещере) у хижины
let SPAWN_FIXED=false;
{ let sp=null; try{ sp=sessionStorage.getItem("island_spawn"); sessionStorage.removeItem("island_spawn"); }catch(e){}
  const near=t=>t&&[...Array(9)].map((_,i)=>cellAt(t.x+(i%3)-1,t.y+((i/3)|0)-1)).filter(n=>n&&!n.blocked&&!wet(n)&&Math.abs(walkZ(n)-walkZ(t))<=1)
    .sort((a,b)=>depthOf(b.x-MX,b.y-MY)-depthOf(a.x-MX,a.y-MY))[0];
  const spot=sp==="portal"?near(PORTAL):sp==="faint"?near(NPCC):null;
  if(spot){ hero.x=spot.x; hero.y=spot.y; hero.z=walkZ(spot); SPAWN_FIXED=true; } }
function usePortal(){
  if(!PORTAL||fainting) return;
  fainting=true; hero.path=[]; document.getElementById("fade").style.opacity="1"; say(CAVE?"cave_leave":"cave_enter");
  saveNow();
  try{ sessionStorage.setItem("island_zone",CAVE?"island":"cave"); sessionStorage.setItem("island_spawn","portal"); }catch(e){}
  setTimeout(()=>location.reload(),1100);
}
function saveNow(){ try{ lastSaveJSON=""; saveT=0; saving=false; tickSave(0); }catch(e){} }
function drawPortal(c){
  worldTransform(); ctx.imageSmoothingEnabled=false;
  const [px,py]=proj(c.x-MX,c.y-MY,c.L), im=img[CAVE?"cave_exit":"cave_entrance"];
  if(im){ ctx.drawImage(im,Math.round(px-im.width/2),Math.round(py-im.height+12)); return; }
  const R=(x,y,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(Math.round(px+x),Math.round(py+y),w,h)};
  if(!CAVE){   // каменный холм с тёмным проходом
    const rocks=[[-22,-14,14,14],[-14,-26,12,14],[-4,-32,12,12],[8,-26,12,14],[14,-14,10,14],[-20,-4,40,8]];
    for(const [x,y,w,h] of rocks){ R(x-1,y-1,w+2,h+2,"#1b1528"); R(x,y,w,h,"#8a8494"); R(x,y,w,2,"#aaa4b4"); R(x+1,y+h-3,w-2,2,"#6a6474"); }
    R(-9,-20,18,20,"#1b1528"); R(-7,-18,14,18,"#0a0710"); R(-5,-22,10,3,"#1b1528");
    R(-12,-30,4,3,"#5a8a3c"); R(9,-22,5,2,"#5a8a3c");
    const fl=Math.sin(T*12)>0?1:0; R(13,-22,2,8,"#6a4422"); R(12,-26-fl,4,4,"#ffb040"); R(13,-27-fl,2,2,"#fff0a0");
  } else {     // выход: столб света сверху и верёвочная лестница
    ctx.save(); ctx.globalAlpha=0.28+0.06*Math.sin(T*2); ctx.fillStyle="#fff2c8";
    ctx.beginPath(); ctx.moveTo(px-10,py-70); ctx.lineTo(px+10,py-70); ctx.lineTo(px+18,py+4); ctx.lineTo(px-18,py+4); ctx.closePath(); ctx.fill(); ctx.restore();
    R(-7,-62,2,64,"#6a4422"); R(5,-62,2,64,"#6a4422"); for(let y=-58;y<0;y+=8) R(-6,y,12,2,"#a07040");
  }
}
function pickPortal(wx,wy){ if(!PORTAL) return false; const [fx,fy]=proj(PORTAL.x-MX,PORTAL.y-MY,PORTAL.L); return Math.abs(wx-fx)<=22&&wy>=fy-(CAVE?60:36)&&wy<=fy+8; }
let quest="none";          // none → active → done
let rodLevel=1;            // 2 — удочка от Богдана: редкая рыба чаще, клюёт быстрее
const PRICE={karas:2, okun:3, shchuka:6, gold:25, boot:1, cooked:8};
const smoke=[];

const rotN=n=>[n[0]*ca-n[1]*sa, n[0]*sa+n[1]*ca];
const facesCam=n=>{const [u,v]=rotN(n); return u+v>0.001};
const litLeft=n=>{const [u,v]=rotN(n); return (u-v)<0};
function poly(pts,fill,stroke){
  ctx.beginPath();
  pts.forEach((p,i)=>{const q=proj(p[0],p[1],p[2]); i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});
  ctx.closePath(); if(fill){ctx.fillStyle=fill;ctx.fill();} if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
}
function seg(a,b,col){const p=proj(a[0],a[1],a[2]),q=proj(b[0],b[1],b[2]);ctx.strokeStyle=col;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();}
// коробка: видимые бока + верх; deco(n,a,b,z0,z1) — украшение на боку
function box(x0,x1,y0,y1,z0,z1,cl,cd,ct,deco){
  const sides=[{n:[1,0],a:[x1,y0],b:[x1,y1]},{n:[-1,0],a:[x0,y1],b:[x0,y0]},{n:[0,1],a:[x1,y1],b:[x0,y1]},{n:[0,-1],a:[x0,y0],b:[x1,y0]}];
  for(const s of sides){ if(!facesCam(s.n)) continue;
    poly([[s.a[0],s.a[1],z0],[s.b[0],s.b[1],z0],[s.b[0],s.b[1],z1],[s.a[0],s.a[1],z1]], litLeft(s.n)?cl:cd, "#1b1528");
    if(deco) deco(s.n,s.a,s.b,z0,z1); }
  poly([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]], ct, "#1b1528");
}
function hutGeom(){
  const x0=HUT.hx-MX-0.42, x1=HUT.hx-MX+1.42, y0=HUT.hy-MY-0.42, y1=HUT.hy-MY+1.42, Z0=HUT.Z;
  return {x0,x1,y0,y1,xc:(x0+x1)/2,yc:(y0+y1)/2,Z0,Zw:Z0+2.6,Zr:Z0+4.7};
}
function hutChimney(g){
  box(g.x0-0.38,g.x0-0.02,g.yc+0.08,g.yc+0.46,g.Z0,g.Zr+0.35,"#a2a0ae","#76747f","#34323c",(n,a,b,z0,z1)=>{
    for(let z=z0+0.5;z<z1;z+=0.55) seg([a[0],a[1],z],[b[0],b[1],z],"#5e5c68");   // кладка
  });
}
function hutWoodpile(g){
  box(g.x0+0.3,g.x1-0.3,g.y0-0.42,g.y0-0.02,g.Z0,g.Z0+1.1,"#8a5a2e","#6a4220","#7d4c26",(n,a,b,z0,z1)=>{
    if(Math.abs(n[1])<0.5) return;   // торцы брёвен — на длинной стороне
    for(let j=0;j<3;j++)for(let i=0;i<5;i++){
      const t=(i+0.5+(j%2)*0.25)/5.3, p=proj(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,z0+0.2+j*0.33);
      ctx.fillStyle="#e2bc84"; ctx.fillRect(Math.round(p[0])-1,Math.round(p[1])-1,3,3);
      ctx.fillStyle="#a8743c"; ctx.fillRect(Math.round(p[0]),Math.round(p[1]),1,1);
    }
  });
}
function hutWalls(g){
  const {x0,x1,y0,y1,yc,Z0,Zw,Zr}=g;
  const walls=[
    {n:[0,1], a:[x1,y1], b:[x0,y1], kind:"door"},
    {n:[0,-1],a:[x0,y0], b:[x1,y0], kind:"plain"},
    {n:[1,0], a:[x1,y0], b:[x1,y1], kind:"window", gable:true},
    {n:[-1,0],a:[x0,y1], b:[x0,y0], kind:"plain", gable:true},
  ];
  for(const w of walls){
    if(!facesCam(w.n)) continue;
    const lit=litLeft(w.n), A=w.a, B=w.b, mid=[(A[0]+B[0])/2,(A[1]+B[1])/2];
    const P=(t,z)=>[A[0]+(B[0]-A[0])*t, A[1]+(B[1]-A[1])*t, z];
    poly([[A[0],A[1],Z0],[B[0],B[1],Z0],[B[0],B[1],Zw],[A[0],A[1],Zw]], lit?"#a26c3e":"#7e5230");
    for(let z=Z0+0.45; z<Zw-0.05; z+=0.42) seg([A[0],A[1],z],[B[0],B[1],z], lit?"#7a4c26":"#5c3a1c");   // брёвна
    if(w.gable){ poly([[A[0],A[1],Zw],[B[0],B[1],Zw],[mid[0],mid[1],Zr]], lit?"#b8844c":"#8e6236", "#1b1528");
      for(let k=1;k<4;k++) seg(P(k/4,Zw),[...P(k/4,Zw).slice(0,2), Zw+(Zr-Zw)*(1-Math.abs(k/4-0.5)*2)], lit?"#9a6a3a":"#76502a"); }
    poly([[A[0],A[1],Z0],[B[0],B[1],Z0],[B[0],B[1],Z0+0.45],[A[0],A[1],Z0+0.45]], lit?"#9a98a6":"#76747f");   // каменный цоколь
    poly([[A[0],A[1],Z0],[B[0],B[1],Z0],[B[0],B[1],Zw],[A[0],A[1],Zw]], null, "#1b1528");
    if(w.kind==="door"){
      poly([P(0.36,Z0+0.12),P(0.64,Z0+0.12),P(0.64,Z0+2.0),P(0.36,Z0+2.0)],"#4a2c14","#1b1528");
      seg(P(0.5,Z0+0.2),P(0.5,Z0+1.95),"#2e1a0a");
      const h=proj(...P(0.59,Z0+1.0)); ctx.fillStyle="#ffd66b"; ctx.fillRect(Math.round(h[0]),Math.round(h[1]),1,2);
      // фонарь над дверью
      const l=proj(...P(0.72,Z0+2.25)); ctx.fillStyle="#1b1528"; ctx.fillRect(Math.round(l[0])-2,Math.round(l[1])-3,5,6);
      ctx.fillStyle=`rgba(255,214,107,${0.75+0.25*Math.sin(T*3)})`; ctx.fillRect(Math.round(l[0])-1,Math.round(l[1])-2,3,4);
    }
    if(w.kind==="window"){
      poly([P(0.3,Z0+1.0),P(0.7,Z0+1.0),P(0.7,Z0+1.95),P(0.3,Z0+1.95)],"#2a1608");
      poly([P(0.34,Z0+1.08),P(0.66,Z0+1.08),P(0.66,Z0+1.87),P(0.34,Z0+1.87)],"#9fd4ff");
      seg(P(0.5,Z0+1.08),P(0.5,Z0+1.87),"#2a1608"); seg(P(0.34,Z0+1.47),P(0.66,Z0+1.47),"#2a1608");
      poly([P(0.26,Z0+0.82),P(0.74,Z0+0.82),P(0.74,Z0+1.0),P(0.26,Z0+1.0)],"#6a3e18","#1b1528");   // ящик с цветами
      for(let i=0;i<4;i++){const p=proj(...P(0.32+i*0.12,Z0+1.06)); ctx.fillStyle=i%2?"#ff7aa0":"#ffd66b"; ctx.fillRect(Math.round(p[0]),Math.round(p[1])-1,2,2);}
    }
  }
}
function hutRoof(g){
  const {x0,x1,y0,y1,yc,Zw,Zr}=g, ov=0.22, ze=Zw-0.35;
  const slopes=[
    {n:[0,-1], pts:[[x0-ov,y0-ov,ze],[x1+ov,y0-ov,ze],[x1+ov,yc,Zr],[x0-ov,yc,Zr]]},
    {n:[0,1],  pts:[[x1+ov,y1+ov,ze],[x0-ov,y1+ov,ze],[x0-ov,yc,Zr],[x1+ov,yc,Zr]]},
  ];
  slopes.sort((a,b)=>(facesCam(a.n)?1:0)-(facesCam(b.n)?1:0));     // дальний скат — первым
  for(const s of slopes){
    const front=facesCam(s.n), [a,b,c,d]=s.pts;
    poly(s.pts, front?"#b5523a":"#8e3e2c", "#1b1528");
    for(let k=1;k<5;k++){ const t=k/5;   // ряды черепицы
      seg([a[0]+(d[0]-a[0])*t,a[1]+(d[1]-a[1])*t,a[2]+(d[2]-a[2])*t],[b[0]+(c[0]-b[0])*t,b[1]+(c[1]-b[1])*t,b[2]+(c[2]-b[2])*t], front?"#8e3e2c":"#6e2e20"); }
  }
  seg([x0-ov,yc,Zr],[x1+ov,yc,Zr],"#5a2418");
}
function drawHutProcedural(){
  const g=hutGeom();
  poly([[g.x0-0.15,g.y0-0.15,g.Z0],[g.x1+0.15,g.y0-0.15,g.Z0],[g.x1+0.15,g.y1+0.15,g.Z0],[g.x0-0.15,g.y1+0.15,g.Z0]],"rgba(20,10,40,.22)");
  const chimFront=facesCam([-1,0]), pileFront=facesCam([0,-1]);
  if(!pileFront) hutWoodpile(g);
  if(!chimFront) hutChimney(g);
  hutWalls(g); hutRoof(g);
  if(pileFront) hutWoodpile(g);
  if(chimFront) hutChimney(g);
}
// у спрайта хижины ищем нижнюю точку и центр, чтобы точно поставить на клетки
const hutBBox={};
function spriteBottom(im){
  if(hutBBox[im.src.length+"_"+im.width]) return hutBBox[im.src.length+"_"+im.width];
  const c=document.createElement("canvas"); c.width=im.width; c.height=im.height; const g=c.getContext("2d"); g.drawImage(im,0,0);
  const d=g.getImageData(0,0,im.width,im.height).data; let bottom=0, minX=im.width, maxX=0;
  for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++) if(d[(y*im.width+x)*4+3]>128){ bottom=Math.max(bottom,y); minX=Math.min(minX,x); maxX=Math.max(maxX,x); }
  return hutBBox[im.src.length+"_"+im.width]={bottom,cx:(minX+maxX)/2};
}
function drawHut(){
  worldTransform(); ctx.imageSmoothingEnabled=false;
  const q0=((Math.floor(rot+1e-6)%4)+4)%4, f=rot-Math.floor(rot+1e-6);
  const spA=img["hut_"+q0], spB=img["hut_"+((q0+1)%4)];
  if(spA&&spB){
    // точка опоры — центр основания хижины; нижний угол ромба 2×2 всегда на 34 px ниже центра
    const c=proj(HUT.hx+0.5-MX,HUT.hy+0.5-MY,HUT.Z), baseY=c[1]+34;
    const put=(sp,alpha,sxScale)=>{
      if(alpha<=0.01) return;
      const bb=spriteBottom(sp), w=sp.width*sxScale;
      ctx.globalAlpha=alpha;
      ctx.drawImage(sp,Math.round(c[0]-w/2),Math.round(baseY-bb.bottom-1),Math.round(w),sp.height);
      ctx.globalAlpha=1;
      return [Math.round(c[0]-sp.width/2),Math.round(baseY-bb.bottom-1)];
    };
    if(f<1e-3){ const xy=put(spA,1,1); HUT.spr={x:xy[0],y:xy[1],q:q0}; }
    else {
      // во время поворота — как переворот карточки: до середины текущий вид сужается, после — следующий расширяется.
      // Картинка всё время непрозрачная, поэтому ничего не мигает и не просвечивает.
      const sm=t=>t*t*(3-2*t);
      if(f<0.5) put(spA,1,1-0.42*sm(f/0.5));
      else put(spB,1,0.58+0.42*sm((f-0.5)/0.5));
      HUT.spr=null;
    }
  } else { drawHutProcedural(); HUT.spr=null; }
  if(windOn||smoke.length) drawSmoke();
}
// дым из трубы, сносится ветром (в экранных координатах мира)
// верх нарисованной трубы на спрайтах хижины (пиксели картинки); на видах 0 и 1 труба скрыта за крышей
const HUT_CHIMNEY={2:[108,53],3:[40,30]};
function chimneyTop(){
  if(HUT.spr&&!anim){ const c=HUT_CHIMNEY[HUT.spr.q]; if(c) return [HUT.spr.x+c[0],HUT.spr.y+c[1]-2]; }
  const g=hutGeom(); return proj(g.x0-0.2,g.yc+0.27,g.Zr+0.4);
}
function updateSmoke(dt){
  if(!HUT) return;
  HUT.puff=(HUT.puff||0)-dt;
  if(HUT.puff<=0&&!anim){ HUT.puff=0.35+Math.random()*0.25; const o=chimneyTop();
    smoke.push({sx:o[0]+(Math.random()-.5)*2, sy:o[1], t:0, life:3+Math.random()}); }
  const w=windOn?windAt(T):0.15, wx=windOn?windScreenX():0.3;
  for(let i=smoke.length-1;i>=0;i--){ const p=smoke[i]; p.t+=dt;
    p.sy-=(10-p.t*1.6)*dt; p.sx+=wx*(4+16*w)*dt; if(p.t>p.life) smoke.splice(i,1); }
}
function drawSmoke(){
  for(const p of smoke){
    const k=p.t/p.life, r=Math.round(2+k*5);
    ctx.globalAlpha=(1-k)*0.55; ctx.fillStyle=k<0.3?"#e8e4f0":"#d4d0e0";
    ctx.fillRect(Math.round(p.sx-r),Math.round(p.sy-r),r*2,r*2);
    ctx.fillRect(Math.round(p.sx-r-1),Math.round(p.sy-r+1),r*2+2,r*2-2);
  }
  ctx.globalAlpha=1;
}

