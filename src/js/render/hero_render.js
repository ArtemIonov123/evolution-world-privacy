// ---- Герой: спрайты hero_<se|sw|ne|nw>_<0..3>, если есть; иначе временный пиксельный человечек ----
function drawHero(){
  if(hero.hurtT>0&&Math.floor(hero.hurtT*14)%2) return;
  const [fx,fy]=proj(hero.x-MX,hero.y-MY,hero.z);
  if(shieldT>0) drawShieldFx(fx,fy);
  if(form){ drawForm(fx,fy,form,hero.facing,hero.moving,hero.phase,!!hero.atk); return; }
  if(heroClass==="druid") afterHeroFx=()=>drawDruidMark(fx,fy,hero.facing);
  ctx.save(); ctx.imageSmoothingEnabled=false;
  ctx.fillStyle="rgba(20,10,40,.28)"; ctx.beginPath(); ctx.ellipse(fx,fy,9,4.5,0,0,Math.PI*2); ctx.fill();
  // цикл шага 1-2-3-2, кадр 0 — стойка
  const frame=hero.moving?[1,2,3,2][Math.floor(hero.phase/Math.PI*2)%4]:0;
  // спрайты смотрят вправо (se/ne); влево — зеркально, если нет своих sw/nw
  const pre=heroClass==="druid"&&img.druid_se_0?"druid":"hero";
  let hn=`${pre}_${hero.facing}_${frame}`, mirror=false;
  if(!img[hn]&&hero.facing[1]==="w"){ hn=`${pre}_${hero.facing[0]}e_${frame}`; mirror=true; }
  if(pre==="druid"&&(hero.atk||hero.castT>0)){ const sp=druidAtk(hero.facing,myHueIdx), lk=hero.atk?Math.sin(Math.min(1,hero.atk.t/ATK_TIME)*Math.PI)*3:2, dir=hero.facing[1]==="e"?1:-1;
    if(sp){ ctx.translate(Math.round(fx)+dir*Math.round(lk),Math.round(fy)); if(hero.facing[1]==="w") ctx.scale(-1,1); ctx.drawImage(sp,-Math.round(sp.width/2),-sp.height+2); ctx.restore(); return; } }
  if(hero.atk){ const as=atkSprite(hero.facing,hero.atk.t,myHueIdx), [lx,ly]=atkLunge(hero.facing,hero.atk.t);
    if(as&&as.sp){ ctx.save(); ctx.translate(Math.round(fx)+lx,Math.round(fy)+ly); if(as.mirror) ctx.scale(-1,1); ctx.drawImage(as.sp,-Math.round(as.sp.width/2),-as.sp.height+2); ctx.restore();
      drawSlash(fx,fy,hero.facing,hero.atk.t); ctx.restore(); return; } }
  const sp=heroSprite(hn,myHueIdx);
  if(sp){ ctx.translate(Math.round(fx),Math.round(fy)); if(mirror) ctx.scale(-1,1);
    ctx.drawImage(sp,-Math.round(sp.width/2),-sp.height+2); ctx.restore();
    if(hero.atk){ ctx.save(); drawClubSwing(fx,fy,hero.facing[1]==="e"?1:-1,hero.atk.t); ctx.restore(); }
    return; }
  const front=hero.facing[0]==="s", flip=hero.facing[1]==="w"?-1:1;
  const sw=hero.moving?Math.round(Math.sin(hero.phase)*2):0, bob=hero.moving&&Math.abs(Math.sin(hero.phase))>0.7?1:0;
  ctx.translate(Math.round(fx),Math.round(fy)-bob); ctx.scale(flip,1);
  const R=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h)};
  // контур
  const O="#1b1528";
  R(-6,-30,12,11,O); R(-7,-20,14,13,O); R(-9,-19,3,10,O); R(6,-19,3,10,O);
  R(-5,-10,5,10,O); R(0,-10,5,10,O);
  // ноги
  const lL=Math.max(0,sw), lR=Math.max(0,-sw);
  R(-4,-9,3,9-lL,"#3b3550"); R(-4,-2-lL,3,2,"#2a1f14");
  R(1,-9,3,9-lR,"#3b3550");  R(1,-2-lR,3,2,"#2a1f14");
  // руки
  R(-8,-18+sw,2,8,front?"#f1c27d":"#2f5fc4"); R(6,-18-sw,2,8,"#f1c27d");
  // туника и пояс
  R(-6,-19,12,11,"#3a6fd8"); R(-6,-19,12,2,"#5a8ff0"); R(-6,-11,12,2,"#6b4423"); R(-1,-11,2,2,"#ffd66b");
  // голова
  R(-5,-29,10,10,"#f1c27d");
  if(front){ R(-5,-30,10,3,"#6a3f1c"); R(-5,-27,2,3,"#6a3f1c"); R(0,-25,1,2,"#1b1528"); R(3,-25,1,2,"#1b1528"); R(1,-21,2,1,"#c98a5a"); }
  else { R(-5,-30,10,8,"#6a3f1c"); R(-5,-22,10,1,"#57321a"); }
  ctx.restore();
}

