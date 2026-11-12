import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, career, finishWork } from '../progression.js';
import { works } from '../content.js';
import { structuralMatch } from '../curriculum.js';
test('Migração preserva a primeira entrega antiga e concede somente o reajuste único', () => {
  const state = { completed: ['ticket-button'], job: 'Estagiário', money: 25, xp: 590 };
  normalize(state);
  assert.equal(career(state, 100).completed, 1);
  assert.equal(career(state, 100).next, 'job-2');
  assert.equal(career(state, 100).remainingMs, 0);
  assert.equal(state.money, 225);
  assert.equal(state.economyAdjustment, 200);
  normalize(state);
  assert.equal(state.money, 225);
  assert.equal(state.gender, 'male');
});
test('Intervalo usa tempo absoluto e continua após salvar e recarregar', () => {
  const state = {
    completed: [],
    job: 'Estagiário',
    work: { completed: [], nextWorkAt: 0 },
    money: 0,
    xp: 160,
    skills: { HTML: 60 },
  };
  finishWork(state, works[0], 1000);
  assert.equal(career(JSON.parse(JSON.stringify(state)), 61000).remainingMs, 60000);
  assert.equal(career(state, 121000).remainingMs, 0);
});
test('Validação tolera formatação sem unir identificadores ou apagar comentários em strings', () => {
  assert.equal(structuralMatch('const pontos=10;', 'const pontos = 10;'), true);
  assert.equal(structuralMatch('constpontos=10;', 'const pontos = 10;'), false);
  assert.equal(
    structuralMatch('const url = "https://dev.test";', 'const url="https://dev.test";'),
    true,
  );
  assert.equal(structuralMatch('const n=x - 1;', 'const n = x-1;'), true);
  assert.equal(structuralMatch('const texto="Hello  World";', 'const texto="Hello World";'), false);
});
