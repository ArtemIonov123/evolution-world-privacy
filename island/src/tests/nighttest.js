const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:700}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{try{localStorage.setItem('island_nick','Tester')}catch(e){}});await p.goto('file://'+process.argv[2]);await p.waitForTimeout(1500);
await p.waitForTimeout(3500);
console.log('day',await p.evaluate(()=>[document.getElementById('clkTime').textContent,animals.map(a=>a.kind).join(','),hero.hp]));
// камера на зайца
await p.evaluate(()=>{const a=animals[0]; if(a){hero.x=Math.round(a.x)+3;hero.y=Math.round(a.y);hero.z=walkZ(cellAt(hero.x,hero.y)||cells[0]);}});
await p.waitForTimeout(800); await p.screenshot({path:'n0.png'});
// костёр
await p.evaluate(()=>{const s=cells.find(c=>c.x===12&&c.y===13); hero.x=12;hero.y=13;hero.z=walkZ(s); inv.wood=8; inv.karas=2; inv.okun=1; renderInv();});
await p.waitForTimeout(300);
console.log('build visible',await p.isVisible('#buildFire'));
await p.click('#buildFire');
await p.evaluate(()=>{const c=[[13,14],[11,14],[12,15],[13,12]].map(([x,y])=>cellAt(x,y)).find(c=>freeCell(c)&&!c.props.length&&!c.st); goTo(c);});
await p.waitForFunction(()=>fires.length>0,null,{timeout:15000});
console.log('fire',await p.evaluate(()=>[fires[0].c.x,fires[0].c.y,inv.wood,document.getElementById('info').innerText]));
// ночь
await p.evaluate(()=>{skipTime()}); await p.waitForTimeout(2500);
await p.screenshot({path:'n1.png'});
console.log('night',await p.evaluate(()=>[document.getElementById('clkTime').textContent,darkness().toFixed(2),animals.map(a=>a.kind+':'+a.state).join(',')]));
// уходим от костра — волк должен напасть
await p.evaluate(()=>{const far=cells.filter(c=>freeCell(c)&&Math.hypot(c.x-fires[0].c.x,c.y-fires[0].c.y)>7&&findPath(12,13,c.x,c.y)).sort((a,b)=>a.x-b.x)[0]; hero.x=far.x;hero.y=far.y;hero.z=walkZ(far);
  for(const a of animals) if(a.kind==="wolf"){a.dead=true;} const w=cells.find(c=>freeCell(c)&&Math.hypot(c.x-far.x,c.y-far.y)>3&&Math.hypot(c.x-far.x,c.y-far.y)<5&&findPath(c.x,c.y,far.x,far.y)); spawnAnimal("wolf",w); animals[animals.length-1].alpha=1;});
await p.waitForFunction(()=>hero.hp<5,null,{timeout:15000});
await p.waitForTimeout(200); await p.screenshot({path:'n2.png'});
console.log('bitten',await p.evaluate(()=>[hero.hp,document.getElementById('info').innerText,animals.filter(a=>a.kind==='wolf').map(a=>a.state).join(',')]));
// назад к костру — волки отступают
await p.evaluate(()=>{const f=fires[0].c; const n=cellAt(f.x+1,f.y)&&!cellAt(f.x+1,f.y).blocked?cellAt(f.x+1,f.y):cellAt(f.x,f.y+1); hero.x=n.x;hero.y=n.y;hero.z=walkZ(n);hero.path=[];});
await p.waitForTimeout(3500);
console.log('at fire',await p.evaluate(()=>[hero.hp,animals.filter(a=>a.kind==='wolf').map(a=>a.state+':'+Math.hypot(a.x-hero.x,a.y-hero.y).toFixed(1)).join(',')]));
await p.screenshot({path:'n3.png'});
// меню костра: жарим и едим
await p.evaluate(()=>goTo(fires[0].c)); await p.waitForFunction(()=>dialogOpen,null,{timeout:8000});
const opts=async()=>p.evaluate(()=>[document.getElementById('dlgText').innerText,[...document.querySelectorAll('#dlgOpts button')].map(b=>b.innerText)]);
console.log('fire menu',await opts());
await p.click('#dlgOpts button >> nth=0'); console.log('cooked',await opts(),await p.evaluate(()=>JSON.stringify(inv)));
await p.click('#dlgOpts button:has-text("+2")'); console.log('ate',await p.evaluate(()=>[hero.hp,JSON.stringify(inv)]));
await p.waitForTimeout(300); await p.screenshot({path:'n4.png'});
await p.keyboard.press('Escape');
// обморок
await p.evaluate(()=>{hero.hp=1;renderHP();inv.coin=20;const far=cells.filter(c=>freeCell(c)&&Math.hypot(c.x-fires[0].c.x,c.y-fires[0].c.y)>7&&findPath(12,13,c.x,c.y))[3]; hero.x=far.x;hero.y=far.y;hero.z=walkZ(far);
  const w=cells.find(c=>freeCell(c)&&Math.hypot(c.x-far.x,c.y-far.y)>1.5&&Math.hypot(c.x-far.x,c.y-far.y)<3&&findPath(c.x,c.y,far.x,far.y)); spawnAnimal("wolf",w); animals[animals.length-1].alpha=1;});
await p.waitForFunction(()=>fainting,null,{timeout:15000}); await p.waitForTimeout(2200);
console.log('fainted',await p.evaluate(()=>[hero.hp,inv.coin,document.getElementById('clkTime').textContent,document.getElementById('info').innerText,animals.filter(a=>a.kind==='wolf').length]));
await p.screenshot({path:'n5.png'});
console.log('errors',errs);await b.close();})();
