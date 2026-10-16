import sys
p=sys.argv[1]; s=open(p,encoding="utf-8").read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a); assert n==cnt,(n,a[:100]); s=s.replace(a,b)

# CSS: blocks inside windows must not shrink; admin windows above bottom HUD
rep(".wbody .grid{display:flex;flex-wrap:wrap;gap:6px}",".wbody .grid{display:flex;flex-wrap:wrap;gap:6px}\n.wbody>*{flex-shrink:0}")
rep("body.bhud .toast{bottom:calc(var(--bh-b) + var(--atk)/2","body.bhud .win{z-index:9}\nbody.bhud .toast{bottom:calc(var(--bh-b) + var(--atk)/2")

# i18n
rep('''    it_shop:"Sprzedawaj w sklepie", it_price:"Cena w sklepie", it_sell:"Kupiec skupi za",''','''    it_shop:"Można kupić", it_price:"Cena", it_sell:"Kupiec skupi za", it_seller:"U kogo", it_sell_auto:"0 = automatycznie (40% ceny). Sprzedać kupcowi można zawsze.",
    it_nobuy:"Nie do kupienia — tylko łup z potworów albo nagroda za zadanie.", seller_merchant:"Kupiec Zbyszek", seller_npc:"Dziadek Bogdan", opt_buy_npc:"Pokaż, co sprzedajesz", win_shop_npc:"Towary Bogdana",''')
rep('''    it_shop:"Продавать в лавке", it_price:"Цена в лавке", it_sell:"Купец купит за",''','''    it_shop:"Можно купить", it_price:"Цена", it_sell:"Купец купит за", it_seller:"У кого", it_sell_auto:"0 = автоматически (40% от цены). Продать купцу можно всегда.",
    it_nobuy:"Купить нельзя — только выпадает с мобов или награда за задание.", seller_merchant:"Купец Збышек", seller_npc:"Дед Богдан", opt_buy_npc:"Покажи, что продаёшь", win_shop_npc:"Товары Богдана",''')

# data: seller instead of shop flag; sell price always > 0
rep('''lv:gear?itNum(o.lv,60):0,cl:gear&&CLASSES.includes(o.cl)?o.cl:"",shop:!!o.shop,price:itNum(o.price,999999),sell:itNum(o.sell,999999),''',
'''lv:gear?itNum(o.lv,60):0,cl:gear&&CLASSES.includes(o.cl)?o.cl:"",seller:["merchant","npc"].includes(o.seller)?o.seller:(o.shop===true?"merchant":""),price:itNum(o.price,999999),sell:itNum(o.sell,999999),''')
rep('''    if(it.sell) SELL_P[id]=it.sell;
    if(it.shop&&it.price>0) CUSTOM_SHOP.push({id,p:it.price});''','''    SELL_P[id]=it.sell||Math.max(1,Math.round(it.price*0.4));
    if(it.seller&&it.price>0) CUSTOM_SHOP.push({id,p:it.price,by:it.seller});''')
rep('''  if(it.sell) out.push(tr("ci_sell",{c:it.sell}));''','''  out.push(tr("ci_sell",{c:it.sell||Math.max(1,Math.round(it.price*0.4))}));''')

# shop list per seller
rep('''const shopList=()=>SHOP.concat(CUSTOM_SHOP).filter(''','''let shopNpc="merchant";
const shopList=()=>(shopNpc==="npc"?CUSTOM_SHOP.filter(s=>s.by==="npc"):SHOP.concat(CUSTOM_SHOP.filter(s=>s.by!=="npc"))).filter(''')
rep('''function openShop(){ if(dialogOpen) closeDialog(); shopTab="buy";''','''function openShop(){ shopNpc="merchant"; if(dialogOpen) closeDialog(); shopTab="buy";''')
rep('''function renderShop(body){
  const head=mkEl("div","shead"); head.appendChild(shopPortrait());
  const tx=mkEl("div"); tx.appendChild(mkEl("b",null,tr("merch_name")));''','''function openShopNpc(){ shopNpc="npc"; if(dialogOpen) closeDialog(); shopTab="buy"; shopMsg=["shop_hello"]; if(winKind==="shop") renderWin(); else openWin("shop"); }
function renderShop(body){
  if(shopNpc==="npc") shopTab="buy";
  const head=mkEl("div","shead"); if(shopNpc!=="npc") head.appendChild(shopPortrait());
  const tx=mkEl("div"); tx.appendChild(mkEl("b",null,tr(shopNpc==="npc"?"seller_npc":"merch_name")));''')
