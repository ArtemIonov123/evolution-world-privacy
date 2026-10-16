const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const errs=[];
for(const [w,h,f] of [[390,800,'K_p.png'],[844,390,'K_l.png']]){
const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:3,hasTouch:true,isMobile:true}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{ localStorage.setItem('island_nick','Artem'); localStorage.setItem('island_lang','ru'); });
await p.goto('http://localhost:8765/index.html#world=CoinKey123456789'); await p.waitForTimeout(1500);
await p.evaluate(()=>{ inv.coin=1234; renderInv(); }); await p.waitForTimeout(700);
console.log(f,await p.evaluate(()=>document.getElementById('hdCoinN').textContent));
await p.screenshot({path:f,clip:{x:0,y:0,width:w,height:60}}); await ctx.close(); }
console.log('errs',errs); await b.close();})();
