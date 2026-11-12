import test from 'node:test';
import assert from 'node:assert/strict';
import {accessFor,canVisit,clubExamIds,clubTracks,dollarPackages,currencyPackages,libraryBookIds,examPrerequisiteError} from '../public/expansion-rules.js';
import {books} from '../books.js';
import {clubLessons,checkClub,normalizeExpansion,regionalJobs,nextRegionalJob,finishRegionalJob,checkRegionalJob,systemBackendLesson} from '../expansion-content.js';
import {schoolLessons,schoolExams} from '../school-content.js';
import {referenceProject,checkProject} from '../project-exams.js';
import {regionalItems} from '../public/shop-models.js';
import {regionalPrerequisites} from './helpers/expansion-access.js';
import {blocked,move,doorAt,regionalBuildings,stationAt,safePosition,travelPassage,obstacles} from '../public/navigation.js';
const completed=()=>[...schoolExams.map(x=>x.id),...clubExamIds];
test('Leituras e participação são condições das provas; provas anteriores continuam válidas',()=>{
 assert.deepEqual(libraryBookIds,books.map(book=>book.id));
 const exam=schoolExams.find(x=>x.stage==='intermediate'),state={completed:completed().filter(id=>id!==exam.id),...regionalPrerequisites()};
 for(const id of libraryBookIds){const partial=structuredClone(state);delete partial.bookProgress[id].completedAt;assert.match(examPrerequisiteError(partial,exam),/livros/);}
 const legacy={...state,bookProgress:Object.fromEntries(Object.entries(state.bookProgress).map(([id,p])=>[id.replace('-pt',''),p]))};assert.equal(examPrerequisiteError(legacy,exam),'');
 const advanced=schoolExams.find(x=>x.stage==='advanced');
 for(const final of [advanced,...clubLessons.filter(x=>x.exam)]){const before={completed:[],competitionParticipated:false};assert.match(examPrerequisiteError(before,final),/competição/);assert.equal(examPrerequisiteError({...before,competitionParticipated:true},final),'');}
 assert.equal(accessFor({completed:completed()}).usa,true);
});
test('Pacotes das três moedas mantêm unidades, preços e bônus progressivos consistentes',()=>{
 const ids=new Set();
 for(const [currency,packs] of Object.entries(currencyPackages)){
  assert.equal(packs.length,5);
  assert.deepEqual(packs.map(x=>x.priceCents),[2999,6999,12999,18999,24999]);
  for(const [index,pack] of packs.entries()){
   assert.equal(pack.currency,currency);assert.ok(Number.isSafeInteger(pack.creditAmount));assert.ok(pack.creditAmount>0);
   assert.equal(pack.creditAmount,pack.amount*(currency==='coins'?1:100));
   assert.ok(!ids.has(pack.id));ids.add(pack.id);
   if(index){const previous=packs[index-1];assert.ok(pack.amount>previous.amount);assert.ok(pack.amount/pack.priceCents>previous.amount/previous.priceCents);}
  }
 }
 assert.equal(currencyPackages.coins[0].amount,4500);assert.equal(currencyPackages.brl[0].amount,3000);
 assert.ok(currencyPackages.brl.at(-1).creditAmount<regionalItems.filter(x=>x.region==='downtown').reduce((sum,x)=>sum+x.price,0));
 assert.equal(currencyPackages.usd[0].amount,100);assert.equal(currencyPackages.usd.at(-1).amount,1000);
});
test('A última prova aprovada continua sendo o gatilho de cada passagem',()=>{
 const state={completed:['js-door','school-javascript-beginner-10']};
 assert.deepEqual(accessFor(state),{plaza:false,downtown:false,usa:false});
 state.completed.push('exam-javascript-beginner');assert.equal(accessFor(state).plaza,true);assert.equal(accessFor(state).downtown,false);
 state.completed.push('exam-javascript-intermediate');assert.equal(accessFor(state).downtown,false);
 state.completed.push('exam-html-intermediate','exam-css-intermediate');assert.equal(accessFor(state).downtown,true);
 state.bookProgress=regionalPrerequisites().bookProgress;assert.equal(accessFor(state).downtown,true);
 state.completed.push('exam-html-advanced','exam-css-advanced','exam-javascript-advanced','devclub-node-exam');assert.equal(accessFor(state).usa,false);
 state.completed.push('devclub-react-exam');assert.equal(accessFor(state).usa,false);
 state.completed.push('devclub-ts-front-exam');assert.equal(accessFor(state).usa,false);
 state.completed.push('devclub-ts-back-exam');assert.equal(accessFor(state).usa,true);
 state.competitionParticipated=true;assert.equal(accessFor(state).usa,true);
 assert.ok(schoolLessons.every(x=>!x.opensGate));assert.deepEqual(schoolExams.filter(x=>x.opensGate).map(x=>x.id),['exam-javascript-beginner']);
 for(const map of ['usa','us-shop','us-office'])assert.equal(canVisit({completed:[]},map),false);
});
test('Prova iniciante exige abrirPorta e não aceita retornar false',()=>{
 const project=referenceProject('beginner');assert.deepEqual(checkProject('JavaScript','beginner',project),[]);
 assert.ok(checkProject('JavaScript','beginner',{...project,js:project.js.replace('return true','return false')}).length);
});
test('DevClub possui quatro trilhas progressivas, respostas testadas e casos de estado React',()=>{
 for(const track of Object.keys(clubTracks)){
  const lessons=clubLessons.filter(x=>x.track===track);assert.equal(lessons.length,track.startsWith('ts-')?6:21);assert.equal(lessons.at(-1).exam,true);
  for(const [index,lesson] of lessons.entries()){
   assert.deepEqual(lesson.requires,index?[lessons[index-1].id]:[]);
   assert.deepEqual(checkClub(lesson,lesson.solution),[],lesson.id);
   assert.ok(checkClub(lesson,lesson.starter).length,lesson.id);
  }
 }
 const jsx=clubLessons.find(x=>x.id==='devclub-react-1');assert.deepEqual(checkClub(jsx,'function Component(){return <h1>DevClub</h1>}'),[]);
 const counter=clubLessons.find(x=>x.title==='Estado com useState');
 assert.ok(checkClub(counter,'function Component(){return React.createElement("button",{onClick:()=>{}},"0")}').length);
 const typed=clubLessons.find(x=>x.typescript);
 assert.match(checkClub(typed,typed.solution+'\nconst invalido: number = "texto";')[0],/TypeScript/);
});
test('Trabalho americano paga um dólar e mantém intervalo de 12h após recarregar',()=>{
 const state=normalizeExpansion({completed:completed(),...regionalPrerequisites()});const now=100000;
 assert.equal(finishRegionalJob(state,'usa',now).job.rewardCents,100);assert.equal(state.wallets.usd,100);assert.equal(state.wallets.brl,0);
 assert.equal(finishRegionalJob(state,'usa',now+43199999).status,409);
 const reloaded=normalizeExpansion(JSON.parse(JSON.stringify(state)));
 assert.equal(finishRegionalJob(reloaded,'usa',now+43200000).job.rewardCents,100);assert.equal(reloaded.wallets.usd,200);
 assert.equal(reloaded.regionalWork.usa.completed.length,2);
});
test('Contratos brasileiros não gastam nem pagam dólares e não podem ser repetidos',()=>{
 for(const job of regionalJobs.downtown.filter(x=>x.kind!=='project')){assert.deepEqual(checkRegionalJob(job,job.solution),[],job.id);assert.ok(checkRegionalJob(job,job.starter).length,job.id);}
 const state=normalizeExpansion({completed:completed(),...regionalPrerequisites()});const first=nextRegionalJob(state,'downtown');
 assert.deepEqual(checkRegionalJob(first,first.solution),[]);assert.ok(checkRegionalJob(first,first.starter).length);
 finishRegionalJob(state,'downtown',100);assert.equal(state.wallets.brl,first.rewardCents);assert.equal(state.wallets.usd,0);
 assert.notEqual(nextRegionalJob(state,'downtown').id,first.id);assert.equal(finishRegionalJob({completed:[]},'usa').status,403);
});
test('Sites exigem nome da empresa e projetos americanos incluem backend',()=>{
 for(const job of [...regionalJobs.downtown.filter(x=>x.kind==='project'),...regionalJobs.usa.filter(x=>x.kind==='project')]){
  const p=referenceProject(job.stage);p.html=p.html.replace(/<h1>.*?<\/h1>/,`<h1>${job.company}</h1>`);
  if(job.fullStack)p.backend=job.system?systemBackendLesson(job).solution:clubLessons.find(x=>x.id==='devclub-node-exam').solution;
  if(job.system)p.html+='<table><caption>Registros</caption><thead><tr><th scope="col">ID</th><th scope="col">Nome</th></tr></thead><tbody></tbody></table>';
  assert.deepEqual(checkRegionalJob(job,JSON.stringify(p)),[],job.id);
  if(job.fullStack){delete p.backend;assert.ok(checkRegionalJob(job,JSON.stringify(p)).length);}
 }
});
test('Novos mapas possuem portas alcançáveis, vias livres e retorno preservado',()=>{
 for(const [region,buildings] of Object.entries(regionalBuildings)){
  for(const building of buildings){const p={x:building.x+building.w/2,y:building.entrance==='north'?building.y-16:building.y+building.h+16,map:region};assert.equal(blocked(p,region),false);assert.equal(doorAt(p,region).id,building.id);}
  const p=move({x:30,y:420},900,0,region,true);assert.equal(p.x,930);
  assert.equal(safePosition({x:60,y:420,map:region},true).map,region);
 }
 assert.equal(stationAt({x:670,y:450},'library'),undefined);
 assert.equal(travelPassage({map:'plaza',x:890,y:570}).destination.map,'downtown');
});
test('Lojas regionais têm apenas os tipos pedidos, moedas próprias e pacotes até mil dólares',()=>{
 for(const region of ['downtown','usa']){
  const items=regionalItems.filter(x=>x.region===region);assert.equal(items.length,7);
  assert.ok(items.every(x=>['shirt','pants','computer','monitor','vehicle','laptop'].includes(x.slot)&&x.currency===(region==='usa'?'usd':'brl')));
 }
 assert.deepEqual(dollarPackages[0],{id:'usd-100',dollars:100,priceCents:2999});assert.equal(dollarPackages.at(-1).dollars,1000);
});

