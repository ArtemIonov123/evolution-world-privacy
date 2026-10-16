// ================= Вода =================
const hash=(x,y,k)=>{const s=Math.sin(x*127.1+y*311.7+k*74.7)*43758.5453;return s-Math.floor(s)};
const DIRS4=[[1,0],[0,1],[-1,0],[0,-1]];
const EDGE_CORNERS=[[1,2],[2,3],[3,0],[0,1]]; // какие углы ромба образуют сторону +x, +y, -x, -y
// текстура воды из спрайта water_<shallow|deep>_<0..2> (ромб как верх блока), 3 кадра анимации
const WATER_TEX={};
function waterTex(kind,f){
  const k=kind+f; if(k in WATER_TEX) return WATER_TEX[k];
  const im=img[`water_${kind}_${f}`]; if(!im) return WATER_TEX[k]=null;
  const sc=document.createElement("canvas"); sc.width=im.width; sc.height=im.height; const sg=sc.getContext("2d"); sg.drawImage(im,0,0);
  const sd=sg.getImageData(0,0,im.width,im.height), N=32, c=document.createElement("canvas"); c.width=c.height=N;
  const g=c.getContext("2d"), o=g.createImageData(N,N);
  // ромб в спрайте: верх y=0, высота 32; берём середину без рваных краёв
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){ const a=0.08+0.84*(i+.5)/N,b=0.08+0.84*(j+.5)/N, px=Math.max(0,Math.min(im.width-1,(32+32*a-32*b)|0)), py=Math.max(0,Math.min(im.height-1,(16*a+16*b)|0));
    const si=(py*im.width+px)*4, di=(j*N+i)*4; for(let t=0;t<3;t++) o.data[di+t]=sd.data[si+t]; o.data[di+3]=255; }
  g.putImageData(o,0,0); return WATER_TEX[k]=c;
}
const WATER_COL={deep:["#3c84c8","#4a95d4"],shallow:["#5cb8d8","#6cc6e0"]};
function drawWater(c){
  const Z=walkZ(c), X=c.x-MX, Y=c.y-MY, e=0.52, kind=c.shallow?"shallow":"deep";
  const shore=DIRS4.some(([dx,dy])=>{const n=cellAt(c.x+dx,c.y+dy);return !wet(n)});
  const q=[proj(X-e,Y-e,Z),proj(X+e,Y-e,Z),proj(X+e,Y+e,Z),proj(X-e,Y+e,Z)];
  const tex=waterTex(kind,Math.floor(T*2.2+hash(c.x,c.y,3)*3)%3);
  if(tex){ ctx.save(); ctx.beginPath();ctx.moveTo(...q[0]);for(let i=1;i<4;i++)ctx.lineTo(...q[i]);ctx.closePath(); ctx.clip();
    const p0=proj(X-.5,Y-.5,Z), p1=proj(X+.5,Y-.5,Z), p3=proj(X-.5,Y+.5,Z), N=tex.width;
    ctx.transform((p1[0]-p0[0])/N,(p1[1]-p0[1])/N,(p3[0]-p0[0])/N,(p3[1]-p0[1])/N,p0[0],p0[1]);
    ctx.imageSmoothingEnabled=false; ctx.drawImage(tex,-0.5,-0.5,N+1,N+1); ctx.restore(); }
  else { ctx.fillStyle=WATER_COL[kind][shore?1:0];
    ctx.beginPath();ctx.moveTo(...q[0]);for(let i=1;i<4;i++)ctx.lineTo(...q[i]);ctx.closePath();ctx.fill();
    if(c.shallow){ for(let k=0;k<3;k++){ const p=proj(X-0.35+0.7*hash(c.x,c.y,k+20),Y-0.35+0.7*hash(c.x,c.y,k+30),Z); ctx.fillStyle="rgba(232,214,160,.45)"; ctx.fillRect(Math.round(p[0]-2),Math.round(p[1]),4,2); } } }
  if(!tex){
  // блики: короткие светлые черточки медленно плывут и мерцают
  for(let k=0;k<4;k++){
    const hx=hash(c.x,c.y,k), hy=hash(c.x,c.y,k+9);
    const u=(((hx+T*0.05*(k%2?1:-1))%1)+1)%1;
    const p=proj(X-0.42+0.84*u, Y-0.42+0.84*hy, Z), a=Math.max(0,Math.sin(T*1.7+hx*20))*0.75;
    ctx.fillStyle=`rgba(205,238,255,${a})`; ctx.fillRect(Math.round(p[0]-2),Math.round(p[1]),3+(k%2)*2,1);
  }
  }
  // пена у берега
  const cr=[proj(X-.5,Y-.5,Z),proj(X+.5,Y-.5,Z),proj(X+.5,Y+.5,Z),proj(X-.5,Y+.5,Z)];
  DIRS4.forEach(([dx,dy],i)=>{
    const n=cellAt(c.x+dx,c.y+dy); if(wet(n)) return;
    const [a,b]=EDGE_CORNERS[i], al=0.35+0.3*Math.sin(T*2.2+c.x*1.3+c.y*0.7+i);
    ctx.strokeStyle=`rgba(235,248,255,${al})`; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(cr[a][0],cr[a][1]+1); ctx.lineTo(cr[b][0],cr[b][1]+1); ctx.stroke();
  });
}