function cellQuad(c){
  const Z=walkZ(c), X=c.x-MX, Y=c.y-MY;
  return [proj(X-.5,Y-.5,Z),proj(X+.5,Y-.5,Z),proj(X+.5,Y+.5,Z),proj(X-.5,Y+.5,Z)];
}
function quadPath(pts){ctx.beginPath();ctx.moveTo(...pts[0]);for(let i=1;i<4;i++)ctx.lineTo(...pts[i]);ctx.closePath()}
function drawOverlay(now){
  worldTransform();
  if(showGrid){ctx.strokeStyle="rgba(255,255,255,.3)";ctx.lineWidth=1;for(const c of cells){quadPath(cellQuad(c));ctx.stroke()}}
  if(hover&&!anim){quadPath(cellQuad(hover));ctx.fillStyle="rgba(255,255,255,.16)";ctx.fill();ctx.strokeStyle="rgba(255,255,255,.85)";ctx.lineWidth=1;ctx.stroke()}
  if(marker){ // кольцо в точке назначения, лежит на земле
    const c=cellAt(marker.x,marker.y); if(c){
      const Z=walkZ(c), X=c.x-MX, Y=c.y-MY, t=marker.t;
      const col=marker.ok?"255,214,107":"255,90,90";
      for(const k of [0,1]){
        const ph=((t*1.2+k*0.5)%1), r=0.15+ph*0.35, a=(1-ph)*0.9;
        ctx.beginPath();
        for(let i=0;i<=24;i++){const an=i/24*Math.PI*2, p=proj(X+Math.cos(an)*r,Y+Math.sin(an)*r,Z); i?ctx.lineTo(...p):ctx.moveTo(...p);}
        ctx.strokeStyle=`rgba(${col},${a})`; ctx.lineWidth=1; ctx.stroke();
      }
      ctx.beginPath();
      for(let i=0;i<=16;i++){const an=i/16*Math.PI*2, p=proj(X+Math.cos(an)*.1,Y+Math.sin(an)*.1,Z); i?ctx.lineTo(...p):ctx.moveTo(...p);}
      ctx.fillStyle=`rgba(${col},.9)`; ctx.fill();
      if(!marker.ok&&t>1.2) marker=null;
    }
  }
}

function render(now){
  const anchor=drawOrder(), d=dprNow(), r=cv.getBoundingClientRect();
  assignEnts();
  const sky=SKY;
  // буфер в RS раз плотнее игровых пикселей: старые картинки увеличиваются чётко, HD (@2x) — рисуются во всю детальность
  RS=RENDER_SCALE; const bw=(Math.ceil(r.width/scale)+3)*RS, bh=(Math.ceil(r.height/scale)+3)*RS;
  if(buf.width!==bw||buf.height!==bh){buf.width=bw;buf.height=bh}
  // целая часть сдвига камеры — внутри буфера, дробная — при выводе на экран
  const offX=Math.floor(panX/scale)+1, offY=Math.floor(panY/scale)+1;
  ROX=offX*RS; ROY=offY*RS;
  ctx=bufCtx; ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1;
  ctx.fillStyle=sky; ctx.fillRect(0,0,bw,bh);
  if(!anim){ drawSprites(anchor); }
  else {
    draw3D(anchor);
    const frac=Math.abs(rot-Math.round(rot)), t=Math.min(1,frac/0.14), alpha=1-t*t*(3-2*t);
    if(alpha>0.01){ // плавное проявление спрайтов у начала и конца поворота
      if(spriteLayer.width!==bw||spriteLayer.height!==bh){spriteLayer.width=bw;spriteLayer.height=bh}
      spriteCtx.setTransform(1,0,0,1,0,0); spriteCtx.clearRect(0,0,bw,bh);
      ctx=spriteCtx; drawSprites(anchor); ctx=bufCtx;
      ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=alpha; ctx.drawImage(spriteLayer,0,0); ctx.globalAlpha=1;
    }
  }
  drawWindFx();
  drawFishing();
  drawChopFx();
  applyLighting();      // закат, ночь и огни
  drawNightFx();
  if(afterHeroFx){ worldTransform(); afterHeroFx(); afterHeroFx=null; }
  drawProjectiles(); drawStatusFx(); drawHitFx();
  edDrawMarks();
  drawOverlay(now);
  updateTags();
  // вывод на экран
  const m=mainCtx; ctx=m;
  m.setTransform(1,0,0,1,0,0); m.imageSmoothingEnabled=false;
  m.fillStyle=sky; m.fillRect(0,0,cv.width,cv.height);
  const rx=panX-offX*scale, ry=panY-offY*scale;
  m.drawImage(buf, Math.round(rx*d), Math.round(ry*d), Math.round(bw/RS*scale*d), Math.round(bh/RS*scale*d));
}

