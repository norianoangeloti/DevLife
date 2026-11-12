import {normalizeVehicle} from './public/vehicle-control.js';
import {canVisit,clubExamIds,clubTracks} from './public/expansion-rules.js';
import { normalizeExpansion, clubLessons } from './expansion-content.js';
import { works, careerTiers, lessons } from './content.js';
import { works as oldWorks } from './curriculum.js';
import { tierForCount } from './career-content.js';
import { commonItems } from './public/shop-models.js';
import { schoolLessons, schoolExams } from './school-content.js';
import { levelForXp } from './public/economy.js';
import { books } from './books.js';
// Completa os campos de contas criadas antes das atualizações de carreira e aparência.
export function normalize(state) {
  if(!Number.isFinite(state.npcWorldStartedAt))state.npcWorldStartedAt=Date.now();
  state.characterSetupCompleted ??= true;
  normalizeExpansion(state);
  state.inventory ??= [];
  state.equipped ??= [];
  state.achievements ??= [];
  state.money ??= 0;
  state.xp ??= 0;
  state.completed ??= [];
  state.skills ??= {HTML:0,CSS:0,JavaScript:0};
  for(const [track,area] of Object.entries(clubTracks)){
    const lessons=clubLessons.filter(lesson=>lesson.track===track);
    state.skills[area]=Math.round(100*lessons.filter(lesson=>state.completed.includes(lesson.id)).length/lessons.length);
  }
  state.gender ??= 'male';
  state.hair ??= '#51423f';
  state.pants ??= '#ffffff';
  state.hairstyle ??= 'short';
  state.schoolProjects ??= {};
  state.practiceHistory ??= [];
  state.submissions ??= {};
  state.attempts ??= {};
  state.bookProgress ??= {};
  state.work ??= {
    completed: state.completed.includes('ticket-button') ? ['ticket-button'] : [],
    nextWorkAt: 0,
  };
  if (state.work.cooldownVersion !== 2) {
    const count = state.work.completed.length;
    if (count > 0 && count < 50 && state.work.nextWorkAt > 0) {
      const finishedAt = state.work.nextWorkAt - count * 300000;
      state.work.nextWorkAt = finishedAt + oldWorks[count - 1].cooldownMinutes * 60000;
    }
    state.work.cooldownVersion = 2;
  }
  // Compensa uma vez os trabalhos pagos antes da ampliação da loja.
  if (state.economyVersion !== 3) {
    state.economyAdjustment = oldWorks
      .filter((work) => state.work.completed.includes(work.id))
      .reduce((sum, work) => sum + work.money - work.money / 6, 0);
    state.money = (state.money || 0) + state.economyAdjustment;
    state.economyVersion = 3;
  }
  if (state.campaignVersion !== 4) {
    const oldCompleted = state.work.completed.filter((id) => oldWorks.some((w) => w.id === id));
    const mapped = works.slice(0, oldCompleted.length);
    const adjustment = mapped.reduce(
      (sum, w, i) =>
        sum + Math.max(0, w.money - (oldWorks.find((o) => o.id === oldCompleted[i])?.money || 0)),
      0,
    );
    state.money += adjustment;
    state.campaignAdjustment = adjustment;
    state.work.completed = [
      ...new Set([
        ...state.work.completed.filter((id) => id.startsWith('job-')),
        ...mapped.map((w) => w.id),
      ]),
    ];
    for (const work of mapped)
      if (!state.completed.includes(work.id)) state.completed.push(work.id);
    state.work.tier = state.job ? tierForCount(Math.max(0, state.work.completed.length - 1)) : -1;
    // Aulas antigas continuam no histórico. Só conteúdos equivalentes ganham crédito na trilha nova.
    for (const lesson of schoolLessons)
      if (
        lessons.some(
          (old) =>
            state.completed.includes(old.id) &&
            old.solution.replace(/\s/g, '') === lesson.solution.replace(/\s/g, ''),
        )
      )
        state.completed.push(lesson.id);
    for (const item of commonItems)
      if (!state.inventory.includes(item.id)) state.inventory.push(item.id);
    state.campaignVersion = 4;
  }
  if(state.position?.map&&!canVisit(state,state.position.map)){
    const returningFromUsa=['usa','us-shop','us-office'].includes(state.position.map);
    state.position=returningFromUsa&&canVisit(state,'downtown')?{map:'downtown',x:850,y:420}:{map:'city',x:430,y:450};
  }
  state.work.tier ??= state.job ? tierForCount(state.work.completed.length) : -1;
  if (state.job) state.job = careerTiers[state.work.tier].title;
  normalizeVehicle(state);
  return state;
}
// O tempo restante é calculado a partir de uma data absoluta, mesmo após sair da conta.
export function career(state, now = Date.now()) {
  normalize(state);
  const count = state.work.completed.length;
  return {
    completed: count,
    total: works.length,
    tier: state.work.tier,
    needsAssessment:
      state.work.tier < 4 &&
      count >=
        (state.work.tier < 0
          ? 0
          : careerTiers[state.work.tier].start + careerTiers[state.work.tier].count),
    title: state.job,
    next: works[count]?.id || null,
    nextWorkAt: state.work.nextWorkAt,
    remainingMs: Math.max(0, state.work.nextWorkAt - now),
    serverNow: now,
  };
}
// Recompensa, intervalo e promoção fazem parte da mesma atualização de estado.
export function finishWork(state, work, now = Date.now()) {
  normalize(state);
  state.work.completed.push(work.id);
  state.completed.push(work.id);
  state.xp += work.xp;
  state.money += work.money;
  state.skills[work.area] = Math.min(100, state.skills[work.area] + work.skill);
  const count = state.work.completed.length;
  state.work.cooldownVersion = 2;
  state.work.nextWorkAt = count < works.length ? now + work.cooldownMinutes * 60000 : 0;
  return {
    promotion: null,
    assessment:
      count === careerTiers[state.work.tier].start + careerTiers[state.work.tier].count &&
      state.work.tier < 4,
    cooldownMinutes: count < works.length ? work.cooldownMinutes : 0,
  };
}
export function unlock(state) {
  const count = state.work.completed.length,
    school = [...lessons, ...schoolLessons].filter((l) => state.completed.includes(l.id)).length;
  const ids = [
    school ? 'hello' : null,
    lessons.slice(0, 3).every((l) => state.completed.includes(l.id)) ? 'html' : null,
    state.job ? 'job' : null,
    count ? 'bug' : null,
    state.inventory.some((id) => !id.endsWith('-common')) ? 'home' : null,
  ];
  // Troféus das promoções antigas permanecem no histórico; novos cargos têm avaliação própria.
  for (const n of [10, 20, 30]) if (school >= n) ids.push('school-' + n);
  for (const n of [5, 10])
    if (state.practiceHistory.filter((p) => p.passed).length >= n) ids.push('practice-' + n);
  for (const book of books)
    if (state.bookProgress?.[book.id]?.completedAt || state.bookProgress?.[book.cover]?.completedAt)
      ids.push('book-' + book.cover);
  for (const exam of schoolExams) if (state.completed.includes(exam.id)) ids.push(exam.id);
  for(const id of clubExamIds)if(state.completed.includes(id))ids.push(id);
  for (let tier = 0; tier <= state.work.tier; tier++) ids.push(`promotion-${tier}`);
  if (count >= 150) ids.push('career-complete');
  if (levelForXp(state.xp) === 100) ids.push('level-100');
  state.achievements = [...new Set([...state.achievements, ...ids.filter(Boolean)])];
}
