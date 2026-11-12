import { getQuickJS, shouldInterruptAfterDeadline } from 'quickjs-emscripten';
import { htmlTree } from './school-html-validator.js';
export { matchHtmlChallenge, checkHtmlChallenge } from './school-html-validator.js';
export { matchCssChallenge, checkCssChallenge } from './school-css-validator.js';

// QuickJS roda dentro de WebAssembly, sem Node, rede, disco ou acesso à conta.
const interpreter = await getQuickJS();
const referenceResults = new Map();
const canonical = value => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);

function runFunction(code, contract, budgetMs = 150) {
  const program = `(() => { const entry = (()=>{${code}\n;return ${contract.functionName};})(); if(typeof entry !== 'function')throw new Error('Defina a função ${contract.functionName}.'); const cases=JSON.parse(${JSON.stringify(JSON.stringify(contract.cases))}); return JSON.stringify(cases.map(args=>{const before=JSON.stringify(args);const result=entry(...args);return {result,unchanged:JSON.stringify(args)===before}})); })()`;
  return JSON.parse(interpreter.evalCode(program, { memoryLimitBytes: 8 * 1024 * 1024, maxStackSizeBytes: 256 * 1024, shouldInterrupt: shouldInterruptAfterDeadline(Date.now() + budgetMs) }));
}

export function checkJavascriptChallenge(lesson, code) {
  try {
    if (!referenceResults.has(lesson.id)) referenceResults.set(lesson.id, runFunction(lesson.solution, lesson.contract, 2000));
    const expected = referenceResults.get(lesson.id);
    const actual = runFunction(code, lesson.contract);
    const errors = [];
    expected.forEach((test, index) => {
      if (canonical(actual[index]?.result) !== canonical(test.result)) errors.push(`Caso ${index + 1}: para ${JSON.stringify(lesson.contract.cases[index])}, o resultado esperado é ${JSON.stringify(test.result)}.`);
      if (lesson.contract.immutable && !actual[index]?.unchanged) errors.push(`Caso ${index + 1}: preserve os dados recebidos; sua função modificou a entrada.`);
    });
    return errors;
  } catch (error) {
    return [`Não foi possível testar a função: ${error.message || String(error)}. Confira a sintaxe, o retorno e se há repetição infinita.`];
  }
}

export function javascriptPreviewCases(lesson) {
  if (!referenceResults.has(lesson.id)) referenceResults.set(lesson.id, runFunction(lesson.solution, lesson.contract, 2000));
  return lesson.contract.cases.slice(0, 3).map((args, index) => ({args, expected: referenceResults.get(lesson.id)[index].result}));
}

export function checkBeginnerJavascript(lesson,code){
  const declared=lesson.solution.match(/\b(?:const|let)\s+(\w+)/)?.[1];
  if(declared){
    const wrapper=source=>`function __lessonValue(){${source}\n;return ${declared};}`;
    return checkJavascriptChallenge({id:lesson.id,solution:wrapper(lesson.solution),contract:{functionName:'__lessonValue',cases:[[]],immutable:true}},wrapper(code));
  }
  const functionName=lesson.solution.match(/function\s+(\w+)/)?.[1];
  const cases=lesson.number===8?[[3,4],[-2,7],[0,0]]:lesson.number===9?[[6],[7],[10]]:[[]];
  return checkJavascriptChallenge({id:lesson.id,solution:lesson.solution,contract:{functionName,cases,immutable:true}},code);
}

