import test from 'node:test';
import assert from 'node:assert/strict';
import { books, readBookPage } from '../books.js';
const player = () => ({ xp: 80, money: 25, skills: { HTML: 0, CSS: 0, JavaScript: 95 } });
test('Livros exigem leitura completa em ordem e não recompensam releitura', () => {
  for (const book of books) {
    const state = player();
    assert.equal(readBookPage(state, book.id, book.pages).status, 409);
    assert.equal(state.xp, 80);
    for (let page = 1; page <= book.pages; page++) {
      const result = readBookPage(state, book.id, page, '2026-10-07T12:00:00Z');
      assert.equal(result.status, 200);
      assert.equal(result.rewarded, page === book.pages);
      if (page < book.pages) assert.equal(state.xp, 80);
    }
    assert.equal(state.xp, 80 + book.xp);
    assert.equal(state.money, 25);
    assert.ok(state.skills[book.area] <= 100);
    assert.equal(readBookPage(state, book.id, book.pages).rewarded, false);
    assert.equal(state.xp, 80 + book.xp);
    assert.equal(state.bookProgress[book.id].completedAt, '2026-10-07T12:00:00Z');
  }
});
test('Páginas e livros inválidos não alteram o progresso', () => {
  const state = player();
  for (const page of [0, -1, 1.5, '1', 125, null])
    assert.equal(readBookPage(state, books[0].id, page).status, 400);
  assert.equal(readBookPage(state, 'missing', 1).status, 400);
  assert.equal(state.bookProgress, undefined);
});
test('Acervo em português preserva XP e registros dos livros anteriores', () => {
  const state = player();
  state.bookProgress = { html: { pagesRead: 124, completedAt: '2026-10-06' } };
  readBookPage(state, books[0].id, 1);
  assert.equal(state.xp, 80);
  assert.deepEqual(state.bookProgress.html, { pagesRead: 124, completedAt: '2026-10-06' });
  assert.ok(books.every((book) => book.language === 'Português'));
});
