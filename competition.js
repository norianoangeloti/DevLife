const calendar=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
const parts=time=>Object.fromEntries(calendar.formatToParts(time).filter(part=>part.type!=='literal').map(part=>[part.type,Number(part.value)]));
function monthStart(year,month){
 const target=Date.UTC(year,month-1,1);let guess=target;
 for(let i=0;i<4;i++){const p=parts(guess),delta=target-Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);if(!delta)break;guess+=delta;}
 return guess;
}
export function competitionMonth(time,offset=0){
 const current=parts(time),date=new Date(Date.UTC(current.year,current.month-1+offset,1)),year=date.getUTCFullYear(),month=date.getUTCMonth()+1;
 return {year,month,starts:monthStart(year,month),ends:monthStart(year,month+1)};
}
export const COMPETITION_PRIZE=5000; // Centavos de dólares virtuais.
export function createCompetition(db,{now=Date.now,onWinner=()=>{}}={}){
 db.exec(`CREATE TABLE IF NOT EXISTS game_roles(user_id INTEGER NOT NULL REFERENCES users(id),role TEXT NOT NULL,PRIMARY KEY(user_id,role));
 CREATE TABLE IF NOT EXISTS competition_config(id INTEGER PRIMARY KEY CHECK(id=1),epoch INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS competition_cycles(id INTEGER PRIMARY KEY,starts INTEGER NOT NULL,ends INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS competition_entries(id INTEGER PRIMARY KEY,cycle_id INTEGER NOT NULL REFERENCES competition_cycles(id),user_id INTEGER NOT NULL REFERENCES users(id),title TEXT NOT NULL,description TEXT NOT NULL,project TEXT NOT NULL,submitted INTEGER NOT NULL,UNIQUE(cycle_id,user_id));
 CREATE TABLE IF NOT EXISTS competition_winners(cycle_id INTEGER PRIMARY KEY REFERENCES competition_cycles(id),entry_id INTEGER NOT NULL REFERENCES competition_entries(id),user_id INTEGER NOT NULL REFERENCES users(id),admin_id INTEGER NOT NULL REFERENCES users(id),prize INTEGER NOT NULL,selected INTEGER NOT NULL,portrait TEXT NOT NULL,name TEXT NOT NULL,title TEXT NOT NULL);`);
 db.exec('CREATE INDEX IF NOT EXISTS competition_participant ON competition_entries(user_id);CREATE INDEX IF NOT EXISTS competition_champion ON competition_winners(user_id);');
 db.prepare('INSERT OR IGNORE INTO competition_config(id,epoch) VALUES(1,?)').run(now());
 if(!db.prepare('PRAGMA table_info(competition_config)').all().some(column=>column.name==='calendar_version'))db.exec('ALTER TABLE competition_config ADD COLUMN calendar_version INTEGER NOT NULL DEFAULT 0');
 const config=db.prepare('SELECT * FROM competition_config WHERE id=1').get();
 if(config.calendar_version!==1){
  db.exec('BEGIN IMMEDIATE');try{
   const epoch=competitionMonth(config.epoch).starts;
   for(const row of db.prepare('SELECT id FROM competition_cycles').all()){const period=competitionMonth(epoch,row.id);db.prepare('UPDATE competition_cycles SET starts=?,ends=? WHERE id=?').run(period.starts,period.ends,row.id);}
   db.prepare('UPDATE competition_config SET epoch=?,calendar_version=1 WHERE id=1').run(epoch);db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error}
 }
 const isAdmin=id=>!!db.prepare("SELECT 1 FROM game_roles WHERE user_id=? AND role='competition-admin'").get(id);
 function cycle(){const epoch=db.prepare('SELECT epoch FROM competition_config WHERE id=1').get().epoch,base=competitionMonth(epoch),current=competitionMonth(now()),id=Math.max(0,(current.year-base.year)*12+current.month-base.month),{starts,ends}=competitionMonth(epoch,id);db.prepare('INSERT OR IGNORE INTO competition_cycles VALUES(?,?,?)').run(id,starts,ends);return {id,starts,ends};}
 const winners=()=>db.prepare('SELECT w.*,c.starts,c.ends FROM competition_winners w JOIN competition_cycles c ON c.id=w.cycle_id ORDER BY c.starts DESC LIMIT 12').all().map(({portrait,...winner})=>({...winner,portrait:JSON.parse(portrait)}));
 function info(id){const current=cycle(),entry=db.prepare('SELECT id,title,description,submitted FROM competition_entries WHERE cycle_id=? AND user_id=?').get(current.id,id);return {cycle:current,now:now(),prize:COMPETITION_PRIZE,isAdmin:isAdmin(id),entry:entry||null,count:db.prepare('SELECT count(*) AS count FROM competition_entries WHERE cycle_id=?').get(current.id).count,winners:winners()};}
 function submit(id,state,body){
  if(state.position.map!=='stadium')return {status:403,error:'Envie pelo computador do Estádio de Competição.'};
  const current=cycle();
  if(body.cycleId!==current.id)return {status:409,error:'O prazo deste ciclo terminou. Abra a competição atual.'};
  const title=typeof body.title==='string'?body.title.trim():'',description=typeof body.description==='string'?body.description.trim():'';
  const project=body.project;
  if(title.length<3||title.length>80||description.length<20||description.length>1000||!project||!['html','css','js'].every(key=>typeof project[key]==='string'&&project[key].length<=30000)||project.html.trim().length<20||project.html.length+project.css.length+project.js.length>80000)return {status:400,error:'Informe título (3–80 caracteres), descrição (20–1.000) e HTML do projeto. Cada arquivo aceita até 30.000 caracteres; total de até 80.000.'};
  const submitted=now();if(submitted>=current.ends)return {status:409,error:'O prazo de envio terminou. Reabra a competição.'};
  const code=JSON.stringify({html:project.html,css:project.css,js:project.js});
  db.prepare('INSERT INTO competition_entries(cycle_id,user_id,title,description,project,submitted) VALUES(?,?,?,?,?,?) ON CONFLICT(cycle_id,user_id) DO UPDATE SET title=excluded.title,description=excluded.description,project=excluded.project,submitted=excluded.submitted').run(current.id,id,title,description,code,submitted);
  const saved=JSON.parse(db.prepare('SELECT state FROM characters WHERE user_id=?').get(id).state);saved.competitionParticipated=true;
  db.prepare('UPDATE characters SET state=? WHERE user_id=?').run(JSON.stringify(saved),id);
  return {ok:true,message:'Projeto enviado. Você pode atualizá-lo até o fim do prazo.',...info(id)};
 }
 function entry(id,state,entryId){
  if(!Number.isSafeInteger(entryId)||entryId<1)return {status:400,error:'Projeto inválido.'};
  const row=db.prepare('SELECT * FROM competition_entries WHERE id=?').get(entryId);
  if(!row)return {status:404,error:'Projeto não encontrado.'};
  if(row.user_id!==id&&!isAdmin(id))return {status:403,error:'Projeto disponível apenas ao autor e ao administrador.'};
  if(row.user_id!==id&&state.position.map!=='house')return {status:403,error:'Use o computador administrativo da sua casa.'};
  return {...row,project:JSON.parse(row.project)};
 }
 function admin(id,state,{cycleId,offset=0}={}){
  if(!isAdmin(id)||state.position.map!=='house')return {status:403,error:'Acesso exclusivo pelo computador administrativo da sua casa.'};
  const current=cycle();
  const cycles=db.prepare('SELECT c.*,w.entry_id,w.user_id AS winner_id,w.name AS winner_name FROM competition_cycles c LEFT JOIN competition_winners w ON w.cycle_id=c.id ORDER BY c.id DESC').all();
  const selectedCycle=Number.isSafeInteger(cycleId)&&cycles.some(c=>c.id===cycleId)?cycleId:(cycles.find(c=>c.ends<=now()&&!c.entry_id)?.id??current.id);
  offset=Number.isSafeInteger(offset)&&offset>=0?offset:0;
  const entries=db.prepare('SELECT e.id,e.cycle_id,e.user_id,e.title,e.description,e.submitted,c.state FROM competition_entries e JOIN characters c ON c.user_id=e.user_id WHERE e.cycle_id=? ORDER BY e.submitted DESC LIMIT 50 OFFSET ?').all(selectedCycle,offset).map(({state,...row})=>({...row,name:JSON.parse(state).name}));
  return {cycles,entries,selectedCycle,offset,total:db.prepare('SELECT count(*) AS n FROM competition_entries WHERE cycle_id=?').get(selectedCycle).n,now:now(),prize:COMPETITION_PRIZE};
 }
 function promote(id,state,body){
  if(!isAdmin(id)||state.position.map!=='house')return {status:403,error:'Acesso administrativo necessário dentro da sua casa.'};
  if(!Number.isSafeInteger(body.entryId))return {status:400,error:'Escolha um projeto válido.'};
  db.exec('BEGIN IMMEDIATE');let result;
  try{
   const entry=db.prepare('SELECT e.*,c.ends FROM competition_entries e JOIN competition_cycles c ON c.id=e.cycle_id WHERE e.id=?').get(body.entryId);
   if(!entry)result={status:404,error:'Projeto não encontrado.'};
   else if(now()<entry.ends)result={status:409,error:'A avaliação para escolher o vencedor abre após encerrar o mês de envio.'};
   else if(db.prepare('SELECT 1 FROM competition_winners WHERE cycle_id=?').get(entry.cycle_id))result={status:409,error:'Este ciclo já tem um vencedor e a recompensa já foi entregue.'};
   else{
    const winner=JSON.parse(db.prepare('SELECT state FROM characters WHERE user_id=?').get(entry.user_id).state);
    winner.wallets??={brl:0,usd:0};winner.wallets.usd??=0;winner.wallets.usd+=COMPETITION_PRIZE;
    winner.achievements=[...new Set([...(winner.achievements||[]),'project-king'])];
    const portrait=Object.fromEntries(['skin','shirt','pants','hair','gender','hairstyle','equipped'].map(key=>[key,winner[key]]));
    db.prepare('INSERT INTO competition_winners VALUES(?,?,?,?,?,?,?,?,?)').run(entry.cycle_id,entry.id,entry.user_id,id,COMPETITION_PRIZE,now(),JSON.stringify(portrait),winner.name,entry.title);
    db.prepare('UPDATE characters SET state=? WHERE user_id=?').run(JSON.stringify(winner),entry.user_id);
    result={ok:true,message:`${winner.name} venceu o ciclo e recebeu US$ 50.`,winnerId:entry.user_id};
   }
   db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error}
  if(result.ok)onWinner();return result;
 }
 return {isAdmin,info,submit,entry,admin,promote,hasParticipated:id=>!!db.prepare('SELECT 1 FROM competition_entries WHERE user_id=? LIMIT 1').get(id),hasWon:id=>!!db.prepare('SELECT 1 FROM competition_winners WHERE user_id=? LIMIT 1').get(id)};
}
