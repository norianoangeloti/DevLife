import test from 'node:test';
import assert from 'node:assert/strict';
import {trafficAt,createTrafficSimulation} from '../public/traffic.js';
import {onRoad} from '../public/navigation.js';
test('Trânsito se move nas duas faixas dos quatro mapas sem sair das pistas',()=>{
 for(const map of ['city','plaza','downtown','usa']){
  const before=trafficAt(map,0),after=trafficAt(map,1000);
  assert.equal(before.length,4);
  assert.ok(before.some(x=>x.direction==='right')&&before.some(x=>x.direction==='left'));
  for(let t=0;t<60000;t+=250)for(const vehicle of trafficAt(map,t)){
   assert.ok(onRoad({...vehicle,map}));
   assert.ok(vehicle.x>=-120&&vehicle.x<=1080);
  }
  before.forEach((car,i)=>assert.ok(car.direction==='right'?after[i].x>car.x:after[i].x<car.x));
 }
 assert.deepEqual(trafficAt('school',1000),[]);
});
test('Veículos param para pedestres fora das faixas e retomam sem saltar quando a pista libera',()=>{
 for(const map of ['city','plaza','downtown','usa'])for(const direction of ['left','right']){
  const simulation=createTrafficSimulation();
  const car=simulation.vehicles(map,0).find(car=>car.direction===direction&&car.x>0&&car.x<960);
  const sign=direction==='right'?1:-1,person={x:car.x+sign*140,y:car.y};
  let stopped;
  for(let t=100;t<=5000;t+=100)stopped=simulation.vehicles(map,t,[person]).find(x=>x.id===car.id);
  assert.equal(stopped.moving,false);
  assert.ok((person.x-stopped.x)*sign>=car.scale*54+31);
  const resumed=simulation.vehicles(map,5100,[]).find(x=>x.id===car.id);
  assert.ok((resumed.x-stopped.x)*sign>0);
  assert.ok(Math.abs(resumed.x-stopped.x)<10);
 }
});
test('Fila mantém distância do veículo parado e pessoas na calçada não bloqueiam trânsito',()=>{
 const simulation=createTrafficSimulation(),map='downtown';
 const initial=simulation.vehicles(map,0),front=initial.find(x=>x.direction==='right'&&x.x>0);
 const person={x:front.x+130,y:front.y};let cars;
 for(let t=100;t<=15000;t+=100)cars=simulation.vehicles(map,t,[person]);
 const lane=cars.filter(x=>x.direction==='right').sort((a,b)=>a.x-b.x);
 const half=car=>(car.item.baseId==='car'?54:48)*car.scale;
 assert.ok(lane[1].x-lane[0].x>=half(lane[0])+half(lane[1])+21.99);
 const free=createTrafficSimulation(),a=free.vehicles(map,0);
 const b=free.vehicles(map,100,a.map(car=>({x:car.x,y:car.y-80})));
 assert.ok(b.every(car=>car.moving));
});
