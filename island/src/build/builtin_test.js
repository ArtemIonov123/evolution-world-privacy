const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(); const errs=[]; const p=await (await b.newContext({viewport:{width:390,height:800},hasTouch:true,isMobile:true,deviceScaleFactor:2})).newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('island_nick','Artem');localStorage.setItem('island_lang','ru')}); await p.goto('file://'+process.argv[2]); await p.waitForTimeout(1300);
await p.evaluate(()=>{ setClass('warrior'); document.getElementById('classWrap')&&document.getElementById('classWrap').remove(); isAdmin=true; openWin("admin"); winKind="admin_items"; itSel=null; renderWin(); });
await p.waitForTimeout(200); await p.screenshot({path:'shot_bi_list.png'});
console.log('builtin count',await p.evaluate(()=>baseSnap().ids.length));
// edit sword_iron through the card
await p.evaluate(()=>{ [...document.querySelectorAll('.itrow')].find(x=>x.textContent.includes('Железный меч')).click(); });
await p.waitForTimeout(150); console.log('draft',await p.evaluate(()=>JSON.stringify(itDraft)));
await p.evaluate(()=>{ Object.assign(itDraft,{ru:"Железный клинок",atk:9,seller:"npc",price:60,hue:120}); itSave(); });
console.log('after edit',await p.evaluate(()=>{ shopNpc="merchant"; const m=shopList().map(s=>s.id); shopNpc="npc"; const n=shopList().map(s=>s.id); shopNpc="merchant"; return {atk:GEAR.sword_iron.atk,name:tr("fish_sword_iron"),merch:m.includes("sword_iron"),npc:n,desc:itemDesc("sword_iron"),sell:sellPrice("sword_iron")}; }));
await p.screenshot({path:'shot_bi_card.png'});
await p.evaluate(()=>{ itSel="potion"; itDraft={...baseDraft("potion")}; itDraft.heal=6; itSave(); });
console.log('potion heal',await p.evaluate(()=>EDIBLE.potion));
// reset sword
await p.evaluate(()=>{ itSel="sword_iron"; itDraft={...OVR.sword_iron,id:"sword_iron",builtin:true}; renderWin(); const w=()=>document.querySelector('.plbtns .warn'); w().click(); w().click(); });
console.log('after reset',await p.evaluate(()=>{ shopNpc="merchant"; return {atk:GEAR.sword_iron.atk,name:tr("fish_sword_iron"),merch:shopList().some(s=>s.id==="sword_iron"&&s.p===45),potion:EDIBLE.potion}; }));
// built-in mob
await p.evaluate(()=>{ winKind="admin_mobs"; mbSel=null; renderWin(); }); await p.waitForTimeout(100); await p.screenshot({path:'shot_bi_mobs.png'});
await p.evaluate(()=>{ [...document.querySelectorAll('.itrow')].find(x=>x.textContent.includes('Волк')).click(); }); await p.waitForTimeout(100);
await p.evaluate(()=>{ Object.assign(mbDraft,{hp:10,dmg:3,spd:4,xp:25,nn:4}); [...document.querySelectorAll('.plbtns .big')][0].click(); });
console.log('wolf cfg',await p.evaluate(()=>({hp:mobHp("wolf"),dmg:CFG.mobDmg.wolf,spd:spdMul("wolf"),xp:xpOf("wolf"),nn:mobCount("wolf","n")})));
console.log('bite', await p.evaluate(()=>{ const h=hero.hp=HP_MAX; shieldT=0; hitsTaken=1; const bc=blockChance; biteTarget({me:true},{kind:"wolf"}); return h-hero.hp; }));
await p.screenshot({path:'shot_bi_wolf.png'});
console.log('errs',errs); await b.close();})();
