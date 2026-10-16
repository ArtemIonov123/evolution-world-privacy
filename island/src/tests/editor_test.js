const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const fake=fs.readFileSync('fake_rtdb.js','utf8'); const errs=[];
const ctx=await b.newContext({viewport:{width:900,height:650}}); await ctx.addInitScript({content:fake});
const pg=async(who,url,nick,uid,c)=>{const p=await (c||ctx).newPage(); p.on('pageerror',e=>errs.push(who+':'+e.message));
  await p.addInitScript(([n,u])=>{ if(!sessionStorage.getItem('i')){ sessionStorage.setItem('i',1); localStorage.setItem('island_nick',n); localStorage.setItem('island_uid',u);} },[nick,uid]);
  await p.goto(url); await p.waitForTimeout(1800); return p;};
const W='TestWorldKey12345678';
const A=await pg('A',`http://localhost:8765/index.html#world=${W}&admin=sekret123`,'Admin','uAAAAAAAAAAAAAA');
console.log('A admin',await A.evaluate(()=>[isAdmin,!document.getElementById('editBtn').hidden,location.hash]));
const B=await pg('B',`http://localhost:8765/index.html#world=${W}`,'Gracz','uBBBBBBBBBBBBBB');
console.log('B admin',await B.evaluate(()=>[isAdmin,document.getElementById('editBtn').hidden]));
await A.evaluate(()=>edEnter()); await A.waitForTimeout(300); await A.screenshot({path:'ed1.png'});
// tool ops via screen taps at cell positions
const tapCell=async(p,x,y)=>{ const pos=await p.evaluate(([x,y])=>{const c=cellAt(x,y); const [px,py]=proj(x-MX,y-MY,c?c.L:1);
  const r=cv.getBoundingClientRect(); panX=r.width*0.7-px*scale; panY=r.height/2-py*scale; dirty=true; return [r.width*0.7+r.left, r.height/2+r.top+2];},[x,y]); await p.waitForTimeout(80); await p.mouse.click(pos[0],pos[1]); await p.waitForTimeout(80); };
await A.evaluate(()=>{edTool="w"; edBrush=1;}); await tapCell(A,10,10);
await A.evaluate(()=>{edTool="tree_big";}); await tapCell(A,12,16);
await A.evaluate(()=>{edTool="up";}); await tapCell(A,8,14);
console.log('A cells',await A.evaluate(()=>[cellAt(10,10).t,cellAt(12,16).props,cellAt(8,14).L,edUndo.length]));
await A.evaluate(()=>edUndoLast()); console.log('after undo L',await A.evaluate(()=>cellAt(8,14).L));
await A.evaluate(()=>{edTool="merchant";}); await tapCell(A,13,16);
console.log('draft merchant',await A.evaluate(()=>edDraft.merchant));
await A.screenshot({path:'ed2.png'});
await A.evaluate(()=>edSave()); await A.waitForTimeout(3000);
console.log('A after reload',await A.evaluate(()=>[EDIT,cellAt(10,10).t,MERCH_POS,MAP_V>0,isAdmin]));
await B.waitForTimeout(2500);
console.log('B new map',await B.evaluate(()=>[cellAt(10,10).t,cellAt(12,16).props,MERCH_POS]));
// wrong code in another browser
const ctx2=await b.newContext({viewport:{width:900,height:650}}); await ctx2.addInitScript({content:fake});
// share fake db across contexts not possible; use same ctx new page with other session
const C=await pg('C',`http://localhost:8765/index.html#world=${W}&admin=zlykod`,'Ktos','uCCCCCCCCCCCCCC');
console.log('C admin',await C.evaluate(()=>[isAdmin,document.getElementById('toast').innerText]));
console.log('errors',errs); await b.close();})();