rep('''  for(const k of ["buy","sell"]){ const b=mkEl("button","btn"+(shopTab===k?" on":""),tr("shop_"+k));''','''  for(const k of shopNpc==="npc"?["buy"]:["buy","sell"]){ const b=mkEl("button","btn"+(shopTab===k?" on":""),tr("shop_"+k));''')
rep('''  if(winKind==="shop"&&d>3.2) closeWin();''','''  if(winKind==="shop"&&shopNpc!=="npc"&&d>3.2) closeWin();
  if(winKind==="shop"&&shopNpc==="npc"&&typeof NPCC!=="undefined"&&NPCC&&Math.hypot(hero.x-NPCC.x,hero.y-NPCC.y)>3.5) closeWin();''')
rep('''    opts.push(["opt_craft",null,()=>{dlgNode="craft";renderDialog();}]);''','''    opts.push(["opt_craft",null,()=>{dlgNode="craft";renderDialog();}]);
    if(CUSTOM_SHOP.some(s=>s.by==="npc")) opts.push(["opt_buy_npc",null,openShopNpc]);''')

# editor UI
rep('''  const sh=mkEl("label","chk wide"), cb=mkEl("input"); cb.type="checkbox"; cb.checked=E.shop; cb.onchange=()=>{ E.shop=cb.checked; renderWin(); };
  sh.appendChild(cb); sh.appendChild(document.createTextNode(tr("it_shop"))); f.appendChild(sh);
  if(E.shop) field("it_price",num("price",999999));
  field("it_sell",num("sell",999999));
  body.appendChild(f);''','''  if(E.seller===undefined) E.seller=E.shop?"merchant":"";
  const sh=mkEl("label","chk wide"), cb=mkEl("input"); cb.type="checkbox"; cb.checked=!!E.seller; cb.onchange=()=>{ E.seller=cb.checked?(E.lastSeller||"merchant"):""; renderWin(); };
  sh.appendChild(cb); sh.appendChild(document.createTextNode(tr("it_shop"))); f.appendChild(sh);
  if(E.seller){ const ss=mkEl("select"); for(const v of ["merchant","npc"]){ const o=mkEl("option",null,tr("seller_"+v)); o.value=v; o.selected=E.seller===v; ss.appendChild(o); }
    ss.onchange=()=>{ E.seller=ss.value; E.lastSeller=ss.value; }; field("it_seller",ss); field("it_price",num("price",999999)); }
  else { const n=mkEl("p","adnote wide",tr("it_nobuy")); f.appendChild(n); }
  field("it_sell",num("sell",999999));
  const na=mkEl("p","adnote wide",tr("it_sell_auto")); f.appendChild(na);
  body.appendChild(f);''')
rep('''shop:true,price:50,sell:20,b:"",hue:0,img:"",isNew:true}''','''seller:"merchant",price:50,sell:0,b:"",hue:0,img:"",isNew:true}''')

# colour: grey pixels also get the chosen tint (иначе серый волк/меч не перекрашиваются)
rep('''    if(mx===mn) continue; const dd=mx-mn, sat=l>0.5?dd/(2-mx-mn):dd/(mx+mn); let h=mx===r?(gg-b)/dd+(gg<b?6:0):mx===gg?(b-r)/dd+2:(r-gg)/dd+4; h=(h/6+k)%1;''',
'''    const dd=mx-mn; let sat=mx===mn?0:(l>0.5?dd/(2-mx-mn):dd/(mx+mn)), h=mx===mn?0:(mx===r?(gg-b)/dd+(gg<b?6:0):mx===gg?(b-r)/dd+2:(r-gg)/dd+4)/6;
    if(sat<0.22){ if(l<0.06||l>0.97) continue; h=k; sat=Math.max(sat,0.42); } else h=(h+k)%1;''')
open(p,"w",encoding="utf-8").write(s); print("ok")
