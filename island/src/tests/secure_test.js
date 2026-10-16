const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:800}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
const W='#world=SecureKey'+Date.now(); let authCalls=0, failAuth=false;
await ctx.route('https://auth.test/auth', async route=>{ authCalls++; const body=route.request().postData(); if(failAuth) return route.fulfill({status:500,body:'x'});
  const id=/"id":(\d+)/.exec(decodeURIComponent(body))[1]; await route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({token:'T'+id,uid:'utg'+id,admin:id==='1661222371'})}); });
const mk=async(id,first)=>{ const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(id+': '+e.message));
  const init=encodeURIComponent(JSON.stringify({id,first_name:first}));
  await p.addInitScript(`window.__islandAuthUrl="https://auth.test";
    window.Telegram={WebApp:{initData:"auth_date=1&user=${init}&hash=${'0'.repeat(64)}",initDataUnsafe:{start_param:"",user:{id:${id},first_name:${JSON.stringify(first)},language_code:"ru"}},ready(){},expand(){}}};
    try{localStorage.setItem("island_lang","ru")}catch(e){}
    const _fb=()=>window.firebase; Object.defineProperty(window,"__stubAuth",{value:true});
    document.addEventListener("DOMContentLoaded",()=>{});
    (function wait(){ if(window.firebase&&!window.firebase.auth){ window.firebase.auth=()=>({signInWithCustomToken:t=>Promise.resolve({user:{uid:"utg"+t.slice(1)}})}); } else if(!window.firebase) setTimeout(wait,0); })();`);
  await p.goto('http://localhost:8765/index.html'+W); await p.waitForTimeout(2500);
  await p.evaluate(()=>{ if(!heroClass) setClass('warrior'); const c=document.getElementById('classWrap'); if(c) c.remove(); }); return p; };
const ad=await mk(1661222371,"Artem");
console.log('admin auth',await ad.evaluate(()=>window.__islandAuth),'calls',authCalls);
// старый счёт админа переносится в кошелёк
await ad.evaluate(async()=>{ await NET.db.doc("wallet/"+NET.myId).delete(); lastSaveJSON="__"; await NET.db.doc(`data/users/${NET.myId}/save`).set({cr:77,inv:{coin:5},nick:"Artem"}); saving=true; }); await ad.reload(); await ad.waitForTimeout(3000);
console.log('admin wallet migrated',await ad.evaluate(async()=>{ const w=await NET.db.doc("wallet/"+NET.myId).get(); return [w.exists&&w.data().cr,crystals]; }));
const pl=await mk(777009,"Petya");
console.log('player auth',await pl.evaluate(()=>window.__islandAuth),'crystals (no wallet)',await pl.evaluate(()=>crystals));
// игрок «рисует» себе кристаллы в сохранении — не действует
await pl.evaluate(()=>{ NET.db.doc(`data/users/${NET.myId}/save`).set({cr:999999,inv:{}}); }); await pl.reload(); await pl.waitForTimeout(2500);
console.log('player after fake save cr',await pl.evaluate(()=>crystals));
// админ выдаёт 40 кристаллов через редактор игроков
await ad.evaluate(async()=>{ openWin("admin"); winKind="admin_pl"; await adOpen("utg777009"); adEdit.cr=40; await adApply("utg777009"); }); await ad.waitForTimeout(1200);
console.log('player crystals from wallet',await pl.evaluate(()=>crystals));
// бан пишет banned/<uid>
await ad.evaluate(()=>{ adSel="utg777009"; renderWin(); const r=document.getElementById('adBanR'); if(r) r.value="test"; adBan("utg777009",true); }); await ad.waitForTimeout(800);
console.log('banned doc',await ad.evaluate(async()=>{ const s=await NET.db.doc("banned/utg777009").get(); return s.exists&&s.data().r; }),'player ban screen',await pl.evaluate(()=>!!document.getElementById('banWrap')));
await ad.evaluate(()=>adBan("utg777009",false)); await ad.waitForTimeout(500);
console.log('unbanned doc gone',await ad.evaluate(async()=>!(await NET.db.doc("banned/utg777009").get()).exists));
// сервер не отвечает — игра всё равно запускается по-старому
failAuth=true; const p3=await mk(777010,"Kolya");
console.log('auth fail -> still plays',await p3.evaluate(()=>[window.__islandAuth.ok,!!NET.db,typeof heroClass]));
console.log('errs',errs); await b.close();})();
