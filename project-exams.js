import {checkJavascriptChallenge} from './school-challenge-validator.js';
import { examId } from './school-content.js';

const stages = ['beginner', 'intermediate', 'advanced'];
const texts = ['Passagem para a praça', 'Portal do centro da cidade', 'Passaporte internacional'];
export function projectRequirements(area, stage) {
  const rank = stages.indexOf(stage);
  if (area === 'HTML')
    return [
      `Um h1 com o texto ${texts[rank]}.`,
      'Um main com id conteudo.',
      'Um p com uma apresentação (pelo menos 20 caracteres).',
      'Um button com id acao e texto Explorar.',
      'Um p com id status e texto Aguardando.',
      ...(rank > 0
        ? [
            'Um header com nav e link para #conteudo.',
            'Uma section com id projetos e pelo menos dois article, cada um com h2 e p.',
            'Um footer com texto de autoria.',
          ]
        : []),
      ...(rank > 1
        ? [
            'Um form com id contato, label for email e input id email type email required.',
            'Uma lista ul com três li.',
            'Um button type submit dentro do formulário.',
            'Uma section com id servicos, h2 e pelo menos dois article.',
          ]
        : []),
    ];
  if (area === 'CSS')
    return [
      'body: font-family sans-serif, background #0f172a e color #ffffff.',
      'main: max-width 960px, margin 0 auto e padding 24px.',
      'button: background #22c55e, color #0f172a, padding 12px e border-radius 12px.',
      ...(rank > 0
        ? [
            '#projetos: display grid, grid-template-columns repeat(2, 1fr) e gap 20px.',
            'article: padding 20px, border-radius 16px e background #1e293b.',
            'nav: display flex e gap 16px.',
          ]
        : []),
      ...(rank > 1
        ? [
            '@media (max-width: 600px): #projetos com grid-template-columns 1fr.',
            'button:hover: transform translateY(-2px).',
            'button:focus-visible: outline 3px solid #22c55e e outline-offset 4px.',
          ]
        : []),
    ];
  return [
    'Selecione #acao com document.querySelector e registre addEventListener("click", () => { ... }).',
    ...(rank === 0 ? ['Declare function abrirPorta() retornando true. A aprovação desta prova libera a praça.'] : []),
    'Dentro desse clique, atribua "Bem-vindo!" a document.querySelector("#status").textContent.',
    ...(rank > 0
      ? ['No mesmo clique, alterne a classe destaque de #projetos com classList.toggle.']
      : []),
    ...(rank > 1
      ? [
          'Registre addEventListener("submit", (evento) => { ... }) em #contato.',
          'No envio, use evento.preventDefault() e mude #status.textContent para "Mensagem enviada!".',
        ]
      : []),
  ];
}
export function referenceProject(stage) {
  const rank = stages.indexOf(stage);
  const project = {
    html: `<h1>${texts[rank]}</h1><main id="conteudo"><p>Sou um desenvolvedor construindo minha jornada.</p><button id="acao">Explorar</button><p id="status">Aguardando</p>${rank > 0 ? '<section id="projetos"><h2>Projetos</h2><article><h2>Cidade</h2><p>Um jogo educativo.</p></article><article><h2>Biblioteca</h2><p>Leitura e conhecimento.</p></article></section>' : ''}${rank > 1 ? '<section id="servicos"><h2>Serviços</h2><article><h2>Sites</h2><p>Desenvolvimento web.</p></article><article><h2>Sistemas</h2><p>Gestão e ERP.</p></article></section><ul><li>HTML</li><li>CSS</li><li>JavaScript</li></ul><form id="contato"><label for="email">E-mail</label><input id="email" type="email" required><button type="submit">Enviar</button></form>' : ''}</main>${rank > 0 ? '<header><nav><a href="#conteudo">Conteúdo</a></nav></header><footer>Feito por mim.</footer>' : ''}`,
    css:
      'body { font-family: sans-serif; background: #0f172a; color: #ffffff; }\nmain { max-width: 960px; margin: 0 auto; padding: 24px; }\nbutton { background: #22c55e; color: #0f172a; padding: 12px; border-radius: 12px; }' +
      (rank > 0
        ? '\n#projetos { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }\narticle { padding: 20px; border-radius: 16px; background: #1e293b; }\nnav { display: flex; gap: 16px; }'
        : '') +
      (rank > 1
        ? '\n@media (max-width: 600px) { #projetos { grid-template-columns: 1fr; } }\nbutton:hover { transform: translateY(-2px); }\nbutton:focus-visible { outline: 3px solid #22c55e; outline-offset: 4px; }'
        : ''),
    js:
      (rank===0?'function abrirPorta() { return true; }\n':'') + 'document.querySelector("#acao").addEventListener("click", () => { document.querySelector("#status").textContent = "Bem-vindo!";' +
      (rank > 0 ? ' document.querySelector("#projetos").classList.toggle("destaque");' : '') +
      ' });' +
      (rank > 1
        ? '\ndocument.querySelector("#contato").addEventListener("submit", (evento) => { evento.preventDefault(); document.querySelector("#status").textContent = "Mensagem enviada!"; });'
        : ''),
  };
  return project;
}
// Um parser pequeno confere a estrutura real: texto em comentários não conta como elemento.
function elements(source) {
  const root = { tag: 'root', attrs: {}, children: [], text: '' },
    stack = [root];
  const cleaned = source.replace(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  for (const token of cleaned.match(/<[^>]+>|[^<]+/g) || []) {
    if (!token.startsWith('<')) {
      for (const node of stack) node.text += token;
      continue;
    }
    const close = token.match(/^<\/([\w-]+)\s*>$/);
    if (close) {
      if (stack.at(-1).tag !== close[1].toLowerCase()) return null;
      stack.pop();
      continue;
    }
    const open = token.match(/^<([\w-]+)\b([^>]*)>$/);
    if (!open) continue;
    const attrs = {};
    for (const match of open[2].matchAll(/([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s/>]+)))?/g))
      attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
    const node = { tag: open[1].toLowerCase(), attrs, children: [], text: '' };
    stack.at(-1).children.push(node);
    if (
      ![
        'input',
        'img',
        'br',
        'hr',
        'meta',
        'link',
        'source',
        'area',
        'base',
        'embed',
        'wbr',
      ].includes(node.tag) &&
      !token.endsWith('/>')
    )
      stack.push(node);
  }
  return stack.length === 1 ? root : null;
}
function descendants(node) {
  return node.children.flatMap((child) => [child, ...descendants(child)]);
}
const normalized = (s) => s.trim().replace(/\s+/g, ' ');
export function checkProject(area, stage, project) {
  const rank = stages.indexOf(stage),
    checks = [];
  if (rank < 0) return ['Etapa inválida.'];
  if (area === 'HTML') {
    const root = elements(project.html);
    if (!root) return ['Confira a hierarquia e o fechamento de todas as tags.'];
    const nodes = descendants(root),
      find = (tag, id) => nodes.find((n) => n.tag === tag && (!id || n.attrs.id === id));
    const main = find('main', 'conteudo');
    const inside = (node, tag) => (node ? descendants(node).filter((n) => n.tag === tag) : []);
    checks.push(
      find('h1')?.text.trim() === texts[rank],
      !!main,
      inside(main, 'p').some((n) => n.text.trim().length >= 20),
      find('button', 'acao')?.text.trim() === 'Explorar',
      find('p', 'status')?.text.trim() === 'Aguardando',
    );
    if (rank > 0) {
      const header = find('header'),
        projects = find('section', 'projetos');
      checks.push(
        inside(header, 'nav').some((nav) =>
          inside(nav, 'a').some((a) => a.attrs.href === '#conteudo'),
        ),
        inside(projects, 'article').filter((n) => inside(n, 'h2').length && inside(n, 'p').length)
          .length >= 2,
        !!find('footer')?.text.trim(),
      );
    }
    if (rank > 1) {
      const form = find('form', 'contato'),
        service = find('section', 'servicos');
      checks.push(
        inside(form, 'label').some((n) => n.attrs.for === 'email') &&
          inside(form, 'input').some(
            (n) => n.attrs.id === 'email' && n.attrs.type === 'email' && 'required' in n.attrs,
          ),
        inside(find('ul'), 'li').length >= 3,
        inside(form, 'button').some((n) => n.attrs.type === 'submit'),
        inside(service, 'h2').length > 0 && inside(service, 'article').length >= 2,
      );
    }
  } else if (area === 'CSS') {
    const code = project.css.replace(/\/\*[\s\S]*?\*\//g, '');
    const media = code.match(
      /@media\s*\(\s*max-width\s*:\s*600px\s*\)\s*\{\s*#projetos\s*\{([^}]+)\}\s*\}/i,
    );
    const ordinary = code.replace(/@media[^{}]+\{[^{}]*\{[^{}]*\}[^{}]*\}/g, '');
    const declarations = (block) =>
      Object.fromEntries(
        (block || '')
          .split(';')
          .filter((s) => s.includes(':'))
          .map((s) => {
            const pos = s.indexOf(':');
            return [
              s.slice(0, pos).trim().toLowerCase(),
              normalized(s.slice(pos + 1))
                .toLowerCase()
                .replace(/\s*,\s*/g, ','),
            ];
          }),
      );
    const rules = new Map();
    for (const match of ordinary.matchAll(/([^{}]+)\{([^{}]*)\}/g))
      for (const selector of match[1].split(','))
        rules.set(selector.trim(), { ...rules.get(selector.trim()), ...declarations(match[2]) });
    const has = (selector, props) =>
      Object.entries(props).every(
        ([key, value]) => rules.get(selector)?.[key] === value.replace(/\s*,\s*/g, ','),
      );
    checks.push(
      has('body', { 'font-family': 'sans-serif', background: '#0f172a', color: '#ffffff' }),
      has('main', { 'max-width': '960px', margin: '0 auto', padding: '24px' }),
      has('button', {
        background: '#22c55e',
        color: '#0f172a',
        padding: '12px',
        'border-radius': '12px',
      }),
    );
    if (rank > 0)
      checks.push(
        has('#projetos', {
          display: 'grid',
          'grid-template-columns': 'repeat(2, 1fr)',
          gap: '20px',
        }),
        has('article', { padding: '20px', 'border-radius': '16px', background: '#1e293b' }),
        has('nav', { display: 'flex', gap: '16px' }),
      );
    if (rank > 1)
      checks.push(
        declarations(media?.[1])['grid-template-columns'] === '1fr',
        has('button:hover', { transform: 'translatey(-2px)' }),
        has('button:focus-visible', { outline: '3px solid #22c55e', 'outline-offset': '4px' }),
      );
  } else {
    // A prova usa o contrato de eventos do enunciado, sem executar código da conta no servidor.
    const code = project.js.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '').replace(/'/g, '"');
    const click = code.match(
      /document\.querySelector\(\s*"#acao"\s*\)\s*\.addEventListener\(\s*"click"\s*,\s*\(\s*\)\s*=>\s*\{([^{}]*)\}\s*\)/,
    );
    const variable = code.match(
      /(?:const|let)\s+(\w+)\s*=\s*document\.querySelector\(\s*"#acao"\s*\)/,
    );
    const body =
      click?.[1] ||
      (variable &&
        code.match(
          new RegExp(
            `${variable[1]}\\s*\\.addEventListener\\(\\s*"click"\\s*,\\s*\\(\\s*\\)\\s*=>\\s*\\{([^{}]*)\\}\\s*\\)`,
          ),
        )?.[1]) ||
      '';
    const status = (text) =>
      new RegExp(
        `document\\.querySelector\\(\\s*"#status"\\s*\\)\\s*\\.textContent\\s*=\\s*"${text}"`,
      );
    checks.push(!!body);
    if(rank===0)checks.push(checkJavascriptChallenge({id:'exam-gate-permission',solution:'function abrirPorta(){return true}',contract:{functionName:'abrirPorta',cases:[[]],immutable:true}},'const document={querySelector:()=>({addEventListener(){}})};\n'+project.js).length===0);
    checks.push(status('Bem-vindo!').test(body));
    if (rank > 0)
      checks.push(
        /document\.querySelector\(\s*"#projetos"\s*\)\s*\.classList\.toggle\(\s*"destaque"\s*\)/.test(
          body,
        ),
      );
    if (rank > 1) {
      const submit = code.match(
        /document\.querySelector\(\s*"#contato"\s*\)\s*\.addEventListener\(\s*"submit"\s*,\s*\(\s*evento\s*\)\s*=>\s*\{([^{}]*)\}\s*\)/,
      );
      checks.push(
        !!submit,
        /evento\.preventDefault\(\s*\)/.test(submit?.[1] || '') &&
          status('Mensagem enviada!').test(submit?.[1] || ''),
      );
    }
  }
  const requirements = projectRequirements(area, stage);
  return checks.flatMap((passed, i) => (passed ? [] : [`Falta: ${requirements[i]}`]));
}
export function projectFor(state, exam) {
  const saved = state.schoolProjects?.[exam.stage] || {};
  return { html: saved.html || '', css: saved.css || '', js: saved.js || '' };
}
export function saveExam(state, exam, code, now = Date.now()) {
  const field = { HTML: 'html', CSS: 'css', JavaScript: 'js' }[exam.area];
  const project = { ...projectFor(state, exam), [field]: code };
  const feedback = checkProject(exam.area, exam.stage, project);
  if (feedback.length) return { feedback };
  state.schoolProjects ??= {};
  state.schoolProjects[exam.stage] = { ...project, updatedAt: now };
  return { project };
}
