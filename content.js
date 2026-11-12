import { clubTracks } from './public/expansion-rules.js';
import {
  extraLessons,
  extraPractices,
  works as legacyWorks,
  structuralMatch,
  normalizeHtmlTextPunctuation,
} from './curriculum.js';
import { works, careerTiers, validateWork } from './career-content.js';
import { schoolLessons, schoolExams, schoolStages, validateSchool, schoolFeedback } from './school-content.js';
export { schoolLessons, schoolExams, schoolStages };
export { works, careerTiers };
import { levelForXp, xpForLevel } from './public/economy.js';
import { shopModels, legacyShopModels, commonItems, regionalItems } from './public/shop-models.js';
export { levelForXp };
// A solução fica no servidor. publicExercise remove esse campo do catálogo enviado.
export const lessons = [
  {
    id: 'html-title',
    area: 'HTML',
    title: 'Uma escola com nome',
    description:
      'A escola está sem placa! HTML organiza o conteúdo. Use um título principal h1 com o texto Dev School.',
    starter: '<!-- Crie o título da escola aqui -->',
    solution: '<h1>Dev School</h1>',
    xp: 50,
    money: 25,
    skill: 20,
  },
  {
    id: 'html-text',
    area: 'HTML',
    title: 'Boas-vindas à cidade',
    description:
      'Um parágrafo usa a tag p. Crie um parágrafo com o texto Aprenda. Trabalhe. Evolua.',
    starter: '<!-- Escreva uma mensagem usando p -->',
    solution: '<p>Aprenda. Trabalhe. Evolua.</p>',
    xp: 50,
    money: 25,
    skill: 20,
  },
  {
    id: 'html-button',
    area: 'HTML',
    title: 'Seu primeiro botão',
    description:
      'Botões representam ações. Crie um button com id estudar e texto Estudar. O id identifica um elemento específico.',
    starter: '<!-- Crie um botão -->',
    solution: '<button id="estudar">Estudar</button>',
    xp: 60,
    money: 30,
    skill: 20,
  },
  {
    id: 'css-color',
    area: 'CSS',
    title: 'Pinte a Dev School',
    description:
      'CSS muda a aparência. Crie uma regra .school-title com color: #67e8f9; A placa da escola mudará no mapa.',
    starter: '.school-title {\n  /* Defina a cor */\n}',
    solution: '.school-title { color: #67e8f9; }',
    xp: 70,
    money: 35,
    skill: 25,
  },
  {
    id: 'css-flex',
    area: 'CSS',
    title: 'Organize a sala',
    description:
      'Flexbox distribui elementos. Em .sala, defina display: flex; e gap: 16px; para separar as cadeiras.',
    starter: '.sala {\n  /* Organize os elementos */\n}',
    solution: '.sala { display: flex; gap: 16px; }',
    xp: 70,
    money: 35,
    skill: 25,
  },
  {
    id: 'js-variable',
    area: 'JavaScript',
    title: 'Olá, desenvolvedor',
    description:
      'Uma constante guarda um valor. Declare uma constante chamada mensagem contendo o texto Hello World. Este desafio introdutório aceita uma declaração literal.',
    starter: '// Declare a constante mensagem',
    solution: 'const mensagem = "Hello World";',
    xp: 80,
    money: 40,
    skill: 20,
  },
  {
    id: 'js-door',
    area: 'JavaScript',
    title: 'Uma passagem para o futuro',
    description:
      'Funções agrupam instruções. Crie uma função chamada abrirPorta, sem parâmetros, que retorne o booleano true para representar uma permissão de acesso. Nesta missão praticamos uma função simples com retorno booleano. A praça é liberada somente pela prova de JavaScript iniciante.',
    starter: 'function abrirPorta() {\n  // Retorne true\n}',
    solution: 'function abrirPorta() { return true; }',
    xp: 90,
    money: 45,
    skill: 20,
  },
];
export const ticket = legacyWorks[0];
export const items = [
  {
    id: 'plant',
    name: 'Monstera',
    category: 'Decoração',
    slot: 'plant',
    price: 60,
    description: 'Folhagens grandes ao lado da cama.',
    color: '#69a779',
  },
  {
    id: 'rug',
    name: 'Tapete oceano',
    category: 'Móveis',
    slot: 'rug',
    price: 90,
    description: 'Um tapete grande com desenho geométrico.',
    color: '#629cb2',
  },
  {
    id: 'desk',
    name: 'Mesa de desenvolvedor',
    category: 'Setup',
    slot: 'desk',
    price: 160,
    description: 'Mesa ampla de nogueira com gavetas.',
    color: '#a87851',
  },
  {
    id: 'shirt',
    name: 'Moletom lavanda',
    category: 'Roupas',
    slot: 'shirt',
    price: 80,
    description: 'Troca a roupa do seu personagem.',
    color: '#a696d4',
  },
  {
    id: 'rug-coral',
    name: 'Tapete pôr do sol',
    category: 'Móveis',
    slot: 'rug',
    price: 110,
    description: 'Estampa terracota para aquecer o ambiente.',
    color: '#cb8876',
  },
  {
    id: 'chair',
    name: 'Cadeira ergonômica',
    category: 'Setup',
    slot: 'chair',
    price: 120,
    description: 'Encosto alto, braços e rodinhas.',
    color: '#506881',
  },
  {
    id: 'monitor',
    name: 'Monitor ultrawide',
    category: 'Setup',
    slot: 'monitor',
    price: 200,
    description: 'Tela panorâmica com editor iluminado.',
    color: '#75c1cc',
  },
  {
    id: 'sofa',
    name: 'Sofá de veludo',
    category: 'Móveis',
    slot: 'sofa',
    price: 180,
    description: 'Dois lugares com almofadas aconchegantes.',
    color: '#b48f78',
  },
  {
    id: 'lamp',
    name: 'Luminária âmbar',
    category: 'Decoração',
    slot: 'lamp',
    price: 75,
    description: 'Luz quente no canto de leitura.',
    color: '#edbf77',
  },
  {
    id: 'shelf',
    name: 'Estante do dev',
    category: 'Móveis',
    slot: 'shelf',
    price: 130,
    description: 'Livros e objetos na parede central.',
    color: '#ae855e',
  },
  {
    id: 'poster',
    name: 'Quadro Hello World',
    category: 'Decoração',
    slot: 'poster',
    price: 45,
    description: 'Arte geométrica emoldurada na parede.',
    color: '#7caeac',
  },
  {
    id: 'curtains',
    name: 'Cortinas de linho',
    category: 'Decoração',
    slot: 'curtains',
    price: 65,
    description: 'Cortinas claras nas duas janelas.',
    color: '#e0c6aa',
  },
  {
    id: 'cactus',
    name: 'Cacto de cerâmica',
    category: 'Decoração',
    slot: 'plant',
    price: 50,
    description: 'Substitui a planta por um cacto escultural.',
    color: '#80a185',
  },
  {
    id: 'shirt-orange',
    name: 'Moletom terracota',
    category: 'Roupas',
    slot: 'shirt',
    price: 80,
    description: 'Uma nova cor para explorar a cidade.',
    color: '#d78a67',
  },
  {
    id: 'cap',
    name: 'Boné mostarda',
    category: 'Roupas',
    slot: 'cap',
    price: 55,
    description: 'Aparece na cabeça do personagem.',
    color: '#d6b262',
  },
  {
    id: 'headphones',
    name: 'Fones de estúdio',
    category: 'Roupas',
    slot: 'headphones',
    price: 95,
    description: 'Fones grandes para entrar no modo foco.',
    color: '#587782',
  },
];
export const achievements = [
  { id: 'hello', title: 'Hello World', description: 'Conclua sua primeira missão.' },
  { id: 'html', title: 'Arquiteto HTML', description: 'Conclua as três missões de HTML.' },
  { id: 'job', title: 'Primeiro emprego', description: 'Conquiste o estágio.' },
  { id: 'bug', title: 'Bug Hunter', description: 'Resolva o ticket da empresa.' },
  { id: 'home', title: 'Lar, doce lar', description: 'Compre seu primeiro item.' },
];
// Validadores didáticos de escopo restrito. Não executam código enviado.
export function validate(id, source) {
  if (id.startsWith('practice-school-')) return validateSchool(id.slice(9), source);
  if (id.startsWith('school-')) return validateSchool(id, source);
  if (id.startsWith('job-') || id.startsWith('recruit-')) return validateWork(id, source);
  const code = normalizeHtmlTextPunctuation(source)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[^]*?-->/g, '')
    .trim();
  const element = (tag, text, expectedId) => {
    text = text.replace(/\.$/, '');
    const match = code.match(
      new RegExp(
        `^<${tag}\\b([^>]*)>\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*</${tag}>$`,
        'i',
      ),
    );
    return (
      !!match &&
      (!expectedId || new RegExp(`\\bid\\s*=\\s*(["'])${expectedId}\\1`, 'i').test(match[1])) &&
      !/\b(disabled|on\w+)\b/i.test(match[1])
    );
  };
  const css = (selector, properties) => {
    const match = code.match(/^([.\w-]+)\s*\{([^{}]*)\}\s*$/);
    if (!match || match[1] !== selector) return false;
    const declarations = Object.fromEntries(
      match[2]
        .split(';')
        .filter((s) => s.trim())
        .map((s) => s.split(':').map((v) => v.trim().toLowerCase())),
    );
    return Object.entries(properties).every(([k, v]) => declarations[k] === v);
  };
  switch (id) {
    case 'lesson-13':
      // O ponto que encerra o enunciado não precisa fazer parte do texto do aluno.
      return /^<article\s*>\s*<h2\s*>\s*Meu\s+projeto\s*<\/h2\s*>\s*<p\s*>\s*Primeiro\s+passo\.?\s*<\/p\s*>\s*<\/article\s*>$/i.test(
        code,
      );
    case 'html-title':
      return element('h1', 'Dev School');
    case 'html-text':
      return element('p', 'Aprenda. Trabalhe. Evolua.');
    case 'html-button':
      return element('button', 'Estudar', 'estudar');
    case 'css-color':
      return css('.school-title', { color: '#67e8f9' });
    case 'css-flex':
      return css('.sala', { display: 'flex', gap: '16px' });
    case 'js-variable':
      return /^const\s+mensagem\s*=\s*(["'])Hello World\1\s*;?$/.test(
        code.replace(/^\s*\/\/.*$/gm, '').trim(),
      );
    case 'js-door':
      return /^function\s+abrirPorta\s*\(\s*\)\s*\{\s*return\s+true\s*;?\s*\}$/.test(
        code.replace(/^\s*\/\/.*$/gm, '').trim(),
      );
    case 'ticket-button':
      return element('button', 'Enviar', 'enviar');
    case 'practice-title':
      return element('h2', 'Meu portfólio');
    case 'practice-text':
      return element('p', 'Estou aprendendo a programar.');
    case 'practice-button':
      return element('button', 'Salvar', 'salvar');
    case 'practice-color':
      return css('.perfil', { color: '#a696d4' });
    case 'practice-flex':
      return css('.portfolio', { display: 'flex', gap: '24px' });
    case 'practice-function':
      return /^function\s+estaPronto\s*\(\s*\)\s*\{\s*return\s+false\s*;?\s*\}$/.test(
        code.replace(/^\s*\/\/.*$/gm, '').trim(),
      );
    default: {
      const l = [...extraLessons, ...extraPractices, ...works, ...legacyWorks].find(
        (l) => l.id === id,
      );
      return !!l && structuralMatch(source, l.solution);
    }
  }
}

