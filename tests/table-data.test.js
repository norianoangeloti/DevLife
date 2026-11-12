import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../content.js';
import { schoolLessons } from '../school-content.js';

test('Dados de tabela exige tabela completa com cabeçalho, linhas e resumo', () => {
  const id = 'school-html-intermediate-13';
  const fragment = '<tbody><tr><td>HTML</td><td>10 aulas</td></tr></tbody>';
  const solution = schoolLessons.find(lesson => lesson.id === id).solution;
  assert.equal(validate(id, solution), true);
  assert.equal(validate(id, solution.replaceAll('scope="col"', 'scope=\'col\'')), true);
  assert.equal(validate(id, fragment), false);
  assert.equal(validate(id, solution.replace(/<tfoot>[\s\S]*?<\/tfoot>/, '')), false);
  assert.equal(validate(id, solution.replace('scope="row"', '')), false);
});
