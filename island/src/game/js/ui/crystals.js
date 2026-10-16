// ---- кристаллы: обмен на золото и покупка за звёзды Telegram ----
// Цены пакетов здесь только для показа — настоящую цену счёта ставит сервер (security/worker/src/index.js, PACKS).
const CR_PACKS=[{id:"p1",cr:50,st:25},{id:"p2",cr:120,st:50},{id:"p3",cr:260,st:100},{id:"p4",cr:700,st:250},{id:"p5",cr:1500,st:500},{id:"p6",cr:3500,st:1000}];
// обмен: только эти варианты (сервер тоже принимает только их)
const CR_EX=[{cr:2,g:100},{cr:3,g:250},{cr:5,g:600}];
let crAsk=null, crMsg=null, crBusy=false;
const crServer=()=>String(window.__islandAuthUrl||"").replace(/\/$/,"");
const crIcon=()=>{ try{ if(SPRITES.icon_crystal) return SPRITES.icon_crystal; }catch(e){}
  return "data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges"><path d="M8 0l6 5-6 11-6-11z" fill="#1b1528"/><path d="M8 1.5l4.6 3.8L8 13.8 3.4 5.3z" fill="#7a6cff"/><path d="M8 1.5l4.6 3.8H3.4z" fill="#b8a8ff"/><path d="M6 3h2v2H6z" fill="#fff"/></svg>'); };
const crImg=(src,cls)=>{ const i=mkEl("img",cls); i.src=src; i.alt=""; return i; };
async function crPost(path,body){
  const r=await fetch(crServer()+path,{method:"POST",body:JSON.stringify({init:(window.Telegram&&Telegram.WebApp&&Telegram.WebApp.initData)||"",lang:LANG,...body})});
  let j={}; try{ j=await r.json(); }catch(e){} return {st:r.status,j};
}
function renderCrystals(body){
  // баланс
  const top=mkEl("div","crtop");
  const a=mkEl("span","crbal"); a.appendChild(crImg(crIcon())); a.appendChild(mkEl("b",null,shortNum(crystals))); top.appendChild(a);
  const g=mkEl("span","crbal gold"); g.appendChild(crImg(iconURL("coin"))); g.appendChild(mkEl("b",null,shortNum(inv.coin||0))); top.appendChild(g);
  body.appendChild(top);
  // обмен: кнопки на выбор → подтверждение
  const ex=mkEl("div","crbox"); ex.appendChild(mkEl("b","crh",tr("cr_ex_title")));
  if(crAsk){ const o=crAsk, cf=mkEl("div","crconf");
    const ln=mkEl("p","crres"); ln.appendChild(document.createTextNode(tr("cr_ex_ask")+" ")); ln.appendChild(mkEl("b","crv",String(o.cr))); ln.appendChild(crImg(crIcon()));
    ln.appendChild(document.createTextNode(" \u2192 ")); ln.appendChild(mkEl("b",null,o.g.toLocaleString("ru-RU"))); ln.appendChild(crImg(iconURL("coin"))); ln.appendChild(document.createTextNode("?")); cf.appendChild(ln);
    const bt=mkEl("div","crconfb");
    const y=mkEl("button","btn bagbtn big",tr(crBusy?"cr_wait":"cr_yes")); y.type="button"; y.disabled=crBusy; y.onclick=()=>crExchange(o); bt.appendChild(y);
    const n=mkEl("button","btn bagbtn",tr("cr_no")); n.type="button"; n.disabled=crBusy; n.onclick=()=>{ crAsk=null; renderWin(); }; bt.appendChild(n);
    cf.appendChild(bt); ex.appendChild(cf);
  } else { const g=mkEl("div","crexs");
    for(const o of CR_EX){ const b=mkEl("button","btn crex"); b.type="button"; b.disabled=crystals<o.cr;
      const t=mkEl("span","crexl"); t.appendChild(mkEl("b","crv",String(o.cr))); t.appendChild(crImg(crIcon())); b.appendChild(t);
      b.appendChild(mkEl("span","crarr","\u25BC"));
      const r=mkEl("span","crexl"); r.appendChild(mkEl("b",null,o.g.toLocaleString("ru-RU"))); r.appendChild(crImg(iconURL("coin"))); b.appendChild(r);
      b.onclick=()=>{ crAsk=o; crMsg=null; renderWin(); }; g.appendChild(b); }
    ex.appendChild(g); }
  if(crMsg&&crMsg[1]==="ex") ex.appendChild(mkEl("p","crmsg "+crMsg[2],tr(crMsg[0],crMsg[3])));
  body.appendChild(ex);
  // покупка
  const by=mkEl("div","crbox"); by.appendChild(mkEl("b","crh",tr("cr_buy_title")));
  const grid=mkEl("div","crpacks"), base=CR_PACKS[0].cr/CR_PACKS[0].st;
  for(const p of CR_PACKS){ const c=mkEl("button","btn crpack"); c.type="button"; c.disabled=crBusy;
    const bonus=Math.round((p.cr/p.st/base-1)*100); if(bonus>0) c.appendChild(mkEl("span","crbonus","+"+bonus+"%"));
    c.appendChild(crImg(crIcon(),"crpic")); c.appendChild(mkEl("b","crn",p.cr.toLocaleString("ru-RU")));
    c.appendChild(mkEl("span","crst","⭐ "+p.st)); c.onclick=()=>crBuy(p); grid.appendChild(c); }
  by.appendChild(grid);
  if(crMsg&&crMsg[1]==="buy") by.appendChild(mkEl("p","crmsg "+crMsg[2],tr(crMsg[0],crMsg[3])));
  by.appendChild(mkEl("p","adnote",tr("cr_buy_note")));
  body.appendChild(by);
}
async function crExchange(o){
  if(crBusy||!o||!CR_EX.includes(o)) return;
  const n=o.cr, gold=o.g;
  if(n>crystals){ crAsk=null; crMsg=["cr_ex_no","ex","bad"]; renderWin(); return; }
  if(secureOn()&&crServer()){   // защищённый режим: кристаллы списывает только сервер
    crBusy=true; renderWin();
    try{ const r=await crPost("/exchange",{n}); crBusy=false;
      if(r.st===200&&r.j.ok){ crystals=r.j.cr; inv.coin=Math.min(INV_MAX_COIN,(inv.coin||0)+gold); crMsg=["cr_ex_ok","ex","ok",{n,g:gold}]; }
      else crMsg=[r.st===409?"cr_ex_no":"cr_err","ex","bad"]; }
    catch(e){ crBusy=false; crMsg=["cr_err","ex","bad"]; }
  } else {
    crystals-=n; inv.coin=Math.min(INV_MAX_COIN,(inv.coin||0)+gold);
    if(NET.db&&NET.myId) NET.db.doc("wallet/"+NET.myId).set({cr:crystals}).catch(()=>{});
    crMsg=["cr_ex_ok","ex","ok",{n,g:gold}];
  }
  crAsk=null; savedCr=crystals; renderInv(); saveNow(); if(winKind==="crystals") renderWin();
}
async function crBuy(p){
  if(crBusy) return;
  const W=window.Telegram&&Telegram.WebApp;
  if(!W||!W.initData||typeof W.openInvoice!=="function"){ crMsg=["cr_need_tg","buy","bad"]; renderWin(); return; }
  if(!crServer()||!secureOn()){ crMsg=["cr_need_server","buy","bad"]; renderWin(); return; }
  crBusy=true; crMsg=null; renderWin();
  try{ const r=await crPost("/invoice",{pack:p.id});
    if(r.st!==200||!r.j.link){ crBusy=false; crMsg=["cr_err","buy","bad"]; renderWin(); return; }
    const before=crystals;
    W.openInvoice(r.j.link,st=>{ crBusy=false;
      crMsg=st==="paid"?["cr_paid","buy","ok",{n:p.cr}]:st==="cancelled"?["cr_cancel","buy",""]:st==="pending"?["cr_pending","buy",""]:["cr_err","buy","bad"];
      if(st==="paid"&&crystals===before) say("cr_paid",null,{n:p.cr});
      if(winKind==="crystals") renderWin(); });
  }catch(e){ crBusy=false; crMsg=["cr_err","buy","bad"]; renderWin(); }
}
