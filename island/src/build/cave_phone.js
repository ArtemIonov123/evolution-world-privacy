const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const errs=[];
for(const [w,h,f] of [[390,800,'CP_port.png'],[844,390,'CP_land.png']]){
const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:3,hasTouch:true,isMobile:true}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{ localStorage.setItem('island_nick','Artem'); localStorage.setItem('island_lang','ru'); sessionStorage.setItem('island_zone','cave'); });
await p.goto('http://localhost:8765/index.html#world=CavePhoneKey1234567'); await p.waitForTimeout(2500);
await p.evaluate(()=>{ const g=MAP.boss; const c=cells.filter(c=>!c.blocked&&Math.hypot(c.x-g[0],c.y-g[1])<3.5&&Math.hypot(c.x-g[0],c.y-g[1])>2.5)[0]; hero.x=c.x; hero.y=c.y; hero.z=walkZ(c); });
await p.waitForTimeout(4000); await p.screenshot({path:f}); await ctx.close(); }
console.log('errs',errs); await b.close();})();
