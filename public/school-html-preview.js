const metadata = {
  'Idioma do documento': [['Idioma', 'html', 'lang'], ['Head', 'head', 'empty'], ['Body', 'body', 'empty']],
  'Codificação': [['Codificação', 'meta[charset]', 'charset']],
  'Viewport responsivo': [['Viewport', 'meta[name="viewport"]', 'content']],
  'Título da aba': [['Título da aba', 'title', 'text']],
  'Descrição da página': [['Descrição', 'meta[name="description"]', 'content']],
  'Folha externa': [['Relação', 'link', 'rel'], ['Arquivo CSS', 'link', 'href']],
  'Script adiado': [['Arquivo JavaScript', 'script', 'src'], ['Adiado (defer)', 'script', 'boolean:defer']],
  'Ícone da página': [['Ícone', 'link', 'href'], ['Tipo', 'link', 'type']],
};

function inspectHtml(source, rows, title) {
  const parsed = new DOMParser().parseFromString(source, 'text/html');
  const panel = document.querySelector('#htmlObservation');
  const list = document.querySelector('#htmlProperties');
  const add = (label, value) => {
    const row = document.createElement('div');
    const name = document.createElement('dt'); name.textContent = label;
    const content = document.createElement('dd'); content.textContent = value;
    row.append(name, content); list.append(row);
  };
  if (!source.replace(/<!--[\s\S]*?-->/g, '').trim()) {
    panel.hidden = false; document.querySelector('#htmlHint').textContent = 'Escreva seu HTML para ver a prévia.'; return;
  }
  if (rows) {
    panel.hidden = false;
    document.querySelector('#htmlHint').textContent = 'Estas informações configuram o documento e não aparecem no corpo da página.';
    for (const [label, selector, attribute] of rows) {
      const element = parsed.querySelector(selector);
      const value = !element ? 'Não informado' : attribute === 'text' ? element.textContent || 'Vazio' : attribute === 'empty' ? (element.children.length || element.textContent.trim() ? 'Com conteúdo' : 'Vazio') : attribute.startsWith('boolean:') ? (element.hasAttribute(attribute.slice(8)) ? 'Sim' : 'Não') : element.getAttribute(attribute) || 'Não informado';
      add(label, value);
    }
    if (['Folha externa', 'Script adiado', 'Ícone da página'].includes(title)) {
      document.querySelector('#htmlHint').textContent = 'A prévia mostra a referência declarada. O arquivo externo não é carregado nesta demo.';
    }
  }
  const target = document.querySelector('#htmlExample');
  const dialog = target.querySelector('dialog');
  const template = target.querySelector('template');
  if (dialog || template) {
    panel.hidden = false;
    document.querySelector('#htmlHint').textContent = dialog ? 'O diálogo fica oculto até ser aberto.' : 'O template guarda conteúdo sem exibi-lo na página.';
    const control = document.querySelector('#htmlTry'); control.hidden = !(dialog || template);
    control.textContent = dialog ? 'Abrir diálogo' : 'Mostrar cartão';
    control.addEventListener('click', () => {
      if (dialog) dialog.showModal();
      else { const area = document.querySelector('#htmlTemplateResult'); area.replaceChildren(template.content.cloneNode(true)); }
    });
    if (dialog) dialog.querySelectorAll('button').forEach(button => button.addEventListener('click', () => dialog.close()));
  }
  if (target.querySelector('video,audio')) {
    panel.hidden = false;
    document.querySelector('#htmlHint').textContent = 'Os controles são reais. Para reproduzir, o arquivo de mídia indicado precisa estar disponível; ele não acompanha este exercício.';
  }
  // Atributos de acessibilidade e associações ficam disponíveis sem ocupar a tela principal.
  const details = document.querySelector('#htmlInspect');
  const pre = details.querySelector('pre');
  const attributes = [...target.querySelectorAll('*')].flatMap(element => [...element.attributes].filter(attr => /^(aria-|role$|scope$|for$|list$|data-|min|max|required|autocomplete|loading|lang$)/.test(attr.name)).map(attr => `${element.tagName.toLowerCase()} · ${attr.name}="${attr.value}"`));
  if (attributes.length) { details.hidden = false; pre.textContent = attributes.join('\n'); }
}

export function schoolHtmlPreview(exercise, code) {
  if (exercise.area !== 'HTML' || (exercise.stage !== 'advanced' && exercise.challengeKind !== 'html-composition') || !(exercise.id?.startsWith('school-html-') || exercise.id?.startsWith('practice-school-html-'))) return null;
  const rows = metadata[exercise.title] || (/<html\b/i.test(code) ? [['Idioma','html','lang'],['Título da aba','title','text']] : null);
  let content = /<body\b/i.test(code) ? code.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i)?.[1] || '' : rows ? '' : code;
  // Fragmentos de tabela precisam do contexto table para não serem descartados pelo navegador.
  if (/^\s*<(?:tr|thead|tbody|tfoot|th|td)\b/i.test(content)) content = `<table>${content}</table>`;
  const html = `<style>body{background:#f8faf9;color:#263c32;font:14px/1.6 system-ui;padding:16px}#htmlObservation{background:white;border:1px solid #e0e8e3;border-radius:12px;padding:16px;margin-bottom:14px}#htmlObservation[hidden],#htmlInspect[hidden],#htmlTry[hidden]{display:none}#htmlObservation small{color:#718078;font-size:10px;letter-spacing:1px}#htmlHint{font-size:12px;color:#64746b;margin:8px 0}#htmlProperties{margin:0}#htmlProperties div{padding:8px 0;border-top:1px solid #edf1ee}#htmlProperties dt{font-size:11px;color:#718078}#htmlProperties dd{margin:0;overflow-wrap:anywhere}button,input,select{font:inherit}button,#htmlTry{border:1px solid #b8dcc7;background:#e2f3e9;color:#176741;border-radius:8px;padding:9px 14px;cursor:pointer}#htmlInspect{margin-top:18px;font-size:12px;color:#64746b}#htmlInspect summary{cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere}dialog{border:1px solid #dce5df;border-radius:14px;padding:22px}dialog::backdrop{background:#102b2244}img,video{max-width:100%;height:auto}table{border-collapse:collapse}td,th{padding:10px;border:1px solid #dce5df}</style><section id="htmlObservation" hidden><small>PRÉVIA DO DOCUMENTO</small><p id="htmlHint"></p><dl id="htmlProperties"></dl><button id="htmlTry" hidden></button></section><div id="htmlExample">${content}</div><div id="htmlTemplateResult"></div><details id="htmlInspect" hidden><summary>Ver atributos</summary><pre></pre></details>`;
  const serialize = value => JSON.stringify(value).replace(/</g, '\\u003c');
  return {html, js: `(${inspectHtml.toString()})(${serialize(code)},${serialize(rows || null)},${serialize(exercise.title)});`};
}
