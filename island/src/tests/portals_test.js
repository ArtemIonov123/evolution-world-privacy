const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:800}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
const W='#world=PortalsKey'+Date.now();
const mk=async(id,first)=>{ const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(id+': '+e.message));
  await p.addInitScript(`window.Telegram={WebApp:{initData:"x",initDataUnsafe:{start_param:"",user:{id:${id},first_name:${JSON.stringify(first)},language_code:"ru"}},ready(){},expand(){}}};try{localStorage.setItem("island_lang","ru")}catch(e){}`);
  await p.goto('http://localhost:8765/index.html'+W); await p.waitForTimeout(2500);
  await p.evaluate(()=>{ if(!heroClass) setClass('warrior'); const c=document.getElementById('classWrap'); if(c) c.remove(); }); return p; };
const ready=async p=>{ await p.waitForTimeout(2700); await p.evaluate(()=>{ const c=document.getElementById('classWrap'); if(c) c.remove(); }); };
const free=`(()=>{ for(let r=2;r<6;r++) for(let dx=-r;dx<=r;dx++) for(let dy=-r;dy<=r;dy++){ const c=cellAt(Math.round(hero.x)+dx,Math.round(hero.y)+dy); if(c&&freeCell(c)&&!c.props.length&&!c.link) return c; } })()`;
const ad=await mk(1661222371,"Artem");
// новый остров
await ad.evaluate(async()=>{ znDraft={ru:"Туманный",pl:"",k:"island",w:16,d:16,isNew:true}; await znSave(); }); await ad.waitForTimeout(800);
const zid=await ad.evaluate(()=>Object.keys(ZONES)[0]);
// редактор: инструмент «Портал» → тап → карточка
const A=await ad.evaluate(f=>{ edEnter("map"); edCat="places"; edTool="link_new"; edRender(); const c=eval(f); const tools=[...document.querySelectorAll('.edb small')].map(x=>x.textContent).filter(t=>/Портал|Убрать/.test(t));
  const r=lkAddAt(c,""); ptOpen(r); return {id:r,x:c.x,y:c.y,tools,card:winKind,title:document.querySelector('.wbody b')&&document.querySelector('.wbody b').textContent}; },free);
console.log('placed',A);
await ad.screenshot({path:'shot_pt_card_new.png',fullPage:true});
// задаём: куда — Туманный, надпись, сохранить
await ad.evaluate(([id,z])=>{ ptDraft.to=z; ptDraft.name="Туманные земли"; renderWin(); document.querySelector('.plbtns .big').click(); },[A.id,zid]); await ad.waitForTimeout(500);
console.log('saved',await ad.evaluate(id=>LINKS[id],A.id));
await ad.screenshot({path:'shot_pt_card.png',fullPage:true});
await ad.evaluate(()=>edExit(false));
// игрок 2: закрытый портал не пускает
const pl=await mk(777040,"Petya");
await ad.evaluate(id=>{ lkWrite({...LINKS,[id]:{...LINKS[id],on:0}}); },A.id); await pl.waitForTimeout(700);
await pl.evaluate(id=>useLink(id),A.id); await pl.waitForTimeout(300);
console.log('closed ->',await pl.evaluate(()=>[ZONE,document.getElementById('toast').textContent]));
await ad.evaluate(id=>{ lkWrite({...LINKS,[id]:{...LINKS[id],on:1,lv:5}}); },A.id); await pl.waitForTimeout(700);
await pl.evaluate(id=>useLink(id),A.id); await pl.waitForTimeout(300);
console.log('lv5 ->',await pl.evaluate(()=>[ZONE,document.getElementById('toast').textContent]));
await ad.evaluate(id=>{ lkWrite({...LINKS,[id]:{...LINKS[id],lv:0}}); },A.id); await pl.waitForTimeout(700);
// админ идёт: на той стороне порталов нет → точка старта
await ad.evaluate(id=>useLink(id),A.id); await ready(ad);
console.log('admin arrived',await ad.evaluate(()=>({ZONE,atStart:Math.hypot(hero.x-MAP.start[0],hero.y-MAP.start[1])<1})));
// ставим обратный портал и связываем
const B=await ad.evaluate(f=>{ edEnter("map"); const c=eval(f); const r=lkAddAt(c,""); ptOpen(r); return {id:r,x:c.x,y:c.y}; },free);
await ad.evaluate(([idB,idA])=>{ ptDraft.to="island"; ptDraft.arr="link"; ptDraft.ap=idA; renderWin(); document.querySelector('.plbtns .big').click(); renderWin();
  const bb=[...document.querySelectorAll('.wbody .btn')].find(x=>x.textContent.includes('Связать')); bb&&bb.click(); },[B.id,A.id]); await ad.waitForTimeout(600);
console.log('linked',await ad.evaluate(([a,b])=>[LINKS[b].to,LINKS[b].ap===a,LINKS[a].ap===b,LINKS[a].arr],[A.id,B.id]));
await ad.evaluate(()=>edExit(false));
// игрок идёт с главного: появляется у портала B
await pl.waitForTimeout(500); await pl.evaluate(id=>useLink(id),A.id); await ready(pl);
console.log('player arrived',await pl.evaluate(b=>({ZONE,distB:+Math.hypot(hero.x-b.x,hero.y-b.y).toFixed(1)}),B));
// клетка появления: у портала A ставим «в своей клетке» и выбираем клетку на карте Туманного
const cellPick=await ad.evaluate(a=>{ for(const c of cells) if(freeCell(c)&&!c.link&&Math.hypot(c.x-MAP.start[0],c.y-MAP.start[1])>4) { edEnter("map"); lkWrite({...LINKS,[a]:{...LINKS[a],arr:"cell"}}); edTool="parr_"+a; ptPickAt(a,c); return [c.x,c.y]; } },A.id);
await ad.waitForTimeout(500);
console.log('arrival cell',cellPick,await ad.evaluate(a=>[LINKS[a].arr,LINKS[a].ac],A.id));
await ad.evaluate(()=>{ closeWin(); edExit(false); });
// админ возвращается через B → на главном у портала A
await ad.evaluate(id=>useLink(id),B.id); await ready(ad);
console.log('admin back',await ad.evaluate(a=>({ZONE,distA:+Math.hypot(hero.x-a.x,hero.y-a.y).toFixed(1)}),A));
// и снова через A → прямо в выбранную клетку
await ad.evaluate(id=>useLink(id),A.id); await ready(ad);
console.log('admin at picked cell',await ad.evaluate(c=>({ZONE,dist:+Math.hypot(hero.x-c[0],hero.y-c[1]).toFixed(1)}),cellPick));
await ad.evaluate(()=>{ openWin("admin"); winKind="admin_portals"; ptSel=null; renderWin(); }); await ad.waitForTimeout(200); await ad.screenshot({path:'shot_pt_list.png',fullPage:true});
await ad.evaluate(()=>{ closeWin(); const L=Object.values(LINKS).find(l=>l.z===ZONE); ptCenter(L); setZoomK(5,0,0); const c=cellAt(L.x,L.y); const [fx,fy]=proj(c.x-MX,c.y-MY,c.L), r=cv.getBoundingClientRect(); panX=r.width/2-fx*scale; panY=r.height/2-(fy-20)*scale; dirty=true; hero.x=Math.max(0,hero.x-8); });
await ad.waitForTimeout(400); await ad.screenshot({path:'shot_pt_label.png'});
console.log('errs',errs); await b.close();})();
