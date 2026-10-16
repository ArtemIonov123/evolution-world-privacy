const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:800}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
const W='#world=MobsEditorKey'+Date.now();
const mk=async(id,first)=>{ const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(id+': '+e.message));
  await p.addInitScript(`window.Telegram={WebApp:{initData:"x",initDataUnsafe:{start_param:"",user:{id:${id},first_name:${JSON.stringify(first)},language_code:"ru"}},ready(){},expand(){}}};try{localStorage.setItem("island_lang","ru")}catch(e){}`);
  await p.goto('http://localhost:8765/index.html'+W); await p.waitForTimeout(2500);
  await p.evaluate(()=>{ if(!heroClass) setClass('warrior'); const c=document.getElementById('classWrap'); if(c) c.remove(); giveItem('sword_iron'); }); return p; };
const ad=await mk(1661222371,"Artem"); const pl=await mk(777002,"Petya");
await ad.evaluate(()=>{ document.getElementById('editBtn').click(); }); await ad.waitForTimeout(200);
await ad.evaluate(()=>[...document.querySelectorAll('.adcard')].find(x=>x.textContent.includes('Мобы')).click()); await ad.waitForTimeout(200);
await ad.evaluate(()=>document.querySelector('.wbody > .btn.big').click()); await ad.waitForTimeout(200);
await ad.locator('.plform input').nth(0).fill('Огненный волк');
await ad.evaluate(()=>{ Object.assign(mbDraft,{hue:20,sz:140,ai:"aggr",hp:8,dmg:2,spd:3,range:6,xp:40,d:1,dn:2,n:1,nn:3}); renderWin(); });
await ad.screenshot({path:'shot_mb_card.png',fullPage:true});
await ad.evaluate(()=>mbSave()); await ad.waitForTimeout(1500);
const kind=await ad.evaluate(()=>Object.keys(CMOBS)[0]); console.log('kind',kind,await ad.evaluate(k=>CMOBS[k],kind));
console.log('player has def',await pl.evaluate(k=>!!CMOBS[k]&&MOBS.includes(k),kind));
console.log('host?',await ad.evaluate(()=>NET.host),await pl.evaluate(()=>NET.host));
const host=(await ad.evaluate(()=>NET.host))?ad:pl, other=host===ad?pl:ad;
// spawn one next to the host's hero
await host.evaluate(k=>{ const c=cellAt(Math.round(hero.x)+2,Math.round(hero.y)); spawnMob(k,"d",()=>true,0); const m=animals[animals.length-1]; m.x=hero.x+1.5; m.y=hero.y; m.alpha=1; },kind);
await host.waitForTimeout(2500);
console.log('host mob',await host.evaluate(k=>animals.filter(a=>a.kind===k).map(a=>[a.state,+Math.hypot(a.x-hero.x,a.y-hero.y).toFixed(1),a.hp]),kind),'hero hp',await host.evaluate(()=>[hero.hp,HP_MAX]));
console.log('other sees',await other.evaluate(k=>animals.filter(a=>a.kind===k).length,kind));
await host.screenshot({path:'shot_mb_game.png'});
// kill it
await host.evaluate(k=>{ hero.hp=HP_MAX; const m=animals.find(a=>a.kind===k&&!(a.dying>0)); for(let i=0;i<10&&!(m.dying>0);i++) applyHit(m,NET.room?NET.myPeer:null,hero.x,hero.y,3); },kind);
await host.waitForTimeout(300);
console.log('after kill',await host.evaluate(()=>({coin:inv.coin,xp:prog.xp,toast:document.getElementById('toast').textContent})));
// drop editor card + zone tool
await ad.evaluate(()=>{ closeWin(); edEnter("drop"); }); await ad.waitForTimeout(200);
console.log('drop cards',await ad.evaluate(()=>dropCards().map(c=>c.label).join(', ')));
await ad.evaluate(k=>{ edDropSel="mob:"+k; edRender(); },kind); await ad.screenshot({path:'shot_mb_drop.png'});
await ad.evaluate(()=>edExit(false)); await ad.evaluate(()=>{ edEnter("map"); edCat="places"; edRender(); }); await ad.waitForTimeout(200);
console.log('zone tools',await ad.evaluate(()=>[...document.querySelectorAll('.edb small')].map(x=>x.textContent).filter(t=>/Зай|Волк|Мыш|Пау|Огнен|Убрать/.test(t)).join(', ')));
await ad.screenshot({path:'shot_mb_zone.png'});
await ad.evaluate(()=>edExit(false));
// delete
await ad.evaluate(k=>{ openWin("admin"); winKind="admin_mobs"; mbSel=k; mbDraft={...CMOBS[k]}; renderWin(); const d=()=>document.querySelector('.plbtns .warn'); d().click(); d().click(); },kind); await ad.waitForTimeout(1200);
console.log('deleted',await pl.evaluate(k=>[!!CMOBS[k],animals.filter(a=>a.kind===k).length,MOBS.join(',')],kind));
console.log('errs',errs); await b.close();})();
