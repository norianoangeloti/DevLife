import { cssScenes, exercisePreview, renderProjectPreview } from './exercise-preview.js';
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const lessonMarkup = (lesson) => `<details class="lesson-reading" open><summary><span>AULA · ANTES DE PRATICAR</span><b>${escape(lesson.title)}</b></summary><div class="lesson-body"><p class="lesson-introduction">${escape(lesson.introduction)}</p><p>${escape(lesson.explanation)}</p><h3>Veja um exemplo</h3><p class="lesson-example-note">Este exemplo usa outros dados. No desafio, aplique o conceito aos requisitos pedidos.</p><pre class="lesson-example"><code>${escape(lesson.example)}</code></pre><div class="lesson-observation"><strong>Preste atenção</strong><p>${escape(lesson.observation)}</p></div><h3>Como praticar</h3><ol>${lesson.steps.map((step) => '<li>' + escape(step) + '</li>').join('')}</ol></div></details>`;
const date = (s) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(s));
export function createLearning({
  getState,
  getContent,
  api,
  applyState,
  showPanel,
  school,
  office,
  openProject,
}) {
  const $ = (id) => document.getElementById(id);
  function notebook(tab = 'library') {
    const state = getState(),
      content = getContent();
    const completed = [
      ...content.lessons,
      ...content.schoolLessons,
      ...content.schoolExams,
      ...content.works,
      ...content.archivedWorks,
      ...content.recruitmentExams,
    ].filter((l) => state.completed.includes(l.id));
    const html =
      tab === 'library'
        ? `<div class="cards">${completed.map((l) => `<article class="card"><small>${l.area} · CONCLUÍDO</small><h3>${escape(l.title)}</h3><p>${state.submissions?.[l.id] ? 'Sua resposta está salva. Revise seu raciocínio ou tente de novo.' : 'Concluído antes do histórico de respostas. Você pode refazer para praticar.'}</p><button data-review="${l.id}" class="secondary">Revisar exercício →</button></article>`).join('') || '<div class="empty-state">Sua biblioteca ainda está vazia.<br>Aprenda com a professora na Dev School e volte para revisar.</div>'}</div>`
        : tab === 'practice'
          ? `<p>Aplique o que aprendeu em desafios diferentes. Você pode repetir à vontade; a prática não dá moedas ou XP.</p><div class="cards">${content.practices.map((p) => `<article class="card"><small>${p.area} · PRÁTICA</small><h3>${escape(p.title)}</h3><p>${escape(p.description)}</p><button data-practice="${p.id}" ${state.completed.includes(p.requires) ? '' : 'disabled'}>${state.completed.includes(p.requires) ? 'Praticar →' : '🔒 Conclua a aula correspondente'}</button></article>`).join('')}</div>`
          : `<div class="history-list">${
              [...(state.practiceHistory || [])]
                .reverse()
                .slice(0, 20)
                .map((p, i) => {
                  const l = [
                    ...content.lessons,
                    ...content.works,
                    ...content.archivedWorks,
                    ...content.schoolLessons,
                    ...content.recruitmentExams,
                    ...content.practices,
                  ].find((l) => l.id === p.id);
                  return `<article class="history-entry"><span class="history-icon ${p.passed ? 'passed' : 'failed'}">${p.passed ? '✓' : '↻'}</span><div><b>${escape(l?.title || p.id)}</b><small>${date(p.practicedAt)} · ${p.passed ? 'Resolvido' : 'Em aprendizado'}</small><details><summary>Ver minha tentativa</summary><pre class="saved-code">${escape(p.code)}</pre></details></div></article>`;
                })
                .join('') ||
              '<div class="empty-state">Suas tentativas de prática vão aparecer aqui.</div>'
            }</div>`;
    showPanel(
      'DEVBOOK · SEU ESPAÇO DE PRÁTICA',
      `<div class="notebook-title"><span class="book-icon">⌘</span><div><h2>Aprender é só o começo.</h2><p>Revise suas respostas e coloque seu conhecimento em prática.</p></div></div><div class="notebook-tabs"><button data-tab="library" class="${tab === 'library' ? 'active' : ''}">Biblioteca · ${completed.length}</button><button data-tab="practice" class="${tab === 'practice' ? 'active' : ''}">Laboratório</button><button data-tab="history" class="${tab === 'history' ? 'active' : ''}">Minhas tentativas</button></div>${html}`,
    );
    document
      .querySelectorAll('[data-tab]')
      .forEach((b) => (b.onclick = () => notebook(b.dataset.tab)));
    document
      .querySelectorAll('[data-review]')
      .forEach((b) => (b.onclick = () => review(completed.find((l) => l.id === b.dataset.review))));
    document.querySelectorAll('[data-practice]').forEach(
      (b) =>
        (b.onclick = () =>
          open(
            content.practices.find((p) => p.id === b.dataset.practice),
            'practice',
          )),
    );
  }
  // A revisão mostra a resposta entregue pelo jogador, sem revelar a solução de referência.
  function review(l, returnTo = () => notebook(), returnLabel = 'Voltar à biblioteca') {
    if (l.kind === 'exam') {
      openProject(l);
      return;
    }
    const saved = getState().submissions?.[l.id];
    const oldEdition = saved && l.previousEdition && saved.curriculumVersion !== l.curriculumVersion;
    const displayed = oldEdition ? l.previousEdition : l;
    showPanel(
      'DEVBOOK · SUA RESPOSTA',
      `<h2>${escape(displayed.title)}</h2>${oldEdition ? '<p class="practice-note">Esta resposta é da edição anterior. Seu progresso foi preservado. Você pode praticar o novo desafio abaixo.</p>' : ''}${displayed.lesson ? lessonMarkup(displayed.lesson) : ''}<p>${escape(displayed.description)}</p>${saved ? `<div class="review-meta">✓ Concluído em ${date(saved.completedAt)} · ${saved.attempts} tentativa(s)</div><h3>O código que você escreveu</h3><pre class="saved-code">${escape(saved.code)}</pre>` : '<div class="empty-state">Esse exercício foi concluído antes de começarmos a guardar respostas. A resposta antiga não está disponível.</div>'}<div class="actions"><button id="redoExercise" class="primary">${oldEdition ? 'Praticar novo desafio' : 'Refazer sem olhar a resposta'}</button><button id="backLibrary" class="quiet">${escape(returnLabel)}</button></div>`,
    );
    $('redoExercise').onclick = () => open(l, 'practice', { returnTo, returnLabel });
    $('backLibrary').onclick = returnTo;
  }
  function open(l, mode = 'school', reviewContext) {
    if (l.kind === 'recruitment') mode = 'recruit';
    if (l.kind === 'work' && mode !== 'practice') mode = 'work';
    if (mode !== 'practice' && getState().completed.includes(l.id)) {
      if (mode === 'school')
        review(l, () => school(l.area, l.stage), 'Voltar à escola');
      else review(l);
      return;
    }
    let hintIndex = 0,
      busy = false;
    const practice = mode === 'practice',
      work = mode === 'work',
      recruit = mode === 'recruit';
    showPanel(
      `${l.area} · ${practice ? 'LABORATÓRIO PESSOAL' : recruit ? 'TECHSOFT · AVALIAÇÃO' : work ? 'TECHSOFT' : 'DEV SCHOOL'}`,
      `<div class="exercise-heading"><span class="exercise-icon">${l.area === 'HTML' ? '〈/〉' : l.area === 'CSS' ? '✦' : '{ }'}</span><div><h2>${escape(l.title)}</h2>${l.lesson && !work && !recruit ? '<p>Leia a aula e depois aplique o conceito no desafio.</p>' : '<p>' + escape(l.description) + '</p>'}</div></div>${l.lesson && !work && !recruit ? lessonMarkup(l.lesson) + '<section class="lesson-task"><h3>Agora é sua vez</h3><p>' + escape(l.description) + '</p></section>' : ''}${l.requirements?.length ? '<details class="lesson-criteria"><summary>Ver critérios · ' + l.requirements.length + '</summary><ul>' + l.requirements.map(item => '<li>' + escape(item) + '</li>').join('') + '</ul></details>' : ''}${practice ? '<div class="practice-note">PRÁTICA LIVRE · Sem XP ou moedas. Suas tentativas ficam salvas no DevBook.</div>' : `<div class="reward-pills"><span>✦ ${l.xp} XP</span>${l.money ? `<span>◈ ${l.money} moedas</span>` : ''}<span>↗ ${l.skill} ${l.area}</span></div>`}<div id="missionResult" class="mission-feedback" role="status" tabindex="-1" hidden></div><div class="mission-grid"><div class="editor-pane"><div class="editor-toolbar"><span>● ● ●</span><b>${l.area === 'HTML' ? 'index.html' : l.area === 'CSS' ? 'style.css' : 'script.js'}</b></div><textarea id="editor" spellcheck="false" aria-label="Editor de código"></textarea></div><div class="preview-pane"><div class="preview-toolbar">PRÉVIA DO SEU PROJETO</div>${l.area === 'CSS' ? '<div class="preview-controls"><label>Tela da prévia<select id="previewWidth"><option value="auto">Adaptar ao espaço</option><option value="375">Celular · 375px</option><option value="768">Tablet · 768px</option><option value="1100">Desktop · 1100px</option></select></label></div>' : ''}<div class="preview-viewport"><iframe id="preview" sandbox="" title="Prévia do exercício"></iframe></div><small>${l.area === 'JavaScript' ? (l.previewHtml ? 'Teste seu JavaScript nesta prévia isolada.' : 'A estrutura do código será conferida ao validar.') : 'A prévia acompanha seu código enquanto você escreve.'}</small></div></div><div class="actions"><button id="submitCode" class="primary">${practice ? 'Verificar minha prática' : 'Entregar desafio →'}</button><button id="hint" class="secondary">Uma dica, por favor</button><button id="backExercise" class="quiet">Voltar</button></div><div id="hintBox" class="hint-box" hidden></div>`,
    );
    $('editor').value = l.starter;
    // Os novos exercícios executam JavaScript em uma prévia isolada da conta.
    if (l.previewHtml) $('preview').setAttribute('sandbox', 'allow-scripts');
    const preview = () => {
      const code = $('editor').value;
      if (l.previewHtml) renderProjectPreview($('preview'), exercisePreview(l, code));
      else $('preview').srcdoc = exercisePreview(l, code);
    };
    $('editor').oninput = preview;
    preview();
    if (l.area === 'CSS') {
      const width = $('previewWidth');
      width.value = String(cssScenes[l.id]?.width || 'auto');
      width.onchange = () => {
        $('preview').style.width = width.value === 'auto' ? '100%' : `${width.value}px`;
      };
      width.onchange();
    }
    $('editor').addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        e.target.setRangeText('  ', e.target.selectionStart, e.target.selectionEnd, 'end');
        preview();
      }
    });
    $('hint').onclick = () => {
      const hints = l.hints || [];
      $('hintBox').hidden = false;
      $('hintBox').innerHTML =
        `<b>💡 Dica ${Math.min(hintIndex + 1, hints.length)} de ${hints.length}</b><p>${escape(hints[Math.min(hintIndex, hints.length - 1)] || 'Releia o objetivo e confira cada requisito antes de validar.')}</p>`;
      hintIndex++;
      if (hintIndex >= hints.length) {
        $('hint').disabled = true;
        $('hint').textContent = 'Todas as dicas vistas';
      }
      $('hintBox').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    // Não passa o evento do clique como filtro de área da escola.
    const isNewSchool = l.id.startsWith('school-');
    $('backExercise').onclick = practice
      ? reviewContext?.returnTo || (() => notebook('practice'))
      : work || recruit
        ? () => office()
        : () => school(isNewSchool ? l.area : undefined, isNewSchool ? l.stage : undefined);
    $('submitCode').onclick = async () => {
      if (busy) return;
      busy = true;
      $('submitCode').disabled = true;
      $('submitCode').textContent = 'Conferindo seu código…';
      const feedback = $('missionResult');
      try {
        const result = await api(
          practice
            ? 'practice'
            : recruit
              ? 'recruit'
              : work
                ? 'work'
                : l.id.startsWith('school-')
                  ? 'school-submit'
                  : 'submit',
          {
            id: l.id,
            code: $('editor').value,
          },
        );
        if (result.state) applyState(result.state);
        if (result.gateOpened) return;
        feedback.hidden = false;
        feedback.className = 'mission-feedback success';
        feedback.innerHTML = `<div class="feedback-symbol">✓</div><div><div class="eyebrow">${practice ? 'PRÁTICA CONCLUÍDA' : 'MISSÃO CONCLUÍDA'}</div><h3>${practice ? 'Mandou bem. Você aprendeu!' : 'Mais um passo na sua jornada!'}</h3><p>${practice ? 'Sua tentativa foi salva no DevBook. Pode repetir quando quiser.' : 'Seu código passou. A recompensa e a sua resposta já foram salvas.'}</p>${!practice ? `<div class="reward-pills"><span>+${result.reward.xp} XP</span>${result.reward.money ? `<span>+${result.reward.money} moedas</span>` : ''}<span>+${result.reward.skill} ${result.reward.area}</span></div>` : ''}${work ? `<p>${result.promotion ? '🎉 Promoção: ' + escape(result.promotion) + '! ' : ''}${result.cooldownMinutes ? 'Próximo trabalho em ' + result.cooldownMinutes + ' minutos.' : 'Você concluiu os 150 trabalhos!'}</p>` : ''}<button id="continueLearning" class="secondary">${practice ? escape(reviewContext?.returnLabel || 'Voltar ao laboratório') : 'Continuar minha jornada →'}</button></div><div class="confetti" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>`;
        if (work || recruit)
          feedback.insertAdjacentHTML(
            'beforeend',
            `<p>${result.assessment ? 'Todos os trabalhos do cargo foram concluídos. Procure o recrutador para ser avaliado.' : result.promotion ? 'Avaliação aprovada: ' + escape(result.promotion) : ''}</p>`,
          );
        $('continueLearning').onclick = practice
          ? reviewContext?.returnTo || (() => notebook('practice'))
          : work || recruit
            ? () => office()
            : () => school(isNewSchool ? l.area : undefined, isNewSchool ? l.stage : undefined);
        $('editor').classList.remove('invalid');
        $('submitCode').textContent = practice ? '✓ Prática validada' : '✓ Recompensa recebida';
        if (!practice) $('editor').readOnly = true;
      } catch (e) {
        if (e.details?.state) applyState(e.details.state);
        feedback.hidden = false;
        feedback.className = 'mission-feedback failure';
        feedback.innerHTML = `<div class="feedback-symbol">↻</div><div><div class="eyebrow">VAMOS AJUSTAR JUNTOS</div><h3>${escape(e.message)}</h3><ul>${(e.details?.feedback || ['Tente novamente. Seu código continua no editor.']).map((f) => `<li>${escape(f)}</li>`).join('')}</ul></div>`;
        $('editor').classList.add('invalid');
        $('submitCode').disabled = false;
        $('submitCode').textContent = 'Ajustar e tentar de novo';
      } finally {
        busy = false;
        if (feedback.isConnected) {
          feedback.focus({ preventScroll: true });
          feedback.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
      }
    };
  }
  return { open, notebook, review };
}
