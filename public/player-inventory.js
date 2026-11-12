import {drawPortrait,drawItem} from './world.js';
import {onRoad} from './navigation.js';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groups={Todos:['shirt','pants','hairstyle','cap','headphones','vehicle','laptop'],Roupas:['shirt','pants'],Acessórios:['hairstyle','cap','headphones'],Veículos:['vehicle'],Notebooks:['laptop']};
export function createPlayerInventory({getState,getContent,action,showPanel,toggleVehicle,openHome,openNotebook}){
 const $=id=>document.getElementById(id);let selected='Todos';
 function open(tab=selected){
  selected=tab;const state=getState(),catalog=getContent().items;
  const items=catalog.filter(x=>state.inventory.includes(x.id)&&groups[tab].includes(x.slot)).sort((a,b)=>Number(state.equipped.includes(b.id))-Number(state.equipped.includes(a.id))||a.name.localeCompare(b.name,'pt-BR'));
  const laptop=catalog.find(x=>x.slot==='laptop'&&state.equipped.includes(x.id));
  const vehicle=catalog.find(x=>x.slot==='vehicle'&&state.equipped.includes(x.id));
  const equipped=catalog.filter(x=>state.equipped.includes(x.id)&&groups.Todos.includes(x.slot)&&x.slot!=='vehicle');
  showPanel('INVENTÁRIO · PERSONAGEM',`<div class="player-inventory-head"><div><div class="eyebrow">SEUS ITENS · I PARA FECHAR</div><h2>Meu inventário</h2><p>Equipe roupas e acessórios. Selecione seu veículo ou notebook.</p></div><span class="badge">${items.length} itens</span></div><div class="player-inventory-layout"><aside class="player-equipment"><canvas id="inventoryPortrait" width="128" height="128" aria-label="Personagem com os itens equipados"></canvas><h3>${escape(state.name)}</h3><p class="inventory-equipped-list">${equipped.map(x=>escape(x.name)).join('<br>')||'Visual inicial'}</p><div class="vehicle-state"><small>${state.activeVehicle?'EM USO':'TRANSPORTE'}</small><b>${escape(vehicle?.name||'A pé')}</b><p>${state.activeVehicle?'Você está no veículo. V para descer.':vehicle?'Selecionado. Vá até a pista e pressione V para usar.':'Selecione um veículo na aba Veículos.'}</p>${vehicle?`<button id="inventoryUseVehicle" class="${state.activeVehicle?'secondary':'primary'}" ${!state.activeVehicle&&!onRoad(state.position)?'disabled':''}>${state.activeVehicle?'Descer do veículo':'Usar veículo'} · V</button>`:''}</div>${laptop?'<button id="inventoryOpenLaptop" class="primary">Abrir notebook · N</button>':''}<button id="inventoryHome" class="quiet">Casa e decoração →</button><p class="inventory-shortcuts"><kbd>I</kbd> Inventário<br><kbd>V</kbd> Entrar / sair do veículo<br><kbd>B</kbd> Segurar / guardar notebook<br><kbd>N</kbd> Usar notebook</p></aside><section><div class="notebook-tabs player-inventory-tabs">${Object.keys(groups).map(name=>`<button data-player-category="${name}" class="${name===tab?'active':''}">${name}</button>`).join('')}</div><div class="item-grid">${items.map(item=>{
   const isEquipped=state.equipped.includes(item.id),fits=item.gender==='all'||item.gender===state.gender,isVehicle=item.slot==='vehicle';
   return `<article class="item-card ${isEquipped?'equipped':''}"><div class="item-art"><canvas width="480" height="315" data-player-art="${item.id}" aria-label="${escape(item.name)}"></canvas>${isEquipped?'<span>✓ '+(isVehicle?'SELECIONADO':'EQUIPADO')+'</span>':''}</div><small>${isVehicle?'VEÍCULO':item.slot==='laptop'?'NOTEBOOK':groups.Roupas.includes(item.slot)?'ROUPA':'ACESSÓRIO'}</small><h3>${escape(item.name)}</h3><p>${escape(isVehicle?(item.baseId==='car'?'Carro · uso manual na pista':'Moto · uso manual na pista'):item.description)}</p><button data-player-item="${item.id}" class="${isEquipped?'secondary':'primary'}" ${!fits&&!isEquipped?'disabled':''}>${isEquipped?'Guardar':!fits?'Outro personagem':isVehicle?'Selecionar':'Equipar'}</button></article>`
  }).join('')||'<div class="empty-state">Nenhum item nesta categoria.<br>Os itens comprados aparecem aqui.</div>'}</div></section></div>`);
  drawPortrait($('inventoryPortrait').getContext('2d'),state);
  document.querySelectorAll('[data-player-art]').forEach(canvas=>drawItem(canvas.getContext('2d'),catalog.find(x=>x.id===canvas.dataset.playerArt)));
  document.querySelectorAll('[data-player-category]').forEach(button=>button.onclick=()=>open(button.dataset.playerCategory));
  document.querySelectorAll('[data-player-item]').forEach(button=>button.onclick=async()=>{button.disabled=true;const scroll=$('panel').scrollTop;const result=await action('equip',{id:button.dataset.playerItem});if(result&&$('panel').open&&$('panelTag').textContent==='INVENTÁRIO · PERSONAGEM'){open(tab);$('panel').scrollTop=scroll}else if(button.isConnected)button.disabled=false});
  $('inventoryHome').onclick=openHome;
  if($('inventoryOpenLaptop'))$('inventoryOpenLaptop').onclick=openNotebook;
  if($('inventoryUseVehicle'))$('inventoryUseVehicle').onclick=async()=>{const button=$('inventoryUseVehicle');button.disabled=true;const result=await toggleVehicle();if(result&&$('panel').open&&$('panelTag').textContent==='INVENTÁRIO · PERSONAGEM')open(tab);else if(button.isConnected)button.disabled=false};
 }
 return {open};
}
