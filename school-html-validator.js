import { parse, parseFragment } from 'parse5';
import { normalizeHtmlTextPunctuation } from './curriculum.js';

export function htmlTree(source, documentMode = /<html\b/i.test(source)) {
  source = normalizeHtmlTextPunctuation(source);
  const parsed = documentMode ? parse(source) : parseFragment(source);
  const convert = node => {
    if (node.nodeName === '#text') return node.value.trim() ? node.value.replace(/\s+/g, ' ').trim() : null;
    if (node.nodeName === '#comment' || node.nodeName === '#documentType') return null;
    const children = (node.content?.childNodes || node.childNodes || []).map(convert).filter(Boolean);
    return {tag: node.tagName || '#root', attrs: Object.fromEntries((node.attrs || []).map(attr => [attr.name, attr.value])), children};
  };
  return convert(parsed);
}
const elements = node => (node?.children || []).filter(child => typeof child !== 'string').flatMap(child => [child, ...elements(child)]);
const text = node => (node?.children || []).map(child => typeof child === 'string' ? child : text(child)).join(' ').trim();
const tokens = value => (value || '').trim().split(/\s+/).filter(Boolean);
const booleans = new Set(['required','checked','hidden','autofocus','disabled','controls','defer','download']);
const keywords = new Set(['type','role','charset','lang','method','autocomplete','loading','preload','scope','aria-live','aria-atomic','aria-expanded','aria-hidden','aria-invalid','aria-pressed','aria-current']);
const references = new Set(['for','list','aria-controls','aria-describedby','aria-labelledby']);

