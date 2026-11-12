import {itemModel} from './shop-models.js';
export function heldLaptop(state){return (state.equipped||[]).map(itemModel).find(item=>item?.slot==='laptop'&&state.inventory?.includes(item.id))||null;}
export function chosenLaptop(state){
 const held=heldLaptop(state);if(held)return held;
 const owned=(state.inventory||[]).map(itemModel).filter(item=>item?.slot==='laptop');
 return owned.find(item=>item.id===state.preferredLaptop)||owned.find(item=>item.region==='usa')||owned[0]||null;
}
export function drawLaptop(ctx,item,{x=0,y=0,scale=1,view='screen',side=false}={}){
 const premium=item.region==='usa';ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
 if(side)ctx.scale(.55,1);
 const rect=(x,y,w,h,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()};
 ctx.fillStyle='#06182644';ctx.beginPath();ctx.ellipse(0,5,29,5,0,0,Math.PI*2);ctx.fill();
 if(view==='back'){
  rect(-28,1,56,9,2,premium?'#a9a5c5':'#6d8798');
  const cover=ctx.createLinearGradient(-23,-29,23,1);cover.addColorStop(0,premium?'#dadbe9':'#8da9b9');cover.addColorStop(.55,premium?'#8a8bb0':'#4b6b82');cover.addColorStop(1,premium?'#565879':'#29485d');
  rect(-23,-29,46,31,3,cover);rect(-20,-26,40,24,2,'#ffffff0d');
  ctx.fillStyle=premium?'#e4f5ff':'#e2edf1';ctx.font='bold 6px Segoe UI';ctx.textAlign='center';ctx.fillText(premium?'AURORA':'DEV',0,-13);
  rect(-8,-10,16,1,0,premium?'#b5e5f9':'#a2c5d8');
  rect(-20,1,10,2,1,'#263f53');rect(10,1,10,2,1,'#263f53');
  rect(-27,9,54,1,0,premium?'#a8ebf3':'#3f596c');
  ctx.restore();return;
 }
 rect(-23,-29,46,30,3,premium?'#b7b3d1':'#526f83');rect(-21,-27,42,26,2,'#0a1b2c');
 const gradient=ctx.createLinearGradient(-18,-25,18,-3);gradient.addColorStop(0,premium?'#7548a9':'#315f86');gradient.addColorStop(1,premium?'#35bcc7':'#60b4b4');rect(-19,-25,38,22,1,gradient);
 ctx.fillStyle='#e9f5f2';ctx.font='bold 6px Segoe UI';ctx.textAlign='center';ctx.fillText(premium?'AURORA':'DEV',0,-13);rect(-9,-10,18,1,0,'#ffffff66');
 ctx.fillStyle=premium?'#d6d2e5':'#8198a7';ctx.beginPath();ctx.moveTo(-23,0);ctx.lineTo(23,0);ctx.lineTo(29,9);ctx.lineTo(-29,9);ctx.closePath();ctx.fill();
 rect(-20,1,40,4,1,'#203544');for(let i=0;i<9;i++)rect(-18+i*4,2,2,1,0,premium?['#bda7ff','#77ece5','#faa5cc'][i%3]:'#bdcdd4');rect(-6,6,12,2,1,'#5f7b8e');rect(-29,9,58,2,1,premium?'#9189bd':'#486376');
 if(premium){rect(-27,10,54,1,0,'#a8ebf3');ctx.fillStyle='#c4d4fa';ctx.beginPath();ctx.arc(0,-28,0.6,0,Math.PI*2);ctx.fill();}
 ctx.restore();
}
