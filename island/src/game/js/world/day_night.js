// ================= День и ночь =================
const DAY_LEN=420;                 // секунд на сутки (7 минут)
let clock=8/24;                    // доля суток, 0 = полночь; старт в 8:00
const hourNow=()=>clock*24;
const ALWAYS_DAY=true;             // пока ночь выключена: на острове всегда день
function darkness(){               // 0 — день, 1 — глубокая ночь
  if(CAVE) return 0.94;
  if(ALWAYS_DAY) return 0;
  const h=hourNow();
  if(h>=7&&h<17.5) return 0;
  if(h>=17.5&&h<21) return (h-17.5)/3.5;
  if(h>=21||h<5) return 1;
  return 1-(h-5)/2;
}
function duskAmt(){                // оранжевый закат и розовый рассвет
  if(CAVE||ALWAYS_DAY) return 0;
  const h=hourNow();
  if(h>=16.5&&h<20.5) return Math.sin((h-16.5)/4*Math.PI);
  if(h>=4.5&&h<7.5) return Math.sin((h-4.5)/3*Math.PI)*0.6;
  return 0;
}
const isNight=()=>{ if(CAVE) return true; if(ALWAYS_DAY) return false; const h=hourNow(); return h>=20.5||h<5.5;};
let wasNight=null, lastClockText="";
function updateClock(dt){
  { const nc=netClock(); clock=ALWAYS_DAY?12/24:nc!==null?nc:(clock+dt/DAY_LEN)%1; }
  const night=isNight();
  if(wasNight!==null&&night!==wasNight){
    if(night) say("night_falls","night_sub"); else say("morning");
  }
  wasNight=night;
  const h=Math.floor(hourNow()), m=Math.floor((hourNow()-h)*60/10)*10;
  const txt=String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");
  if(txt!==lastClockText){
    lastClockText=txt;
    document.getElementById("clkTime").textContent=txt;
    const dayIcon=!night&&darkness()<0.6;
    document.getElementById("clkIcon").innerHTML=dayIcon
      ?'<circle cx="12" cy="12" r="5" fill="#ffd66b"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" stroke="#ffd66b" stroke-width="2"/>'
      :'<path d="M15 3a9 9 0 1 0 6 13A7 7 0 0 1 15 3z" fill="#e8e4ff"/>';
    document.getElementById("skipTime").textContent=tr(night?"skip_day":"skip_night");
  }
}
function skipTime(){
  clock=isNight()?6.2/24:20.4/24; netSetClock(clock);
  lastClockText="";
}

