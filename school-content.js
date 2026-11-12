import { structuralMatch } from './curriculum.js';
import {examPrerequisiteError} from './public/expansion-rules.js';
import { lessonNotes } from './lesson-notes.js';
import { upgradeSchoolLesson } from './school-challenges.js';
import { checkJavascriptChallenge, matchHtmlChallenge, matchCssChallenge, checkSearchDocument, checkAccessibleFeedback, checkHtmlChallenge, checkCssChallenge, checkBeginnerJavascript } from './school-challenge-validator.js';

export const schoolStages = [
  { id: 'beginner', name: 'Iniciante', count: 10, xp: 60, examXp: 300 },
  { id: 'intermediate', name: 'Intermediário', count: 20, xp: 100, examXp: 600 },
  { id: 'advanced', name: 'Avançado', count: 40, xp: 150, examXp: 1200 },
];
const spec = (title, description, solution, html = '') => ({ title, description, solution, html });
const h = (title, description, solution) => spec(title, description, solution);
const c = (
  title,
  selector,
  declarations,
  html = '<main class="pagina"><h1>DevLife</h1><article class="card">Meu projeto</article><button class="botao">Explorar</button></main>',
) =>
  spec(
    title,
    `Em ${selector}, configure ${declarations} (preserve os nomes das propriedades e os valores pedidos).`,
    `${selector} { ${declarations} }`,
    html,
  );
