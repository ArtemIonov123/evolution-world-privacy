const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1000,height:700}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message)); await p.addInitScript(()=>localStorage.setItem('island_nick','A'));
await p.goto('http://localhost:8765/index.html#world=FillTestWorldKey1234&admin=q'); await p.waitForTimeout(1800);
await p.evaluate(()=>edEnter());
const r=await p.evaluate(()=>{ const c=cells.find(c=>c.t==="G"&&!c.props.length&&!isSpecial(c)&&!c.st); edTool="e"; edBrush="fill";
  const [fx,fy]=proj(c.x-MX,c.y-MY,c.L); const before=cells.filter(k=>k.t==="G"&&k.L===c.L).length;
  edTap(fx*scale+panX, fy*scale+panY+2); return [c.x,c.y,c.L,before,edUndo.length,edUndo[0]&&edUndo[0].changes.length,cellAt(c.x,c.y).t]; });
console.log('fill',r); console.log('errs',errs); await b.close();})();
