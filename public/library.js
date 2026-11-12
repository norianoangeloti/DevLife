let pdfModule;
const documents = new Map();
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

export function createLibrary({ getState, getContent, api, applyState, showPanel }) {
  let view = 0;
  let resizeObserver,
    fit = 'width',
    zoom = 1;
  function open() {
    view++;
    resizeObserver?.disconnect();
    const catalog = getContent().books;
    showPanel(
      'BIBLIOTECA · ACERVO DIGITAL',
      `<div class="library-heading"><span class="library-emblem">▤</span><div><small>JARDIM DO SABER</small><h2>Um universo em cada página.</h2><p>Escolha um livro, leia no seu ritmo e continue de onde parou.</p></div></div><div class="library-books">${catalog
        .map((book) => {
          const progress = getState().bookProgress?.[book.id],
            read = progress?.pagesRead || 0;
          return `<article class="library-book"><div class="book-cover book-${book.cover}"><small>BIBLIOTECA<br>EM PORTUGUÊS</small><strong>${book.area === 'JavaScript' ? 'JS' : book.area}</strong><span>${book.area === 'HTML' ? '〈/〉' : book.area === 'CSS' ? '✦' : '{ }'}</span><b>${book.publisher}</b></div><div class="book-info"><small>${book.language} · ${book.pages} páginas</small><h3>${book.area}</h3><p>${book.description}</p><div class="book-progress"><span style="width:${(100 * read) / book.pages}%"></span></div><small>${progress?.completedAt ? '✓ Leitura concluída' : `${read} de ${book.pages} páginas lidas`}</small><div class="reward-pills"><span>✦ ${book.xp} XP</span><span>↗ ${book.skill} ${book.area}</span></div><button class="primary" data-book="${book.id}">${progress?.completedAt ? 'Reler livro' : read ? 'Continuar leitura →' : 'Abrir livro →'}</button></div></article>`;
        })
        .join(
          '',
        )}</div><p class="library-credit">Acervo em português: volumes de HTML e CSS da UECE e JavaScript Eloquente, traduzido pela comunidade BrazilJS. PDFs originais preservados; os volumes da UECE mostram os capítulos correspondentes e as páginas de créditos. A recompensa é concedida uma vez por livro completo, sem moedas.</p>`,
    );
    document.querySelectorAll('[data-book]').forEach((button) => {
      button.onclick = () => {
        const book = catalog.find((b) => b.id === button.dataset.book);
        reader(
          book,
          getState().bookProgress?.[book.id]?.completedAt
            ? 1
            : Math.min(book.pages, (getState().bookProgress?.[book.id]?.pagesRead || 0) + 1),
        );
      };
    });
  }
  async function reader(book, page) {
    const currentView = ++view;
    const progress = getState().bookProgress?.[book.id],
      read = progress?.pagesRead || 0;
    showPanel(
      'BIBLIOTECA · SALA DE LEITURA',
      `<div class="reader-heading"><button id="backBooks" class="quiet">← Acervo</button><div><h2>${escape(book.title)}</h2><small>${book.language} · ${read}/${book.pages} páginas lidas</small></div><a href="${book.source}" target="_blank" rel="noopener">Fonte e créditos ↗</a></div><div class="reader-toolbar"><button id="previousPage" class="secondary" ${page === 1 ? 'disabled' : ''}>← Anterior</button><b>Página ${page} de ${book.pages}</b><div class="reader-zoom"><button id="fitPage" class="quiet">Página inteira</button><button id="fitWidth" class="quiet">Largura</button><button id="zoomOut" class="quiet" aria-label="Diminuir zoom">−</button><button id="zoomIn" class="quiet" aria-label="Aumentar zoom">+</button></div><button id="nextPage" class="secondary" ${page >= book.pages || page > read ? 'disabled' : ''}>Próxima →</button></div><div class="pdf-reading-area"><p id="pdfStatus" role="status">Preparando sua página…</p><canvas id="pdfPage" aria-label="Página ${page} de ${escape(book.title)}" hidden></canvas></div><details class="pdf-text"><summary>Texto acessível da página</summary><p id="pageText"></p></details><div class="reader-bottom"><span>Leia a página e confirme para salvar seu avanço.</span><button id="readPage" class="primary" disabled>${page <= read ? 'Página já lida ✓' : page === book.pages ? 'Concluir este livro ✦' : 'Li esta página →'}</button></div>`,
    );
    const canvas = document.getElementById('pdfPage'),
      status = document.getElementById('pdfStatus'),
      button = document.getElementById('readPage');
    document.getElementById('backBooks').onclick = open;
    document.getElementById('previousPage').onclick = () => reader(book, page - 1);
    document.getElementById('nextPage').onclick = () => reader(book, page + 1);
    try {
      pdfModule ??= import('./vendor/pdf.mjs');
      const pdf = await pdfModule;
      pdf.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.mjs';
      if (!documents.has(book.id)) {
        const loading = pdf.getDocument({ url: book.file, isEvalSupported: false });
        documents.set(
          book.id,
          loading.promise.catch((error) => {
            documents.delete(book.id);
            throw error;
          }),
        );
      }
      const doc = await documents.get(book.id),
        sheet = await doc.getPage(book.pageNumbers?.[page - 1] || page);
      if (currentView !== view || !canvas.isConnected) return;
      const viewport = sheet.getViewport({ scale: 2 });
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await sheet.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const words = await sheet.getTextContent();
      if (currentView !== view || !canvas.isConnected) return;
      document.getElementById('pageText').textContent = words.items.map((w) => w.str).join(' ');
      status.hidden = true;
      canvas.hidden = false;
      const area = canvas.parentElement;
      function sizePage() {
        const width = Math.max(100, Math.min(900, area.clientWidth - 28));
        const height = Math.max(100, area.clientHeight - 28);
        const scale =
          (fit === 'page'
            ? Math.min(width / viewport.width, height / viewport.height)
            : width / viewport.width) * zoom;
        canvas.style.width = `${viewport.width * scale}px`;
        canvas.style.height = `${viewport.height * scale}px`;
      }
      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(sizePage);
      resizeObserver.observe(area);
      sizePage();
      for (const [id, mode] of [
        ['fitPage', 'page'],
        ['fitWidth', 'width'],
      ]) {
        document.getElementById(id).onclick = () => {
          fit = mode;
          zoom = 1;
          sizePage();
          area.scrollTop = 0;
        };
      }
      document.getElementById('zoomIn').onclick = () => {
        zoom = Math.min(3, zoom + 0.25);
        sizePage();
      };
      document.getElementById('zoomOut').onclick = () => {
        zoom = Math.max(0.5, zoom - 0.25);
        sizePage();
      };
      button.disabled = page <= read;
      button.onclick = async () => {
        button.disabled = true;
        try {
          const result = await api('book-read', { id: book.id, page });
          if(applyState(result.state))return;
          if (currentView !== view || !canvas.isConnected) return;
          if (result.rewarded) completed(book);
          else if (page < book.pages) reader(book, page + 1);
          else open();
        } catch (error) {
          status.hidden = false;
          status.textContent = error.message;
          button.disabled = false;
        }
      };
    } catch (error) {
      if (!status.isConnected) return;
      status.textContent = 'Não foi possível abrir o PDF. Volte ao acervo e tente novamente.';
    }
  }
  function completed(book) {
    view++;
    showPanel(
      'BIBLIOTECA · MAIS UMA CONQUISTA',
      `<div class="book-completed"><div class="completion-spark">✦</div><small>DO COMEÇO AO FIM</small><h2>Livro concluído!</h2><p>Você terminou as ${book.pages} páginas de <b>${escape(book.title)}</b>.</p><div class="reward-pills"><span>+${book.xp} XP</span><span>+${book.skill} conhecimento em ${book.area}</span></div><p>Seu progresso ficou salvo. O conhecimento acompanha você.</p><button id="returnBooks" class="primary">Explorar outros livros →</button></div>`,
    );
    document.getElementById('returnBooks').onclick = open;
  }
  return { open };
}
