import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('Multiplayer autentica presença, isola casas e protege global, mapa e mensagens privadas',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'devlife-online-')),dbPath=path.join(dir,'test.sqlite'),port=8200+Math.floor(Math.random()*500);
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port),DEVLIFE_DB:dbPath},stdio:['ignore','pipe','pipe']});const controllers=[];let db;
 const request=async(cookie,route,body)=>{const response=await fetch(`http://127.0.0.1:${port}/api/${route}`,{method:body?'POST':'GET',headers:{Cookie:cookie,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]}};
 async function connect(cookie){
  const controller=new AbortController();controllers.push(controller);
  const response=await fetch(`http://127.0.0.1:${port}/api/online/events`,{headers:{Cookie:cookie},signal:controller.signal});assert.equal(response.status,200);
  const events=[];let pending='';const reader=response.body.getReader(),decoder=new TextDecoder();
  (async()=>{try{while(true){const chunk=await reader.read();if(chunk.done)break;pending+=decoder.decode(chunk.value,{stream:true});let index;while((index=pending.indexOf('\n\n'))>=0){const block=pending.slice(0,index);pending=pending.slice(index+2);const event=block.match(/^event: (.+)$/m)?.[1],data=block.match(/^data: (.+)$/m)?.[1];if(event&&data)events.push({event,data:JSON.parse(data)})}}}catch{}})();return events;
 }
 async function wait(events,predicate){const deadline=Date.now()+5000;while(Date.now()<deadline){const event=events.findLast(predicate);if(event)return event.data;await sleep(20)}throw Error('Evento esperado não chegou');}
 try{
  await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject)});
  assert.equal((await request('','chat/history?channel=global')).status,401);
  const cookies=[];for(const name of ['Ana','Bia','Caio'])cookies.push((await request('','register',{name,email:name+'@example.com',password:'senha12345'})).cookie);
  db=new DatabaseSync(dbPath);const rows=db.prepare('SELECT user_id,state FROM characters ORDER BY user_id').all();
  const third=JSON.parse(rows[2].state);third.completed.push('exam-javascript-beginner');third.position={map:'plaza',x:110,y:570};db.prepare('UPDATE characters SET state=? WHERE user_id=?').run(JSON.stringify(third),rows[2].user_id);
  const [a,b,c]=await Promise.all(cookies.map(connect));
  const world=await wait(a,e=>e.event==='world'&&e.data.roster.length===3);
  assert.equal(world.players.length,1);assert.equal(world.players[0].name,'Bia');
  assert.ok(!('wallets' in world.players[0])&&!('email' in world.players[0])&&!('submissions' in world.players[0]));
  assert.equal((await request(cookies[0],'online/presence',{map:'usa',x:480,y:420})).status,400);
  assert.equal((await request(cookies[0],'online/presence',{map:'city',x:400,y:150})).status,400);
  await request(cookies[0],'online/presence',{map:'city',x:500,y:420,direction:'right',walking:true,name:'Falso',id:999});
  const moved=await wait(b,e=>e.event==='world'&&e.data.players.some(x=>x.id===rows[0].user_id&&x.position.x===500));assert.equal(moved.players.find(x=>x.id===rows[0].user_id).name,'Ana');
  const global=await request(cookies[0],'chat',{channel:'global',text:'Olá global'});assert.equal(global.status,200);await wait(c,e=>e.event==='chat'&&e.data.id===global.data.message.id);
  const local=await request(cookies[0],'chat',{channel:'local',text:'Só cidade'});await wait(b,e=>e.event==='chat'&&e.data.id===local.data.message.id);await sleep(250);assert.ok(!c.some(e=>e.event==='chat'&&e.data.id===local.data.message.id));
  const privateMessage=await request(cookies[0],'chat',{channel:'private',recipient:rows[1].user_id,text:'Mensagem privada <img src=x>'});await wait(b,e=>e.event==='chat'&&e.data.id===privateMessage.data.message.id);
  assert.ok(!c.some(e=>e.event==='chat'&&e.data.id===privateMessage.data.message.id));
  assert.equal((await request(cookies[2],`chat/history?channel=private&recipient=${rows[0].user_id}`)).data.messages.length,0);
  assert.equal((await request(cookies[1],`chat/history?channel=private&recipient=${rows[0].user_id}`)).data.messages.length,1);
  const carried=JSON.parse(db.prepare('SELECT state FROM characters WHERE user_id=?').get(rows[0].user_id).state);carried.inventory.push('downtown-laptop');carried.equipped.push('downtown-laptop');db.prepare('UPDATE characters SET state=? WHERE user_id=?').run(JSON.stringify(carried),rows[0].user_id);
  await request(cookies[0],'online/presence',{map:'city',x:610,y:510,walking:false,seated:{x:610,y:480}});
  const sitting=await wait(b,e=>e.event==='world'&&e.data.players.some(player=>player.id===rows[0].user_id&&player.seated?.x===610));assert.ok(sitting.players.find(player=>player.id===rows[0].user_id).equipped.includes('downtown-laptop'));
  await request(cookies[0],'online/presence',{map:'city',x:610,y:510,walking:false,seated:{x:123,y:456}});await wait(b,e=>e.event==='world'&&e.data.players.some(player=>player.id===rows[0].user_id&&player.position.x===610&&player.seated===null));
  for(const cookie of cookies.slice(0,2))assert.equal((await request(cookie,'online/presence',{map:'house',x:480,y:485})).status,200);
  await wait(a,e=>e.event==='world'&&e.data.players.length===0&&e.data.roster.some(x=>x.id===rows[1].user_id&&x.map==='house'));
  const home=await request(cookies[1],'chat',{channel:'local',text:'Minha casa'});assert.equal(home.status,200);
  assert.equal((await request(cookies[0],'chat/history?channel=local')).data.messages.length,0);
  assert.equal((await request(cookies[1],'chat/history?channel=local')).data.messages.length,1);
  for(let i=0;i<5;i++)assert.equal((await request(cookies[2],'chat',{channel:'global',text:'Teste '+i})).status,200);
  assert.equal((await request(cookies[2],'chat',{channel:'global',text:'Excesso'})).status,429);
  assert.equal((await request(cookies[1],'chat',{channel:'invalid',text:'Erro'})).status,400);
  assert.equal(JSON.parse(db.prepare('SELECT state FROM characters WHERE user_id=?').get(rows[0].user_id).state).xp,0);
  await request(cookies[1],'logout',{});await wait(a,e=>e.event==='world'&&e.data.roster.length===2);
  const replacement=await connect(cookies[0]);await wait(a,e=>e.event==='session'&&e.data.reason==='replaced');await wait(replacement,e=>e.event==='world'&&e.data.selfId===rows[0].user_id);
  assert.equal((await request(cookies[0],'state')).status,200);
 }finally{controllers.forEach(c=>c.abort());db?.close();if(child.exitCode===null&&child.signalCode===null){const exited=new Promise(resolve=>child.once('exit',resolve));child.kill();await exited}rmSync(dir,{recursive:true,force:true})}
});
