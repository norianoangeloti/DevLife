export function createOnline({getState,getMotion,onOpen}){
 let source=null,selfId=null,roster=[],remote=[],connected=false,sending=false,lastRoom='',channel='global',recipient='',messages=[],historyRevision=0;
 const root=document.createElement('div');root.id='onlineUI';root.hidden=true;
 root.innerHTML='<div class="online-hud"><span id="onlineStatus" role="status">Conectando…</span><button id="openChat" class="quiet">💬 Chat · Enter <b id="chatUnread"></b></button></div><section id="chatPanel" class="chat-panel" aria-label="Chat dos jogadores" hidden><header><b>Conversa</b><button id="closeChat" class="quiet" aria-label="Fechar chat">✕</button></header><div class="chat-channels"><button data-channel="global" class="active">Global</button><button data-channel="local">Mapa</button><button data-channel="private">Privado</button></div><label id="recipientLabel" hidden>Para <select id="chatRecipient"><option value="">Escolha um jogador online</option></select></label><ol id="chatMessages" aria-live="polite"></ol><form id="chatForm"><input id="chatInput" maxlength="300" placeholder="Sua mensagem…" aria-label="Mensagem do chat" autocomplete="off"><button type="submit" class="primary">Enviar</button></form><small id="chatError" role="status"></small></section>';
 document.querySelector('.world-footer').append(root);const $=id=>document.getElementById(id);let unread=0;
 const open=()=>{if(!getState())return;onOpen();$('chatPanel').hidden=false;$('chatInput').focus();unread=0;$('chatUnread').textContent='';};
 const close=()=>{$('chatPanel').hidden=true;$('map').focus()};
 const selected=message=>message.channel===channel&&(channel!=='local'||message.room===lastRoom)&&(channel!=='private'||Number(recipient)===(message.sender===selfId?message.recipient:message.sender));
 function show(){
  $('chatMessages').replaceChildren();
  for(const message of messages.filter(selected).slice(-60)){
   const li=document.createElement('li'),name=document.createElement('b'),text=document.createElement('span');
   name.textContent=message.sender===selfId?'Você':message.name;
   name.title=`Jogador #${message.sender}`;
   text.textContent=message.text;li.append(name,text);$('chatMessages').append(li);
  }
  $('chatMessages').scrollTop=$('chatMessages').scrollHeight;
 }
 async function history(){
  const revision=++historyRevision;
  if(channel==='private'&&!recipient){messages=messages.filter(x=>x.channel!=='private');show();return;}
  try{const response=await fetch(`./api/chat/history?channel=${channel}&recipient=${encodeURIComponent(recipient)}`);const data=await response.json();if(revision!==historyRevision)return;if(!response.ok)throw Error(data.error);messages=[...new Map([...data.messages,...messages].map(x=>[x.id,x])).values()].sort((a,b)=>a.id-b.id).slice(-180);show()}catch(error){$('chatError').textContent=error.message}
 }
 function receive(message){
  if(!messages.some(x=>x.id===message.id))messages.push(message);messages=messages.slice(-180);
  if($('chatPanel').hidden||!selected(message)){if(message.sender!==selfId){unread++;$('chatUnread').textContent=String(unread);}}
  show();
 }
 function updateRoster(){
  const old=recipient;$('chatRecipient').replaceChildren(new Option('Escolha um jogador online',''));
  for(const user of roster.filter(x=>x.id!==selfId))$('chatRecipient').append(new Option(`${user.name} #${user.id}`,String(user.id)));
  if(old&&!roster.some(x=>String(x.id)===old))$('chatRecipient').append(new Option(`Jogador #${old} · offline`,old));
  $('chatRecipient').value=old;
 }
 function connect(){
  source?.close();source=new EventSource('./api/online/events');
  source.onopen=()=>{connected=true;$('onlineStatus').textContent='● Online';};
  source.onerror=()=>{connected=false;remote=[];$('onlineStatus').textContent='Reconectando…'};
  source.addEventListener('world',event=>{
   const data=JSON.parse(event.data),now=performance.now();selfId=data.selfId;roster=data.roster;updateRoster();
   remote=data.players.map(player=>{const previous=remote.find(x=>x.id===player.id);return {...player,from:previous?interpolate(previous,now):player.position,received:now}});
   $('onlineStatus').textContent=`● ${roster.length} online`;
   if(data.room!==lastRoom){lastRoom=data.room;messages=messages.filter(x=>x.channel!=='local');if(channel==='local')history();}
  });
  source.addEventListener('chat',event=>receive(JSON.parse(event.data)));
  source.addEventListener('competition',()=>window.dispatchEvent(new Event('competition-updated')));
  source.addEventListener('session',event=>{const data=JSON.parse(event.data);source.close();connected=false;remote=[];$('onlineStatus').textContent=data.reason==='replaced'?'Conta aberta em outra aba':'Sessão encerrada';if(data.reason==='idle')window.dispatchEvent(new Event('session-idle'));});
 }
 function interpolate(player,now){const t=Math.min(1,(now-player.received)/180);return {map:player.position.map,x:player.from.x+(player.position.x-player.from.x)*t,y:player.from.y+(player.position.y-player.from.y)*t};}
 async function publish(){
  const state=getState();if(!state||!connected||sending)return;sending=true;
  try{await fetch('./api/online/presence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...state.position,...getMotion(),walking:!document.hidden&&getMotion().walking})})}catch{}finally{sending=false}
 }
 setInterval(publish,250);
 $('openChat').onclick=open;$('closeChat').onclick=close;
 root.querySelectorAll('[data-channel]').forEach(button=>button.onclick=()=>{channel=button.dataset.channel;root.querySelectorAll('[data-channel]').forEach(b=>b.classList.toggle('active',b===button));$('recipientLabel').hidden=channel!=='private';$('chatError').textContent='';history();$('chatInput').focus()});
 $('chatRecipient').onchange=()=>{recipient=$('chatRecipient').value;history()};
 $('chatForm').onsubmit=async event=>{
  event.preventDefault();const text=$('chatInput').value.trim();if(!text)return;
  if(channel==='private'&&!recipient){$('chatError').textContent='Escolha um jogador.';return;}
  const button=$('chatForm').querySelector('button');if(button.disabled)return;button.disabled=true;
  try{const response=await fetch('./api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({channel,recipient:Number(recipient),text})});const data=await response.json();if(!response.ok)throw Error(data.error);receive(data.message);$('chatInput').value='';$('chatError').textContent=''}catch(error){$('chatError').textContent=error.message}finally{button.disabled=false;$('chatInput').focus()}
 };
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!$('chatPanel').hidden){event.preventDefault();event.stopImmediatePropagation();close();return;}
  if(event.key==='Enter'&&getState()&&!document.querySelector('dialog[open]')&&!event.target.closest('input,textarea,select,button,[contenteditable="true"]')){event.preventDefault();event.stopImmediatePropagation();open();}
 },true);
 window.addEventListener('pagehide',()=>source?.close());
 window.addEventListener('pageshow',event=>{if(event.persisted&&getState())connect()});
 return {start(){root.hidden=false;connect();history()},actors(map){return remote.filter(x=>x.position.map===map).map(player=>({...player,position:interpolate(player,performance.now()),walkPhase:player.walking?performance.now()/85:0}))},typing:()=>!$('chatPanel').hidden,publish};
}
