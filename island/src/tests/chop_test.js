const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:650}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(1000);
await p.evaluate(()=>{windOn=false});
// ближайшее к герою большое дерево
const t=await p.evaluate(()=>{const tr=TREES.filter(t=>t.big).sort((a,b)=>Math.hypot(a.c.x-hero.x,a.c.y-hero.y)-Math.hypot(b.c.x-hero.x,b.c.y-hero.y))[0].c;return [tr.x,tr.y]});
console.log('tree',t, 'trees total', await p.evaluate(()=>TREES.length));
// кликаем по кроне — должна сработать pickTree
const pt=await p.evaluate(([x,y])=>{const c=cellAt(x,y),q=proj(c.x-MX,c.y-MY,c.L);return [q[0]*scale+panX, (q[1]-60)*scale+panY]},t);
const r=await p.evaluate(()=>{const b=cv.getBoundingClientRect();return [b.left,b.top]});
await p.mouse.click(pt[0]+r[0],pt[1]+r[1]);
await p.waitForFunction(()=>chopping,null,{timeout:20000});
console.log('chopping started', await p.evaluate(()=>document.getElementById('toast').innerText));
await p.waitForTimeout(250);await p.screenshot({path:'c1.png'});   // замах
await p.waitForTimeout(160);await p.screenshot({path:'c2.png'});   // удар, щепки
await p.waitForFunction(()=>TREES.length<16||cells.some(c=>c.falling),null,{timeout:10000}).catch(()=>{});
await p.waitForFunction(()=>cells.some(c=>c.falling&&c.falling.t>0.4),null,{timeout:10000});
await p.screenshot({path:'c3.png'});                                  // падает
await p.waitForTimeout(900);await p.screenshot({path:'c4.png'});     // пень, +3
console.log('inv', await p.evaluate(()=>JSON.stringify(inv)), await p.evaluate(()=>document.getElementById('toast').innerText), 'trees', await p.evaluate(()=>TREES.length));
// ускоряем появление ростка
await p.evaluate(()=>{for(const r of regrow) r.t=0});
await p.waitForTimeout(300);
const sp=await p.evaluate(()=>{const c=cells.find(c=>c.grow<1);return c&&[c.x,c.y,treeName(c)]});
console.log('sprout at',sp,'trees',await p.evaluate(()=>TREES.length));
// показать росток: камера к нему, рост 40%
await p.evaluate(([x,y])=>{const c=cellAt(x,y);c.grow=0.4;follow=false;const q=proj(c.x-MX,c.y-MY,c.L);const b=cv.getBoundingClientRect();panX=b.width/2-q[0]*scale;panY=b.height/2-q[1]*scale},sp);
await p.waitForTimeout(200);await p.screenshot({path:'c5.png'});
// клик по растущему деревцу
await p.evaluate(([x,y])=>goTo(cellAt(x,y)),sp);
console.log('growing click:', await p.evaluate(()=>document.getElementById('toast').innerText));
await p.evaluate(([x,y])=>{cellAt(x,y).grow=0.85},sp);await p.waitForTimeout(200);await p.screenshot({path:'c6.png'});
// поворот во время рубки другого дерева
console.log('errors',errs);await b.close();})();
