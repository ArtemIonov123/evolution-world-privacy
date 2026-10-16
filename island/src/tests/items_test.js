const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch(); const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:800}}); await ctx.addInitScript({content:fs.readFileSync('fake_rtdb.js','utf8')});
const W='#world=ItemsEditorKey123456'+Date.now();
const mk=async(id,first)=>{ const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(id+': '+e.message));
  await p.addInitScript(`window.Telegram={WebApp:{initData:"x",initDataUnsafe:{start_param:"",user:{id:${id},first_name:${JSON.stringify(first)},language_code:"ru"}},ready(){},expand(){}}};try{localStorage.setItem("island_lang","ru")}catch(e){}`);
  await p.goto('http://localhost:8765/index.html'+W); await p.waitForTimeout(2500);
  await p.evaluate(()=>{ if(!heroClass) setClass('warrior'); const c=document.getElementById('classWrap'); if(c) c.remove(); }); return p; };
const ad=await mk(1661222371,"Artem"); const pl=await mk(777001,"Petya");
await ad.evaluate(()=>{ document.getElementById('editBtn').click(); }); await ad.waitForTimeout(200);
console.log('cards',await ad.evaluate(()=>[...document.querySelectorAll('.adcard b')].map(x=>x.textContent).join(' | ')));
await ad.evaluate(()=>[...document.querySelectorAll('.adcard')].find(x=>x.textContent.includes('Вещи')).click()); await ad.waitForTimeout(200);
await ad.screenshot({path:'shot_it_empty.png'});
await ad.click('.adtop + .btn.big, .wbody > .btn.big'); await ad.waitForTimeout(200);
const ins=ad.locator('.plform input:not([type=checkbox]):not([type=range])');
await ins.nth(0).fill('Меч Тьмы'); await ins.nth(2).fill('Выкован в пещере');
await ins.nth(3).fill('7');   // атк
await ad.evaluate(()=>{ const b=[...document.querySelectorAll('.itgrid button')].find(x=>x.title==='Стальной меч'||x.title.includes('тальн')); (b||document.querySelector('.itgrid button')).click(); }); await ad.waitForTimeout(150);
await ad.evaluate(()=>{ const r=document.querySelector('input[type=range]'); r.value="220"; r.dispatchEvent(new Event('input')); });
await ad.screenshot({path:'shot_it_card.png',fullPage:true});
await ad.evaluate(()=>document.querySelector('.plbtns .big').click()); await ad.waitForTimeout(1200);
console.log('admin msg',await ad.evaluate(()=>document.querySelector('.adok')&&document.querySelector('.adok').textContent));
const cid=await ad.evaluate(()=>Object.keys(CUSTOM)[0]); console.log('id',cid);
console.log('player sees',await pl.evaluate(id=>({name:tr("fish_"+id),gear:GEAR[id],shop:shopList().some(s=>s.id===id),desc:itemDesc(id),icon:!!ICONS[id]}),cid));
// buy & equip on player
await pl.evaluate(id=>{ inv.coin=500; const s=shopList().find(x=>x.id===id); buy(s); },cid); await pl.waitForTimeout(200);
console.log('player equip',await pl.evaluate(id=>({w:equip.weapon,atk:heroAtk(),coin:inv.coin}),cid));
await pl.evaluate(()=>saveNow()); await pl.waitForTimeout(1200);
await pl.reload(); await pl.waitForTimeout(3000);
console.log('after reload',await pl.evaluate(id=>({w:equip.weapon,atk:heroAtk()}),cid));
// potion with lv requirement test: helmet lv 10
await ad.evaluate(()=>{ itSel=null; renderWin(); }); await ad.waitForTimeout(100);
await ad.evaluate(()=>{ document.querySelector('.wbody > .btn.big').click(); }); await ad.waitForTimeout(100);
await ad.evaluate(()=>{ itDraft.t="head"; itDraft.ru="Корона"; itDraft.def=3; itDraft.lv=10; itDraft.hp=2; itSave(); });
await ad.evaluate(()=>{ itSel=null; renderWin(); document.querySelector('.wbody > .btn.big').click(); itDraft.t="potion"; itDraft.ru="Эликсир"; itDraft.heal=4; itDraft.shop=false; itSave(); });
// upload png
await ad.evaluate(()=>{ itSel=null; renderWin(); document.querySelector('.wbody > .btn.big').click(); itDraft.t="mat"; itDraft.ru="Кристалл огня"; renderWin(); });
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAKUlEQVR42mP8z8DwnwEJMDIyMjAwMDAwMfz/z0AMYBw1YNSAUQNGjgEArtUL+e3e0mIAAAAASUVORK5CYII=','base64'); fs.writeFileSync('t_icon.png',png);
await ad.setInputFiles('.wbody input[type=file]','t_icon.png'); await ad.waitForTimeout(500);
console.log('uploaded img',await ad.evaluate(()=>itDraft.img.slice(0,30)));
await ad.evaluate(()=>itSave()); await ad.waitForTimeout(800);
await ad.evaluate(()=>{ itSel=null; renderWin(); }); await ad.waitForTimeout(300);
await ad.screenshot({path:'shot_it_list.png'});
await pl.waitForTimeout(500);
const ids=await pl.evaluate(()=>Object.keys(CUSTOM)); console.log('player custom count',ids.length);
const crown=await pl.evaluate(()=>Object.keys(CUSTOM).find(k=>CUSTOM[k].ru==="Корона"));
console.log('crown lv10 equip',await pl.evaluate(id=>{ giveItem(id); equipItem(id); return [equip.head,document.getElementById('toast').textContent]; },crown));
const eli=await pl.evaluate(()=>Object.keys(CUSTOM).find(k=>CUSTOM[k].ru==="Эликсир"));
console.log('elixir',await pl.evaluate(id=>{ giveItem(id); hero.hp=1; eatCooked(id); return [hero.hp,EDIBLE[id]]; },eli));
// drop editor sees custom items
console.log('drop select has custom',await ad.evaluate(id=>ITEMS.some(i=>i.id===id),cid));
// delete sword
await ad.evaluate(id=>{ itSel=id; itDraft={...CUSTOM[id]}; renderWin(); },cid);
await ad.evaluate(()=>{ const d=document.querySelector('.plbtns .warn'); d.click(); document.querySelector('.plbtns .warn').click(); }); await ad.waitForTimeout(800);
console.log('after delete player',await pl.evaluate(id=>({has:!!CUSTOM[id],w:equip.weapon,atk:heroAtk()}),cid));
console.log('errs',errs); await b.close();})();
