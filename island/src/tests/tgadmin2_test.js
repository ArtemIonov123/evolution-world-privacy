const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const errs=[];
for(const id of [1661222371, 866401666]){
const ctx=await b.newContext({viewport:{width:390,height:760}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(`window.Telegram={WebApp:{initDataUnsafe:{start_param:"",user:{id:${id},first_name:"T",language_code:"ru"}},ready(){},expand(){}}};`);
await p.goto('http://localhost:8765/index.html#world=TgAdmin2Key1234567'); await p.waitForTimeout(2500);
console.log(id,await p.evaluate(()=>({admin:isAdmin,btn:!document.getElementById('editBtn').hidden})));
if(id===1661222371){ await p.evaluate(()=>edEnter()); console.log('editor open',await p.evaluate(()=>EDIT)); }
await ctx.close(); }
console.log('errs',errs); await b.close();})();
