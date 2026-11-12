import ts from 'typescript';
import path from 'node:path';
import { clubTracks } from './public/expansion-rules.js';

const compilerOptions = {
  target: ts.ScriptTarget.ES2022,
  strict: true,
  noEmit: true,
  types: [],
  lib: ['lib.es2022.d.ts'],
  skipLibCheck: true,
};
const file = path.resolve('exercise.ts');
const libDirectory = path.dirname(path.resolve(ts.getDefaultLibFilePath(compilerOptions)));

export function compileTypedExercise(lesson, source) {
  const contract = lesson.starter.slice(0, lesson.starter.indexOf('function handler'));
  const checked = source + '\n' + contract.replace(/\b(Input|Output)\b/g, '__Contract$1') +
    '\nconst __check: (input: __ContractInput) => __ContractOutput = handler;';
  const host = ts.createCompilerHost(compilerOptions);
  const libraryFile = name => path.dirname(path.resolve(name)) === libDirectory && /^lib\..+\.d\.ts$/.test(path.basename(name));
  const read = host.readFile;
  host.readFile = name => path.resolve(name) === file ? checked : libraryFile(name) ? read(name) : undefined;
  host.fileExists = name => path.resolve(name) === file || (libraryFile(name) && read(name) !== undefined);
  const program = ts.createProgram([file], compilerOptions, host);
  const errors = ts.getPreEmitDiagnostics(program);
  if (errors.length) throw new Error(ts.flattenDiagnosticMessageText(errors[0].messageText, ' '));
  return ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
}

const front = [
  ['Cartão de perfil', 'Remova os espaços externos do nome. Se ficar vazio, use Visitante. Retorne o título e o indicador de atividade.', 'Readonly<{ nome: string; ativo: boolean }>', '{ titulo: string; ativo: boolean }', 'return { titulo: input.nome.trim() || "Visitante", ativo: input.ativo };', [{nome:' Ana ',ativo:true},{nome:' ',ativo:false}]],
  ['Filtro de catálogo', 'Retorne os nomes que contêm a busca, sem diferenciar maiúsculas e ignorando espaços nas pontas da busca. Preserve a ordem.', 'Readonly<{ nomes: readonly string[]; busca: string }>', 'string[]', 'const busca = input.busca.trim().toLowerCase(); return input.nomes.filter(nome => nome.toLowerCase().includes(busca));', [{nomes:['Agenda','Loja','AGENTE'],busca:' AGE '},{nomes:['A'],busca:'x'},{nomes:['A','B'],busca:''}]],
  ['Estado de carregamento', 'Use a união discriminada. Retorne Carregando… no estado loading, a mensagem no estado error e o nome no estado ready.', '{ estado: "loading" } | { estado: "error"; mensagem: string } | { estado: "ready"; nome: string }', 'string', 'switch(input.estado){case "loading": return "Carregando…"; case "error": return input.mensagem; case "ready": return input.nome;}', [{estado:'loading'},{estado:'error',mensagem:'Sem conexão'},{estado:'ready',nome:'Ana'}]],
  ['Validação de formulário', 'Normalize o nome e devolva {ok:true,nome} se tiver 3 ou mais caracteres. Caso contrário, devolva {ok:false,erro:"Nome muito curto"}.', 'Readonly<{ nome: string }>', '{ ok: true; nome: string } | { ok: false; erro: string }', 'const nome = input.nome.trim(); return nome.length >= 3 ? {ok:true,nome} : {ok:false,erro:"Nome muito curto"};', [{nome:'  Rui '},{nome:' A '},{nome:''}]],
  ['Seleção de cartões', 'Alterne o ID clicado na seleção. Ao adicionar, coloque no fim. Ao remover, preserve a ordem dos outros IDs.', 'Readonly<{ selecionados: readonly number[]; id: number }>', 'number[]', 'return input.selecionados.includes(input.id) ? input.selecionados.filter(id => id !== input.id) : [...input.selecionados,input.id];', [{selecionados:[7,2],id:7},{selecionados:[7,2],id:4},{selecionados:[],id:1}]],
  ['Prova · Painel de catálogo', 'Filtre por nome e, se somenteAtivos for verdadeiro, descarte inativos. Normalize a busca. Retorne os cartões {id,titulo} na ordem original e a mensagem "Nenhum resultado" quando vazios ou "Resultados disponíveis" quando houver resultados.', 'Readonly<{ itens: readonly Readonly<{id:number; nome:string; ativo:boolean}>[]; busca:string; somenteAtivos:boolean }>', '{ cartoes: {id:number; titulo:string}[]; mensagem:string }', 'const q=input.busca.trim().toLowerCase(); const cartoes=input.itens.filter(i=>(!input.somenteAtivos||i.ativo)&&i.nome.toLowerCase().includes(q)).map(i=>({id:i.id,titulo:i.nome})); return {cartoes,mensagem:cartoes.length?"Resultados disponíveis":"Nenhum resultado"};', [{itens:[{id:1,nome:'Agenda',ativo:false},{id:2,nome:'Agente',ativo:true}],busca:' AGE ',somenteAtivos:true},{itens:[{id:7,nome:'Loja',ativo:false}],busca:'',somenteAtivos:false},{itens:[],busca:'x',somenteAtivos:true}]],
];

