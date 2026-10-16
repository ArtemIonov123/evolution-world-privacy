const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const errs=[];
for(const [w,h,f,mob] of [[390,800,'H_p.png',1],[844,390,'H_l.png',1],[1280,760,'H_d.png',0]]){
const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:mob?3:1,hasTouch:!!mob,isMobile:!!mob}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(f+':'+e.message));
await p.addInitScript(()=>{ localStorage.setItem('island_nick','Artem'); localStorage.setItem('island_lang','ru'); });
await p.goto('http://localhost:8765/index.html#world=HudKey123456789012'); await p.waitForTimeout(2500);
await p.evaluate(()=>{ [...document.querySelectorAll('.clcard')][1].click(); prog.xp=800; recalcHP(); hero.hp=7; renderHP(); inv.coin=1250; renderInv(); crystals=35; renderSkills(); });
await p.waitForTimeout(800); await p.screenshot({path:f});
if(f==='H_p.png'){ await p.click('#menuBtn'); await p.waitForTimeout(300); await p.screenshot({path:'H_menu.png'}); }
await ctx.close(); }
console.log('errs',errs); await b.close();})();
