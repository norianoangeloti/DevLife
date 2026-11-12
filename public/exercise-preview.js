import { schoolJavascriptScenario, schoolDemo } from './school-js-preview.js';
import { schoolHtmlPreview } from './school-html-preview.js';
import { schoolContractPreview } from './school-contract-preview.js';
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
const tiles =
  '<div class="sample-tile">Projeto 1</div><div class="sample-tile">Projeto 2</div><div class="sample-tile">Projeto 3</div>';
const paragraph =
  'Aprender programação é transformar ideias em projetos. Observe como o tamanho das letras e o espaço entre as linhas ajudam a leitura.';
const scene = (selector, html, css = '', width = 'auto') => ({ selector, html, css, width });

// Cada exercício precisa de elementos reais para os seletores que o aluno vai escrever.
export const cssScenes = {
  'css-color': scene('.school-title', '<h2 class="school-title">Dev School</h2>'),
  'css-flex': scene('.sala', `<div class="sala">${tiles}</div>`),
  'lesson-16': scene(
    '.painel',
    '<div class="painel sample-stage"><div class="sample-tile">Meu projeto</div></div>',
  ),
  'lesson-17': scene('.galeria', `<div class="galeria">${tiles}</div>`),
  'lesson-18': scene(
    '.card',
    '<div class="sample-outline"><article class="card sample-surface">Meu cartão de aprendizado</article></div>',
  ),
  'lesson-19': scene(
    '.card',
    '<article class="card sample-surface">Um cartão com personalidade</article>',
  ),
  'lesson-20': scene(
    '.texto',
    `<p class="texto">${paragraph}</p>`,
    '.texto{font-size:12px;line-height:1.1;font-weight:700}',
  ),
  'lesson-21': scene(
    '.container',
    '<div class="container sample-surface">Conteúdo adaptável à largura disponível</div>',
    '.container{width:55%}',
  ),
  'lesson-22': scene(
    '.galeria',
    `<div class="galeria">${tiles}</div>`,
    '.galeria{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}',
    375,
  ),
  'practice-color': scene('.perfil', '<h2 class="perfil">Meu perfil</h2>'),
  'practice-flex': scene('.portfolio', `<div class="portfolio">${tiles}</div>`),
  'home-15': scene(
    '.diario',
    '<div class="diario sample-stage"><div class="sample-tile">Meu diário dev</div></div>',
  ),
  'home-16': scene('.projetos', `<div class="projetos">${tiles}</div>`),
  'home-17': scene(
    '.perfil',
    '<div class="sample-outline"><article class="perfil sample-surface">Meu perfil de desenvolvedor</article></div>',
  ),
  'home-18': scene(
    '.foto',
    '<div class="foto"><span aria-hidden="true">👩‍💻</span><p>Minha foto</p></div>',
    '.foto{width:150px;background:#edf2f7;text-align:center}.foto span{font-size:48px}',
  ),
  'home-19': scene(
    '.titulo',
    '<h2 class="titulo">Meu diário de programação</h2>',
    '.titulo{font-size:16px;line-height:1.1;font-weight:400}',
  ),
  'home-20': scene(
    '.pagina',
    '<div class="pagina sample-surface">Minha página acompanha o espaço da tela.</div>',
    '.pagina{width:55%}',
  ),
  'home-21': scene(
    '.projetos',
    `<div class="projetos">${tiles}</div>`,
    '.projetos{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}',
    375,
  ),
  'home-32': scene('.botao', '<button class="botao">Ver meu projeto</button>'),
  'home-33': scene('.titulo', '<h2 class="titulo">Construindo meu futuro</h2>'),
  'work-11': scene('.marca', '<h2 class="marca">TechSoft Studio</h2>', '.marca{font-weight:400}'),
  'work-12': scene(
    '.nav',
    '<nav class="nav"><span class="sample-tile">Início</span><span class="sample-tile">Projetos</span><span class="sample-tile">Contato</span></nav>',
  ),
  'work-13': scene(
    '.login',
    '<div class="login sample-stage"><div class="sample-tile">Entrar na minha conta</div></div>',
  ),
  'work-14': scene(
    '.produto',
    '<article class="produto sample-surface"><b>Notebook Dev</b><p>Uma ferramenta para suas ideias.</p></article>',
  ),
  'work-15': scene('.catalogo', `<div class="catalogo">${tiles}</div>`),
  'work-16': scene(
    '.formulario',
    '<form class="formulario sample-surface"><label>Nome<input placeholder="Seu nome"></label><label>E-mail<input placeholder="seu@email.com"></label></form>',
    '.formulario{width:55%}input{width:100%}label{display:block;margin-bottom:10px}',
  ),
  'work-17': scene(
    '.descricao',
    `<p class="descricao">${paragraph}</p>`,
    '.descricao{font-size:12px;line-height:1}',
  ),
  'work-18': scene(
    '.campo',
    '<label>Seu nome<input class="campo" placeholder="Digite aqui"></label>',
    '.campo{border:1px solid #c5d6de;padding:2px}',
  ),
  'work-19': scene(
    '.catalogo',
    `<div class="catalogo">${tiles}</div>`,
    '.catalogo{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}',
    375,
  ),
  'work-20': scene('.acao', '<button class="acao">Enviar projeto</button>'),
};

