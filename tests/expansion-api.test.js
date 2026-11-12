import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {schoolExams} from '../school-content.js';
import {clubLessons,regionalJobs} from '../expansion-content.js';
import {referenceProject} from '../project-exams.js';
import {regionalPrerequisites} from './helpers/expansion-access.js';
test('API protege regiões, provas, carteiras e recompensa única com cooldown real',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'devlife-expansion-'));const port=6100+Math.floor(Math.random()*500);const dbPath=path.join(dir,'test.sqlite');
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port),DEVLIFE_DB:dbPath},stdio:['ignore','pipe','pipe']});let cookie='',db;
 const request=async(route,data)=>{const response=await fetch(`http://127.0.0.1:${port}/api/${route}`,{method:data?'POST':'GET',headers:{Cookie:cookie,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];return {status:response.status,body:await response.json()}};
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Servidor não iniciou')),10000);child.stdout.once('data',()=>{clearTimeout(timer);resolve()});child.once('error',reject)});
  assert.equal((await request('register',{name:'QA Expansão',email:'expansion@example.com',password:'senha12345'})).status,200);
  let catalog=(await request('state')).body;assert.equal(catalog.expansion.clubLessons.length,54);
  assert.ok(catalog.expansion.clubLessons.every(x=>!('solution' in x)&&!('contract' in x)));
  assert.ok(!('solution' in catalog.expansion.nextJobs.downtown));
  for(const map of ['plaza','library','downtown','devclub','usa','us-shop'])assert.equal((await request('position',{map,x:60,y:420})).body.state.position.map,'city');
  assert.equal((await request('club-submit',{id:'devclub-node-1',code:clubLessons[0].solution})).status,403);
  assert.equal((await request('dollar-checkout',{id:'usd-100'})).status,503);
  const beforePackages=(await request('state')).body;
  assert.deepEqual(Object.keys(beforePackages.expansion.currencyPackages),['coins','brl','usd']);
  for(const [currency,packs] of Object.entries(beforePackages.expansion.currencyPackages))for(const pack of packs)assert.equal((await request('currency-checkout',{currency,id:pack.id})).status,503);
  const afterPackages=(await request('state')).body.state;
  assert.equal(afterPackages.money,beforePackages.state.money);assert.deepEqual(afterPackages.wallets,beforePackages.state.wallets);
  assert.deepEqual(afterPackages.completed,beforePackages.state.completed);
  db=new DatabaseSync(dbPath);
  const setState=change=>{const state=JSON.parse(db.prepare('SELECT state FROM characters').get().state);change(state);db.prepare('UPDATE characters SET state=?').run(JSON.stringify(state))};
  setState(s=>{delete s.npcWorldStartedAt});const firstNpcEpoch=(await request('state')).body.state.npcWorldStartedAt;assert.ok(Number.isFinite(firstNpcEpoch));assert.equal((await request('state')).body.state.npcWorldStartedAt,firstNpcEpoch);assert.equal(JSON.parse(db.prepare('SELECT state FROM characters').get().state).npcWorldStartedAt,firstNpcEpoch);
  setState(state=>{state.completed=schoolExams.map(x=>x.id);state.bookProgress=regionalPrerequisites().bookProgress;state.position={map:'devclub',x:480,y:450}});
  const nodeDemo=await request('expansion-preview',{id:'devclub-node-1',code:clubLessons[0].solution,input:{}});assert.equal(nodeDemo.status,200);assert.equal(nodeDemo.body.output,'Servidor pronto');
  const reactDemo=await request('expansion-preview',{id:'devclub-react-1',code:'function Component(){return <h1>DevClub</h1>}',input:{}});assert.equal(reactDemo.status,200);assert.ok(reactDemo.body.compiled.includes('React.createElement'));
  assert.equal((await request('expansion-preview',{id:'devclub-node-1',code:'module.exports=()=>{while(true){}}',input:{}})).status,422);
  assert.equal((await request('club-submit',{id:'devclub-node-exam',code:clubLessons.find(x=>x.id==='devclub-node-exam').solution})).status,403);
  for(const lesson of clubLessons){
    if(lesson.exam&&!(await request('state')).body.state.competitionParticipated){
      const blocked=await request('club-submit',{id:lesson.id,code:lesson.solution,competitionParticipated:true});assert.equal(blocked.status,403);assert.match(blocked.body.error,/competição/);
  catalog=(await request('state')).body;assert.equal(catalog.state.access.usa,false);
  assert.equal((await request('position',{map:'usa',x:480,y:420,competitionParticipated:true})).body.state.position.map,'city');
  await request('position',{map:'stadium',x:480,y:485});
  assert.equal((await request('competition/submit',{cycleId:0,title:'Sem projeto',description:'Uma descrição suficientemente longa.',project:{html:'',css:'',js:''}})).status,400);
  assert.equal((await request('state')).body.state.competitionParticipated,false);
  const cycle=(await request('competition')).body.cycle;
  assert.equal((await request('competition/submit',{cycleId:cycle.id,title:'Minha participação',description:'Um projeto válido para a competição mensal.',project:{html:'<main><h1>Minha participação</h1></main>',css:'',js:''}})).status,200);
  catalog=(await request('state')).body;assert.equal(catalog.state.access.usa,false);assert.equal(catalog.state.competitionParticipated,true);
  await request('position',{map:'devclub',x:480,y:450});
    }
    assert.equal((await request('expansion-test',{id:lesson.id,code:lesson.starter})).status,422);assert.equal((await request('club-submit',{id:lesson.id,code:lesson.solution})).status,200,lesson.id);
  }
  assert.equal((await request('club-submit',{id:'devclub-react-exam',code:clubLessons.find(x=>x.id==='devclub-react-exam').solution})).status,409);
  catalog=(await request('state')).body;assert.equal(catalog.state.access.usa,true);
  for(const track of ['ts-front','ts-back']){
    const exam=clubLessons.find(x=>x.track===track&&x.exam);
    assert.equal(catalog.state.skills[exam.area],100);
    assert.ok(catalog.state.achievements.includes(exam.id));
  }
  await request('position',{map:'city-office',x:650,y:350});const first=regionalJobs.downtown[0];
  assert.equal((await request('regional-work',{region:'downtown',id:first.id,code:first.starter})).status,422);
  const earned=await request('regional-work',{region:'downtown',id:first.id,code:first.solution});assert.equal(earned.status,200);assert.equal(earned.body.state.wallets.brl,first.rewardCents);assert.equal(earned.body.state.money,0);assert.equal(earned.body.state.wallets.usd,0);
  assert.equal((await request('regional-work',{region:'downtown',id:first.id,code:first.solution})).status,409);
  await request('position',{map:'us-office',x:650,y:350});let job=(await request('state')).body.expansion.nextJobs.usa;
  const p=referenceProject(job.stage);p.html=p.html.replace(/<h1>.*?<\/h1>/,`<h1>${job.company}</h1>`);p.backend=clubLessons.find(x=>x.id==='devclub-node-exam').solution;
  const us=await request('regional-work',{region:'usa',id:job.id,code:JSON.stringify(p)});assert.equal(us.status,200,JSON.stringify(us.body));assert.equal(us.body.state.wallets.usd,100);
  assert.equal((await request('regional-work',{region:'usa',id:us.body.nextJob.id,code:JSON.stringify(p)})).status,409);
  const wallet=us.body.state.wallets;assert.equal((await request('buy',{id:'usa-car'})).status,403);
  await request('position',{map:'us-shop',x:480,y:350});assert.equal((await request('buy',{id:'usa-car'})).status,400);
  assert.deepEqual((await request('state')).body.state.wallets,wallet);
  setState(state=>{state.wallets.usd=5000000;state.position={map:'us-shop',x:480,y:350};});
  const boughtCar=await request('buy',{id:'usa-car'});assert.equal(boughtCar.status,200);assert.ok(boughtCar.body.state.inventory.includes('usa-car'));assert.ok(!boughtCar.body.state.equipped.includes('usa-car'));assert.equal(boughtCar.body.state.activeVehicle,null);
  await request('position',{map:'usa',x:480,y:420});
  assert.equal((await request('vehicle',{})).status,403);
  const selectedCar=await request('equip',{id:'usa-car'});assert.equal(selectedCar.status,200);assert.equal(selectedCar.body.state.activeVehicle,null);
  assert.equal((await request('vehicle',{})).body.state.activeVehicle,'usa-car');
  const stopped=await request('vehicle',{active:false});assert.equal(stopped.body.state.activeVehicle,null);assert.ok(stopped.body.state.equipped.includes('usa-car'));
  await request('vehicle',{});assert.equal((await request('position',{map:'us-shop',x:480,y:350})).body.state.activeVehicle,null);
  assert.equal((await request('vehicle',{})).status,403);
  const persisted=JSON.parse(db.prepare('SELECT state FROM characters').get().state);assert.equal(persisted.activeVehicle,null);

  const typedJobs=regionalJobs.usa.filter(job=>job.typescript);
  setState(state=>{
    state.position={map:'us-office',x:650,y:350};
    state.regionalWork.usa.completed=regionalJobs.usa.filter(job=>!job.typescript).map((_,i)=>`us-contract-${i+1}`);
    state.regionalWork.usa.nextWorkAt=0;
  });
  for(const expected of typedJobs){
    const {state,expansion}= (await request('state')).body;
    const contract=expansion.nextJobs.usa;
    assert.equal(contract.track,expected.track);
    assert.ok(!('solution' in contract) && !('contract' in contract));
    assert.equal((await request('expansion-preview',{region:'usa',id:contract.id,code:expected.solution,input:contract.demoInput})).status,200);
    const delivery=await request('regional-work',{region:'usa',id:contract.id,code:expected.solution});
    assert.equal(delivery.status,200,JSON.stringify(delivery.body));
    assert.equal(delivery.body.state.wallets.usd,state.wallets.usd+100);
    setState(s=>{s.regionalWork.usa.nextWorkAt=0;});
  }

  setState(state=>{state.position={map:'shop',x:480,y:450};state.xp=100000;state.wallets.brl=1_000_000;});
  const master=(await request('state')).body.items.find(item=>item.id==='mug-master');
  assert.equal(master.region,'downtown');
  assert.equal((await request('buy',{id:master.id})).status,403);
  await request('position',{map:'city-shop',x:480,y:450});
  const purchase=await request('buy',{id:master.id});
  assert.equal(purchase.status,200,JSON.stringify(purchase.body));
  assert.equal(purchase.body.state.wallets.brl,1_000_000-master.price);

 }finally{db?.close();child.kill();await new Promise(resolve=>child.once('exit',resolve));rmSync(dir,{recursive:true,force:true})}
});
