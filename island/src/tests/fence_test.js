const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1000,height:700}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('island_nick','Gracz');});
await p.goto('http://localhost:8765/index.html#world=FenceWorldKey12345&admin=z'); await p.waitForTimeout(1800);
await p.evaluate(()=>edEnter());
const r=await p.evaluate(()=>{
  const ok=(x,y)=>{const c=cellAt(x,y); return c&&!isSpecial(c)&&!wet(c)&&!c.props.length&&!c.st;};
  const [x,y]=cells.map(c=>[c.x,c.y]).find(([x,y])=>[0,1,2].every(d=>ok(x+d,y))&&ok(x,y+1)&&ok(x,y+2));
  edTool="fence"; edBrush=1; edDir="left";
  // линия вдоль x через edApplyAt с подменой gridUnder
  const scr=(cx,cy)=>{ const c=cellAt(cx,cy), q=proj(c.x-MX,c.y-MY,c.L); return [panX+q[0]*scale, panY+q[1]*scale]; };
  let st={changes:[],seen:new Set()}; for(const d of [0,1,2]){ edApplyAt(...scr(x+d,y),st); } edCommit(st,JSON.stringify(edDraft));
  const lineX=[0,1,2].map(d=>cellAt(x+d,y).props[0]);
  st={changes:[],seen:new Set()}; for(const d of [1,2]){ edApplyAt(...scr(x,y+d),st); } edCommit(st,JSON.stringify(edDraft));
  const lineY=[1,2].map(d=>cellAt(x,y+d).props[0]);
  edTap(...scr(x+1,y)); const tapped=cellAt(x+1,y).props[0];
  return {lineX,lineY,tapped}; });
console.log(r,'errs',errs); await b.close();})();
