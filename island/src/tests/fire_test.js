const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const errs=[];
for(const [w,h] of [[390,800],[360,740],[800,400]]){
const ctx=await b.newContext({viewport:{width:w,height:h}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(`window.Telegram={WebApp:{initData:"x",initDataUnsafe:{start_param:"",user:{id:777070,first_name:"T",language_code:"ru"}},ready(){},expand(){}}};try{localStorage.setItem("island_lang","ru")}catch(e){}`);
await p.goto('http://localhost:8765/index.html#world=Fire'+Date.now()); await p.waitForTimeout(2500);
await p.evaluate(()=>{ if(!heroClass) setClass('warrior'); const c=document.getElementById('classWrap'); if(c) c.remove(); inv.wood=0; renderInv(); });
await p.waitForTimeout(300); const before=await p.evaluate(()=>document.getElementById('buildFire').hidden);
await p.evaluate(()=>{ inv.wood=3; renderInv(); }); await p.waitForTimeout(400);
const r=await p.evaluate(()=>{ const f=document.getElementById('buildFire').getBoundingClientRect(), c=document.getElementById('chatBtn').getBoundingClientRect();
  return {shown:!document.getElementById('buildFire').hidden,actions:!document.getElementById('actions').hidden,fire:[f.x,f.y,f.width,f.bottom].map(Math.round),chat:[c.x,c.y,c.width].map(Math.round),chatHidden:document.getElementById('chatBtn').hidden}; });
await p.screenshot({path:`shot_fire_${w}.png`});
await p.click('#buildFire'); await p.waitForTimeout(200);
const pl=await p.evaluate(()=>({placing,actions:!document.getElementById('actions').hidden,cancel:!document.getElementById('cancelPlace').hidden,fire:!document.getElementById('buildFire').hidden}));
console.log(w,h,'hiddenNoWood',before,JSON.stringify(r),'placing',JSON.stringify(pl)); await ctx.close(); }
console.log('errs',errs); await b.close();})();
