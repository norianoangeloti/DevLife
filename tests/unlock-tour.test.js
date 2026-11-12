import test from 'node:test';
import assert from 'node:assert/strict';
import {newlyUnlockedRegions,tourCamera,regionTours} from '../public/unlock-tour.js';
import {clubExamIds} from '../public/expansion-rules.js';
import {regionalPrerequisites} from './helpers/expansion-access.js';
const beginner=['exam-javascript-beginner'];
const intermediate=['html','css','javascript'].map(area=>`exam-${area}-intermediate`);
const advanced=['html','css','javascript'].map(area=>`exam-${area}-advanced`);
test('Passeios disparam somente ao concluir todos os requisitos da região',()=>{
 const a={completed:[]},b={completed:beginner},c={completed:[...beginner,...intermediate],bookProgress:regionalPrerequisites().bookProgress},d={completed:[...c.completed,...advanced,...clubExamIds],...regionalPrerequisites()};
 assert.deepEqual(newlyUnlockedRegions(a,b),['plaza']);
 assert.deepEqual(newlyUnlockedRegions(b,c),['downtown']);
 assert.deepEqual(newlyUnlockedRegions(c,{...regionalPrerequisites(),completed:d.completed.slice(0,-1)}),[]);
 assert.deepEqual(newlyUnlockedRegions(c,d),['usa']);
 assert.deepEqual(newlyUnlockedRegions({...d,competitionParticipated:false},d),[]);
 assert.deepEqual(newlyUnlockedRegions({...c,bookProgress:{}},c),[]);
 assert.deepEqual(newlyUnlockedRegions(d,d),[]);
});
test('Câmera percorre a estrada de origem e a região liberada sem sair do mapa',()=>{
 for(const [key,route] of Object.entries(regionTours)){
  assert.equal(tourCamera(key,0).map,route.from);
  assert.equal(tourCamera(key,5000).map,route.to);
  assert.ok(tourCamera(key,2000).x>tourCamera(key,0).x);
  for(let t=0;t<=6000;t+=50){const camera=tourCamera(key,t);assert.ok(camera.x>=0&&camera.x+660<=960);assert.ok(camera.y>=0&&camera.y+360<=640);assert.ok(camera.alpha>=0&&camera.alpha<=1);}
 }
});
