const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:740},deviceScaleFactor:2,hasTouch:true,isMobile:true});
await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>localStorage.setItem('island_nick','Artem'));
await p.goto('http://localhost:8765/index.html#world=MobTimeUiWorldKey123&admin=q'); await p.waitForTimeout(1800);
await p.evaluate(()=>{ edEnter(); edTab="drop"; edRender(); }); await p.screenshot({path:'mt_cards.png'});
await p.evaluate(()=>{ edDropSel="mob:bat"; edRender(); document.querySelector('.edpanel').scrollTop=9999; }); await p.waitForTimeout(100); await p.screenshot({path:'mt_bat.png'});
console.log('errs',errs); await b.close();})();