// ---- свет: тёмный «фильтр» на всю сцену, огни выжигают в нём тёплые пятна ----
const lightCv=document.createElement("canvas"), lightCtx=lightCv.getContext("2d");
const fireflies=[];
const WOLF_EYES={"wolf_se_0":[[30,18],[34,18]],"wolf_se_1":[[40,20]],"wolf_se_2":[[32,18],[37,18]],"wolf_se_3":[[35,19]],"wolf_ne_0":[],"wolf_ne_1":[],"wolf_ne_2":[],"wolf_ne_3":[]};
function collectLights(){
  const L=[];
  for(const f of fires) if(f.fuel>0){
    const p=proj(f.c.x-MX,f.c.y-MY,f.c.L+0.8), fl=Math.sin(T*11)*3+Math.sin(T*17.3)*2;
    L.push({x:p[0],y:p[1],r:82+fl,c:"255,186,110",a:1});
  }
  if(HUT){ const p=proj(HUT.hx+0.5-MX,HUT.hy+0.9-MY,HUT.Z+1.7); L.push({x:p[0],y:p[1],r:48,c:"255,200,120",a:0.75}); }
  const hp=proj(hero.x-MX,hero.y-MY,hero.z+1.5);
  if(CAVE){ L.push({x:hp[0],y:hp[1],r:78+Math.sin(T*9)*2,c:"255,206,150",a:0.95});      // в пещере у героя факел
    for(const r of remotes.values()){ const q=proj(r.x-MX,r.y-MY,r.z+1.5); L.push({x:q[0],y:q[1],r:66,c:"255,206,150",a:0.85}); }
    if(PORTAL){ const q=proj(PORTAL.x-MX,PORTAL.y-MY,PORTAL.L+1.2); L.push({x:q[0],y:q[1],r:70,c:"255,240,200",a:0.9}); }
    for(const c of cells) for(const n of c.props) if(n==="prop_crystal"){ const q=proj(c.x-MX,c.y-MY,c.L+0.6); L.push({x:q[0],y:q[1],r:46+Math.sin(T*2+c.x)*3,c:"130,210,255",a:0.8}); }
    for(const c of cells) if(c.t==="l"){ const q=proj(c.x-MX,c.y-MY,c.L); L.push({x:q[0],y:q[1],r:34+Math.sin(T*1.7+c.x*2)*3,c:"255,120,50",a:0.7}); }
    for(const a of animals) if(a.kind==="golem"&&a.alpha>0.2){ const q=proj(a.x-MX,a.y-MY,a.z+1.6); L.push({x:q[0],y:q[1],r:a.slamT>0?60:34,c:a.slamT>0?"255,120,90":"120,220,255",a:0.8}); } }
  else L.push({x:hp[0],y:hp[1],r:30,c:"170,185,255",a:0.35});
  for(const f of fireflies){ if(f.b<=0.05) continue; const p=proj(f.x-MX,f.y-MY,f.z); L.push({x:p[0],y:p[1],r:9,c:"210,255,130",a:0.55*f.b}); }
  return L;
}
function applyLighting(){
  const d=darkness(), du=duskAmt(); if(d<0.01&&du<0.01) return;
  const bw=buf.width, bh=buf.height;
  if(lightCv.width!==bw||lightCv.height!==bh){lightCv.width=bw;lightCv.height=bh;}
  let r=255,g=255,b=255; const mix=(c,t)=>{r+=(c[0]-r)*t;g+=(c[1]-g)*t;b+=(c[2]-b)*t;};
  mix([255,168,112],du*0.55); mix([58,68,138],d);
  const Lc=lightCtx; Lc.setTransform(1,0,0,1,0,0); Lc.globalCompositeOperation="source-over";
  Lc.fillStyle=`rgb(${r|0},${g|0},${b|0})`; Lc.fillRect(0,0,bw,bh);
  if(d>0.05){
    Lc.globalCompositeOperation="lighter";
    for(const li of collectLights()){
      const x=li.x+ROX, y=li.y+ROY, gr=Lc.createRadialGradient(x,y,0,x,y,li.r);
      gr.addColorStop(0,`rgba(${li.c},${li.a*d})`); gr.addColorStop(0.55,`rgba(${li.c},${li.a*d*0.45})`); gr.addColorStop(1,`rgba(${li.c},0)`);
      Lc.fillStyle=gr; Lc.fillRect(x-li.r,y-li.r,li.r*2,li.r*2);
    }
  }
  const B=bufCtx; B.save(); B.setTransform(1,0,0,1,0,0); B.globalCompositeOperation="multiply"; B.drawImage(lightCv,0,0); B.restore();
}
// после света: светлячки, светящиеся глаза волков, ореол костра
function drawNightFx(){
  const d=darkness(); if(d<0.3) return;
  worldTransform(); ctx.save();
  ctx.globalCompositeOperation="lighter";
  for(const f of fires) if(f.fuel>0){
    const p=proj(f.c.x-MX,f.c.y-MY,f.c.L+0.9), gr=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],22);
    gr.addColorStop(0,`rgba(255,150,60,${0.35*d})`); gr.addColorStop(1,"rgba(255,150,60,0)");
    ctx.fillStyle=gr; ctx.fillRect(p[0]-22,p[1]-22,44,44);
  }
  ctx.restore();
  for(const f of fireflies){ if(f.b<=0.05) continue; const p=proj(f.x-MX,f.y-MY,f.z);
    ctx.globalAlpha=f.b*d; ctx.fillStyle="#e4ff8a"; ctx.fillRect(Math.round(p[0]),Math.round(p[1]),1,1);
    ctx.globalAlpha=f.b*d*0.4; ctx.fillRect(Math.round(p[0])-1,Math.round(p[1]),3,1); ctx.fillRect(Math.round(p[0]),Math.round(p[1])-1,1,3); }
  ctx.globalAlpha=1;
  // глаза волков светятся в темноте: у спрайтов — их жёлтые пиксели, у заглушки — точка у морды
  for(const a of animals){ if(a.kind!=="wolf"||a.alpha<=0.3||!a.drawn) continue;
    const dr=a.drawn, pts=[];
    if(dr.sp){ for(const [ex,ey] of (WOLF_EYES[dr.name]||[])){ const x=dr.mirror?dr.x+Math.round(dr.sp.width/2)-ex-1:dr.x-Math.round(dr.sp.width/2)+ex; pts.push([x,dr.y-dr.sp.height+2+ey]); } }
    else { const dir=a.facing[1]==="e"?1:-1; pts.push([dr.x+dir*10,dr.y-15]); }
    for(const [x,y] of pts){
      ctx.globalAlpha=d*a.alpha; ctx.fillStyle="#fff070"; ctx.fillRect(x,y,1,1);
      ctx.globalAlpha=d*a.alpha*0.35; ctx.fillRect(x-1,y-1,3,3);
    }
  }
  ctx.globalAlpha=1;
}
function initFireflies(){
  const spots=cells.filter(c=>c.water||c.props.some(n=>n.startsWith("tree")));
  for(let i=0;i<18&&spots.length;i++){ const c=spots[(Math.random()*spots.length)|0];
    fireflies.push({bx:c.x+(Math.random()-.5),by:c.y+(Math.random()-.5),bz:walkZ(c)+0.6+Math.random()*1.6,s:Math.random()*10,x:0,y:0,z:0,b:0}); }
}
function updateFireflies(){
  const d=darkness();
  for(const f of fireflies){
    f.x=f.bx+Math.sin(T*0.6+f.s)*0.5; f.y=f.by+Math.cos(T*0.45+f.s*1.3)*0.5; f.z=f.bz+Math.sin(T*1.1+f.s)*0.3;
    f.b=d>0.4?Math.max(0,Math.sin(T*1.8+f.s*3)):0;
  }
}

