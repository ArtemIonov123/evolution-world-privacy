const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:760}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const WK='TgAdminKey12345678';
// хозяин задаёт код обычной админ-ссылкой
let p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>localStorage.setItem('island_nick','Web'));
await p.goto(`http://localhost:8765/index.html#world=${WK}&admin=SecretCode123`); await p.waitForTimeout(2500);
console.log('web admin',await p.evaluate(()=>isAdmin)); await p.close();
const tg=(sp)=>`window.Telegram={WebApp:{initDataUnsafe:{start_param:${JSON.stringify(sp)},user:{id:42424242,first_name:"Artem",language_code:"ru"}},ready(){},expand(){}}};`;
// TG c неверным кодом
const c2=await b.newContext({viewport:{width:390,height:760}}); await c2.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
// общий fake rtdb между контекстами — localStorage разный; поэтому тестируем в том же контексте
p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message)); await p.addInitScript({content:tg("WrongCode99")});
await p.goto(`http://localhost:8765/index.html#world=${WK}`); await p.waitForTimeout(2500);
console.log('tg wrong',await p.evaluate(()=>({a:isAdmin,btn:!document.getElementById('editBtn').hidden}))); await p.close();
p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message)); await p.addInitScript({content:tg("SecretCode123")});
await p.goto(`http://localhost:8765/index.html#world=${WK}`); await p.waitForTimeout(2500);
console.log('tg right',await p.evaluate(()=>({a:isAdmin,btn:document.getElementById('editBtn').textContent,shown:!document.getElementById('editBtn').hidden}))); await p.close();
// повторный вход в TG без кода — помнит
p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message)); await p.addInitScript({content:tg("")});
await p.goto(`http://localhost:8765/index.html#world=${WK}`); await p.waitForTimeout(2500);
console.log('tg again',await p.evaluate(()=>isAdmin));
console.log('errs',errs); await b.close();})();
