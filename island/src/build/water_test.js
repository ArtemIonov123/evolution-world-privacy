const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1000,height:700}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const pg=async(who,url,uid)=>{const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(who+':'+e.message));
  await p.addInitScript(([u])=>{ if(!sessionStorage.getItem('i')){ sessionStorage.setItem('i',1); localStorage.setItem('island_nick','Gracz'); localStorage.setItem('island_uid',u); localStorage.setItem('island_lang','ru');} },[uid]);
  await p.goto(url); await p.waitForTimeout(1800); return p;};
const WK='WaterWorldKey123456';
const A=await pg('A',`http://localhost:8765/index.html#world=${WK}&admin=z`,'uAAAAAAAAAAAAAA');
const B=await pg('B',`http://localhost:8765/index.html#world=${WK}`,'uBBBBBBBBBBBBBB');
await A.evaluate(()=>edEnter());
await A.evaluate(()=>{ edCat="water"; edRender(); });
console.log('water tab tools',await A.evaluate(()=>[...document.querySelectorAll('.edtools .edb small')].map(e=>e.textContent)));
// shallow ring next to hero, lake with props
const res=await A.evaluate(()=>{ const ok=(x,y)=>{const c=cellAt(x,y); return c&&!isSpecial(c)&&!c.water&&!c.st;};
  const base=cells.map(c=>[c.x,c.y]).filter(([x,y])=>[-1,0,1,2,3,4].every(dx=>ok(x+dx,y)&&ok(x+dx,y+1))).sort((a,b)=>Math.hypot(a[0]-hero.x,a[1]-hero.y)-Math.hypot(b[0]-hero.x,b[1]-hero.y))[0];
  const hx=base[0], hy=base[1]; const st={changes:[],seen:new Set()};
  edBrush=1; edTool="v"; for(const [dx,dy] of [[1,0],[2,0],[1,1],[2,1]]) edApplyCell(hx+dx,hy+dy,st);
  edTool="w"; for(const [dx,dy] of [[3,0],[3,1],[4,0],[4,1]]) edApplyCell(hx+dx,hy+dy,st);
  const s2={changes:[],seen:new Set()}; edTool="prop_lily_pad"; edApplyCell(hx+3,hy,s2); edTool="prop_reeds"; edApplyCell(hx+2,hy+1,s2); edTool="prop_rock_water"; edApplyCell(hx+4,hy+1,s2);
  edTool="prop_lily_pad"; edApplyCell(hx-1,hy,s2);  // на суше — нельзя
  edCommit(st,"{}"); edCommit(s2,"{}");
  return {hx,hy,v:cellAt(hx+1,hy).shallow, vb:cellAt(hx+1,hy).blocked, wb:cellAt(hx+3,hy).blocked, lily:cellAt(hx+3,hy).props, reeds:cellAt(hx+2,hy+1).blocked, land:cellAt(hx-1,hy).props}; });
console.log(res);
await A.screenshot({path:'W_ed.png'});
await A.evaluate(()=>edSave()); await A.waitForTimeout(2500);
await B.waitForTimeout(3000);
console.log('B sees',await B.evaluate(([x,y])=>({t:cellAt(x+1,y).t,sh:cellAt(x+1,y).shallow,lily:cellAt(x+3,y).props}),[res.hx,res.hy]));
// B walks into shallow
await B.evaluate(([x,y])=>{ hero.x=x-1; hero.y=y; hero.path=[]; follow=true; goTo(cellAt(x+2,y)); },[res.hx,res.hy]); await B.waitForTimeout(3000);
console.log('B pos',await B.evaluate(()=>[hero.x,hero.y,hero.z]));
await B.screenshot({path:'W_walk.png'});
await B.evaluate(()=>{ quarter&&0; rotate(1); }); await B.waitForTimeout(150); await B.screenshot({path:'W_rot.png'}); await B.waitForTimeout(800);
console.log('errs',errs); await b.close();})();
