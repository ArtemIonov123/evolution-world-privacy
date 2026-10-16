const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:800}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
const W='#world=Race'+Date.now();
const mk=async(id)=>{ const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(`window.Telegram={WebApp:{initData:"x",initDataUnsafe:{start_param:"",user:{id:${id},first_name:"T",language_code:"ru"}},ready(){},expand(){}}};try{localStorage.setItem("island_lang","ru")}catch(e){}`);
  await p.goto('http://localhost:8765/index.html'+W); await p.waitForTimeout(2500);
  await p.evaluate(()=>{ if(!heroClass) setClass('druid'); const c=document.getElementById('classWrap'); if(c) c.remove(); }); return p; };
const a=await mk(777080);
await a.evaluate(()=>{ prog.xp=700; inv.coin=1234; saveNow(); }); await a.waitForTimeout(800);
const stored=async()=>a.evaluate(async()=>{ const s=await NET.db.doc(`data/users/${NET.myId}/save`).get(); return s.data().pg.xp; });
console.log('stored', await stored(), 'level', await a.evaluate(()=>lvlInfo(prog.xp).l));
// медленная загрузка: get висит 6 с; за это время игра пытается сохраниться
const r=await a.evaluate(async()=>{ const orig=NET.db.doc.bind(NET.db);
  NET.db.doc=p=>{ const d=orig(p); if(/\/save$/.test(p)){ const g=d.get; d.get=()=>new Promise(r=>setTimeout(()=>r(g()),6000)); } return d; };
  saveReady=false; prog.xp=0; for(const k of Object.keys(inv)) delete inv[k]; const L=loadSave();
  await new Promise(r=>setTimeout(r,500)); saveNow(); for(let i=0;i<5;i++){ tickSave(10); await new Promise(r=>setTimeout(r,200)); }
  const during=JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.endsWith(NET.myId+'/save')))||'null');
  await L; NET.db.doc=orig; return {duringXp:during&&JSON.parse(during.j).pg.xp, afterXp:prog.xp, coin:inv.coin, ready:saveReady}; });
console.log('race',JSON.stringify(r));
// резервная копия и откат в админке
const bak=await a.evaluate(async()=>{ const b=await NET.db.doc(`data/users/${NET.myId}/bak`).get(); return b.exists?b.data().s.pg.xp:null; });
console.log('backup xp',bak);
await a.evaluate(()=>{ prog.xp=0; inv.coin=1; saveNow(); }); await a.waitForTimeout(600);   // «потеря» прогресса
const ad=await mk(1661222371);
await ad.evaluate(async(uid)=>{ openWin("admin"); winKind="admin_pl"; await adOpen(uid); },"utg777080"); await ad.waitForTimeout(500);
const card=await ad.evaluate(()=>({bak:document.querySelector('.adbak span')&&document.querySelector('.adbak span').textContent, lv:[...document.querySelectorAll('.plform input')].map(i=>i.value)}));
console.log('admin card',JSON.stringify(card));
await ad.screenshot({path:'shot_bak.png'});
await ad.evaluate(()=>{ document.querySelector('.adbak .btn').click(); }); await ad.waitForTimeout(200);
await ad.evaluate(()=>{ [...document.querySelectorAll('.plbtns .btn')].find(x=>x.textContent==="Сохранить").click(); }); await ad.waitForTimeout(1500);
console.log('player after restore',await a.evaluate(()=>({xp:prog.xp,lv:lvlInfo(prog.xp).l,coin:inv.coin})));
// поле «Уровень» → опыт
const lv=await ad.evaluate(()=>{ const i=[...document.querySelectorAll('.plform input')][3]; i.value="8"; i.dispatchEvent(new Event('input')); return [adEdit.xp,lvlInfo(adEdit.xp).l,[...document.querySelectorAll('.plform input')][4].value]; });
console.log('level field',lv);
console.log('errs',errs); await b.close();})();
