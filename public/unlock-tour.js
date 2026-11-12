import {accessFor} from './expansion-rules.js';
export const regionTours={
 plaza:{title:'Praça liberada!',from:'city',to:'plaza',fromY:420,toY:570},
 downtown:{title:'Centro liberado!',from:'plaza',to:'downtown',fromY:570,toY:420},
 usa:{title:'USA liberada!',from:'downtown',to:'usa',fromY:420,toY:420},
};
export function newlyUnlockedRegions(before,after){
 const old=accessFor(before),next=accessFor(after);
 return Object.keys(regionTours).filter(key=>!old[key]&&next[key]);
}
export function tourCamera(region,elapsed){
 const route=regionTours[region],t=Math.max(0,Math.min(1,elapsed/5000)),arrival=t>=.5;
 const p=arrival?(t-.5)*2:t*2,ease=p*p*(3-2*p);
 return {map:arrival?route.to:route.from,x:arrival?180*ease:300*ease,y:Math.max(0,Math.min(280,(arrival?route.toY:route.fromY)-180)),alpha:Math.min(1,Math.abs(t-.5)*16)};
}
