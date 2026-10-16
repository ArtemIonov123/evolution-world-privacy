const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(); const p=await b.newPage({viewport:{width:900,height:650}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>localStorage.setItem('island_nick','Artem'));
await p.goto('file://'+process.argv[2]); await p.waitForTimeout(1200);
console.log('starter rod',await p.evaluate(()=>[equip.rod,rodDur,rodMax(equip.rod)]));
// rods: wear & break
const r=await p.evaluate(()=>{ inv.rod_bamboo=1; rodDur=2; wearRod(); const a=[equip.rod,rodDur]; wearRod(); return [a,equip.rod,rodDur,inv.rod_bamboo||0]; });
console.log('wear/break -> next',JSON.stringify(r));
await p.evaluate(()=>{ unequip("rod"); inv.rod_bamboo=0; delete inv.rod_bamboo; delete inv.rod_wood; });
await p.evaluate(()=>{ goFish(cells.find(c=>c.water)); }); console.log('no rod msg',await p.evaluate(()=>document.getElementById('toast').innerText));
await p.evaluate(()=>{ inv.wood=3; renderInv(); openDialog(); dlgNode="craft"; renderDialog(); });
console.log('craft opts',await p.evaluate(()=>[...document.querySelectorAll('#dlgOpts button')].slice(0,2).map(b=>(b.disabled?'[x]':'')+b.textContent)));
await p.evaluate(()=>{ [...document.querySelectorAll('#dlgOpts button')][0].click(); closeDialog(); });
console.log('after craft',await p.evaluate(()=>[equip.rod,rodDur,inv.wood]));
// bats
await p.evaluate(()=>skipTime()); await p.waitForTimeout(300);
await p.evaluate(()=>{ for(const a of animals) a.dead=true; spawnT=99; const c=cells.find(c=>!c.water&&Math.hypot(c.x-hero.x,c.y-hero.y)>2&&Math.hypot(c.x-hero.x,c.y-hero.y)<3); spawnAnimal("bat",c); const bt=animals[animals.length-1]; bt.fly=1.5; bt.home={x:c.x,y:c.y}; bt.alpha=1; bt.attackT=0.5; });
await p.waitForTimeout(3500); console.log('hp after bat',await p.evaluate(()=>hero.hp));
await p.screenshot({path:'bat1.png'});
await p.evaluate(()=>{ giveItem("club"); goTo(animals.find(a=>a.kind==="bat")); });
await p.waitForFunction(()=>!animals.some(a=>a.kind==="bat"&&!(a.dying>0)),null,{timeout:20000}).catch(()=>{});
await p.waitForTimeout(400); await p.screenshot({path:'bat2.png'});
console.log('bat result',await p.evaluate(()=>({inv:{...inv},bats:prog.st.bats,msg:document.getElementById('toast').innerText.replace(/\n/g,' ')})));
console.log('errs',errs); await b.close();})();
