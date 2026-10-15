const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
const p=await ctx.newPage(); const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{try{localStorage.setItem('island_nick','Tester')}catch(e){}});await p.goto('file://'+process.argv[2]);await p.waitForTimeout(1200);
await p.screenshot({path:'p0.png'});
console.log('zoom',await p.evaluate(()=>[zoomK,scale,document.getElementById('zVal').textContent]));
// тап по карте — герой идёт
const before=await p.evaluate(()=>[hero.x,hero.y]);
await p.touchscreen.tap(140,330); await p.waitForTimeout(1800);
console.log('tap walk',before,await p.evaluate(()=>[hero.x.toFixed(1),hero.y.toFixed(1),document.getElementById('info').innerText]));
await p.screenshot({path:'p1.png'});
// щипок двумя пальцами (раздвигаем)
const c=await ctx.newCDPSession(p);
const tp=(pts)=>pts.map((q,i)=>({x:q[0],y:q[1],id:i}));
await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:tp([[160,420],[230,420]])});
for(let i=1;i<=8;i++){await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:tp([[160-i*10,420],[230+i*10,420]])});await p.waitForTimeout(30);}
await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
await p.waitForTimeout(300);
console.log('after pinch',await p.evaluate(()=>[zoomK,scale.toFixed(2),hero.path.length]));
await p.screenshot({path:'p2.png'});
// меню
await p.tap('#menuBtn'); await p.waitForTimeout(200); await p.screenshot({path:'p3.png'});
await p.tap('#menuBtn');
// рыбалка до поклёвки
await p.evaluate(()=>{windOn=false;goTo(cellAt(15,13))}); await p.waitForFunction(()=>fishing&&fishing.state==='wait',null,{timeout:20000});
await p.evaluate(()=>{if(fishing)fishing.timer=fishing.t+0.05}); await p.waitForTimeout(400);
await p.screenshot({path:'p4.png'});
await p.tap('#hook',{force:true}); await p.waitForTimeout(900);
console.log('caught',await p.evaluate(()=>JSON.stringify(inv)));
await p.screenshot({path:'p5.png'});
// горизонтально
await p.setViewportSize({width:844,height:390}); await p.waitForTimeout(600); await p.screenshot({path:'p6.png'});
// время кадра
const t=await p.evaluate(()=>{const t0=performance.now();for(let i=0;i<60;i++){render(performance.now())}return ((performance.now()-t0)/60).toFixed(2)});
console.log('render ms/frame (desktop CPU)',t);
console.log('errors',errs);await b.close();})();
