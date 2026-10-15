const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1000,height:700}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const WK='CaveEdWorldKey12345';
const pg=async(who,uid,admin)=>{const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(who+':'+e.message));
  await p.addInitScript(([u])=>{ if(!sessionStorage.getItem('i')){ sessionStorage.setItem('i',1); localStorage.setItem('island_uid',u); localStorage.setItem('island_lang','ru'); localStorage.setItem('island_nick','N'+u.slice(1,4));} },[uid]);
  await p.goto(`http://localhost:8765/index.html#world=${WK}${admin?'&admin=z':''}`); await p.waitForTimeout(1800); return p;};
const A=await pg('A','uAAAAAAAAAAAAAA',true), B=await pg('B','uBBBBBBBBBBBBBB',false);
// остров: переносим вход в пещеру
const moved=await A.evaluate(()=>{ edEnter(); edCat="places"; edRender(); const tools=[...document.querySelectorAll('.edtools .edb small')].map(e=>e.textContent);
  const c=cells.find(c=>!c.blocked&&!wet(c)&&!isSpecial(c)&&!c.st&&Math.hypot(c.x-MAP.start[0],c.y-MAP.start[1])>3&&Math.hypot(c.x-PORTAL.x,c.y-PORTAL.y)>3);
  const ok=edPlace("cave",c.x,c.y); return {tools,ok,to:[c.x,c.y]}; });
console.log('island places',moved);
await A.screenshot({path:'CE_island.png'});
await A.evaluate(()=>edSave()); await A.waitForTimeout(4500);
console.log('A portal after reload',await A.evaluate(()=>[PORTAL.x,PORTAL.y]),'B portal',await B.evaluate(()=>[PORTAL.x,PORTAL.y]));
// A в пещеру и правит её
await A.evaluate(()=>{ sessionStorage.setItem("island_zone","cave"); location.reload(); }); await A.waitForTimeout(2500);
const ce=await A.evaluate(()=>{ edEnter(); edCat="places"; edRender(); const tools=[...document.querySelectorAll('.edtools .edb small')].map(e=>e.textContent);
  edCat="decor"; edRender(); const st={changes:[],seen:new Set()}; const c=cells.find(c=>!c.blocked&&!wet(c)&&!isSpecial(c)&&!c.props.length&&c.L===1); edTool="prop_crystal"; edApplyCell(c.x,c.y,st); edCommit(st,"{}");
  return {tools,crystal:[c.x,c.y,c.props.join()]}; });
console.log('cave places',ce);
await A.screenshot({path:'CE_cave.png'});
await A.evaluate(()=>edSave()); await A.waitForTimeout(3000);
const islandMapDoc=await B.evaluate(async()=>{ const s=await NET.db.doc("world/map").get(); const m=JSON.parse(s.data().m); return {cave:m.cave, hasCrystal:m.props.some(p=>p[2]==="prop_crystal")}; });
const caveMapDoc=await B.evaluate(async()=>{ const s=await NET.db.doc("world/map_cave").get(); if(!s.exists) return null; const m=JSON.parse(s.data().m); return {exit:m.exit,boss:m.boss,crystals:m.props.filter(p=>p[2]==="prop_crystal").length}; });
console.log('island doc',islandMapDoc,'cave doc',caveMapDoc);
console.log('errs',errs); await b.close();})();
