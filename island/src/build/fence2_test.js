const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:500,height:400},deviceScaleFactor:2}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('island_nick','Gracz');});
await p.goto('http://localhost:8765/index.html#world=Fence2WorldKey1234'); await p.waitForTimeout(1800);
const shots=[];
for(let q=0;q<4;q++){
  await p.evaluate(()=>{ const hx=Math.round(hero.x), hy=Math.round(hero.y);
    const a=cellAt(hx+1,hy), c=cellAt(hx,hy+1); if(a&&!a.water){a.props=["fence_left"];} if(c&&!c.water){c.props=["fence_right"];} hero.x=hx-0; follow=true; dirty=true;
    showGrid=true; });
  const btn=await p.$('#gridBtn'); 
  await p.waitForTimeout(300); await p.screenshot({path:`F${q}.png`,clip:{x:150,y:120,width:200,height:170}});
  await p.evaluate(()=>rotate(1)); await p.waitForTimeout(900);
}
console.log('errs',errs); await b.close();})();