const hints = {
  'html-title': [
    'Um título principal usa uma tag própria, com abertura e fechamento.',
    'O número na tag indica o nível do título. O principal é o nível 1.',
    'Coloque o texto pedido entre as tags, sem acrescentar outras palavras.',
  ],
  'html-text': [
    'Pense no elemento que representa um parágrafo.',
    'A tag tem só uma letra: a primeira de parágrafo.',
    'Verifique os pontos e os espaços do texto; feche a tag ao terminar.',
  ],
  'html-button': [
    'Use um elemento de botão, não um link.',
    'O atributo id fica dentro da tag de abertura e seu valor vai entre aspas.',
    'O texto visível fica entre a abertura e o fechamento do botão.',
  ],
  'css-color': [
    'O ponto antes do nome seleciona uma classe.',
    'Declare a propriedade de cor dentro de chaves.',
    'O valor hexadecimal começa com #. Confira os seis caracteres pedidos.',
  ],
  'css-flex': [
    'Transforme o contêiner em um layout flexível.',
    'A propriedade display escolhe o modo de layout; gap controla o espaço.',
    'Cada declaração tem nome, dois-pontos, valor e ponto-e-vírgula.',
  ],
  'js-variable': [
    'Uma constante não muda seu valor após a declaração.',
    'Use o nome pedido, o sinal de atribuição e uma string.',
    'Strings ficam entre aspas simples ou duplas; confira maiúsculas e espaço.',
  ],
  'js-door': [
    'A função precisa do nome pedido e de parênteses sem parâmetros.',
    'O corpo fica dentro de chaves. Pense na palavra que devolve um resultado.',
    'Um booleano verdadeiro não fica entre aspas.',
  ],
  'ticket-button': [
    'Procure o atributo que impede o botão de ser clicado.',
    'Remova esse atributo sem alterar o identificador.',
    'Confira o texto visível e a tag de fechamento.',
  ],
};
for (const l of [...lessons, ticket]) l.hints = hints[l.id] || l.hints;
lessons.push(...extraLessons);
for (const l of lessons) l.money = 0;
export const practices = [
  {
    id: 'practice-title',
    area: 'HTML',
    requires: 'html-title',
    title: 'Título do seu portfólio',
    description: 'Crie um título de nível 2 com o texto Meu portfólio.',
    starter: '<!-- Escreva seu título -->',
    solution: '<h2>Meu portfólio</h2>',
    hints: [
      'O nível do título é indicado por um número na tag.',
      'Neste exercício, use o segundo nível, com abertura e fechamento.',
    ],
  },
  {
    id: 'practice-text',
    area: 'HTML',
    requires: 'html-text',
    title: 'Sua apresentação',
    description: 'Crie um parágrafo com o texto Estou aprendendo a programar.',
    starter: '<!-- Escreva uma apresentação -->',
    solution: '<p>Estou aprendendo a programar.</p>',
    hints: ['Use o elemento de parágrafo.', 'Confira o ponto final e a tag de fechamento.'],
  },
  {
    id: 'practice-button',
    area: 'HTML',
    requires: 'html-button',
    title: 'Salvar meu projeto',
    description: 'Crie um botão com id salvar e texto Salvar.',
    starter: '<!-- Crie o botão de salvar -->',
    solution: '<button id="salvar">Salvar</button>',
    hints: [
      'O identificador vai na tag de abertura.',
      'O nome do atributo e o texto do botão têm funções diferentes.',
    ],
  },
  {
    id: 'practice-color',
    area: 'CSS',
    requires: 'css-color',
    title: 'Identidade do perfil',
    description: 'Na classe .perfil, defina color com o valor #a696d4.',
    starter: '.perfil {\n  /* Sua cor */\n}',
    solution: '.perfil { color: #a696d4; }',
    hints: [
      'Um seletor de classe começa com ponto.',
      'A declaração da cor fica entre chaves, com o valor hexadecimal pedido.',
    ],
  },
  {
    id: 'practice-flex',
    area: 'CSS',
    requires: 'css-flex',
    title: 'Galeria de projetos',
    description: 'Em .portfolio, configure display: flex e gap de 24px.',
    starter: '.portfolio {\n  /* Organize os projetos */\n}',
    solution: '.portfolio { display: flex; gap: 24px; }',
    hints: [
      'Você precisa de duas propriedades no mesmo seletor.',
      'O espaçamento usa uma unidade de comprimento.',
    ],
  },
  {
    id: 'practice-function',
    area: 'JavaScript',
    requires: 'js-door',
    title: 'Status do projeto',
    description: 'Declare a função estaPronto sem parâmetros. Ela deve retornar o booleano false.',
    starter: 'function estaPronto() {\n  // Qual é o status?\n}',
    solution: 'function estaPronto() { return false; }',
    hints: [
      'O corpo da função precisa devolver um valor.',
      'Um booleano não é uma string. Não use aspas no retorno.',
    ],
  },
];
practices.push(...extraPractices);
practices.push(
  ...schoolLessons.map((l) => ({
    ...l,
    id: 'practice-' + l.id,
    requires: l.id,
    title: 'Prática · ' + l.title,
    xp: 0,
    money: 0,
    skill: 0,
  })),
);
export const publicExercise = ({ solution, html, contract, ...l }) => l;
// Cada tipo de equipamento ocupa um slot: trocar a roupa não remove a decoração.
export function equipItem(state, id) {
  const item = items.find((i) => i.id === id);
  if (!item) return;
  const previous = state.equipped.includes(id);
  if(item.slot==='vehicle')state.activeVehicle=null;
  if(item.slot==='laptop')state.preferredLaptop=id;
  state.equipped = state.equipped.filter(
    (current) =>
      current !== id && (previous || items.find((i) => i.id === current)?.slot !== item.slot),
  );
  if (!previous) state.equipped.push(id);
}
export function feedbackFor(id, source) {
  if (id.startsWith('practice-school-')) {
    const feedback = schoolFeedback(id.slice(9), source);
    if (feedback) return feedback;
  }
  if (id.startsWith('school-')) {
    const feedback = schoolFeedback(id, source);
    if (feedback) return feedback;
  }
  if (id.startsWith('school-') || id.startsWith('job-') || id.startsWith('recruit-'))
    return [
      'Confira o requisito do módulo, os identificadores e os valores pedidos.',
      'Preserve o restante do arquivo. A avaliação aceita mudanças de espaços, comentários e tipo de aspas.',
    ];
  const l = [...lessons, ...works, ...practices].find((l) => l.id === id);
  if (!source.trim())
    return ['O editor está vazio. Escreva sua primeira tentativa antes de validar.'];
  if (id === 'lesson-13')
    return [
      'Confira se o h2 e o p estão dentro do article, nessa ordem, com os textos pedidos. O ponto final do parágrafo é opcional.',
    ];
  if (l.area === 'HTML') {
    const target = l.solution.match(/^<(\w+)\b/)[1];
    const out = [];
    if (!new RegExp(`<${target}\\b`, 'i').test(source))
      out.push(`Use um elemento ${target} para o conteúdo pedido.`);
    if (
      !['input', 'img', 'br', 'hr'].includes(target) &&
      !new RegExp(`</${target}>`, 'i').test(source)
    )
      out.push(`Confira o fechamento do elemento ${target}.`);
    const idMatch = l.solution.match(/id="([^"]+)"/);
    if (idMatch && !new RegExp(`id\\s*=\\s*(["'])${idMatch[1]}\\1`, 'i').test(source))
      out.push(`Confira o atributo id: o identificador pedido é ${idMatch[1]}.`);
    if (/\bdisabled\b/i.test(source))
      out.push('O botão ainda está desabilitado. Revise seus atributos.');
    return out.length
      ? out
      : ['Confira o texto solicitado, seus espaços e pontuação. Use apenas o elemento solicitado.'];
  }
  if (l.area === 'CSS') {
    const selector = l.solution.split('{')[0].trim();
    const out = [];
    if (!source.includes(selector)) out.push(`A regra precisa selecionar ${selector}.`);
    if (!source.includes('{') || !source.includes('}'))
      out.push('Abra e feche o bloco de declarações com chaves.');
    return out.length
      ? out
      : [
          'Revise as propriedades pedidas, seus valores e unidades. Separe cada declaração com ponto-e-vírgula.',
        ];
  }
  return [
    'Confira o nome exato, o valor pedido e a sintaxe.',
    'Strings usam aspas; valores booleanos são escritos sem aspas.',
  ];
}

