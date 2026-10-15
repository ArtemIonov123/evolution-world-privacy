const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:650}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{try{localStorage.setItem('island_nick','Tester')}catch(e){}});await p.goto('file://'+process.argv[2]);await p.waitForTimeout(1000);
// камера на хижину
const center=async()=>p.evaluate(()=>{follow=false;const [hx,hy]=proj(HUT.hx+0.5-MX,HUT.hy+1-MY,HUT.Z+1);const r=cv.getBoundingClientRect();panX=r.width/2-hx*scale;panY=r.height/2-hy*scale;dirty=true});
await center(); await p.waitForTimeout(300); await p.screenshot({path:'h0.png'});
for(let i=1;i<4;i++){ await p.keyboard.press('e'); await p.waitForTimeout(250); if(i===1) await p.screenshot({path:'hmid.png'}); await p.waitForTimeout(700); await center(); await p.waitForTimeout(2000); await p.screenshot({path:'h'+i+'.png'}); }
await p.keyboard.press('e'); await p.waitForTimeout(900);
// разговор: дадим рыбу и дрова для проверки
await p.evaluate(()=>{inv.karas=3;inv.shchuka=1;renderInv();goTo("npc")});
await p.waitForFunction(()=>dialogOpen,null,{timeout:20000}); await p.waitForTimeout(300);
await p.screenshot({path:'d1.png'});
const opts=async()=>p.evaluate(()=>[document.getElementById('dlgText').innerText,[...document.querySelectorAll('#dlgOpts button')].map(b=>b.innerText)]);
console.log('main',await opts());
await p.click('#dlgOpts button >> nth=0'); console.log('sold',await opts(), await p.evaluate(()=>JSON.stringify(inv)));
await p.click('#dlgOpts button >> nth=0'); // назад
await p.click('#dlgOpts button >> nth=0'); console.log('quest',await opts());
await p.click('#dlgOpts button >> nth=0'); console.log('accepted',await opts());
await p.evaluate(()=>{inv.wood=6;renderInv()}); await p.click('#dlgOpts button >> nth=0');
console.log('main2',await opts());
await p.click('#dlgOpts button:has-text("5")'); console.log('reward',await opts(), await p.evaluate(()=>[JSON.stringify(inv),rodLevel,quest]));
await p.waitForTimeout(500); await p.screenshot({path:'d2.png'});
await p.click('[data-lang="ru"]'); await p.waitForTimeout(200); await p.screenshot({path:'d3.png'});
console.log('ru',await opts());
await p.keyboard.press('Escape'); console.log('closed',await p.evaluate(()=>[dialogOpen,document.getElementById('info').innerText]));
console.log('errors',errs);await b.close();})();
