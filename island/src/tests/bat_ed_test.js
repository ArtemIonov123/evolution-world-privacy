const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1000,height:760}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const pg=async(who,url,uid)=>{const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(who+':'+e.message));
  await p.addInitScript(([u])=>{ if(!sessionStorage.getItem('i')){ sessionStorage.setItem('i',1); localStorage.setItem('island_nick','Gracz'); localStorage.setItem('island_uid',u);} },[uid]);
  await p.goto(url); await p.waitForTimeout(1800); return p;};
const WK='BatEditorWorldKey123';
const A=await pg('A',`http://localhost:8765/index.html#world=${WK}&admin=z`,'uAAAAAAAAAAAAAA');
const B=await pg('B',`http://localhost:8765/index.html#world=${WK}`,'uBBBBBBBBBBBBBB');
await A.evaluate(()=>{ edEnter(); edTab="drop"; edRender(); }); await A.screenshot({path:'bat_cards.png'});
console.log('cards',await A.evaluate(()=>[...document.querySelectorAll('.edcard b')].map(b=>b.textContent)));
await A.evaluate(()=>{ edCfg.mobHp.bat=5; edCfg.rods.rod_wood={dur:3}; edCfg.xp.bat=20; cfgDirty=true; }); await A.evaluate(()=>saveConfig()); await B.waitForTimeout(1500);
console.log('B cfg',await B.evaluate(()=>[mobHp("bat"),rodMax("rod_wood"),xpOf("bat")]));
// bat zone
await A.evaluate(()=>{ edTab="map"; edTool="zone_bat"; const st={changes:[],seen:new Set()}; for(let dx=-1;dx<=1;dx++) edApplyCell(4+dx,15,st); edCommit(st,JSON.stringify({})); edSave(); });
await B.waitForTimeout(2500); console.log('B bat zone',await B.evaluate(()=>MAP.zones&&MAP.zones.bat));
// MP: host spawns bat, guest kills it
const H=(await A.evaluate(()=>NET.host))?A:B, G=H===A?B:A;
await H.evaluate(()=>{ skipTime(); }); await H.waitForTimeout(500);
const gp=await G.evaluate(()=>[hero.x,hero.y]);
await H.evaluate((gp)=>{ for(const a of animals) a.dead=true; spawnT=99; const c=cells.find(c=>!c.water&&Math.hypot(c.x-gp[0],c.y-gp[1])>1.5&&Math.hypot(c.x-gp[0],c.y-gp[1])<2.5); spawnAnimal("bat",c); const bt=animals[animals.length-1]; bt.fly=1.5; bt.home={x:c.x,y:c.y}; bt.alpha=1; },gp);
await G.waitForTimeout(1200); console.log('guest sees bat',await G.evaluate(()=>animals.filter(a=>a.kind==="bat").map(a=>[a.hp,a.fly&&a.fly.toFixed(1)])));
await G.evaluate(()=>{ if(!equip.weapon) giveItem("club"); goTo(animals.find(a=>a.kind==="bat")); });
await G.waitForFunction(()=>(inv.bat_wing||0)>0,null,{timeout:25000}).catch(()=>{});
console.log('guest loot',await G.evaluate(()=>({...inv})),'stats',await G.evaluate(()=>prog.st.bats));
console.log('errors',errs); await b.close();})();
