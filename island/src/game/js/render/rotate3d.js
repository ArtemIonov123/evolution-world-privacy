// ---- 3D-режим во время поворота: сплошные грани с текстурами из спрайтов ----
const TEX={}, TN=34, SH=9;
function buildTextures(){
  const srcData=im=>{const c=document.createElement("canvas");c.width=im.width;c.height=im.height;const g=c.getContext("2d");g.drawImage(im,0,0);return g.getImageData(0,0,im.width,im.height)};
  const make=(w,h,fn,src)=>{const c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d"),o=g.createImageData(w,h);
    for(let j=0;j<h;j++)for(let i=0;i<w;i++){let [px,py]=fn(i,j);px=Math.max(0,Math.min(src.width-1,px|0));py=Math.max(0,Math.min(src.height-1,py|0));
      const si=(py*src.width+px)*4,di=(j*w+i)*4;o.data[di]=src.data[si];o.data[di+1]=src.data[si+1];o.data[di+2]=src.data[si+2];o.data[di+3]=255;}
    g.putImageData(o,0,0);return c};
  for(const n of ["block_grass","block_grass_2","block_grass_dark","block_stone_path","block_dirt","block_rock",...Object.values(TOP_SPRITE)].filter((n,i,a)=>a.indexOf(n)===i&&img[n])){
    const s=srcData(img[n]);
    TEX[n+"_top"]=make(TN,TN,(i,j)=>{const a=(i+.5)/TN,b=(j+.5)/TN;return [32+32*a-32*b,2+17*a+17*b]},s);
    TEX[n+"_L"]=make(TN,SH,(i,r)=>{const a=(i+.5)/TN;return [32*a,Math.floor(19+17*a)+1+r]},s);
    TEX[n+"_R"]=make(TN,SH,(i,r)=>{const a=(i+.5)/TN;return [63.5-32*a,Math.floor(19+17*a)+1+r]},s);
  }
}
function draw3D(anchor){
  const S=RS, OX=ROX, OY=ROY;
  const sub=(p,q)=>[p[0]-q[0],p[1]-q[1]];
  function face(tex,p0,e1,e2){const w=tex.width,h=tex.height;
    ctx.setTransform(S*e1[0]/w,S*e1[1]/w,S*e2[0]/h,S*e2[1]/h,OX+S*p0[0],OY+S*p0[1]);
    ctx.drawImage(tex,-0.6,-0.6,w+1.2,h+1.2);}
  const SIDES=[{n:[1,0],dx:1,dy:0,ax:0,ay:1},{n:[0,1],dx:0,dy:1,ax:1,ay:0},{n:[-1,0],dx:0,dy:0,ax:0,ay:1},{n:[0,-1],dx:0,dy:0,ax:1,ay:0}];
  ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality="high";
  for(const c of cells){
    if(c!==anchor&&c!==hutAnchor&&c!==NPCC&&c!==MERCHC&&!cellVisible(c)){ continue; }
    const X0=c.x-MX-.5, Y0=c.y-MY-.5;
    for(const sd of SIDES){
      const nu=sd.n[0]*ca-sd.n[1]*sa, nv=sd.n[0]*sa+sd.n[1]*ca; if(nu+nv<=0.001) continue;
      const nb=cellAt(c.x+sd.n[0],c.y+sd.n[1]), nh=nb?(wet(nb)?nb.L-1:nb.L):0, side=(nu-nv)<0?"_L":"_R", sx=X0+sd.dx, sy=Y0+sd.dy;
      for(let z=nh;z<c.L;z++){const p0=proj(sx,sy,z+1);face(TEX[(CAVE?"block_cave_wall":z<2?"block_rock":"block_grass")+side],p0,sub(proj(sx+sd.ax,sy+sd.ay,z+1),p0),sub(proj(sx,sy,z),p0));}
      if(c.st){const p0=proj(sx,sy,c.L+.5);face(TEX["block_stone_path"+side],p0,sub(proj(sx+sd.ax,sy+sd.ay,c.L+.5),p0),sub(proj(sx,sy,c.L),p0));}
    }
    const Z=c.st?c.L+.5:c.L, top=c.st?"block_stone_path":TOP_SPRITE[c.t], p0=proj(X0,Y0,Z);
    if(c.fire){ worldTransform(); drawFire(c); }
    if(wet(c)){ worldTransform(); drawWater(c); drawWaterFx(c); if(c.pier) drawMarketProp(c.pier,c); } else face(TEX[top+"_top"],p0,sub(proj(X0+1,Y0,Z),p0),sub(proj(X0,Y0+1,Z),p0));
    if(c.stump){ worldTransform(); drawStump(c); }
    if(c.portal) drawPortal(c);
    if(c.props.length){
      const ctr=proj(c.x-MX,c.y-MY,wet(c)?walkZ(c):c.L);
      for(const name of c.props){
        if(name.startsWith("fence")){ // забор плавно наклоняется вдоль своей оси
          const im=img.fence_left, ax=name==="fence_left"?[0,1]:[1,0];
          const u=ax[0]*ca-ax[1]*sa, v=ax[0]*sa+ax[1]*ca; let ex=(u-v)*HW, ey=(u+v)*HH; if(ey<0){ex=-ex;ey=-ey}
          ctx.setTransform(S*(-ex/32),S*((17-ey)/32),0,S,OX+S*ctr[0],OY+S*ctr[1]); ctx.drawImage(im,-im.width/2,-FENCE_BASE);
        } else if(MARKET_PROPS.test(name)) drawMarketProp(name,c);
        else { worldTransform(); if(img[name]) drawProp(img[name],name,ctr[0],ctr[1],c); else drawPropFallback(name,ctr[0],ctr[1]); }
      }
    }
    if(c===anchor){ worldTransform(); drawHero(); }
    if(HUT&&c===hutAnchor) drawHut();
    if(npc&&c===NPCC) drawNPC();
    if(merch&&c===MERCHC) drawMerchant();
    if(c.ents) for(const a of c.ents) drawEnt(a);
  }
}

