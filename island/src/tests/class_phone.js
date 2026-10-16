const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const errs=[];
for(const [w,h,f] of [[390,800,'CLP_p.png'],[844,390,'CLP_l.png']]){
const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:3,hasTouch:true,isMobile:true}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{ localStorage.setItem('island_nick','Artem'); localStorage.setItem('island_lang','ru'); });
await p.goto('http://localhost:8765/index.html#world=ClassPhoneKey123456'); await p.waitForTimeout(2500);
await p.screenshot({path:f.replace('.png','_pick.png')});
await p.evaluate(()=>[...document.querySelectorAll('.clcard')][1].click()); await p.evaluate(()=>{ prog.xp=2000; recalcHP(); renderSkills(); skillCd.thorn=0.6; });
await p.waitForTimeout(400); await p.screenshot({path:f}); await ctx.close(); }
console.log('errs',errs); await b.close();})();
