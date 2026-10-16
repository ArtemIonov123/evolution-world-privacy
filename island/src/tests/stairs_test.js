const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1000,height:700}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')}); const errs=[];
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('island_nick','Gracz');localStorage.setItem('island_lang','ru');});
await p.goto('http://localhost:8765/index.html#world=StairWorldKey12345&admin=z'); await p.waitForTimeout(1800);
await p.evaluate(()=>edEnter());
const r=await p.evaluate(()=>{
  // клетка без лестницы, у которой ровно один сосед выше на 1
  const c=cells.find(c=>!c.st&&!wet(c)&&!isSpecial(c)&&!c.props.length&&STAIR_ORDER.filter(d=>{const n=cellAt(c.x+STAIR_DIR[d][0],c.y+STAIR_DIR[d][1]); return n&&n.L===c.L+1;}).length===1&&STAIR_ORDER.some(d=>{const n=cellAt(c.x+STAIR_DIR[d][0],c.y+STAIR_DIR[d][1]); return n&&n.L===c.L+1&&(d==="P"||d==="Q");}));
  const up=STAIR_ORDER.find(d=>{const n=cellAt(c.x+STAIR_DIR[d][0],c.y+STAIR_DIR[d][1]); return n&&n.L===c.L+1;});
  const ap=()=>{ const st={changes:[],seen:new Set()}; edApplyCell(c.x,c.y,st); edCommit(st,JSON.stringify(edDraft)); return c.st; };
  edTool="stairs"; const placed=ap(); const seq=[ap(),ap(),ap(),ap()];
  edTool="stairs_del"; const del=ap();
  edTool="stairs"; ap(); window.__c=[c.x,c.y];
  return {cell:[c.x,c.y],up,placed,seq,del};
});
console.log(r);
await p.evaluate(()=>{ edCat="land"; edRender(); const [x,y]=__c; const q=proj(x-MX,y-MY,cellAt(x,y).L); panX=600-q[0]*scale; panY=380-q[1]*scale; dirty=true; });
await p.waitForTimeout(300); await p.screenshot({path:'S_ed.png'});
for(let q=1;q<4;q++){ await p.evaluate(()=>rotate(1)); await p.waitForTimeout(900); await p.evaluate(()=>{ const [x,y]=__c; const q=proj(x-MX,y-MY,cellAt(x,y).L); panX=500-q[0]*scale; panY=350-q[1]*scale; dirty=true; }); await p.waitForTimeout(200); await p.screenshot({path:`S_r${q}.png`,clip:{x:380,y:230,width:240,height:200}}); }
console.log('errs',errs); await b.close();})();
