const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(); const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:740},deviceScaleFactor:2,hasTouch:true,isMobile:true});
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>localStorage.setItem('island_nick','Artem'));
await p.goto('file://'+process.argv[2]); await p.waitForTimeout(1200);
await p.evaluate(()=>{ inv.coin=70; inv.karas=3; inv.pelt=2; inv.wood=4; renderInv(); goTo("merchant"); });
await p.waitForFunction(()=>winKind==="shop",null,{timeout:15000}).catch(()=>{});
console.log('shop open',await p.evaluate(()=>[winKind,Math.hypot(hero.x-merch.x,hero.y-merch.y).toFixed(2)]));
await p.screenshot({path:'m_shop.png'});
await p.evaluate(()=>{ bagSel="sword_iron"; renderWin(); }); await p.tap('.acts .big'); await p.waitForTimeout(100);
await p.evaluate(()=>{ bagSel="bait"; renderWin(); }); await p.tap('.acts .big');
console.log('after buy',await p.evaluate(()=>({coin:inv.coin,bait:inv.bait,eq:equip.weapon,club:inv.club,msg:document.querySelector('.shead p').textContent})));
await p.tap('.tabs .btn:nth-child(2)'); await p.waitForTimeout(100);
console.log('sell list',await p.evaluate(()=>[...document.querySelectorAll('.wbody .grid .slot')].map(s=>s.title+'='+s.querySelector('em').textContent)));
await p.evaluate(()=>{ bagSel="karas"; renderWin(); }); await p.evaluate(()=>[...document.querySelectorAll('.acts .btn')].pop().click());
console.log('after sell',await p.evaluate(()=>({coin:inv.coin,karas:inv.karas,msg:document.querySelector('.shead p').textContent})));
await p.screenshot({path:'m_sell.png'});
// walk away closes shop
await p.evaluate(()=>{ goTo(cellAt(16,16)); }); await p.waitForTimeout(2500); console.log('closed after walk',await p.evaluate(()=>winKind));
// look at merchant area
await p.evaluate(()=>{ follow=false; const [fx,fy]=proj(merch.x-MX,merch.y-MY,merch.z); const r=cv.getBoundingClientRect(); panX=r.width/2-fx*scale; panY=r.height/2-fy*scale; dirty=true; });
await p.waitForTimeout(300); await p.screenshot({path:'m_area.png'});
await p.evaluate(()=>rotate(1)); await p.waitForTimeout(1200); await p.screenshot({path:'m_area_rot.png'});
console.log('errs',errs); await b.close();})();
