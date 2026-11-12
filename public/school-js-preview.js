// Entradas e observação do código do aluno; não contém soluções dos desafios.
const report = (expression, label = '') => `window.__devlifeReport(${JSON.stringify(label)},${expression});`;
const scenarios = {
  'Filtrar valores': { setup: 'window.numeros = [-2, 0, 3, 5];' },
  'Limpar espaços': { setup: 'window.nome = "  Dev  ";' },
  'Remover duplicados': { setup: 'window.numeros = [1, 2, 2, 3, 1];' },
  'Ordenar números': { setup: 'window.numeros = [8, 2, 10, 1];' },
  'Arredondar': { setup: 'window.preco = 19.6;' },
  'Interpretar JSON': { setup: 'window.json = \'{"nome":"Dev","nivel":1}\';' },
  'Seleção do DOM': {
    note: 'Clique no botão para conferir a seleção.',
    after: report('botao', 'Selecionado') + 'document.querySelector("#acao").addEventListener("click",evento=>{window.__devlifeReport("Seleção correta",botao===evento.currentTarget);evento.currentTarget.textContent="Selecionado ✓";});',
  },
  'Texto no DOM': { after: report('document.querySelector("#status").textContent', 'Texto na página') },
  'Classe no DOM': { after: report('document.querySelector("#card").className', 'Classes do cartão') },
  'Alternar classe': { after: report('document.querySelector("#card").className', 'Classes do cartão') },
  'Evento de clique': {
    note: 'Clique e veja o texto mudar.',
    after: 'window.__devlifeReport("", "Aguardando clique.");document.querySelector("#acao").addEventListener("click",()=>window.__devlifeReport("Texto após o clique",document.querySelector("#status").textContent));',
  },
  'Criar elemento': { after: report('item', 'Elemento criado (ainda fora da página)') },
  'Adicionar elemento': {
    setup: 'window.item.textContent = "Item de exemplo";',
    after: report('document.querySelector("#lista").innerHTML', 'Conteúdo da lista'),
  },
  'Remover elemento': { after: report('document.querySelector("#card") === null', 'Cartão removido') },
  'Atualizar atributo': {
    note: 'Clique para conferir o atributo.',
    after: report('document.querySelector("#acao").getAttribute("aria-expanded")', 'aria-expanded') + 'document.querySelector("#acao").addEventListener("click",()=>window.__devlifeReport("aria-expanded no botão",document.querySelector("#acao").getAttribute("aria-expanded")));',
  },
  'Cancelar envio': {
    html: '<form id="formulario"><button type="button">Testar envio</button><p id="status">Aguardando envio.</p></form>',
    after: 'document.querySelector("#formulario").addEventListener("submit",evento=>{enviar(evento);document.querySelector("#status").textContent=evento.defaultPrevented?"Envio cancelado pelo seu código.":"O código não cancelou o envio.";window.__devlifeReport("",document.querySelector("#status").textContent);evento.preventDefault()});document.querySelector("#formulario button").addEventListener("click",()=>document.querySelector("#formulario").dispatchEvent(new SubmitEvent("submit",{bubbles:true,cancelable:true})));',
  },
  'Delegação de evento': {
    html: '<div id="delegacao"><button id="acao"><span>Clique neste texto dentro do botão</span></button><p id="status">Aguardando clique.</p></div>',
    after: 'document.querySelector("#delegacao").addEventListener("click",evento=>{const elemento=alvo(evento);window.__devlifeReport("Botão encontrado",elemento);document.querySelector("#status").textContent=elemento?.id === "acao"?"O clique no texto encontrou o botão #acao.":"Nenhum botão encontrado."});',
  },
  'Timer': { after: report('"Aguardando a mensagem do timer (1 segundo)."') },
  'Cancelar timer': {
    setup: 'window.timer = setTimeout(()=>window.__devlifeReport("", "O timer não foi cancelado."),1000);',
    after: report('"Aguarde 1 segundo. Se o timer foi cancelado, não haverá outra mensagem."'),
  },
  'Método': { after: report('new Contador().subir()', 'new Contador().subir()') },
  'Salvar preferência': { after: report('localStorage.getItem("tema")', 'Tema armazenado') },
  'Ler preferência': { setup: 'localStorage.setItem("tema", "escuro");' },
};
export function schoolJavascriptScenario(exercise) {
  return exercise.id?.startsWith('school-javascript-') ? scenarios[exercise.title] : undefined;
}