// Preços e requisitos seguem a mesma ordem do catálogo básico acima.
const prices = [90, 120, 220, 80, 160, 320, 500, 700, 110, 350, 60, 95, 75, 80, 45, 180];
const gates = [0, 150, 450, 0, 450, 900, 1900, 4900, 150, 900, 0, 150, 0, 0, 0, 450];
items.forEach((item, i) => {
  item.price = prices[i];
  item.minXp = gates[i];
});
items.push(
  {
    id: 'keyboard',
    name: 'Teclado mecânico',
    category: 'Setup',
    slot: 'keyboard',
    price: 280,
    minXp: 900,
    description: 'Teclas iluminadas na sua mesa.',
    color: '#83bbb0',
  },
  {
    id: 'mug',
    name: 'Caneca de café',
    category: 'Decoração',
    slot: 'mug',
    price: 35,
    minXp: 0,
    description: 'Uma pausa ao lado do notebook.',
    color: '#e7c28e',
  },
  {
    id: 'clock',
    name: 'Relógio minimalista',
    category: 'Decoração',
    slot: 'clock',
    price: 140,
    minXp: 300,
    description: 'Um relógio na parede do estúdio.',
    color: '#d8c6aa',
  },
  {
    id: 'neon',
    name: 'Letreiro CODE',
    category: 'Decoração',
    slot: 'neon',
    price: 1000,
    minXp: 8500,
    description: 'Luz ciano para seu estúdio.',
    color: '#78e6dc',
  },
  {
    id: 'bonsai',
    name: 'Bonsai zen',
    category: 'Decoração',
    slot: 'plant',
    price: 480,
    minXp: 3200,
    description: 'Uma árvore em miniatura no canto da casa.',
    color: '#86aa70',
  },
  {
    id: 'books',
    name: 'Coleção de programação',
    category: 'Decoração',
    slot: 'books',
    price: 180,
    minXp: 600,
    description: 'Livros coloridos sobre a mesa.',
    color: '#b599cf',
  },
  {
    id: 'speaker',
    name: 'Caixas de som',
    category: 'Setup',
    slot: 'speaker',
    price: 560,
    minXp: 4900,
    description: 'Um par de caixas para acompanhar o setup.',
    color: '#596d83',
  },
  {
    id: 'shirt-mint',
    name: 'Moletom menta',
    category: 'Roupas',
    slot: 'shirt',
    price: 120,
    minXp: 300,
    description: 'Verde menta no seu personagem.',
    color: '#83bda1',
  },
);
for (const a of achievements) a.icon = '🏆';
for (const [n, title, icon] of [
  [10, 'Desenvolvedor Júnior', '🥉'],
  [20, 'Desenvolvedor Pleno', '🥈'],
  [30, 'Desenvolvedor Sênior', '🥇'],
  [40, 'Tech Lead', '💎'],
  [50, 'Lenda da TechSoft', '👑'],
])
  achievements.push({
    id: 'career-' + n,
    title,
    icon,
    description: `Entregue ${n} trabalhos na TechSoft.`,
  });
