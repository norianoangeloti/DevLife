import { parse, generate, walk } from 'css-tree';

const sides = ['top','right','bottom','left'];
const colours = {white:'#ffffff',black:'#000000',red:'#ff0000',blue:'#0000ff',transparent:'#00000000',gray:'#808080',grey:'#808080'};
function colourFunctions(value) {
  return value.replace(/rgba?\(([^()]*)\)/gi,(original,inside)=>{
    const parts=inside.replace(/,/g,' ').replace(/\//g,' ').trim().split(/\s+/);
    if(parts.length<3||parts.length>4||parts.some(p=>!/^[-+\d.]+%?$/.test(p)))return original;
    const channels=parts.slice(0,3).map(p=>Math.round(Math.max(0,Math.min(255,p.endsWith('%')?parseFloat(p)*2.55:Number(p)))));
    const alpha=parts[3]===undefined?1:parts[3].endsWith('%')?parseFloat(parts[3])/100:Number(parts[3]);
    return '#'+channels.map(n=>n.toString(16).padStart(2,'0')).join('')+(alpha<1?Math.round(Math.max(0,alpha)*255).toString(16).padStart(2,'0'):'');
  });
}
function normalizedValue(value, property) {
  const ast = typeof value==='string'?parse(value,{context:'value'}):value;
  walk(ast,node=>{
    if(['Number','Dimension','Percentage'].includes(node.type))node.value=String(Number(node.value));
    if(node.type==='Dimension'){node.unit=node.unit.toLowerCase();if(node.unit==='ms'){node.value=String(Number(node.value)/1000);node.unit='s';}}
    if(node.type==='Function')node.name=node.name.toLowerCase();
    if(node.type==='Hash'){
      node.value=node.value.toLowerCase();
      if(node.value.length===3||node.value.length===4)node.value=[...node.value].map(c=>c+c).join('');
    }
    if(node.type==='Identifier'&&!node.name.startsWith('--')&&!property.startsWith('--')&&!/grid-area|grid-template-areas|animation-name|container-name/.test(property))node.name=node.name.toLowerCase();
  });
  let result=colourFunctions(generate(ast)).replace(/(^|[\s(,])0(?:px|em|rem|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc)(?=[\s),/]|$)/g,'$10');
  if(/color|background|border|outline|shadow/.test(property))result=result.replace(/\b(white|black|red|blue|transparent|gray|grey)\b/g,word=>colours[word]);
  if(property.startsWith('--')&&colours[result.toLowerCase()])result=colours[result.toLowerCase()];
  if(/grid-template-(?:columns|rows)/.test(property))result=result.replace(/repeat\(([2-8]),([^(),]+)\)/g,(_all,count,part)=>Array(Number(count)).fill(part.trim()).join(' '));
  if(property==='font-weight')result=result==='bold'?'700':result==='normal'?'400':result;
  return result;
}
function four(values) {return [values[0],values[1]??values[0],values[2]??values[0],values[3]??values[1]??values[0]];}

export function cssTree(code) {
  const syntaxErrors=[];
  const ast=parse(code,{positions:true,parseCustomProperty:true,onParseError:error=>syntaxErrors.push(error)});
  if(syntaxErrors.length)throw syntaxErrors[0];
  const result={};
  function declarations(block,target) {
    const set=(property,value,important)=>{if(!target[property]?.important||important)target[property]={value,important:!!important};};
    for(const declaration of block.children){
      if(declaration.type!=='Declaration')continue;
      const property=declaration.property.startsWith('--')?declaration.property:declaration.property.toLowerCase();
      const value=normalizedValue(declaration.value,property), important=declaration.important;
      const parts=[...(declaration.value.children||[])].map(part=>normalizedValue(generate(part),property));
      if(['padding','margin'].includes(property)&&parts.length>=1&&parts.length<=4){four(parts).forEach((v,i)=>set(`${property}-${sides[i]}`,v,important));continue;}
      if(property==='gap'&&parts.length<=2){set('row-gap',parts[0],important);set('column-gap',parts[1]??parts[0],important);continue;}
      if(property==='overflow'&&parts.length<=2){set('overflow-x',parts[0],important);set('overflow-y',parts[1]??parts[0],important);continue;}
      if(property==='border-radius'&&!parts.includes('/')&&parts.length<=4){four(parts).forEach((v,i)=>set(['border-top-left-radius','border-top-right-radius','border-bottom-right-radius','border-bottom-left-radius'][i],v,important));continue;}
      if(/^border-(?:width|style|color)$/.test(property)&&parts.length<=4){const detail=property.slice(7);four(parts).forEach((v,i)=>set(`border-${sides[i]}-${detail}`,v,important));continue;}
      const border=property.match(/^border(?:-(top|right|bottom|left))?$/);
      if(border||property==='outline'){
        const style=parts.find(p=>/^(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)$/.test(p))||'none';
        const width=parts.find(p=>/^(?:thin|medium|thick|[\d.]+(?:px|em|rem|pt)?|0)$/.test(p))||'medium';
        const color=parts.find(p=>p!==style&&p!==width)||'currentcolor';
        const prefixes=property==='outline'?['outline']:border[1]?[`border-${border[1]}`]:sides.map(side=>`border-${side}`);
        for(const prefix of prefixes){set(prefix+'-style',style,important);set(prefix+'-width',width,important);set(prefix+'-color',color,important);}continue;
      }
      if(property==='background'&&(/^(?:#[\da-f]{6}(?:[\da-f]{2})?|currentcolor)$/.test(value)||value.startsWith('var('))){set('background-color',value,important);continue;}
      if(property==='background'&&/^(?:linear|radial)-gradient\(/.test(value)){set('background-image',value,important);continue;}
      if(property==='flex'&&parts.every(p=>!['auto','none','initial','inherit'].includes(p))){
        set('flex-grow',parts[0],important);set('flex-shrink',parts.length===3?parts[1]:parts.length===2&&/^\d/.test(parts[1])&&!/[a-z%]/.test(parts[1])?parts[1]:'1',important);set('flex-basis',parts.length===3?parts[2]:parts.length===2&&/[a-z%]/.test(parts[1])?parts[1]:'0%',important);continue;
      }
      if(property==='transition'&&!parts.includes(',')){
        if(value==='none'){set('transition-property','none',important);continue;}
        const times=parts.filter(p=>/^-?[\d.]+s$/.test(p));
        const timing=parts.find(p=>/^(?:ease(?:-in|-out|-in-out)?|linear|step-start|step-end|cubic-bezier\(|steps\()/.test(p))||'ease';
        const transitioned=parts.find(p=>!times.includes(p)&&p!==timing)||'all';
        set('transition-property',transitioned,important);set('transition-duration',times[0]||'0s',important);set('transition-delay',times[1]||'0s',important);set('transition-timing-function',timing,important);continue;
      }
      if(property==='animation'&&!parts.includes(',')){
        if(value==='none'){set('animation-name','none',important);continue;}
        const times=parts.filter(p=>/^-?[\d.]+s$/.test(p));
        const timing=parts.find(p=>/^(?:ease(?:-in|-out|-in-out)?|linear|step-start|step-end|cubic-bezier\(|steps\()/.test(p))||'ease';
        const fill=parts.find(p=>/^(?:forwards|backwards|both)$/.test(p))||'none';
        const iterations=parts.find(p=>/^(?:infinite|[\d.]+)$/.test(p))||'1';
        const direction=parts.find(p=>/^(?:normal|reverse|alternate|alternate-reverse)$/.test(p))||'normal';
        const play=parts.find(p=>/^(?:running|paused)$/.test(p))||'running';
        const name=parts.find(p=>!times.includes(p)&&![timing,fill,iterations,direction,play].includes(p))||'none';
        for(const [key,val]of Object.entries({name,duration:times[0]||'0s',delay:times[1]||'0s','timing-function':timing,'fill-mode':fill,'iteration-count':iterations,direction,'play-state':play}))set('animation-'+key,val,important);continue;
      }
      set(property,value,important);
    }
  }
  function rules(block,target,parents=[]){
    for(const node of block.children){
      if(node.type==='Rule'){
        let selectors=node.prelude.type==='SelectorList'?[...node.prelude.children].map(generate):[generate(node.prelude)];
        if(parents.length)selectors=parents.flatMap(parent=>selectors.map(selector=>selector.includes('&')?selector.replaceAll('&',parent):parent+' '+selector));
        selectors=selectors.map(selector=>selector.replace(/^body\s+/,'').replace(/\b[a-z][\w-]*(?=[.#])/gi,'').replace(/^0%$/,'from').replace(/^100%$/,'to'));
        for(const selector of selectors){target[selector]??={};declarations(node.block,target[selector]);}
        rules(node.block,target,selectors);
      }else if(node.type==='Atrule'&&node.block){
        let condition=node.prelude?generate(node.prelude).replace(/\s+/g,''):'';
        if(node.name.toLowerCase()==='media')condition=condition.replace(/^(?:screen|all)and(?=\()/,'').replace(/\(width<=([\d.]+px)\)/g,'(max-width:$1)').replace(/\(width>=([\d.]+px)\)/g,'(min-width:$1)');
        const key='@'+node.name.toLowerCase()+condition;
        if(/keyframes$/i.test(node.name))target[key]={};else target[key]??={};
        if(parents.length)for(const selector of parents){target[key][selector]??={};declarations(node.block,target[key][selector]);}
        rules(node.block,target[key],parents);
      }
    }
  }
  rules(ast,result);return result;
}

export function checkCssChallenge(code,solution){
  let actual,expected;
  try{actual=cssTree(code);expected=cssTree(solution);}catch(error){return [`Confira a sintaxe do CSS${error.line?' na linha '+error.line:''}: ${error.message}`];}
  const errors=[];
  const defaults={'transition-delay':'0s','transition-duration':'0s','transition-timing-function':'ease','transition-property':'all','animation-delay':'0s','animation-duration':'0s','animation-timing-function':'ease','animation-fill-mode':'none','animation-iteration-count':'1','animation-direction':'normal','animation-play-state':'running','animation-name':'none'};
  function compare(a,b,path=[]){
    for(const [key,value]of Object.entries(b)){
      if(value&&typeof value==='object'&&Object.hasOwn(value,'value')){
        const edge=key.match(/^(border-(?:top|right|bottom|left)|outline)-(width|color)$/);
        if(edge&&['none','hidden'].includes(b[edge[1]+'-style']?.value)&&['none','hidden'].includes(a?.[edge[1]+'-style']?.value))continue;
        const family=key.startsWith('animation-')?'animation-':key.startsWith('transition-')?'transition-':null;
        const current=a?.[key]?.value??(family&&Object.keys(a||{}).some(property=>property.startsWith(family))?defaults[key]:undefined);
        if(current!==value.value)errors.push(`Em ${path.join(' → ')}, configure ${key}: ${value.value}${current!==undefined?' (atual: '+current+')':''}.`);
      }else if(!a?.[key])errors.push(`Falta a regra ${[...path,key].join(' → ')}.`);
      else compare(a[key],value,[...path,key]);
    }
  }
  compare(actual,expected);return errors.slice(0,5);
}
export const matchCssChallenge=(code,solution)=>checkCssChallenge(code,solution).length===0;
