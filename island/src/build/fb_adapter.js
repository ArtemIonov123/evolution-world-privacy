// Firebase-адаптер: даёт игре те же claude.use("room"|"db"|"user"), что и claude.ai, но на Realtime Database.
// Мир выбирается ключом в ссылке: #world=XXXXXXXXXXXXXXXX (16+ символов). Без ключа создаётся новый личный мир.
(()=>{
  const CFG={apiKey:"AIzaSyDT8NnzhpAqMCHFaiX4FRKbrIOFUdXZOVQ",authDomain:"island-6cbab.firebaseapp.com",
    databaseURL:"https://island-6cbab-default-rtdb.europe-west1.firebasedatabase.app",projectId:"island-6cbab",
    storageBucket:"island-6cbab.firebasestorage.app",messagingSenderId:"626949382687",appId:"1:626949382687:web:09622d7d5ea2a5735beb2a"};
  const ls={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
  const rnd=n=>{const a="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";let s="";const b=new Uint8Array(n);crypto.getRandomValues(b);for(const x of b)s+=a[x%a.length];return s;};
  const okKey=k=>typeof k==="string"&&/^[A-Za-z0-9_-]{16,40}$/.test(k);
  // ключ мира: из ссылки → из прошлого раза → новый
  let world=(/[#&]world=([A-Za-z0-9_-]+)/.exec(location.hash)||[])[1];
  if(!okKey(world)) world=ls.get("island_world");
  if(!okKey(world)) world=rnd(20);
  ls.set("island_world",world);
  if(!location.hash.includes("world="+world)) try{history.replaceState(null,"",location.pathname+location.search+"#world="+world);}catch(e){}
  window.__islandWorld=world;
  let uid=ls.get("island_uid"); if(!/^u[A-Za-z0-9]{10,20}$/.test(uid||"")){ uid="u"+rnd(14); ls.set("island_uid",uid); }
  // Telegram Mini App: игрок = аккаунт Telegram (тот же прогресс на любом телефоне)
  const TG=window.Telegram&&window.Telegram.WebApp, tgUser=TG&&TG.initDataUnsafe&&TG.initDataUnsafe.user;
  window.__islandTG=null;
  if(tgUser&&/^\d{3,15}$/.test(String(tgUser.id))){
    const tid="utg"+tgUser.id; if(uid!==tid){ window.__islandOldUid=uid; } uid=tid;
    window.__islandTG={sp:String((TG.initDataUnsafe&&TG.initDataUnsafe.start_param)||""),id:String(tgUser.id),first:String(tgUser.first_name||""),last:String(tgUser.last_name||""),user:String(tgUser.username||""),lang:String(tgUser.language_code||"")};
    try{ TG.ready(); TG.expand(); if(TG.disableVerticalSwipes) TG.disableVerticalSwipes(); if(TG.setHeaderColor) TG.setHeaderColor("#2b2340"); if(TG.setBackgroundColor) TG.setBackgroundColor("#2b2340"); }catch(e){}
  }
  const peer="p"+rnd(10);

  let fb=null; const getFb=()=>{ if(fb) return fb; if(!window.firebase) return null;
    const app=firebase.apps.length?firebase.app():firebase.initializeApp(CFG); fb=app.database(); return fb; };
  const base=()=>getFb().ref("w/"+world);
  const enc=d=>({j:JSON.stringify(d===undefined?null:d)});
  const dec=v=>{ if(!v||typeof v.j!=="string") return null; try{return JSON.parse(v.j);}catch(e){return null;} };
  const clean=p=>String(p).split("/").filter(Boolean).map(s=>s.replace(/[.#$\[\]]/g,"_")).join("/");

  // ---------- db ----------
  const mkSnap=(id,data)=>({id,exists:data!=null,data:()=>data==null?undefined:JSON.parse(JSON.stringify(data)),metadata:{fromCache:false,hasPendingWrites:false}});
  const docRef=path=>{ path=clean(path); const id=path.split("/").pop(); const r=()=>base().child("db/"+path);
    return {id,path,
      get:()=>r().once("value").then(s=>mkSnap(id,dec(s.val()))),
      set:d=>r().set(enc(d)),
      update:d=>r().once("value").then(s=>r().set(enc({...(dec(s.val())||{}),...d}))),
      delete:()=>r().remove(),
      onSnapshot(next,err){ const ref=r(); const h=s=>next(mkSnap(id,dec(s.val()))); ref.on("value",h,e=>err&&err(e)); return ()=>ref.off("value",h); }};
  };
  const colRef=path=>{ path=clean(path);
    return {path,doc:id=>docRef(path+"/"+id),
      onSnapshot(next,err){ const ref=base().child("db/"+path);
        const h=s=>{ const docs=[]; s.forEach(c=>{ const d=dec(c.val()); if(d!=null) docs.push(mkSnap(c.key,d)); });
          next({docs,size:docs.length,empty:!docs.length,docChanges:()=>[],metadata:{fromCache:false,hasPendingWrites:false}}); };
        ref.on("value",h,e=>err&&err(e)); return ()=>ref.off("value",h); }};
  };
  const db={doc:docRef,collection:colRef};

  // ---------- room (кто сейчас в игре) ----------
  let mine={}, lastPush=0, pushTimer=null, offset=0, connected=false; const peerHs=[], connHs=[]; let all={};
  const STALE=25000;
  const snapPeers=()=>{ const now=Date.now()+offset, list=[{peer,by:uid,isMe:true,sameTab:true,kind:"viewer",guest:false,presence:mine,updatedAt:now}];
    for(const [p,v] of Object.entries(all)){ if(p===peer||!v) continue; if(typeof v.t==="number"&&now-v.t>STALE) continue;
      list.push({peer:p,by:typeof v.by==="string"?v.by:"",isMe:v.by===uid,sameTab:false,kind:"viewer",guest:false,presence:dec(v)||{},updatedAt:v.t||now}); }
    return Object.freeze(list); };
  const notify=()=>{ const ps=snapPeers(); for(const h of peerHs) try{h({peers:ps,joined:[],left:[],updated:[]});}catch(e){console.error(e);} };
  const myRef=()=>base().child("room/"+peer);
  const push=()=>{ pushTimer=null; lastPush=Date.now(); if(!getFb()) return; myRef().set({by:uid,j:JSON.stringify(mine),t:firebase.database.ServerValue.TIMESTAMP}).catch(()=>{}); };
  const schedule=()=>{ if(pushTimer) return; const wait=Math.max(0,90-(Date.now()-lastPush)); pushTimer=setTimeout(push,wait); };
  let roomStarted=false;
  const startRoom=()=>{ if(roomStarted||!getFb()) return; roomStarted=true;
    getFb().ref(".info/serverTimeOffset").on("value",s=>{offset=+s.val()||0;});
    getFb().ref(".info/connected").on("value",s=>{ connected=!!s.val(); for(const h of connHs) try{h(connected);}catch(e){}
      if(connected){ myRef().onDisconnect().remove(); push(); } });
    base().child("room").on("value",s=>{ all=s.val()||{}; notify(); },e=>{ for(const h of peerHs) if(h.err) h.err(e); });
    setInterval(()=>{ push(); notify(); },8000);                       // «я ещё здесь» + убираем пропавших
    addEventListener("pagehide",()=>{ try{myRef().remove();}catch(e){} });
  };
  const room={
    presence(patch){ mine={...mine}; for(const [k,v] of Object.entries(patch||{})){ if(v===null) delete mine[k]; else mine[k]=v; } schedule(); notify(); return Promise.resolve(); },
    onPeers(h,err){ h.err=err; peerHs.push(h); startRoom(); setTimeout(notify,0); return ()=>{ const i=peerHs.indexOf(h); if(i>=0) peerHs.splice(i,1); }; },
    peers:snapPeers, connected:()=>connected,
    onConnection(h){ connHs.push(h); setTimeout(()=>h(connected),0); return ()=>{ const i=connHs.indexOf(h); if(i>=0) connHs.splice(i,1); }; },
    emit:()=>Promise.resolve(), on:()=>()=>{}
  };

  // ---------- user ----------
  const user={id:()=>Promise.resolve(uid),
    profiles:ids=>Promise.resolve(Object.fromEntries([].concat(ids).map(i=>[i,{id:i,name:"",avatarUrl:"",color:"#888",email:null,isMe:i===uid,guest:false}]))),
    me:()=>Promise.resolve({id:uid,name:"",avatarUrl:"",color:"#888",email:null,isOwner:false,canEdit:true}),
    isOwner:()=>Promise.resolve(false),canEdit:()=>Promise.resolve(true),can:()=>Promise.resolve(true)};

  window.claude={use:n=>Promise.resolve(getFb()?(n==="room"?room:n==="db"?db:n==="user"?user:null):null)};
})();
