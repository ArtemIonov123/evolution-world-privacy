const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:740}}); const errs=[];
p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('console:'+m.text().slice(0,150)); });
await p.addInitScript(()=>localStorage.setItem('island_nick','Test'));
await p.goto('http://localhost:8765/real.html'); await p.waitForTimeout(4000);
console.log(await p.evaluate(()=>({fb:typeof firebase, apps:firebase.apps.length, world:window.__islandWorld, room:!!NET.room, db:!!NET.db, url:location.href, hero:[hero.x,hero.y]})));
await p.evaluate(()=>goTo(cellAt(13,15))); await p.waitForTimeout(2500); console.log('moved',await p.evaluate(()=>[hero.x,hero.y]));
await p.screenshot({path:'real.png'}); console.log('errs',errs.slice(0,5)); await b.close();})();
