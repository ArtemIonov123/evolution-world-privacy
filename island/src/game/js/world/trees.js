// ================= Рубка деревьев =================
const HITS={tree_big:5, tree_small:3}, LOGS={tree_big:3, tree_small:2};
const SWING=0.75, IMPACT=0.5;           // один взмах топора и момент удара (сек)
for(const c of cells) c.grow=1;
let chopping=null;                       // {tree, t, hits, cyc, struck}
const chips=[], regrow=[];
const treeName=c=>c&&c.props.find(n=>n.startsWith("tree"));
function refreshBlocked(c){ c.shallow=c.t==="v"; c.blocked=!!c.water||!!c.hutPart||!!c.npcHere||!!c.merchHere||!!c.stall||c.props.some(n=>BLOCKING.has(n)); }
function stopChopping(){ chopping=null; hero.pendingChop=null; }

// клик по дереву: подходим к соседней клетке (лучше — перед деревом, чтобы его было видно)
function goChop(t){
  if(t.grow<1||t.falling){ say("growing"); marker={x:t.x,y:t.y,t:0,ok:false}; return; }
  const spots=[];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const n=cellAt(t.x+dx,t.y+dy); if(n&&!n.blocked&&Math.abs(walkZ(n)-walkZ(t))<=1) spots.push(n);
  }
  const score=n=>Math.hypot(n.x-hero.x,n.y-hero.y)+(depthOf(n.x-MX,n.y-MY)<depthOf(t.x-MX,t.y-MY)?4:0);
  spots.sort((a,b)=>score(a)-score(b));
  for(const n of spots){
    const p=findPath(Math.round(hero.x),Math.round(hero.y),n.x,n.y); if(!p) continue;
    hero.path=p.length?p:[[n.x,n.y]]; hero.pendingChop={tree:t};
    marker={x:t.x,y:t.y,t:0,ok:true};
    follow=true; document.getElementById("follow").setAttribute("aria-pressed","true");
    say("go_chop"); return;
  }
  marker={x:t.x,y:t.y,t:0,ok:false}; say("no_reach");
}
function startChopping(t){
  marker=null;
  if(!treeName(t)||t.grow<1||t.falling){ say("growing"); return; }
  chopping={tree:t,t:0,hits:0,cyc:-1,struck:false};
  say("chopping","chop_sub");
}
function hitTree(t){
  const ch=chopping; ch.hits++; t.shake=0.3;
  for(let i=0;i<9;i++) chips.push({x:t.x+(hero.x-t.x)*0.3, y:t.y+(hero.y-t.y)*0.3, z:walkZ(t)*LH+9,
    vx:(Math.random()-.5)*1.6+(hero.x-t.x)*0.6, vy:(Math.random()-.5)*1.6+(hero.y-t.y)*0.6, vz:40+Math.random()*55,
    t:0, life:0.55+Math.random()*0.35, col:["#ecd0a0","#c89858","#8a5a2a"][i%3]});
  // листья сыплются от удара
  for(let i=0;i<3;i++) if(leaves.length<300) leaves.push({x:t.x+(Math.random()-.5)*0.8,y:t.y+(Math.random()-.5)*0.8,
    z:walkZ(t)*LH+40+Math.random()*50, ph:Math.random()*6.28, spin:3+Math.random()*4, fall:12+Math.random()*8,
    col:LEAF_COLORS[(Math.random()*LEAF_COLORS.length)|0], drift:0.3});
  const name=treeName(t);
  if(ch.hits>=HITS[name]){
    t.falling={t:0,dx:t.x-hero.x,dy:t.y-hero.y,name}; netTreeGone(t);
    chopping=null;
    const n=logsOf(name)+(Math.random()<extraLogChance()?1:0); if(n>0) inv.wood=(inv.wood||0)+n; renderInv();
    prog.st.trees++; addXP(xpOf("tree"),"chop");
    floats.push({key:"plus",p:{n,fish:"#fish_wood"},col:"#f0c890",t:0});
    say("felled");
  }
}
function finishFall(c){
  const name=c.falling.name; c.falling=null;
  c.props=c.props.filter(n=>!n.startsWith("tree")); refreshBlocked(c);
  const i=TREES.findIndex(tr=>tr.c===c); if(i>=0) TREES.splice(i,1);
  c.stump={t:0,big:name==="tree_big"};
  for(let k=0;k<10;k++) chips.push({x:c.x+(Math.random()-.5)*0.8,y:c.y+(Math.random()-.5)*0.8,z:walkZ(c)*LH+2,
    vx:(Math.random()-.5)*0.8,vy:(Math.random()-.5)*0.8,vz:15+Math.random()*25,t:0,life:0.7,col:"#d8d0c0",dust:true});
  if(!c.remoteFall) regrow.push({t:5+Math.random()*5});   // новое дерево сажает тот, кто срубил
  c.remoteFall=false;   // через 5–10 с где-то вырастет новое
}
// новое деревце в свободном месте на траве, подальше от героя и других деревьев
function sproutTree(){ if(CAVE) return;
  const onPath=c=>hero.path.some(([px,py])=>Math.round(px)===c.x&&Math.round(py)===c.y);
  const cand=cells.filter(c=>!c.water&&!c.st&&GRASSY.includes(c.t)&&!c.props.length&&!c.stump&&!c.blocked
    &&Math.hypot(c.x-hero.x,c.y-hero.y)>2.5&&!onPath(c)
    &&!TREES.some(tr=>Math.abs(tr.c.x-c.x)+Math.abs(tr.c.y-c.y)<3));
  if(!cand.length){ regrow.push({t:5}); return; }
  const c=cand[(Math.random()*cand.length)|0], big=Math.random()<0.5, name=big?"tree_big":"tree_small";
  c.props.push(name); refreshBlocked(c); c.grow=0.02; c.growTime=big?45:30; TREES.push({c,big}); netTreeGrow(c,name);
  for(let i=0;i<14;i++) chips.push({x:c.x+(Math.random()-.5)*0.6,y:c.y+(Math.random()-.5)*0.6,z:walkZ(c)*LH+2,
    vx:0,vy:0,vz:25+Math.random()*45,t:0,life:1,col:["#b8f070","#ffffff","#7fd040"][i%3],spark:true});
  if(!chopping&&!fishing&&!hero.path.length) say("sprout");
}
function updateChopping(dt){
  for(let i=chips.length-1;i>=0;i--){const p=chips[i]; p.t+=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.z+=p.vz*dt;
    p.vz-=(p.spark?20:160)*dt; if(p.t>p.life) chips.splice(i,1);}
  for(const c of cells){
    if(c.shake>0) c.shake=Math.max(0,c.shake-dt);
    if(c.falling){ c.falling.t+=dt; if(c.falling.t>=0.9) finishFall(c); }
    if(c.stump){ c.stump.t+=dt; if(c.stump.t>30) c.stump=null; }
    if(c.grow<1) c.grow=Math.min(1,c.grow+dt/c.growTime);
  }
  for(let i=regrow.length-1;i>=0;i--){ regrow[i].t-=dt; if(regrow[i].t<=0){ regrow.splice(i,1); sproutTree(); } }
  if(!chopping) return;
  const ch=chopping; faceTo(ch.tree.x,ch.tree.y);
  ch.t+=dt;
  const cyc=Math.floor(ch.t/SWING); if(cyc!==ch.cyc){ch.cyc=cyc;ch.struck=false;}
  if(!ch.struck&&(ch.t%SWING)>=IMPACT){ ch.struck=true; hitTree(ch.tree); }
}

