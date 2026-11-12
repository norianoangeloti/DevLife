import {blocked,onRoad} from './navigation.js';
import {levelForXp} from './economy.js';
const point=(x,y,kind,label,wait=12000)=>({x,y,kind,label,wait});
const places={
 city:{school:point(495,292,'study','Estudando na Dev School',18000),office:point(755,325,'work','Praticando para uma entrevista',18000),park:point(358,374,'rest','Revisando anotações',8000),shop:point(485,615,'rest','Explorando as lojas',8000),home:point(197,325,'study','Praticando um exercício',14000)},
 plaza:{library:point(480,322,'study','Lendo um capítulo na biblioteca',20000),left:point(310,445,'study','Revisando JavaScript',14000),right:point(650,445,'work','Planejando um projeto',14000),garden:point(750,480,'rest','Explorando o jardim',8000),walk:point(480,514,'rest','Passeando pela praça',8000)},
 downtown:{office:point(195,290,'work','Investigando um bug na CodeWorks',20000),club:point(480,270,'study','Estudando no DevClub',20000),shop:point(765,290,'rest','Visitando a Urban Store',8000),square:point(700,520,'study','Revisando código com a comunidade',14000),park:point(300,520,'rest','Explorando o centro',8000)},
 usa:{office:point(290,310,'work','Planejando uma entrega Full Stack',22000),shop:point(695,310,'rest','Visitando a Premium Store',10000),square:point(480,290,'study','Estudando arquitetura de sistemas',18000),park:point(260,530,'study','Revisando testes de uma API',14000),walk:point(700,530,'rest','Explorando a cidade',8000)},
};
const profiles=[
 ['city','ana','Ana','HTML',['school','park','office','home'],0,0,'#dba47b','#b09ab7','female','ponytail'],
 ['city','lucas','Lucas','CSS',['office','park','school','shop'],2,1,'#8d5524','#7693a2','male','short'],
 ['city','rafa','Rafa','JavaScript',['home','shop','school','office'],4,2,'#f1c6a8','#a98468','male','curly'],
 ['plaza','clara','Clara','JavaScript',['library','left','walk','right'],6,2,'#8d5524','#bc8ca7','female','curly'],
 ['plaza','pedro','Pedro','HTML',['right','garden','library','walk'],4,1,'#dba47b','#739e8d','male','short'],
 ['plaza','yasmin','Yasmin','CSS',['left','library','garden','right'],7,3,'#f1c6a8','#878fbd','female','bob'],
 ['downtown','nina','Nina','Node.js',['club','park','office','square'],10,4,'#dba47b','#82a293','female','ponytail'],
 ['downtown','theo','Theo','React',['office','square','club','shop'],12,5,'#8d5524','#799ac2','male','curly'],
 ['downtown','camila','Camila','JavaScript',['shop','club','office','park'],14,6,'#f1c6a8','#b08fba','female','bob'],
 ['usa','ava','Ava','React',['office','park','square','shop'],20,12,'#8d5524','#ac99c5','female','ponytail'],
 ['usa','noah','Noah','Node.js',['square','walk','office','park'],24,14,'#f1c6a8','#7c9cba','male','short'],
 ['usa','zoe','Zoé','Full Stack',['shop','square','office','walk'],22,13,'#dba47b','#7eaea8','female','curly'],
];
export const npcProfiles=profiles.map(([map,id,name,subject,route,baseStudies,baseProjects,skin,shirt,gender,hairstyle],index)=>({map,id,name,subject,route:route.map(key=>({...places[map][key],x:places[map][key].x+(index%3-1)*32})),baseStudies,baseProjects,skin,shirt,gender,hairstyle,hair:['#51423f','#252b37','#ac593e'][index%3],pants:'#344d62',equipped:[],speed:42+(index%3)*4,phaseMs:index*11000}));
// Malha compartilhada: rotas buscam caminhos livres e preferem calçadas/faixas.
const STEP=16,grids=new Map(),plans=new Map();
function gridFor(map){
 if(grids.has(map))return grids.get(map);
 const cells=[];for(let y=96;y<=608;y+=STEP)for(let x=64;x<=848;x+=STEP)if(!blocked({x,y},map,true))cells.push({x,y,key:`${x},${y}`});
 const byKey=new Map(cells.map(c=>[c.key,c]));const grid={cells,byKey};grids.set(map,grid);return grid;
}
function nearest(grid,point){return grid.cells.reduce((best,cell)=>Math.hypot(cell.x-point.x,cell.y-point.y)<Math.hypot(best.x-point.x,best.y-point.y)?cell:best)}
function segmentClear(map,a,b){const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4);for(let i=0;i<=n;i++)if(blocked({x:a.x+(b.x-a.x)*i/(n||1),y:a.y+(b.y-a.y)*i/(n||1)},map,true))return false;return true}
function roadCost(map,cell){if(!onRoad({...cell,map}))return 1;const crossings=map==='city'?[365,610]:map==='plaza'?[260,690]:[335,595];return crossings.some(x=>Math.abs(cell.x-x)<19)?1.3:5;}
function findPath(map,from,to){
 const grid=gridFor(map),start=nearest(grid,from),end=nearest(grid,to),open=[start],cost=new Map([[start.key,0]]),previous=new Map(),closed=new Set();
 const heuristic=c=>(Math.abs(c.x-end.x)+Math.abs(c.y-end.y))/STEP;
 while(open.length){let best=0;for(let i=1;i<open.length;i++)if(cost.get(open[i].key)+heuristic(open[i])<cost.get(open[best].key)+heuristic(open[best]))best=i;
  const current=open.splice(best,1)[0];if(closed.has(current.key))continue;if(current.key===end.key){const path=[end];let cursor=end;while(previous.has(cursor.key)){cursor=previous.get(cursor.key);path.unshift(cursor)}return path;}
  closed.add(current.key);
  for(const [dx,dy] of [[STEP,0],[-STEP,0],[0,STEP],[0,-STEP]]){const next=grid.byKey.get(`${current.x+dx},${current.y+dy}`);if(!next||closed.has(next.key)||!segmentClear(map,current,next))continue;const value=cost.get(current.key)+roadCost(map,next);if(value<(cost.get(next.key)??Infinity)){cost.set(next.key,value);previous.set(next.key,current);open.push(next)}}
 }
 throw new Error(`Não há rota livre para NPC em ${map}.`);
}
export function npcPlan(profile){
 if(plans.has(profile.id))return plans.get(profile.id);
 const phases=[];let duration=0;
 for(let i=0;i<profile.route.length;i++){
  const place=profile.route[i],path=findPath(profile.map,place,profile.route[(i+1)%profile.route.length]),lengths=path.slice(1).map((p,j)=>Math.hypot(p.x-path[j].x,p.y-path[j].y)),length=lengths.reduce((a,b)=>a+b,0);
  phases.push({kind:place.kind,label:place.label,start:duration,duration:place.wait,position:path[0]});duration+=place.wait;
  const travelMs=Math.max(1,length/profile.speed*1000);phases.push({kind:'walk',label:'Explorando a cidade',start:duration,duration:travelMs,path,lengths,length});duration+=travelMs;
 }
 const plan={phases,duration,studies:phases.filter(x=>x.kind==='study').length,projects:phases.filter(x=>x.kind==='work').length};plans.set(profile.id,plan);return plan;
}
function careerFor(studies,projects){if(studies<3)return 'Estudante';if(projects<3)return 'Estagiário';if(projects<8)return 'Dev Júnior';if(projects<16)return 'Dev Pleno';if(projects<28)return 'Dev Sênior';return 'Tech Lead'}
export function npcAt(profile,elapsedMs=0){
 const plan=npcPlan(profile),elapsed=Math.max(0,elapsedMs)+profile.phaseMs,laps=Math.floor(elapsed/plan.duration),time=elapsed%plan.duration;
 const phase=plan.phases.find(p=>time>=p.start&&time<p.start+p.duration)||plan.phases.at(-1);
 const done=plan.phases.filter(p=>p.start+p.duration<=time),studies=profile.baseStudies+laps*plan.studies+done.filter(p=>p.kind==='study').length,projects=profile.baseProjects+laps*plan.projects+done.filter(p=>p.kind==='work').length;
 let position=phase.position,direction='down';
 if(phase.kind==='walk'){
  let remaining=phase.length*(time-phase.start)/phase.duration;position=phase.path.at(-1);
  for(let i=0;i<phase.lengths.length;i++){const distance=phase.lengths[i];if(remaining<=distance){const a=phase.path[i],b=phase.path[i+1],t=distance?remaining/distance:0;position={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};direction=b.x>a.x?'right':b.x<a.x?'left':b.y>a.y?'down':'up';break}remaining-=distance;}
 }
 const xp=studies*120+projects*300;
 return {...profile,...position,walking:phase.kind==='walk',walkPhase:phase.kind==='walk'?elapsed/85:0,direction,activity:phase.label,studies,projects,xp,level:levelForXp(xp),career:careerFor(studies,projects),nextGoal:phase.kind==='walk'?'Chegar à próxima parada':phase.kind==='study'?'Concluir a sessão de estudo':phase.kind==='work'?'Concluir um projeto de prática':'Voltar à rotina de estudos'};
}
export function npcsAt(map,elapsedMs=0){return npcProfiles.filter(n=>n.map===map).map(n=>npcAt(n,elapsedMs))}
export function nearbyNpc(actors,position,radius=52){return actors.map(actor=>({actor,d:Math.hypot(actor.x-position.x,actor.y-position.y)})).filter(x=>x.d<=radius).sort((a,b)=>a.d-b.d)[0]?.actor||null;}
export function createNpcSimulation(){
 const pauses=new Map(),offsets=new Map();
 return {actors(map,time){return npcProfiles.filter(n=>n.map===map).map(n=>npcAt(n,pauses.get(n.id)?.frozenTime??Math.max(0,time-(offsets.get(n.id)||0))))},pause(id,time){if(!pauses.has(id))pauses.set(id,{startedAt:time,frozenTime:Math.max(0,time-(offsets.get(id)||0))})},resume(id,time){const pause=pauses.get(id);if(pause){offsets.set(id,(offsets.get(id)||0)+Math.max(0,time-pause.startedAt));pauses.delete(id)}}};
}
