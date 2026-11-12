import test from 'node:test';
import assert from 'node:assert/strict';
import {npcProfiles,npcPlan,npcAt,npcsAt,nearbyNpc,createNpcSimulation} from '../public/npcs.js';
import {npcDialogue} from '../public/npc-dialogue.js';
import {blocked} from '../public/navigation.js';
test('Cada um dos quatro mapas tem três moradores com nomes e assuntos próprios',()=>{
 assert.equal(npcProfiles.length,12);assert.equal(new Set(npcProfiles.map(x=>x.id)).size,12);
 for(const map of ['city','plaza','downtown','usa']){const actors=npcsAt(map,0);assert.equal(actors.length,3);assert.equal(new Set(actors.map(x=>x.name)).size,3);assert.ok(actors.every(x=>x.subject&&x.career&&x.activity));}
});
test('Rotas caminháveis evitam edifícios, fonte, árvores e postes durante ciclos completos',()=>{
 for(const profile of npcProfiles){const plan=npcPlan(profile);assert.ok(plan.duration>30000);let moving=0,stopped=0;
  for(let t=0;t<plan.duration*2;t+=250){const actor=npcAt(profile,t);assert.equal(blocked(actor,profile.map,true),false,`${profile.id} ${t}: ${actor.x},${actor.y}`);if(actor.walking)moving++;else stopped++;}
  assert.ok(moving>0&&stopped>0,profile.id);
 }
});
test('Moradores estudam, concluem práticas e progridem com o tempo, mesmo fora da tela',()=>{
 for(const profile of npcProfiles){const before=npcAt(profile,0),after=npcAt(profile,npcPlan(profile).duration*40);assert.ok(after.studies>before.studies);assert.ok(after.projects>before.projects);assert.ok(after.xp>before.xp);assert.ok(after.level>=before.level&&after.level<=100);assert.equal(after.career,'Tech Lead');assert.deepEqual(npcAt(profile,123456),npcAt(profile,123456));}
});
test('Conversa pausa somente o morador escolhido e retoma sem pular de posição',()=>{
 const simulation=createNpcSimulation(),time=25000,actor=simulation.actors('city',time)[0];simulation.pause(actor.id,time);
 assert.deepEqual(simulation.actors('city',time+10000)[0],actor);
 const otherBefore=simulation.actors('city',time)[1],otherAfter=simulation.actors('city',time+10000)[1];assert.notDeepEqual(otherAfter,otherBefore);
 simulation.resume(actor.id,time+10000);assert.deepEqual(simulation.actors('city',time+10000)[0],actor);assert.notDeepEqual(simulation.actors('city',time+25000)[0],actor);
});
test('E encontra o morador mais próximo e as conversas explicam estudos e emprego',()=>{
 const state={completed:[],xp:0,money:0,job:null};const before=JSON.stringify(state);
 for(const profile of npcProfiles){const actor=npcAt(profile,0);assert.equal(nearbyNpc([actor],{x:actor.x+20,y:actor.y}).id,actor.id);assert.equal(nearbyNpc([actor],{x:actor.x+100,y:actor.y}),null);
  for(const topic of ['study','work']){const speech=npcDialogue(actor,topic,state);assert.ok(speech.title&&speech.text.length>50);if(topic==='study')assert.ok(speech.code);assert.equal(speech.stats,undefined);}
 }
 assert.equal(JSON.stringify(state),before);
 assert.match(npcDialogue(npcsAt('usa',0)[0],'work',state).text,/12 horas reais/);
});
