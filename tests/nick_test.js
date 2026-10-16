// Ник вводится и в «песочнице» без отправки форм (как при просмотре файла внутри приложения):  node tests/nick_test.js
const { chromium } = require('playwright'); const path=require('path'), fs=require('fs');
(async()=>{ const b=await chromium.launch(); let bad=0;
  const host=path.resolve(__dirname,'_nick_host.html');
  fs.writeFileSync(host,'<iframe id="f" sandbox="allow-scripts allow-same-origin" style="width:390px;height:800px;border:0" src="../game.html"></iframe>');
  for(const [name,url] of [['обычно','../game.html'],['песочница',null]]){
    const p=await (await b.newContext({viewport:{width:420,height:820},hasTouch:true})).newPage(); const errs=[];
    p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file://'+(url?path.resolve(__dirname,url):host)); await p.waitForTimeout(2500);
    const fr=url?p.mainFrame():p.frames().find(f=>f!==p.mainFrame());
    await fr.fill('#nickIn','Artem'); await fr.tap('#nickForm button'); await p.waitForTimeout(800);
    const ok=await fr.evaluate(()=>document.getElementById('nickWrap').hidden&&myNick==='Artem');
    console.log(name+':',ok?'ник принят':'НЕ ПРИНЯТ',errs.length?'ошибки: '+errs.join(' | '):''); if(!ok||errs.length) bad++; await p.close(); }
  fs.unlinkSync(host); await b.close(); console.log(bad?'ПРОВАЛ':'OK'); process.exit(bad?1:0); })();
