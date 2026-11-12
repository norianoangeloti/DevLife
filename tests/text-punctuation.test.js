import test from 'node:test';
import assert from 'node:assert/strict';
import { schoolLessons } from '../school-content.js';
import { lessons, practices, validate } from '../content.js';
import { structuralMatch } from '../curriculum.js';

test('Exercícios HTML aceitam texto com ou sem ponto final', () => {
  for (const lesson of [...lessons, ...practices, ...schoolLessons]) {
    if (lesson.area !== 'HTML' || !lesson.solution) continue;
    if (/<(?:script|style|code|pre|samp|kbd)\b/i.test(lesson.solution)) continue;
    for (const dot of ['', '.']) {
      const answer = lesson.solution.replace(/>([^<]+)</g, (match, text) =>
        `>${text.replace(/([\p{L}\p{N}])\.?(\s*)$/u, `$1${dot}$2`)}<`);
      assert.equal(validate(lesson.id, answer), true, `${lesson.id}: ${answer}`);
    }
  }
});

test('Ponto opcional não altera atributos, sintaxe, decimais ou texto interno', () => {
  assert.equal(structuralMatch('<p>Olá.</p>', '<p>Olá</p>'), true);
  assert.equal(structuralMatch('<p>Valor 1.5.</p>', '<p>Valor 1.5</p>'), true);
  for (const [answer, solution] of [
    ['<img src="avatarpng">', '<img src="avatar.png">'],
    ['const x = obj.nome;', 'const x = objnome;'],
    ['<code>obj.nome.</code>', '<code>obj.nome</code>'],
    ['<p>Valor 15</p>', '<p>Valor 1.5</p>'],
    ['<p>Aprenda Trabalhe</p>', '<p>Aprenda. Trabalhe</p>'],
  ]) assert.equal(structuralMatch(answer, solution), false);
});
