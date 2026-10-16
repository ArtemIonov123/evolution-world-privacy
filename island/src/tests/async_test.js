const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:900,height:650}});
const mock=fs.readFileSync('mock_claude.js','utf8');
const errs=[];
// у каждого игрока свой постоянный id (как аккаунт): задаём суффикс до загрузки
const open=async(who)=>{const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(who+':'+e.message));
  await p.addInitScript({content:`window.__fixedPeer=${JSON.stringify(who)};`+mock.replace("const peer='p'+Math.random().toString(36).slice(2,8)+(window.__peerSuffix||'');","const peer=window.__fixedPeer+Math.random().toString(36).slice(2,5);").replace("const uid='u_'+peer;","const uid='u_'+window.__fixedPeer;").replace("by:'u_'+p,","by:'u_'+(v&&v.id?String(v.id).slice(2):p),")});
  await p.addInitScript(()=>{try{localStorage.setItem('island_nick','N_'+(window.__fixedPeer||''))}catch(e){}}); await p.goto('http://localhost:8765/index.html'); return p;};
const A0=await ctx.newPage(); await A0.goto('http://localhost:8765/index.html'); await A0.evaluate(()=>localStorage.clear()); await A0.close();
// 1) A играет один, пишет и уходит
const A=await open('artem'); await A.waitForTimeout(1500);
await A.evaluate(()=>goTo(cellAt(13,15))); await A.waitForTimeout(2500);
await A.evaluate(()=>sendChat('Byłem tu, ściąłem drzewo!')); await A.waitForTimeout(4500);
console.log('A players doc', await A.evaluate(()=>localStorage.getItem('mockdb:players/u_artem')));
await A.close({runBeforeUnload:true});
// 2) B приходит позже
const B=await open('druh'); await B.waitForTimeout(2500);
console.log('B sleepers', await B.evaluate(()=>activeSleepers().map(s=>[s.by,s.x,s.y])), 'status', await B.evaluate(()=>document.getElementById('toast').innerText), 'dot', await B.evaluate(()=>document.getElementById('chatDot').hidden?'-':document.getElementById('chatDot').textContent));
console.log('B players panel', await B.evaluate(()=>document.getElementById('players').innerText.replace(/\n/g,' | ')));
await B.evaluate(()=>{follow=false;const s=activeSleepers()[0];const [hx,hy]=proj(s.x-MX,s.y-MY,s.z);const r=cv.getBoundingClientRect();panX=r.width/2-hx*scale;panY=r.height/2-hy*scale;dirty=true});
await B.waitForTimeout(300); await B.screenshot({path:'as1.png'});
await B.click('#chatBtn'); await B.waitForTimeout(300);
console.log('B chat log', await B.evaluate(()=>document.getElementById('chatLog').innerText.replace(/\n/g,' ')), 'dot after open', await B.evaluate(()=>document.getElementById('chatDot').hidden));
await B.screenshot({path:'as2.png'});
await B.keyboard.press('Escape');
// 3) A возвращается
const A2=await open('artem'); await A2.waitForTimeout(2500);
console.log('B sees after A returns: sleepers', await B.evaluate(()=>activeSleepers().length), 'online', await B.evaluate(()=>[...remotes.values()].map(r=>r.by)));
console.log('A2 restored pos', await A2.evaluate(()=>[hero.x,hero.y]));
console.log('errors',errs); await b.close();})();
