// ---- NPC: спрайты npc_se_0/1, npc_ne_0/1 (влево — зеркально), иначе старик кодом ----
function drawOldMan(g,facing,t,talking){
  const front=facing[0]==="s", flip=facing[1]==="w"?-1:1, bob=Math.sin(t*2.4)>0.55?1:0;
  g.save(); g.scale(flip,1); g.translate(0,-bob);
  const rects=[]; const R=(x,y,w,h,c)=>rects.push([x,y,w,h,c]);
  R(-4,-8,3,8,"#4a3a2a"); R(1,-8,3,8,"#4a3a2a"); R(-4,-2,3,2,"#2a1f14"); R(1,-2,3,2,"#2a1f14");
  R(-6,-20,12,13,"#7a5a2e"); R(-6,-20,12,2,"#9a7440"); R(-6,-12,12,1,"#c8b070");
  R(-8,-19,2,9,"#6a4a24"); R(6,-19,2,9,"#6a4a24"); R(-8,-10,2,2,"#e8b888"); R(6,-10,2,2,"#e8b888");
  R(-4,-28,8,8,"#e8b888");
  if(front){ R(-4,-23,8,5,"#f0f0f4"); R(-3,-18,6,2,"#f0f0f4"); R(-2,-25,1,1,"#1b1528"); R(2,-25,1,1,"#1b1528"); R(0,-24,1,2,"#d89870");
    if(talking&&Math.sin(t*14)>0) R(-1,-21,3,1,"#8a5a4a"); }
  else R(-4,-27,8,6,"#c8c8d0");
  R(-7,-28,14,2,"#3f5a2e"); R(-4,-32,8,4,"#4f6a3a"); R(-4,-29,8,1,"#2a3a1e");
  g.fillStyle="#1b1528"; for(const [x,y,w,h] of rects) g.fillRect(x-1,y-1,w+2,h+2);
  for(const [x,y,w,h,c] of rects){ g.fillStyle=c; g.fillRect(x,y,w,h); }
  g.fillStyle="#8a5a2a"; for(let i=0;i<26;i++) g.fillRect(7+Math.round(i*0.08),-10-i,1,1);   // посох-удочка
  g.restore();
}
function questMark(){
  if(quest==="none") return "!";
  if(quest==="active"&&(inv.wood||0)>=5) return "?";
  return null;
}
function drawNPC(){
  worldTransform(); ctx.imageSmoothingEnabled=false;
  const [fx,fy]=proj(npc.x-MX,npc.y-MY,npc.z);
  ctx.fillStyle="rgba(20,10,40,.28)"; ctx.beginPath(); ctx.ellipse(fx,fy,9,4.5,0,0,Math.PI*2); ctx.fill();
  const frame=Math.sin(npc.t*2.4)>0.55?1:0;
  let sp=img[`npc_${npc.facing}_${frame}`], mirror=false;
  if(!sp&&npc.facing[1]==="w"){ sp=img[`npc_${npc.facing[0]}e_${frame}`]; mirror=true; }
  ctx.save(); ctx.translate(Math.round(fx),Math.round(fy));
  if(sp){ if(mirror) ctx.scale(-1,1); ctx.drawImage(sp,-Math.round(sp.width/2),-sp.height+2); }
  else drawOldMan(ctx,npc.facing,npc.t,dialogOpen);
  ctx.restore();
  const m=questMark();
  if(m&&!dialogOpen){   // «!» — есть задание, «?» — можно сдать
    const ex=Math.round(fx), ey=Math.round(fy-50-Math.abs(Math.sin(T*3))*3);
    ctx.fillStyle="#1b1528"; ctx.fillRect(ex-3,ey-1,7,11);
    ctx.fillStyle="#ffd66b";
    if(m==="!"){ ctx.fillRect(ex-1,ey,3,6); ctx.fillRect(ex-1,ey+7,3,2); }
    else { ctx.fillRect(ex-2,ey,5,2); ctx.fillRect(ex+1,ey+2,2,2); ctx.fillRect(ex-1,ey+4,2,2); ctx.fillRect(ex-1,ey+7,2,2); }
  }
}
function facingTo(from,x,y){
  const dx=x-from.x, dy=y-from.y, u=dx*ca-dy*sa, v=dx*sa+dy*ca;
  return ((u+v)>=0?"s":"n")+((u-v)>=0?"e":"w");
}
function updateNPC(dt){
  if(!npc) return;
  npc.t+=dt;
  const d=Math.hypot(hero.x-npc.x,hero.y-npc.y);
  if(dialogOpen||d<3.5) npc.facing=facingTo(npc,hero.x,hero.y);   // смотрит на героя, когда тот рядом
  else { npc.turnT-=dt; if(npc.turnT<=0){ npc.turnT=3+Math.random()*4; npc.facing=["se","sw","se","ne"][(Math.random()*4)|0]; } }
}

