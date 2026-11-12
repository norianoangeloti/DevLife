import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {schoolLessons,schoolExams} from '../school-content.js';
import {clubLessons} from '../expansion-content.js';
import {referenceProject} from '../project-exams.js';
import {regionalPrerequisites} from './helpers/expansion-access.js';
test('API exige leituras e participação antes das provas e libera o mapa só na aprovação final',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'devlife-exam-gates-')),port=8900+Math.floor(Math.random()*500),dbPath=path.join(dir,'test.sqlite');
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port),DEVLIFE_DB:dbPath},stdio:['ignore','pipe','pipe']});let db,cookie='';
 const request=async(route,body)=>{const response=await fetch(`http://127.0.0.1:${port}/api/${route}`,{method:body?'POST':'GET',headers:{Cookie:cookie,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];return {status:response.status,data:await response.json()}};
 try{
  await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject)});
  await request('register',{name:'Fluxo provas',email:'provas@example.com',password:'senha12345'});db=new DatabaseSync(dbPath);
  const edit=fn=>{const state=JSON.parse(db.prepare('SELECT state FROM characters').get().state);fn(state);db.prepare('UPDATE characters SET state=?').run(JSON.stringify(state))};
  edit(state=>{state.completed=[...schoolLessons.map(l=>l.id),...schoolExams.filter(e=>e.stage==='beginner').map(e=>e.id),...clubLessons.filter(l=>!l.exam).map(l=>l.id)];state.schoolProjects={intermediate:referenceProject('intermediate')};});
  const blocked=await request('exam',{id:'exam-html-intermediate',code:referenceProject('intermediate').html});assert.equal(blocked.status,403);assert.match(blocked.data.error,/livros/);
  edit(state=>{state.bookProgress=regionalPrerequisites().bookProgress});
  for(const [area,field] of [['html','html'],['css','css'],['javascript','js']]){const result=await request('exam',{id:`exam-${area}-intermediate`,code:referenceProject('intermediate')[field]});assert.equal(result.status,200);assert.equal(result.data.state.access.downtown,area==='javascript');}
  const advanced=await request('exam',{id:'exam-html-advanced',code:referenceProject('advanced').html,competitionParticipated:true});assert.equal(advanced.status,403);assert.match(advanced.data.error,/competição/);
  await request('position',{map:'devclub',x:480,y:485});const node=clubLessons.find(l=>l.id==='devclub-node-exam');
  for(const route of ['expansion-preview','expansion-test','club-submit']){const result=await request(route,{id:node.id,code:node.solution,competitionParticipated:true});assert.equal(result.status,403);assert.match(result.data.error,/competição/);}
  await request('position',{map:'stadium',x:480,y:485});const cycle=(await request('competition')).data.cycle;
  assert.equal((await request('competition/submit',{cycleId:cycle.id,title:'Participação válida',description:'Um projeto válido para liberar as provas finais.',project:{html:'<main><h1>Meu projeto</h1></main>',css:'',js:''}})).status,200);
  assert.equal((await request('state')).data.state.access.usa,false);
  await request('position',{map:'devclub',x:480,y:485});for(const exam of clubLessons.filter(l=>l.exam))assert.equal((await request('club-submit',{id:exam.id,code:exam.solution})).status,200);
  assert.equal((await request('state')).data.state.access.usa,false);
  for(const [area,field] of [['html','html'],['css','css'],['javascript','js']]){const result=await request('exam',{id:`exam-${area}-advanced`,code:referenceProject('advanced')[field]});assert.equal(result.status,200);assert.equal(result.data.state.access.usa,area==='javascript');}
 }finally{db?.close();if(child.exitCode===null&&child.signalCode===null){const exited=new Promise(resolve=>child.once('exit',resolve));child.kill();await exited}rmSync(dir,{recursive:true,force:true})}
});