for (const n of [10, 20, 30])
  achievements.push({
    id: 'school-' + n,
    title: { 10: 'Mente Curiosa', 20: 'Explorador do Código', 30: 'Mestre da Dev School' }[n],
    icon: '🎓',
    description: `Conclua ${n} aulas na escola.`,
  });
for (const n of [5, 10])
  achievements.push({
    id: 'practice-' + n,
    title: { 5: 'Mão na Massa', 10: 'Código Afiado' }[n],
    icon: '🧠',
    description: `Acerte ${n} tentativas no DevBook.`,
  });

for (const [id, title, badge, description] of [
  ['html', 'Leitor de Estruturas', 'HTML', 'Conclua o volume de HTML da biblioteca.'],
  ['css', 'Leitor de Estilos', 'CSS', 'Conclua o volume de CSS da biblioteca.'],
  ['javascript', 'Leitor Eloquente', 'JS', 'Conclua JavaScript Eloquente na biblioteca.'],
])
  achievements.push({ id: 'book-' + id, title, badge, icon: '🏆', description });

export const hairColors = [
  { color: '#51423f', name: 'Castanho' },
  { color: '#252630', name: 'Preto' },
  { color: '#d6b56e', name: 'Loiro' },
  { color: '#ac593e', name: 'Ruivo' },
  { color: '#d6d8df', name: 'Prateado' },
  { color: '#a680c7', name: 'Lilás' },
  { color: '#d57f9e', name: 'Rosa' },
];
for (const item of items) item.gender = item.category === 'Roupas' ? 'male' : 'all';
// Os modelos compartilham preço e slot, mas têm identificadores separados.
for (const original of items.filter((i) => i.category === 'Roupas'))
  items.push({
    ...original,
    id: original.id + '-female',
    gender: 'female',
    name: original.name + ' · Feminino',
    description: original.description + ' Modelo feminino.',
  });
