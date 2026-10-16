const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(); const errs=[];
for(const [w,h,cl] of [[360,780,'warrior'],[360,780,'druid'],[320,640,'druid'],[412,860,'druid'],[390,844,'warrior']]){
const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true,deviceScaleFactor:2})).newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('island_nick','Andrii');localStorage.setItem('island_lang','ru')});
await p.goto('file://'+process.argv[2]); await p.waitForTimeout(1300);
await p.evaluate(c=>{ setClass(c); const x=document.getElementById('classWrap'); if(x) x.remove(); prog.xp=60; recalcHP(); renderSkills(); document.getElementById('chatBtn').hidden=false; },cl);
await p.waitForTimeout(300);
const r=await p.evaluate(()=>{ const R=e=>e.getBoundingClientRect(); const hb=[...document.querySelectorAll('.hb')].map(R), sk=[...document.querySelectorAll('.skb')].map(R), ch=R(document.getElementById('chatBtn')), at=R(document.getElementById('atkBtn'));
  const ov=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1; let bad=0;
  for(const s of sk){ for(const x of [...hb,ch]) if(ov(s,x)) bad++; if(s.left<0||s.right>innerWidth) bad++; }
  const cc=a=>[(a.left+a.right)/2,(a.top+a.bottom)/2,a.width/2]; for(let i=0;i<sk.length;i++) for(let j=i+1;j<sk.length;j++){ const [x1,y1,r1]=cc(sk[i]),[x2,y2,r2]=cc(sk[j]); if(Math.hypot(x1-x2,y1-y2)<r1+r2-1) bad+=100; } const [ax,ay,ar]=cc(at); for(const s of sk){ const [x,y,r]=cc(s); if(Math.hypot(x-ax,y-ay)<r+ar-1) bad+=1000; }
  const hbRight=Math.max(...hb.map(x=>x.right)), skLeft=Math.min(...sk.map(x=>x.left)), hbTop=Math.min(...hb.map(x=>x.top)), skBottom=Math.max(...sk.map(x=>x.bottom)); const sp=[]; for(let i=1;i<sk.length;i++){ const a=sk[i-1],c=sk[i]; sp.push(Math.round(Math.hypot((a.left+a.right-c.left-c.right)/2,(a.top+a.bottom-c.top-c.bottom)/2)-a.width)); }
  return {overlaps:bad,gapX:Math.round(skLeft-hbRight),aboveHotbar:Math.round(hbTop-skBottom),skillGaps:sp.join(","),topOfHud:Math.round(Math.min(...sk.map(x=>x.top)))}; });
console.log(w+'x'+h,cl,r); await p.screenshot({path:`shot_narrow_${w}_${cl}.png`}); }
console.log('errs',errs); await b.close();})();
