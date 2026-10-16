const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:800}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
const W='#world=ZonesKey'+Date.now();
const mk=async(id,first)=>{ const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(id+': '+e.message));
  await p.addInitScript(`window.Telegram={WebApp:{initData:"x",initDataUnsafe:{start_param:"",user:{id:${id},first_name:${JSON.stringify(first)},language_code:"ru"}},ready(){},expand(){}}};try{localStorage.setItem("island_lang","ru")}catch(e){}`);
  await p.goto('http://localhost:8765/index.html'+W); await p.waitForTimeout(2500);
  await p.evaluate(()=>{ if(!heroClass) setClass('warrior'); const c=document.getElementById('classWrap'); if(c) c.remove(); }); return p; };
const ready=async p=>{ await p.waitForTimeout(2600); await p.evaluate(()=>{ const c=document.getElementById('classWrap'); if(c) c.remove(); }); };
const ad=await mk(1661222371,"Artem");
await ad.evaluate(()=>{ document.getElementById('editBtn').click(); }); await ad.waitForTimeout(200);
await ad.evaluate(()=>[...document.querySelectorAll('.adcard')].find(x=>x.textContent.includes('Острова')).click()); await ad.waitForTimeout(200);
await ad.screenshot({path:'shot_zn_list0.png'});
await ad.evaluate(()=>document.querySelector('.wbody > .btn.big').click()); await ad.waitForTimeout(150);
await ad.locator('.plform input').nth(0).fill('Остров Туманов');
await ad.evaluate(()=>{ znDraft.w=znDraft.d=16; }); await ad.evaluate(()=>znSave()); await ad.waitForTimeout(1200);
const zid=await ad.evaluate(()=>Object.keys(ZONES)[0]);
console.log('zone',zid,await ad.evaluate(async z=>{ const m=await NET.db.doc("world/map_"+z).get(); return {zone:ZONES[z],map:m.exists}; },zid));
// поставить переход на главном острове рядом с героем
const lk=await ad.evaluate(z=>{ closeWin(); for(let r=1;r<4;r++) for(let dx=-r;dx<=r;dx++) for(let dy=-r;dy<=r;dy++){ const c=cellAt(Math.round(hero.x)+dx,Math.round(hero.y)+dy); if(c&&freeCell(c)&&!c.props.length&&lkAddAt(c,z)) return [c.x,c.y,c.blocked,c.link]; } },zid);
console.log('link placed',lk); await ad.waitForTimeout(600);
await ad.evaluate(()=>{ follow=true; }); await ad.waitForTimeout(400); await ad.screenshot({path:'shot_zn_portal.png'});
// игрок 2 видит переход
const pl=await mk(777030,"Petya");
console.log('player sees link',await pl.evaluate(([x,y])=>!!cellAt(x,y).link,lk));
// админ входит в портал
await ad.evaluate(([x,y])=>useLink(cellAt(x,y).link),lk); await ready(ad);
console.log('admin in new zone',await ad.evaluate(()=>({ZONE,CUSTOMZ,CAVE,size:W+"x"+D,title:document.querySelector('#players b')&&document.querySelector('#players b').textContent,hut:!!MAP.hut})));
await ad.screenshot({path:'shot_zn_new.png'});
// обратный переход
const back=await ad.evaluate(()=>{ for(let r=1;r<5;r++) for(let dx=-r;dx<=r;dx++) for(let dy=-r;dy<=r;dy++){ const c=cellAt(Math.round(hero.x)+dx,Math.round(hero.y)+dy); if(c&&freeCell(c)&&!c.props.length&&lkAddAt(c,"island")) return [c.x,c.y]; } });
await ad.waitForTimeout(600); console.log('back link',back,await ad.evaluate(()=>Object.values(LINKS).map(l=>l.z+"->"+l.to+":"+l.look).join(' ')));
// игрок 2 идёт в портал и появляется у обратного перехода
await pl.waitForTimeout(500); await pl.evaluate(([x,y])=>useLink(cellAt(x,y).link),lk); await ready(pl);
console.log('player arrived',await pl.evaluate(([x,y])=>({ZONE,dist:+Math.hypot(hero.x-x,hero.y-y).toFixed(1)}),back),'sees admin',await pl.evaluate(()=>[...remotes.values()].length));
// админ возвращается: появляется у перехода на главном острове
await ad.evaluate(([x,y])=>useLink(cellAt(x,y).link),back); await ready(ad);
console.log('admin back',await ad.evaluate(([x,y])=>({ZONE,dist:+Math.hypot(hero.x-x,hero.y-y).toFixed(1)}),lk));
// моб в новой зоне
await ad.evaluate(z=>{ openWin("admin"); winKind="admin_mobs"; mbSel=null; renderWin(); document.querySelector('.wbody > .btn.big').click(); },zid);
console.log('mob zone buttons',await ad.evaluate(()=>[...document.querySelectorAll('.mbseg')].map(s=>s.textContent).find(t=>t.includes('Туман'))));
// список в админке
await ad.evaluate(()=>{ winKind="admin_zones"; znSel=null; renderWin(); }); await ad.waitForTimeout(200); await ad.screenshot({path:'shot_zn_list.png',fullPage:true});
// удалить остров: игрок на нём отправляется домой
await ad.evaluate(z=>{ znSel=z; znDraft={...ZONES[z],id:z}; renderWin(); const w=()=>document.querySelector('.plbtns .warn'); w().click(); w().click(); },zid);
await ad.waitForTimeout(1000); await pl.waitForTimeout(3500);
console.log('after delete',await ad.evaluate(()=>[Object.keys(ZONES).length,Object.keys(LINKS).length]),'player zone',await pl.evaluate(()=>ZONE));
console.log('errs',errs); await b.close();})();
