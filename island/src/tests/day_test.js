const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(); const p=await b.newPage({viewport:{width:900,height:650}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>localStorage.setItem('island_nick','Artem'));
await p.goto('file://'+process.argv[2]); await p.waitForTimeout(1000);
// ждём дневного волка
await p.waitForFunction(()=>animals.some(a=>a.kind==='wolf'&&a.calm),null,{timeout:40000}).catch(()=>{});
console.log('day wolves',await p.evaluate(()=>animals.filter(a=>a.kind==='wolf').map(a=>[a.calm,a.x.toFixed(1),a.y.toFixed(1)]) ),'clock',await p.evaluate(()=>document.getElementById('clkTime').textContent));
// поставим волка рядом и подождём — не кусает
await p.evaluate(()=>{ const w=animals.find(a=>a.kind==='wolf'&&a.calm); spawnT=99; const c=cells.find(c=>freeCell(c)&&Math.hypot(c.x-hero.x,c.y-hero.y)>=1&&Math.hypot(c.x-hero.x,c.y-hero.y)<1.6); w.x=c.x;w.y=c.y;w.z=walkZ(c);w.path=[];w.alpha=1; });
await p.waitForTimeout(4000); console.log('hp after 4s near calm wolf',await p.evaluate(()=>hero.hp), 'wolf dist',await p.evaluate(()=>{const w=animals.find(a=>a.kind==='wolf'&&a.calm);return w&&Math.hypot(w.x-hero.x,w.y-hero.y).toFixed(1)}));
await p.evaluate(()=>{inv.club=1; renderInv(); goTo(animals.find(a=>a.kind==='wolf'&&a.calm));});
await p.waitForFunction(()=>hero.atk&&hero.atk.t>0.12&&hero.atk.t<0.24,null,{timeout:8000,polling:16}).catch(()=>{});
await p.screenshot({path:'atk1.png'});
await p.waitForTimeout(400); console.log('aggro',await p.evaluate(()=>animals.filter(a=>a.kind==='wolf').map(a=>[a.aggro,a.hp])));
await p.waitForFunction(()=>(inv.pelt||0)>0,null,{timeout:15000}).catch(()=>{});
await p.waitForTimeout(500); await p.screenshot({path:'atk2.png'});
console.log('result',await p.evaluate(()=>({hp:hero.hp,inv:{...inv}})));
console.log('errs',errs); await b.close();})();
