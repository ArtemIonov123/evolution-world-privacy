const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(); const p=await b.newPage({viewport:{width:900,height:650}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>localStorage.setItem('island_nick','Artem'));
await p.goto('file://'+process.argv[2]); await p.waitForTimeout(1200);
await p.evaluate(()=>{ skipTime(); });
await p.waitForTimeout(300);
const setup=()=>p.evaluate(()=>{ for(const a of animals) a.dead=true; spawnT=99;
  const c=cells.find(c=>freeCell(c)&&Math.hypot(c.x-hero.x,c.y-hero.y)>=2&&Math.hypot(c.x-hero.x,c.y-hero.y)<3&&findPath(c.x,c.y,Math.round(hero.x),Math.round(hero.y)));
  spawnAnimal('wolf',c); const w=animals[animals.length-1]; w.alpha=1; return [c.x,c.y,hero.x,hero.y]; });
console.log('setup',await setup()); await p.waitForTimeout(400);
// no weapon
await p.evaluate(()=>goTo(animals.find(a=>a.kind==='wolf'))); console.log('no weapon msg',await p.evaluate(()=>document.getElementById('toast').innerText));
// tap on wolf sprite position → pickWolf
await p.evaluate(()=>{giveItem('club');renderInv();});
const pos=await p.evaluate(()=>{const a=animals.find(a=>a.kind==='wolf'); const r=cv.getBoundingClientRect(); return [a.drawn.x*scale+panX+r.left, (a.drawn.y-12)*scale+panY+r.top];});
console.log('picked',await p.evaluate(([x,y])=>{const r=cv.getBoundingClientRect(); return !!pickWolf(x-r.left,y-r.top);},pos));
await p.evaluate(()=>goTo(animals.find(a=>a.kind==='wolf')));
await p.waitForTimeout(900); await p.screenshot({path:'cb1.png'});
await p.waitForFunction(()=>!animals.some(a=>a.kind==='wolf'&&!(a.dying>0)),null,{timeout:15000}).catch(()=>{});
await p.waitForTimeout(300); await p.screenshot({path:'cb2.png'});
console.log('after',await p.evaluate(()=>({hp:hero.hp,inv:{...inv},wolves:animals.filter(a=>a.kind==='wolf').map(a=>[a.hp,a.dying]),msg:document.getElementById('toast').innerText})));
// cook meat at fire & eat
await p.evaluate(()=>{ const c=cells.find(c=>freeCell(c)&&!c.props.length&&!c.st&&Math.hypot(c.x-hero.x,c.y-hero.y)<2.5&&Math.hypot(c.x-hero.x,c.y-hero.y)>0.9); addFire(c,Date.now()+100000,true); openFireMenu(c.fire); });
console.log('fire opts',await p.evaluate(()=>[...document.querySelectorAll('#dlgOpts button')].map(b=>b.textContent)));
await p.click('#dlgOpts button'); console.log('after cook',await p.evaluate(()=>({...inv})));
await p.evaluate(()=>closeDialog()); await p.evaluate(()=>{hero.hp=2;renderHP();});
await p.evaluate(()=>eatCooked('meat_cooked')); console.log('hp after eat',await p.evaluate(()=>hero.hp));
// npc dialog wolf quest
await p.evaluate(()=>{equip.weapon=null; inv.pelt=2; renderInv(); openDialog();});
console.log('npc opts',await p.evaluate(()=>[...document.querySelectorAll('#dlgOpts button')].map(b=>b.textContent)));
await p.evaluate(()=>{ [...document.querySelectorAll('#dlgOpts button')].find(b=>b.textContent.includes('Wilki')).click(); });
console.log('wolfq text',await p.evaluate(()=>document.getElementById('dlgText').textContent));
await p.evaluate(()=>document.querySelector('#dlgOpts button').click());
console.log('accepted club',await p.evaluate(()=>[inv.club,quest2,document.getElementById('dlgText').textContent]));
await p.evaluate(()=>{ dlgNode='main'; renderDialog(); });
console.log('opts2',await p.evaluate(()=>[...document.querySelectorAll('#dlgOpts button')].map(b=>b.textContent)));
await p.evaluate(()=>{ [...document.querySelectorAll('#dlgOpts button')].find(b=>b.textContent.includes('skóry')).click(); });
console.log('reward',await p.evaluate(()=>[quest2,{...inv},document.getElementById('dlgText').textContent]));
await p.screenshot({path:'cb3.png'});
console.log('errs',errs); await b.close();})();
