import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { schoolLessons } from '../school-content.js';
import { exercisePreview } from '../public/exercise-preview.js';

test('As 40 aulas de HTML avançado têm prévia e observação sem alterar a resposta', () => {
  const lessons = schoolLessons.filter(l => l.area === 'HTML' && l.stage === 'advanced');
  assert.equal(lessons.length, 40);
  for (const lesson of lessons) {
    const page = exercisePreview(lesson, lesson.solution);
    assert.match(page, /id="htmlObservation"/, lesson.id);
    for (const script of page.matchAll(/<script type="module">([\s\S]*?)<\/script>/g))
      assert.doesNotThrow(() => new vm.Script(script[1]), lesson.id);
  }
});

test('Inspector recebe o HTML original como dado, sem executar scripts do aluno', () => {
  const lesson = schoolLessons.find(l => l.title === 'Idioma do documento');
  const source = '<html lang="pt-BR"><head></head><body><script>globalThis.injected = true;</script></body></html>';
  const page = exercisePreview(lesson, source);
  const scripts = [...page.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)];
  let inspected;
  const sentinel = new Error('inspected');
  const context = vm.createContext({ DOMParser: class { parseFromString(value) { inspected = value; throw sentinel; } } });
  assert.throws(() => vm.runInContext(scripts.at(-1)[1], context), error => error === sentinel);
  assert.equal(inspected, source);
  assert.equal(context.injected, undefined);
  assert.ok(!page.includes('<script>globalThis.injected'));
});
