// Rotas e moedas compartilhadas entre cliente e servidor.
const passed = (state, id) => state.completed?.includes(id);
export const clubTracks = {
  node: 'Node.js',
  react: 'React',
  'ts-front': 'TypeScript Front-end',
  'ts-back': 'TypeScript Back-end',
};
export const clubExamIds = Object.keys(clubTracks).map(track => `devclub-${track}-exam`);
export const libraryBookIds=['html-pt','css-pt','javascript-pt'];
export const completedLibrary=state=>libraryBookIds.every(id=>!!(state.bookProgress?.[id]?.completedAt||state.bookProgress?.[id.replace('-pt','')]?.completedAt));
export function examPrerequisiteError(state,exercise){
 if(state.completed?.includes(exercise.id))return '';
 if(exercise.kind==='exam'&&exercise.stage==='intermediate'&&!completedLibrary(state))return 'Conclua os três livros da biblioteca antes de iniciar as provas intermediárias.';
 if((exercise.kind==='exam'&&exercise.stage==='advanced'||exercise.exam===true)&&state.competitionParticipated!==true)return 'Envie um projeto válido na competição antes de iniciar esta prova.';
 return '';
}
export function accessFor(state) {
  const plaza = passed(state, 'exam-javascript-beginner');
  const downtown = plaza && ['html','css','javascript'].every(area => passed(state, `exam-${area}-intermediate`));
  const usa = downtown && ['html','css','javascript'].every(area => passed(state, `exam-${area}-advanced`)) && clubExamIds.every(id => passed(state, id));
  return {plaza,downtown,usa};
}
export function canVisit(state,map) {
  const access=accessFor(state);
  if(['plaza','library'].includes(map)) return access.plaza;
  if(['downtown','devclub','city-office','city-shop','stadium'].includes(map)) return access.downtown;
  if(['usa','us-office','us-shop'].includes(map)) return access.usa;
  return ['city','house','school','office','shop'].includes(map);
}
// As quantidades representam poder de compra nas lojas, não câmbio real.
const packageTiers=[[1,2999],[2.5,6999],[5,12999],[7.5,18999],[10,24999]];
export const currencyPackages=Object.fromEntries([['coins',4500],['brl',3000],['usd',100]].map(([currency,base])=>[currency,packageTiers.map(([multiplier,priceCents])=>{
 const amount=base*multiplier;
 return {id:`${currency}-${amount}`,currency,amount,creditAmount:amount*(currency==='coins'?1:100),priceCents,...(currency==='usd'?{dollars:amount}:{})};
})]));
export const dollarPackages=currencyPackages.usd.map(({id,dollars,priceCents})=>({id,dollars,priceCents}));
export const moneyLabel=(amount,currency)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:currency==='usd'?'USD':'BRL'}).format(amount/100);
