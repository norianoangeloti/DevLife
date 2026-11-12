export const books = [
  {
    id: 'html-pt',
    cover: 'html',
    area: 'HTML',
    title: 'Desenvolvimento para Web · HTML',
    pageNumbers: [1, 2, 3, 4, 5, 6, ...Array.from({ length: 20 }, (_, i) => i + 18)],
    xp: 200,
    skill: 20,
    color: '#e3a283',
    description:
      'Volume introdutório: capítulo de HTML da UECE, com formulários, links e atividades. Edição de 2015, com exemplos históricos.',
  },
  {
    id: 'css-pt',
    cover: 'css',
    area: 'CSS',
    title: 'Desenvolvimento para Web · CSS',
    pageNumbers: [1, 2, 3, 4, 5, 6, ...Array.from({ length: 15 }, (_, i) => i + 38)],
    xp: 200,
    skill: 25,
    color: '#92bfe2',
    description:
      'Volume introdutório: capítulo de CSS da UECE, com seletores, folhas de estilo e práticas.',
  },
  {
    id: 'javascript-pt',
    cover: 'javascript',
    area: 'JavaScript',
    title: 'JavaScript Eloquente · 4ª edição',
    pages: 368,
    xp: 600,
    skill: 30,
    color: '#e7cc82',
    description: 'Funções, objetos, eventos, promises e muito mais.',
  },
].map((book) => ({
  ...book,
  pages: book.pageNumbers?.length || book.pages,
  file: './books/' + book.cover + '.pdf?v=pt-20261007',
  language: 'Português',
  source:
    book.cover === 'javascript'
      ? 'https://github.com/braziljs/eloquente-javascript'
      : 'https://educapes.capes.gov.br/handle/capes/432205',
  author:
    book.cover === 'javascript'
      ? 'Marijn Haverbeke · tradução BrazilJS'
      : 'Joaquim Celestino Júnior e Robério Gomes Patricio · UECE',
  publisher: book.cover === 'javascript' ? 'BrazilJS' : 'UECE',
}));

// Cada página é confirmada em ordem. Releituras nunca repetem a recompensa.
export function readBookPage(state, id, page, now = new Date().toISOString()) {
  const book = books.find((b) => b.id === id);
  if (!book || !Number.isInteger(page) || page < 1 || page > book.pages)
    return { status: 400, error: 'Livro ou página inválidos.' };
  state.bookProgress ??= {};
  const progress = state.bookProgress[id] ?? { pagesRead: 0, completedAt: null };
  if (page > progress.pagesRead + 1)
    return { status: 409, error: 'Continue da próxima página para concluir o livro inteiro.' };
  state.bookProgress[id] = progress;
  if (page <= progress.pagesRead)
    return { status: 200, completed: !!progress.completedAt, rewarded: false };
  progress.pagesRead = page;
  if (page === book.pages && !progress.completedAt) {
    progress.completedAt = now;
    state.xp += book.xp;
    state.skills[book.area] = Math.min(100, state.skills[book.area] + book.skill);
    return {
      status: 200,
      completed: true,
      rewarded: true,
      reward: { xp: book.xp, skill: book.skill, area: book.area, money: 0 },
    };
  }
  return { status: 200, completed: false, rewarded: false };
}