for (const a of achievements) a.image = '/trophies/' + a.id + '.svg?v=2';
for (const a of achievements.filter((a) => a.id.startsWith('career-'))) a.legacy = true;
export const itemFits = (item, gender) => item.gender === 'all' || item.gender === gender;
items.push({
  id: 'gamer-chair',
  name: 'Cadeira gamer',
  category: 'Móveis',
  slot: 'chair',
  price: 720,
  minXp: 3200,
  gender: 'all',
  color: '#80dfd0',
  description: 'Encosto alto, detalhes menta e rodinhas. Substitui a cadeira da sua mesa.',
});
// Itens antigos mantêm seus identificadores e continuam no inventário.
for (const item of items) {
  item.minLevel = levelForXp(item.minXp);
  if (xpForLevel(item.minLevel) < item.minXp) item.minLevel++;
}
items.push(...legacyShopModels.map((item) => ({ ...item, minXp: xpForLevel(item.minLevel) })));
for (const original of legacyShopModels.filter((item) => item.gender === 'male'))
  items.push({
    ...original,
    id: original.id + '-female',
    gender: 'female',
    minXp: xpForLevel(original.minLevel),
  });
for (const item of items) item.legacy = true;
items.push(
  ...commonItems,
  ...regionalItems,
  ...shopModels.map((item) => ({ ...item, minXp: xpForLevel(item.minLevel) })),
);
for (const original of shopModels.filter((item) => item.gender === 'male'))
  items.push({
    ...original,
    id: original.id + '-female',
    gender: 'female',
    name: original.name + ' · Feminino',
    minXp: xpForLevel(original.minLevel),
  });
