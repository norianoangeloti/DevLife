import { drawHomePreview, drawPortrait, drawItem } from './world.js';
export function createInventory({ getState, getContent, action, showPanel, notebook }) {
  const $ = (id) => document.getElementById(id);
  const types = {
    bed: 'Camas',
    sofa: 'Sofás',
    rug: 'Tapetes',
    shelf: 'Estantes',
    chair: 'Cadeiras',
    desk: 'Mesas',
    monitor: 'Monitores',
    keyboard: 'Teclados',
    speaker: 'Caixas de som',
    shirt: 'Roupas',
    cap: 'Bonés',
    headphones: 'Fones',
    plant: 'Plantas',
    lamp: 'Luminárias',
    poster: 'Quadros',
    curtains: 'Cortinas',
    mug: 'Canecas',
    clock: 'Relógios',
    neon: 'Letreiros',
    books: 'Livros',
    wardrobe: 'Armários',
    computer: 'Computadores',
    mouse: 'Mouses',
    table: 'Mesas auxiliares',
    pants: 'Calças',
    hairstyle: 'Cabelos',
    vehicle:'Veículos',
  };
  function open(mode = 'house', category = 'Todos', type = 'Todos') {
    const state = getState(),
      catalog = getContent().items;
    const shop = mode === 'shop';
    // A loja filtra os modelos; o inventário mantém todas as compras do jogador.
    const items = catalog
      .filter(
        (i) =>
          !i.common &&
          (shop
            ? !i.legacy && !i.region && (i.gender === 'all' || i.gender === state.gender)
            : state.inventory.includes(i.id)) &&
          (category === 'Todos' || i.category === category) &&
          (type === 'Todos' || i.slot === type),
      )
      .sort((a, b) => a.minLevel - b.minLevel || a.price - b.price);
    const availableTypes = [
      ...new Set(
        catalog
          .filter(
            (i) =>
              !i.common &&
              (shop
                ? !i.legacy && !i.region && (i.gender === 'all' || i.gender === state.gender)
                : state.inventory.includes(i.id)) &&
              (category === 'Todos' || i.category === category),
          )
          .map((i) => i.slot),
      ),
    ];
    showPanel(
      shop ? 'ARMAZÉM · FEITO PARA O SEU DEV' : 'SEU LAR · PERSONALIZE SEU CANTINHO',
      `<div class="inventory-heading"><div><h2>${shop ? 'Um lar com a sua personalidade.' : 'Cada conquista tem seu lugar.'}</h2><p>${shop ? 'Compre, equipe e veja a diferença na prévia.' : 'A prévia mostra exatamente os itens equipados na sua casa.'}</p></div><span class="wallet">◈ ${state.money} moedas</span></div><div class="inventory-layout"><aside class="live-preview"><div class="eyebrow">SUA CASA · PRÉVIA AO VIVO</div><canvas id="homePreview" width="960" height="640" aria-label="Prévia da casa com os itens equipados"></canvas><div class="preview-player"><canvas id="outfitPreview" width="128" height="128" aria-label="Prévia da roupa equipada"></canvas><div><b>Seu personagem</b><p>Roupas e acessórios mudam aqui e no mapa.</p></div></div><div class="preview-note">✓ Alterações salvas automaticamente.<br>Itens do mesmo tipo substituem o anterior.</div>${!shop ? '<button id="openNotebook" class="secondary">⌘ Abrir meu DevBook</button>' : ''}</aside><section><div class="inventory-filters">${['Todos', 'Móveis', 'Setup', 'Decoração', 'Roupas'].map((c) => `<button data-category="${c}" class="${c === category ? 'active' : ''}">${c}</button>`).join('')}</div><div class="item-grid">${
        items
          .map((i) => {
            const owned = state.inventory.includes(i.id),
              equipped = state.equipped.includes(i.id),
              fits = i.gender === 'all' || i.gender === state.gender;
            return `<article class="item-card ${equipped ? 'equipped' : ''}"><div class="item-art"><canvas width="160" height="105" data-art="${i.id}" aria-label="${i.name}"></canvas>${equipped ? '<span>✓ EQUIPADO</span>' : ''}</div><small>${i.category}${i.gender === 'all' ? '' : i.gender === 'female' ? ' · Feminino' : ' · Masculino'}</small><h3>${i.name}</h3><p>${i.description}</p><div class="item-price">${owned ? 'SEU INVENTÁRIO' : `${i.price} moedas · nível ${i.minLevel}`}</div><button class="${equipped ? 'secondary' : 'primary'}" ${(!owned && (state.money < i.price || state.level < i.minLevel)) || (owned && !fits && !equipped) ? 'disabled' : ''} data-item="${i.id}" data-action="${owned ? 'equip' : 'buy'}">${owned ? (equipped ? 'Guardar' : !fits ? 'Troque o personagem' : 'Equipar') : state.level < i.minLevel ? 'Requer nível ' + i.minLevel : state.money < i.price ? 'Faltam moedas' : 'Comprar e equipar'}</button></article>`;
          })
          .join('') ||
        '<div class="empty-state">Nenhum item aqui ainda. Visite o armazém para encontrar sua primeira decoração.</div>'
      }</div></section></div>`,
    );
    drawHomePreview($('homePreview').getContext('2d'), state);
    drawPortrait($('outfitPreview').getContext('2d'), state);
    document.querySelectorAll('[data-art]').forEach((c) =>
      drawItem(
        c.getContext('2d'),
        catalog.find((i) => i.id === c.dataset.art),
      ),
    );
    document
      .querySelectorAll('[data-category]')
      .forEach((b) => (b.onclick = () => open(mode, b.dataset.category)));
    document.querySelectorAll('[data-item]').forEach(
      (b) =>
        (b.onclick = async () => {
          b.disabled = true;
          b.textContent = 'Salvando…';
          const result = await action(b.dataset.action, { id: b.dataset.item });
          if (result) open(mode, category, type);
          else {
            b.disabled = false;
            b.textContent = 'Tentar novamente';
          }
        }),
    );
    const filters = document.querySelector('.inventory-filters');
    const typeFilter = document.createElement('label');
    typeFilter.className = 'inventory-type';
    typeFilter.innerHTML = `Tipo <select id="inventoryType"><option value="Todos">Todos os tipos</option>${availableTypes.map((slot) => `<option value="${slot}" ${slot === type ? 'selected' : ''}>${types[slot]}</option>`).join('')}</select><small>${items.length} itens · nível ${state.level}</small>`;
    filters.after(typeFilter);
    $('inventoryType').onchange = (event) => open(mode, category, event.target.value);
    if ($('openNotebook')) $('openNotebook').onclick = notebook;
  }
  return { house: () => open('house'), shop: () => open('shop') };
}
