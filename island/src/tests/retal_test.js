const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:900,height:600}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const WK='RetalWorldKey123456';
const pg=async(who,uid,nick)=>{const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(who+':'+e.message));
  await p.addInitScript(([u,n])=>{ const me=sessionStorage.getItem('myuid')||u; sessionStorage.setItem('myuid',me); localStorage.setItem('island_uid',me); localStorage.setItem('island_nick',n); localStorage.setItem('island_lang','ru'); sessionStorage.setItem('island_zone','cave'); },[uid,nick]);
  await p.goto(`http://localhost:8765/index.html#world=${WK}`); await p.waitForTimeout(2500); return p;};
const A=await pg('A','uAAAAAAAAAAAAAA','Artem'), B=await pg('B','uBBBBBBBBBBBBBB','Bogdan');
for(const P of [A,B]) await P.evaluate(()=>{ setClass('warrior'); giveItem('sword_iron'); HP_MAX=30; hero.hp=30; });
const host=(await A.evaluate(()=>NET.host))?A:B, guest=host===A?B:A;
for(const [name,P] of [['host',host],['guest',guest]]){
  const other=P===host?guest:host; await other.evaluate(()=>{ const g=MAP.boss; hero.x=g[0]; hero.y=g[1]+2; hero.path=[]; });
  await P.waitForTimeout(600);
  const pos=await P.evaluate(()=>{ const c=cells.find(c=>freeCell(c)&&c.L===1&&Math.hypot(c.x-MAP.start[0],c.y-MAP.start[1])<4); hero.x=c.x; hero.y=c.y; hero.z=walkZ(c); hero.path=[]; hero.target=null; return [c.x,c.y]; });
  await host.evaluate(([x,y])=>{ for(const a of animals) a.dead=true; const c=cells.find(c=>freeCell(c)&&Math.hypot(c.x-x,c.y-y)>0.9&&Math.hypot(c.x-x,c.y-y)<1.6); spawnAnimal("spider",c); const s=animals[animals.length-1]; s.alpha=1; s.hp=40; s.aggro=true; s.home={x:c.x,y:c.y}; },pos);
  await P.waitForTimeout(4000);
  console.log(name,await P.evaluate(()=>({target:hero.target&&hero.target.kind,attacked:!!hero.attacker,hp:hero.hp})), 'spider hp',await host.evaluate(()=>{ const s=animals.find(a=>a.kind==="spider"); return s&&s.hp; }));
  // если игрок уходит — не тянет обратно
  await P.evaluate(([x,y])=>{ goTo(cellAt(x-2,y)||cells.find(c=>freeCell(c)&&Math.hypot(c.x-x,c.y-y)>3)); },pos);
  await P.waitForTimeout(300); console.log(name,'after walk order: target',await P.evaluate(()=>hero.target&&hero.target.kind),'path',await P.evaluate(()=>hero.path.length));
  await host.evaluate(()=>{ for(const a of animals) a.dead=true; });
}
console.log('errs',errs); await b.close();})();
