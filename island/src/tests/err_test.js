const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const p=await b.newPage(); await p.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
p.on('pageerror',e=>console.log('ERR',e.message,e.stack&&e.stack.slice(0,300)));
p.on('requestfailed',r=>console.log('FAIL',r.url())); p.on('response',r=>{ if(!r.url().endsWith('/')&&!r.url().includes('index')) console.log('RESP',r.status(),r.url().slice(0,100)); });
await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1500); await b.close();})();