// дерево растёт / падает / вздрагивает (вызывается из drawProp)
function drawTreeSpecial(im,px,py,c){
  if(c.falling){
    const k=Math.min(1,c.falling.t/0.9), e=k*k;
    const u=c.falling.dx*ca-c.falling.dy*sa, v=c.falling.dx*sa+c.falling.dy*ca, dir=(u-v)>=0?1:-1;
    ctx.save(); ctx.translate(Math.round(px),Math.round(py)+2); ctx.rotate(dir*e*Math.PI*0.48);
    ctx.globalAlpha=k<0.7?1:Math.max(0,1-(k-0.7)/0.3);
    ctx.drawImage(im,-Math.round(im.width/2),-im.height+2); ctx.restore();
    return true;
  }
  if(c.grow<1){
    const g=c.grow, s=0.12+0.88*(1-Math.pow(1-g,2)), w=Math.max(2,Math.round(im.width*s)), h=Math.max(3,Math.round(im.height*s));
    ctx.drawImage(im,Math.round(px-w/2),Math.round(py+4-h),w,h);
    return true;
  }
  return false;
}
function drawStump(c){
  const p=proj(c.x-MX,c.y-MY,c.L), x=Math.round(p[0]), y=Math.round(p[1]), r=c.stump.big?7:5;
  ctx.globalAlpha=Math.min(1,(30-c.stump.t)/4);
  ctx.fillStyle="#1b1528"; ctx.fillRect(x-r-1,y-r+1,2*r+2,r+3);
  ctx.fillStyle="#7a4a24"; ctx.fillRect(x-r,y-r+3,2*r,r);
  ctx.fillStyle="#5a3418"; ctx.fillRect(x-r,y+2,2*r,1);
  ctx.fillStyle="#e2bc84"; ctx.fillRect(x-r,y-r+1,2*r,3);
  ctx.fillStyle="#b88a50"; ctx.fillRect(x-2,y-r+2,4,1);
  ctx.globalAlpha=1;
}
// топор в руках и щепки — поверх сцены
function drawChopFx(){
  worldTransform(); ctx.imageSmoothingEnabled=false;
  for(const p of chips){
    const q=proj(p.x-MX,p.y-MY,p.z/LH), a=p.spark||p.dust?Math.max(0,1-p.t/p.life):1;
    ctx.globalAlpha=a; ctx.fillStyle=p.col;
    const s=p.dust?2:p.spark?1:2; ctx.fillRect(Math.round(q[0]),Math.round(q[1]),s,p.dust?2:1+(p.t*20|0)%2);
  }
  ctx.globalAlpha=1;
  if(!chopping) return;
  const [fx,fy]=proj(hero.x-MX,hero.y-MY,hero.z), dir=hero.facing[1]==="e"?1:-1;
  const ph=(chopping.t%SWING)/SWING, imp=IMPACT/SWING;
  // замах: топор уходит за голову, удар — резко вперёд-вниз, потом возврат
  let ang;
  if(ph<imp-0.08) ang=-0.3-1.9*(ph/(imp-0.08));
  else if(ph<imp) ang=-2.2+3.1*((ph-(imp-0.08))/0.08);
  else ang=0.9-1.2*((ph-imp)/(1-imp));
  ctx.save(); ctx.translate(Math.round(fx+dir*4),Math.round(fy-20)); ctx.scale(dir,1); ctx.rotate(ang);
  ctx.fillStyle="#1b1528"; ctx.fillRect(-1,-2,16,4); ctx.fillRect(11,-6,6,9);
  ctx.fillStyle="#9a6430"; ctx.fillRect(0,-1,14,2);
  ctx.fillStyle="#b8c0cc"; ctx.fillRect(12,-5,4,7);
  ctx.fillStyle="#eef4fa"; ctx.fillRect(15,-5,1,7);
  ctx.restore();
}



