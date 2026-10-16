const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1000,height:700}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const WK='CaveWorldKey1234567';
const pg=async(who,uid)=>{const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(who+':'+e.message));
  await p.addInitScript(([u])=>{ if(!sessionStorage.getItem('i')){ sessionStorage.setItem('i',1); localStorage.setItem('island_nick',u.slice(1,5)); localStorage.setItem('island_uid',u); localStorage.setItem('island_lang','ru');} },[uid]);
  await p.goto(`http://localhost:8765/index.html#world=${WK}`); await p.waitForTimeout(1800); return p;};
const A=await pg('A','uAAAAAAAAAAAAAA'), B=await pg('B','uBBBBBBBBBBBBBB');
console.log('portal island',await A.evaluate(()=>PORTAL&&[PORTAL.x,PORTAL.y,PORTAL.L]));
await A.evaluate(()=>{ const c=PORTAL; const p=proj(c.x-MX,c.y-MY,c.L); panX=500-p[0]*scale; panY=380-p[1]*scale; follow=false; dirty=true; });
await A.waitForTimeout(300); await A.screenshot({path:'C_entr.png'});
// A идёт к входу
await A.evaluate(()=>{ follow=true; goTo("portal"); });
await A.waitForTimeout(9000);
console.log('A zone',await A.evaluate(()=>ZONE),'pos',await A.evaluate(()=>[hero.x,hero.y]),'exit',await A.evaluate(()=>PORTAL&&[PORTAL.x,PORTAL.y]));
await B.waitForTimeout(1500);
console.log('B list',await B.evaluate(()=>document.getElementById('players').innerText.replace(/\n/g,' | ')),'B remotes',await B.evaluate(()=>remotes.size));
await A.waitForTimeout(4000);
console.log('A animals',await A.evaluate(()=>animals.map(a=>a.kind+':'+a.hp).join(',')));
await A.screenshot({path:'C_in.png'});
// B тоже в пещеру
await B.evaluate(()=>{ goTo("portal"); }); await B.waitForTimeout(9000);
console.log('B zone',await B.evaluate(()=>ZONE),'A sees remotes',await A.evaluate(()=>remotes.size),'B host?',await B.evaluate(()=>NET.host),'A host?',await A.evaluate(()=>NET.host));
// оба к голему
const H=(await A.evaluate(()=>NET.host))?A:B, G=H===A?B:A;
for(const P of [A,B]) await P.evaluate(()=>{ giveItem("sword_iron"); hero.hp=HP_MAX=20; const g=MAP.boss; const c=cells.filter(c=>!c.blocked&&Math.hypot(c.x-g[0],c.y-g[1])<2.2&&Math.hypot(c.x-g[0],c.y-g[1])>1)[0]; hero.x=c.x; hero.y=c.y; hero.z=walkZ(c); hero.path=[]; });
await A.waitForTimeout(3000);
console.log('golem',await H.evaluate(()=>{ const g=animals.find(a=>a.kind==="golem"); return g&&{hp:g.hp,aggro:g.aggro,slam:g.slamT}; }));
for(let i=0;i<14;i++){ await H.waitForTimeout(250); }
await A.screenshot({path:'C_boss_A.png'}); await B.screenshot({path:'C_boss_B.png'});
console.log('bossbar A',await A.evaluate(()=>!document.getElementById('bossBar').hidden&&document.getElementById('bossNum').textContent),'hp A',await A.evaluate(()=>hero.hp),'hp B',await B.evaluate(()=>hero.hp));
// оба бьют
for(const P of [A,B]) await P.evaluate(()=>{ const g=animals.find(a=>a.kind==="golem"); if(g) attackWolf(g); });
await H.evaluate(()=>{ const g=animals.find(a=>a.kind==="golem"); g.hp=6; });
await A.waitForTimeout(7000);
console.log('after fight: golem',await H.evaluate(()=>{ const g=animals.find(a=>a.kind==="golem"); return g?{hp:g.hp,dying:g.dying}:null; }),'deadAt',await G.evaluate(()=>bossDeadAt>0));
console.log('loot A',await A.evaluate(()=>({core:inv.golem_core,coin:inv.coin,st:prog.st.bosses})),'loot B',await B.evaluate(()=>({core:inv.golem_core,coin:inv.coin,st:prog.st.bosses})));
// A выходит
await A.evaluate(()=>{ hero.target=null; const c=PORTAL; const n=cells.find(k=>!k.blocked&&Math.hypot(k.x-c.x,k.y-c.y)<1.5); hero.x=n.x; hero.y=n.y; hero.path=[]; goTo("portal"); });
await A.waitForTimeout(5000);
console.log('A zone after exit',await A.evaluate(()=>ZONE),'pos',await A.evaluate(()=>[hero.x,hero.y]),'near entr',await A.evaluate(()=>Math.hypot(hero.x-PORTAL.x,hero.y-PORTAL.y)));
console.log('errs',errs); await b.close();})();
