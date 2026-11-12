const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export function createCareer({ getState, getContent, showPanel, openExercise }) {
  const $ = (id) => document.getElementById(id);
  let offset = 0,
    lastNow = 0,
    lastMode = 'terminal';
  function office(mode = lastMode, selectedTier = null) {
    lastMode = mode;
    const state = getState(),
      content = getContent(),
      career = state.career;
    if (state.serverNow !== lastNow) {
      offset = state.serverNow - Date.now();
      lastNow = state.serverNow;
    }
    const current = content.works[career.completed],
      jobTier = career.tier,
      nextTier = jobTier + 1;
    const assessment = content.recruitmentExams[nextTier],
      tier = content.careerTiers[Math.max(0, jobTier)];
    selectedTier ??= Math.max(0, jobTier);
    const canAssess =
      assessment &&
      (nextTier === 0
        ? state.xp >= 150 && state.skills.HTML >= 3
        : career.completed >= content.careerTiers[nextTier].start);
    const promotedNeeded = current && current.tier > jobTier;
    const introduction = `<div class="career-hero"><div><div class="eyebrow">150 TICKETS · 5 CARGOS · PROMOÇÃO POR AVALIAÇÃO</div><h2>${escape(state.job || 'Sua carreira começa aqui.')}</h2><p>Estagiário → Júnior → Pleno → Sênior → Tech Lead</p></div><strong>${career.completed}<small> / 150</small></strong></div><progress class="career-progress" value="${career.completed}" max="150"></progress>`;
    let main;
    if (mode === 'recruiter')
      main = assessment
        ? `<article class="exam-card"><img src="./trophies/promotion-${nextTier}.svg" alt="Troféu do cargo"><div><small>RECRUTAMENTO E PROMOÇÃO</small><h3>Avaliação para ${escape(content.careerTiers[nextTier].title)}</h3><p>${canAssess ? 'Você cumpriu os requisitos. Demonstre seu conhecimento na prova do cargo.' : nextTier === 0 ? 'Conquiste 150 XP e 3 pontos de HTML na escola para se candidatar.' : 'Conclua os ' + tier.count + ' trabalhos de ' + escape(tier.title) + ' antes da próxima avaliação.'}</p><button id="recruitExam" class="primary" ${canAssess ? '' : 'disabled'}>Começar avaliação →</button></div></article>`
        : '<article class="card"><h3>Você chegou a Tech Lead.</h3><p>Seu cargo já é o mais alto. Continue os projetos do terminal para completar sua carreira.</p></article>';
    else
      main = !state.job
        ? '<article class="card"><h3>Você ainda não foi contratado.</h3><p>Fale com o recrutador da empresa e faça sua primeira avaliação.</p></article>'
        : !current
          ? '<div class="mission-feedback success"><div class="feedback-symbol">👑</div><div><h3>150 entregas. Uma carreira construída.</h3><p>Você conquistou Lenda da DevCity. Seus códigos continuam no DevBook.</p></div></div>'
          : promotedNeeded
            ? '<div class="mission-feedback success"><div class="feedback-symbol">✓</div><div><h3>Todos os trabalhos do cargo foram concluídos!</h3><p>Procure o recrutador para ser avaliado. A aprovação libera o próximo cargo e seus tickets.</p></div></div>'
            : `<article class="next-work"><small>TICKET ${current.stage}/150 · ${escape(tier.title)} · ${current.stage - tier.start}/${tier.count}</small><h3>${escape(current.title)}</h3><p>${escape(current.description)}</p><div class="reward-pills"><span>+${current.money} moedas</span><span>+${current.xp} XP</span></div><div id="workCountdown" class="work-countdown" role="timer"></div><button id="nextWork" class="primary">Investigar e corrigir o bug →</button><p class="cooldown-note">Intervalo entre tickets do cargo: ${current.cooldownMinutes} minutos. Dormir acelera essa espera.</p></article>`;
    const displayTier = content.careerTiers[selectedTier];
    showPanel(
      mode === 'recruiter' ? 'TECHSOFT · RECRUTAMENTO' : 'TECHSOFT · TERMINAL DE TICKETS',
      introduction +
        main +
        `<div class="notebook-tabs">${content.careerTiers.map((t, i) => `<button data-tier="${i}" class="${i === selectedTier ? 'active' : ''}">${escape(t.title)} · ${t.count}</button>`).join('')}</div><div class="cards">${content.works
          .slice(displayTier.start, displayTier.start + displayTier.count)
          .map(
            (w) =>
              `<article class="card"><small>TICKET ${w.stage} · ${w.area}</small><h3>${escape(w.title)}</h3><span>${w.money} moedas · ${w.xp} XP</span><p>${state.work.completed.includes(w.id) ? '✓ Entregue' : w.id === career.next ? 'Próxima entrega' : 'Avance na carreira'}</p></article>`,
          )
          .join('')}</div>`,
    );
    if ($('nextWork')) $('nextWork').onclick = () => openExercise(current, 'work');
    if ($('recruitExam')) $('recruitExam').onclick = () => openExercise(assessment, 'recruit');
    document
      .querySelectorAll('[data-tier]')
      .forEach((b) => (b.onclick = () => office(mode, Number(b.dataset.tier))));
    tick();
  }
  function tick() {
    const el = $('workCountdown');
    if (!el) return;
    const state = getState(),
      current = getContent().works[state.career.completed];
    const seconds = Math.max(0, Math.ceil((state.career.nextWorkAt - Date.now() - offset) / 1000));
    el.textContent = seconds
      ? `⏳ Próximo ticket em ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
      : '✓ Ticket disponível';
    if ($('nextWork'))
      $('nextWork').disabled =
        seconds > 0 || !current || current.tier > state.career.tier || state.xp < current.minXp;
  }
  setInterval(tick, 1000);
  return { office };
}