function javascriptResults(code, interactive = false) {
  const names = [...code.matchAll(/\b(?:const|let|var)\s+([a-zA-Z_$][\w$]*)/g)].map((match) => match[1]);
  for (const match of code.matchAll(/\b(?:const|let|var)\s*\{([^}]+)\}/g)) {
    names.push(...match[1].split(',').map((name) => name.trim()).filter((name) => /^[a-zA-Z_$][\w$]*$/.test(name)));
  }
  const argumentsFor = (parameters) => parameters.split(',').map((parameter) => {
    const name = parameter.trim().replace(/=.*/, '').trim();
    if (parameter.includes('=')) return 'undefined';
    if (name.startsWith('...')) return '2, 4, 6';
    if (/pedidos|vendas/.test(name)) return '[{pago:true,valor:100,entregue:true,preco:100},{pago:false,valor:50,entregue:false,preco:50}]';
    if (/json/i.test(name)) return '\'{"nome":"Dev"}\'';
    if (/evento/.test(name)) return '{preventDefault(){},target:document.querySelector("#acao")}';
    if (/nome|apelido/.test(name)) return '"Dev"';
    if (/texto/.test(name)) return '"Texto de exemplo"';
    if (/nota/.test(name)) return '8';
    return '3';
  }).join(', ');
  const functions = [...code.matchAll(/\b(?:async\s+)?function\s+([a-zA-Z_$][\w$]*)\s*\(([^)]*)\)/g)];
  const inspect = [...new Set(names)].map((name) => {
    const arrow = code.match(new RegExp(`\\b(?:const|let|var)\\s+${name}\\s*=\\s*(?:async\\s+)?(?:\\(([^)]*)\\)|([\\w$]+))\\s*=>`));
    const args = arrow ? argumentsFor(arrow[1] ?? arrow[2]) : '';
    if (interactive && arrow) return `try{const args=window.__devlifeArguments??[${args}];window.__devlifeReport(${JSON.stringify(name)}+'('+args.map(arg=>JSON.stringify(arg)).join(', ')+')',${name}(...args))}catch(error){window.__devlifeReport(${JSON.stringify(name)},error.message)}`;
    return `try{if(typeof ${name}==='function'){window.__devlifeReport(${JSON.stringify(`${name}(${args})`)},${name}(${args}))}else{window.__devlifeReport('',${name})}}catch{}`;
  }).join('\n');
  const invoke = functions.map((match) => {
    const args = match[2].trim() ? argumentsFor(match[2]).replace(/(?:, )?undefined(?:, undefined)*$/, '') : '';
    if (interactive) return `try{const args=window.__devlifeArguments??[${args}];window.__devlifeReport(${JSON.stringify(match[1])}+'('+args.map(arg=>JSON.stringify(arg)).join(', ')+')',${match[1]}(...args))}catch(error){window.__devlifeReport(${JSON.stringify(match[1])},error.message)}`;
    return `try{window.__devlifeReport(${JSON.stringify(`${match[1]}(${args})`)},${match[1]}(${args}))}catch(error){window.__devlifeReport(${JSON.stringify(match[1])},error.message)}`;
  }).join('\n');
  const classes = [...code.matchAll(/\bclass\s+([a-zA-Z_$][\w$]*)/g)].map((match) => `try{window.__devlifeReport(${JSON.stringify(`new ${match[1]}("Dev")`)},new ${match[1]}('Dev'))}catch{}`).join('\n');
  return `\n;${inspect}\n${invoke}\n${classes}\nif(document.querySelector('#devlifeResults')?.dataset.empty)window.__devlifeReport('','Código executado. Interaja com os elementos abaixo quando houver eventos.');`;
}

