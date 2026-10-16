const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const errs=[]; const ctx=await b.newContext(); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(`window.Telegram={WebApp:{initData:"x",initDataUnsafe:{user:{id:1661222371,first_name:"Artem",language_code:"ru"}},ready(){},expand(){}}};`);
await p.goto('http://localhost:8765/index.html#world=CapTestKey12345678901'); await p.waitForTimeout(2500);
await p.evaluate(()=>{ if(!heroClass) setClass('warrior'); inv.coin=1500000; crystals=54321; inv.wood=25000; saveNow(); }); await p.waitForTimeout(1500);
await p.reload(); await p.waitForTimeout(2500);
console.log(await p.evaluate(()=>({coin:inv.coin,cr:crystals,wood:inv.wood,hud:document.getElementById('hdCoinN').textContent})));
console.log('errs',errs); await b.close();})();
