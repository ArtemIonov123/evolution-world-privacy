// ================= Торговец Збышек у пристани =================
const MERCH_POS=MAP.merchant!==undefined?MAP.merchant:[17,12], STALL_POS=MAP.stall!==undefined?MAP.stall:[18,12,"stall_left"], PIER_POS=MAP.pier!==undefined?MAP.pier:[16,12,"pier_right"];
const MERCHC=MERCH_POS&&cellAt(MERCH_POS[0],MERCH_POS[1])&&!cellAt(MERCH_POS[0],MERCH_POS[1]).water?cellAt(MERCH_POS[0],MERCH_POS[1]):null;
const merch=MERCHC?{x:MERCHC.x,y:MERCHC.y,z:walkZ(MERCHC),facing:"sw",t:0,turnT:4}:null;
if(MERCHC){ MERCHC.merchHere=true; MERCHC.props=[]; MERCHC.blocked=true; }
{ const s=STALL_POS&&cellAt(STALL_POS[0],STALL_POS[1]); if(s&&!s.water&&!s.merchHere){ s.props=[STALL_POS[2]]; s.stall=true; s.blocked=true; } }
{ const p=PIER_POS&&cellAt(PIER_POS[0],PIER_POS[1]); if(p&&p.water) p.pier=PIER_POS[2]; }
const SHOP=[{id:"potion",p:8},{id:"potion_big",p:18},{id:"bait",p:3,n:5},{id:"rod_wood",p:6},{id:"rod_bamboo",p:25},{id:"rod_steel",p:70},{id:"sword_iron",p:45},{id:"helm_iron",p:30}];
const SELL_P={spider_silk:4,golem_core:40,sword_steel:30,rod_wood:2,rod_bamboo:10,rod_steel:30,bat_wing:3,club:2,sword_wood:6,cap_leather:3,boots_leather:4,armor_leather:7,amulet_fang:8,sword_iron:22,helm_iron:15,potion:4,potion_big:9,wood:1,
  pelt:4,fang:3,meat_raw:2,meat_cooked:5};
