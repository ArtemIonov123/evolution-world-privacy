const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const errs=[];
for(const [w,h,f] of [[390,800,'R_p.png'],[844,390,'R_l.png']]){
const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:3,hasTouch:true,isMobile:true}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{ localStorage.setItem('island_nick','Artem'); localStorage.setItem('island_lang','ru'); });
await p.goto('http://localhost:8765/index.html#world=DayKey12345678901'); await p.waitForTimeout(2500);
await p.evaluate(()=>{ [...document.querySelectorAll('.clcard')][1].click(); prog.xp=800; recalcHP(); renderSkills(); skillCd.thorn=0.5; });
await p.evaluate(()=>{ clockDoc={t0:Date.now(),c0:23/24}; }); await p.waitForTimeout(1200);
console.log(f,await p.evaluate(()=>({clock:document.getElementById('clkTime').textContent,dark:darkness(),night:isNight(),skip:document.getElementById('skipTime').hidden})));
await p.screenshot({path:f}); await ctx.close(); }
console.log('errs',errs); await b.close();})();
