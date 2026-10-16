// ================= Костёр =================
const fires=[]; const FIRE_FUEL=150, WOOD_FUEL=90, FIRE_COST=3, FIRE_SAFE=3.0, FIRE_SCARE=4.0;
let placing=false, building=null;
const fmtTime=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")};
// костёр хранит момент, когда догорит: так его одинаково видят все игроки
function addFire(c,until,local){
  const f={c,until,synced:!local,get fuel(){return (this.until-Date.now())/1000},set fuel(v){this.until=Date.now()+v*1000}};
  fires.push(f); c.fire=f; c.blocked=true; if(local) netFire(f); return f;
}
function freeCell(c){ return c&&!wet(c)&&!c.blocked&&!c.hutPart&&!c.npcHere&&!c.merchHere&&!c.stall&&!c.fire; }
// идём к клетке рядом с целью и выполняем действие
function goAdjacent(t,fn,sayKey){
  const near=Math.max(Math.abs(hero.x-t.x),Math.abs(hero.y-t.y));
  if(near<=1.05&&near>0.3&&!hero.path.length){ faceTo(t.x,t.y); fn(); return; }
  const spots=[];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){ if(!dx&&!dy) continue; const n=cellAt(t.x+dx,t.y+dy); if(n&&!n.blocked&&Math.abs(walkZ(n)-walkZ(t))<=1) spots.push(n); }
  const score=n=>Math.hypot(n.x-hero.x,n.y-hero.y)+(depthOf(n.x-MX,n.y-MY)<depthOf(t.x-MX,t.y-MY)?2:0);
  spots.sort((a,b)=>score(a)-score(b));
  for(const n of spots){
    const p=findPath(Math.round(hero.x),Math.round(hero.y),n.x,n.y); if(!p) continue;
    hero.path=p.length?p:[[n.x,n.y]]; hero.pendingAction=()=>{faceTo(t.x,t.y);fn();};
    marker={x:t.x,y:t.y,t:0,ok:true};
    follow=true; document.getElementById("follow").setAttribute("aria-pressed","true");
    say(sayKey); return;
  }
  marker={x:t.x,y:t.y,t:0,ok:false}; say("no_reach");
}
function startPlacing(){ if((inv.wood||0)<FIRE_COST) return; placing=true; stopFishing(); stopChopping(); say("place_fire"); }
function cancelPlacing(){ placing=false; say("hint","hint_sub"); }
function placeFireAt(c){
  if(!freeCell(c)||c.props.length||c.st||c.stump){ marker={x:c.x,y:c.y,t:0,ok:false}; say("bad_place"); return; }
  placing=false;
  goAdjacent(c,()=>{ building={c,t:0}; say("building"); },"go_build");
}
function updateFires(dt){
  if(building){
    building.t+=dt;
    if(Math.random()<dt*12) chips.push({x:building.c.x,y:building.c.y,z:walkZ(building.c)*LH+2,vx:(Math.random()-.5)*0.6,vy:(Math.random()-.5)*0.6,vz:20+Math.random()*30,t:0,life:0.6,col:"#ffb040",spark:true});
    if(building.t>=1.4){
      const c=building.c; building=null;
      if(freeCell(c)&&(inv.wood||0)>=FIRE_COST){
        inv.wood-=FIRE_COST; if(!inv.wood) delete inv.wood; renderInv();
        addFire(c,Date.now()+FIRE_FUEL*1000,true);
        say("fire_lit"); prog.st.fires++;
      }
    }
  }
  for(const f of fires){
    if(f.fuel>0){
      if(Math.random()<dt*7) chips.push({x:f.c.x+(Math.random()-.5)*0.2,y:f.c.y+(Math.random()-.5)*0.2,z:walkZ(f.c)*LH+12,
        vx:WIND[0]*0.3*(windOn?windAt(T):0)+(Math.random()-.5)*0.3,vy:WIND[1]*0.3*(windOn?windAt(T):0)+(Math.random()-.5)*0.3,vz:25+Math.random()*25,t:0,life:0.7+Math.random()*0.6,col:Math.random()<0.5?"#ffd040":"#ff8a2a",spark:true});
    }
  }
}
function drawFire(c){
  const f=c.fire, p=proj(c.x-MX,c.y-MY,c.L), x=Math.round(p[0]), y=Math.round(p[1]), burning=f.fuel>0;
  const sp=img[burning?"campfire_"+(Math.floor(T*8)%3):"campfire_off"];
  if(sp){ ctx.drawImage(sp,x-Math.round(sp.width/2),y-sp.height+8); return; }
  const R=(a,b,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(a,b,w,h)};
  ctx.fillStyle="rgba(20,10,40,.28)"; ctx.beginPath(); ctx.ellipse(x,y,11,5.5,0,0,Math.PI*2); ctx.fill();
  const stones=[...Array(8)].map((_,i)=>{const a=i/8*Math.PI*2; return [x+Math.round(Math.cos(a)*9),y+Math.round(Math.sin(a)*4.5)];});
  const stone=([sx,sy])=>{R(sx-2,sy-2,5,4,"#1b1528");R(sx-1,sy-1,3,2,"#9a98a6");R(sx-1,sy-1,2,1,"#c0bec8");};
  stones.filter(s=>s[1]<y).forEach(stone);
  // поленья шалашиком
  R(x-6,y-2,12,2,"#1b1528"); R(x-5,y-2,10,1,"#7a4a24"); R(x-2,y-5,2,5,"#1b1528"); R(x+1,y-5,2,5,"#1b1528"); R(x-1,y-4,1,4,"#8a5a2e"); R(x+1,y-4,1,4,"#6a3e1c");
  if(burning){
    const h=11+Math.round(Math.sin(T*13)*2+Math.sin(T*7.3)*1.5), sw=Math.sin(T*9)*1.5;
    const flame=(w,hh,col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x-w,y-2);ctx.quadraticCurveTo(x-w*0.8,y-hh*0.55,x+sw,y-2-hh);ctx.quadraticCurveTo(x+w*0.8,y-hh*0.55,x+w,y-2);ctx.closePath();ctx.fill();};
    flame(6,h,"#ff6a1a"); flame(4,h*0.72,"#ffb030"); flame(2,h*0.42,"#fff2a0");
  } else {
    R(x-4,y-2,8,2,"#3a2a2a"); if(Math.sin(T*3+c.x)>0.6) R(x-1+Math.round(Math.sin(T)*2),y-2,1,1,"#c84020");
  }
  stones.filter(s=>s[1]>=y).forEach(stone);
}