const sellPrice=id=>OVR[id]?SELL_P[id]:CFG.sell[id]!=null?CFG.sell[id]:(SELL_P[id]??PRICE[id]??0);
let shopTab="buy", shopMsg=null;
// левый/правый вариант пропа меняется при повороте камеры на 90°
const swapLR=n=>n.endsWith("_left")?n.slice(0,-5)+"_right":n.endsWith("_right")?n.slice(0,-6)+"_left":n;
const MARKET_PROPS=/^(stall|pier)_/;
function drawMarketProp(n,c){
  const q=quarter(); if(q%2===1) n=swapLR(n);
  worldTransform(); ctx.imageSmoothingEnabled=false;
  const X=c.x-MX, Y=c.y-MY, im=img[n];
  if(n.startsWith("pier")){
    const z=c.L-0.12, [px,py]=proj(X,Y,z);
    if(im){ ctx.drawImage(im,Math.round(px-im.width/2),Math.round(py-17)); return; }
    // мостки кодом: доски поперёк длинной оси
    const along=n==="pier_right"?[1,0]:[0,1], across=[along[1],along[0]], P=(a,b)=>proj(X+along[0]*a+across[0]*b,Y+along[1]*a+across[1]*b,z);
    for(const [s,col] of [[0.06,"#1b1528"],[0,"#a07040"]]) { ctx.fillStyle=col; ctx.beginPath();
      const pts=[P(-.5-s,-.32-s),P(.5+s,-.32-s),P(.5+s,.32+s),P(-.5-s,.32+s)]; ctx.moveTo(...pts[0]); for(const p of pts.slice(1)) ctx.lineTo(...p); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle="#6a4422"; ctx.lineWidth=1;
    for(let i=-0.375;i<=0.38;i+=0.25){ const a=P(i,-.32), b=P(i,.32); ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); }
    for(const a of [-.45,.45]) for(const b of [-.28,.28]){ const p=P(a,b); ctx.fillStyle="#3a2414"; ctx.fillRect(Math.round(p[0])-1,Math.round(p[1]),3,6); }
    return;
  }
  const [px,py]=proj(X,Y,c.L);
  if(im){ ctx.drawImage(im,Math.round(px-im.width/2),Math.round(py-im.height+17)); return; }
  // прилавок кодом: стойка и полосатый навес
  const R=(x,y,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(Math.round(px+x),Math.round(py+y),w,h)};
  R(-15,-14,30,14,"#1b1528"); R(-14,-13,28,12,"#8a5a2e"); R(-14,-13,28,2,"#b07a40");
  R(-14,-34,2,21,"#1b1528"); R(12,-34,2,21,"#1b1528");
  for(let i=0;i<8;i++) R(-17+i*4.25,-40,5,7,i%2?"#f4efe0":"#d8403a"); R(-17,-41,34,1,"#1b1528"); R(-17,-33,34,1,"#1b1528");
  R(-10,-17,3,4,"#e8302c"); R(-5,-18,3,5,"#5ab0e8"); R(1,-17,5,4,"#c89058"); R(8,-17,3,4,"#e8302c");
}
function updateMerchant(dt){
  if(!merch) return; merch.t+=dt;
  const d=Math.hypot(hero.x-merch.x,hero.y-merch.y);
  if(winKind==="shop"||d<3.5) merch.facing=facingTo(merch,hero.x,hero.y);
  else { merch.turnT-=dt; if(merch.turnT<=0){ merch.turnT=3+Math.random()*4; merch.facing=["sw","se","sw","nw"][(Math.random()*4)|0]; } }
  if(winKind==="shop"&&shopNpc!=="npc"&&d>3.2) closeWin();
  if(winKind==="shop"&&shopNpc==="npc"&&typeof NPCC!=="undefined"&&NPCC&&Math.hypot(hero.x-NPCC.x,hero.y-NPCC.y)>3.5) closeWin();
}
function drawMerchant(){
  worldTransform(); ctx.imageSmoothingEnabled=false;
  const [fx,fy]=proj(merch.x-MX,merch.y-MY,merch.z);
  ctx.fillStyle="rgba(20,10,40,.28)"; ctx.beginPath(); ctx.ellipse(fx,fy,10,5,0,0,Math.PI*2); ctx.fill();
  const frame=Math.sin(merch.t*1.7)>0.7?1:0;
  let sp=img[`merchant_${merch.facing}_${frame}`], mirror=false, temp=false;
  if(!sp&&merch.facing[1]==="w"){ sp=img[`merchant_${merch.facing[0]}e_${frame}`]; mirror=true; }
  if(!sp){ sp=img[`npc_${merch.facing[0]}e_${frame}`]; mirror=merch.facing[1]==="w"; temp=true; }
  ctx.save(); ctx.translate(Math.round(fx),Math.round(fy));
  if(sp){ if(mirror) ctx.scale(-1,1); if(temp) ctx.filter="hue-rotate(95deg) saturate(1.3)"; ctx.drawImage(sp,-Math.round(sp.width/2),-sp.height+2); ctx.filter="none"; }
  else drawOldMan(ctx,merch.facing,merch.t,false);
  ctx.restore();
  if(winKind!=="shop"){   // золотая монетка над головой — «здесь торгуют»
    const ex=Math.round(fx), ey=Math.round(fy-52-Math.abs(Math.sin(T*2.6))*3), w=Math.max(1,Math.round(Math.abs(Math.cos(T*2.2))*4));
    ctx.fillStyle="#1b1528"; ctx.fillRect(ex-w-1,ey-1,2*w+2,10); ctx.fillStyle="#ffd040"; ctx.fillRect(ex-w,ey,2*w,8); ctx.fillStyle="#fff4b0"; ctx.fillRect(ex-w,ey+1,1,3);
  }
}
function pickMerchant(wx,wy){
  if(!merch) return false; const [fx,fy]=proj(merch.x-MX,merch.y-MY,merch.z);
  return Math.abs(wx-fx)<=12&&wy>=fy-50&&wy<=fy+4;
}
function goTrade(){
  if(!merch) return;
  if(Math.hypot(hero.x-merch.x,hero.y-merch.y)<1.6&&!hero.path.length){ openShop(); return; }
  goAdjacent(MERCHC,openShop,"go_trade");
}
function openShop(){ shopNpc="merchant"; if(dialogOpen) closeDialog(); shopTab="buy"; shopMsg=["shop_hello"]; if(winKind==="shop") renderWin(); else openWin("shop"); faceTo(merch.x,merch.y); }
function shopPortrait(){
  const c=mkEl("canvas","sportrait"); c.width=c.height=64; const g=c.getContext("2d"); g.imageSmoothingEnabled=false;
  g.fillStyle="#3d3257"; g.fillRect(0,0,64,64);
  if(img.merchant_portrait) g.drawImage(img.merchant_portrait,0,0,64,64);
  else if(img.npc_portrait){ g.filter="hue-rotate(95deg) saturate(1.3)"; g.drawImage(img.npc_portrait,0,0,64,64); g.filter="none"; }
  return c;
}
function buy(s){
  if((inv.coin||0)<s.p){ shopMsg=["shop_no_money"]; renderWin(); return; }
  inv.coin-=s.p; if(!inv.coin) delete inv.coin;
  const n=s.n||1; inv[s.id]=(inv[s.id]||0)+n; const g=GEAR[s.id]; if(g&&!equip[g.slot]) equipItem(s.id);
  floats.push({key:"plus",p:{n,fish:"#fish_"+s.id},col:"#ffe0a0",t:0});
  shopMsg=["shop_bought",{item:"#fish_"+s.id}]; renderInv();
}
function sell(id,all){
  const n=all?inv[id]:1, c=n*sellPrice(id); if(!n||!c) return;
  inv[id]-=n; if(!inv[id]) delete inv[id];
  addCoins(c); shopMsg=["shop_sold",{c}]; renderInv();
}
function openShopNpc(){ shopNpc="npc"; if(dialogOpen) closeDialog(); shopTab="buy"; shopMsg=["shop_hello"]; if(winKind==="shop") renderWin(); else openWin("shop"); }
function renderShop(body){
  if(shopNpc==="npc") shopTab="buy";
  const head=mkEl("div","shead"); if(shopNpc!=="npc") head.appendChild(shopPortrait());
  const tx=mkEl("div"); tx.appendChild(mkEl("b",null,tr(shopNpc==="npc"?"seller_npc":"merch_name"))); tx.appendChild(mkEl("p",null,tr(shopMsg?shopMsg[0]:"shop_hello",shopMsg&&shopMsg[1]))); head.appendChild(tx);
  body.appendChild(head);
  const tabs=mkEl("div","tabs");
  for(const k of shopNpc==="npc"?["buy"]:["buy","sell"]){ const b=mkEl("button","btn"+(shopTab===k?" on":""),tr("shop_"+k)); b.type="button"; b.setAttribute("aria-pressed",shopTab===k);
    b.onclick=()=>{ shopTab=k; bagSel=null; renderWin(); }; tabs.appendChild(b); }
  tabs.appendChild(mkEl("span","coins",tr("shop_coins",{c:inv.coin||0}))); body.appendChild(tabs);
  const list=shopTab==="buy"?shopList().map(s=>({id:s.id,s})):ITEMS.filter(f=>inv[f.id]&&f.id!=="coin"&&sellPrice(f.id)>0).map(f=>({id:f.id}));
  if(!list.length){ body.appendChild(mkEl("p","muted",tr("shop_nothing"))); return; }
  if(bagSel&&!list.some(e=>e.id===bagSel)) bagSel=null;
  if(!bagSel) bagSel=list[0].id;
  const grid=mkEl("div","grid");
  for(const e of list){ const b=slotBtn(e.id,shopTab==="buy"?(e.s.n||1):inv[e.id],()=>{ bagSel=e.id; renderWin(); },bagSel===e.id);
    const pr=mkEl("em",null,String(shopTab==="buy"?e.s.p:sellPrice(e.id))); b.appendChild(pr); grid.appendChild(b); }
  body.appendChild(grid);
  const id=bagSel, det=mkEl("div","detail"), row=mkEl("div","drow"), im=mkEl("img"); im.src=iconURL(id); im.alt=""; row.appendChild(im);
  const t2=mkEl("div"), s=shopList().find(x=>x.id===id);
  t2.appendChild(mkEl("b",null,tr("fish_"+id)+(shopTab==="buy"&&s.n>1?" ×"+s.n:shopTab==="sell"&&inv[id]>1?" ×"+inv[id]:"")));
  t2.appendChild(mkEl("p",null,itemDesc(id))); row.appendChild(t2); det.appendChild(row);
  const acts=mkEl("div","acts"), act=(label,fn,big,dis)=>{ const b=mkEl("button","btn"+(big?" big":""),label); b.type="button"; b.onclick=fn; b.disabled=!!dis; acts.appendChild(b); };
  if(shopTab==="buy") act(tr("shop_buy_for",{c:s.p}),()=>buy(s),true,(inv.coin||0)<s.p);
  else { act(tr("shop_sell_one",{c:sellPrice(id)}),()=>sell(id,false),true); if(inv[id]>1) act(tr("shop_sell_all",{c:sellPrice(id)*inv[id]}),()=>sell(id,true),false); }
  det.appendChild(acts); body.appendChild(det);
}

