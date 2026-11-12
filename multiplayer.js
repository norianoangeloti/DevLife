import {canVisit} from './public/expansion-rules.js';
import {blocked,seats} from './public/navigation.js';
import {levelForXp} from './public/economy.js';
export const roomFor=(map,id)=>map==='house'?`house:${id}`:map;
export function createMultiplayer(db){
 db.exec(`CREATE TABLE IF NOT EXISTS chat_messages(id INTEGER PRIMARY KEY,channel TEXT NOT NULL,room TEXT,sender INTEGER NOT NULL,recipient INTEGER,text TEXT NOT NULL,created INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS chat_room ON chat_messages(channel,room,id);
 CREATE INDEX IF NOT EXISTS chat_private ON chat_messages(sender,recipient,id);`);
 const users=new Map(),clients=new Set(),rates=new Map();let dirty=false;
 const appearance=(id,state,position=state.position)=>({id,name:state.name,level:levelForXp(state.xp),position:{map:position.map||'city',x:position.x,y:position.y},skin:state.skin,shirt:state.shirt,pants:state.pants,hair:state.hair,gender:state.gender,hairstyle:state.hairstyle,equipped:state.equipped,inventory:state.equipped,activeVehicle:state.activeVehicle,direction:'down',walking:false});
 function write(client,event,data){if(client.res.destroyed||client.res.writableEnded)return; if(client.res.writableLength>65536){client.res.destroy();return;}client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)}
 function broadcast(){
  dirty=false;const roster=[...users.values()].map(user=>({id:user.id,name:user.name,map:user.position.map}));
  for(const client of clients){const self=users.get(client.id);if(!self)continue;write(client,'world',{selfId:client.id,room:roomFor(self.position.map,self.id),roster,players:[...users.values()].filter(user=>user.id!==client.id&&roomFor(user.position.map,user.id)===roomFor(self.position.map,self.id)),serverNow:Date.now()});}
 }
 function disconnect(id,reason='logout'){for(const client of [...clients])if(client.id===id){write(client,'session',{reason});clients.delete(client);client.res.end();}users.delete(id);dirty=true;}
 function connect(id,state,req,res,valid){
  // Uma conexão por conta evita duas abas disputando o mesmo personagem.
  disconnect(id,'replaced');
  const client={id,res,valid};clients.add(client);users.set(id,appearance(id,state));
  res.on('error',()=>res.destroy());
  res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});res.flushHeaders();
  res.on('close',()=>{clients.delete(client);if(![...clients].some(x=>x.id===id))users.delete(id);dirty=true});
  broadcast();
 }
 function presence(id,state,body){
  if(!users.has(id))return {status:409,error:'Reconecte ao mundo online.'};
  const map=body.map||'city';
  if(!canVisit(state,map)||!Number.isFinite(body.x)||!Number.isFinite(body.y)||blocked(body,map,canVisit(state,'plaza'),state.equipped,state.isCompetitionAdmin))return {status:400,error:'Posição inválida para este personagem.'};
  const user=appearance(id,state,{map,x:body.x,y:body.y});
  user.direction=['up','down','left','right'].includes(body.direction)?body.direction:'down';user.walking=body.walking===true;
  user.seated=!user.walking?(seats[map]||[]).find(seat=>seat.x===body.seated?.x&&seat.y===body.seated?.y&&Math.hypot(body.x-seat.x,body.y-seat.y)<85)||null:null;
  users.set(id,user);dirty=true;return {ok:true};
 }
 function room(id,state){return roomFor(users.get(id)?.position.map||state.position.map||'city',id)}
 function decorate(message){const row=db.prepare('SELECT state FROM characters WHERE user_id=?').get(message.sender);return {...message,name:row?JSON.parse(row.state).name:'Jogador'}}
 function history(id,state,channel,recipient){
  let rows;
  if(channel==='global')rows=db.prepare("SELECT * FROM chat_messages WHERE channel='global' ORDER BY id DESC LIMIT 60").all();
  else if(channel==='local')rows=db.prepare("SELECT * FROM chat_messages WHERE channel='local' AND room=? ORDER BY id DESC LIMIT 60").all(room(id,state));
  else if(channel==='private'&&Number.isSafeInteger(recipient)&&recipient>0)rows=db.prepare("SELECT * FROM chat_messages WHERE channel='private' AND ((sender=? AND recipient=?) OR (sender=? AND recipient=?)) ORDER BY id DESC LIMIT 60").all(id,recipient,recipient,id);
  else return {status:400,error:'Canal ou destinatário inválido.'};
  return {messages:rows.reverse().map(decorate)};
 }
 function chat(id,state,body){
  const {channel,recipient}=body,text=typeof body.text==='string'?body.text.trim():'';
  if(!['global','local','private'].includes(channel)||!text||text.length>300||/[\u0000-\u0008\u000b-\u001f]/.test(text))return {status:400,error:'Escreva uma mensagem de 1 a 300 caracteres.'};
  if(channel==='private'&&(!Number.isSafeInteger(recipient)||recipient===id||!db.prepare('SELECT id FROM users WHERE id=?').get(recipient)))return {status:400,error:'Escolha outro jogador para conversar.'};
  const now=Date.now(),recent=(rates.get(id)||[]).filter(time=>now-time<10000);
  if(recent.length>=5)return {status:429,error:'Aguarde alguns segundos antes de enviar outra mensagem.'};
  recent.push(now);rates.set(id,recent);
  const message={channel,room:channel==='local'?room(id,state):null,sender:id,recipient:channel==='private'?recipient:null,text,created:now};
  message.id=Number(db.prepare('INSERT INTO chat_messages(channel,room,sender,recipient,text,created) VALUES(?,?,?,?,?,?)').run(message.channel,message.room,id,message.recipient,text,now).lastInsertRowid);message.name=state.name;
  for(const client of clients){const user=users.get(client.id);if(channel==='global'||channel==='private'&&(client.id===id||client.id===recipient)||channel==='local'&&user&&roomFor(user.position.map,user.id)===message.room)write(client,'chat',message);}
  return {ok:true,message};
 }
 const tick=setInterval(()=>{if(dirty)broadcast()},200);tick.unref();
 const heartbeat=setInterval(()=>{for(const client of clients){const validity=client.valid();if(validity!==true)disconnect(client.id,validity==='idle'?'idle':'logout');else if(!client.res.writableEnded&&!client.res.destroyed)client.res.write(': heartbeat\n\n')}for(const [id,times] of rates)if(Date.now()-times.at(-1)>60000)rates.delete(id)},15000);heartbeat.unref();
 return {connect,presence,history,chat,disconnect,announce(event,data){for(const client of clients)write(client,event,data)},close(){clearInterval(tick);clearInterval(heartbeat);for(const client of clients)client.res.end()}};
}