// ---- меню костра (то же окно, что и диалог) ----
let dlgKind="npc", fireOpen=null, fireMsg=null;
const COOKABLE=["karas","okun","shchuka"];
const rawCount=()=>COOKABLE.reduce((a,id)=>a+(inv[id]||0),0)+(inv.meat_raw||0);
function openFireMenu(f){
  dialogOpen=true; dlgKind="fire"; fireOpen=f; fireMsg=null;
  document.getElementById("dialog").hidden=false; document.getElementById("hotbar").hidden=true; document.querySelector(".ctrl").hidden=true;
  const g=document.getElementById("portrait").getContext("2d");
  g.setTransform(1,0,0,1,0,0); g.fillStyle="#3d3257"; g.fillRect(0,0,64,64);
  const ic=img.item_campfire||ICONS.campfire; if(ic){ g.imageSmoothingEnabled=false; g.drawImage(ic,0,0,64,64); }
  renderDialog();
}
function renderFireMenu(){
  const f=fireOpen, opts=[], burning=f.fuel>0;
  const text=fireMsg?tr(fireMsg[0],fireMsg[1]):burning?tr("fire_text",{t:fmtTime(f.fuel)}):tr("fire_out_text");
  const n=rawCount();
  if(burning&&n>0) opts.push(["opt_cook",{n},()=>{
    const nf=n-(inv.meat_raw||0), nm=inv.meat_raw||0;
    for(const id of COOKABLE) delete inv[id]; delete inv.meat_raw;
    if(nf) inv.cooked=(inv.cooked||0)+nf; if(nm) inv.meat_cooked=(inv.meat_cooked||0)+nm; renderInv();
    if(nf) floats.push({key:"plus",p:{n:nf,fish:"#fish_cooked"},col:"#ffb070",t:0});
    if(nm) floats.push({key:"plus",p:{n:nm,fish:"#fish_meat_cooked"},col:"#ffb070",t:-0.25});
    for(let i=0;i<14;i++) chips.push({x:f.c.x,y:f.c.y,z:walkZ(f.c)*LH+10,vx:(Math.random()-.5)*0.8,vy:(Math.random()-.5)*0.8,vz:30+Math.random()*30,t:0,life:0.8,col:"#ffe0a0",spark:true});
    fireMsg=["cooked_text",{n}]; renderDialog();
  }]);
  if((inv.wood||0)>0) opts.push([burning?"opt_add_wood":"opt_relight",null,()=>{
    inv.wood--; if(!inv.wood) delete inv.wood; renderInv();
    f.fuel=Math.max(0,f.fuel)+WOOD_FUEL; netFire(f); fireMsg=["wood_added",{t:fmtTime(f.fuel)}]; renderDialog();
  }]);
  if((inv.cooked||inv.meat_cooked)&&hero.hp<HP_MAX) opts.push(["opt_eat",null,()=>{eatCooked(inv.meat_cooked?"meat_cooked":"cooked"); fireMsg=["ate_fire",{hp:hero.hp}]; renderDialog();}]);
  opts.push(["opt_leave",null,closeDialog]);
  document.getElementById("dlgName").textContent=tr("fire_name");
  document.getElementById("dlgText").textContent=text;
  const box=document.getElementById("dlgOpts"); box.innerHTML="";
  for(const [k,p,fn] of opts){ const b=document.createElement("button"); b.className="btn"; b.textContent=tr(k,p); b.onclick=fn; box.appendChild(b); }
}

// кнопки внизу: «Костёр» / «Отмена»
let actState="";
function syncActions(){
  const canBuild=(inv.wood||0)>=FIRE_COST&&!placing&&!fishing&&!dialogOpen&&!building&&fires.filter(f=>f.fuel>0).length<3;
  const st=(placing?"p":"")+(canBuild?"b":"");
  if(st===actState) return; actState=st;
  document.getElementById("actions").hidden=!placing;
  document.getElementById("buildFire").hidden=!canBuild;
  document.getElementById("cancelPlace").hidden=!placing;
}

