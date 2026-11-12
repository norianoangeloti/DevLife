import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createCompetition,competitionMonth,COMPETITION_PRIZE} from '../competition.js';
const project={html:'<main><h1>Projeto original</h1><button>Testar</button></main>',css:'h1 {color:green}',js:'console.log("Projeto")'};
test('Calendário respeita fuso, fevereiro de 28/29 dias e mudança de ano',()=>{
 assert.equal(competitionMonth(Date.parse('2026-11-01T02:59:59.999Z')).month,10);
 assert.equal(competitionMonth(Date.parse('2026-11-01T03:00:00.000Z')).month,11);
 for(const [year,days] of [[2027,28],[2028,29]]){const month=competitionMonth(Date.UTC(year,1,15));assert.equal(month.ends-month.starts,days*86400000);}
 const december=competitionMonth(Date.UTC(2026,11,20));assert.equal(december.ends,Date.UTC(2027,0,1,3));
});
function fixture(){
 const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON;CREATE TABLE users(id INTEGER PRIMARY KEY);CREATE TABLE characters(user_id INTEGER PRIMARY KEY,state TEXT NOT NULL);');
 for(let id=1;id<=3;id++){db.prepare('INSERT INTO users VALUES(?)').run(id);db.prepare('INSERT INTO characters VALUES(?,?)').run(id,JSON.stringify({name:'Player '+id,xp:123,money:500,skills:{HTML:3},wallets:{brl:12000,usd:1234},skin:'#dba47b',shirt:'#ffffff',equipped:[],position:{map:'city',x:430,y:450}}));}
 let time=Date.UTC(2026,9,28),announcements=0;const competition=createCompetition(db,{now:()=>time,onWinner:()=>announcements++});db.prepare("INSERT INTO game_roles VALUES(1,'competition-admin')").run();
 return {db,competition,now:()=>time,advance:ms=>{time+=ms},announcements:()=>announcements,state:id=>JSON.parse(db.prepare('SELECT state FROM characters WHERE user_id=?').get(id).state)};
}
test('Ciclo acompanha o mês de Brasília e vira exatamente à meia-noite do dia 1',()=>{
 const f=fixture();try{const current=f.competition.info(2).cycle;assert.equal(current.starts,Date.UTC(2026,9,1,3));assert.equal(current.ends,Date.UTC(2026,10,1,3));assert.ok(current.ends-f.now()<5*86400000);f.advance(current.ends-f.now()-1);assert.equal(f.competition.info(2).cycle.id,0);f.advance(1);assert.equal(f.competition.info(2).cycle.id,1);const again=createCompetition(f.db,{now:()=>current.ends});assert.deepEqual(again.info(2).cycle,f.competition.info(2).cycle)}finally{f.db.close()}
});
test('Projetos são únicos por jogador e ciclo, atualizáveis no prazo e privados até avaliação',()=>{
 const f=fixture(),stadium={position:{map:'stadium'}};try{
  assert.equal(f.competition.hasParticipated(2),false);
  assert.equal(f.competition.submit(2,{position:{map:'city'}},{cycleId:0,title:'Teste',description:'Uma descrição válida para o projeto.',project}).status,403);
  const first=f.competition.submit(2,stadium,{cycleId:0,title:'Projeto A',description:'Uma descrição válida para o projeto.',project});assert.equal(first.ok,true);assert.equal(f.competition.hasParticipated(2),true);assert.equal(f.state(2).competitionParticipated,true);const id=first.entry.id;
  const update=f.competition.submit(2,stadium,{cycleId:0,title:'Projeto revisado',description:'Uma descrição revisada para o projeto.',project});assert.equal(update.entry.id,id);assert.equal(update.count,1);
  assert.equal(f.competition.entry(3,stadium,id).status,403);assert.equal(f.competition.entry(2,stadium,id).title,'Projeto revisado');assert.equal(f.competition.entry(1,{position:{map:'city'}},id).status,403);assert.deepEqual(f.competition.entry(1,{position:{map:'house'}},id).project,project);
  assert.equal(f.competition.info(3).entry,null);assert.ok(!JSON.stringify(f.competition.info(3)).includes('Projeto revisado'));
  f.advance(f.competition.info(2).cycle.ends-f.now());assert.equal(f.competition.hasParticipated(2),true);assert.equal(f.competition.submit(2,stadium,{cycleId:0,title:'Tarde',description:'Uma descrição válida para o projeto.',project}).status,409);
  assert.equal(f.competition.submit(2,stadium,{cycleId:1,title:'Novo mês',description:'Uma descrição válida para o projeto.',project}).ok,true);
 }finally{f.db.close()}
});
test('Só o administrador promove após o prazo e paga exatamente US$ 50 uma única vez',()=>{
 const f=fixture(),home={position:{map:'house'}},stadium={position:{map:'stadium'}};try{
  const submission=f.competition.submit(2,stadium,{cycleId:0,title:'Projeto vencedor',description:'Uma descrição válida para o projeto.',project});const entryId=submission.entry.id;
  assert.equal(f.competition.promote(3,{...home,isCompetitionAdmin:true},{entryId}).status,403);
  assert.equal(f.competition.admin(2,home).status,403);assert.equal(f.competition.promote(1,home,{entryId}).status,409);
  f.advance(f.competition.info(2).cycle.ends-f.now());const before=f.state(2);assert.equal(f.competition.promote(1,home,{entryId}).ok,true);const after=f.state(2);
  assert.equal(after.wallets.usd,before.wallets.usd+COMPETITION_PRIZE);assert.equal(after.wallets.brl,before.wallets.brl);assert.equal(after.xp,before.xp);assert.equal(after.money,before.money);assert.equal(f.announcements(),1);
  assert.equal(after.achievements.filter(id=>id==='project-king').length,1);assert.equal(f.competition.hasWon(2),true);assert.equal(f.competition.hasWon(3),false);
  assert.equal(f.competition.promote(1,home,{entryId}).status,409);assert.equal(f.state(2).wallets.usd,after.wallets.usd);
  const winner=f.competition.info(3).winners[0];assert.equal(winner.name,'Player 2');assert.equal(winner.title,'Projeto vencedor');assert.equal(winner.prize,5000);assert.ok(!('project' in winner));assert.ok(!('wallets' in winner.portrait));
 }finally{f.db.close()}
});
test('Administração pagina as entregas para não ocultar participantes',()=>{
 const f=fixture();try{
  f.competition.info(1);for(let id=4;id<59;id++){f.db.prepare('INSERT INTO users VALUES(?)').run(id);f.db.prepare('INSERT INTO characters VALUES(?,?)').run(id,JSON.stringify({name:'Participante '+id}));f.db.prepare('INSERT INTO competition_entries(cycle_id,user_id,title,description,project,submitted) VALUES(0,?,?,?,?,?)').run(id,'Projeto '+id,'Descrição para avaliação',JSON.stringify(project),id);}
  const page=f.competition.admin(1,{position:{map:'house'}},{cycleId:0,offset:50});assert.equal(page.total,55);assert.equal(page.entries.length,5);
 }finally{f.db.close()}
});
test('Migração do prazo fixo mantém projetos, vencedor, prêmio e troféu sem repetir pagamento',()=>{
 const f=fixture();try{
  const entry=f.competition.submit(2,{position:{map:'stadium'}},{cycleId:0,title:'Projeto preservado',description:'Um projeto que precisa permanecer salvo.',project}).entry;
  const oldEpoch=f.now();f.db.prepare('UPDATE competition_config SET epoch=?,calendar_version=0').run(oldEpoch);f.db.prepare('UPDATE competition_cycles SET starts=?,ends=? WHERE id=0').run(oldEpoch,oldEpoch+30*86400000);f.advance(30*86400000);
  assert.equal(f.competition.promote(1,{position:{map:'house'}},{entryId:entry.id}).ok,true);const balance=f.state(2).wallets.usd;
  const migrated=createCompetition(f.db,{now:f.now});const history=migrated.info(2);assert.equal(history.cycle.id,1);assert.equal(history.winners[0].entry_id,entry.id);assert.equal(history.winners[0].ends,Date.UTC(2026,10,1,3));assert.equal(migrated.hasParticipated(2),true);assert.equal(f.state(2).wallets.usd,balance);assert.equal(migrated.promote(1,{position:{map:'house'}},{entryId:entry.id}).status,409);
 }finally{f.db.close()}
});
test('Campeão do mês anterior permanece visível até existir um novo vencedor',()=>{
 const f=fixture(),stadium={position:{map:'stadium'}},home={position:{map:'house'}};
 try{
  const first=f.competition.submit(2,stadium,{cycleId:0,title:'Campeão anterior',description:'Projeto vencedor de uma edição anterior.',project}).entry;
  f.advance(f.competition.info(2).cycle.ends-f.now());f.competition.promote(1,home,{entryId:first.id});
  const next=f.competition.info(3);assert.equal(next.cycle.id,1);assert.equal(next.winners[0].cycle_id,0);assert.equal(next.winners[0].name,'Player 2');
  const second=f.competition.submit(3,stadium,{cycleId:1,title:'Novo campeão',description:'Projeto para participar da edição seguinte.',project}).entry;
  assert.equal(f.competition.info(3).winners[0].name,'Player 2');
  f.advance(f.competition.info(3).cycle.ends-f.now());f.competition.promote(1,home,{entryId:second.id});
  const updated=f.competition.info(3);assert.equal(updated.winners[0].name,'Player 3');assert.equal(updated.winners[1].name,'Player 2');
 }finally{f.db.close()}
});
