// Exercícios autorais com objetivos, código inicial e critérios de estrutura.
// Soluções ficam no servidor. Este catálogo legado usa validação estática.
// Os desafios novos da escola têm seu avaliador isolado em WebAssembly.
const htmlHints = [
  'Escolha os elementos que expressam o significado do conteúdo.',
  'Confira atributos, texto e fechamento. Preserve a ordem pedida.',
];
const cssHints = [
  'Selecione o elemento ou a classe indicada antes de abrir o bloco.',
  'Confira propriedades, unidades e fechamento de chaves.',
];
const jsHints = [
  'Separe a entrada, a transformação e o resultado esperado.',
  'Confira nomes e operadores. Use os métodos pedidos no enunciado.',
];
// Mantém o formato comum das aulas, práticas e trabalhos adicionais.
function exercise(id, area, title, description, solution, starter, extra = {}) {
  return {
    id,
    area,
    title,
    description,
    solution,
    starter:
      starter ||
      (area === 'HTML'
        ? '<!-- Implemente o conteúdo solicitado -->'
        : area === 'CSS'
          ? '/* Escreva as regras solicitadas */'
          : '// Implemente a solução solicitada'),
    hints: area === 'HTML' ? htmlHints : area === 'CSS' ? cssHints : jsHints,
    ...extra,
  };
}
const schoolSpecs = [
  [
    'HTML',
    'Hierarquia de títulos',
    'Crie um h2 com o texto Minha jornada.',
    '<h2>Minha jornada</h2>',
  ],
  [
    'HTML',
    'Seu primeiro link',
    'Crie um link a com href #portfolio e texto Meu portfólio.',
    '<a href="#portfolio">Meu portfólio</a>',
  ],
  [
    'HTML',
    'Lista de habilidades',
    'Crie uma ul com três li, nesta ordem: HTML, CSS e JavaScript.',
    '<ul><li>HTML</li><li>CSS</li><li>JavaScript</li></ul>',
  ],
  [
    'HTML',
    'Cabeçalho semântico',
    'Crie um header contendo um h1 com o texto DevLife.',
    '<header><h1>DevLife</h1></header>',
  ],
  [
    'HTML',
    'Conteúdo principal',
    'Crie um main contendo um p com o texto Aprender todos os dias.',
    '<main><p>Aprender todos os dias.</p></main>',
  ],
  [
    'HTML',
    'Um artigo de aprendizado',
    'Crie um article contendo, nesta ordem, um h2 com o texto "Meu projeto" e um p com o texto "Primeiro passo". O ponto final no parágrafo é opcional.',
    '<article><h2>Meu projeto</h2><p>Primeiro passo.</p></article>',
  ],
  [
    'HTML',
    'Campo acessível',
    'Crie um label com for email e texto E-mail. Depois, um input com id email, type email e required, nessa ordem de atributos.',
    '<label for="email">E-mail</label><input id="email" type="email" required>',
  ],
  [
    'HTML',
    'Escolha sua trilha',
    'Crie um select com id trilha contendo duas option: value html e texto HTML; value css e texto CSS.',
    '<select id="trilha"><option value="html">HTML</option><option value="css">CSS</option></select>',
  ],
  [
    'CSS',
    'Centralização com Flexbox',
    'Em .painel, use display flex, justify-content center e align-items center.',
    '.painel { display: flex; justify-content: center; align-items: center; }',
  ],
  [
    'CSS',
    'Galeria com Grid',
    'Em .galeria, use display grid, grid-template-columns repeat(3, 1fr) e gap de 16px.',
    '.galeria { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }',
  ],
  [
    'CSS',
    'Espaço para respirar',
    'Em .card, use padding de 24px e margin de 16px.',
    '.card { padding: 24px; margin: 16px; }',
  ],
  [
    'CSS',
    'Cartão com bordas',
    'Em .card, use border 1px solid #a696d4 e border-radius de 12px.',
    '.card { border: 1px solid #a696d4; border-radius: 12px; }',
  ],
  [
    'CSS',
    'Tipografia legível',
    'Em .texto, use font-size de 18px, line-height de 1.6 e font-weight de 400.',
    '.texto { font-size: 18px; line-height: 1.6; font-weight: 400; }',
  ],
  [
    'CSS',
    'Largura adaptável',
    'Em .container, use width 100% e max-width de 960px.',
    '.container { width: 100%; max-width: 960px; }',
  ],
  [
    'CSS',
    'Primeira media query',
    'Em @media (max-width: 600px), crie uma regra .galeria com grid-template-columns 1fr.',
    '@media (max-width: 600px) { .galeria { grid-template-columns: 1fr; } }',
  ],
  [
    'JavaScript',
    'Valores que mudam',
    'Declare let pontos com valor 0 e, na linha seguinte, incremente com pontos += 10.',
    'let pontos = 0; pontos += 10;',
  ],
  [
    'JavaScript',
    'Uma função com parâmetros',
    'Declare a função somar com parâmetros a e b. Retorne a + b.',
    'function somar(a, b) { return a + b; }',
  ],
  [
    'JavaScript',
    'Lista de tarefas',
    'Declare const tarefas como array com as strings estudar e praticar. Depois use push para adicionar trabalhar.',
    'const tarefas = ["estudar", "praticar"]; tarefas.push("trabalhar");',
  ],
  [
    'JavaScript',
    'Dados do personagem',
    'Declare const dev como objeto com nome Noriano e nivel 1, nessa ordem.',
    'const dev = { nome: "Noriano", nivel: 1 };',
  ],
  [
    'JavaScript',
    'Tomando decisões',
    'Declare podeEntrar(nivel). Use if (nivel >= 2) para retornar true; após o if, retorne false.',
    'function podeEntrar(nivel) { if (nivel >= 2) { return true; } return false; }',
  ],
  [
    'JavaScript',
    'Transformar com map',
    'Declare const dobrados com [1, 2, 3].map(n => n * 2).',
    'const dobrados = [1, 2, 3].map(n => n * 2);',
  ],
  [
    'JavaScript',
    'Selecionar com filter',
    'Declare const pares com [1, 2, 3, 4].filter(n => n % 2 === 0).',
    'const pares = [1, 2, 3, 4].filter(n => n % 2 === 0);',
  ],
  [
    'JavaScript',
    'Somar com reduce',
    'Declare const total com [10, 20, 30].reduce((soma, n) => soma + n, 0).',
    'const total = [10, 20, 30].reduce((soma, n) => soma + n, 0);',
  ],
];
export const extraLessons = schoolSpecs.map(([area, title, description, solution], i) =>
  exercise(`lesson-${i + 8}`, area, title, description, solution, null, {
    xp: 85 + Math.floor(i / 5) * 10,
    money: 0,
    skill: 5,
  }),
);
const homeSpecs = [
  ['HTML', 'Subtítulo do diário', 'Crie um h2 com o texto Diário dev.', '<h2>Diário dev</h2>'],
  [
    'HTML',
    'Ir para projetos',
    'Crie um a com href #projetos e texto Projetos.',
    '<a href="#projetos">Projetos</a>',
  ],
  [
    'HTML',
    'Minha rotina',
    'Crie uma ul com dois li: Estudar e Praticar, nessa ordem.',
    '<ul><li>Estudar</li><li>Praticar</li></ul>',
  ],
  [
    'HTML',
    'Cabeçalho pessoal',
    'Crie um header com um h1 escrito Meu espaço.',
    '<header><h1>Meu espaço</h1></header>',
  ],
  [
    'HTML',
    'Conteúdo do diário',
    'Crie um main com um p escrito Hoje eu evoluí.',
    '<main><p>Hoje eu evoluí.</p></main>',
  ],
  [
    'HTML',
    'Post sobre código',
    'Crie um article com h2 escrito Aprendizado e p escrito Um passo de cada vez.',
    '<article><h2>Aprendizado</h2><p>Um passo de cada vez.</p></article>',
  ],
  [
    'HTML',
    'Formulário pessoal',
    'Crie um label com for nome e texto Nome. Depois um input com id nome, type text e required, nessa ordem.',
    '<label for="nome">Nome</label><input id="nome" type="text" required>',
  ],
  [
    'HTML',
    'Selecionar um tema',
    'Crie um select com id tema e uma option com value claro e texto Claro.',
    '<select id="tema"><option value="claro">Claro</option></select>',
  ],
  [
    'CSS',
    'Alinhar o diário',
    'Em .diario, use display flex, justify-content center e align-items center.',
    '.diario { display: flex; justify-content: center; align-items: center; }',
  ],
  [
    'CSS',
    'Projetos em colunas',
    'Em .projetos, use display grid, grid-template-columns repeat(2, 1fr) e gap 24px.',
    '.projetos { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }',
  ],
  [
    'CSS',
    'Espaçamento do perfil',
    'Em .perfil, use padding 16px e margin 8px.',
    '.perfil { padding: 16px; margin: 8px; }',
  ],
  [
    'CSS',
    'Bordas da foto',
    'Em .foto, use border 2px solid #67e8f9 e border-radius 16px.',
    '.foto { border: 2px solid #67e8f9; border-radius: 16px; }',
  ],
  [
    'CSS',
    'Título editorial',
    'Em .titulo, use font-size 24px, line-height 1.4 e font-weight 700.',
    '.titulo { font-size: 24px; line-height: 1.4; font-weight: 700; }',
  ],
  [
    'CSS',
    'Uma página fluida',
    'Em .pagina, use width 100% e max-width 720px.',
    '.pagina { width: 100%; max-width: 720px; }',
  ],
  [
    'CSS',
    'Projetos no celular',
    'Em @media (max-width: 480px), faça .projetos ter grid-template-columns 1fr.',
    '@media (max-width: 480px) { .projetos { grid-template-columns: 1fr; } }',
  ],
  [
    'JavaScript',
    'Contador de revisões',
    'Declare let revisoes = 0; depois use revisoes += 1.',
    'let revisoes = 0; revisoes += 1;',
  ],
  [
    'JavaScript',
    'Multiplicação reutilizável',
    'Crie multiplicar(a, b), retornando a * b.',
    'function multiplicar(a, b) { return a * b; }',
  ],
  [
    'JavaScript',
    'Livros para ler',
    'Declare const livros com a string HTML. Use push para adicionar CSS.',
    'const livros = ["HTML"]; livros.push("CSS");',
  ],
  [
    'JavaScript',
    'Meu perfil',
    'Declare const perfil com nome Dev e ativo true, nessa ordem.',
    'const perfil = { nome: "Dev", ativo: true };',
  ],
  [
    'JavaScript',
    'Verificar saldo',
    'Declare podeComprar(saldo): se saldo >= 100, retorne true; após o if, retorne false.',
    'function podeComprar(saldo) { if (saldo >= 100) { return true; } return false; }',
  ],
  [
    'JavaScript',
    'Triplicar números',
    'Declare const triplos com [2, 4, 6].map(n => n * 3).',
    'const triplos = [2, 4, 6].map(n => n * 3);',
  ],
  [
    'JavaScript',
    'Somente positivos',
    'Declare const positivos com [-1, 0, 2, 5].filter(n => n > 0).',
    'const positivos = [-1, 0, 2, 5].filter(n => n > 0);',
  ],
  [
    'JavaScript',
    'Custo total',
    'Declare const custo com [5, 15, 25].reduce((soma, n) => soma + n, 0).',
    'const custo = [5, 15, 25].reduce((soma, n) => soma + n, 0);',
  ],
  [
    'HTML',
    'Rodapé pessoal',
    'Crie um footer contendo um p escrito Feito com dedicação.',
    '<footer><p>Feito com dedicação.</p></footer>',
  ],
  [
    'HTML',
    'Mais uma lista',
    'Crie uma ol com dois li: Planejar e Construir.',
    '<ol><li>Planejar</li><li>Construir</li></ol>',
  ],
  [
    'CSS',
    'Botão arredondado',
    'Em .botao, use padding 12px e border-radius 8px.',
    '.botao { padding: 12px; border-radius: 8px; }',
  ],
  [
    'CSS',
    'Título centralizado',
    'Em .titulo, use text-align center e color #67e8f9.',
    '.titulo { text-align: center; color: #67e8f9; }',
  ],
  [
    'JavaScript',
    'Mensagem personalizada',
    'Crie saudar(nome), retornando "Olá, " + nome.',
    'function saudar(nome) { return "Olá, " + nome; }',
  ],
  [
    'JavaScript',
    'Extrair nomes',
    'Declare const nomes com [{ nome: "Ana" }, { nome: "Leo" }].map(dev => dev.nome).',
    'const nomes = [{ nome: "Ana" }, { nome: "Leo" }].map(dev => dev.nome);',
  ],
  [
    'JavaScript',
    'Contar conquistas',
    'Declare const quantidade com ["HTML", "CSS", "JS"].length.',
    'const quantidade = ["HTML", "CSS", "JS"].length;',
  ],
];
export const extraPractices = homeSpecs.map(([area, title, description, solution], i) =>
  exercise(`home-${i + 7}`, area, title, description, solution, null, {
    requires: i < 23 ? extraLessons[i].id : extraLessons[[3, 2, 10, 12, 16, 20, 17][i - 23]].id,
  }),
);
// Cada faixa contém dez entregas. from indica quantas já foram concluídas.
export const careerTiers = [
  {
    title: 'Estagiário',
    from: 0,
    minXp: 150,
    basePay: 240,
    payStep: 12,
    xp: 60,
    cooldownMinutes: 2,
  },
  {
    title: 'Dev Júnior',
    from: 10,
    minXp: 900,
    basePay: 390,
    payStep: 18,
    xp: 90,
    cooldownMinutes: 3,
  },
  {
    title: 'Dev Pleno',
    from: 20,
    minXp: 1900,
    basePay: 630,
    payStep: 24,
    xp: 120,
    cooldownMinutes: 4,
  },
  {
    title: 'Dev Sênior',
    from: 30,
    minXp: 3200,
    basePay: 930,
    payStep: 30,
    xp: 160,
    cooldownMinutes: 6,
  },
  {
    title: 'Tech Lead',
    from: 40,
    minXp: 4900,
    basePay: 1440,
    payStep: 42,
    xp: 210,
    cooldownMinutes: 10,
  },
];
const workSpecs = [
  [
    'HTML',
    'Cadastro quebrado',
    'Remova disabled do button com id enviar e texto Enviar.',
    '<button id="enviar">Enviar</button>',
    '<button id="enviar" disabled>Enviar</button>',
  ],
  [
    'HTML',
    'Título da central',
    'Troque o título para um h1 escrito Central de suporte.',
    '<h1>Central de suporte</h1>',
    '<h3>Central de suporte</h3>',
  ],
  [
    'HTML',
    'Link de atendimento',
    'Crie um a com href #contato e texto Fale conosco.',
    '<a href="#contato">Fale conosco</a>',
    '<a>Fale conosco</a>',
  ],
  [
    'HTML',
    'Aviso ao cliente',
    'Crie um p escrito Seu pedido foi recebido.',
    '<p>Seu pedido foi recebido.</p>',
    '<span>Seu pedido foi recebido.</span>',
  ],
  [
    'HTML',
    'Lista de serviços',
    'Crie uma ul com li Site e li Aplicativo, nesta ordem.',
    '<ul><li>Site</li><li>Aplicativo</li></ul>',
    '<ul>Site Aplicativo</ul>',
  ],
  [
    'HTML',
    'Cabeçalho da empresa',
    'Crie um header com h1 escrito TechSoft.',
    '<header><h1>TechSoft</h1></header>',
  ],
  [
    'HTML',
    'Botão de busca',
    'Crie um button com id buscar e texto Buscar.',
    '<button id="buscar">Buscar</button>',
    '<button id="busca">Buscar</button>',
  ],
  [
    'HTML',
    'Campo obrigatório',
    'Crie um input com id email, type email e required, nessa ordem.',
    '<input id="email" type="email" required>',
    '<input id="email" type="text">',
  ],
  [
    'HTML',
    'Artigo de ajuda',
    'Crie um article com h2 escrito Como começar e p escrito Crie sua conta.',
    '<article><h2>Como começar</h2><p>Crie sua conta.</p></article>',
  ],
  [
    'HTML',
    'Rodapé institucional',
    'Crie um footer com p escrito TechSoft 2026.',
    '<footer><p>TechSoft 2026</p></footer>',
  ],
  [
    'CSS',
    'Marca do cliente',
    'Em .marca, use color #67e8f9 e font-weight 700.',
    '.marca { color: #67e8f9; font-weight: 700; }',
  ],
  [
    'CSS',
    'Barra de navegação',
    'Em .nav, use display flex e gap 20px.',
    '.nav { display: flex; gap: 20px; }',
  ],
  [
    'CSS',
    'Centralizar login',
    'Em .login, use display flex, justify-content center e align-items center.',
    '.login { display: flex; justify-content: center; align-items: center; }',
  ],
  [
    'CSS',
    'Cartão de produto',
    'Em .produto, use padding 24px e border-radius 12px.',
    '.produto { padding: 24px; border-radius: 12px; }',
  ],
  [
    'CSS',
    'Catálogo em grid',
    'Em .catalogo, use display grid, grid-template-columns repeat(3, 1fr) e gap 24px.',
    '.catalogo { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }',
  ],
  [
    'CSS',
    'Formulário fluido',
    'Em .formulario, use width 100% e max-width 480px.',
    '.formulario { width: 100%; max-width: 480px; }',
  ],
  [
    'CSS',
    'Texto acessível',
    'Em .descricao, use font-size 16px e line-height 1.6.',
    '.descricao { font-size: 16px; line-height: 1.6; }',
  ],
  [
    'CSS',
    'Estado de foco',
    'Em .campo, use border 2px solid #a696d4 e padding 12px.',
    '.campo { border: 2px solid #a696d4; padding: 12px; }',
  ],
  [
    'CSS',
    'Layout móvel',
    'Em @media (max-width: 640px), .catalogo deve ter grid-template-columns 1fr.',
    '@media (max-width: 640px) { .catalogo { grid-template-columns: 1fr; } }',
  ],
  [
    'CSS',
    'Botão consistente',
    'Em .acao, use background-color #a696d4, color white e border-radius 8px.',
    '.acao { background-color: #a696d4; color: white; border-radius: 8px; }',
  ],
  [
    'JavaScript',
    'Somar o carrinho',
    'Crie somar(a, b) retornando a + b.',
    'function somar(a, b) { return a + b; }',
    'function somar(a, b) { return a - b; }',
  ],
  [
    'JavaScript',
    'Desconto percentual',
    'Crie descontar(preco), retornando preco * 0.9.',
    'function descontar(preco) { return preco * 0.9; }',
  ],
  [
    'JavaScript',
    'Bloquear menor saldo',
    'Crie temSaldo(saldo): se saldo >= 80, retorne true; depois do if, retorne false.',
    'function temSaldo(saldo) { if (saldo >= 80) { return true; } return false; }',
  ],
  [
    'JavaScript',
    'Atualizar contador',
    'Declare let cliques = 0; depois use cliques += 1.',
    'let cliques = 0; cliques += 1;',
  ],
  [
    'JavaScript',
    'Registrar usuário',
    'Declare const usuario com nome Ana e ativo true, nessa ordem.',
    'const usuario = { nome: "Ana", ativo: true };',
  ],
  [
    'JavaScript',
    'Adicionar pedido',
    'Declare const pedidos = [1, 2]; depois use pedidos.push(3).',
    'const pedidos = [1, 2]; pedidos.push(3);',
  ],
  [
    'JavaScript',
    'Taxa de entrega',
    'Crie calcularEntrega(valor), retornando valor + 15.',
    'function calcularEntrega(valor) { return valor + 15; }',
  ],
  [
    'JavaScript',
    'Validar senha',
    'Crie senhaValida(senha), retornando senha.length >= 8.',
    'function senhaValida(senha) { return senha.length >= 8; }',
  ],
  [
    'JavaScript',
    'Mensagem do cliente',
    'Crie mensagem(nome), retornando "Olá, " + nome.',
    'function mensagem(nome) { return "Olá, " + nome; }',
  ],
  [
    'JavaScript',
    'Selecionar botão',
    'Declare const botao = document.querySelector("#enviar").',
    'const botao = document.querySelector("#enviar");',
  ],
  [
    'JavaScript',
    'Preços com desconto',
    'Declare const precos = [100, 200, 300].map(preco => preco * 0.9).',
    'const precos = [100, 200, 300].map(preco => preco * 0.9);',
  ],
  [
    'JavaScript',
    'Filtrar estoque',
    'Declare const disponiveis = [0, 3, 5, 0].filter(quantidade => quantidade > 0).',
    'const disponiveis = [0, 3, 5, 0].filter(quantidade => quantidade > 0);',
  ],
  [
    'JavaScript',
    'Faturamento total',
    'Declare const receita = [120, 80, 200].reduce((total, valor) => total + valor, 0).',
    'const receita = [120, 80, 200].reduce((total, valor) => total + valor, 0);',
  ],
  [
    'JavaScript',
    'Nomes da equipe',
    'Declare const nomes = [{ nome: "Ana" }, { nome: "Leo" }].map(pessoa => pessoa.nome).',
    'const nomes = [{ nome: "Ana" }, { nome: "Leo" }].map(pessoa => pessoa.nome);',
  ],
  [
    'JavaScript',
    'Remover cancelados',
    'Declare const ativos = [{ ativo: true }, { ativo: false }].filter(pedido => pedido.ativo).',
    'const ativos = [{ ativo: true }, { ativo: false }].filter(pedido => pedido.ativo);',
  ],
  [
    'JavaScript',
    'Encontrar um ticket',
    'Declare const ticket = [1, 2, 3].find(id => id === 2).',
    'const ticket = [1, 2, 3].find(id => id === 2);',
  ],
  [
    'JavaScript',
    'Ordenar os valores',
    'Declare const ordenados = [30, 5, 12].sort((a, b) => a - b).',
    'const ordenados = [30, 5, 12].sort((a, b) => a - b);',
  ],
  [
    'JavaScript',
    'Total de acessos',
    'Declare const acessos = [2, 4, 6].reduce((soma, n) => soma + n, 0).',
    'const acessos = [2, 4, 6].reduce((soma, n) => soma + n, 0);',
  ],
  [
    'JavaScript',
    'Todos são válidos?',
    'Declare const validos = [10, 20, 30].every(valor => valor > 0).',
    'const validos = [10, 20, 30].every(valor => valor > 0);',
  ],
  [
    'JavaScript',
    'Existe pendência?',
    'Declare const pendente = [false, true, false].some(valor => valor === true).',
    'const pendente = [false, true, false].some(valor => valor === true);',
  ],
  [
    'JavaScript',
    'Evento de entrega',
    'Declare const botao = document.querySelector("#enviar"); depois use botao.addEventListener("click", enviar).',
    'const botao = document.querySelector("#enviar"); botao.addEventListener("click", enviar);',
  ],
  [
    'JavaScript',
    'Atualizar mensagem',
    'Declare const status = document.querySelector("#status"); depois atribua "Concluído" a status.textContent.',
    'const status = document.querySelector("#status"); status.textContent = "Concluído";',
  ],
  [
    'JavaScript',
    'Estado visual',
    'Declare const card = document.querySelector(".card"); depois use card.classList.add("ativo").',
    'const card = document.querySelector(".card"); card.classList.add("ativo");',
  ],
  [
    'JavaScript',
    'Remover estado de erro',
    'Declare const campo = document.querySelector("#email"); depois use campo.classList.remove("erro").',
    'const campo = document.querySelector("#email"); campo.classList.remove("erro");',
  ],
  [
    'JavaScript',
    'Serializar configurações',
    'Declare const texto = JSON.stringify({ tema: "claro", ativo: true }).',
    'const texto = JSON.stringify({ tema: "claro", ativo: true });',
  ],
  [
    'JavaScript',
    'Ler configurações',
    'Declare const config = JSON.parse(\'{"tema":"claro"}\').',
    'const config = JSON.parse(\'{"tema":"claro"}\');',
  ],
  [
    'JavaScript',
    'Gravar preferência',
    'Use localStorage.setItem("tema", "claro").',
    'localStorage.setItem("tema", "claro");',
  ],
  [
    'JavaScript',
    'Buscar preferência',
    'Declare const tema = localStorage.getItem("tema").',
    'const tema = localStorage.getItem("tema");',
  ],
  [
    'JavaScript',
    'Contrato assíncrono',
    'Crie async function carregar() que retorna await Promise.resolve("ok").',
    'async function carregar() { return await Promise.resolve("ok"); }',
  ],
  [
    'JavaScript',
    'Entrega da liderança',
    'Crie resumir(tickets), retornando tickets.filter(t => t.concluido).map(t => t.titulo).',
    'function resumir(tickets) { return tickets.filter(t => t.concluido).map(t => t.titulo); }',
  ],
];
export const works = workSpecs.map(([area, title, description, solution, starter], i) => {
  const tier = careerTiers[Math.floor(i / 10)];
  return exercise(
    i === 0 ? 'ticket-button' : `work-${i + 1}`,
    area,
    title,
    description,
    solution,
    starter,
    {
      kind: 'work',
      stage: i + 1,
      tier: tier.title,
      xp: tier.xp,
      money: tier.basePay + (i % 10) * tier.payStep,
      skill: 2,
      minXp: tier.minXp,
      cooldownMinutes: tier.cooldownMinutes,
    },
  );
});
// Compara os tokens pedidos sem executar o código do jogador.
// Espaços fora de strings e comentários não mudam a resposta.
export function normalizeHtmlTextPunctuation(source) {
  if (!/^\s*</.test(source)) return source;
  let literalDepth = 0;
  return source.replace(/<!--[\s\S]*?-->|<[^>"']*(?:"[^"]*"[^>"']*|'[^']*'[^>"']*)*>|[^<]+/g, (part) => {
    if (part.startsWith('<')) {
      if (/^<\/(?:script|style|code|pre|samp|kbd)\b/i.test(part)) literalDepth--;
      else if (/^<(?:script|style|code|pre|samp|kbd)\b/i.test(part)) literalDepth++;
      return part;
    }
    // Somente o ponto final do texto visível; atributos e código permanecem exatos.
    return literalDepth > 0 ? part : part.replace(/([\p{L}\p{N}])\.(\s*)$/u, '$1$2');
  });
}
export function structuralMatch(source, solution) {
  if (/^\s*</.test(solution)) {
    source = normalizeHtmlTextPunctuation(source);
    solution = normalizeHtmlTextPunctuation(solution);
  }
  const tokens = (s) =>
    (
      s.match(
        /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|<!--[^]*?-->|\/\*[^]*?\*\/|\/\/[^\n]*|[\p{L}_$][\p{L}\p{N}_$]*|\d+(?:\.\d+)?|===|!==|=>|==|!=|>=|<=|\+=|-=|&&|\|\||[^\s]/gu,
      ) || []
    )
      .filter((t) => !t.startsWith('<!--') && !t.startsWith('/*') && !t.startsWith('//'))
      .map((t) => (t.startsWith('"') || t.startsWith("'") ? 'STRING:' + t.slice(1, -1) : t))
      .join('|');
  return tokens(source).replace(/\|;$/, '') === tokens(solution).replace(/\|;$/, '');
}
