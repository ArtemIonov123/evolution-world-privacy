// Скриншоты сцены для проверки карты и арта:  node tests/scene_shot.js
// tests/scene_phone.png — как на телефоне у героя; tests/scene_wide.png — вся карта сверху
const { chromium } = require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch(); const errs=[];
  const shot=async(vp,file,fn)=>{ const p=await (await b.newContext({viewport:vp})).newPage();
    p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file://'+path.resolve(__dirname,'../game.html')); await p.waitForTimeout(1500);
    await p.evaluate(fn); await p.waitForTimeout(700);
    await p.screenshot({path:path.resolve(__dirname,file)}); await p.close(); };
  const prep=`if(!heroClass) setClass('warrior'); for(const id of ['classWrap','nickWrap']){ const e=document.getElementById(id); if(e) e.remove(); }`;
  await shot({width:390,height:800},'scene_phone.png',new Function(prep));
  await shot({width:1400,height:1000},'scene_wide.png',new Function(prep+`
    follow=false; scale=1; zoomK=scale*dprNow(); panX=innerWidth/2; panY=innerHeight/2+60; dirty=true;`));
  console.log(errs.length?'ERRORS '+errs.join(' | '):'OK, ошибок нет'); await b.close(); process.exit(errs.length?1:0); })();