export function checkHtmlChallenge(code, solution, options = {}) {
  const documentMode = /<html\b/i.test(solution);
  const actual = htmlTree(code, documentMode), expected = htmlTree(solution, documentMode);
  const description = options.description || '';
  const referencedIds = new Set(elements(expected).flatMap(node => ['aria-describedby','aria-labelledby'].flatMap(key => tokens(node.attrs[key]))));
  if (description) {
    const paragraphsRequested = /par[aá]grafos?|descri[cç][aã]o|biografia|respostas?|transcri[cç][aã]o/i.test(description);
    const footerParagraphRequested = /par[aá]grafo de autoria|par[aá]grafo.*rodap[eé]|rodap[eé].*par[aá]grafo/i.test(description);
    const tune = node => {
      const keepParagraph = child => referencedIds.has(child.attrs.id) || (paragraphsRequested&&(node.tag!=='footer'||footerParagraphRequested));
      const removed=node.children.some(child=>typeof child!=='string'&&child.tag==='p'&&!keepParagraph(child));
      node.children=node.children.filter(child=>typeof child==='string'||child.tag!=='p'||keepParagraph(child));
      if(removed)node.textRequired=true;
      for(const child of node.children)if(typeof child!=='string')tune(child);
    };
    tune(expected);
  }
  const actualNodes = elements(actual), expectedNodes = elements(expected);
  const ids = new Map(), errors = [];
  for (const node of actualNodes) if (node.attrs.id) {
    if (ids.has(node.attrs.id)) errors.push(`O id "${node.attrs.id}" está repetido; cada id deve identificar um único elemento.`);
    ids.set(node.attrs.id, node);
  }
  const expectedIds = new Set(expectedNodes.map(node => node.attrs.id).filter(Boolean));
  const findTarget = node => ids.get(node.attrs.for);
  function attributeMatches(node, wanted, key, value) {
    const own = node.attrs[key];
    if (booleans.has(key)) return Object.hasOwn(node.attrs, key);
    if(options.exactAttributes && ['id','name','href','src','alt','for'].includes(key))return own===value;
    if (key === 'class') return options.requireClasses === false || tokens(value).every(token => tokens(own).includes(token));
    if (key === 'id') return !!own?.trim() || (node.tag === 'input' && actualNodes.some(label => label.tag === 'label' && text(label) && elements(label).includes(node)));
    if (key === 'name' && !['meta','iframe'].includes(node.tag)) return !!own?.trim();
    if (references.has(key)) {
      if (node.tag === 'label') return (elements(node).some(child => ['input','select','textarea'].includes(child.tag)) || (!!own && ['input','select','textarea','output','meter','progress'].includes(findTarget(node)?.tag)));
      return !!own && new Set(tokens(own)).size>=tokens(value).length && tokens(own).every(id => ids.has(id));
    }
    if (key === 'rel') return tokens(value.toLowerCase()).every(token => tokens(own?.toLowerCase()).includes(token));
    if (keywords.has(key)) {
      if (key === 'type' && value === 'text' && node.tag === 'input' && own === undefined) return true;
      if (key === 'type' && value === 'submit' && node.tag === 'button' && own === undefined) return true;
      return own?.toLowerCase().replace(key === 'charset' ? /-/g : /$^/g, '') === value.toLowerCase().replace(key === 'charset' ? /-/g : /$^/g, '');
    }
    if (key === 'content' && wanted.attrs.name === 'viewport') {
      const parameters = value => Object.fromEntries((value || '').split(',').map(item => item.trim().split(/\s*=\s*/)));
      const a = parameters(own), b = parameters(value);
      return Object.entries(b).every(([k,v]) => a[k] === v || (Number.isFinite(Number(v)) && Number(a[k]) === Number(v)));
    }
    if (['alt','aria-label','title','placeholder','label','content'].includes(key)) return !!own?.trim();
    if (key === 'href' && value.startsWith('#')) return !!own?.trim() && (!expectedIds.has(value.slice(1)) || (own.startsWith('#') && ids.has(own.slice(1))));
    if (key === 'href' && /^https:\/\//.test(value)) return /^https:\/\//.test(own || '');
    if (['src','href'].includes(key) && description && !description.includes(value)) return !!own?.trim() && (!/^(?:mailto:|tel:)/i.test(value) || own.toLowerCase().startsWith(value.split(':')[0].toLowerCase()+':'));
    if (key === 'value' && wanted.tag === 'option') return value === '' ? own === '' : !!own?.trim();
    if (key === 'datetime') return !!own && (/^\d{4}-\d\d-\d\d(?:T.*)?$/.test(own) || /^\d\d:\d\d(?::\d\d)?$/.test(own));
    if (['min','max','step','minlength','maxlength','width','height','colspan','rowspan'].includes(key) && Number.isFinite(Number(value))) return own !== undefined && Number(own) === Number(value);
    return own === value;
  }
  const neutral = new Set(['div','span','p','header','footer','fieldset','section','article']);
  // Um componente isolado também pode ser entregue dentro de uma página completa.
  if (!expectedNodes.some(node => node.tag === 'main')) neutral.add('main');
  function candidates(node) {
    const found = [];
    for (const child of node.children) if (typeof child !== 'string') {
      found.push(child);
      if (neutral.has(child.tag)) found.push(...candidates(child));
      if (child.tag === 'label') found.push(...elements(child).filter(item => ['input','select','textarea'].includes(item.tag)));
    }
    if (node.tag === 'label' && findTarget(node)) found.push(findTarget(node));
    if (node.tag === 'form' && node.attrs.id) found.push(...actualNodes.filter(control=>control.attrs.form===node.attrs.id));
    return [...new Set(found)];
  }
  const memo = new WeakMap();
  function matches(node, wanted) {
    if (memo.get(node)?.has(wanted)) return memo.get(node).get(wanted);
    const brand = wanted.tag==='h1' && /\bmarca\b/i.test(description) && !/\bh1\b/i.test(description);
    const heading = /^h[2-6]$/.test(wanted.tag) && !new RegExp('\\b'+wanted.tag+'\\b','i').test(description);
    if (node.tag !== wanted.tag && !(brand&&['a','strong','img'].includes(node.tag)) && !(heading&&/^h[2-6]$/.test(node.tag))) return false;
    const attributes = Object.entries(wanted.attrs).every(([key,value]) => attributeMatches(node, wanted, key, value));
    const liveRegion = ['alert','status'].includes(wanted.attrs.role);
    if (!attributes || (!liveRegion && (wanted.textRequired || wanted.children.some(child => typeof child === 'string')) && !(text(node)||(brand&&node.attrs.alt?.trim())))) return false;
    if(options.exactText && wanted.children.some(child=>typeof child==='string')){
      const normalized=value=>value.trim().replace(/\s+/g,' ').replace(/\s+\./g,'.').replace(/\.$/,'');
      if(normalized(text(node))!==normalized(text(wanted)))return false;
    }
    const required = wanted.children.filter(child => typeof child !== 'string');
    const available = candidates(node);
    // Matching bipartido: um irmão mais completo não deve ser consumido pelo primeiro critério genérico.
    const assigned = new Map();
    function assign(wantedIndex, seen) {
      for (let index=0;index<available.length;index++) {
        if (seen.has(index) || !matches(available[index], required[wantedIndex])) continue;
        seen.add(index);
        if (!assigned.has(index) || assign(assigned.get(index),seen)) {assigned.set(index,wantedIndex);return true;}
      }
      return false;
    }
    let result;
    if(['ol','dl'].includes(wanted.tag)){
      let cursor=0;result=required.every(child=>{while(cursor<available.length)if(matches(available[cursor++],child))return true;return false;});
    }else result = required.every((_child,index) => assign(index,new Set()));
    if (!memo.has(node)) memo.set(node,new Map());
    memo.get(node).set(wanted,result);
    return result;
  }
  if (!matches(actual,expected)) {
    for (const wanted of expectedNodes) {
      if (actualNodes.some(node => matches(node,wanted))) continue;
      const sameTag = actualNodes.filter(node=>node.tag===wanted.tag);
      if (!sameTag.length) {errors.push(`Falta incluir <${wanted.tag}> na estrutura solicitada.`);continue;}
      const missing = Object.entries(wanted.attrs).filter(([key,value])=>!sameTag.some(node=>attributeMatches(node,wanted,key,value)));
      if (missing.length) errors.push(`Confira <${wanted.tag}>: ${missing.map(([key,value])=>references.has(key)?`${key} deve apontar para um elemento existente`:key==='id'?'identificador ou associação com label':`${key}="${value}"`).join('; ')}.`);
      else {
        const required=wanted.children.filter(child=>typeof child!=='string');
        const closest=[...sameTag].sort((a,b)=>required.filter(child=>candidates(b).some(node=>matches(node,child))).length-required.filter(child=>candidates(a).some(node=>matches(node,child))).length)[0];
        for(const child of required)if(!candidates(closest).some(node=>matches(node,child)))errors.push(`Dentro de <${wanted.tag}>, confira <${child.tag}> e suas associações.`);
      }
    }
    if (!errors.length) errors.push('Os elementos existem, mas confira sua organização e quantidade: mantenha as regiões, grupos, itens e associações descritos no enunciado. A ordem dos elementos de mesmo nível pode variar.');
  }
  // Mantém grupos de rádio, mas não impõe o nome escolhido pela referência.
  const expectedRadioGroups = new Map(), actualRadioGroups = new Map();
  for(const node of expectedNodes)if(node.tag==='input'&&node.attrs.type==='radio')expectedRadioGroups.set(node.attrs.name,(expectedRadioGroups.get(node.attrs.name)||0)+1);
  for(const node of actualNodes)if(node.tag==='input'&&node.attrs.type==='radio')actualRadioGroups.set(node.attrs.name,(actualRadioGroups.get(node.attrs.name)||0)+1);
  for(const count of expectedRadioGroups.values())if(![...actualRadioGroups.values()].some(actualCount=>actualCount>=count))errors.push('Os botões de rádio de uma mesma escolha devem compartilhar o mesmo name.');
  return [...new Set(errors)].slice(0,5);
}

export const matchHtmlChallenge = (code,solution,options) => checkHtmlChallenge(code,solution,options).length === 0;
