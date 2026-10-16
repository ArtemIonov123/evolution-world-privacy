const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(); const p=await b.newPage({viewport:{width:500,height:420}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>localStorage.setItem('island_nick','Artem'));
await p.goto('file://'+process.argv[2]); await p.waitForTimeout(900);
const center=()=>p.evaluate(()=>{ follow=false; const [fx,fy]=proj(merch.x-MX,merch.y-MY,merch.z); const r=cv.getBoundingClientRect(); panX=r.width/2-fx*scale; panY=r.height/2-fy*scale; dirty=true; });
for(let i=0;i<4;i++){ await center(); await p.waitForTimeout(250); await p.screenshot({path:`rot${i}.png`}); await p.evaluate(()=>rotate(1)); await p.waitForTimeout(1300); }
console.log('errs',errs); await b.close();})();
