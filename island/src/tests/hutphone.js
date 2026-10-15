const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
const p=await ctx.newPage(); const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{try{localStorage.setItem('island_nick','Tester')}catch(e){}});await p.goto('file://'+process.argv[2]);await p.waitForTimeout(1000);
await p.evaluate(()=>{inv.okun=2;renderInv();goTo("npc")});
await p.waitForFunction(()=>dialogOpen,null,{timeout:20000}); await p.waitForTimeout(400);
await p.screenshot({path:'dp.png'});
// тап по NPC на экране
await p.tap('#dlgOpts button >> nth=-1'); await p.waitForTimeout(200);
const xy=await p.evaluate(()=>{const [fx,fy]=proj(npc.x-MX,npc.y-MY,npc.z);return [panX+fx*scale,panY+(fy-20)*scale]});
const r=await p.evaluate(()=>{const b=document.getElementById('cv').getBoundingClientRect();return [b.left,b.top]});
await p.touchscreen.tap(r[0]+xy[0],r[1]+xy[1]); await p.waitForTimeout(600);
console.log('tap npc → dialog', await p.evaluate(()=>dialogOpen));
console.log('errors',errs); await b.close();})();