export function checkAccessibleFeedback(code) {
  const tree = htmlTree(code);
  const descendants = node => (node?.children || []).filter(child => typeof child !== 'string').flatMap(child => [child, ...descendants(child)]);
  const text = node => (node?.children || []).map(child => typeof child === 'string' ? child : text(child)).join(' ').trim();
  const all = descendants(tree);
  const errors = [];
  const ids = all.map(node => node.attrs.id).filter(Boolean);
  if (new Set(ids).size !== ids.length) errors.push('Use identificadores id únicos na página.');
  const checks = all.filter(node => node.tag === 'form').map(form => {
    const children = descendants(form);
    return [
      children.some(node => node.tag === 'h2' && text(node)),
      children.some(field => field.tag === 'textarea' && 'required' in field.attrs && !('disabled' in field.attrs) && children.some(label => label.tag === 'label' && text(label) && ((field.attrs.id && label.attrs.for === field.attrs.id) || descendants(label).includes(field)))),
      children.some(node => node.tag === 'button' && (!node.attrs.type || node.attrs.type.toLowerCase() === 'submit') && !('disabled' in node.attrs) && text(node)),
    ];
  });
  const best = checks.sort((a,b) => b.filter(Boolean).length-a.filter(Boolean).length)[0];
  if (!best) errors.push('Inclua um form de comentário.');
  else {
    if (!best[0]) errors.push('Inclua um h2 preenchido dentro do formulário.');
    if (!best[1]) errors.push('Inclua no formulário uma textarea required com label associado por for/id ou envolvendo o campo.');
    if (!best[2]) errors.push('Inclua no formulário um botão de envio com texto.');
  }
  const statuses = all.filter(node => node.attrs.role?.toLowerCase() === 'status');
  if (!statuses.some(node => node.attrs['aria-live']?.toLowerCase() === 'polite' && node.attrs['aria-atomic']?.toLowerCase() === 'true' && !['textarea','input','button','label'].includes(node.tag) && !all.some(parent => ['textarea','button','label'].includes(parent.tag) && descendants(parent).includes(node)))) errors.push('Crie uma região separada com role="status", aria-live="polite" e aria-atomic="true". Ela pode começar vazia.');
  return errors;
}

export function checkSearchDocument(code) {
  const tree = htmlTree(code);
  if (!tree) return ['Confira o fechamento e a hierarquia das tags do documento.'];
  const descendants = node => (node?.children || []).filter(child => typeof child !== 'string').flatMap(child => [child, ...descendants(child)]);
  const text = node => (node?.children || []).map(child => typeof child === 'string' ? child : text(child)).join(' ').trim();
  const inside = (node, tag) => descendants(node).filter(child => child.tag === tag);
  const html = tree.children.find(child => child.tag === 'html');
  const head = html?.children.find(child => child.tag === 'head');
  const body = html?.children.find(child => child.tag === 'body');
  const errors = [];
  if (!html || !head || !body) return ['Escreva um documento completo com html, head e body.'];
  if (html.attrs.lang?.toLowerCase() !== 'pt-br') errors.push('Informe lang="pt-BR" no elemento html.');
  if (!inside(head, 'title').some(title => text(title))) errors.push('Inclua um title com o nome da página dentro do head.');
  if (!inside(head, 'meta').some(meta => meta.attrs.name?.toLowerCase() === 'description' && meta.attrs.content?.trim())) errors.push('Inclua no head uma meta com name="description" e content preenchido. A ordem em relação ao title é livre.');
  const main = inside(body, 'main').find(node => inside(node, 'h1').some(heading => text(heading)));
  if (!main) errors.push('Inclua no body um main contendo um h1 preenchido.');
  const forms = inside(main, 'form').filter(form => form.attrs.role === 'search');
  if (!forms.length) errors.push('Dentro do main, inclua um form com role="search".');
  else {
    const checks = forms.map(form => {
      const field = inside(form, 'input').find(input => input.attrs.type === 'search' && input.attrs.name?.trim() && inside(form, 'label').some(label => text(label) && ((input.attrs.id && label.attrs.for === input.attrs.id) || descendants(label).includes(input))));
      const submit = inside(form, 'button').some(button => (!button.attrs.type || button.attrs.type === 'submit') && text(button));
      return {field, submit};
    });
    if (!checks.some(check => check.field && check.submit)) {
      const candidate = checks.find(check => check.field) || checks.find(check => check.submit) || checks[0];
      if (!candidate.field) errors.push('O formulário precisa de input type="search" com name preenchido e label associado: use for igual ao id do input, ou coloque o input dentro do label. Os nomes podem ser de sua escolha.');
      if (!candidate.submit) errors.push('Inclua no mesmo formulário um botão de envio com texto; use type="submit" ou o tipo padrão do button.');
    }
  }
  return errors;
}

export function executeJavascriptPreview(code,functionName,args){return runFunction(code,{functionName,cases:[args]})[0].result;}
