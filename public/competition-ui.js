import {drawPortrait} from './world.js';
import {projectDocument,renderProjectPreview} from './exercise-preview.js';
import {outdoor} from './navigation.js';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function competitionTime(milliseconds){const seconds=Math.max(0,Math.ceil(milliseconds/1000));return `${Math.floor(seconds/86400)}d ${String(Math.floor(seconds%86400/3600)).padStart(2,'0')}h ${String(Math.floor(seconds%3600/60)).padStart(2,'0')}m ${String(seconds%60).padStart(2,'0')}s`;}
const monthLabel=cycle=>new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',month:'long',year:'numeric'}).format(cycle.starts);
const dates=cycle=>`${new Date(cycle.starts).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})} a ${new Date(cycle.ends-1).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})}`;
export function createCompetitionUI({getState,getAccountId,api,showPanel,refreshState}){
 const $=id=>document.getElementById(id);let data=null,offset=0,busy=false,lastWinner=null;
 const stage=document.createElement('button');stage.id='competitionSpotlight';stage.className='competition-spotlight';stage.hidden=true;document.querySelector('.world-footer').prepend(stage);
 function renderSpotlight(){
  if(!data)return;const winner=data.winners[0];
  stage.innerHTML=`${winner?'<canvas id="competitionChampion" width="128" height="128" aria-label="Rosto do vencedor"></canvas>':'<span class="competition-cup" aria-hidden="true">🏆</span>'}<span class="competition-brief"><b>${winner?'1º · '+escape(winner.name):'Competição · US$ 50'}</b><em ${winner?'':'id="competitionStageTimer"'}>${winner?'Rei dos Projetos':'Envios abertos'}</em></span><span class="competition-stage-link">Ranking →</span>`;
  stage.title=winner?'Campeão: '+winner.name+' · '+winner.title:'Estádio de Competição · Ver ranking';
  if(winner)drawPortrait($('competitionChampion').getContext('2d'),{...winner.portrait,name:winner.name,equipped:winner.portrait.equipped||[]});
 }
 async function refresh(){if(!getState()||busy)return;busy=true;try{data=await api('competition');offset=data.now-Date.now();renderSpotlight();const winner=data.winners[0];if(lastWinner!==null&&winner?.cycle_id!==lastWinner)refreshState();lastWinner=winner?.cycle_id??-1;}catch{}finally{busy=false}}
 let lastTick=0;
 function tick(){
  const now=Date.now();if(now-lastTick<250)return;lastTick=now;
  stage.hidden=!data||!getState()||!outdoor(getState().position.map||'city');
  const stageTimer=$('competitionStageTimer');if(stageTimer&&data){const remaining=Math.max(0,data.cycle.ends-(Date.now()+offset));stageTimer.textContent=Math.floor(remaining/86400000)+'d '+String(Math.floor(remaining%86400000/3600000)).padStart(2,'0')+'h restantes';}
  const timer=$('competitionTimer');if(timer&&data){const ends=Number(timer.dataset.ends);timer.textContent=competitionTime(ends-(Date.now()+offset));const submit=$('sendCompetition');if(submit)submit.disabled=Date.now()+offset>=ends;}
 }
 setInterval(tick,1000);setInterval(refresh,15000);window.addEventListener('competition-updated',()=>{refreshState();refresh()});
 function ranking(){
  showPanel('COMPETIÇÃO · CAMPEÕES',`<div class="school-hero"><h2>Projetos que fizeram história.</h2><p>Um vencedor por mês do calendário · US$ 50 de recompensa.</p></div>${data?.winners.length?`<div class="competition-winners">${data.winners.map((winner,index)=>`<article class="card"><canvas data-winner="${index}" width="128" height="128" aria-label="${escape(winner.name)}"></canvas><small>${dates(winner)}</small><h3>🏆 ${escape(winner.name)}</h3><p>${escape(winner.title)}</p><b>US$ 50 entregues</b></article>`).join('')}</div>`:'<p>O primeiro campeão será anunciado depois do encerramento e da avaliação dos projetos.</p>'}`);
  document.querySelectorAll('[data-winner]').forEach(canvas=>{const winner=data.winners[Number(canvas.dataset.winner)];drawPortrait(canvas.getContext('2d'),{...winner.portrait,equipped:winner.portrait.equipped||[]})});
 }
 stage.onclick=async()=>{await refresh();ranking()};
 async function open(){
  await refresh();if(!data)return;
  const own=data.entry?await api('competition/entry?id='+data.entry.id):null;
  const draftKey='devlife.competition.'+data.cycle.id+'.'+getAccountId();let draft=own||{title:'',description:'',project:{html:'',css:'',js:''}};
  try{if(!own)draft=JSON.parse(localStorage.getItem(draftKey))||draft}catch{}
  showPanel('ESTÁDIO · PROJETO DO MÊS',`<div class="school-hero"><small>${monthLabel(data.cycle).toLocaleUpperCase('pt-BR')} · ${dates(data.cycle)}</small><h2>Crie. Envie. Conquiste.</h2><p>Construa um projeto original com HTML, CSS e JavaScript. Explique a ideia e capriche no funcionamento. O administrador avalia as entregas após o prazo e escolhe um vencedor.</p></div><div class="competition-countdown"><div><small>TEMPO PARA ENVIAR</small><b id="competitionTimer"></b></div><strong>🏆 US$ 50<small>+ Rei dos Projetos</small></strong></div><p>${data.count} participante(s) · Um projeto por jogador · Você pode atualizar até o fim do mês.</p><label>Título do projeto<input id="competitionTitle" maxlength="80" placeholder="Nome do seu projeto"></label><label>Apresente sua ideia<textarea id="competitionDescription" maxlength="1000" placeholder="O que seu projeto faz? Como usar?"></textarea></label><div class="project-tabs">${['html','css','js'].map(file=>`<button data-competition-file="${file}">${file==='html'?'index.html':file==='css'?'style.css':'script.js'}</button>`).join('')}</div><textarea id="competitionCode" class="competition-code" spellcheck="false" aria-label="Código do projeto"></textarea><div class="actions"><button id="previewCompetition">Testar prévia</button><button id="sendCompetition" class="primary">${own?'Atualizar projeto':'Enviar projeto'}</button><button id="competitionRanking" class="quiet">Ver campeões</button></div><p id="competitionFeedback" role="status">${own?'Último envio salvo.':''}</p><iframe id="competitionPreview" title="Prévia do projeto da competição" sandbox="allow-scripts" hidden></iframe>`);
  $('competitionTimer').dataset.ends=String(data.cycle.ends);
  const cycleId=data.cycle.id;
  $('competitionTitle').value=draft.title;$('competitionDescription').value=draft.description;const files=draft.project;let selected='html',sending=false;
  const capture=()=>{files[selected]=$('competitionCode').value;return {cycleId,title:$('competitionTitle').value,description:$('competitionDescription').value,project:files}};
  $('competitionCode').value=files.html;
  const saveDraft=()=>{try{localStorage.setItem(draftKey,JSON.stringify(capture()))}catch{}};
  for(const id of ['competitionTitle','competitionDescription','competitionCode'])$(id).oninput=saveDraft;
  document.querySelectorAll('[data-competition-file]').forEach(button=>button.onclick=()=>{capture();selected=button.dataset.competitionFile;$('competitionCode').value=files[selected];document.querySelectorAll('[data-competition-file]').forEach(b=>b.classList.toggle('active',b===button))});
  $('previewCompetition').onclick=()=>{capture();$('competitionPreview').hidden=false;renderProjectPreview($('competitionPreview'),projectDocument(files))};
  $('competitionRanking').onclick=ranking;
  $('sendCompetition').onclick=async()=>{if(sending)return;sending=true;const button=$('sendCompetition'),feedback=$('competitionFeedback');button.disabled=true;try{const response=await api('competition/submit',capture());if(feedback.isConnected)feedback.textContent=response.message;if(button.isConnected)button.textContent='Atualizar projeto';data=response;offset=response.now-Date.now();refreshState();try{localStorage.removeItem(draftKey)}catch{}}catch(error){if(feedback.isConnected)feedback.textContent=error.message}finally{sending=false;if(button.isConnected)button.disabled=false}};
  tick();
 }
 async function admin(cycleId,entryOffset=0){
  try{
   const response=await api(`competition/admin?offset=${entryOffset}${cycleId===undefined?'':'&cycle='+cycleId}`),selected=response.cycles.find(c=>c.id===response.selectedCycle);
   showPanel('ADMIN · ESTÁDIO DE COMPETIÇÃO',`<div class="school-hero"><h2>Avaliar projetos.</h2><p>Leia o código, teste a prévia e promova o vencedor após o encerramento. A escolha entrega US$ 50 e é definitiva para esse ciclo.</p></div><label>Ciclo<select id="adminCompetitionCycle">${response.cycles.map(c=>`<option value="${c.id}" ${c.id===response.selectedCycle?'selected':''}>${monthLabel(c)} · ${dates(c)}${c.entry_id?' · Vencedor: '+escape(c.winner_name):c.ends>response.now?' · Envios abertos':' · Aguardando avaliação'}</option>`).join('')}</select></label><p>${response.total} projeto(s) · ${selected?.ends>response.now?'O prazo de envio ainda está aberto.':selected?.entry_id?'Vencedor definido.':'Avaliação liberada.'}</p><div class="cards">${response.entries.map(entry=>`<article class="card"><small>${escape(entry.name)} · #${entry.user_id}</small><h3>${escape(entry.title)}</h3><p>${escape(entry.description)}</p><button data-review-entry="${entry.id}">Avaliar projeto</button></article>`).join('')}</div><div class="actions"><button id="previousEntries" ${entryOffset===0?'disabled':''}>← Anteriores</button><span>${Math.min(entryOffset+1,response.total)}–${Math.min(entryOffset+50,response.total)} de ${response.total}</span><button id="nextEntries" ${entryOffset+50>=response.total?'disabled':''}>Próximos →</button></div>`);
   $('adminCompetitionCycle').onchange=()=>admin(Number($('adminCompetitionCycle').value));$('previousEntries').onclick=()=>admin(response.selectedCycle,Math.max(0,entryOffset-50));$('nextEntries').onclick=()=>admin(response.selectedCycle,entryOffset+50);
   document.querySelectorAll('[data-review-entry]').forEach(button=>button.onclick=()=>review(Number(button.dataset.reviewEntry),selected));
  }catch(error){showPanel('COMPETIÇÃO',`<p>${escape(error.message)}</p>`)}
 }
 async function review(entryId,cycle){
  const entry=await api('competition/entry?id='+entryId),canPromote=cycle.ends<=Date.now()+offset&&!cycle.entry_id;
  showPanel('ADMIN · AVALIAÇÃO DO PROJETO',`<h2>${escape(entry.title)}</h2><p>${escape(entry.description)}</p><div class="project-tabs">${['html','css','js'].map(file=>`<button data-review-file="${file}">${file}</button>`).join('')}</div><textarea id="reviewCompetitionCode" class="competition-code" readonly aria-label="Código enviado pelo jogador"></textarea><div class="actions"><button id="runCompetitionProject">Abrir prévia</button><button id="promoteCompetitionWinner" class="primary" ${canPromote?'':'disabled'}>Promover · Vencedor do mês</button><button id="backCompetitionAdmin">Voltar</button></div><p id="competitionAdminFeedback" role="status">${canPromote?'A escolha entrega US$ 50 ao autor.':'Promover só fica disponível após encerrar o prazo, em ciclos sem vencedor.'}</p><iframe id="reviewCompetitionPreview" title="Prévia isolada do projeto enviado" sandbox="allow-scripts" hidden></iframe>`);
  $('reviewCompetitionCode').value=entry.project.html;document.querySelectorAll('[data-review-file]').forEach(button=>button.onclick=()=>{$('reviewCompetitionCode').value=entry.project[button.dataset.reviewFile]});
  $('runCompetitionProject').onclick=()=>{$('reviewCompetitionPreview').hidden=false;renderProjectPreview($('reviewCompetitionPreview'),projectDocument(entry.project))};
  $('backCompetitionAdmin').onclick=()=>admin(cycle.id);
  $('promoteCompetitionWinner').onclick=async()=>{if(!confirm('Definir este projeto como vencedor e entregar US$ 50 ao autor? Essa escolha é definitiva para o ciclo.'))return;$('promoteCompetitionWinner').disabled=true;try{const response=await api('competition/promote',{entryId});$('competitionAdminFeedback').textContent=response.message;refreshState();refresh()}catch(error){$('competitionAdminFeedback').textContent=error.message;$('promoteCompetitionWinner').disabled=false}};
 }
 return {open,admin,refresh,tick,winner:()=>data?.winners[0]||null};
}
