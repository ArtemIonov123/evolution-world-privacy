const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:800}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
const W='#world=BossEditorKey'+Date.now();
const mk=async(id,first)=>{ const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(id+': '+e.message));
  await p.addInitScript(`window.Telegram={WebApp:{initData:"x",initDataUnsafe:{start_param:"",user:{id:${id},first_name:${JSON.stringify(first)},language_code:"ru"}},ready(){},expand(){}}};try{localStorage.setItem("island_lang","ru")}catch(e){}`);
  await p.goto('http://localhost:8765/index.html'+W); await p.waitForTimeout(2500);
  await p.evaluate(()=>{ if(!heroClass) setClass('warrior'); const c=document.getElementById('classWrap'); if(c) c.remove(); giveItem('sword_iron'); }); return p; };
const ad=await mk(1661222371,"Artem"); const pl=await mk(777003,"Petya");
await ad.evaluate(()=>{ document.getElementById('editBtn').click(); }); await ad.waitForTimeout(200);
console.log('cards',await ad.evaluate(()=>[...document.querySelectorAll('.adcard b')].map(x=>x.textContent).join(' | ')));
await ad.evaluate(()=>[...document.querySelectorAll('.adcard')].find(x=>x.textContent.includes('Боссы')).click()); await ad.waitForTimeout(200);
await ad.screenshot({path:'shot_bs_list.png'});
await ad.evaluate(()=>document.querySelector('.wbody > .btn.big').click()); await ad.waitForTimeout(200);
await ad.locator('.plform input').nth(0).fill('Король пауков');
await ad.evaluate(()=>{ Object.assign(bsDraft,{b:"spider",hue:300,sz:200,zn:"island",hp:40,dmg:2,range:6,xp:100,rsp:5,slam:1,slamDmg:2,slamR:23,slamCd:4,sum:1,sumK:"wolf",sumN:2,rage:1,rageAt:40}); renderWin(); });
await ad.screenshot({path:'shot_bs_card.png',fullPage:true});
await ad.evaluate(()=>bsSave()); await ad.waitForTimeout(800);
const kind=await ad.evaluate(()=>Object.keys(CMOBS).find(k=>CMOBS[k].boss));
console.log('kind',kind,'boss list has',await ad.evaluate(()=>BOSSES.join(',')),'player def',await pl.evaluate(k=>!!(CMOBS[k]&&CMOBS[k].boss),kind));
// place it via the map editor tool, near the host hero
const host=(await ad.evaluate(()=>NET.host))?ad:pl, other=host===ad?pl:ad;
const pos=await host.evaluate(()=>{ for(let r=3;r<6;r++) for(let dx=-r;dx<=r;dx++) for(let dy=-r;dy<=r;dy++){ const c=cellAt(Math.round(hero.x)+dx,Math.round(hero.y)+dy); if(c&&freeCell(c)&&findPath(c.x,c.y,Math.round(hero.x),Math.round(hero.y))) return [c.x,c.y]; } });
await ad.evaluate(([k,p])=>{ closeWin(); edEnter("map"); edCat="places"; edTool="bpos_"+k; edRender(); bsPlaceAt(k,cellAt(p[0],p[1])); },[kind,pos]);
await ad.waitForTimeout(300); console.log('tool labels',await ad.evaluate(()=>[...document.querySelectorAll('.edb small')].map(x=>x.textContent).filter(t=>t.includes('Король')).join(',')));
await ad.screenshot({path:'shot_bs_place.png'}); await ad.evaluate(()=>edExit(false));
await host.waitForTimeout(2500);
console.log('spawned host',await host.evaluate(k=>animals.filter(a=>a.kind===k).map(a=>[a.hp,+Math.hypot(a.x-hero.x,a.y-hero.y).toFixed(1)]),kind),'other sees',await other.evaluate(k=>animals.filter(a=>a.kind===k).length,kind));
// let it fight the host hero for a while
await host.evaluate(()=>{ hero.hp=HP_MAX=50; window.__hp0=hero.hp; });
await host.waitForTimeout(6000);
console.log('fight',await host.evaluate(k=>{ const a=animals.find(x=>x.kind===k); return {heroLost:window.__hp0-hero.hp,slamSeen:!!a.slamCd,state:a.aggro,bar:document.getElementById('bossBar').hidden?null:document.getElementById('bossName').textContent}; },kind));
await host.screenshot({path:'shot_bs_fight.png'});
// damage to 45% -> summon, 35% -> rage
await host.evaluate(k=>{ const a=animals.find(x=>x.kind===k); a.hp=18; },kind); await host.waitForTimeout(700);
console.log('summon+rage',await host.evaluate(k=>{ const a=animals.find(x=>x.kind===k); return {wolves:animals.filter(x=>x.kind==="wolf"&&x.summoned).length,rage:a.rage}; },kind));
await host.evaluate(k=>{ const a=animals.find(x=>x.kind===k); a.hp=14; },kind); await host.waitForTimeout(400);
console.log('rage now',await host.evaluate(k=>animals.find(x=>x.kind===k).rage,kind),'other bar',await other.evaluate(()=>document.getElementById('bossBar').hidden?null:document.getElementById('bossName').textContent));
await host.screenshot({path:'shot_bs_rage.png'});
// both players hit, then kill -> both get loot
const c0=await other.evaluate(()=>inv.coin||0), h0=await host.evaluate(()=>inv.coin||0);
await other.evaluate(k=>{ const a=animals.find(x=>x.kind===k); if(a){ hero.x=a.x+0.8; hero.y=a.y; } },kind);
await host.evaluate(([k,op])=>{ const a=animals.find(x=>x.kind===k); (a.hitters||(a.hitters=new Set())).add(op); for(let i=0;i<20&&!(a.dying>0);i++) applyHit(a,NET.myPeer,hero.x,hero.y,3); },[kind,await other.evaluate(()=>NET.myPeer)]);
await host.waitForTimeout(2500);
console.log('loot host',(await host.evaluate(()=>inv.coin||0))-h0,'loot other',(await other.evaluate(()=>inv.coin||0))-c0,'dead',await host.evaluate(k=>BOSS_DEAD[k]>0,kind),'other dead map',await other.evaluate(k=>BOSS_DEAD[k]>0,kind));
await host.waitForTimeout(2500);
console.log('no instant respawn',await host.evaluate(k=>animals.filter(a=>a.kind===k&&!(a.dying>0)).length,kind));
// golem card
await ad.evaluate(()=>{ openWin("admin"); winKind="admin_bosses"; bsSel=null; renderWin(); [...document.querySelectorAll('.itrow')].find(x=>x.textContent.includes('Голем')).click(); });
await ad.evaluate(()=>{ Object.assign(bsDraft,{hp:90,rsp:8,slamDmg:3,xp:300}); document.querySelector('.plbtns .big').click(); }); await ad.waitForTimeout(800);
console.log('golem cfg',await pl.evaluate(()=>({hp:mobHp("golem"),rsp:CFG.mobHp.golem_rsp,dmg:CFG.mobDmg.golem,xp:xpOf("golem")})));
console.log('errs',errs); await b.close();})();
