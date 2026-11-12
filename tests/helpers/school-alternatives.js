import {parse,parseFragment,serialize} from 'parse5';
import * as css from 'css-tree';

export function htmlAlternative(lesson){
  const full=/<html\b/i.test(lesson.solution);
  const root=full?parse(lesson.solution):parseFragment(lesson.solution);
  function all(node){return [node,...(node.content?.childNodes||node.childNodes||[]).flatMap(all)];}
  const nodes=all(root), ids=new Map();
  for(const node of nodes)for(const attr of node.attrs||[])if(attr.name==='id')ids.set(attr.value,'aluno-'+attr.value);
  for(const node of nodes){
    for(const attr of node.attrs||[]){
      if(attr.name==='id')attr.value=ids.get(attr.value);
      if(['for','list','aria-controls','aria-labelledby','aria-describedby'].includes(attr.name))attr.value=attr.value.split(/\s+/).map(value=>ids.get(value)||value).join(' ');
      if(attr.name==='href'&&attr.value.startsWith('#')&&ids.has(attr.value.slice(1)))attr.value='#'+ids.get(attr.value.slice(1));
      if(attr.name==='name'&&node.tagName!=='meta')attr.value='campo-'+attr.value;
      if(attr.name==='lang')attr.value=attr.value.toLowerCase();
      if(['required','checked','hidden','defer'].includes(attr.name))attr.value=attr.name;
    }
    if(node.attrs)node.attrs.reverse();
    if(node.tagName==='input'&&node.attrs.some(attr=>attr.name==='type'&&attr.value==='text'))node.attrs=node.attrs.filter(attr=>attr.name!=='type');
    if(node.tagName==='button'&&node.attrs.some(attr=>attr.name==='type'&&attr.value==='submit'))node.attrs=node.attrs.filter(attr=>attr.name!=='type');
    if(node.tagName==='head')node.childNodes.reverse();
    if(['main','article','section'].includes(node.tagName)){
      const wrapper=parseFragment('<div class="conteudo-do-aluno"></div>').childNodes[0];wrapper.childNodes=node.childNodes;wrapper.parentNode=node;for(const child of wrapper.childNodes)child.parentNode=wrapper;node.childNodes=[wrapper];
    }
  }
  const answer=serialize(root);
  return full?answer:'<!doctype html><html lang="pt-BR"><head><title>Meu projeto</title></head><body>'+answer+'</body></html>';
}

export function cssAlternative(source){
  const ast=css.parse(source,{parseCustomProperty:true});
  css.walk(ast,node=>{
    if(node.type==='Hash'&&[3,6].includes(node.value.length)){
      const hex=node.value.length===3?[...node.value].map(c=>c+c).join(''):node.value;
      const values=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));
      Object.assign(node,css.parse('rgb('+values.join(',')+')',{context:'value'}).children.first);
    }
    if(node.type==='Dimension'&&node.unit==='s'){node.unit='ms';node.value=String(Number(node.value)*1000);}
  });
  css.walk(ast,{visit:'Block',enter(node){
    const replacement=[];
    for(const item of node.children){
      if(item.type!=='Declaration'){replacement.push(item);continue;}
      const parts=[...(item.value.children||[])].map(css.generate);
      const entries=[];
      if(['padding','margin'].includes(item.property)&&parts.length>=1&&parts.length<=4){
        const values=[parts[0],parts[1]??parts[0],parts[2]??parts[0],parts[3]??parts[1]??parts[0]];
        for(const [i,side]of ['top','right','bottom','left'].entries())entries.push([item.property+'-'+side,values[i]]);
      }else if(item.property==='gap'&&parts.length<=2){entries.push(['row-gap',parts[0]],['column-gap',parts[1]??parts[0]]);}
      else entries.push([item.property,css.generate(item.value)]);
      for(const [property,value]of entries)replacement.push(css.parse((property.startsWith('--')?property:property.toUpperCase())+':'+value+(item.important?' !important':''),{context:'declaration',parseCustomProperty:true}));
    }
    node.children=new css.List().fromArray(replacement.reverse());
  }});
  return css.generate(ast);
}

export function alternativeAnswer(lesson){
 if(lesson.area==='HTML'){
  if(lesson.stage!=='beginner')return htmlAlternative(lesson);
  return '<html lang="pt-BR"><head><title>Estudo</title></head><body>'+lesson.solution.replace(/<\/?[a-z][\w-]*/g,tag=>tag.toUpperCase())+'</body></html>';
 }
 if(lesson.area==='CSS')return cssAlternative(lesson.solution);
 return 'const apoioDoAluno = true;\n'+lesson.solution.replace(/^function\s+(\w+)\s*\(([^)]*)\)\s*\{/,'const $1 = ($2) => {')+';';
}
