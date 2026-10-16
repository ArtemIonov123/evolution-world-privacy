function renderNickFilter(body){
  if(!isAdmin){ closeWin(); return; }
  adHead(body);
  body.appendChild(mkEl("p","adnote",tr("ad_nf_note")));
  const a=mkEl("textarea","adarea"); a.value=NICK_EXTRA.join(", "); body.appendChild(a);
  const bt=mkEl("div","plbtns");
  bt.appendChild(adBtn(tr("ad_nf_save"),()=>{ const w=a.value.split(/[,\n]/).map(x=>x.trim().toLowerCase()).filter(Boolean).slice(0,300); NICK_EXTRA=w;
    NET.db&&NET.db.doc("world/nickfilter").set({w}).catch(()=>{}); adMsg=tr("ad_saved").split(".")[0]+"."; renderWin(); },"big"));
  body.appendChild(bt);
  if(adMsg) body.appendChild(mkEl("div","adok",adMsg));
}
