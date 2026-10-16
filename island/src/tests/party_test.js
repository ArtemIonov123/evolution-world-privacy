const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1000,height:700}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const WK='PartyWorldKey123456';
const pg=async(who,uid,nick)=>{const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(who+':'+e.message));
  await p.addInitScript(([u,n])=>{ const me=sessionStorage.getItem('myuid')||u; sessionStorage.setItem('myuid',me); localStorage.setItem('island_uid',me); localStorage.setItem('island_nick',sessionStorage.getItem('mynick')||n); sessionStorage.setItem('mynick',sessionStorage.getItem('mynick')||n); localStorage.setItem('island_lang','ru'); },[uid,nick]);
  await p.goto(`http://localhost:8765/index.html#world=${WK}`); await p.waitForTimeout(1800); return p;};
const A=await pg('A','uAAAAAAAAAAAAAA','Artem'), B=await pg('B','uBBBBBBBBBBBBBB','Bogdan'), C=await pg('C','uCCCCCCCCCCCCCC','Cyryl');
await A.waitForTimeout(1500);
const ids=await A.evaluate(()=>[...online.keys()]); console.log('A online',ids);
// A зовёт B через меню списка
await A.evaluate(()=>{ selPlayer="uBBBBBBBBBBBBBB"; renderPlayers(); });
console.log('A menu',await A.evaluate(()=>[...document.querySelectorAll('.pmenu .btn')].map(b=>b.textContent)));
await A.evaluate(()=>[...document.querySelectorAll('.pmenu .btn')].find(b=>b.textContent.includes('Пригласить')).click());
await B.waitForTimeout(2500);
console.log('B ask',await B.evaluate(()=>!document.getElementById('partyAsk').hidden&&document.getElementById('partyAskText').textContent));
await B.screenshot({path:'P_ask.png'});
await B.click('#partyYes'); await A.waitForTimeout(2500);
console.log('A party',await A.evaluate(()=>partyMembers().map(m=>m.uid)),'B party',await B.evaluate(()=>partyMembers().map(m=>m.uid)),'C party',await C.evaluate(()=>partyMembers().length));
// C отказывается
await A.evaluate(()=>invitePlayer("uCCCCCCCCCCCCCC")); await C.waitForTimeout(2500); await C.click('#partyNo'); await C.waitForTimeout(1000);
console.log('C after no',await C.evaluate(()=>partyMembers().length),'ask hidden',await C.evaluate(()=>document.getElementById('partyAsk').hidden));
await A.screenshot({path:'P_A.png'});
// общий опыт: B бьёт волка рядом с A — опыт A растёт
const host=(await A.evaluate(()=>NET.host))?A:(await B.evaluate(()=>NET.host))?B:C;
console.log('host is',host===A?'A':host===B?'B':'C');
await A.evaluate(()=>{ hero.path=[]; }); 
const pos=await A.evaluate(()=>[hero.x,hero.y]);
await B.evaluate(([x,y])=>{ hero.x=x+1; hero.y=y; hero.path=[]; giveItem("sword_iron"); },pos);
await C.evaluate(([x,y])=>{ hero.x=x; hero.y=y+1; hero.path=[]; },pos);
await A.waitForTimeout(1500);
const xp0=await Promise.all([A,B,C].map(p=>p.evaluate(()=>prog.xp)));
await host.evaluate(([x,y])=>{ const c=cells.find(c=>freeCell(c)&&Math.hypot(c.x-x-1,c.y-y)<2&&Math.hypot(c.x-x-1,c.y-y)>0.5); spawnAnimal("wolf",c); const w=animals[animals.length-1]; w.alpha=1; w.hp=1; },pos);
await B.waitForTimeout(800);
const bPeer=await B.evaluate(()=>NET.myPeer);
await host.evaluate(([bp,x,y])=>{ const w=animals[animals.length-1]; applyHit(w,bp,x+1,y,5); },[bPeer,...pos]);
await B.waitForTimeout(3000);
const xp1=await Promise.all([A,B,C].map(p=>p.evaluate(()=>prog.xp)));
console.log('xp before',xp0,'after',xp1);
// лидер уходит в пещеру — B предлагают пойти следом
await A.evaluate(()=>travelZone("cave")); await B.waitForTimeout(5000);
console.log('B follow ask',await B.evaluate(()=>!document.getElementById('partyAsk').hidden&&document.getElementById('partyAskText').textContent));
await B.screenshot({path:'P_follow.png'});
await B.click('#partyYes'); await B.waitForTimeout(4000);
console.log('B zone',await B.evaluate(()=>ZONE),'B party after reload',await B.evaluate(()=>partyMembers().map(m=>m.uid)),'A zone',await A.evaluate(()=>ZONE));
await A.screenshot({path:'P_cave.png'});
// исключение
await A.evaluate(()=>kickPlayer("uBBBBBBBBBBBBBB")); await B.waitForTimeout(3000);
console.log('B after kick',await B.evaluate(()=>partyMembers().length),'A after kick',await A.evaluate(()=>partyMembers().length));
console.log('errs',errs); await b.close();})();
