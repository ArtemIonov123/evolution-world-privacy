const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:760},deviceScaleFactor:2,hasTouch:true,isMobile:true}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
// 1) обычный браузер: старый игрок с прогрессом
await p.addInitScript(()=>{ if(!sessionStorage.getItem('st')){ sessionStorage.setItem('st','1'); localStorage.setItem('island_nick','Old'); localStorage.setItem('island_uid','uOLDOLDOLDOLDOLD'); } });
await p.goto('http://localhost:8765/index.html#world=TgWorldKey123456789'); await p.waitForTimeout(2500);
await p.evaluate(()=>{ setClass('druid'); inv.coin=777; prog.xp=500; lastSaveJSON=""; saveT=0; tickSave(1); }); await p.waitForTimeout(1500);
// 2) тот же браузер внутри Telegram
await p.addInitScript(()=>{ window.Telegram={WebApp:{initDataUnsafe:{user:{id:123456789,first_name:"Артём",last_name:"Ионов",username:"artem",language_code:"ru"}},ready(){window.__tgReady=1},expand(){window.__tgExp=1},disableVerticalSwipes(){},setHeaderColor(){},setBackgroundColor(){}}}; });
await p.reload(); await p.waitForTimeout(3500);
console.log(await p.evaluate(()=>({id:NET.myId,nick:myNick,nickDlg:!document.getElementById('nickWrap').hidden,cls:heroClass,coin:inv.coin,xp:prog.xp,ready:window.__tgReady,exp:window.__tgExp,lang:LANG})));
await p.waitForTimeout(5000);
console.log('saved to tg uid',await p.evaluate(async()=>{ const s=await NET.db.doc(`data/users/${NET.myId}/save`).get(); return s.exists&&s.data().inv.coin; }));
await p.screenshot({path:'TG.png'});
console.log('errs',errs); await b.close();})();