const back = [
  ['Resposta de API', 'Retorne status 200 e o corpo {servico,online:true} com o nome recebido.', 'Readonly<{ servico:string }>', '{ status:200; body:{servico:string;online:true} }', 'return {status:200,body:{servico:input.servico,online:true}};', [{servico:'Catálogo'},{servico:'Reservas'}]],
  ['Validação de JSON', 'Receba um valor unknown. Se for uma string não vazia após trim, retorne status 200 e o texto normalizado. Para qualquer outro valor, retorne status 422 e corpo null.', 'unknown', '{ status:200; body:string } | { status:422; body:null }', 'if(typeof input==="string" && input.trim()) return {status:200,body:input.trim()}; return {status:422,body:null};', [' Ana ',null,42,' ',{nome:'Ana'}]],
  ['Consulta por ID', 'Localize o registro pelo ID. Retorne status 200 e {id,nome} ou status 404 e corpo null.', 'Readonly<{ id:number; itens:readonly Readonly<{id:number;nome:string}>[] }>', '{status:200;body:{id:number;nome:string}} | {status:404;body:null}', 'const item=input.itens.find(i=>i.id===input.id);return item?{status:200,body:{...item}}:{status:404,body:null};', [{id:2,itens:[{id:2,nome:'Loja'}]},{id:7,itens:[{id:2,nome:'Loja'}]},{id:1,itens:[]}]],
  ['Autorização por perfil', 'Administradores podem ler e editar. Visitantes só podem ler. Retorne 200 quando permitido ou 403 quando negado.', 'Readonly<{ perfil:"admin"|"visitante"; acao:"ler"|"editar" }>', '200 | 403', 'return input.perfil==="admin"||input.acao==="ler"?200:403;', [{perfil:'admin',acao:'editar'},{perfil:'visitante',acao:'editar'},{perfil:'visitante',acao:'ler'}]],
  ['Criação sem duplicatas', 'Normalize o novo nome com trim. Se tiver menos de 3 caracteres, retorne 422. Se já existir sem diferenciar caixa, retorne 409. Senão acrescente o nome ao fim e retorne 201. Devolva {status,nomes}.', 'Readonly<{ nomes:readonly string[]; nome:string }>', '{status:201|409|422;nomes:readonly string[]}', 'const nome=input.nome.trim();if(nome.length<3)return {status:422,nomes:input.nomes};if(input.nomes.some(n=>n.toLowerCase()===nome.toLowerCase()))return {status:409,nomes:input.nomes};return {status:201,nomes:[...input.nomes,nome]};', [{nomes:['Agenda'],nome:' agenda '},{nomes:['Agenda'],nome:' Loja '},{nomes:[],nome:' A '}]],
  ['Prova · API de reservas', 'Recuse com 401 quando autorizado for falso. GET devolve status 200, corpo com a lista e reservas. POST exige nome string com ao menos 3 caracteres após trim (422 se inválido), cria ID máximo + 1 e devolve 201 com a reserva criada no corpo. Em erros, o corpo é null. Sempre inclua reservas e preserve a entrada.', 'Readonly<{ method:"GET"|"POST"; autorizado:boolean; reservas:readonly Readonly<{id:number;nome:string}>[]; nome?:unknown }>', '{ status:200|201|401|422; body:readonly {id:number;nome:string}[] | {id:number;nome:string} | null; reservas:readonly {id:number;nome:string}[] }', 'const {reservas}=input;if(!input.autorizado)return {status:401,body:null,reservas};if(input.method==="GET")return {status:200,body:reservas,reservas};if(typeof input.nome!=="string"||input.nome.trim().length<3)return {status:422,body:null,reservas};const item={id:Math.max(0,...reservas.map(r=>r.id))+1,nome:input.nome.trim()};return {status:201,body:item,reservas:[...reservas,item]};', [{method:'GET',autorizado:false,reservas:[]},{method:'GET',autorizado:true,reservas:[{id:3,nome:'Ana'}]},{method:'POST',autorizado:true,reservas:[{id:7,nome:'Ana'}],nome:' Rui '},{method:'POST',autorizado:true,reservas:[],nome:42},{method:'POST',autorizado:true,reservas:[],nome:' B '}]],
];

