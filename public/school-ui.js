import { projectDocument, renderProjectPreview } from './exercise-preview.js';
import {examPrerequisiteError} from './expansion-rules.js';
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export function createSchool({ getState, getContent, showPanel, openExercise, api, applyState }) {
  const $ = (id) => document.getElementById(id);
  let selection = { area: 'HTML', stage: 'beginner' },
    previewChannel;
  function school(area = selection.area, stage = selection.stage) {
    selection = { area, stage };
    const content = getContent(),
      state = getState(),
      lessons = content.schoolLessons.filter((l) => l.area === area && l.stage === stage),
      exam = content.schoolExams.find((l) => l.area === area && l.stage === stage);
    const available = (l) => state.completed.includes(l.id)||!examPrerequisiteError(state,l)&&l.requires.every((id) => state.completed.includes(id));
    const examRestriction=examPrerequisiteError(state,exam);
    const done = lessons.filter((l) => state.completed.includes(l.id)).length;
    showPanel(
      'DEV SCHOOL · APRENDER É EVOLUIR',
      `<div class="school-hero"><div class="eyebrow">210 AULAS · 9 PROJETOS FINAIS</div><h2>Aprenda. Construa. Comprove.</h2><p>A escola recompensa XP e conhecimento. Cada etapa termina com um projeto e seu próprio troféu.</p></div><div class="notebook-tabs">${['HTML', 'CSS', 'JavaScript'].map((a) => `<button data-school-area="${a}" class="${area === a ? 'active' : ''}">${a}</button>`).join('')}</div><div class="notebook-tabs">${content.schoolStages.map((s) => `<button data-school-stage="${s.id}" class="${stage === s.id ? 'active' : ''}">${s.name} · ${s.count} aulas</button>`).join('')}</div><p>${done} / ${lessons.length} aulas concluídas nesta etapa</p><progress value="${done}" max="${lessons.length}"></progress><article class="exam-card"><img src="./trophies/${exam.id}.svg" alt="Troféu ${escape(exam.title)}"><div><small>PROVA FINAL · ${exam.stageName}</small><h3>${escape(exam.title)}</h3><p>${escape(exam.description)}</p><span>+${exam.xp} XP · +${exam.skill} conhecimento</span><button id="openSchoolExam" class="primary" ${available(exam) ? '' : 'disabled'}>${state.completed.includes(exam.id) ? 'Revisar projeto' : 'Construir meu projeto →'}</button>${available(exam) ? '' : '<small>'+escape(examRestriction||('Conclua as aulas desta etapa'+(area !== 'HTML'?' e a prova da tecnologia anterior':'')+'.'))+'</small>'}</div></article><div class="cards">${lessons.map((l) => `<article class="card"><small>${area} · ${l.stageName} · AULA ${l.number}</small><h3>${escape(l.title)}</h3><span class="reward">+${l.xp} XP · +${l.skill} conhecimento</span><button data-school-lesson="${l.id}" ${available(l) || state.completed.includes(l.id) ? '' : 'disabled'}>${state.completed.includes(l.id) ? '✓ Concluída · Revisar' : 'Começar aula →'}</button></article>`).join('')}</div>`,
    );
    document
      .querySelectorAll('[data-school-area]')
      .forEach((b) => (b.onclick = () => school(b.dataset.schoolArea, stage)));
    document
      .querySelectorAll('[data-school-stage]')
      .forEach((b) => (b.onclick = () => school(area, b.dataset.schoolStage)));
    document
      .querySelectorAll('[data-school-lesson]')
      .forEach(
        (b) =>
          (b.onclick = () => openExercise(lessons.find((l) => l.id === b.dataset.schoolLesson))),
      );
    $('openSchoolExam').onclick = () => openExam(exam);
  }
  function openExam(exam) {
    previewChannel?.close();
    const state = getState(),
      field = { HTML: 'html', CSS: 'css', JavaScript: 'js' }[exam.area],
      saved = state.schoolProjects?.[exam.stage] || {};
    const project = { html: saved.html || '', css: saved.css || '', js: saved.js || '' },
      completed = state.completed.includes(exam.id);
    const previewId = crypto.randomUUID();
    previewChannel = new BroadcastChannel('devlife-preview-' + previewId);
    previewChannel.onmessage = ({ data }) => {
      if (data?.ready) previewChannel.postMessage(projectDocument(project));
    };
    if (!completed) project[field] = state.examDrafts?.[exam.id] || project[field];
    showPanel(
      'DEV SCHOOL · PROJETO FINAL',
      `<div class="exercise-heading"><span class="exercise-icon">${exam.area === 'HTML' ? '〈/〉' : exam.area === 'CSS' ? '✦' : '{ }'}</span><div><h2>${escape(exam.title)}</h2><p>${escape(exam.description)}</p></div></div><details class="project-requirements" open><summary>Requisitos da entrega · ${exam.requirements.length}</summary><ol>${exam.requirements.map((r) => `<li>${escape(r)}</li>`).join('')}</ol></details><div id="examResult" class="mission-feedback" role="status" hidden></div><div class="project-tabs">${['html', 'css', 'js'].map((f) => `<button data-project-file="${f}" class="${f === field ? 'active' : ''}">${f === 'html' ? 'index.html' : f === 'css' ? 'style.css' : 'script.js'}${f !== field ? ' · salvo' : ''}</button>`).join('')}</div><div class="mission-grid project-grid"><div class="editor-pane"><div class="editor-toolbar"><b id="projectFile">${field}</b><span id="projectSaved">Rascunho salvo automaticamente</span></div><textarea id="projectEditor" spellcheck="false" aria-label="Código do projeto"></textarea></div><div class="preview-pane"><div class="preview-toolbar"><a id="openProjectPreview" class="quiet" href="./project-preview.html#${previewId}" target="_blank" rel="noopener">↗ localhost · Abrir prévia em outra aba</a></div><iframe id="projectFrame" sandbox="allow-scripts" title="Sua página em construção"></iframe></div></div><div class="actions"><button id="deliverExam" class="primary" ${completed ? 'disabled' : ''}>${completed ? '✓ Prova aprovada' : 'Entregar projeto →'}</button><button id="backSchool" class="quiet">Voltar à escola</button></div><p class="preview-note">Na prova de ${exam.area}, edite ${field === 'html' ? 'index.html' : field === 'css' ? 'style.css' : 'script.js'}. Os outros arquivos preservam sua entrega anterior. JavaScript roda apenas na prévia isolada.</p>`,
    );
    let current = field,
      busy = false,
      debounce;
    const draftKey = 'devlife.exam.' + getContent().accountId + '.' + exam.id;
    if (!completed)
      try {
        project[field] = localStorage.getItem(draftKey) ?? project[field];
      } catch {}
    function preview() {
      if (!$('projectFrame')) return;
      const source = projectDocument(project);
      renderProjectPreview($('projectFrame'), source);
      previewChannel?.postMessage(source);
    }
    function select(f) {
      current = f;
      $('projectEditor').value = project[f];
      $('projectEditor').readOnly = completed || f !== field;
      $('projectFile').textContent =
        (f === 'html' ? 'index.html' : f === 'css' ? 'style.css' : 'script.js') +
        (f !== field ? ' · entrega salva' : '');
      document
        .querySelectorAll('[data-project-file]')
        .forEach((b) => b.classList.toggle('active', b.dataset.projectFile === f));
    }
    document
      .querySelectorAll('[data-project-file]')
      .forEach((b) => (b.onclick = () => select(b.dataset.projectFile)));
    $('projectEditor').oninput = () => {
      project[current] = $('projectEditor').value;
      try {
        localStorage.setItem(draftKey, project[field]);
      } catch {}
      clearTimeout(debounce);
      debounce = setTimeout(preview, 350);
    };
    $('projectEditor').onkeydown = (e) => {
      if (e.key === 'Tab' && !e.target.readOnly) {
        e.preventDefault();
        e.target.setRangeText('  ', e.target.selectionStart, e.target.selectionEnd, 'end');
        e.target.dispatchEvent(new Event('input'));
      }
    };

    $('backSchool').onclick = () => {
      clearTimeout(debounce);
      previewChannel?.close();
      school(exam.area, exam.stage);
    };
    $('deliverExam').onclick = async () => {
      if (busy) return;
      busy = true;
      $('deliverExam').disabled = true;
      try {
        const result = await api('exam', { id: exam.id, code: project[field] });
        const regionOpened=applyState(result.state);
        try {
          localStorage.removeItem(draftKey);
        } catch {}
        if(regionOpened)return;
        $('examResult').hidden = false;
        $('examResult').className = 'mission-feedback success';
        $('examResult').innerHTML =
          `<div class="feedback-symbol">✓</div><div><h3>Projeto aprovado!</h3><p>+${result.reward.xp} XP · +${result.reward.skill} conhecimento. Sua página está salva na conta e a próxima etapa já pode usá-la.</p></div>`;
        $('projectEditor').readOnly = true;
        $('deliverExam').textContent = '✓ Projeto aprovado';
        document.querySelectorAll('[data-project-file]').forEach(
          (b) =>
            (b.onclick = () => {
              select(b.dataset.projectFile);
              $('projectEditor').readOnly = true;
            }),
        );
      } catch (e) {
        $('examResult').hidden = false;
        $('examResult').className = 'mission-feedback failure';
        $('examResult').innerHTML =
          `<div><h3>${escape(e.message)}</h3><ul>${(e.details?.feedback || []).map((f) => `<li>${escape(f)}</li>`).join('')}</ul></div>`;
        $('deliverExam').disabled = false;
      } finally {
        busy = false;
        $('examResult').scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    };
    select(field);
    preview();
  }
  return { school, openExam };
}
