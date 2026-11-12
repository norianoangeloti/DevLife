import test from 'node:test';
import assert from 'node:assert/strict';
import { schoolLessons, validateSchool } from '../school-content.js';
import { publicExercise } from '../content.js';
import { createLearning } from '../public/learning.js';

test('Todas as 210 aulas têm explicação, exemplo e orientação antes do desafio', () => {
  assert.equal(schoolLessons.length, 210);
  for (const lesson of schoolLessons) {
    const notes = lesson.lesson;
    for (const field of ['title', 'introduction', 'explanation', 'example', 'observation']) {
      assert.equal(typeof notes[field], 'string', `${lesson.id}: ${field}`);
      assert.ok(notes[field].length >= (field === 'title' || field === 'example' ? 10 : 20), `${lesson.id}: ${field}`);
    }
    assert.equal(notes.steps.length, 3);
    assert.equal(validateSchool(lesson.id, notes.example), false, `${lesson.id}: exemplo não deve resolver o desafio`);
    const published = publicExercise(lesson);
    assert.deepEqual(published.lesson, notes);
    assert.ok(!Object.hasOwn(published, 'solution'));
  }
  assert.equal(new Set(schoolLessons.map((lesson) => lesson.lesson.explanation)).size, 210);
});

test('Aula de h1 ensina semântica, hierarquia e abertura/fechamento das tags', () => {
  const notes = schoolLessons.find((lesson) => lesson.id === 'school-html-beginner-1').lesson;
  assert.match(notes.explanation, /assunto principal/);
  assert.match(notes.explanation, /h2 e h3/);
  assert.match(notes.observation, /<h1>.*<\/h1>/);
  assert.equal(notes.example, '<h1>Meu diário de estudos</h1>');
});

test('Tela apresenta aula antes do desafio e do editor, escapa exemplos e permite revisão', () => {
  const originalDocument = globalThis.document;
  const elements = new Map();
  let rendered = '';
  globalThis.document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, {
        setAttribute() {}, removeAttribute() {}, getAttribute: () => '/sandbox-preview.html',
        contentWindow: { postMessage() {} }, addEventListener() {},
      });
      return elements.get(id);
    },
  };
  try {
    const exercise = publicExercise(schoolLessons[0]);
    const learning = createLearning({
      getState: () => ({ completed: [], submissions: {} }),
      showPanel: (_title, html) => { rendered = html; },
    });
    learning.open(exercise);
    assert.ok(rendered.indexOf('lesson-reading') < rendered.indexOf('lesson-task'));
    assert.ok(rendered.indexOf('lesson-task') < rendered.indexOf('mission-grid'));
    assert.ok(rendered.includes('&lt;h1&gt;Meu diário de estudos&lt;/h1&gt;'));
    assert.ok(!rendered.includes('<h1>Meu diário de estudos</h1>'));
    assert.equal(elements.get('editor').value, exercise.starter);
    assert.match(rendered, /<details class="lesson-reading" open>/);
    learning.review(exercise);
    assert.ok(rendered.includes('lesson-reading'));
    learning.open({ ...exercise, id: 'job-1', kind: 'work' });
    assert.ok(!rendered.includes('lesson-reading'));
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});

test('Entrega rola até o resultado tanto no sucesso quanto no erro', async () => {
  const originalDocument = globalThis.document;
  const elements = new Map();
  let fail = false;
  const scrolled = [];
  globalThis.document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, {
        setAttribute() {}, removeAttribute() {}, getAttribute: () => '/sandbox-preview.html',
        contentWindow: { postMessage() {} }, addEventListener() {},
        classList: { add() {}, remove() {} }, isConnected: true,
        focus() {}, scrollIntoView(options) { scrolled.push({ id, options }); },
      });
      return elements.get(id);
    },
  };
  try {
    const learning = createLearning({
      getState: () => ({ completed: [], submissions: {} }),
      showPanel() {}, applyState() {},
      api: async () => {
        if (fail) throw new Error('Revise o título.');
        return { reward: { xp: 60, money: 0, skill: 1, area: 'HTML' } };
      },
    });
    const exercise = publicExercise(schoolLessons[0]);
    learning.open(exercise);
    await elements.get('submitCode').onclick();
    assert.equal(elements.get('missionResult').className, 'mission-feedback success');
    assert.deepEqual(scrolled.at(-1), { id: 'missionResult', options: { block: 'start', behavior: 'smooth' } });
    fail = true;
    learning.open(exercise);
    await elements.get('submitCode').onclick();
    assert.equal(elements.get('missionResult').className, 'mission-feedback failure');
    assert.equal(scrolled.at(-1).id, 'missionResult');
    assert.equal(elements.get('panel')?.scrollTop, undefined);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});