test('Portais visíveis aceitam interação antes da borda e indicam o destino correto',()=>{
 assert.equal(travelPassage({map:'downtown',x:890,y:420}).destination.map,'usa');
 assert.equal(travelPassage({map:'downtown',x:70,y:420}).destination.map,'plaza');
 assert.equal(travelPassage({map:'usa',x:70,y:420}).destination.map,'downtown');
 assert.equal(travelPassage({map:'city',x:870,y:420}).access,'plaza');
 assert.equal(travelPassage({map:'downtown',x:890,y:280}),null);
});

test('As pistas deixam espaço para a carroceria e as passagens ficam na rua da praça',()=>{
 for(const [map,lanes] of [['city',[404,436]],['plaza',[552,588]],['downtown',[383,457]],['usa',[383,457]]]){
  for(const y of lanes)for(let x=70;x<=890;x+=20){
   const car={left:x-30,right:x+30,top:y-15,bottom:y+15};
   assert.ok(!obstacles(map,true).some(b=>car.right>b.x&&car.left<b.x+b.w&&car.bottom>b.y&&car.top<b.y+b.h),`${map}: carro bloqueado em ${x},${y}`);
  }
 }
 assert.equal(travelPassage({map:'library',x:700,y:450}),null);
 assert.equal(stationAt({x:283,y:360},'devclub').id,'node-computer');
 assert.equal(stationAt({x:410,y:360},'devclub').id,'react-computer');
 assert.equal(stationAt({x:537,y:360},'devclub').id,'ts-front-computer');
 assert.equal(stationAt({x:664,y:360},'devclub').id,'ts-back-computer');
 assert.equal(travelPassage({map:'plaza',x:890,y:570}).label,'Centro');
 assert.equal(travelPassage({map:'downtown',x:890,y:420}).label,'USA');
});
