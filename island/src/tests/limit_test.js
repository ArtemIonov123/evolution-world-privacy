const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:800}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(`window.Telegram={WebApp:{initData:"x",initDataUnsafe:{start_param:"",user:{id:777050,first_name:"T",language_code:"ru"}},ready(){},expand(){}}};try{localStorage.setItem("island_lang","ru")}catch(e){}`);
await p.goto('http://localhost:8765/index.html#world=Lim'+Date.now()); await p.waitForTimeout(2500);
const r=await p.evaluate(()=>{ if(!heroClass) setClass('warrior'); const c=document.getElementById('classWrap'); if(c) c.remove();
  const ids=ITEMS.map(f=>f.id).filter(i=>i!=="coin"&&i!=="wood"); for(let i=0;i<40;i++){ const id="zz"+i; if(!ITEMS.some(f=>f.id===id)) ITEMS.push({id}); ICONS[id]=ICONS.wood; ids.push(id); } ids.sort((a,b)=>(a==="rod_wood")-(b==="rod_wood")); const keep=equip.rod; equip.rod=keep;
  for(const k of Object.keys(inv)) if(k!=="coin") delete inv[k];
  for(let i=0;i<BAG_SIZE;i++) inv[ids[i]]=1; inv.coin=500;
  const out={used:bagUsed(),total:ids.length};
  out.roomNew=bagRoom("wood"); out.roomStack=bagRoom(ids[0]); out.roomCoin=bagRoom("coin");
  const s={id:"wood",p:1,n:1}; const c0=inv.coin; buy(s); out.buyBlocked=!inv.wood&&inv.coin===c0&&shopMsg[0]==="bag_full";
  const eq=Object.entries(equip).find(([k,v])=>v); out.eq=eq&&eq[1];
  if(eq){ unequip(eq[0]); out.unequipBlocked=equip[eq[0]]===eq[1]; }
  openWin("bag"); out.footFull=!!document.querySelector('.baguse.full'); out.toast=document.getElementById('toast').textContent;
  closeWin(); const before=JSON.stringify(inv); giveLoot({kind:'wolf',x:hero.x,y:hero.y}); const aft=JSON.parse(JSON.stringify(inv)); out.lootNoNewKinds=Object.keys(aft).every(k=>k in JSON.parse(before)); out.coinAfterLoot=aft.coin;
  delete inv[ids[0]]; out.roomAfter=bagRoom("wood"); return out; });
console.log(JSON.stringify(r)); await p.screenshot({path:'shot_bag_full.png'}); console.log('errs',errs); await b.close();})();
