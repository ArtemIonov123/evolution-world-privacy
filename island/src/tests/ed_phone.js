const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:740},deviceScaleFactor:2,hasTouch:true,isMobile:true});
await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>localStorage.setItem('island_nick','Artem'));
await p.goto('http://localhost:8765/index.html#world=PhoneWorldKey1234567&admin=x1'); await p.waitForTimeout(1800);
await p.evaluate(()=>edEnter()); await p.waitForTimeout(300); await p.screenshot({path:'ed_phone.png'});
await p.setViewportSize({width:844,height:390}); await p.waitForTimeout(400); await p.screenshot({path:'ed_land.png'});
console.log('errs',errs); await b.close();})();
