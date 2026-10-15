const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const fake=fs.readFileSync('fake_rtdb.js','utf8'); const errs=[];
const shot=async(w,h,name,act)=>{ const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,hasTouch:true,isMobile:true});
  await ctx.addInitScript({content:fake}); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(name+':'+e.message));
  await p.addInitScript(()=>localStorage.setItem('island_nick','Artem')); await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1300);
  if(act) await act(p); await p.screenshot({path:name}); return [ctx,p]; };
await shot(844,390,'L1.png');
await shot(844,390,'L2.png',async p=>{ await p.click('#menuBtn'); await p.waitForTimeout(200); });
await shot(667,375,'L3.png',async p=>{ await p.click('#chatBtn'); await p.waitForTimeout(300); await p.evaluate(()=>document.getElementById('chatIn').blur()); });
await shot(390,740,'P1.png',async p=>{ await p.waitForTimeout(8500); });
const [ctx,p]=await shot(390,740,'P2.png');
// fullscreen via first tap
console.log('fsBtn visible',await p.evaluate(()=>!document.getElementById('fsBtn').hidden));
await p.tap('canvas',{position:{x:200,y:400}}); await p.waitForTimeout(500);
console.log('fullscreen after tap',await p.evaluate(()=>!!document.fullscreenElement));
// update banner
await p.waitForTimeout(8500); console.log('banner',await p.evaluate(()=>!document.getElementById('upd').hidden));
await p.screenshot({path:'U1.png'});
await p.click('#updBtn'); await p.waitForTimeout(2000); console.log('url after update',p.url());
console.log('errors',errs); await b.close();})();
