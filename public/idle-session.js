export const IDLE_TIMEOUT_MS=15*60*1000;
export function createIdleTracker({now=Date.now,onActivity=()=>{},onIdle=()=>{}}={}){
 let active=false,last=0,sent=-Infinity,dirty=false;
 function flush(){if(dirty&&now()-sent>=10000){sent=now();dirty=false;onActivity();}}
 function tick(){if(active&&now()-last>=IDLE_TIMEOUT_MS){active=false;onIdle();return true;}if(active)flush();return !active;}
 return {
  start(){active=true;last=now();sent=-Infinity;dirty=false;},
  activity(){if(!active||tick())return;last=now();dirty=true;flush();},
  tick,
 };
}
