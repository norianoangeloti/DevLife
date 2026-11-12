import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createIdleSessions} from '../session-idle.js';
import {createIdleTracker,IDLE_TIMEOUT_MS} from '../public/idle-session.js';

test('Cliente desconecta uma vez após 15 minutos; checagens automáticas não renovam atividade',()=>{
 let time=1000,ended=0,pings=0;const tracker=createIdleTracker({now:()=>time,onIdle:()=>ended++,onActivity:()=>pings++});
 tracker.start();time+=IDLE_TIMEOUT_MS-1;tracker.tick();assert.equal(ended,0);assert.equal(pings,0);
 time++;tracker.tick();tracker.activity();tracker.tick();assert.equal(ended,1);assert.equal(pings,0);
});

test('Interações renovam prazo, limitam notificações e enviam a última interação pendente',()=>{
 let time=0,pings=0,ended=0;const tracker=createIdleTracker({now:()=>time,onIdle:()=>ended++,onActivity:()=>pings++});
 tracker.start();tracker.activity();assert.equal(pings,1);
 time=9000;tracker.activity();assert.equal(pings,1);
 time=10000;tracker.tick();assert.equal(pings,2);
 time=9000+IDLE_TIMEOUT_MS-1;tracker.tick();assert.equal(ended,0);
 time++;tracker.tick();assert.equal(ended,1);
 tracker.start();time+=IDLE_TIMEOUT_MS+1;tracker.activity();assert.equal(ended,2,'Voltar após suspensão não revive sessão expirada');
});

test('Servidor preserva progresso e invalida sessão ociosa mesmo com consultas constantes',()=>{
 const db=new DatabaseSync(':memory:');let time=1000;
 try{
  db.exec("PRAGMA foreign_keys=ON; CREATE TABLE sessions(token TEXT PRIMARY KEY,user_id INTEGER,expires INTEGER); CREATE TABLE characters(user_id INTEGER PRIMARY KEY,state TEXT); INSERT INTO sessions VALUES('teste',1,999999999); INSERT INTO characters VALUES(1,'progresso preservado');");
  const idle=createIdleSessions(db,()=>time);
  time+=IDLE_TIMEOUT_MS-1;assert.equal(idle.expired('teste'),false);
  time++;assert.equal(idle.expired('teste'),true);
  assert.equal(db.prepare('SELECT count(*) AS n FROM sessions').get().n,0);
  assert.equal(db.prepare('SELECT count(*) AS n FROM session_activity').get().n,0);
  assert.equal(db.prepare('SELECT state FROM characters').get().state,'progresso preservado');
  db.prepare('INSERT INTO sessions VALUES(?,?,?)').run('nova',1,999999999);assert.equal(idle.expired('nova'),false);
  time+=800000;assert.equal(idle.touch('nova'),true);time+=800000;assert.equal(idle.expired('nova'),false);
  const restored=createIdleSessions(db,()=>time);time+=100000;assert.equal(restored.expired('nova'),true,'Reiniciar não renova o prazo');
 }finally{db.close();}
});
