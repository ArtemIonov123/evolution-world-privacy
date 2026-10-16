const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const errs=[];
for(const [w,h,n] of [[412,470,'kb'],[412,860,'tall'],[860,390,'land']]){
const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true,deviceScaleFactor:2}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(`window.Telegram={WebApp:{initData:"x",initDataUnsafe:{user:{id:1661222371,first_name:"Artem",language_code:"ru"}},ready(){},expand(){}}};localStorage.setItem("island_lang","ru")`);
await p.goto('http://localhost:8765/index.html#world=ChatKbKey1234567890'); await p.waitForTimeout(2500);
await p.evaluate(()=>{ if(!heroClass) setClass('warrior'); const c=document.getElementById('classWrap'); if(c) c.remove(); document.getElementById('chatBtn').click(); });
await p.waitForTimeout(300); console.log(n, await p.evaluate(()=>{ const r=document.getElementById('chatbar').getBoundingClientRect(); return [Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]; }));
await p.screenshot({path:'shot_chat_'+n+'.png'}); await ctx.close(); }
console.log('errs',errs); await b.close();})();
