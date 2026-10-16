(()=>{
  const K='pa_fakertdb', bc=new BroadcastChannel('pa_fakertdb'); const TS={'.sv':'timestamp'};
  const P='pa_frt:';
  const segs=p=>String(p).split('/').filter(Boolean); const norm=p=>segs(p).join('/');
  const fix=v=>{ if(v&&typeof v==='object'){ if(v['.sv']==='timestamp') return Date.now(); const o={}; for(const k in v){ const x=fix(v[k]); if(x!=null) o[k]=x; } return Object.keys(o).length?o:null; } return v; };
  const getAt=(_,p)=>{ p=norm(p); const ex=localStorage.getItem(P+p); if(ex!=null) return JSON.parse(ex);
    const pre=P+(p?p+'/':''); let o=null;
    for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(!k.startsWith(pre)) continue; const rest=segs(k.slice(pre.length)); o=o||{}; let c=o;
      for(const s2 of rest.slice(0,-1)){ c[s2]=c[s2]||{}; c=c[s2]; } c[rest[rest.length-1]]=JSON.parse(localStorage.getItem(k)); }
    return o; };
  const load=()=>null;
  const setAt=(p,v)=>{ p=norm(p); v=fix(v); const pre=P+p+'/'; const del=[];
    for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if((v==null&&k===P+p)||k.startsWith(pre)) del.push(k); }
    for(const k of del) localStorage.removeItem(k);
    // предки-листья тоже стираем
    const ss=segs(p); for(let i=1;i<ss.length;i++) localStorage.removeItem(P+ss.slice(0,i).join('/'));
    if(v!=null) localStorage.setItem(P+p,JSON.stringify(v));
    bc.postMessage(1); fireAll(); };
  const L=[]; const fireAll=()=>{ const t=load(); for(const l of L){ const v=l.path.startsWith('.info')?(l.path==='.info/connected'?true:0):getAt(t,l.path); const j=JSON.stringify(v); if(j!==l.last){ l.last=j; l.h(mk(l.path,v)); } } };
  bc.onmessage=()=>fireAll();
  const mk=(p,v)=>({key:segs(p).pop()||null,val:()=>v==null?null:JSON.parse(JSON.stringify(v)),exists:()=>v!=null,
    forEach(cb){ if(v&&typeof v==='object') for(const k of Object.keys(v).sort()) if(cb(mk(p+'/'+k,v[k]))===true) return true; return false; }});
  const disc=[]; addEventListener('pagehide',()=>{ for(const p of disc) setAt(p,null); });
  const ref=p=>({path:p,child:c=>ref(segs(p).concat(segs(c)).join('/')),
    on(ev,h){ const l={path:p,h,last:undefined}; L.push(l); setTimeout(()=>{ l.last=undefined; fireAll(); },5); return h; },
    off(ev,h){ const i=L.findIndex(l=>l.h===h&&l.path===p); if(i>=0) L.splice(i,1); },
    once(){ return Promise.resolve(mk(p,getAt(load(),p))); },
    set(v){ setAt(p,v); return Promise.resolve(); }, remove(){ setAt(p,null); return Promise.resolve(); },
    onDisconnect(){ return {remove(){ disc.push(p); return Promise.resolve(); }}; }});
  const app={database:()=>({ref})};
  const fb={apps:[],initializeApp(){ fb.apps.push(app); return app; },app:()=>app};
  fb.database={ServerValue:{TIMESTAMP:TS}};
  window.firebase=fb;
})();
