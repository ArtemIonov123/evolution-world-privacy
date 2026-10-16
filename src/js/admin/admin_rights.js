// ---- права админа ----
async function sha256(t){ const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join(""); }
async function initAdmin(){
  let code=(/[#&]admin=([^&]+)/.exec(location.hash)||[])[1];
  if(code){ code=decodeURIComponent(code); try{ sessionStorage.setItem("pa_admin",code); }catch(e){}
    try{ history.replaceState(null,"",location.pathname+location.search+location.hash.replace(/[&]?admin=[^&]*/,"")); }catch(e){} }
  // в Telegram: ссылка t.me/<бот>?startapp=<код админа>
  if(!code&&window.__islandTG&&/^[A-Za-z0-9_-]{6,64}$/.test(window.__islandTG.sp)) code=window.__islandTG.sp;
  if(!code){ try{ code=sessionStorage.getItem("pa_admin")||localStorage.getItem("pa_admin_"+(window.__islandWorld||"c")); }catch(e){} }
  let ok=false;
  // админ по аккаунту Telegram
  const ADMIN_TG=["1661222371"];
  if(window.__islandTG&&ADMIN_TG.includes(window.__islandTG.id)){ ok=true; code=null; }
  if(window.__islandLocal){ ok=true; code=null; }   // локальный файл разработки: админ — ты
  if(!ok&&code&&NET.db&&window.crypto&&crypto.subtle){
    const h=await sha256(code+"|wyspa");
    try{ const s=await NET.db.doc("world/admin").get();
      if(!s.exists){ await NET.db.doc("world/admin").set({h}); ok=true; } else ok=(s.data()||{}).h===h; }catch(e){}
    if(!ok){ say("admin_bad"); try{ localStorage.removeItem("pa_admin_"+(window.__islandWorld||"c")); }catch(e){} }
    else { try{ localStorage.setItem("pa_admin_"+(window.__islandWorld||"c"),code); }catch(e){} }   // запоминаем на этом устройстве
  } else if(!window.__islandWorld&&NET.user&&NET.user.isOwner){ try{ ok=!!(await NET.user.isOwner()); }catch(e){} }
  isAdmin=ok; const b=document.getElementById("editBtn"); if(b) b.hidden=!ok;
  if(ok){ let re=null, hub=null; try{ re=sessionStorage.getItem("pa_reedit"); sessionStorage.removeItem("pa_reedit"); hub=sessionStorage.getItem("pa_adhub"); sessionStorage.removeItem("pa_adhub"); }catch(e){}
    if(re) setTimeout(()=>{ if(!EDIT) edEnter(re==="1"?"map":re); ptAfterReedit(); },300); else if(hub) setTimeout(()=>openWin("admin"),300); }
}
