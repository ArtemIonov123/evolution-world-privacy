// Проверка локального режима: админка и редактор работают, изменения сохраняются после перезагрузки.  node tests/editor_test.js
const { chromium } = require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:800}}); const p=await ctx.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  const url='file://'+path.resolve(__dirname,'../game.html');
  await p.goto(url); await p.waitForTimeout(2500);
  await p.evaluate(()=>{ const n=document.getElementById('nickWrap'); if(n&&!n.hidden){ setNick('Tester'); n.hidden=true; } if(!heroClass) setClass('warrior'); const c=document.getElementById('classWrap'); if(c) c.remove(); });
  const a=await p.evaluate(()=>({admin:isAdmin, editBtn:!document.getElementById('editBtn').hidden}));
  // редактор вещей: создаём вещь
  await p.evaluate(async()=>{ openWin("admin"); winKind="admin_items"; renderWin(); });
  await p.screenshot({path:path.resolve(__dirname,'editor_items.png')});
  await p.evaluate(()=>{ closeWin(); edEnter("map"); }); await p.waitForTimeout(500);
  await p.screenshot({path:path.resolve(__dirname,'editor_map.png')});
  // меняем карту и сохраняем
  const before=await p.evaluate(async()=>{ const c=cells.find(c=>freeCell(c)&&!c.props.length); c.props.push("prop_barrel"); try{ edSave(); }catch(e){ return "save err "+e.message; } return [c.x,c.y]; });
  await p.waitForTimeout(2500); await p.goto(url); await p.waitForTimeout(2500);
  const after=await p.evaluate(xy=>{ const c=cellAt(xy[0],xy[1]); return c&&c.props.includes("prop_barrel"); },before);
  console.log(JSON.stringify({...a,placedAt:before,keptAfterReload:after}));
  console.log(errs.length?'ERRORS '+errs.join(' | '):'OK, ошибок нет'); await b.close(); process.exit(errs.length?1:0); })();