const j = (title, description, solution) => spec(title, description, solution);
// Cada etapa introduz conceitos diferentes; os identificadores não dependem da ordem visual.
const html = [
  h('Título principal', 'Crie um h1 escrito Dev School.', '<h1>Dev School</h1>'),
  h(
    'Meu primeiro parágrafo',
    'Crie um p escrito Aprender todos os dias.',
    '<p>Aprender todos os dias.</p>',
  ),
  h(
    'Um link útil',
    'Crie um a com href #projetos e texto Projetos.',
    '<a href="#projetos">Projetos</a>',
  ),
  h(
    'Botão de estudar',
    'Crie um button com id estudar e texto Estudar.',
    '<button id="estudar">Estudar</button>',
  ),
  h(
    'Lista de tecnologias',
    'Crie uma ul com li HTML, CSS e JavaScript nesta ordem.',
    '<ul><li>HTML</li><li>CSS</li><li>JavaScript</li></ul>',
  ),
  h('Subtítulo', 'Crie um h2 escrito Minha jornada.', '<h2>Minha jornada</h2>'),
  h(
    'Conteúdo importante',
    'Crie um p com texto Meu projeto, deixando projeto dentro de strong.',
    '<p>Meu <strong>projeto</strong></p>',
  ),
  h(
    'Cabeçalho da página',
    'Crie um header contendo um h1 escrito DevLife.',
    '<header><h1>DevLife</h1></header>',
  ),
  h(
    'Rodapé',
    'Crie um footer contendo um p escrito Feito por mim.',
    '<footer><p>Feito por mim.</p></footer>',
  ),
  h(
    'Um artigo de aprendizado',
    'Crie um article com h2 Meu projeto e p Primeiro passo.',
    '<article><h2>Meu projeto</h2><p>Primeiro passo.</p></article>',
  ),
  h(
    'Navegação semântica',
    'Crie um nav com um a href #inicio escrito Início.',
    '<nav><a href="#inicio">Início</a></nav>',
  ),
  h(
    'Conteúdo principal',
    'Crie um main com uma section id projetos contendo h2 Projetos.',
    '<main><section id="projetos"><h2>Projetos</h2></section></main>',
  ),
  h(
    'Lista ordenada',
    'Crie ol com li Planejar, Construir e Testar nesta ordem.',
    '<ol><li>Planejar</li><li>Construir</li><li>Testar</li></ol>',
  ),
  h(
    'Imagem acessível',
    'Crie img com src avatar.png e alt Meu avatar.',
    '<img src="avatar.png" alt="Meu avatar">',
  ),
  h(
    'Figura com legenda',
    'Crie figure com img src cidade.png alt DevCity e figcaption Minha cidade.',
    '<figure><img src="cidade.png" alt="DevCity"><figcaption>Minha cidade</figcaption></figure>',
  ),
  h(
    'Campo de nome',
    'Crie label for nome escrito Nome e depois input id nome type text.',
    '<label for="nome">Nome</label><input id="nome" type="text">',
  ),
  h(
    'Campo de e-mail',
    'Crie input id email type email required.',
    '<input id="email" type="email" required>',
  ),
  h(
    'Formulário de contato',
    'Crie form id contato contendo textarea name mensagem e button type submit escrito Enviar.',
    '<form id="contato"><textarea name="mensagem"></textarea><button type="submit">Enviar</button></form>',
  ),
  h(
    'Opções de curso',
    'Crie select name curso com option value html escrito HTML e value css escrito CSS.',
    '<select name="curso"><option value="html">HTML</option><option value="css">CSS</option></select>',
  ),
  h(
    'Aceite de termos',
    'Crie label contendo input type checkbox name termos e texto Aceito os termos.',
    '<label><input type="checkbox" name="termos">Aceito os termos.</label>',
  ),
  h(
    'Agrupar campos',
    'Crie fieldset com legend Perfil e input name apelido.',
    '<fieldset><legend>Perfil</legend><input name="apelido"></fieldset>',
  ),
  h(
    'Tabela de cursos',
    'Crie table com caption Cursos e tr com th Curso e th Duração.',
    '<table><caption>Cursos</caption><tr><th>Curso</th><th>Duração</th></tr></table>',
  ),
  h(
    'Dados de tabela',
    'Crie uma table contendo tbody com tr e duas células td: HTML e 10 aulas, nesta ordem.',
    '<table><tbody><tr><td>HTML</td><td>10 aulas</td></tr></tbody></table>',
  ),
  h(
    'Detalhes expansíveis',
    'Crie details com summary Ver dica e p Leia o enunciado.',
    '<details><summary>Ver dica</summary><p>Leia o enunciado.</p></details>',
  ),
  h(
    'Data de publicação',
    'Crie time datetime 2026-10-07 escrito 7 de outubro.',
    '<time datetime="2026-10-07">7 de outubro</time>',
  ),
  h(
    'Citação',
    'Crie blockquote contendo p Aprender é praticar.',
    '<blockquote><p>Aprender é praticar.</p></blockquote>',
  ),
  h(
    'Abreviação',
    'Crie abbr title HyperText Markup Language escrito HTML.',
    '<abbr title="HyperText Markup Language">HTML</abbr>',
  ),
  h(
    'Código em linha',
    'Crie p com texto Use seguido de code escrito console.log.',
    '<p>Use <code>console.log</code></p>',
  ),
  h(
    'Barra de progresso',
    'Crie progress value 40 max 100 escrito 40%.',
    '<progress value="40" max="100">40%</progress>',
  ),
  h(
    'Contato semântico',
    'Crie address contendo a href mailto:dev@example.com escrito Fale comigo.',
    '<address><a href="mailto:dev@example.com">Fale comigo</a></address>',
  ),
  h(
    'Idioma do documento',
    'Crie html lang pt-BR com head e body vazios.',
    '<html lang="pt-BR"><head></head><body></body></html>',
  ),
  h('Codificação', 'Crie meta charset UTF-8.', '<meta charset="UTF-8">'),
  h(
    'Viewport responsivo',
    'Crie meta name viewport content width=device-width, initial-scale=1.',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
  ),
  h('Título da aba', 'Crie title escrito Portfólio DevLife.', '<title>Portfólio DevLife</title>'),
  h(
    'Descrição da página',
    'Crie meta name description content Projetos de um desenvolvedor.',
    '<meta name="description" content="Projetos de um desenvolvedor">',
  ),
  h(
    'Folha externa',
    'Crie link rel stylesheet href style.css.',
    '<link rel="stylesheet" href="style.css">',
  ),
  h(
    'Script adiado',
    'Crie script src app.js defer com fechamento.',
    '<script src="app.js" defer></script>',
  ),
  h(
    'Ícone da página',
    'Crie link rel icon href favicon.svg type image/svg+xml.',
    '<link rel="icon" href="favicon.svg" type="image/svg+xml">',
  ),
  h(
    'Pular navegação',
    'Crie a href #conteudo class skip-link escrito Pular para conteúdo.',
    '<a href="#conteudo" class="skip-link">Pular para conteúdo</a>',
  ),
  h(
    'Botão acessível',
    'Crie button type button aria-label Fechar painel escrito ×.',
    '<button type="button" aria-label="Fechar painel">×</button>',
  ),
  h(
    'Estado de expansão',
    'Crie button aria-expanded false aria-controls menu escrito Menu.',
    '<button aria-expanded="false" aria-controls="menu">Menu</button>',
  ),
  h(
    'Aviso dinâmico',
    'Crie div role status aria-live polite escrito Salvo.',
    '<div role="status" aria-live="polite">Salvo</div>',
  ),
  h(
    'Campo com ajuda',
    'Crie input id senha type password aria-describedby ajuda e p id ajuda escrito Use 8 caracteres.',
    '<input id="senha" type="password" aria-describedby="ajuda"><p id="ajuda">Use 8 caracteres.</p>',
  ),
  h(
    'Validação nativa',
    'Crie input name apelido minlength 2 maxlength 24 required.',
    '<input name="apelido" minlength="2" maxlength="24" required>',
  ),
  h(
    'Autocompletar',
    'Crie input type email name email autocomplete email.',
    '<input type="email" name="email" autocomplete="email">',
  ),
  h(
    'Campo numérico',
    'Crie input type number name quantidade min 1 max 10 step 1.',
    '<input type="number" name="quantidade" min="1" max="10" step="1">',
  ),
  h(
    'Rádio de plano',
    'Crie label com input type radio name plano value basico e texto Básico.',
    '<label><input type="radio" name="plano" value="basico">Básico</label>',
  ),
  h(
    'Agrupar opções',
    'Crie select name trilha com optgroup label Front-end contendo option HTML.',
    '<select name="trilha"><optgroup label="Front-end"><option>HTML</option></optgroup></select>',
  ),
  h(
    'Sugestões de busca',
    'Crie input list tecnologias e datalist id tecnologias contendo option value HTML.',
    '<input list="tecnologias"><datalist id="tecnologias"><option value="HTML"></datalist>',
  ),
  h(
    'Saída de cálculo',
    'Crie output name total for preco quantidade escrito 0.',
    '<output name="total" for="preco quantidade">0</output>',
  ),
  h(
    'Medidor de conhecimento',
    'Crie meter min 0 max 100 value 60 escrito 60%.',
    '<meter min="0" max="100" value="60">60%</meter>',
  ),
  h(
    'Diálogo',
    'Crie dialog id aviso com h2 Confirmar e button Fechar.',
    '<dialog id="aviso"><h2>Confirmar</h2><button>Fechar</button></dialog>',
  ),
  h(
    'Modelo reutilizável',
    'Crie template id card com article class card contendo h2 Projeto.',
    '<template id="card"><article class="card"><h2>Projeto</h2></article></template>',
  ),
  h(
    'Dados para JavaScript',
    'Crie button data-id 42 data-action salvar escrito Salvar.',
    '<button data-id="42" data-action="salvar">Salvar</button>',
  ),
  h(
    'Elemento decorativo',
    'Crie span aria-hidden true escrito ✦.',
    '<span aria-hidden="true">✦</span>',
  ),
  h(
    'Carregamento de imagem',
    'Crie img src projeto.png alt Meu projeto loading lazy width 320 height 180.',
    '<img src="projeto.png" alt="Meu projeto" loading="lazy" width="320" height="180">',
  ),
  h(
    'Imagem responsiva',
    'Crie picture com source media (min-width: 800px) srcset grande.png e img src pequena.png alt Cidade.',
    '<picture><source media="(min-width: 800px)" srcset="grande.png"><img src="pequena.png" alt="Cidade"></picture>',
  ),
  h(
    'Vídeo com controles',
    'Crie video controls com source src demo.mp4 type video/mp4.',
    '<video controls><source src="demo.mp4" type="video/mp4"></video>',
  ),
  h(
    'Áudio com controles',
    'Crie audio controls com source src trilha.mp3 type audio/mpeg.',
    '<audio controls><source src="trilha.mp3" type="audio/mpeg"></audio>',
  ),
  h(
    'Link seguro',
    'Crie a href https://example.com target _blank rel noopener noreferrer escrito Documentação.',
    '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Documentação</a>',
  ),
  h(
    'Download',
    'Crie a href curriculo.pdf download escrito Meu currículo.',
    '<a href="curriculo.pdf" download>Meu currículo</a>',
  ),
  h(
    'Navegação atual',
    'Crie a href #inicio aria-current page escrito Início.',
    '<a href="#inicio" aria-current="page">Início</a>',
  ),
  h(
    'Cabeçalhos de tabela',
    'Crie tr com th scope col escrito Produto e th scope col escrito Valor.',
    '<tr><th scope="col">Produto</th><th scope="col">Valor</th></tr>',
  ),
  h(
    'Célula de resumo',
    'Crie tfoot com tr contendo th scope row escrito Total e td escrito 120.',
    '<tfoot><tr><th scope="row">Total</th><td>120</td></tr></tfoot>',
  ),
  h(
    'Lista de definições',
    'Crie dl com dt HTML e dd Estrutura da página.',
    '<dl><dt>HTML</dt><dd>Estrutura da página.</dd></dl>',
  ),
  h(
    'Conteúdo complementar',
    'Crie aside aria-label Recursos com h2 Leituras.',
    '<aside aria-label="Recursos"><h2>Leituras</h2></aside>',
  ),
  h(
    'Seção identificada',
    'Crie section aria-labelledby titulo com h2 id titulo escrito Depoimentos.',
    '<section aria-labelledby="titulo"><h2 id="titulo">Depoimentos</h2></section>',
  ),
  h(
    'Código preservado',
    'Crie pre contendo code escrito const nivel = 1;.',
    '<pre><code>const nivel = 1;</code></pre>',
  ),
  h(
    'Conteúdo marcado',
    'Crie p escrito Estude com a palavra HTML dentro de mark.',
    '<p>Estude <mark>HTML</mark></p>',
  ),
  h(
    'Página integrada',
    'Crie main com article contendo header com h2 Meu projeto, p Evoluir e footer com a href #contato escrito Contato.',
    '<main><article><header><h2>Meu projeto</h2></header><p>Evoluir</p><footer><a href="#contato">Contato</a></footer></article></main>',
  ),
];
const css = [
  c('Cor do texto', '.pagina', 'color: #22c55e;'),
  c('Fundo do cartão', '.card', 'background: #e2e8f0;'),
  c('Tamanho do título', 'h1', 'font-size: 32px;'),
  c('Respiro interno', '.card', 'padding: 16px;'),
  c('Espaço externo', '.card', 'margin: 20px;'),
  c('Borda', '.card', 'border: 2px solid #22c55e;'),
  c('Cantos arredondados', '.botao', 'border-radius: 12px;'),
  c('Texto centralizado', 'h1', 'text-align: center;'),
  c('Peso da fonte', 'h1', 'font-weight: 700;'),
  c('Fonte da página', '.pagina', 'font-family: sans-serif;'),
  c('Layout flexível', '.pagina', 'display: flex; gap: 16px;'),
  c('Empilhar cartões', '.pagina', 'display: flex; flex-direction: column;'),
  c('Centralizar eixos', '.pagina', 'display: flex; justify-content: center; align-items: center;'),
  c('Quebrar linha', '.pagina', 'display: flex; flex-wrap: wrap; gap: 12px;'),
  c('Duas colunas', '.pagina', 'display: grid; grid-template-columns: 1fr 1fr; gap: 20px;'),
  c('Largura fluida', '.pagina', 'width: 100%; max-width: 960px;'),
  c('Modelo de caixa', '.card', 'box-sizing: border-box; width: 100%;'),
  c('Altura de linha', '.card', 'font-size: 18px; line-height: 1.6;'),
  c('Sombra', '.card', 'box-shadow: 0 8px 24px #00000022;'),
  c('Botão interativo', '.botao:hover', 'background: #22c55e; cursor: pointer;'),
  c('Transição suave', '.botao', 'transition: background 0.3s ease;'),
  c('Transformação', '.card', 'transform: rotate(-3deg);'),
  c('Posicionamento relativo', '.pagina', 'position: relative;'),
  c('Selo posicionado', '.botao', 'position: absolute; top: 20px; right: 20px;'),
  c('Recortar conteúdo', '.card', 'overflow: hidden; border-radius: 16px;'),
  c('Visibilidade', '.card', 'opacity: 0.5;'),
  c('Gradiente', '.pagina', 'background: linear-gradient(135deg, #22c55e, #2563eb);'),
  c('Sublinhar link', '.botao', 'text-decoration: underline; text-underline-offset: 4px;'),
  c('Espaço entre letras', 'h1', 'letter-spacing: 2px; text-transform: uppercase;'),
  spec(
    'Primeira media query',
    'Em telas de até 600px, configure .pagina com display: block.',
    '@media (max-width: 600px) { .pagina { display: block; } }',
    '<main class="pagina"><article class="card">Tela pequena</article></main>',
  ),
  c(
    'Variável de tema',
    ':root',
    '--accent: #22c55e;',
    '<main><button style="background:var(--accent,#f97316);padding:16px">Tema do projeto</button></main>',
  ),
  c('Usar variável', '.botao', 'background: var(--accent);'),
  c(
    'Grid automático',
    '.pagina',
    'display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));',
  ),
  c(
    'Áreas do grid',
    '.pagina',
    'display: grid; grid-template-areas: "titulo titulo" "card botao";',
  ),
  c('Área do título', 'h1', 'grid-area: titulo;'),
  c('Coluna expandida', '.card', 'grid-column: 1 / -1;'),
  c('Largura de leitura', '.card', 'max-width: 65ch; margin-inline: auto;'),
  c('Tamanho adaptável', 'h1', 'font-size: clamp(24px, 5vw, 48px);'),
  c('Aspecto do cartão', '.card', 'aspect-ratio: 16 / 9;'),
  c(
    'Imagem sem deformar',
    'img',
    'width: 100%; object-fit: cover;',
    '<img alt="Exemplo" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2250%22%3E%3Crect width=%22100%22 height=%2250%22 fill=%22green%22/%3E%3C/svg%3E">',
  ),
  c('Foco acessível', '.botao:focus-visible', 'outline: 3px solid #2563eb; outline-offset: 4px;'),
  c(
    'Primeiro cartão',
    '.card:first-child',
    'border-left: 4px solid #22c55e;',
    '<main><article class="card">Primeiro projeto</article><article class="card">Segundo projeto</article></main>',
  ),
  c('Cartões alternados', '.card:nth-child(even)', 'background: #dbeafe;'),
  c('Pseudo-elemento', '.card::before', 'content: "DEV"; display: block; color: #22c55e;'),
  c('Placeholder', 'input::placeholder', 'color: #64748b;', '<input placeholder="Seu nome">'),
  c('Seleção de texto', '::selection', 'background: #22c55e; color: #ffffff;'),
  c('Limite mínimo', '.card', 'min-width: 0; overflow-wrap: anywhere;'),
  c('Cortar texto', '.card', 'white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'),
  c('Camadas', '.botao', 'position: relative; z-index: 2;'),
  c('Cabeçalho fixo', 'h1', 'position: sticky; top: 0; background: #ffffff;'),
  c('Desfoque de vidro', '.card', 'backdrop-filter: blur(8px); background: #ffffff88;'),
  c('Filtro', '.card', 'filter: grayscale(1);'),
  c('Contorno', '.card', 'outline: 2px dashed #2563eb;'),
  c('Borda lógica', '.card', 'border-inline-start: 4px solid #22c55e;'),
  c('Espaçamento lógico', '.card', 'padding-block: 24px; padding-inline: 16px;'),
  c('Centro absoluto', '.botao', 'position: absolute; left: 50%; transform: translateX(-50%);'),
  c('Alinhamento individual', '.botao', 'align-self: end;'),
  c('Flexibilidade', '.card', 'flex: 1 1 240px;'),
  c('Ordem visual', '.botao', 'order: -1;'),
  c('Linhas do grid', '.pagina', 'display: grid; grid-auto-rows: minmax(100px, auto);'),
  c(
    'Rolagem horizontal',
    '.pagina',
    'display: flex; overflow-x: auto; scroll-snap-type: x mandatory;',
  ),
  c('Parada da rolagem', '.card', 'scroll-snap-align: start; flex-shrink: 0;'),
  c('Transformação 3D', '.card', 'transform: perspective(600px) rotateY(15deg);'),
  c('Origem da transformação', '.card', 'transform-origin: top left; transform: scale(0.9);'),
  spec(
    'Quadros de animação',
    'Defina @keyframes surgir: from com opacity 0 e to com opacity 1.',
    '@keyframes surgir { from { opacity: 0; } to { opacity: 1; } }',
    '<article class="card" style="animation:surgir 2s infinite">Animação</article>',
  ),
  c('Aplicar animação', '.card', 'animation: surgir 0.6s ease forwards;'),
  spec(
    'Reduzir movimento',
    'Em @media (prefers-reduced-motion: reduce), configure .card com animation: none.',
    '@media (prefers-reduced-motion: reduce) { .card { animation: none; } }',
    '<article class="card">Respeito à preferência de movimento</article>',
  ),
  spec(
    'Tema escuro',
    'Em @media (prefers-color-scheme: dark), configure .pagina com background #0f172a e color #ffffff.',
    '@media (prefers-color-scheme: dark) { .pagina { background: #0f172a; color: #ffffff; } }',
    '<main class="pagina">Tema do sistema</main>',
  ),
  c('Consulta de contêiner', '.pagina', 'container-type: inline-size;'),
  spec(
    'Layout por contêiner',
    'Em @container (min-width: 500px), configure .card com display: flex.',
    '@container (min-width: 500px) { .card { display: flex; } }',
    '<main class="pagina" style="container-type:inline-size"><article class="card">Consulta adaptável</article></main>',
  ),
];
const js = [
  j(
    'Uma constante',
    'Declare const mensagem com a string Hello World.',
    'const mensagem = "Hello World";',
  ),
  j('Contador inicial', 'Declare let pontos com o número 0.', 'let pontos = 0;'),
  j('Soma', 'Declare const total com 10 + 5.', 'const total = 10 + 5;'),
  j('Valor booleano', 'Declare const ativo com true.', 'const ativo = true;'),
  j(
    'Mensagem combinada',
    'Declare const saudacao com "Olá, " + "Dev".',
    'const saudacao = "Olá, " + "Dev";',
  ),
  j(
    'Lista de cursos',
    'Declare const cursos como array de HTML, CSS e JS nessa ordem.',
    'const cursos = ["HTML", "CSS", "JS"];',
  ),
  j(
    'Objeto de perfil',
    'Declare const perfil com propriedade nome Dev e nivel 1.',
    'const perfil = { nome: "Dev", nivel: 1 };',
  ),
  j(
    'Primeira função',
    'Declare function somar com parâmetros a, b retornando a + b.',
    'function somar(a, b) { return a + b; }',
  ),
  j(
    'Condição',
    'Declare function aprovado(nota) retornando nota >= 7.',
    'function aprovado(nota) { return nota >= 7; }',
  ),
  j(
    'Uma passagem para o futuro',
    'Declare function abrirPorta sem parâmetros retornando true. Sua solução libera a praça.',
    'function abrirPorta() { return true; }',
  ),
  j(
    'Arrow function',
    'Declare const dobro como arrow de n retornando n * 2.',
    'const dobro = n => n * 2;',
  ),
  j(
    'Transformar lista',
    'Declare const dobros com numeros.map(n => n * 2).',
    'const dobros = numeros.map(n => n * 2);',
  ),
  j(
    'Filtrar valores',
    'Declare const positivos com numeros.filter(n => n > 0).',
    'const positivos = numeros.filter(n => n > 0);',
  ),
  j(
    'Somar lista',
    'Declare const soma com numeros.reduce((total, n) => total + n, 0).',
    'const soma = numeros.reduce((total, n) => total + n, 0);',
  ),
  j(
    'Encontrar objeto',
    'Declare const produto com produtos.find(p => p.id === 1).',
    'const produto = produtos.find(p => p.id === 1);',
  ),
  j(
    'Verificar lista',
    'Declare const temHtml com cursos.includes("HTML").',
    'const temHtml = cursos.includes("HTML");',
  ),
  j(
    'Maiúsculas',
    'Declare const titulo com nome.toUpperCase().',
    'const titulo = nome.toUpperCase();',
  ),
  j('Limpar espaços', 'Declare const limpo com nome.trim().', 'const limpo = nome.trim();'),
  j('Converter número', 'Declare const preco com Number(valor).', 'const preco = Number(valor);'),
  j('Valor padrão', 'Declare const apelido com nome || "Dev".', 'const apelido = nome || "Dev";'),
  j(
    'Repetição for',
    'Faça for com let i=0, i<3, i++ e console.log(i) no corpo.',
    'for (let i = 0; i < 3; i++) { console.log(i); }',
  ),
  j(
    'Percorrer cursos',
    'Faça for (const curso of cursos) com console.log(curso) no corpo.',
    'for (const curso of cursos) { console.log(curso); }',
  ),
  j(
    'Desestruturar objeto',
    'Declare const { nome, nivel } = perfil.',
    'const { nome, nivel } = perfil;',
  ),
  j('Copiar lista', 'Declare const copia = [...cursos].', 'const copia = [...cursos];'),
  j(
    'Parâmetro padrão',
    'Declare function saudar(nome = "Dev") retornando "Olá, " + nome.',
    'function saudar(nome = "Dev") { return "Olá, " + nome; }',
  ),
  j(
    'Seleção do DOM',
    'Declare const botao = document.querySelector("#acao").',
    'const botao = document.querySelector("#acao");',
  ),
  j(
    'Texto no DOM',
    'Atribua "Pronto" a document.querySelector("#status").textContent.',
    'document.querySelector("#status").textContent = "Pronto";',
  ),
  j(
    'Classe no DOM',
    'Chame document.querySelector("#card").classList.add("ativo").',
    'document.querySelector("#card").classList.add("ativo");',
  ),
  j(
    'Alternar classe',
    'Chame document.querySelector("#card").classList.toggle("ativo").',
    'document.querySelector("#card").classList.toggle("ativo");',
  ),
  j(
    'Evento de clique',
    'Declare const botao = document.querySelector("#acao"); registre click com arrow que atribui "Salvo" a document.querySelector("#status").textContent.',
    'const botao = document.querySelector("#acao"); botao.addEventListener("click", () => { document.querySelector("#status").textContent = "Salvo"; });',
  ),
  j(
    'Igualdade estrita',
    'Declare function igual(a, b) retornando a === b.',
    'function igual(a, b) { return a === b; }',
  ),
  j(
    'Operador ternário',
    'Declare const status = ativo ? "online" : "offline".',
    'const status = ativo ? "online" : "offline";',
  ),
  j('Coalescência nula', 'Declare const valor = entrada ?? 0.', 'const valor = entrada ?? 0;'),
  j(
    'Acesso opcional',
    'Declare const cidade = usuario?.endereco?.cidade.',
    'const cidade = usuario?.endereco?.cidade;',
  ),
  j(
    'Parâmetros rest',
    'Declare function contar(...itens) retornando itens.length.',
    'function contar(...itens) { return itens.length; }',
  ),
  j(
    'Remover duplicados',
    'Declare const unicos = [...new Set(numeros)].',
    'const unicos = [...new Set(numeros)];',
  ),
  j(
    'Mapa de valores',
    'Declare const mapa = new Map([["HTML", 10]]).',
    'const mapa = new Map([["HTML", 10]]);',
  ),
  j(
    'Chaves do objeto',
    'Declare const chaves = Object.keys(perfil).',
    'const chaves = Object.keys(perfil);',
  ),
  j(
    'Valores do objeto',
    'Declare const valores = Object.values(perfil).',
    'const valores = Object.values(perfil);',
  ),
  j(
    'Entradas do objeto',
    'Declare const entradas = Object.entries(perfil).',
    'const entradas = Object.entries(perfil);',
  ),
  j(
    'Serializar JSON',
    'Declare const json = JSON.stringify(perfil).',
    'const json = JSON.stringify(perfil);',
  ),
  j(
    'Interpretar JSON',
    'Declare const dados = JSON.parse(json).',
    'const dados = JSON.parse(json);',
  ),
  j(
    'Arredondar',
    'Declare const arredondado = Math.round(preco).',
    'const arredondado = Math.round(preco);',
  ),
  j(
    'Limitar valor',
    'Declare const limitado = Math.min(100, Math.max(0, pontos)).',
    'const limitado = Math.min(100, Math.max(0, pontos));',
  ),
  j(
    'Todos aprovados',
    'Declare const todos = notas.every(n => n >= 7).',
    'const todos = notas.every(n => n >= 7);',
  ),
  j(
    'Algum aprovado',
    'Declare const algum = notas.some(n => n >= 7).',
    'const algum = notas.some(n => n >= 7);',
  ),
  j(
    'Ordenar números',
    'Declare const ordenados = [...numeros].sort((a, b) => a - b).',
    'const ordenados = [...numeros].sort((a, b) => a - b);',
  ),
  j(
    'Lista formatada',
    'Declare const texto = cursos.join(", ").',
    'const texto = cursos.join(", ");',
  ),
  j(
    'Recortar lista',
    'Declare const primeiros = cursos.slice(0, 2).',
    'const primeiros = cursos.slice(0, 2);',
  ),
  j(
    'Concatenar listas',
    'Declare const tudo = cursos.concat(extras).',
    'const tudo = cursos.concat(extras);',
  ),
  j(
    'Validar vazio',
    'Declare function preenchido(texto) retornando texto.trim().length > 0.',
    'function preenchido(texto) { return texto.trim().length > 0; }',
  ),
  j(
    'Criar elemento',
    'Declare const item = document.createElement("li").',
    'const item = document.createElement("li");',
  ),
  j(
    'Adicionar elemento',
    'Chame document.querySelector("#lista").append(item).',
    'document.querySelector("#lista").append(item);',
  ),
  j(
    'Remover elemento',
    'Chame document.querySelector("#card").remove().',
    'document.querySelector("#card").remove();',
  ),
  j(
    'Atualizar atributo',
    'Chame document.querySelector("#acao").setAttribute("aria-expanded", "true").',
    'document.querySelector("#acao").setAttribute("aria-expanded", "true");',
  ),
  j(
    'Consultar dataset',
    'Declare const id = document.querySelector("#card").dataset.id.',
    'const id = document.querySelector("#card").dataset.id;',
  ),
  j(
    'Cancelar envio',
    'Declare function enviar(evento) com evento.preventDefault() no corpo.',
    'function enviar(evento) { evento.preventDefault(); }',
  ),
  j(
    'Delegação de evento',
    'Declare function alvo(evento) retornando evento.target.closest("button").',
    'function alvo(evento) { return evento.target.closest("button"); }',
  ),
  j(
    'Timer',
    'Declare const timer = setTimeout(() => console.log("Pronto"), 1000).',
    'const timer = setTimeout(() => console.log("Pronto"), 1000);',
  ),
  j('Cancelar timer', 'Chame clearTimeout(timer).', 'clearTimeout(timer);'),
  j(
    'Promise resolvida',
    'Declare const pronto = Promise.resolve(true).',
    'const pronto = Promise.resolve(true);',
  ),
  j(
    'Função assíncrona',
    'Declare async function carregar() retornando await Promise.resolve("OK").',
    'async function carregar() { return await Promise.resolve("OK"); }',
  ),
  j(
    'Tratamento de erro',
    'Declare function ler(json) com try retornando JSON.parse(json) e catch retornando null.',
    'function ler(json) { try { return JSON.parse(json); } catch { return null; } }',
  ),
  j(
    'Erro explícito',
    'Declare function falhar() lançando new Error("Inválido").',
    'function falhar() { throw new Error("Inválido"); }',
  ),
  j(
    'Classe',
    'Declare class Perfil com constructor(nome) atribuindo this.nome = nome.',
    'class Perfil { constructor(nome) { this.nome = nome; } }',
  ),
  j(
    'Método',
    'Declare class Contador com subir() retornando 1.',
    'class Contador { subir() { return 1; } }',
  ),
  j(
    'Salvar preferência',
    'Chame localStorage.setItem("tema", "escuro").',
    'localStorage.setItem("tema", "escuro");',
  ),
  j(
    'Ler preferência',
    'Declare const tema = localStorage.getItem("tema").',
    'const tema = localStorage.getItem("tema");',
  ),
  j(
    'Valor monetário',
    'Declare const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(120).',
    'const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(120);',
  ),
  j(
    'Resumo do ERP',
    'Declare function faturamento(pedidos) retornando pedidos.filter(p => p.pago).reduce((total, p) => total + p.valor, 0).',
    'function faturamento(pedidos) { return pedidos.filter(p => p.pago).reduce((total, p) => total + p.valor, 0); }',
  ),
];
const areas = { HTML: html, CSS: css, JavaScript: js };
export const examId = (area, stage) => `exam-${area.toLowerCase()}-${stage}`;
export const legacySchoolLessons = Object.entries(areas).flatMap(([area, specs]) => {
  if (specs.length !== 70) throw new Error(`${area}: esperado 70 aulas, recebido ${specs.length}`);
  let offset = 0;
  return schoolStages.flatMap((stage, si) => {
    const result = specs.slice(offset, offset + stage.count).map((entry, i) => ({
      ...entry,
      lesson: lessonNotes(area, offset + i, entry.title),
      id: `school-${area.toLowerCase()}-${stage.id}-${i + 1}`,
      area,
      stage: stage.id,
      stageName: stage.name,
      number: i + 1,
      xp: stage.xp,
      money: 0,
      skill: si + 1,
      requires: i
        ? [`school-${area.toLowerCase()}-${stage.id}-${i}`]
        : si
          ? [examId(area, schoolStages[si - 1].id)]
          : [],
      starter:
        area === 'HTML'
          ? '<!-- Construa a estrutura pedida -->'
          : area === 'CSS'
            ? '/* Implemente as regras pedidas */'
            : '// Implemente o comportamento pedido',
      hints:
        area === 'HTML'
          ? [
              'Identifique os elementos e atributos pedidos.',
              'Preserve a hierarquia, os textos e o fechamento das tags.',
            ]
          : area === 'CSS'
            ? [
                'Comece pelo seletor indicado e abra um bloco de declarações.',
                'Confira propriedades, valores e unidades. Use ponto-e-vírgula entre declarações.',
              ]
            : [
                'Separe dados de entrada, operação e resultado.',
                'Confira identificadores, operadores e os métodos solicitados.',
              ],
      previewHtml:
        entry.html ||
        '<h1>DevLife</h1><article id="card" data-id="42">Meu projeto</article><button id="acao">Testar</button><p id="status">Aguardando</p><ul id="lista"></ul>',
      opensGate: false,
    }));
    offset += stage.count;
    return result;
  });
});
export const schoolLessons = legacySchoolLessons.map(lesson => upgradeSchoolLesson(lesson, lesson.stage === 'intermediate' ? lesson.number - 1 : lesson.number + 19));
export const schoolExams = Object.keys(areas).flatMap((area) =>
  schoolStages.map((stage) => ({
    id: examId(area, stage.id),
    area,
    stage: stage.id,
    stageName: stage.name,
    kind: 'exam',
    opensGate: area === 'JavaScript' && stage.id === 'beginner',
    title: `${area} · ${stage.id === 'beginner' ? 'Passagem para a praça' : stage.id === 'intermediate' ? 'Portal do centro' : 'Passaporte internacional'}`,
    xp: stage.examXp,
    money: 0,
    skill: 8,
    description:
      area === 'HTML'
        ? `Construa uma página ${stage.name.toLowerCase()} para a passagem ${stage.id === 'beginner' ? 'da praça' : stage.id === 'intermediate' ? 'do centro' : 'internacional'}. Cumpra todos os requisitos e entregue para avaliação.`
        : area === 'CSS'
          ? 'Estilize a página que você entregou na prova de HTML desta etapa. A estrutura vem da sua conta.'
          : 'Adicione interação à sua página de HTML e CSS desta etapa. Teste os botões na prévia antes de entregar.',
    requires: [
      ...schoolLessons.filter((l) => l.area === area && l.stage === stage.id).map((l) => l.id),
      ...(area === 'CSS'
        ? [examId('HTML', stage.id)]
        : area === 'JavaScript'
          ? [examId('CSS', stage.id)]
          : []),
    ],
  })),
);
export function validateSchool(id, code) {
  const l = schoolLessons.find((l) => l.id === id);
  if (!l) return false;
  if (l.stage === 'beginner') {
    if (l.area === 'HTML') return matchHtmlChallenge(code,l.solution,{exactText:true,exactAttributes:true});
    if (l.area === 'CSS') return matchCssChallenge(code,l.solution);
    return checkBeginnerJavascript(l,code).length===0;
  }
  if (l.assessment === 'html-search-document') return checkSearchDocument(code).length === 0;
  if (l.assessment === 'html-accessible-feedback') return checkAccessibleFeedback(code).length === 0;
  if (l.challengeKind === 'javascript-contract') return checkJavascriptChallenge(l, code).length === 0;
  if (l.challengeKind === 'html-composition') return matchHtmlChallenge(code, l.solution, {requireClasses:/\b(?:class|classes?)\b/i.test(l.description),description:l.description});
  if (l.challengeKind === 'css-composition') return matchCssChallenge(code, l.solution);
  // Mantém respostas escritas conforme o enunciado anterior, que pedia só tbody.
  if (l.title === 'Dados de tabela')
    return structuralMatch(code, l.solution) || structuralMatch(`<table>${code}</table>`, l.solution);
  return structuralMatch(code, l.solution);
}
export function schoolFeedback(id, code) {
  const lesson = schoolLessons.find(l => l.id === id);
  if(lesson?.stage==='beginner'){
    if(lesson.area==='JavaScript')return checkBeginnerJavascript(lesson,code).slice(0,4);
    if(lesson.area==='CSS')return checkCssChallenge(code,lesson.solution);
    if(!matchHtmlChallenge(code,lesson.solution,{exactText:true,exactAttributes:true}))return ['Confira o elemento, o texto e os atributos pedidos. Espaços, maiúsculas nas tags e ponto final opcional no texto não impedem a aprovação.'];
    return [];
  }
  if (!lesson?.challengeKind) return null;
  if (lesson.assessment === 'html-search-document') return checkSearchDocument(code);
  if (lesson.assessment === 'html-accessible-feedback') return checkAccessibleFeedback(code);
  if (lesson.challengeKind === 'html-composition') return checkHtmlChallenge(code, lesson.solution, {requireClasses:/\b(?:class|classes?)\b/i.test(lesson.description),description:lesson.description});
  if (lesson.challengeKind === 'css-composition') return checkCssChallenge(code, lesson.solution);
  if (lesson.challengeKind === 'javascript-contract') return checkJavascriptChallenge(lesson, code).slice(0, 4);
  return lesson.area === 'HTML' ? ['Confira a estrutura completa, os identificadores, os atributos e suas associações. Os textos podem ser de sua autoria.', ...lesson.requirements.slice(0, 2)] : ['Confira todas as regras, inclusive media queries e estados. A ordem das propriedades não precisa ser a mesma.', 'Revise a cascata: uma declaração posterior pode substituir uma regra anterior.'];
}
export function availableLesson(state, exercise) {
  return !examPrerequisiteError(state,exercise)&&exercise.requires.every((id) => state.completed.includes(id));
}
