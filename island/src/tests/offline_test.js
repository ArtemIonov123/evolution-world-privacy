const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext(); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const pg=async(who,url,nick,uid)=>{const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(who+':'+e.message));
  await p.addInitScript(([n,u])=>{ if(!sessionStorage.getItem('i')){ sessionStorage.setItem('i',1); localStorage.setItem('island_nick',n); localStorage.setItem('island_uid',u);} },[nick,uid]);
  await p.goto(url); await p.waitForTimeout(1800); return p;};
const A=await pg('A','http://localhost:8765/index.html#world=OfflineTestKey123456','Artem','uAAAAAAAAAAAAAA');
const B=await pg('B','http://localhost:8765/index.html#world=OfflineTestKey123456','Kolega','uBBBBBBBBBBBBBB');
await B.waitForTimeout(4000); await B.close({runBeforeUnload:true}); await A.waitForTimeout(3000);
console.log('sleepers data',await A.evaluate(()=>sleepers.size),'drawn ents',await A.evaluate(()=>cells.reduce((n,c)=>n+(c.ents?c.ents.filter(e=>e.kind==="sleeper").length:0),0)),
  'visible tags',await A.evaluate(()=>[...document.querySelectorAll('#tags .tag')].filter(e=>e.style.display!=="none").map(e=>e.innerText)),
  'panel',await A.evaluate(()=>document.getElementById('players').innerText.replace(/\n/g,' | ')));
console.log('errors',errs); await b.close();})();
