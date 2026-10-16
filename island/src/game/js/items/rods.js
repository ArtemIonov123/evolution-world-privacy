// ---- удочки: три вида, изнашиваются от каждой пойманной рыбы ----
const ROD_DEF={rod_wood:{dur:25,sp:100,rare:100},rod_bamboo:{dur:50,sp:75,rare:160},rod_steel:{dur:100,sp:55,rare:250}};
const RODS=Object.keys(ROD_DEF);
const rodCfg=(id,k)=>CFG.rods&&CFG.rods[id]&&CFG.rods[id][k]!=null?CFG.rods[id][k]:ROD_DEF[id][k];
let rodDur=0; const rodWear={};
const rodMax=id=>Math.max(1,rodCfg(id,"dur"));
const rodSpeed=()=>equip.rod?rodCfg(equip.rod,"sp")/100:1;
const rodRare=()=>equip.rod?rodCfg(equip.rod,"rare")/100:1;
function wearRod(){
  if(!equip.rod) return; rodDur--;
  if(rodDur<=0){ const id=equip.rod; equip.rod=null; rodDur=0; floats.push({key:"rod_broke_f",col:"#ff8a6a",t:-0.3}); say("rod_broke","rod_broke_sub",{r:"#fish_"+id});
    stopFishing(); const next=RODS.slice().reverse().find(k=>inv[k]); if(next){ equipItem(next); setTimeout(()=>say("rod_next","",{r:"#fish_"+next}),1400); } renderInv(); }
  else if(rodDur<=5) floats.push({key:"rod_wear",p:{n:rodDur},col:"#ffb070",t:-0.3});
  lastSaveJSON="";
}
function ensureStarterRod(){
  if(prog.ri) return; prog.ri=1;
  if(!equip.rod&&!RODS.some(k=>inv[k])) giveItem(rodLevel>=2?"rod_bamboo":"rod_wood");
}