const previewConsole = `
window.__devlifeReport=(name,value)=>{
  if(value && typeof value.then==='function'){const output=document.querySelector('#devlifeResults');if(output.dataset.empty){output.textContent='Aguardando resultado…\\n';delete output.dataset.empty}value.then(result=>window.__devlifeReport(name,result)).catch(error=>window.__devlifeReport(name,error.message));return}
  const output=document.querySelector('#devlifeResults');
  let formatted;
  try{formatted=typeof value==='string'?value:typeof Element!=='undefined' && value instanceof Element?value.outerHTML:value instanceof Map?JSON.stringify([...value],null,2):value instanceof Set?JSON.stringify([...value],null,2):JSON.stringify(value,null,2)}catch{formatted=String(value)}
  if(window.__devlifeCompact){
    if(typeof Element!=='undefined' && value instanceof Element)formatted=({BUTTON:'Botão',LI:'Item',ARTICLE:'Cartão'}[value.tagName]||value.tagName.toLowerCase())+(value.id?' #'+value.id:'');
    else if(value && typeof value==='object')try{formatted=JSON.stringify(value instanceof Map||value instanceof Set?[...value]:value)}catch{}
    if(name.length>65)name='Resultado';
  }
  if(output.dataset.empty){output.textContent='';delete output.dataset.empty}
  output.textContent+=(name?name+' → ':'')+(formatted===undefined?String(value):formatted)+'\\n';
};
for(const method of ['log','info','warn','error'])console[method]=(...values)=>values.forEach(value=>window.__devlifeReport('',value));
`;

function javascriptScene(exercise, code) {
  const scenario = schoolJavascriptScenario(exercise);
  const output = '<section style="background:#101c28;border:1px solid #29483c;border-radius:16px;padding:24px;margin-bottom:20px;box-shadow:0 8px 24px #00000012"><div style="font:600 10px sans-serif;letter-spacing:2px;color:#9dcaad;margin-bottom:18px">RESULTADO</div><pre id="devlifeResults" data-empty="true" style="margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font:500 22px/1.6 monospace;color:#eff8ee">Seu resultado aparecerá aqui.</pre></section>';
  if (exercise.kind === 'work' || exercise.previewAfterScript) return output + exercise.previewHtml;
  const note = scenario?.note ? `<p>${escape(scenario.note)}</p>` : '';
  if (scenario?.html) return note + scenario.html + output;
  const uses = (id) => code.includes('#' + id);
  let scene = '';
  if (uses('card')) scene += '<article id="card" class="card" data-id="42" style="border:1px solid #cbd5e1;border-radius:12px">Cartão de exemplo</article>';
  if (uses('acao') || /evento\.target/.test(code)) scene += '<button id="acao" style="padding:12px 20px;background:#22c55e;border:0;border-radius:10px;font:600 14px sans-serif;color:#102619;cursor:pointer">Testar botão</button>';
  if (uses('status')) scene += '<p id="status" role="status">Aguardando interação.</p>';
  if (uses('lista')) scene += '<ul id="lista"></ul>';
  return exercise.id?.startsWith('school-javascript-') ? note + scene + output : output + note + scene;
}

