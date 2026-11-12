import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../content.js';

test('Artigo aceita o enunciado literal, pontuação opcional e formatação', () => {
  for (const text of ['Primeiro passo', 'Primeiro passo.']) {
    assert.equal(
      validate('lesson-13', `<article><h2>Meu projeto</h2><p>${text}</p></article>`),
      true,
    );
    assert.equal(
      validate(
        'lesson-13',
        `<!-- Minha resposta -->
      <article>
        <h2> Meu projeto </h2>
        <p> ${text} </p>
      </article>`,
      ),
      true,
    );
  }
});

test('Artigo continua exigindo conteúdo, hierarquia e ordem corretos', () => {
  for (const code of [
    '<h2>Meu projeto</h2><p>Primeiro passo</p>',
    '<article><h2>Outro projeto</h2><p>Primeiro passo</p></article>',
    '<article><h2>Meu projeto</h2><p>Outro passo</p></article>',
    '<article><p>Primeiro passo</p><h2>Meu projeto</h2></article>',
    '<article><h2>Meu projeto</h2></article><p>Primeiro passo</p>',
    '<article><h2>Meu projeto</h2><p>Primeiro passo</p>',
  ])
    assert.equal(validate('lesson-13', code), false, code);
});
