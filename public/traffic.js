// Trânsito ambiente em duas faixas. O retorno acontece fora da área visível.
import {vehicleMapScale} from './vehicle-art.js';
const lanes={city:[407,437],plaza:[554,586],downtown:[388,456],usa:[388,456]};
const colors=['#e9b860','#74accb','#e48080','#a4b8a6'];
export function trafficAt(map,time=0){
 if(!lanes[map])return [];
 const span=1200,speed=map==='usa'?92:map==='downtown'?76:60;
 return Array.from({length:4},(_,i)=>{
  const lane=i%2,right=lane===1,phase=((Math.max(0,time)/1000*speed+Math.floor(i/2)*600+lane*260)%span);
  const item={baseId:i===3?'motorcycle':'car',region:map==='usa'?'usa':'downtown',color:colors[i]};
  return {id:`traffic-${map}-${i}`,x:right?phase-120:1080-phase,y:lanes[map][lane],direction:right?'right':'left',scale:vehicleMapScale(item),item,time};
 });
}
// Cada mapa conserva a posição dos veículos enquanto esperam uma travessia.
export function createTrafficSimulation(){
 const maps=new Map();
 return {vehicles(map,time,pedestrians=[]){
  if(!lanes[map])return [];
  if(!maps.has(map))maps.set(map,{time,cars:trafficAt(map,0)});
  const simulation=maps.get(map),dt=Math.min(.1,Math.max(0,(time-simulation.time)/1000));
  simulation.time=time;
  const previous=simulation.cars.map(car=>({...car}));
  simulation.cars=previous.map(car=>{
   const sign=car.direction==='right'?1:-1,half=car.item.baseId==='car'?54*car.scale:48*car.scale;
   let distance=(map==='usa'?92:map==='downtown'?76:60)*dt;
   for(const person of pedestrians){
    // Detecta a pessoa em qualquer ponto da pista, sem depender de faixa.
    if(Math.abs(person.y-car.y)>32)continue;
    const ahead=(person.x-car.x)*sign;
    const personHalf=person.vehicle?65:12;
    if(ahead>=-half-personHalf)distance=Math.min(distance,Math.max(0,ahead-half-personHalf-20));
   }
   for(const other of previous){
    if(other.id===car.id||other.direction!==car.direction)continue;
    const ahead=(other.x-car.x)*sign;
    const otherHalf=other.item.baseId==='car'?54*other.scale:48*other.scale;
    if(ahead>0)distance=Math.min(distance,Math.max(0,ahead-half-otherHalf-22));
   }
   let x=car.x+distance*sign;
   if(x>1080)x=-120;else if(x< -120)x=1080;
   return {...car,x,time,moving:distance>0};
  });
  return simulation.cars.map(car=>({...car}));
 }};
}
