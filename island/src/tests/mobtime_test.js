const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(); const p=await b.newPage({viewport:{width:900,height:650}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>localStorage.setItem('island_nick','Artem'));
await p.goto('file://'+process.argv[2]); await p.waitForTimeout(1000);
// day: bats on (3), wolves day 0
await p.evaluate(()=>{ applyConfig({mobTime:{bat:{d:1,n:1,dn:3,nn:2},wolf:{d:0,n:0,dn:0,nn:0}}}); for(const a of animals) a.dead=true; });
await p.waitForTimeout(9000);
console.log('day animals',await p.evaluate(()=>animals.filter(a=>!a.leaving).map(a=>a.kind).join(",")));
// put bat right at hero; check no bite in 4s
await p.evaluate(()=>{ const bt=animals.find(a=>a.kind==="bat"); bt.x=hero.x+0.5; bt.y=hero.y; bt.home={x:hero.x,y:hero.y}; bt.attackT=0.1; window.BT=bt; });
await p.waitForTimeout(4000); console.log('hp after 4s near day bat',await p.evaluate(()=>hero.hp));
await p.evaluate(()=>{ for(const [x,y] of [[0,0]]) {} BT.x=hero.x+0.6; BT.y=hero.y; }); await p.screenshot({path:'daybat.png'});
await p.evaluate(()=>{ giveItem("club"); const st={}; applyHit(BT,NET.myPeer,hero.x,hero.y,1,false); }); await p.waitForTimeout(4000);
console.log('after hit: aggro',await p.evaluate(()=>[BT.aggro,hero.hp]));
// night: wolves off -> none
await p.evaluate(()=>{ skipTime(); }); await p.waitForTimeout(6000);
console.log('night animals',await p.evaluate(()=>animals.filter(a=>!a.leaving&&!(a.dying>0)).map(a=>a.kind).join(",")));
await p.screenshot({path:'nightbat.png'});
console.log('errs',errs); await b.close();})();
