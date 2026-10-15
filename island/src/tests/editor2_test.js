const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const fake=fs.readFileSync('fake_rtdb.js','utf8'); const errs=[];
const ctx=await b.newContext({viewport:{width:1000,height:700}}); await ctx.addInitScript({content:fake});
const pg=async(who,url,nick,uid)=>{const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(who+':'+e.message));
  await p.addInitScript(([n,u])=>{ if(!sessionStorage.getItem('i')){ sessionStorage.setItem('i',1); localStorage.setItem('island_nick',n); localStorage.setItem('island_uid',u);} },[nick,uid]);
  await p.goto(url); await p.waitForTimeout(1800); return p;};
const WK='EditorTwoWorldKey123';
const A=await pg('A',`http://localhost:8765/index.html#world=${WK}&admin=abc`,'Admin','uAAAAAAAAAAAAAA');
const B=await pg('B',`http://localhost:8765/index.html#world=${WK}`,'Gracz','uBBBBBBBBBBBBBB');
await A.evaluate(()=>edEnter()); await A.waitForTimeout(200);
// drag paint with mouse at right side of screen (panel is on the left)
await A.evaluate(()=>{ edTool="d"; edBrush=3; edPaint=true; const c=cellAt(14,15); const [fx,fy]=proj(14-MX,15-MY,c.L); const r=cv.getBoundingClientRect(); panX=r.width*0.6-fx*scale; panY=r.height*0.5-fy*scale; dirty=true; });
await A.waitForTimeout(100);
await A.mouse.move(600,350); await A.mouse.down(); for(let i=1;i<=10;i++){ await A.mouse.move(600+i*15,350+i*4); await A.waitForTimeout(16); } await A.mouse.up();
console.log('drag stroke',await A.evaluate(()=>[edUndo.length,edUndo[0]&&edUndo[0].changes.length]));
// fill
await A.evaluate(()=>{ edTool="s"; edBrush="fill"; }); await A.mouse.click(700,450);
console.log('fill',await A.evaluate(()=>[edUndo.length,edUndo[edUndo.length-1].changes.length]));
await A.evaluate(()=>{ edUndoLast(); edUndoLast(); }); console.log('undo all',await A.evaluate(()=>edUndo.length));
await A.screenshot({path:'ed2_a.png'});
// expand left 3 / top 2 and save
const hutBefore=await A.evaluate(()=>[MAP.hut,W,D]);
await A.evaluate(()=>{ edAdd.l=3; edAdd.t=2; edSave(); }); await A.waitForTimeout(3500);
console.log('after expand',hutBefore,'->',await A.evaluate(()=>[MAP.hut,W,D,EDIT,MERCH_POS]));
await B.waitForTimeout(2500); console.log('B sees',await B.evaluate(()=>[W,D,MAP.hut]));
// generator 30x30
await A.evaluate(()=>{ edAdd={t:0,b:5,l:0,r:7}; edGenerate(); edGenerate(); }); await A.waitForTimeout(3500);
const g=await A.evaluate(()=>({W,D,hut:MAP.hut,npc:MAP.npc,m:MAP.merchant,stall:MAP.stall,pier:MAP.pier,start:MAP.start,cells:cells.length,water:cells.filter(c=>c.water).length,trees:TREES.length,heroCell:!!cellAt(Math.round(hero.x),Math.round(hero.y)),edit:EDIT}));
console.log('generated',JSON.stringify(g));
await A.evaluate(()=>edMiniJump(75,75)); await A.waitForTimeout(200); await A.screenshot({path:'ed2_gen.png'});
await B.waitForTimeout(2500); console.log('B gen',await B.evaluate(()=>[W,D,cells.length]));
await B.screenshot({path:'ed2_b.png'});
console.log('errors',errs); await b.close();})();