function exercise(track, spec, details) {
  const [title, description, input, output, body, cases] = spec;
  const types = `type Input = ${input};\ntype Output = ${output};\n\n`;
  const signature = 'function handler(input: Input): Output';
  return {
    ...details, title, description, track, area: clubTracks[track], typescript: true,
    starter: types + signature + ' {\n  // Implemente o contrato aqui.\n}\n',
    solution: types + signature + ' {\n  ' + body + '\n}\n',
    explanation: track === 'ts-front'
      ? 'Use tipos para representar dados e estados da interface. A função prepara o resultado que a tela vai exibir. O compilador verifica o contrato e os testes conferem o comportamento.'
      : 'Modele a entrada e a resposta da API. Tipos são verificados antes da execução. Dados externos ainda precisam de validação em tempo de execução.',
    example: 'type Entrada = { nome: string };\nfunction titulo(input: Entrada): string {\n  return input.nome.trim();\n}',
    contract: { functionName:'entry', immutable:true, cases: cases.map(value => [value]) },
  };
}

export const typedClubLessons = Object.entries({'ts-front':front,'ts-back':back}).flatMap(([track,specs]) =>
  specs.map((spec,index) => {
    const exam = index === specs.length - 1;
    return exercise(track,spec,{
      id: `devclub-${track}-${exam?'exam':index+1}`,
      exam, number:index+1, xp:exam?600:120, requires:index?[`devclub-${track}-${index}`]:[],
    });
  }),
);

export const typedUsJobs = [
  exercise('ts-front', [
    'TypeScript Front-end · Painel de pedidos', 'Exiba apenas pedidos com status aberto. Ordene por total decrescente, depois por ID crescente. Retorne cartões {id,rotulo}, usando "Pedido #ID" como rótulo.',
    'readonly Readonly<{id:number; status:"aberto"|"fechado"; total:number}>[]', '{id:number;rotulo:string}[]',
    'return input.filter(p=>p.status==="aberto").sort((a,b)=>b.total-a.total||a.id-b.id).map(p=>({id:p.id,rotulo:"Pedido #"+p.id}));',
    [[{id:9,status:'aberto',total:20},{id:2,status:'aberto',total:20},{id:4,status:'aberto',total:50},{id:1,status:'fechado',total:100}],[],[{id:8,status:'fechado',total:0}]],
  ], {id:'us-ts-front',region:'usa',rewardCents:100}),
  exercise('ts-back', [
    'TypeScript Back-end · API de estoque', 'Receba {estoque,quantidade}. Retorne status 422 se quantidade não for inteiro positivo, 409 se exceder estoque, ou 200 e o saldo restante. Inclua estoque em todas as respostas e preserve o valor original em erros.',
    'Readonly<{estoque:number;quantidade:unknown}>', '{status:200|409|422;estoque:number}',
    'const {estoque,quantidade}=input;if(typeof quantidade!=="number"||!Number.isInteger(quantidade)||quantidade<=0)return {status:422,estoque};if(quantidade>estoque)return {status:409,estoque};return {status:200,estoque:estoque-quantidade};',
    [{estoque:7,quantidade:7},{estoque:2,quantidade:3},{estoque:10,quantidade:'2'},{estoque:7,quantidade:0},{estoque:5,quantidade:1.5}],
  ], {id:'us-ts-back',region:'usa',rewardCents:100}),
];
