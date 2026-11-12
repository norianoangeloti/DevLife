import test from 'node:test';
import assert from 'node:assert/strict';
import {movementDirection} from '../public/vehicle-control.js';

test('Analógico aponta para o eixo dominante apesar da inclinação no outro eixo',()=>{
 for(const drift of [-.4,-.01,0,.01,.4]){
  assert.equal(movementDirection(-1,drift),'left');
  assert.equal(movementDirection(1,drift),'right');
  assert.equal(movementDirection(drift,-1),'up');
  assert.equal(movementDirection(drift,1),'down');
 }
 assert.equal(movementDirection(0,0,'left'),'left');
 assert.equal(movementDirection(.00001,-.00001,'right'),'right');
});
