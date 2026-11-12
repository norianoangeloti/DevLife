import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {heldLaptop,chosenLaptop} from '../public/laptop.js';
import {equipItem} from '../content.js';
import {regionalItems} from '../public/shop-models.js';
import {schoolExams} from '../school-content.js';
import {clubLessons} from '../expansion-content.js';
test('Notebooks possuem slot próprio e guardam a preferência sem substituir o computador da casa',()=>{
 const state={inventory:['downtown-laptop','usa-laptop'],equipped:['computer-common']};
 assert.equal(chosenLaptop(state).id,'usa-laptop');assert.equal(heldLaptop(state),null);
 equipItem(state,'downtown-laptop');assert.equal(heldLaptop(state).id,'downtown-laptop');assert.ok(state.equipped.includes('computer-common'));
 equipItem(state,'usa-laptop');assert.equal(heldLaptop(state).id,'usa-laptop');assert.ok(!state.equipped.includes('downtown-laptop'));
 equipItem(state,'usa-laptop');assert.equal(heldLaptop(state),null);assert.equal(chosenLaptop(state).id,'usa-laptop');
 assert.equal(heldLaptop({inventory:[],equipped:['usa-laptop']}),null);
 const models=regionalItems.filter(item=>item.slot==='laptop');assert.equal(models.length,2);assert.ok(models.find(x=>x.region==='usa').price>models.find(x=>x.region==='downtown').price/100);
});
test('Compra de notebook usa a moeda e loja corretas, não equipa automaticamente e persiste seleção',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'devlife-laptops-')),dbPath=path.join(dir,'test.sqlite'),port=9400+Math.floor(Math.random()*400);
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port),DEVLIFE_DB:dbPath},stdio:['ignore','pipe','pipe']});let db,cookie='';
 const request=async(route,body)=>{const response=await fetch(`http://127.0.0.1:${port}/api/${route}`,{method:body?'POST':'GET',headers:{Cookie:cookie,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];return {status:response.status,data:await response.json()}};
 try{
  await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject)});await request('register',{name:'Portátil',email:'laptop@example.com',password:'senha12345'});db=new DatabaseSync(dbPath);
  const state=JSON.parse(db.prepare('SELECT state FROM characters').get().state);state.completed=[...schoolExams.map(x=>x.id),...clubLessons.map(x=>x.id)];state.wallets={brl:500000,usd:10000};state.position={map:'city-shop',x:480,y:350};db.prepare('UPDATE characters SET state=?').run(JSON.stringify(state));
  assert.equal((await request('equip',{id:'usa-laptop'})).status,400);
  assert.equal((await request('buy',{id:'usa-laptop'})).status,403);
  const city=await request('buy',{id:'downtown-laptop'});assert.equal(city.status,200);assert.equal(city.data.state.wallets.brl,50000);assert.equal(city.data.state.wallets.usd,10000);assert.equal(heldLaptop(city.data.state),null);
  assert.equal((await request('equip',{id:'downtown-laptop'})).status,200);await request('position',{map:'us-shop',x:480,y:350});
  const usa=await request('buy',{id:'usa-laptop'});assert.equal(usa.status,200);assert.equal(usa.data.state.wallets.usd,3500);assert.equal(usa.data.state.wallets.brl,50000);assert.equal(heldLaptop(usa.data.state).id,'downtown-laptop');
  await request('equip',{id:'usa-laptop'});assert.equal(heldLaptop((await request('state')).data.state).id,'usa-laptop');
  assert.equal((await request('buy',{id:'usa-laptop'})).status,409);await request('equip',{id:'usa-laptop'});assert.equal(chosenLaptop((await request('state')).data.state).id,'usa-laptop');
 }finally{db?.close();if(child.exitCode===null&&child.signalCode===null){const exited=new Promise(resolve=>child.once('exit',resolve));child.kill();await exited}rmSync(dir,{recursive:true,force:true})}
});