export function schoolDemo(exercise, html, script, code = '') {
  if (!exercise.id?.startsWith('school-javascript-')) return { html, script };
  const escape = text => text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const data = { nome: 'Dev', numeros: [1, 2, 3], cursos: ['HTML', 'CSS', 'JS'], pontos: 50, preco: 120 };
  Object.assign(data, {
    'Filtrar valores': { numeros: [-2, 0, 3, 5] },
    'Limpar espaços': { nome: '  Dev  ' },
    'Remover duplicados': { numeros: [1, 2, 2, 3, 1] },
    'Ordenar números': { numeros: [8, 2, 10, 1] },
    'Arredondar': { preco: 19.6 },
  }[exercise.title]);
  const labels = { nome: 'Nome', numeros: 'Números', cursos: 'Cursos', pontos: 'Pontos', preco: 'Preço' };
  const fields = Object.keys(data).filter(key => new RegExp(`\\b${key}\\b`).test(code) && !new RegExp(`(?:const|let|var)\\s+${key}\\b|function\\s+\\w+\\s*\\([^)]*\\b${key}\\b`).test(code));
  const parameters = code.match(/\bfunction\s+\w+\s*\(([^)]*)\)|(?:const|let)\s+\w+\s*=\s*(?:\(([^)]*)\)|(\w+))\s*=>/);
  const editableFunction = parameters && (parameters[1] || parameters[2] || parameters[3])?.trim() && !/evento|pedidos|json/.test(parameters[0]);
  const inputs = fields.map(key => `<label>${labels[key]}<input data-demo-key="${key}" value="${escape(Array.isArray(data[key]) ? data[key].join(', ') : String(data[key]))}"></label>`).join('') + (editableFunction ? '<label>Testar com outro valor<input id="devlifeSimpleArgs" placeholder="Use o padrão ou digite aqui"></label>' : '');
  const controls = `<style>body{background:#f8faf9;color:#20362c;font:14px/1.5 system-ui;padding:16px}button{cursor:pointer}#demoToolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}#demoToolbar small{font-size:11px;letter-spacing:1px;color:#718078}#devlifeDemoRun{background:#18794e;color:white;border:0;border-radius:9px;padding:9px 15px;font:600 13px system-ui}.demo-options{margin-bottom:14px;color:#64746b;font-size:12px}.demo-options summary{cursor:pointer}.demo-options label{display:block;margin-top:10px}.demo-options input{display:block;width:100%;box-sizing:border-box;border:1px solid #dce5df;border-radius:8px;padding:9px;margin-top:4px;font:14px system-ui}#devlifeDemoScene>p{font-size:12px;color:#64746b}#devlifeDemoScene button{font:600 13px system-ui!important;padding:10px 16px!important;border-radius:9px!important;background:#e2f3e9!important;color:#176741!important;border:1px solid #b8dcc7!important}#devlifeDemoScene section{margin-top:14px!important;margin-bottom:0!important;background:white!important;border:1px solid #e0e8e3!important;border-radius:12px!important;padding:16px!important;box-shadow:none!important}#devlifeDemoScene section>div{color:#718078!important;font-size:10px!important;letter-spacing:1px!important;margin-bottom:8px!important}#devlifeResults{font:14px/1.6 ui-monospace,monospace!important;color:#254a35!important}</style><div id="demoToolbar"><small>DEV LIFE · PRÉVIA</small><button id="devlifeDemoRun" type="button">↻ Testar</button></div>${inputs ? `<details class="demo-options"><summary>Mudar valores</summary>${inputs}</details>` : ''}<textarea id="devlifeDemoData" hidden>${escape(JSON.stringify(data))}</textarea><input id="devlifeDemoArgs" hidden><span id="devlifeDemoCount" hidden></span>`;
  // Reconstrói apenas a cena, preservando as entradas. Eventos não se acumulam ao repetir.
  const wrapped = `
const demoScene=document.querySelector('#devlifeDemoScene');
window.__devlifeCompact=true;
const initialScene=demoScene.innerHTML;
const pendingTimers=new Set();const originalTimeout=window.setTimeout.bind(window);
window.setTimeout=(fn,delay,...args)=>{const id=originalTimeout(fn,delay,...args);pendingTimers.add(id);return id};
let executions=0;
window.__devlifeRun=async()=>{
  for(const id of pendingTimers)clearTimeout(id);pendingTimers.clear();
  demoScene.innerHTML=initialScene;
  try{
    const data=JSON.parse(document.querySelector('#devlifeDemoData').value);
    for(const input of document.querySelectorAll('[data-demo-key]')){const key=input.dataset.demoKey;data[key]=Array.isArray(data[key])?input.value.split(',').map(v=>typeof data[key][0]==='number'?Number(v.trim()):v.trim()):typeof data[key]==='number'?Number(input.value):input.value;}
    if(!data || Array.isArray(data) || typeof data!=='object')throw new Error('Os dados devem ser um objeto JSON.');
    for(const key of ['nome','numeros','cursos','pontos','preco'])if(Object.hasOwn(data,key))window[key]=data[key];
    const simpleArgs=document.querySelector('#devlifeSimpleArgs')?.value.trim();
    const argsText=simpleArgs?JSON.stringify(simpleArgs.split(',').map(value=>{const text=value.trim();if(text==='true')return true;if(text==='false')return false;if(text==='null')return null;return text!=='' && Number.isFinite(Number(text))?Number(text):text})):document.querySelector('#devlifeDemoArgs').value.trim();
    window.__devlifeArguments=argsText?JSON.parse(argsText):null;
    if(window.__devlifeArguments!==null && !Array.isArray(window.__devlifeArguments))throw new Error('Os argumentos devem ser um array JSON.');
    window.item=document.createElement('li');
    ${script}
    document.querySelector('#devlifeDemoCount').textContent='Execução '+(++executions)+' concluída';
  }catch(error){document.querySelector('#devlifeResults').textContent='Confira seu código ou os dados: '+error.message;}
};
document.querySelector('#devlifeDemoRun').addEventListener('click',()=>window.__devlifeRun());
await window.__devlifeRun();`;
  return {html: controls + '<div id="devlifeDemoScene">' + html + '</div>',script: wrapped};
}
