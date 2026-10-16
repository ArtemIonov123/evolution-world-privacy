const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1000,height:700}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.text().startsWith('DBG')) console.log(m.text()); });
await p.addInitScript(()=>{ localStorage.setItem('island_nick','Tester'); localStorage.setItem('island_lang','ru'); });
await p.goto('http://localhost:8765/index.html#world=CaveExitKey12345678'); await p.waitForTimeout(1500);
await p.evaluate(()=>{ sessionStorage.setItem("island_zone","cave"); location.reload(); }); await p.waitForTimeout(2500);
console.log('zone',await p.evaluate(()=>ZONE));
await p.evaluate(()=>{ const c=PORTAL; const n=cells.find(k=>!k.blocked&&Math.hypot(k.x-c.x,k.y-c.y)<1.5); hero.x=n.x; hero.y=n.y; hero.path=[]; usePortal(); });
await p.waitForTimeout(400); 
for(const t of [1500,600,600,1500,3000]){ await p.waitForTimeout(t); console.log(await p.evaluate(()=>typeof ZONE!=="undefined"?ZONE+' '+hero.x+','+hero.y+' portal '+(PORTAL&&[PORTAL.x,PORTAL.y])+' fixed '+SPAWN_FIXED:'loading')); }
console.log('errs',errs); await b.close();})();
