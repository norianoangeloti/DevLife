import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSchool, schoolFeedback } from '../school-content.js';
import { matchHtmlChallenge } from '../school-challenge-validator.js';

const id = 'school-html-advanced-4';
const answer = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Portfólio DevLife com projetos, habilidades e experiências em desenvolvimento web.">
  <title>Portfólio DevLife</title>
</head>
<body>
  <main>
    <h1>Portfólio de Desenvolvimento Web</h1>
    <form role="search">
      <label for="busca">Buscar projetos:</label>
      <input type="search" id="busca" name="q">
      <button type="submit">Buscar</button>
    </form>
  </main>
</body>
</html>`;

test('Aceita a resposta do aluno com metadados antes de title', () => {
  assert.equal(validateSchool(id, answer), true);
  assert.deepEqual(schoolFeedback(id, answer), []);
});
test('Aceita nomes próprios, label envolvendo o campo e submit padrão', () => {
  assert.equal(validateSchool(id, answer.replaceAll('"busca"', '"pesquisa"').replace('name="q"', 'name="termo"')), true);
  const nested = answer.replace('<label for="busca">Buscar projetos:</label>\n      <input type="search" id="busca" name="q">', '<label>Buscar projetos: <input type="search" name="termo"></label>').replace(' type="submit"', '');
  assert.equal(validateSchool(id, nested), true);
});
test('Mantém requisitos semânticos e informa somente os itens que faltam', () => {
  for (const invalid of [answer.replace('role="search"', ''), answer.replace('for="busca"', 'for="outro"'), answer.replace('name="description"', 'name="author"'), answer.replace('name="q"', ''), answer.replace('<h1>Portfólio de Desenvolvimento Web</h1>', '')]) assert.equal(validateSchool(id, invalid), false);
  const errors = schoolFeedback(id, answer.replace('for="busca"', 'for="outro"'));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /label associado/);
});
test('Outros desafios também aceitam ordem livre dos metadados no head', () => {
  const one = '<html lang="pt-BR"><head><title>Página</title><meta name="description" content="Descrição"></head><body><main><h1>Página</h1></main></body></html>';
  const other = one.replace('<title>Página</title><meta name="description" content="Descrição">', '<meta name="description" content="Outro texto"><title>Outro título</title>');
  assert.equal(matchHtmlChallenge(other, one), true);
});
