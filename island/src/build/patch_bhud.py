import sys
p=sys.argv[1]; s=open(p,encoding="utf-8").read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a); assert n==cnt,(n,a[:90]); s=s.replace(a,b)

CSS = """
/* ---- нижняя панель (арт GPT): кнопки окон в рамках, дуга скилов вокруг кнопки атаки ---- */
body.bhud{--bh-r:max(8px,env(safe-area-inset-right,0px));--bh-l:max(8px,env(safe-area-inset-left,0px));--bh-b:calc(8px + env(safe-area-inset-bottom,0px));--atk:88px;--arc:170px}
body.bhud .ctrl{position:absolute;inset:0;transform:none;display:block;pointer-events:none;z-index:3}
body.bhud .ctrl>*{pointer-events:auto}
body.bhud .round{background:var(--hud-round) center/100% 100% no-repeat;border:0;border-radius:50%;box-shadow:none;color:#ffd66b;image-rendering:pixelated;filter:drop-shadow(0 2px 0 rgba(0,0,0,.35))}
body.bhud .round svg{filter:drop-shadow(1px 1px 0 #1b1528)}
body.bhud .round:active{transform:translateY(1px)}
body.bhud #rotL,body.bhud #rotR{position:absolute;top:50%;width:48px;height:48px;opacity:.78;margin-top:-24px}
body.bhud #rotL{left:var(--bh-l)} body.bhud #rotR{right:var(--bh-r)}
body.bhud #rotL:active,body.bhud #rotR:active{transform:translateY(1px);opacity:1}
body.bhud #chatBtn{position:absolute;left:var(--bh-l);bottom:calc(var(--bh-b) + 64px);width:50px;height:50px}
body.bhud .round .dot{background:var(--hud-badge) center/100% 100% no-repeat;border:0;border-radius:0;min-width:22px;height:22px;top:-6px;right:-6px;padding:0;font-size:11px;line-height:22px;text-shadow:1px 1px 0 #6a0d0d;image-rendering:pixelated}
body.bhud .hotbar{left:var(--bh-l);bottom:var(--bh-b);gap:4px}
body.bhud .hb{width:56px;height:56px;background:#2b2340 var(--hud-slot) center/100% 100% no-repeat;border:0;box-shadow:none;image-rendering:pixelated}
body.bhud .hb img{width:36px;height:36px}
body.bhud .hb[aria-pressed="true"]{background-color:#4a3a6a;box-shadow:0 0 10px rgba(255,214,107,.55)}
body.bhud .hb:active{transform:translateY(1px)}
.skarc,.atkb{display:none}
body.bhud .skarc{display:block;position:absolute;right:calc(var(--bh-r) + var(--atk)/2);bottom:calc(var(--bh-b) + var(--atk)/2);width:var(--arc);height:var(--arc);
  background:var(--hud-arc) center/100% 100% no-repeat;image-rendering:pixelated;pointer-events:none;z-index:2;opacity:.92}
body.bhud .atkb{display:block;position:absolute;right:var(--bh-r);bottom:var(--bh-b);width:var(--atk);height:var(--atk);padding:0;border:0;border-radius:50%;
  background:var(--hud-atk) center/100% 100% no-repeat;image-rendering:pixelated;cursor:pointer;z-index:3;filter:drop-shadow(0 3px 0 rgba(0,0,0,.35))}
body.bhud .atkb:active,body.bhud .atkb.press{background-image:var(--hud-atk-p);transform:translateY(1px)}
body.bhud .atkb:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
body.bhud .skills{display:block;flex-direction:initial;position:absolute;right:calc(var(--bh-r) + var(--atk)/2);bottom:calc(var(--bh-b) + var(--atk)/2);width:var(--arc);height:var(--arc);pointer-events:none;gap:0;z-index:3}
body.bhud .skb{position:absolute;width:48px;height:48px;pointer-events:auto;background:#2b2340;border:0;box-shadow:none;overflow:visible}
body.bhud .skb img{width:40px;height:40px;border-radius:50%}
body.bhud .skb::before{content:"";position:absolute;inset:-2px;background:var(--hud-ring) center/100% 100% no-repeat;image-rendering:pixelated;z-index:2;pointer-events:none}
body.bhud .skb::after{inset:4px;z-index:1}
body.bhud .skb .sklv{z-index:3;bottom:-3px;text-shadow:1px 1px 0 #000,-1px -1px 0 #000;font-size:10px}
body.bhud .skb.active::before{filter:drop-shadow(0 0 4px #7cf07a)}
body.bhud .toast{bottom:calc(var(--bh-b) + var(--atk)/2 + var(--arc) + 10px)}
body.bhud .actions,body.bhud .fishbar{bottom:calc(var(--bh-b) + var(--atk)/2 + var(--arc) + 6px)}
@media (max-width:720px){
  body.bhud .chatbar{bottom:calc(var(--bh-b) + var(--atk)/2 + var(--arc) + 8px)}
  body.bhud .upd.pask{bottom:calc(var(--bh-b) + var(--atk)/2 + var(--arc) + 8px)}
}
@media (max-height:500px) and (min-aspect-ratio:4/3){
  body.bhud{--atk:76px;--arc:150px}
  body.bhud .hb{width:48px;height:48px} body.bhud .hb img{width:30px;height:30px}
  body.bhud #chatBtn{bottom:calc(var(--bh-b) + 56px);width:44px;height:44px}
  body.bhud .skb{width:42px;height:42px} body.bhud .skb img{width:34px;height:34px}
  body.bhud .toast{bottom:calc(var(--bh-b) + 60px);left:50%;max-width:calc(100% - 420px)}
  body.bhud .actions,body.bhud .fishbar{bottom:calc(var(--bh-b) + 60px)}
}
</style>"""
rep("</style>", CSS)

