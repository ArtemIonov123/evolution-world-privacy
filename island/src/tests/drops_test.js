const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1000,height:760}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const pg=async(who,url,uid)=>{const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(who+':'+e.message));
  await p.addInitScript(([u])=>{ if(!sessionStorage.getItem('i')){ sessionStorage.setItem('i',1); localStorage.setItem('island_nick','Gracz'); localStorage.setItem('island_uid',u);} },[uid]);
  await p.goto(url); await p.waitForTimeout(1800); return p;};
const WK='DropsTestWorldKey123';
const A=await pg('A',`http://localhost:8765/index.html#world=${WK}&admin=z`,'uAAAAAAAAAAAAAA');
const B=await pg('B',`http://localhost:8765/index.html#world=${WK}`,'uBBBBBBBBBBBBBB');
await A.evaluate(()=>{ edEnter(); edTab="drop"; edRender(); });
// UI edits: add drop row (coin), set pelt chance 0, wolf xp 50, big tree logs 10, gold weight 1000, fisher karas 9
await A.evaluate(()=>{ [...document.querySelectorAll('.edpanel button')].find(b=>b.textContent.includes('dodaj')).click(); });
await A.evaluate(()=>{ const rows=[...document.querySelectorAll('.eddr')]; const set=(el,v)=>{el.value=String(v); el.dispatchEvent(new Event('input'));};
  set(rows[0].querySelectorAll('.ednum')[0],0);            // pelt 0%
  const last=rows[rows.length-1].querySelectorAll('.ednum'); set(last[0],100); set(last[1],5); set(last[2],5);   // coin 5
  edCfg.xp.wolf=50; edCfg.logs.tree_big=10; edCfg.fishW.gold=1000; edCfg.fisher.karas=9; cfgDirty=true; });
await A.screenshot({path:'drop_tab.png'});
await A.evaluate(()=>saveConfig()); await B.waitForTimeout(1500);
console.log('B cfg',await B.evaluate(()=>({drops:CFG.drops.wolf,xp:CFG.xp,logs:CFG.logs,fishW:CFG.fishW,fisher:CFG.fisher})));
const r=await B.evaluate(()=>{ const xp0=prog.xp; giveLoot({kind:"wolf"}); const inv1={...inv}; const xpGain=prog.xp-xp0;
  let gold=0; for(let i=0;i<300;i++) if(pickFish().id==="gold") gold++;
  inv.karas=2; const fv=fishValue();
  return {inv1,xpGain,goldShare:gold/300,fv,logsBig:logsOf("tree_big")}; });
console.log('B results',JSON.stringify(r));
console.log('errors',errs); await b.close();})();
