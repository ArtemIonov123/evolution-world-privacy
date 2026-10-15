const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const errs=[];
for(const [w,h,f] of [[390,800,'Z_P.png'],[844,390,'Z_L.png'],[1280,800,'Z_D.png']]){
const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:w<900?3:1,hasTouch:w<900,isMobile:w<900});
await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(f+':'+e.message));
await p.addInitScript(()=>{localStorage.setItem('island_nick','Artem');localStorage.setItem('island_lang','ru')});
await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1500);
const k0=await p.evaluate(()=>zoomK);
await p.mouse.move(w/2,h/2); await p.mouse.wheel(0,-300); await p.waitForTimeout(200);
const k1=await p.evaluate(()=>zoomK);
const info=await p.evaluate(()=>({info:!!document.getElementById('toast'),zin:!!document.getElementById('zIn'),hb:document.getElementById('hotbar').getBoundingClientRect().bottom,H:innerHeight}));
await p.evaluate(()=>{ say("need_rod","need_rod_sub"); });
await p.waitForTimeout(400); await p.screenshot({path:f});
await p.evaluate(()=>openWin("bag")); await p.waitForTimeout(300); await p.screenshot({path:f.replace('.png','_w.png')});
console.log(f,{k0,k1,...info});
await ctx.close();}
console.log('errs',errs); await b.close();})();
