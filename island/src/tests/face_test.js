const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:900,height:650}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const pg=async(who,uid)=>{const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(who+':'+e.message));
  await p.addInitScript(([u])=>{ if(!sessionStorage.getItem('i')){ sessionStorage.setItem('i',1); localStorage.setItem('island_nick',u.slice(1,4)); localStorage.setItem('island_uid',u);} },[uid]);
  await p.goto('http://localhost:8765/index.html#world=FaceWorldKey1234567'); await p.waitForTimeout(1800); return p;};
const A=await pg('A','uAAAAAAAAAAAAAA'), B=await pg('B','uBBBBBBBBBBBBBB');
for(const [who,P,turns] of [['A rot1',A,1],['A rot2',A,1],['B rot3 too',B,3]]){
  await P.evaluate(t=>{ for(let i=0;i<t;i++) rotate(1); },turns); await P.waitForTimeout(900);
  // B walks along +x in the world
  const res=await B.evaluate(()=>{ const c=cells.find(c=>!c.blocked&&!c.water&&cellAt(c.x+1,c.y)&&!cellAt(c.x+1,c.y).blocked&&cellAt(c.x+2,c.y)&&!cellAt(c.x+2,c.y).blocked&&Math.abs(cellAt(c.x+2,c.y).L-c.L)<1);
    hero.x=c.x; hero.y=c.y; hero.path=[[c.x+1,c.y],[c.x+2,c.y]]; return [c.x,c.y]; });
  await B.waitForTimeout(250);
  const bF=await B.evaluate(()=>({f:hero.facing,want:worldToFaceQ(1,0,quarter()),q:quarter()}));
  await A.waitForTimeout(300);
  const aSees=await A.evaluate(()=>{ const r=[...remotes.values()][0]; return {f:r&&r.f,want:worldToFaceQ(1,0,quarter()),q:quarter()}; });
  console.log(who,'B self',bF,'A sees B',aSees);
  await B.waitForTimeout(700);
}
// local remap: hero standing, rotate -> world direction kept
const loc=await A.evaluate(()=>{ hero.facing="se"; const w0=faceToWorldQ("se",quarter()); rotate(1); return w0; });
await A.waitForTimeout(900);
console.log('A local keep',loc,await A.evaluate(()=>faceToWorldQ(hero.facing,quarter())));
console.log('errs',errs); await b.close();})();
