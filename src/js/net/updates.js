// ---- обновления (веб-версия): сравниваем свою сборку с version.json на сервере ----
let updBuild=null;
function initUpdates(){
  const mine=window.__islandBuild; if(!mine||!window.fetch) return;
  const check=async()=>{ if(updBuild) return;
    try{ const r=await fetch("version.json?t="+Date.now(),{cache:"no-store"}); if(!r.ok) return; const j=await r.json();
      if(j&&typeof j.build==="string"&&j.build!==mine){ updBuild=j.build; document.getElementById("upd").hidden=false; } }catch(e){} };
  document.getElementById("updBtn").onclick=()=>{
    try{ lastSaveJSON=""; lastPlayerJSON=""; lastPlayerWrite=0; tickSave(99); tickPlayerDoc(); }catch(e){}
    const go=()=>location.replace(location.pathname+"?v="+encodeURIComponent(updBuild||Date.now())+location.hash);
    setTimeout(go,500); };
  if(window.__islandTG) (async()=>{ try{ const r=await fetch("version.json?t="+Date.now(),{cache:"no-store"}); const j=await r.json();
      if(j&&j.build&&j.build!==mine&&sessionStorage.getItem("pa_autoupd")!==j.build){ sessionStorage.setItem("pa_autoupd",j.build); location.replace(location.pathname+"?v="+encodeURIComponent(j.build)+location.hash); } }catch(e){} })();
  setTimeout(check,8000); setInterval(check,60000);
  document.addEventListener("visibilitychange",()=>{ if(!document.hidden) check(); });
  addEventListener("online",check);
}
function setNick(v,force){
  const n=cleanNick(v); if(n.length<2) return false; if(!force&&badNick(n)) return false;
  myNick=n; try{ localStorage.setItem("pa_nick",n); }catch(e){}
  lastPresJSON=""; lastPlayerJSON=""; lastSaveJSON=""; renderPlayers();
  return true;
}
function openNick(){
  const w=document.getElementById("nickWrap"), inp=document.getElementById("nickIn");
  inp.value=myNick; document.getElementById("nickErr").hidden=true; w.hidden=false;
  setTimeout(()=>inp.focus(),0);
}
// ник другого игрока — только как текст, обрезанный и без невидимых символов
const nickOf=v=>typeof v==="string"?(badNick(v)?"***":cleanNick(v)):"";