for (const exam of schoolExams)
  achievements.push({
    id: exam.id,
    title: `${exam.area} · ${exam.stageName}`,
    badge: `${exam.area === 'JavaScript' ? 'JS' : exam.area} ${{ beginner: 'I', intermediate: 'II', advanced: 'III' }[exam.stage]}`,
    icon: '🏆',
    description: `Conclua a prova de ${exam.area} da etapa ${exam.stageName.toLowerCase()}.`,
    image: `/trophies/${exam.id}.svg?v=4`,
  });
for (const [index, tier] of careerTiers.entries())
  achievements.push({
    id: `promotion-${index}`,
    title: index === 4 ? 'Arquiteto de Sistemas' : `Carreira · ${tier.title}`,
    badge: ['ESTÁGIO', 'JÚNIOR', 'PLENO', 'SÊNIOR', 'LEAD'][index],
    icon: '🏆',
    description: `Seja aprovado na avaliação para ${tier.title}.`,
    image: `/trophies/promotion-${index}.svg?v=4`,
  });
achievements.push({
  id: 'career-complete',
  title: 'Lenda da DevCity',
  badge: 'LENDA',
  icon: '🏆',
  description: 'Conclua os 150 trabalhos da carreira.',
  image: '/trophies/career-complete.svg?v=4',
});
achievements.push({
  id: 'level-100',
  title: 'Centenário do Código',
  badge: 'MESTRE',
  icon: '🏆',
  description: 'Alcance o nível máximo 100.',
  image: '/trophies/level-100.svg?v=4',
});
for(const [track,area] of Object.entries(clubTracks))achievements.push({
  id:`devclub-${track}-exam`,title:`DevClub · ${area}`,badge:area,icon:'🏆',
  description:`Conclua a prova final de ${area} no DevClub.`,image:`/trophies/devclub-${track}-exam.svg`,
});
achievements.push({id:'project-king',title:'Rei dos Projetos',badge:'REI',icon:'🏆',description:'Vença uma edição da competição mensal de projetos.',image:'/trophies/project-king.svg'});