// 12345 → 12.3K, 1000000 → 1M (как в играх); до 10 000 — полностью
function shortNum(n){ n=Math.floor(+n||0); if(n<10000) return String(n);
  for(const [v,u] of [[1e12,"T"],[1e9,"B"],[1e6,"M"],[1e3,"K"]]) if(n>=v){ const x=n/v; return (x>=100?Math.floor(x):Math.floor(x*10)/10).toString().replace(/\.0$/,"")+u; }
  return String(n); }
function renderHdCoins(){
  const n=inv.coin||0, el=document.getElementById("hdCoinN"); if(!el) return;
  if(el.textContent!==shortNum(n)){ el.textContent=shortNum(n); document.getElementById("hdCoins").setAttribute("aria-label",tr("shop_coins",{c:n})); }
  const im=document.getElementById("hdCoinIcon"); if(im&&!im.getAttribute("src")&&typeof ICONS!=="undefined"&&ICONS.coin) im.src=iconURL("coin");
}
setInterval(renderHdCoins,500);
function renderInv(){
  refreshUI(); renderHdCoins();
  const el=document.getElementById("inv"), got=ITEMS.filter(f=>inv[f.id]);
  if(!got.length){el.innerHTML=`<b>${tr("catch_title")}</b><div class="empty">${tr("catch_empty")}</div>`;return}
  el.innerHTML=`<b>${tr("catch_title")}</b><div class="slots">`+got.map(f=>{const n=tr("fish_"+f.id);
    if(EDIBLE[f.id]) return `<div class="slot edible" data-id="${f.id}" role="button" tabindex="0" title="${n}: ${tr(f.id==="potion"?"drink_hint":"eat_hint")}">`+`<img alt="${n}" src="${ICONS[f.id].toDataURL()}"><span>${inv[f.id]}</span></div>`;
    return `<div class="slot" title="${n}"><img alt="${n}" src="${ICONS[f.id].toDataURL()}"><span>${inv[f.id]}</span></div>`}).join("")+'</div>';
}
const waitTime=()=>(2+Math.random()*4)*rodSpeed()*fishSpeed()*((inv.bait||0)>0?0.6:1);
function pickFish(){
  const wf=f=>fishW(f)*({shchuka:rodRare(),gold:rodRare()*1.1,boot:1/rodRare()}[f.id]||1)*((inv.bait||0)>0?({shchuka:1.6,gold:2,boot:0.5}[f.id]||1):1);
  let r=Math.random()*FISH.reduce((a,f)=>a+wf(f),0);
  for(const f of FISH){ if((r-=wf(f))<=0) return f; } return FISH[0];
}

