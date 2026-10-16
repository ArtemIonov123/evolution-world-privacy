const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const errs=[];
for(const [cl,f] of [[1,'I_druid.png'],[0,'I_war.png']]){
const ctx=await b.newContext({viewport:{width:390,height:800},deviceScaleFactor:3,hasTouch:true,isMobile:true}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{ localStorage.setItem('island_nick','Artem'); localStorage.setItem('island_lang','ru'); });
await p.goto('http://localhost:8765/index.html#world=IconsKey1234567890'); await p.waitForTimeout(2500);
await p.evaluate(c=>{ [...document.querySelectorAll('.clcard')][c].click(); prog.xp=800; recalcHP(); renderSkills(); },cl);
await p.waitForTimeout(400); await p.screenshot({path:f,clip:{x:200,y:520,width:190,height:280}});
await p.evaluate(()=>openWin("hero")); await p.waitForTimeout(400); await p.screenshot({path:f.replace('.png','_win.png')});
await ctx.close(); }
console.log('errs',errs); await b.close();})();
