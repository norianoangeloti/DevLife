import test from 'node:test';
import assert from 'node:assert/strict';
import {activeVehicle,useVehicle,normalizeVehicle} from '../public/vehicle-control.js';
import {equipItem} from '../content.js';
const state=()=>({inventory:['downtown-car','usa-motorcycle'],equipped:['downtown-car'],activeVehicle:null,position:{map:'downtown',x:480,y:420}});
test('Selecionar veículo não ativa nem concede velocidade ao andar na pista',()=>{
 const s=state();assert.equal(activeVehicle(s),null);normalizeVehicle(s);assert.equal(s.activeVehicle,null);
 assert.equal(useVehicle(s).error,undefined);assert.equal(activeVehicle(s).id,'downtown-car');
 assert.equal(activeVehicle(JSON.parse(JSON.stringify(s))).id,'downtown-car');
});
test('Entrar e sair são ações explícitas e preservam o veículo selecionado',()=>{
 const s=state();useVehicle(s);useVehicle(s,{active:false});assert.equal(activeVehicle(s),null);assert.ok(s.equipped.includes('downtown-car'));
 useVehicle(s);equipItem(s,'usa-motorcycle');assert.equal(s.activeVehicle,null);assert.deepEqual(s.equipped,['usa-motorcycle']);
 useVehicle(s);equipItem(s,'usa-motorcycle');assert.equal(s.activeVehicle,null);assert.deepEqual(s.equipped,[]);
});
test('Veículo exige propriedade, seleção e pista; sair da pista encerra o uso',()=>{
 const s=state();assert.equal(useVehicle(s,{id:'usa-car'}).status,403);assert.equal(useVehicle(s,{id:'usa-motorcycle'}).status,403);
 s.position.map='devclub';assert.equal(useVehicle(s).status,403);
 s.position.map='downtown';useVehicle(s);s.position.y=290;normalizeVehicle(s);assert.equal(s.activeVehicle,null);
 s.position.y=420;assert.equal(activeVehicle(s),null);
});
