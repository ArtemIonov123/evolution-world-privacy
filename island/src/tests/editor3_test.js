const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1000,height:700}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const pg=async(who,url,uid)=>{const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(who+':'+e.message));
  await p.addInitScript(([u])=>{ if(!sessionStorage.getItem('i')){ sessionStorage.setItem('i',1); localStorage.setItem('island_nick','Gracz'); localStorage.setItem('island_uid',u);} },[uid]);
  await p.goto(url); await p.waitForTimeout(1800); return p;};
const WK='EditorThreeWorldKey1';
const A=await pg('A',`http://localhost:8765/index.html#world=${WK}&admin=z`,'uAAAAAAAAAAAAAA');
const B=await pg('B',`http://localhost:8765/index.html#world=${WK}`,'uBBBBBBBBBBBBBB');
await A.evaluate(()=>edEnter());
// zones: paint hare zone 3x3 at (5,15) via direct apply
await A.evaluate(()=>{ edTool="zone_hare"; edBrush=3; const st={changes:[],seen:new Set()}; for(const [x,y] of [[5,15],[5,16]]) for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) edApplyCell(x+dx,y+dy,st); edCommit(st,JSON.stringify({})); });
console.log('zone cells',await A.evaluate(()=>Object.keys(edDraft.zones.hare).length));
await A.screenshot({path:'ed3_zone.png'});
await A.evaluate(()=>edSave()); await A.waitForTimeout(1500);
console.log('saved zones',await A.evaluate(()=>MAP.zones&&MAP.zones.hare.length));
await B.waitForTimeout(2500);
console.log('B zones',await B.evaluate(()=>MAP.zones&&MAP.zones.hare.length));
// B spawns hares (B might not be host) -> test on A (host?) - force spawn on whichever host
const H=(await A.evaluate(()=>NET.host))?A:B;
await H.evaluate(()=>{ for(const a of animals) a.dead=true; spawnT=0; });
await H.waitForTimeout(4000);
console.log('hares in zone',await H.evaluate(()=>{ const z=new Set(MAP.zones.hare.map(p=>p.join(","))); return animals.filter(a=>a.kind==="hare").map(a=>z.has(Math.round(a.x)+","+Math.round(a.y))||"moved"); }));
// texts
await A.evaluate(()=>{ edTab="texts"; edTxtWho="npc"; edTxtLang="pl"; edRender(); });
await A.evaluate(()=>{ const ta=[...document.querySelectorAll('.edtxt textarea')][1]; ta.value="Hej przybyszu! To mój testowy tekst."; ta.dispatchEvent(new Event('input')); });
await A.screenshot({path:'ed3_texts.png'});
// shop
await A.evaluate(()=>{ edTab="shop"; edRender(); });
await A.evaluate(()=>{ const nums=[...document.querySelectorAll('.ednum')]; nums[0].value="5"; nums[0].dispatchEvent(new Event('input')); const cbs=[...document.querySelectorAll('.edchk input')]; cbs[3].checked=false; cbs[3].dispatchEvent(new Event('change')); });
await A.screenshot({path:'ed3_shop.png'});
await A.evaluate(()=>saveConfig()); await B.waitForTimeout(1500);
console.log('B npc_hello',await B.evaluate(()=>tr("npc_hello")), 'B shop',await B.evaluate(()=>shopList().map(s=>s.id+":"+s.p).join(" ")));
console.log('errors',errs); await b.close();})();