export function exercisePreview(exercise, code) {
  const contractPreview = schoolContractPreview(exercise, code);
  if (contractPreview) return projectDocument(contractPreview);
  const htmlPreview = schoolHtmlPreview(exercise, code);
  if (htmlPreview) return projectDocument(htmlPreview);
  const scenario = schoolJavascriptScenario(exercise);
  const interactive = exercise.id?.startsWith('school-javascript-');
  const setup = interactive ? (scenario?.setup || '').replace(/window\.(?:nome|numeros|preco)\s*=[^;]+;/g, '') : scenario?.setup || '';
  const demo = exercise.area === 'JavaScript' && exercise.previewHtml ? schoolDemo(exercise, javascriptScene(exercise, code), previewConsole + '\n' + setup + '\n' + code + '\n;' + (exercise.previewAfterScript || (scenario?.after ? `try{${scenario.after}}catch(error){window.__devlifeReport('Prévia',error.message)}` : javascriptResults(code, interactive))), code) : null;
  if (exercise.previewHtml)
    return projectDocument({
      html: exercise.area === 'HTML' ? code : exercise.area === 'JavaScript'
        ? demo.html
        : exercise.previewHtml,
      css: exercise.area === 'CSS' ? code : '',
      js: exercise.area === 'JavaScript' ? demo.script : '',
    });
  const base =
    'body{font:16px system-ui;margin:0;padding:20px;color:#263c49;background:white}*{box-sizing:border-box}';
  let html;
  if (exercise.area === 'CSS') {
    const sample = cssScenes[exercise.id];
    if (!sample) throw new Error(`Falta o cenário de prévia para ${exercise.id}.`);
    html = `<style>${base}.sample-tile{background:#e5edf2;padding:12px;border:1px solid #c5d6de;margin-bottom:4px}.sample-stage{min-height:220px;background:#f0f4f7;border:1px dashed #aac2cd}.sample-surface{background:#e8eff4}.sample-outline{border:1px dashed #aac2cd}button{font:inherit;padding:4px;border:0;background:#dce5e9;color:#263c49;border-radius:0}input{font:inherit;max-width:100%}${sample.css}</style>${sample.html}<style>${code.replace(/<\/style/gi, '<\\/style')}</style>`;
  } else if (exercise.area === 'HTML') {
    html = `<style>${base}button{padding:10px 18px;background:#a5d6d2;border:0;border-radius:7px}</style>${code}`;
  } else {
    html = `<style>${base}body{font-family:monospace}pre{white-space:pre-wrap}</style><p>Seu código JavaScript</p><pre>${escape(code)}</pre>`;
  }
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${html}</body></html>`;
}
// A prévia roda em um iframe sem origem compartilhada e sem acesso à rede ou à conta.
export function projectDocument({ html = '', css = '', js = '' }) {
  const safeHtml = resolveLearningImages(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<meta\b[^>]*http-equiv[^>]*>/gi, '')
    .replace(/<base\b[^>]*>/gi, '');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; media-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'"><style>:root{--accent:#22c55e}@keyframes surgir{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}body{font:16px sans-serif;padding:20px;margin:0}*{box-sizing:border-box}.ativo{outline:3px solid #22c55e;background:#dcfce7}.destaque{outline:4px solid #22c55e;transform:scale(.98)}.pagina{min-height:180px}.card{padding:12px;margin:8px}.botao{padding:10px}#previewErrors{white-space:pre-wrap;color:#b91c1c;background:#fee2e2;padding:10px}</style><style>${css.replace(/<\/style/gi, '<\\/style')}</style></head><body>${safeHtml}<script type="module">window.addEventListener('error',e=>{const p=document.createElement('pre');p.id='previewErrors';p.textContent='JavaScript: '+e.message;document.body.append(p)});Object.assign(window,{numeros:[1,2,3],notas:[8,9],cursos:['HTML','CSS','JS'],extras:['Node'],produtos:[{id:1}],perfil:{nome:'Dev',nivel:1},nome:'Dev',valor:'120',entrada:0,usuario:{},pontos:50,ativo:true,preco:120,json:'{}',pedidos:[{pago:true,valor:100}],item:document.createElement('li'),timer:0});const memoriaDoExercicio=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>memoriaDoExercicio.get(k)??null,setItem:(k,v)=>memoriaDoExercicio.set(k,String(v)),removeItem:k=>memoriaDoExercicio.delete(k),clear:()=>memoriaDoExercicio.clear()}});</script><script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
}
export function renderProjectPreview(frame, source) {
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.previewSource = source;
  if (!frame.getAttribute('src')) {
    frame.removeAttribute('srcdoc');
    frame.onload = () => {
      frame.onload = null;
      frame.contentWindow.postMessage(frame.previewSource, '*');
    };
    frame.src = './sandbox-preview.html';
  } else frame.contentWindow.postMessage(source, '*');
}
import { resolveLearningImages } from './learning-images.js';
