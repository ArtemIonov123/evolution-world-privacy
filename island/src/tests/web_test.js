const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const fake=fs.readFileSync('fake_rtdb.js','utf8');
const ctx=await b.newContext({viewport:{width:390,height:740},deviceScaleFactor:2,hasTouch:true,isMobile:true});
await ctx.addInitScript({content:fake}); await ctx.grantPermissions(['clipboard-read','clipboard-write']);
const errs=[]; const pg=async(who,url,nick)=>{const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(who+':'+e.message));
  await p.addInitScript(([n,who])=>{ if(!sessionStorage.getItem('init')){ sessionStorage.setItem('init',1); localStorage.setItem('island_nick',n); if(who==='B'){ localStorage.removeItem('island_world'); localStorage.setItem('island_uid','uBBBBBBBBBBBBBB'); } } },[nick,who]);
  await p.goto(url); await p.waitForTimeout(1500); return p;};
const A=await pg('A','http://localhost:8765/index.html','Artem');
const urlA=A.url(); console.log('A url',urlA,'world',await A.evaluate(()=>window.__islandWorld),'net',await A.evaluate(()=>[!!NET.room,!!NET.db,NET.myId]));
const B=await pg('B',urlA.replace('index.html',''),'Kolega'); await B.waitForTimeout(1500);
console.log('B world',await B.evaluate(()=>window.__islandWorld));
console.log('A remotes',await A.evaluate(()=>[...remotes.values()].map(r=>r.nick+'@'+r.x.toFixed(1))),'B remotes',await B.evaluate(()=>[...remotes.values()].map(r=>r.nick)));
await A.evaluate(()=>goTo(cellAt(13,15))); await A.waitForTimeout(2500);
console.log('B sees A at',await B.evaluate(()=>[...remotes.values()].map(r=>[+r.x.toFixed(1),+r.y.toFixed(1)])),'A',await A.evaluate(()=>[hero.x,hero.y]));
await B.evaluate(()=>sendChat('Cześć!')); await B.waitForTimeout(800); console.log('B own chatlog',await B.evaluate(()=>chatLog.length)); await A.waitForTimeout(2000);
console.log('A bubble',await A.evaluate(()=>[...remotes.values()].map(r=>r.chatSeen&&r.chatSeen.t)),'A chatlog',await A.evaluate(()=>chatLog.map(m=>m.n+':'+m.t)));
const tk=await A.evaluate(()=>{const t=TREES.find(t=>t.c.grow>=1); t.c.falling={t:0,dx:1,dy:0,name:treeName(t.c)}; netTreeGone(t.c); return [t.c.x,t.c.y];}); await A.waitForTimeout(1500);
console.log('tree gone on B',!(await B.evaluate(([x,y])=>!!treeName(cellAt(x,y)),tk)));
await A.evaluate(()=>{const c=cells.find(c=>freeCell(c)&&!c.props.length&&!c.st&&Math.hypot(c.x-hero.x,c.y-hero.y)<3); addFire(c,Date.now()+150000,true);}); await A.waitForTimeout(800);
console.log('fires B',await B.evaluate(()=>fires.length));
await B.evaluate(()=>skipTime()); await B.waitForTimeout(800);
console.log('clock',await A.evaluate(()=>document.getElementById('clkTime').textContent),await B.evaluate(()=>document.getElementById('clkTime').textContent));
console.log('hosts',await A.evaluate(()=>NET.host),await B.evaluate(()=>NET.host));
// invite
await A.evaluate(()=>{document.getElementById('menuBtn')&&0}); console.log('invite visible',await A.evaluate(()=>!document.getElementById('inviteBtn').hidden));
await A.screenshot({path:'web_a.png'});
// B leaves -> sleeper
await B.close({runBeforeUnload:true}); await A.waitForTimeout(4500); console.log('room nodes',await A.evaluate(()=>Object.keys(localStorage).filter(k=>k.includes('/room/')).length)); await A.waitForTimeout(26000);
console.log('after B left remotes',await A.evaluate(()=>remotes.size),'sleepers',await A.evaluate(()=>[...sleepers.values()].map(s=>s.nick)));
// other context without link -> other world
const ctx2=await b.newContext(); await ctx2.addInitScript({content:fake}); const C=await ctx2.newPage(); C.on('pageerror',e=>errs.push('C:'+e.message));
await C.goto('http://localhost:8765/'); await C.waitForTimeout(1200); console.log('C world differs',await C.evaluate(()=>window.__islandWorld)!==await A.evaluate(()=>window.__islandWorld));

console.log('errors',errs); await b.close();})();
