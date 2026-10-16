const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1000,height:700}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const WK='ClassWorldKey123456';
const pg=async(who,uid,nick)=>{const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(who+':'+e.message));
  await p.addInitScript(([u,n])=>{ const me=sessionStorage.getItem('myuid')||u; sessionStorage.setItem('myuid',me); localStorage.setItem('island_uid',me); localStorage.setItem('island_nick',sessionStorage.getItem('mynick')||n); sessionStorage.setItem('mynick',sessionStorage.getItem('mynick')||n); localStorage.setItem('island_lang','ru'); },[uid,nick]);
  await p.goto(`http://localhost:8765/index.html#world=${WK}`); await p.waitForTimeout(2500); return p;};
const A=await pg('A','uAAAAAAAAAAAAAA','Artem'), B=await pg('B','uBBBBBBBBBBBBBB','Bogdan');
console.log('A picker',await A.evaluate(()=>!!document.getElementById('classWrap')));
await A.screenshot({path:'CL_pick.png'});
// A — воин, B — друид
await A.evaluate(()=>[...document.querySelectorAll('.clcard')][0].click());
await B.evaluate(()=>[...document.querySelectorAll('.clcard')][1].click());
console.log('A',await A.evaluate(()=>({cl:heroClass,hp:HP_MAX,sk:[...document.querySelectorAll('.skb')].map(b=>b.dataset.sk+(b.disabled?'(L)':''))})),
  'B',await B.evaluate(()=>({cl:heroClass,hp:HP_MAX,sk:[...document.querySelectorAll('.skb')].map(b=>b.dataset.sk+(b.disabled?'(L)':''))})));
await A.waitForTimeout(1500);
console.log('A sees B class',await A.evaluate(()=>[...remotes.values()].map(r=>r.cl)));
// прокачаем обоих до 10 уровня
for(const P of [A,B]) await P.evaluate(()=>{ prog.xp=2000; recalcHP(); hero.hp=HP_MAX=Math.max(HP_MAX,30); renderSkills(); });
const host=(await A.evaluate(()=>NET.host))?A:B, other=host===A?B:A;
// волк рядом с B: шип
const pos=await B.evaluate(()=>[hero.x,hero.y]);
await host.evaluate(([x,y])=>{ const c=cells.filter(c=>freeCell(c)&&Math.hypot(c.x-x,c.y-y)>2.5&&Math.hypot(c.x-x,c.y-y)<4.5)[0]; spawnAnimal("spider",c); const w=animals[animals.length-1]; w.alpha=1; w.hp=20; w.home={x:c.x,y:c.y}; },pos);
await B.waitForTimeout(800);
const hp0=await host.evaluate(()=>{ const s=animals.find(a=>a.kind==="spider"); return s&&s.hp; });
await B.evaluate(()=>useSkill("thorn")); await B.waitForTimeout(1200);
const hp1=await host.evaluate(()=>{ const s=animals.find(a=>a.kind==="spider"); return s&&s.hp; });
console.log('thorn: spider hp',hp0,'->',hp1);
// медведь
await B.evaluate(()=>useSkill("bear")); await B.waitForTimeout(800);
console.log('B bear',await B.evaluate(()=>({form,HP_MAX})),'A sees form',await A.evaluate(()=>[...remotes.values()].map(r=>r.fm)));
await A.screenshot({path:'CL_bear_A.png'});
// лечение: A ранен рядом с B
await B.evaluate(()=>endForm());
await A.evaluate(([x,y])=>{ hero.x=x+1; hero.y=y; hero.hp=Math.max(1,HP_MAX-5); renderHP(); },pos);
await A.waitForTimeout(800);
const ah0=await A.evaluate(()=>hero.hp);
await B.evaluate(()=>{ skillCd.heal=0; useSkill("heal"); }); await A.waitForTimeout(1500);
console.log('heal: A hp',ah0,'->',await A.evaluate(()=>hero.hp));
// воин: щит, рывок, вихрь
await A.evaluate(()=>useSkill("shield")); await B.waitForTimeout(800);
console.log('B sees A shield',await B.evaluate(()=>[...remotes.values()].map(r=>r.sh)));
const apos=await A.evaluate(()=>[hero.x,hero.y]);
await host.evaluate(([x,y])=>{ for(const a of animals) if(a.kind==="spider") a.dead=true; const c=cells.filter(c=>freeCell(c)&&Math.hypot(c.x-x,c.y-y)>2.2&&Math.hypot(c.x-x,c.y-y)<3.8)[0]; spawnAnimal("spider",c); const w=animals[animals.length-1]; w.alpha=1; w.hp=30; w.aggro=true; w.home={x:c.x,y:c.y}; },apos);
await A.waitForTimeout(900);
const s0=await host.evaluate(()=>{ const s=animals.find(a=>a.kind==="spider"); return s&&s.hp; });
await A.evaluate(()=>{ useSkill("rush"); }); await A.waitForTimeout(800);
const st=await host.evaluate(()=>{ const s=animals.find(a=>a.kind==="spider"); return s&&{hp:s.hp,stun:s.stunT}; });
console.log('rush: spider',s0,'->',st);
await A.evaluate(()=>{ useSkill("whirl"); }); await A.waitForTimeout(800);
console.log('whirl: spider',await host.evaluate(()=>{ const s=animals.find(a=>a.kind==="spider"); return s&&s.hp; }));
await A.screenshot({path:'CL_A.png'});
// сохранение класса после перезагрузки
await B.waitForTimeout(4500); await B.reload(); await B.waitForTimeout(3000);
console.log('B after reload',await B.evaluate(()=>({cl:heroClass,picker:!!document.getElementById('classWrap')})));
console.log('errs',errs); await b.close();})();