let fishing=null;            // {water, state, t, timer, bx, by, fish}
const ripples=[], floats=[];
function stopFishing(){ fishing=null; hero.pendingFish=null; }
// клик по воде: идём к ближайшему берегу рядом с этой клеткой
function goFish(w){
  if(!equip.rod){ say("need_rod","need_rod_sub"); marker={x:w.x,y:w.y,t:0,ok:false}; return; }
  const shore=[];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const n=cellAt(w.x+dx,w.y+dy); if(n&&!n.blocked) shore.push(n);
  }
  // вода позади героя — штраф: так видно и лицо героя, и поплавок
  const score=n=>Math.hypot(n.x-hero.x,n.y-hero.y)+(depthOf(w.x-MX,w.y-MY)<depthOf(n.x-MX,n.y-MY)-0.1?4:0);
  shore.sort((a,b)=>score(a)-score(b));
  for(const n of shore){
    const p=findPath(Math.round(hero.x),Math.round(hero.y),n.x,n.y);
    if(!p) continue;
    hero.path=p.length?p:[[n.x,n.y]]; hero.pendingFish={water:w};
    marker={x:w.x,y:w.y,t:0,ok:true};
    follow=true; document.getElementById("follow").setAttribute("aria-pressed","true");
    say("go_fish");
    return;
  }
  marker={x:w.x,y:w.y,t:0,ok:false}; say("no_water");
}
function faceTo(x,y){
  const dx=x-hero.x, dy=y-hero.y, u=dx*ca-dy*sa, v=dx*sa+dy*ca;
  hero.facing=((u+v)>=0?"s":"n")+((u-v)>=0?"e":"w");
}
function startFishing(w){
  marker=null;
  // заброс подальше от берега: точка на 1.5–2 клетки от героя в сторону воды, если там тоже вода
  let bx=w.x+(Math.random()-.5)*0.3, by=w.y+(Math.random()-.5)*0.3;
  const dx=w.x-hero.x, dy=w.y-hero.y, d=Math.hypot(dx,dy)||1;
  for(const dist of [2,1.7,1.4]){
    const tx=hero.x+dx/d*dist+(Math.random()-.5)*0.3, ty=hero.y+dy/d*dist+(Math.random()-.5)*0.3, c=cellAt(Math.round(tx),Math.round(ty));
    if(c&&c.water&&Math.abs(tx-c.x)<0.4&&Math.abs(ty-c.y)<0.4){bx=tx;by=ty;break;}
  }
  fishing={water:w,state:"cast",t:0,timer:0,bx,by};
  say("casting");
}
function catchFish(){
  if(!fishing||fishing.state!=="bite") return;
  const f=fishing; f.fish=pickFish(); f.state="reel"; f.t=0;
  for(let i=0;i<3;i++) ripples.push({x:f.bx,y:f.by,z:walkZ(f.water),t:-i*0.12,big:true});
  say("hooked",null,{fish:"#fish_"+f.fish.id});
}
function updateFishing(dt){
  for(let i=ripples.length-1;i>=0;i--){ripples[i].t+=dt; if(ripples[i].t>1.4) ripples.splice(i,1);}
  for(let i=floats.length-1;i>=0;i--){floats[i].t+=dt; if(floats[i].t>1.8) floats.splice(i,1);}
  if(!fishing) return;
  const f=fishing; f.t+=dt; faceTo(f.bx,f.by);
  const z=walkZ(f.water);
  if(f.state==="cast"&&f.t>=0.55){
    f.state="wait"; f.t=0; f.timer=waitTime(); ripples.push({x:f.bx,y:f.by,z,t:0});
    say("waiting","waiting_sub");
  } else if(f.state==="wait"){
    if(Math.random()<dt*0.6) ripples.push({x:f.bx,y:f.by,z,t:0,small:true});
    if(f.t>=f.timer){ f.state="bite"; f.t=0; f.timer=1.4+Math.random()*0.6; ripples.push({x:f.bx,y:f.by,z,t:0});
      say("bite","bite_sub"); }
  } else if(f.state==="bite"&&f.t>=f.timer){
    floats.push({key:"lost",col:"#ffb4a0",t:0});
    f.state="wait"; f.t=0; f.timer=waitTime(); say("lost_st");
  } else if(f.state==="reel"&&f.t>=0.75){
    inv[f.fish.id]=(inv[f.fish.id]||0)+1; if(inv.bait){ inv.bait--; if(!inv.bait) delete inv.bait; } renderInv();
    if(f.fish.id!=="boot") prog.st.fish++; addXP(xpFish(f.fish.id),"fish");
    floats.push({key:"plus",p:{n:1,fish:"#fish_"+f.fish.id},col:f.fish.id==="gold"?"#ffd66b":f.fish.id==="boot"?"#d8c0a8":"#ffffff",t:0});
    say("caught","caught_sub",{fish:"#fish_"+f.fish.id});
    f.state="pause"; f.t=0; wearRod();
  } else if(f.state==="pause"&&f.t>=0.9){
    startFishing(f.water);
  }
}
// панель рыбалки: «Подсечь!» только во время поклёвки, «Смотать удочку» — пока рыбачим
let uiState=null;
function syncFishUI(){
  const st=fishing?fishing.state:null;
  if(st!==uiState){
    uiState=st;
    document.getElementById("fishbar").hidden=!st;
    document.getElementById("hook").hidden=st!=="bite";
  }
  if(st==="bite") document.getElementById("hookTime").style.width=Math.max(0,1-fishing.t/fishing.timer)*100+"%";
}
// где сейчас поплавок на воде (во время ожидания и поклёвки)
function bobberOnWater(){
  const f=fishing; if(!f||(f.state!=="wait"&&f.state!=="bite")) return null;
  const b=proj(f.bx-MX,f.by-MY,walkZ(f.water));
  if(f.state==="bite") return {x:b[0]+(Math.sin(T*25)>0?1:0), y:b[1]+2, under:Math.sin(T*9)>0.2};
  return {x:b[0], y:b[1]+Math.round(Math.sin(T*3)*0.7), under:false};
}
function drawBobber(x,y,under){
  const bx=Math.round(x), by=Math.round(y);
  ctx.fillStyle="#1b1528"; ctx.fillRect(bx-2,by-3,5,5);
  ctx.fillStyle="#e8402c"; ctx.fillRect(bx-1,by-2,3,2);
  if(!under){ ctx.fillStyle="#ffffff"; ctx.fillRect(bx-1,by,3,1); }
  else { ctx.fillStyle="#4a95d4"; ctx.fillRect(bx-2,by,5,2); }
}
// круги и поплавок, которые лежат на этой клетке воды
function drawWaterFx(c){
  for(const r of ripples){
    if(r.t<0||cellAt(Math.round(r.x),Math.round(r.y))!==c) continue;
    const k=r.t/1.4, rad=(r.small?0.05:0.08)+k*(r.big?0.5:r.small?0.18:0.32), a=(1-k)*(r.small?0.4:0.7);
    ctx.beginPath();
    for(let i=0;i<=20;i++){const an=i/20*Math.PI*2, p=proj(r.x-MX+Math.cos(an)*rad,r.y-MY+Math.sin(an)*rad,r.z); i?ctx.lineTo(...p):ctx.moveTo(...p);}
    ctx.strokeStyle=`rgba(230,246,255,${a})`; ctx.lineWidth=1; ctx.stroke();
  }
  if(fishing&&cellAt(Math.round(fishing.bx),Math.round(fishing.by))===c){
    const b=bobberOnWater(); if(b) drawBobber(b.x,b.y,b.under);
  }
}
// линия по пикселям (чёткая в пиксель-арте)
function pixLine(x0,y0,x1,y1,col){
  x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
  const dx=Math.abs(x1-x0), dy=-Math.abs(y1-y0), sx=x0<x1?1:-1, sy=y0<y1?1:-1; let err=dx+dy;
  ctx.fillStyle=col;
  for(let i=0;i<400;i++){ ctx.fillRect(x0,y0,1,1); if(x0===x1&&y0===y1) break; const e2=2*err; if(e2>=dy){err+=dy;x0+=sx} if(e2<=dx){err+=dx;y0+=sy} }
}
function drawFishing(){
  worldTransform(); ctx.imageSmoothingEnabled=false;
  const [fx,fy]=proj(hero.x-MX,hero.y-MY,hero.z);
  if(fishing){
    const f=fishing, dir=hero.facing[1]==="e"?1:-1, z=walkZ(f.water);
    const hand=[fx+dir*6, fy-20];
    let tip=[fx+dir*17, fy-37];
    if(f.state==="cast"&&f.t<0.2) tip=[fx-dir*5, fy-41];            // замах назад
    if(f.state==="bite") tip=[fx+dir*18, fy-31+(Math.sin(T*40)>0?1:0)]; // удочку тянет
    if(f.state==="reel"&&f.t<0.4) tip=[fx+dir*9, fy-43];             // подсечка вверх
    const b=proj(f.bx-MX,f.by-MY,z);
    const onW=bobberOnWater(); let bob=onW?[onW.x,onW.y]:[b[0],b[1]];
    if(f.state==="cast"){ const k=Math.max(0,(f.t-0.2)/0.35); bob=k<=0?tip:[tip[0]+(b[0]-tip[0])*Math.min(1,k), tip[1]+(b[1]-tip[1])*Math.min(1,k)-Math.sin(Math.min(1,k)*Math.PI)*22]; }
    if(f.state==="reel"||f.state==="pause") bob=tip;
    pixLine(hand[0],hand[1]+1,tip[0],tip[1]+1,"#2a1608");   // удочка с тёмной кромкой
    pixLine(hand[0],hand[1],tip[0],tip[1],"#9a6430");
    ctx.fillStyle="#d8d0c0"; ctx.fillRect(Math.round(tip[0]),Math.round(tip[1]),1,1);
    // леска с провисом
    ctx.fillStyle="rgba(255,255,255,.75)";
    const mx=(tip[0]+bob[0])/2, my=Math.max(tip[1],bob[1])+(f.state==="bite"?-2:6);
    let px=tip[0],py=tip[1];
    for(let i=1;i<=24;i++){const t=i/24, x=(1-t)*(1-t)*tip[0]+2*(1-t)*t*mx+t*t*bob[0], y=(1-t)*(1-t)*tip[1]+2*(1-t)*t*my+t*t*bob[1];
      pixLine(px,py,x,y,"rgba(255,255,255,.7)"); px=x; py=y;}
    // поплавок
    const bx=Math.round(bob[0]), by=Math.round(bob[1]);
    if(f.state==="cast") drawBobber(bx,by,false);   // в полёте — поверх всего
    // «!» над головой
    if(f.state==="bite"){
      const ey=Math.round(fy-60-Math.abs(Math.sin(T*10))*3), ex=Math.round(fx);
      ctx.fillStyle="#1b1528"; ctx.fillRect(ex-2,ey-1,5,10);
      ctx.fillStyle="#ffd66b"; ctx.fillRect(ex-1,ey,3,5); ctx.fillRect(ex-1,ey+6,3,2);
    }
    // рыба летит из воды в руки
    if(f.state==="reel"){
      const k=Math.min(1,f.t/0.75), ic=ICONS[f.fish.id];
      const x=b[0]+(fx-b[0])*k, y=b[1]+(fy-34-b[1])*k-Math.sin(k*Math.PI)*28;
      ctx.drawImage(ic,Math.round(x-12),Math.round(y-12),24,24);
    }
  }
  // всплывающие надписи
  ctx.font="8px Silkscreen, monospace"; ctx.textAlign="center"; ctx.textBaseline="bottom";
  floats.forEach((fl,i)=>{
    const y=Math.round(fy-52-fl.t*16-i*11), a=Math.min(1,(1.8-fl.t)/0.5);
    ctx.globalAlpha=a; ctx.lineWidth=3; ctx.strokeStyle="#1b1528"; const txt=tr(fl.key,fl.p); ctx.strokeText(txt,Math.round(fx),y);
    ctx.fillStyle=fl.col; ctx.fillText(txt,Math.round(fx),y); ctx.globalAlpha=1;
  });
}


