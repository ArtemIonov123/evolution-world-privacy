const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1000,height:700}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message)); await p.addInitScript(()=>localStorage.setItem('island_nick','Artem'));
await p.goto('http://localhost:8765/index.html#world=GenTestWorldKey12345&admin=q'); await p.waitForTimeout(1800);
await p.evaluate(()=>{ edEnter(); edAdd={t:0,b:12,l:0,r:12}; edGenerate(); edGenerate(); }); await p.waitForTimeout(3500);
console.log(await p.evaluate(()=>({W,D,cells:cells.length,trees:TREES.length,water:cells.filter(c=>c.water).length,edit:EDIT})));
await p.evaluate(()=>{ edPaint=false; follow=false; const [fx,fy]=proj(MAP.hut[0]-MX,MAP.hut[1]-MY,2); const r=cv.getBoundingClientRect(); panX=r.width*0.65-fx*scale; panY=r.height*0.5-fy*scale; zoomK=Math.max(1,zoomK-1); scale=zoomK/devicePixelRatio; dirty=true; });
await p.waitForTimeout(300); await p.screenshot({path:'gen2.png'});
// full map overview: zoom out
await p.evaluate(()=>{ edExit(); }); await p.waitForTimeout(200);
await p.evaluate(()=>{ zoomK=1; scale=1/devicePixelRatio*1; const r=cv.getBoundingClientRect(); panX=r.width/2; panY=r.height/2; dirty=true; }); await p.waitForTimeout(300); await p.screenshot({path:'gen2_all.png'});
console.log('errs',errs); await b.close();})();
