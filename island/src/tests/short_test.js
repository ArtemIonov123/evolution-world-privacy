const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(); const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]); await p.waitForTimeout(1200);
console.log(await p.evaluate(()=>[0,999,9999,10000,12345,999999,1000000,1250000,15500000,2e9].map(shortNum)));
await p.evaluate(()=>{ inv.coin=1000000; crystals=125000; renderHdCoins(); }); await p.waitForTimeout(300);
console.log(await p.evaluate(()=>[document.getElementById('hdCoinN').textContent,document.getElementById('hudCrN').textContent]));
console.log('errs',errs); await b.close();})();
