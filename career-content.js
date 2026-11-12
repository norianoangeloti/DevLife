import { legacySchoolLessons as schoolLessons } from './school-content.js';
import { structuralMatch } from './curriculum.js';
export const careerTiers = [
  {
    title: 'Estagiário',
    count: 10,
    start: 0,
    cooldownMinutes: 2,
    xp: 120,
    salary: 240,
    minXp: 150,
    areas: ['HTML'],
    stage: 'beginner',
  },
  {
    title: 'Dev Júnior',
    count: 20,
    start: 10,
    cooldownMinutes: 3,
    xp: 160,
    salary: 450,
    minXp: 900,
    areas: ['HTML', 'CSS'],
    stage: 'beginner',
  },
  {
    title: 'Dev Pleno',
    count: 30,
    start: 30,
    cooldownMinutes: 4,
    xp: 200,
    salary: 700,
    minXp: 1900,
    areas: ['HTML', 'CSS', 'JavaScript'],
    stage: 'beginner',
  },
  {
    title: 'Dev Sênior',
    count: 40,
    start: 60,
    cooldownMinutes: 6,
    xp: 240,
    salary: 1100,
    minXp: 3200,
    areas: ['HTML', 'CSS', 'JavaScript'],
    stage: 'intermediate',
  },
  {
    title: 'Tech Lead',
    count: 50,
    start: 100,
    cooldownMinutes: 10,
    xp: 300,
    salary: 1700,
    minXp: 4900,
    areas: ['HTML', 'CSS', 'JavaScript'],
    stage: 'advanced',
  },
];
const businesses = [
  'DevLife',
  'Biblioteca Saber',
  'Loja Horizonte',
  'Clínica Aurora',
  'Escola Futuro',
  'ERP DevCity',
  'Mercado Verde',
  'Portal de Clientes',
  'Gestão de Estoque',
  'Central de Pedidos',
];
function contextHtml(company, rows) {
  return `<header><h1>${company}</h1><nav>Início · Clientes · Relatórios</nav></header>\n<main><h2>Painel da equipe</h2>\n${Array.from({ length: rows }, (_, i) => `<article class="registro"><h3>Registro ${i + 1}</h3><p>Pedido ${101 + i} · Cliente ${i + 1} · ${50 + i * 7} moedas</p></article>`).join('\n')}\n</main>\n<footer>Sistema interno · ${company}</footer>`;
}
export const works = careerTiers.flatMap((tier, ti) =>
  Array.from({ length: tier.count }, (_, i) => {
    const area = tier.areas[i % tier.areas.length];
    const pool = schoolLessons.filter((l) => l.area === area && l.stage === tier.stage);
    let lesson = pool[Math.floor(i / tier.areas.length) % pool.length];
    if (ti === 4 && area === 'JavaScript') {
      const erpModules = [
        [
          'Faturamento pago',
          'faturamento',
          'pedidos',
          'pedidos.filter(p => p.pago).reduce((total, p) => total + p.valor, 0)',
          'Some o valor apenas dos pedidos pagos. Use filter e reduce com valor inicial 0.',
        ],
        [
          'Estoque disponível',
          'disponivel',
          'produtos',
          'produtos.filter(p => p.estoque > 0)',
          'Retorne somente produtos com estoque maior que zero usando filter.',
        ],
        [
          'Total de unidades',
          'unidades',
          'produtos',
          'produtos.reduce((total, p) => total + p.estoque, 0)',
          'Some o estoque de todos os produtos com reduce e valor inicial 0.',
        ],
        [
          'Pedidos pendentes',
          'pendentes',
          'pedidos',
          'pedidos.filter(p => !p.pago)',
          'Retorne os pedidos ainda não pagos com filter.',
        ],
        [
          'Clientes ativos',
          'ativos',
          'clientes',
          'clientes.filter(c => c.ativo)',
          'Retorne somente os clientes ativos com filter.',
        ],
        [
          'Preço com desconto',
          'desconto',
          'preco',
          'Math.round(preco * 0.9 * 100) / 100',
          'Aplique desconto de 10%, arredondando para duas casas com Math.round.',
        ],
        [
          'Ticket médio',
          'ticketMedio',
          'pedidos',
          'pedidos.length ? pedidos.reduce((total, p) => total + p.valor, 0) / pedidos.length : 0',
          'Some os valores e divida pela quantidade; retorne 0 para lista vazia. Use ternário e reduce.',
        ],
        [
          'Repor estoque',
          'reposicao',
          'produtos',
          'produtos.filter(p => p.estoque < 5)',
          'Liste produtos cujo estoque está abaixo de cinco unidades com filter.',
        ],
        [
          'Ranking de vendas',
          'ranking',
          'produtos',
          '[...produtos].sort((a, b) => b.vendas - a.vendas)',
          'Ordene uma cópia por vendas em ordem decrescente; preserve o array original.',
        ],
        [
          'IDs de pedidos',
          'identificadores',
          'pedidos',
          'pedidos.map(p => p.id)',
          'Retorne um array com os IDs usando map.',
        ],
        [
          'E-mails únicos',
          'emails',
          'clientes',
          '[...new Set(clientes.map(c => c.email))]',
          'Extraia os e-mails e remova duplicados com Set.',
        ],
        [
          'Validação de estoque',
          'estoqueValido',
          'produtos',
          'produtos.every(p => p.estoque >= 0)',
          'Confira se nenhum estoque é negativo com every.',
        ],
        [
          'Alerta de dívida',
          'inadimplencia',
          'clientes',
          'clientes.some(c => c.divida > 0)',
          'Retorne true quando existir cliente com dívida usando some.',
        ],
        [
          'Total em aberto',
          'emAberto',
          'pedidos',
          'pedidos.filter(p => !p.pago).reduce((total, p) => total + p.valor, 0)',
          'Some os valores dos pedidos não pagos usando filter e reduce.',
        ],
        [
          'Clientes em ordem',
          'ordenarClientes',
          'clientes',
          '[...clientes].sort((a, b) => a.nome.localeCompare(b.nome))',
          'Ordene uma cópia por nome, usando localeCompare.',
        ],
        [
          'Saldo de caixa',
          'saldo',
          'movimentos',
          'movimentos.reduce((total, m) => total + m.valor, 0)',
          'Some os movimentos positivos e negativos com reduce e valor inicial 0.',
        ],
      ];
      const [title, name, param, expression, description] =
        erpModules[Math.floor(i / 3) % erpModules.length];
      lesson = {
        ...lesson,
        title,
        description: `Implemente function ${name}(${param}) retornando ${expression}. ${description}`,
        solution: `function ${name}(${param}) {\n  return ${expression};\n}`,
      };
    }
    const company = businesses[i % businesses.length];
    const fixture = contextHtml(company, 3 + ti * 4 + Math.floor(i / 10));
    let correct, broken;
    if (area === 'HTML') {
      correct = lesson.solution;
      // O defeito aparece dentro do módulo real, com todo o restante preservado.
      broken = correct
        .replace(/<([\w-]+)/, '<span')
        .replace(/<\/([\w-]+)>(?![\s\S]*<\/)/, '</span>');
      if (broken === correct) broken = correct.replace(/="([^"]+)"/, '="BUG"');
      if (broken === correct) broken = '<!-- módulo apagado -->';
    } else if (area === 'CSS') {
      correct = lesson.solution;
      broken = correct.replace(/:\s*[^;}]+/, ': initial');
    } else {
      correct = lesson.solution;
      broken = correct.replace(/\btrue\b/, 'false').replace(/\*\s*2/, '* 0');
      if (broken === correct) broken = correct.replace(/"([^"]+)"/, '"BUG"');
      if (broken === correct) broken = '// TODO: módulo removido por engano';
    }
    const before =
      area === 'HTML'
        ? fixture + '\n<section id="modulo">\n'
        : area === 'CSS'
          ? '/* Estilos globais preservados */\nbody {font-family:sans-serif;background:#f1f5f9;color:#0f172a}\n.registro {padding:12px;border:1px solid #cbd5e1;margin:8px}\n' +
            Array.from(
              { length: 4 + ti * 6 },
              (_, n) =>
                `.registro-${n + 1} {padding:${12 + n}px;border-radius:${4 + n}px;background:#e2e8f0}`,
            ).join('\n') +
            '\n/* Módulo com defeito */\n'
          : '// Dados do sistema\n' +
            Array.from(
              { length: 5 + ti * 5 },
              (_, n) =>
                `const registro${n + 1} = {id:${n + 1},valor:${(n + 1) * 25},pago:${n % 2 === 0}};`,
            ).join('\n') +
            '\nconst numeros=[1,2,3], notas=[8,9], cursos=["HTML","CSS","JS"], extras=["Node"], produtos=[{id:1,estoque:4,vendas:10},{id:2,estoque:8,vendas:5}], clientes=[{nome:"Ana",email:"ana@example.com",ativo:true,divida:0},{nome:"Bia",email:"bia@example.com",ativo:false,divida:50}], movimentos=[{valor:100},{valor:-30}], perfil={nome:"Dev",nivel:1}, nome="Dev", valor="120", entrada=0, usuario={}, pontos=50, ativo=true, preco=120, json="{}", pedidos=[{id:1,pago:true,valor:100},{id:2,pago:false,valor:50}];\n// Módulo com defeito\n';
    const after = area === 'HTML' ? '\n</section>' : '\n';
    const declaration = correct.match(/^(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/);
    const variable = correct.match(/^const\s+(\w+)\s*=/);
    const examples = {
      a: '3',
      b: '4',
      nota: '8',
      n: '5',
      nome: '"Dev"',
      pedidos: 'pedidos',
      produtos: 'produtos',
      clientes: 'clientes',
      preco: 'preco',
      movimentos: 'movimentos',
      json: 'json',
    };
    const expression = declaration
      ? `${declaration[1]}(${declaration[2]
          .split(',')
          .filter((p) => p.trim())
          .map((p) => examples[p.trim()] || '5')
          .join(',')})`
      : variable
        ? variable[1]
        : null;
    const previewAfterScript =
      area === 'JavaScript' && expression
        ? `\nconst resultadoDoTicket=document.createElement('pre');resultadoDoTicket.textContent='Resultado do módulo: '+JSON.stringify(typeof ${expression}==='function'?${expression}(5):${expression});resultadoDoTicket.style.cssText='padding:20px;background:#dcfce7;color:#14532d;border-radius:12px';document.body.prepend(resultadoDoTicket);`
        : '';
    return {
      id: `job-${tier.start + i + 1}`,
      kind: 'work',
      stage: tier.start + i + 1,
      tier: ti,
      area,
      title: `${company} · ${lesson.title}`,
      description: `Na empresa ${company}, ${ti === 4 ? 'o ERP de clientes, estoque e pedidos' : 'o site da equipe'} apresentou um problema no módulo “${lesson.title}”. Corrija o trecho com defeito, preservando o restante do código. Critério: ${lesson.description}`,
      starter: before + broken + after,
      solution: before + correct + after,
      previewHtml: fixture + '\n' + lesson.previewHtml,
      previewAfterScript,
      xp: tier.xp,
      money: tier.salary + i * 12,
      skill: 2,
      minXp: tier.minXp,
      cooldownMinutes: tier.cooldownMinutes,
      hints: [
        'Localize o módulo com defeito no fim do arquivo e compare seu comportamento com o requisito.',
        ...lesson.hints,
      ],
    };
  }),
);
export const recruitmentExams = careerTiers.map((tier, ti) => {
  const area = ti < 2 ? 'HTML' : ti === 2 ? 'CSS' : 'JavaScript';
  const lesson = schoolLessons.filter((l) => l.area === area && l.stage === tier.stage)[
    ti === 4 ? 69 % 40 : ti + 2
  ];
  return {
    ...lesson,
    id: `recruit-${ti}`,
    kind: 'recruitment',
    title: `Avaliação · ${tier.title}`,
    description: `Demonstre que está pronto para ${tier.title}. ${lesson.description}`,
    xp: 100 + ti * 100,
    money: 0,
    skill: 3,
    tier: ti,
    requires: [],
  };
});
export const tierForCount = (count) =>
  Math.min(
    4,
    careerTiers.findIndex((t) => count < t.start + t.count) < 0
      ? 4
      : careerTiers.findIndex((t) => count < t.start + t.count),
  );
export function validateWork(id, code) {
  const work = [...works, ...recruitmentExams].find((w) => w.id === id);
  return !!work && structuralMatch(code, work.solution);
}