// клик по NPC или хижине (по картинке, а не только по клетке)
function pickEntity(mx,my){
  const wx=(mx-panX)/scale, wy=(my-panY)/scale;
  if(npc){ const [fx,fy]=proj(npc.x-MX,npc.y-MY,npc.z); if(Math.abs(wx-fx)<=11&&wy>=fy-44&&wy<=fy+4) return "npc"; }
  if(pickPortal(wx,wy)) return "portal";
  { const lk=pickLink(wx,wy); if(lk) return lk; }
  if(pickMerchant(wx,wy)) return "merchant";
  if(HUT){
    const g=hutGeom(), pts=[];
    for(const x of [g.x0-0.4,g.x1+0.2])for(const y of [g.y0-0.4,g.y1+0.2])for(const z of [g.Z0,g.Zr+0.7]) pts.push(proj(x,y,z));
    const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
    if(wx>=Math.min(...xs)&&wx<=Math.max(...xs)&&wy>=Math.min(...ys)&&wy<=Math.max(...ys)-12) return "hut";
  }
  return null;
}
function goTalk(){
  if(!npc) return;
  if(Math.hypot(hero.x-npc.x,hero.y-npc.y)<1.6&&!hero.path.length){ openDialog(); return; }
  const spots=[];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){ const n=cellAt(npc.x+dx,npc.y+dy); if(n&&!n.blocked) spots.push(n); }
  const score=n=>Math.hypot(n.x-hero.x,n.y-hero.y)+(depthOf(n.x-MX,n.y-MY)<depthOf(npc.x-MX,npc.y-MY)?3:0);
  spots.sort((a,b)=>score(a)-score(b));
  for(const n of spots){
    const p=findPath(Math.round(hero.x),Math.round(hero.y),n.x,n.y); if(!p) continue;
    hero.path=p.length?p:[[n.x,n.y]]; hero.pendingTalk=true;
    follow=true; document.getElementById("follow").setAttribute("aria-pressed","true");
    say("go_talk"); return;
  }
  say("no_reach");
}

