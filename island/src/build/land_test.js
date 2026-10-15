const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1000,height:700}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('island_nick','Gracz');localStorage.setItem('island_lang','ru');});
await p.goto('http://localhost:8765/index.html#world=LandWorldKey123456&admin=z'); await p.waitForTimeout(1800);
await p.evaluate(()=>edEnter());
const r=await p.evaluate(()=>{
  const ok=(x,y)=>{const c=cellAt(x,y); return c&&!isSpecial(c)&&!wet(c)&&!c.st;};
  const hx=Math.round(hero.x), hy=Math.round(hero.y);
  const free=cells.filter(c=>ok(c.x,c.y)&&Math.hypot(c.x-hx,c.y-hy)<4&&!(c.x===hx&&c.y===hy)).sort((a,b)=>Math.hypot(a.x-hx,a.y-hy)-Math.hypot(b.x-hx,b.y-hy));
  const tiles="nNrmfocpzu".split(""); const st={changes:[],seen:new Set()};
  tiles.forEach((t,i)=>{ edTool=t; edApplyCell(free[i].x,free[i].y,st); });
  // fences in both directions
  const f1=free[10], f2=free[11]; f1.props=["fence_left"]; f2.props=["fence_right"];
  edCommit(st,"{}"); return tiles.map((t,i)=>free[i].t).join(""); });
console.log('painted',r);
await p.evaluate(()=>{ edCat="land"; edRender(); });
await p.screenshot({path:'L_ed.png'});
await p.evaluate(()=>edExit&&edExit()).catch(()=>{});
await p.evaluate(()=>{ if(EDIT) document.querySelector('#edPanel .btn:nth-child(3)')?.click(); });
await p.waitForTimeout(300); await p.screenshot({path:'L_game.png'});
await p.evaluate(()=>rotate(1)); await p.waitForTimeout(300); await p.screenshot({path:'L_rot_mid.png'}); await p.waitForTimeout(700); await p.screenshot({path:'L_rot.png'});
console.log('errs',errs); await b.close();})();
