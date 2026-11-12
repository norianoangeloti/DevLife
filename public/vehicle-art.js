// A mesma ilustração vetorial serve ao mapa e às miniaturas do inventário.
export const vehicleMapScale = item => item.baseId === 'car' ? 1 : 0.8;
const vehicleSprites=new Map();
export function drawVehicle(ctx,item,{x=0,y=0,scale=1,direction='right',moving=false,time=0,rider=null,lowPower=false}={}) {
 const premium=item.region==='usa',color=item.color||'#579fb9';
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
 if(direction==='left')ctx.scale(-1,1);else if(direction==='up')ctx.rotate(-Math.PI/2);else if(direction==='down')ctx.rotate(Math.PI/2);
 if(lowPower){
  const phase=moving?Math.floor((time/95%(Math.PI*2))/(Math.PI*2)*8):-1;
  const key=JSON.stringify([item.baseId,item.region,color,item.dark,item.light,rider,phase]);
  let sprite=vehicleSprites.get(key);
  if(!sprite){
   sprite=document.createElement('canvas');sprite.width=120;sprite.height=110;
   drawVehicle(sprite.getContext('2d'),item,{x:60,y:76,moving,time:phase<0?0:phase/8*Math.PI*2*95,rider});
   if(vehicleSprites.size>=96)vehicleSprites.delete(vehicleSprites.keys().next().value);
   vehicleSprites.set(key,sprite);
  }
  ctx.drawImage(sprite,-60,-76);ctx.restore();return;
 }
 const path=(points,fill,stroke)=>{ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}};
 const round=(x,y,w,h,r,fill,stroke)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}};
 const ellipse=(x,y,rx,ry,fill)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill()};
 const line=(x1,y1,x2,y2,color,width=1)=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke()};
 const grad=(x,y,h,colors)=>{const g=ctx.createLinearGradient(x,y,x,y+h);colors.forEach((c,i)=>g.addColorStop(i/(colors.length-1),c));return g};
 const wheel=(x,y,r,bike=false)=>{
  ellipse(x+1,y+2,r+1,r,'#08121c');ellipse(x,y,r,r,'#111e29');ellipse(x,y,r-2,r-2,'#32444f');ellipse(x,y,r-3.5,r-3.5,bike?'#182a35':'#a8b7bf');
  ctx.save();ctx.translate(x,y);ctx.rotate(moving?time/95:0);
  for(let i=0;i<(premium?7:5);i++){ctx.rotate(Math.PI*2/(premium?7:5));line(0,0,r-4,0,bike?'#b7cbd1':'#425561',bike?0.8:1.4)}ctx.restore();
  ellipse(x,y,2,2,premium?'#c4a77e':'#cfdde0');
 };
 ellipse(0,13,item.baseId==='car'?55:45,8,'#06142135');
 if(item.baseId==='car'){
  // Perfil de três quartos: carroceria, caixas de roda, cabine e face frontal.
  const roof=premium?-40:-44;
  round(-43,-4,15,16,4,'#0d1923');round(28,-4,15,16,4,'#0d1923');
  path([[-50,-18],[-43,-27],[-25,-29],[-14,roof],[11,roof],[28,-27],[47,-22],[53,-12],[50,5],[-46,5],[-52,-3]],grad(0,-44,52,['#e4f5f4',color,item.dark||'#31536b']), '#173243');
  path([[-50,-18],[-25,-23],[-15,-35],[12,-35],[28,-22],[47,-18],[52,-10],[-50,-8]],grad(0,-35,29,[item.light||'#c7edf0',color]),'#92c7cc');
  // Vidros com contorno, pilares e reflexos diagonais.
  path([[-23,-25],[-13,roof+5],[-2,roof+5],[-2,-25]],grad(0,-40,20,['#375f74','#a4dce4']),'#203e50');
  path([[2,-25],[2,roof+5],[10,roof+5],[23,-25]],grad(0,-40,20,['#203e54','#9ad1df']),'#203e50');
  line(-16,-29,-10,roof+9,'#d5f7f3',1.5);line(7,-29,11,-32,'#e4f9ee',1.5);
  line(-48,-9,48,-9,'#d3eeed',1);line(-46,0,47,0,item.dark||'#274b5f',2);
  line(-1,-24,-1,-2,'#3c697c',1);line(27,-21,29,-2,'#3c697c',1);
  round(7,-19,6,2,1,'#d6e8e8');round(-17,-19,6,2,1,'#d6e8e8');
  path([[28,-23],[45,-19],[49,-13],[29,-15]],'#ffffff1f');line(32,-20,45,-16,'#e4f9f0',1);
  round(46,-13,6,7,2,'#f7f1ca');round(-50,-15,4,6,1,'#ed7a79');
  round(45,-2,8,4,1,'#182f40');round(-48,3,97,3,1,'#1b3546');
  wheel(-31,5,11);wheel(33,5,11);
  // Recortes dos para-lamas e para-choque não escondem os pneus.
  ctx.beginPath();ctx.arc(-31,5,12,Math.PI,0);ctx.strokeStyle=item.light||'#b4e1e6';ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.arc(33,5,12,Math.PI,0);ctx.stroke();
  path([[22,-28],[26,-30],[31,-28],[30,-24],[24,-24]],color,'#173243');
  if(premium){path([[-44,-29],[-37,-31],[-34,-28],[-44,-26]],'#1d3447');line(-12,-4,23,-4,'#d5c59b',1.4);round(36,-7,8,2,1,'#d4b885');}
  else round(-45,-4,9,3,1,'#e2ebde');
 }else{
  // Moto com rodas raiadas, suspensão, transmissão, escapamento e carenagem.
  wheel(-34,8,14,true);wheel(35,8,14,true);
  line(-34,8,-15,-16,'#b8cbd1',3);line(-34,8,6,5,'#607c8c',3);line(-15,-16,6,5,color,5);line(-15,-16,14,-18,color,5);line(6,5,14,-18,'#587d8d',4);
  ellipse(-1,-1,12,11,grad(0,-12,24,['#788c95','#263c49']));ellipse(-1,-1,7,6,'#263d4a');line(-8,-5,5,-5,'#a9bec5',1.5);line(-8,0,5,0,'#a9bec5',1.5);
  line(23,-23,35,8,'#d2dfe0',4);line(28,-23,39,7,'#698692',2);
  path([[-16,-22],[-6,-32],[11,-31],[22,-23],[12,-14],[-9,-14]],grad(0,-32,19,[item.light||'#c1e5e5',color,item.dark||'#284d62']),'#224455');
  round(-28,-27,27,6,3,'#182b37');path([[-41,-23],[-29,-29],[-18,-27],[-19,-22]],color,'#1d3445');
  round(-32,15,37,6,3,grad(0,15,6,['#c2d1d5','#354b59']));round(-35,16,7,4,1,'#172a35');
  path([[18,-33],[30,-30],[37,-18],[29,-12],[20,-20]],premium?color:'#435f70','#1d3546');
  path([[19,-35],[25,-45],[30,-42],[31,-32]],'#a5d7df88','#8bb6c3');
  line(16,-29,13,-37,'#c6d9db',2);line(13,-37,28,-37,'#1a303f',3);line(28,-37,32,-45,'#587d8b',1.5);ellipse(33,-46,5,3,'#96bfc5');
  round(32,-25,5,5,1,'#fff2ce');round(-41,-25,4,4,1,'#ed8380');line(24,8,41,8,'#9bb5bd',1);
  if(premium){path([[3,-14],[20,-20],[24,-7],[11,0],[2,-4]],color,'#c6c7d0');line(7,-10,18,-13,'#edd5a7',2);}
  if(rider){
   line(-10,-24,1,-42,rider.shirt||'#527a95',12);line(-5,-31,14,-34,rider.shirt||'#527a95',5);line(14,-34,21,-36,rider.skin||'#dba47b',4);
   line(-12,-20,-2,-6,'#273d51',7);line(-2,-6,7,-4,'#172a38',4);
   ellipse(3,-51,9,10,'#182f41');path([[-3,-57],[5,-60],[11,-55],[11,-49],[0,-49]],color);round(6,-54,7,5,2,'#b2e5e8');line(-2,-57,4,-59,'#def2ec',1.5);
  }
 }
 ctx.restore();
}
