import {itemModel} from './shop-models.js';
import {onRoad} from './navigation.js';
// O analógico nunca produz um eixo perfeitamente zerado. Use o eixo dominante.
export function movementDirection(dx,dy,previous='down'){
 if(Math.hypot(dx,dy)<.001)return previous;
 return Math.abs(dx)>=Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
}
export function activeVehicle(state) {
 const item=typeof state.activeVehicle==='string'&&itemModel(state.activeVehicle);
 return item?.slot==='vehicle'&&state.inventory?.includes(item.id)&&state.equipped?.includes(item.id)&&onRoad(state.position||{})?item:null;
}
export function normalizeVehicle(state){if(!activeVehicle(state))state.activeVehicle=null;return state;}
export function useVehicle(state,{id,active=true}={}){
 if(typeof active!=='boolean'||(id!==undefined&&typeof id!=='string'))return {status:400,error:'Ação de veículo inválida.'};
 if(active===false){state.activeVehicle=null;return {message:'Você desceu do veículo.'};}
 const selected=id||state.equipped.map(itemModel).find(item=>item?.slot==='vehicle')?.id;
 const item=selected&&itemModel(selected);
 if(!item||item.slot!=='vehicle'||!state.inventory.includes(selected))return {status:403,error:'Você precisa ter um veículo no inventário.'};
 if(!state.equipped.includes(selected))return {status:403,error:'Selecione o veículo no inventário primeiro (I).'};
 if(!onRoad(state.position))return {status:403,error:'Vá até uma pista para usar seu veículo.'};
 state.activeVehicle=selected;return {message:`Você entrou em ${item.name}. V para descer.`};
}
