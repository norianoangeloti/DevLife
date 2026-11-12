import test from 'node:test';
import assert from 'node:assert/strict';
import {
  works,
  lessons,
  schoolLessons,
  schoolExams,
  items,
  itemFits,
  achievements,
  levelForXp,
} from '../content.js';
import { works as oldWorks } from '../curriculum.js';
import { books } from '../books.js';
import { finishWork, normalize, unlock } from '../progression.js';
import { xpForLevel, levelProgress } from '../public/economy.js';
import { shopModels } from '../public/shop-models.js';

test('Carreira original financia o catálogo da loja em moedas para ambos os personagens', () => {
  const income = works.reduce((sum, work) => sum + work.money, 0);
  for (const gender of ['male', 'female']) {
    const catalog = items.filter((item) => !item.legacy && !item.region && itemFits(item, gender));
    const cost = catalog.reduce((sum, item) => sum + item.price, 0);
    assert.equal(income, 193500);
    assert.ok(income > cost);
    const moved = items.filter(item => item.collection === 'DevClub' && itemFits(item, gender));
    assert.ok(moved.length > 0 && moved.every(item => item.region === 'downtown' && item.currency === 'brl'));
    assert.ok((income - cost - moved.reduce((sum,item) => sum + item.price / 100, 0)) / income < 0.11);
    const finalXp =
      schoolLessons.reduce((sum, lesson) => sum + lesson.xp, 0) +
      schoolExams.reduce((sum, exam) => sum + exam.xp, 0) +
      works.reduce((sum, work) => sum + work.xp, 0);
    assert.ok(catalog.every((item) => item.minXp <= finalXp));
  }
  assert.ok(items.some((item) => item.price <= works[0].money && item.minXp === 0));
});
test('Loja exige o primeiro nível que atinge o requisito de XP, com igualdade entre modelos', () => {
  for (const item of items) {
    const threshold = xpForLevel(item.minLevel);
    assert.ok(threshold >= (item.minXp || 0), item.id);
    assert.equal(levelForXp(threshold), item.minLevel);
    if (threshold > 0) assert.equal(levelForXp(threshold - 1), item.minLevel - 1);
    const original = items.find((candidate) => candidate.id === item.id.replace(/-female$/, ''));
    if (original) assert.equal(item.minLevel, original.minLevel);
  }
  assert.equal(items.find((item) => item.id === 'keyboard').minLevel, 7);
  assert.equal(items.find((item) => item.id === 'gamer-chair').minLevel, 16);
});

test('Todos os trabalhos respeitam o intervalo do cargo, inclusive nas promoções', () => {
  const state = {
    completed: [],
    work: { completed: [], nextWorkAt: 0 },
    xp: 3000,
    money: 0,
    skills: { HTML: 0, CSS: 0, JavaScript: 0 },
    job: 'Estagiário',
  };
  works.forEach((work, index) => {
    const minutes = work.cooldownMinutes;
    state.work.tier = work.tier;
    const result = finishWork(state, work, 1000000);
    assert.equal(result.cooldownMinutes, index === 149 ? 0 : minutes);
    assert.equal(state.work.nextWorkAt, index === 149 ? 0 : 1000000 + minutes * 60000);
  });
});

test('Intervalo antigo é encurtado sem renovar a espera ou alterar XP; reajuste é único', () => {
  const state = {
    completed: [],
    work: {
      completed: oldWorks.slice(0, 20).map((work) => work.id),
      nextWorkAt: 1000000 + 20 * 300000,
    },
    money: 300,
    xp: 2000,
  };
  normalize(state);
  assert.equal(state.work.nextWorkAt, 1000000 + 3 * 60000);
  const next = state.work.nextWorkAt;
  const adjustment = oldWorks.slice(0, 20).reduce((sum, work) => sum + (work.money * 5) / 6, 0);
  const campaign = state.campaignAdjustment;
  assert.equal(state.economyAdjustment, adjustment);
  normalize(state);
  assert.equal(state.work.nextWorkAt, next);
  assert.equal(state.money, 300 + adjustment + campaign);
  assert.equal(state.xp, 2000);
});

test('Cada tipo recebe seis modelos com requisitos graduais e versões de roupa equivalentes', () => {
  const slots = [...new Set(shopModels.map((item) => item.slot))];
  assert.equal(slots.length, 25);
  assert.equal(new Set(items.map((item) => item.id)).size, items.length);
  for (const slot of slots) {
    const variants = shopModels.filter((item) => item.slot === slot);
    assert.equal(variants.length, 6, slot);
    for (let index = 1; index < variants.length; index++) {
      assert.ok(variants[index].price > variants[index - 1].price);
      assert.ok(variants[index].minLevel > variants[index - 1].minLevel);
    }
  }
  assert.equal(items.filter((item) => item.slot === 'bed' && !item.legacy).length, 7);
});

test('Curva de níveis é consistente no limite e na barra de progresso', () => {
  for (let level = 1; level <= 80; level++) {
    const xp = xpForLevel(level);
    assert.equal(levelForXp(xp), level);
    if (level > 1) assert.equal(levelForXp(xp - 1), level - 1);
    const progress = levelProgress(xp);
    assert.equal(progress.value, 0);
    assert.equal(progress.required, 150 + (level - 1) * 10);
    assert.equal(progress.next, xpForLevel(level + 1));
  }
});

test('Cada livro libera seu troféu apenas quando concluído, inclusive leituras anteriores', () => {
  const state = {
    completed: [],
    work: { completed: [] },
    inventory: [],
    achievements: [],
    practiceHistory: [],
    bookProgress: {},
  };
  for (const book of books) {
    state.bookProgress[book.id] = { pagesRead: book.pages - 1, completedAt: null };
    unlock(state);
    assert.ok(!state.achievements.includes('book-' + book.cover));
    state.bookProgress[book.id].completedAt = '2026-10-07';
    unlock(state);
    assert.ok(state.achievements.includes('book-' + book.cover));
  }
  unlock(state);
  assert.equal(state.achievements.filter((id) => id.startsWith('book-')).length, 3);
  assert.ok(achievements.every((achievement) => !/\d/.test(achievement.title)));
});