# markup: arc + attack button next to the skills container
rep('''  <div class="skills" id="skills" hidden></div>''','''  <div class="skarc" id="skArc" aria-hidden="true"></div>
  <div class="skills" id="skills" hidden></div>
  <button class="atkb" id="atkBtn" type="button" data-i18n-label="atk_btn" aria-label="Atak"></button>''')

# i18n
rep('''    ad_items:"Przedmioty",''','''    atk_btn:"Atak (najbliższy wróg)", atk_none:"Nie ma wrogów w pobliżu",
    ad_items:"Przedmioty",''')
rep('''    ad_items:"Вещи",''','''    atk_btn:"Атака (ближайший враг)", atk_none:"Рядом нет врагов",
    ad_items:"Вещи",''')

# art init
rep('''  if(S.hud_btn_menu){''','''  if(S.hud_slot_frame&&S.hud_skill_ring&&S.hud_attack_btn&&S.hud_skill_arc&&S.hud_round_btn){
    const r=document.documentElement.style;
    for(const [k,v] of [["--hud-slot","hud_slot_frame"],["--hud-ring","hud_skill_ring"],["--hud-atk","hud_attack_btn"],["--hud-atk-p","hud_attack_btn_press"],["--hud-arc","hud_skill_arc"],["--hud-round","hud_round_btn"],["--hud-badge","hud_badge"]])
      if(S[v]) r.setProperty(k,`url(${S[v]})`);
    document.body.classList.add("bhud"); setTimeout(()=>{ try{ placeSkillArc(); }catch(e){} },0); }
  if(S.hud_btn_menu){''')

# skills along the arc
rep('''    b.onclick=()=>useSkill(sk.id); el.appendChild(b); });
  updateSkillBar(true);''','''    b.onclick=()=>useSkill(sk.id); el.appendChild(b); });
  placeSkillArc();
  updateSkillBar(true);''')
rep('''let skBarT=0;''','''// скилы — по дуге вокруг кнопки атаки (центр дуги = правый нижний угол контейнера)
function placeSkillArc(){
  const el=document.getElementById("skills"); if(!el) return;
  const bs=[...el.children];
  if(!document.body.classList.contains("bhud")){ for(const b of bs){ b.style.left=b.style.top=""; } return; }
  const A=el.clientWidth||170, sz=bs[0]?bs[0].offsetWidth||48:48, R=A*0.86, n=bs.length, a0=171, a1=99;
  bs.forEach((b,i)=>{ const t=n>1?a0+(a1-a0)*i/(n-1):135, rad=t*Math.PI/180;
    b.style.left=Math.round(A+R*Math.cos(rad)-sz/2)+"px"; b.style.top=Math.round(A-R*Math.sin(rad)-sz/2)+"px"; });
}
addEventListener("resize",()=>setTimeout(placeSkillArc,50));
// большая кнопка атаки: бьём ближайшего врага
function attackNearest(){
  if(fainting||EDIT||dialogOpen||placing) return;
  let best=null, bd=1e9;
  for(const a of animals){ if(!isMob(a)||a.dying>0||a.alpha<0.3) continue; const d=Math.hypot(a.x-hero.x,a.y-hero.y); if(d<bd){ bd=d; best=a; } }
  if(!best||bd>9){ say("atk_none"); return; }
  if(heroClass==="druid"&&!hasWeapon()){ if(bd<=6&&!(skillCd.thorn>0)){ useSkill("thorn"); return; } if(bd<=6) return; }
  attackWolf(best);
}
let skBarT=0;''')

# wire the button (keyboard: F)
rep('''  document.getElementById("editBtn").onclick=''','''  { const ab=document.getElementById("atkBtn"); ab.onclick=()=>{ attackNearest(); ab.classList.add("press"); setTimeout(()=>ab.classList.remove("press"),140); }; }
  document.getElementById("editBtn").onclick=''')

open(p,"w",encoding="utf-8").write(s); print("ok")
