import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
test('Personalização cobra US$ 10 por abertura e protege o salvamento contra bypass',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'devlife-character-fee-')),dbPath=path.join(dir,'test.sqlite'),port=7200+Math.floor(Math.random()*500);
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port),DEVLIFE_DB:dbPath},stdio:['ignore','pipe','pipe']});let cookie='',db;
 const request=async(route,data)=>{const r=await fetch(`http://127.0.0.1:${port}/api/${route}`,{method:data?'POST':'GET',headers:{Cookie:cookie,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return {status:r.status,body:await r.json()}};
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Servidor não iniciou')),10000);child.stdout.once('data',()=>{clearTimeout(timer);resolve()});child.once('error',reject)});
  assert.equal((await request('character-open',{})).status,401);
  assert.equal((await request('register',{name:'Teste Visual',email:'visual@example.com',password:'senha12345'})).status,200);
  assert.equal((await request('character',{name:'Bypass'})).status,403);
  const first=await request('character-open',{});assert.equal(first.status,200);assert.equal(first.body.cost,0);assert.equal(first.body.state.wallets.usd,0);
  assert.equal(first.body.state.characterSetupCompleted,false);
  const resumed=await request('character-open',{});assert.equal(resumed.status,200);assert.equal(resumed.body.cost,0);
  first.body.editorToken=resumed.body.editorToken;
  const initialSave=await request('character',{editorToken:first.body.editorToken,name:'Primeiro Visual'});
  assert.equal(initialSave.status,200);assert.equal(initialSave.body.state.characterSetupCompleted,true);
  assert.equal((await request('character',{editorToken:first.body.editorToken,name:'Reutilizado'})).status,403);
  db=new DatabaseSync(dbPath);
  const edit=fn=>{const s=JSON.parse(db.prepare('SELECT state FROM characters').get().state);fn(s);db.prepare('UPDATE characters SET state=?').run(JSON.stringify(s))};
  edit(s=>{s.wallets={usd:2000,brl:25000};s.money=123;});
  const paid1=await request('character-open',{});assert.equal(paid1.body.cost,1000);assert.equal(paid1.body.state.wallets.usd,1000);assert.equal(paid1.body.state.wallets.brl,25000);assert.equal(paid1.body.state.money,123);
  assert.ok(!Object.hasOwn(paid1.body.state,'characterEditorAccess'));assert.ok(!Object.hasOwn((await request('state')).body.state,'characterEditorAccess'));
  // Fechar sem salvar não devolve a taxa: nova abertura é outra compra.
  const paid2=await request('character-open',{});assert.equal(paid2.body.state.wallets.usd,0);assert.notEqual(paid2.body.editorToken,paid1.body.editorToken);
  assert.equal((await request('character',{editorToken:paid1.body.editorToken,name:'Token antigo'})).status,403);
  const save=await request('character',{editorToken:paid2.body.editorToken,name:'Visual Pago',gender:'female'});assert.equal(save.status,200);assert.equal(save.body.state.wallets.usd,0);assert.equal(save.body.state.name,'Visual Pago');
  assert.equal((await request('character',{editorToken:paid2.body.editorToken,name:'Repetido'})).status,403);
  edit(s=>{s.wallets.usd=999;});assert.equal((await request('character-open',{})).status,402);assert.equal((await request('state')).body.state.wallets.usd,999);
  edit(s=>{delete s.characterSetupCompleted;s.wallets.usd=1000;});const legacy=await request('character-open',{});assert.equal(legacy.body.cost,1000);assert.equal(legacy.body.state.wallets.usd,0);
  edit(s=>{s.wallets.usd=1000;});const concurrent=await Promise.all([request('character-open',{}),request('character-open',{})]);assert.deepEqual(concurrent.map(x=>x.status).sort(),[200,402]);assert.equal((await request('state')).body.state.wallets.usd,0);
 }finally{db?.close();if(child.exitCode===null&&child.signalCode===null){const exited=new Promise(r=>child.once('exit',r));child.kill();await exited;}rmSync(dir,{recursive:true,force:true})}
});
