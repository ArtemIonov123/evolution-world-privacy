const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(); const errs=[];
// имитируем «чужой» хост: открываем через 127.0.0.2 (не localhost) — шлюз должен сработать
const p=await b.newPage(); const nav=[]; p.on('pageerror',e=>errs.push(e.message));
await p.route('https://t.me/**',r=>{ nav.push(r.request().url()); r.fulfill({status:200,body:'TG'}); });
await p.route('https://telegram.org/**',r=>r.fulfill({status:200,contentType:'text/javascript',body:'window.Telegram={WebApp:{initData:"",initDataUnsafe:{}}};'}));
await p.goto('http://127.0.0.2:8766/index.html#world=X').catch(()=>{}); await p.waitForTimeout(1500);
console.log('redirected to',nav[0], 'now', p.url());
// в Telegram — игра работает
const q=await b.newPage(); q.on('pageerror',e=>errs.push('tg:'+e.message));
await q.route('https://telegram.org/**',r=>r.fulfill({status:200,contentType:'text/javascript',body:'window.Telegram={WebApp:{initData:"query_id=1&user=x",initDataUnsafe:{user:{id:5,first_name:"Tester"}},ready(){},expand(){}}};'}));
await q.route('**/*firebasedatabase.app/**',r=>r.abort());
await q.goto('http://127.0.0.2:8766/index.html#world=Zndpq1U6xpOHMsiA1AP0'); await q.waitForTimeout(3000);
console.log('in tg: blocked',await q.evaluate(()=>!!window.__islandBlocked),'canvas',await q.evaluate(()=>!!document.getElementById('cv')),'nick',await q.evaluate(()=>typeof myNick!=="undefined"&&myNick));
console.log('errs',errs.slice(0,3)); await b.close();})();
