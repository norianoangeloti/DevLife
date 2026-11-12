import test from 'node:test';
import assert from 'node:assert/strict';
import {drawLighting} from '../public/lighting.js';
import {streetLamps,lampBulb} from '../public/navigation.js';
function recorder(){const calls=[];const context=new Proxy({calls},{get(target,key){if(key==='createRadialGradient')return (...args)=>{calls.push([key,...args]);return {addColorStop(){}}};if(key in target)return target[key];return (...args)=>calls.push([key,...args])},set(target,key,value){target[key]=value;return true}});return context;}
test('Luz noturna fica dentro da lâmpada real em cada posição atualizada',()=>{
 for(const scene of ['city','plaza','downtown','usa']){
  const c=recorder();drawLighting(c,scene,[],1);
  const bulbs=c.calls.filter(x=>x[0]==='fillRect').slice(1);
  assert.deepEqual(bulbs,streetLamps[scene].map(([x,y])=>['fillRect',x+lampBulb.x+1,y+lampBulb.y+1,lampBulb.width-2,lampBulb.height-2]));
  const halos=c.calls.filter(x=>x[0]==='createRadialGradient'&&x.at(-1)===30);
  assert.deepEqual(halos.map(x=>x.slice(1,3)),streetLamps[scene].map(([x,y])=>[x,y-52.5]));
 }
});
test('Centro e USA têm quatro postes próprios com iluminação alinhada',()=>{
 for(const scene of ['downtown','usa']){assert.equal(streetLamps[scene].length,4);assert.notDeepEqual(streetLamps[scene],streetLamps.plaza);const c=recorder();drawLighting(c,scene,[],1);assert.equal(c.calls.filter(x=>x[0]==='createRadialGradient').length,11);assert.equal(c.calls.filter(x=>x[0]==='fillRect').length,5);}
});
test('Iluminação não altera o mapa durante o dia',()=>{const c=recorder();drawLighting(c,'plaza',[],0);assert.deepEqual(c.calls,[])});
