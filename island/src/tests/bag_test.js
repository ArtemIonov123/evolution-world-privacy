const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(); const errs=[];
for(const [w,h] of [[390,844],[360,780],[412,915]]){
const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true,deviceScaleFactor:2})).newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('island_nick','Artem');localStorage.setItem('island_lang','ru')});
await p.goto('file://'+process.argv[2]); await p.waitForTimeout(1300);
await p.evaluate(()=>{ setClass('warrior'); document.getElementById('classWrap')&&document.getElementById('classWrap').remove();
  Object.assign(inv,{coin:193000,karas:3,okun:2,meat_raw:5,pelt:1,fang:4,potion:6,potion_big:2,wood:8,sword_wood:1,cap_leather:1,rod_bamboo:1}); renderInv(); openWin("bag"); });
await p.waitForTimeout(300);
const info=await p.evaluate(()=>({sel:bagSel,slots:document.querySelectorAll('.bslot').length,used:document.querySelector('.baguse').textContent,winW:Math.round(document.getElementById('win').getBoundingClientRect().width),over:document.querySelector('.wbody').scrollWidth>document.querySelector('.wbody').clientWidth+1}));
console.log(w,info); await p.screenshot({path:`shot_bag_${w}.png`});
if(w===390){ await p.evaluate(()=>{ bagSel="potion"; renderWin(); }); await p.screenshot({path:'shot_bag_potion.png'});
  await p.evaluate(()=>[...document.querySelectorAll('.bagtab')][1].click()); await p.waitForTimeout(100);
  console.log('gear tab',await p.evaluate(()=>[...document.querySelectorAll('.bslot img')].map(i=>i.alt).join(',')));
  await p.evaluate(()=>[...document.querySelectorAll('.bagtab')][2].click());
  console.log('food tab',await p.evaluate(()=>[...document.querySelectorAll('.bslot img')].map(i=>i.alt).join(',')));
  await p.evaluate(()=>{ const b=[...document.querySelectorAll('.bagbtn')].find(x=>x.textContent.includes('Выпить')); b&&b.click(); });
  console.log('drink ok',await p.evaluate(()=>inv.potion)); }
}
console.log('errs',errs); await b.close();})();
