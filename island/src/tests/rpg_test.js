const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(); const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:740},deviceScaleFactor:2,hasTouch:true,isMobile:true});
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>localStorage.setItem('island_nick','Artem'));
await p.goto('file://'+process.argv[2]); await p.waitForTimeout(1200); await p.evaluate(()=>{ setClass('warrior'); const w=document.getElementById('classWrap'); if(w) w.remove(); });
await p.evaluate(()=>{ inv.coin=40; inv.wood=6; inv.pelt=4; inv.fang=3; inv.karas=2; inv.meat_cooked=1; inv.potion=1; quest2="active"; giveItem("club"); renderInv(); });
console.log('weapon',await p.evaluate(()=>[equip.weapon,inv.club]));
await p.tap('.hb[data-win="bag"]'); await p.waitForTimeout(200);
await p.tap('.wbody .slot[title="Mikstura lecznicza"]'); await p.waitForTimeout(150); await p.screenshot({path:'w_bag.png'});
console.log('bag detail',await p.evaluate(()=>document.querySelector('.bagdet').innerText.replace(/\n/g,' | ')));
// craft at npc
await p.evaluate(()=>{ openDialog(); dlgNode="craft"; renderDialog(); });
console.log('craft opts',await p.evaluate(()=>[...document.querySelectorAll('#dlgOpts button')].map(b=>(b.disabled?'[x] ':'')+b.textContent)));
for(const n of ['Drewniany','Skórzana kurtka','Amulet']) await p.evaluate(n=>[...document.querySelectorAll('#dlgOpts button')].find(b=>b.textContent.startsWith(n)).click() || (dlgNode="craft",renderDialog()),n).then(()=>p.evaluate(()=>{dlgNode="craft";renderDialog();}));
console.log('after craft',await p.evaluate(()=>({equip:{...equip},inv:{...inv},HP_MAX,atk:heroAtk(),def:heroDef()})));
await p.evaluate(()=>closeDialog());
await p.tap('.hb[data-win="equip"]'); await p.waitForTimeout(200); await p.screenshot({path:'w_equip.png'});
// xp
await p.evaluate(()=>{ addXP(25,"fight"); addXP(30,"fish"); addXP(9,"chop"); });
await p.tap('.hb[data-win="hero"]'); await p.waitForTimeout(200); await p.screenshot({path:'w_hero.png'});
console.log('hero',await p.evaluate(()=>document.getElementById('winBody').innerText.replace(/\n/g,' | ').slice(0,400)));
await p.tap('.hb[data-win="quests"]'); await p.waitForTimeout(200); await p.screenshot({path:'w_quests.png'});
console.log('quests',await p.evaluate(()=>document.getElementById('winBody').innerText.replace(/\n/g,' | ')),'dot',await p.evaluate(()=>!document.getElementById('qDot').hidden));
await p.tap('#winClose'); console.log('closed',await p.evaluate(()=>document.getElementById('win').hidden));
console.log('tag',await p.evaluate(()=>document.querySelector('#tag-me .nm').textContent));
await p.screenshot({path:'w_main.png'});
// landscape
await p.setViewportSize({width:844,height:390}); await p.waitForTimeout(400); await p.tap('.hb[data-win="equip"]'); await p.waitForTimeout(200); await p.screenshot({path:'w_land.png'});
console.log('errs',errs); await b.close();})();
