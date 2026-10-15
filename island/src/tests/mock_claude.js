// Имитация платформы: room (BroadcastChannel), db (localStorage), user — для теста двух вкладок
(()=>{
  const peer='p'+Math.random().toString(36).slice(2,8)+(window.__peerSuffix||'');
  const uid='u_'+peer;
  const bc=new BroadcastChannel('mock-room'); const others=new Map(); let mine={}; const hs=[];
  const snap=()=>Object.freeze([{peer,by:uid,isMe:true,sameTab:true,kind:'viewer',guest:false,presence:mine,updatedAt:Date.now()},
    ...[...others.entries()].map(([p,v])=>({peer:p,by:'u_'+p,isMe:false,sameTab:false,kind:'viewer',guest:false,presence:v,updatedAt:Date.now()}))]);
  const notify=()=>{const ps=snap(); for(const h of hs) h({peers:ps,joined:[],left:[],updated:[]});};
  bc.onmessage=e=>{const m=e.data; if(m.t==='p'){others.set(m.peer,m.pres);notify();} if(m.t==='hello'){bc.postMessage({t:'p',peer,pres:mine});} if(m.t==='bye'){others.delete(m.peer);notify();}};
  addEventListener('beforeunload',()=>bc.postMessage({t:'bye',peer}));
  const room={presence(patch){mine={...mine};for(const[k,v] of Object.entries(patch)){if(v===null)delete mine[k];else mine[k]=v;} bc.postMessage({t:'p',peer,pres:mine}); notify(); return Promise.resolve();},
    onPeers(h,err){hs.push(h); setTimeout(()=>{bc.postMessage({t:'hello',peer}); notify();},0); return ()=>{};},
    peers:snap, connected:()=>true, onConnection(h){setTimeout(()=>h(true),0);return()=>{};}, emit:()=>Promise.resolve(), on:()=>()=>{}};
  // db
  const K='mockdb:'; const subs=[];
  const read=path=>{const v=localStorage.getItem(K+path); return v?JSON.parse(v):null;};
  const mkSnap=(path,data)=>({id:path.split('/').pop(),exists:!!data,data:()=>data?JSON.parse(JSON.stringify(data)):undefined,metadata:{fromCache:false,hasPendingWrites:false}});
  const fire=()=>{for(const s of subs) s();};
  addEventListener('storage',e=>{ if(e.key&&e.key.startsWith(K)) fire(); });
  const docRef=path=>({id:path.split('/').pop(),path,
    get:()=>Promise.resolve(mkSnap(path,read(path))),
    set:d=>{localStorage.setItem(K+path,JSON.stringify(d)); fire(); return Promise.resolve();},
    update:d=>{const o=read(path)||{}; localStorage.setItem(K+path,JSON.stringify({...o,...d})); fire(); return Promise.resolve();},
    delete:()=>{localStorage.removeItem(K+path); fire(); return Promise.resolve();},
    onSnapshot(next){const f=()=>next(mkSnap(path,read(path))); subs.push(f); setTimeout(f,0); return ()=>{};}});
  const colRef=path=>({path,doc:id=>docRef(path+'/'+id),
    onSnapshot(next){const f=()=>{const docs=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i); if(k.startsWith(K+path+'/')&&k.slice((K+path+'/').length).indexOf('/')<0) docs.push(mkSnap(k.slice(K.length),JSON.parse(localStorage.getItem(k))));}
      next({docs,size:docs.length,empty:!docs.length,docChanges:()=>[],metadata:{fromCache:false,hasPendingWrites:false}});}; subs.push(f); setTimeout(f,0); return ()=>{};}});
  const db={doc:docRef,collection:colRef};
  const user={id:()=>Promise.resolve(uid),profiles:ids=>Promise.resolve(Object.fromEntries([].concat(ids).map(i=>[i,{id:i,name:'Gracz '+i.slice(-4),avatarUrl:'',color:'#888',email:null,isMe:i===uid,guest:false}]))),
    me:()=>Promise.resolve({id:uid,name:'Ja',avatarUrl:'',color:'#888',email:null,isOwner:false,canEdit:false}),isOwner:()=>Promise.resolve(false),canEdit:()=>Promise.resolve(false),can:()=>Promise.resolve(true)};
  window.claude={use:n=>new Promise(r=>setTimeout(()=>r(n==='room'?room:n==='db'?db:n==='user'?user:null),50))};
  window.__mockPeer=peer;
})();