// ---- Диалог ----
let dialogOpen=false, dlgNode="main", dlgParams={};
const fishValue=()=>FISH.reduce((a,f)=>a+(inv[f.id]||0)*fisherPrice(f.id),0)+(inv.cooked||0)*fisherPrice("cooked");
function openDialog(){
  dialogOpen=true; dlgKind="npc"; dlgNode="main"; faceTo(npc.x,npc.y); closeWin();
  document.getElementById("dialog").hidden=false; document.getElementById("hotbar").hidden=true; document.querySelector(".ctrl").hidden=true;
  drawPortrait(); renderDialog();
  setTimeout(()=>{const b=document.querySelector("#dlgOpts button"); if(b&&matchMedia("(pointer: fine)").matches) b.focus();},0);
}
function closeDialog(){
  if(!dialogOpen) return;
  dialogOpen=false; document.getElementById("dialog").hidden=true; document.getElementById("hotbar").hidden=false; document.querySelector(".ctrl").hidden=false;
  say(dlgKind==="fire"?"fire_left":"arrived_npc"); dlgKind="npc";
}
function renderDialog(){
  if(!dialogOpen) return;
  if(dlgKind==="fire") return renderFireMenu();
  const opts=[];
  let text;
  const wood=inv.wood||0;
  if(dlgNode==="main"){
    text=quest==="none"?tr("npc_hello"):quest==="active"?tr("npc_hello_active",{n:Math.min(wood,5)}):tr("npc_hello_done");
    const fv=fishValue(); if(fv>0) opts.push(["opt_sell_fish",{c:fv},sellFish]);
    if(quest==="none") opts.push(["opt_quest",null,()=>{dlgNode="quest";renderDialog();}]);
    if(quest==="active"&&wood>=5) opts.push(["opt_give_wood",null,giveWood]);
    if(quest==="done"&&wood>0) opts.push(["opt_sell_wood",{c:wood*fisherPrice("wood")},sellWood]);
    if(quest2==="none") opts.push(["opt_wolfq",null,()=>{dlgNode="wolfq";renderDialog();}]);
    if(quest2==="active"&&(inv.pelt||0)>=2) opts.push(["opt_give_pelts",null,givePelts]);
    const lv=lootValue(); if(lv>0) opts.push(["opt_sell_loot",{c:lv},sellLoot]);
    opts.push(["opt_craft",null,()=>{dlgNode="craft";renderDialog();}]);
    if(CUSTOM_SHOP.some(s=>s.by==="npc")) opts.push(["opt_buy_npc",null,openShopNpc]);
    opts.push(["opt_who",null,()=>{dlgNode="who";renderDialog();}]);
    opts.push(["opt_bye",null,closeDialog]);
  } else if(dlgNode==="craft"){
    text=tr("npc_craft");
    for(const r of RECIPES) opts.push(["craft_opt",{item:"#fish_"+r.id,cost:costText(r)},()=>craft(r),!canCraft(r)]);
    opts.push(["opt_back",null,()=>{dlgNode="main";renderDialog();}]);
  } else if(dlgNode==="wolfq"){
    text=tr("npc_wolfq");
    opts.push(["opt_accept",null,()=>{quest2="active"; if(!equip.weapon&&!inv.club) giveItem("club"); renderInv(); dlgNode="wolf_acc"; renderDialog();}]);
    opts.push(["opt_later",null,()=>{dlgNode="main";renderDialog();}]);
  } else if(dlgNode==="quest"){
    text=tr("npc_quest");
    opts.push(["opt_accept",null,()=>{quest="active";dlgNode="accepted";renderDialog();}]);
    opts.push(["opt_later",null,()=>{dlgNode="main";renderDialog();}]);
  } else {
    text=tr({who:"npc_who",accepted:"npc_accepted",sold:"npc_sold",reward:"npc_reward",wood_sold:"npc_wood_sold",wolf_acc:"npc_wolf_acc",reward2:"npc_reward2",loot_sold:"npc_loot_sold",crafted:"npc_crafted"}[dlgNode],dlgParams);
    opts.push(["opt_back",null,()=>{dlgNode="main";renderDialog();}]);
    opts.push(["opt_bye",null,closeDialog]);
  }
  document.getElementById("dlgName").textContent=tr("npc_name");
  document.getElementById("dlgText").textContent=text;
  const box=document.getElementById("dlgOpts"); box.innerHTML="";
  for(const [k,p,fn,dis] of opts){ const b=document.createElement("button"); b.className="btn"; b.textContent=tr(k,p); b.onclick=fn; b.disabled=!!dis; box.appendChild(b); }
}
function addCoins(n){ inv.coin=(inv.coin||0)+n; floats.push({key:"plus",p:{n,fish:"#fish_coin"},col:"#ffd66b",t:0}); }
function sellFish(){
  const c=fishValue(); for(const f of FISH) delete inv[f.id]; delete inv.cooked;
  addCoins(c); renderInv(); dlgParams={c}; dlgNode="sold"; renderDialog();
}
function sellWood(){
  const c=(inv.wood||0)*fisherPrice("wood"); delete inv.wood; addCoins(c); renderInv(); dlgParams={c}; dlgNode="wood_sold"; renderDialog();
}
// шкуры для задания не продаём, пока оно не выполнено
const lootValue=()=>Object.keys(LOOT_PRICE).reduce((a,k)=>a+(k==="pelt"&&quest2!=="done"?0:(inv[k]||0)*fisherPrice(k)),0);
function sellLoot(){ const c=lootValue(); for(const k of Object.keys(LOOT_PRICE)) if(!(k==="pelt"&&quest2!=="done")) delete inv[k];
  addCoins(c); renderInv(); dlgParams={c}; dlgNode="loot_sold"; renderDialog(); }
function givePelts(){ inv.pelt-=2; if(!inv.pelt) delete inv.pelt; quest2="done"; addCoins(15); addXP(xpOf("quest")); inv.potion=(inv.potion||0)+2;
  floats.push({key:"plus",p:{n:2,fish:"#fish_potion"},col:"#ff9a9a",t:-0.3}); renderInv(); dlgNode="reward2"; renderDialog(); }
function giveWood(){
  inv.wood-=5; if(!inv.wood) delete inv.wood;
  quest="done"; rodLevel=2; giveItem("rod_bamboo"); addCoins(10); addXP(xpOf("quest"));
  floats.push({key:"rod_new",col:"#9fe0ff",t:-0.4});
  renderInv(); dlgNode="reward"; renderDialog();
}
// портрет: спрайт npc_portrait (64×64) или крупная голова старика кодом
function drawPortrait(){
  const c=document.getElementById("portrait"), g=c.getContext("2d");
  g.setTransform(1,0,0,1,0,0); g.imageSmoothingEnabled=false;
  g.fillStyle="#3d3257"; g.fillRect(0,0,64,64);
  if(img.npc_portrait){ g.drawImage(img.npc_portrait,0,0,64,64); return; }
  g.setTransform(2.6,0,0,2.6,32,96); drawOldMan(g,"se",0,false); g.setTransform(1,0,0,1,0,0);
}


