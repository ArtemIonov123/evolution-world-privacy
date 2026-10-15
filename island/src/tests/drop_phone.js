const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:740},deviceScaleFactor:2,hasTouch:true,isMobile:true});
await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>localStorage.setItem('island_nick','Artem'));
await p.goto('http://localhost:8765/index.html#world=DropPhoneWorldKey123&admin=q'); await p.waitForTimeout(1800);
await p.evaluate(()=>{ edEnter(); edTab="drop"; edRender(); }); await p.waitForTimeout(200); await p.screenshot({path:'drop_phone_cards.png'});
await p.tap('.edcard'); await p.waitForTimeout(200); await p.screenshot({path:'drop_phone_wolf.png'});
console.log('sel',await p.evaluate(()=>edDropSel),'errs',errs); await b.close();})();
