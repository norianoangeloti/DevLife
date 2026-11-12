import {competitionMonth} from '../../competition.js';
import {books} from '../../books.js';
export const regionalPrerequisites=()=>({bookProgress:Object.fromEntries(books.map(book=>[book.id,{pagesRead:book.pages,completedAt:'2026-01-01T00:00:00.000Z'}])),competitionParticipated:true});
// Apenas para bancos temporários de testes: cria um registro real de participação.
export function seedRegionalPrerequisites(db,userId,{participated=true}={}){
 const row=db.prepare('SELECT state FROM characters WHERE user_id=?').get(userId),state=JSON.parse(row.state);
 state.bookProgress=regionalPrerequisites().bookProgress;
 if(participated){
  const epoch=db.prepare('SELECT epoch FROM competition_config WHERE id=1').get().epoch;
  db.prepare('INSERT OR IGNORE INTO competition_cycles VALUES(0,?,?)').run(epoch,competitionMonth(epoch).ends);
  db.prepare('INSERT OR IGNORE INTO competition_entries(cycle_id,user_id,title,description,project,submitted) VALUES(0,?,?,?,?,?)').run(userId,'Projeto de teste','Participação na competição de teste.',JSON.stringify({html:'<h1>Projeto de teste</h1>',css:'',js:''}),epoch);
 }
 state.competitionParticipated=participated;db.prepare('UPDATE characters SET state=? WHERE user_id=?').run(JSON.stringify(state),userId);
}
