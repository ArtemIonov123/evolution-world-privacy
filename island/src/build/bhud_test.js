const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(); const errs=[];
for(const [w,h,n,cl] of [[412,860,'port_w','warrior'],[412,860,'port_d','druid'],[860,390,'land','druid'],[412,470,'kb','warrior']]){
const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true,deviceScaleFactor:2})).newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('island_nick','Artem');localStorage.setItem('island_lang','ru')});
await p.goto('file://'+process.argv[2]); await p.waitForTimeout(1300);
await p.evaluate(c=>{ setClass(c); const w=document.getElementById('classWrap'); if(w) w.remove(); prog.xp=200; recalcHP(); renderSkills(); document.getElementById('chatBtn').hidden=false; const d=document.getElementById('chatDot'); if(d){d.hidden=false; d.textContent='3';} },cl);
if(n==='kb') await p.evaluate(()=>{ document.getElementById('chatBtn').click(); });
await p.waitForTimeout(400); await p.screenshot({path:'shot_bhud_'+n+'.png'});
if(n==='port_w'){ console.log('bhud',await p.evaluate(()=>document.body.classList.contains('bhud')));
  await p.evaluate(()=>{ const w=animals.find(a=>a.kind==="wolf"); if(w){ w.x=hero.x+2; w.y=hero.y; w.alpha=1; } giveItem('club'); });
  await p.tap('#atkBtn'); await p.waitForTimeout(100); console.log('target',await p.evaluate(()=>hero.target&&hero.target.kind)); }
}
console.log('errs',errs); await b.close();})();
