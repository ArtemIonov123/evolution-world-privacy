// Быстрая проверка: игра открывается, герой ходит, ошибок нет.  node tests/smoke_test.js
const { chromium } = require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch(); const p=await (await b.newContext({viewport:{width:390,height:800}})).newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve(__dirname,'../game.html')); await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>{ if(!heroClass) setClass('warrior'); const c=document.getElementById('classWrap'); if(c) c.remove();
    return {cells:cells.length, hero:[Math.round(hero.x),Math.round(hero.y)], hp:hero.hp}; });
  await p.screenshot({path:path.resolve(__dirname,'smoke.png')});
  console.log(JSON.stringify(r)); console.log(errs.length?'ERRORS '+errs.join(' | '):'OK, ошибок нет'); await b.close(); process.exit(errs.length?1:0); })();
