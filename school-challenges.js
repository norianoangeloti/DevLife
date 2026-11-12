import { htmlChallenges } from './school-html-challenges.js';
import { javascriptChallenges, javascriptChallengeNotes } from './school-js-challenges.js';
import { cssChallenge } from './school-css-challenges.js';
import { javascriptPreviewCases } from './school-challenge-validator.js';

export function upgradeSchoolLesson(lesson, index) {
  if (lesson.stage === 'beginner') return lesson;
  const challenge = lesson.area === 'HTML' ? htmlChallenges[index] : lesson.area === 'JavaScript' ? javascriptChallenges[index] : cssChallenge(lesson, index);
  const result = {...lesson,...challenge,challengeKind:challenge.challengeKind || (lesson.area === 'HTML' ? 'html-composition' : 'javascript-contract')};
  result.curriculumVersion = 2;
  result.previousEdition = {title:lesson.title,description:lesson.description,lesson:lesson.lesson};
  if (lesson.area === 'HTML') {
    const ids = [...result.solution.matchAll(/\bid="([^"]+)"/g)].map(match => '#'+match[1]);
    const attributes = [...result.solution.matchAll(/\b(?:name|type|for|href|src|datetime|lang|scope|aria-controls|aria-describedby|aria-labelledby|data-action|data-id|class)="[^"]+"/g)].map(match=>match[0]);
    result.description += ' Os textos podem ser de sua autoria; mantenha a estrutura semântica e as associações pedidas.';
    result.requirements = [
      'Construa todos os componentes descritos, respeitando a hierarquia e fechando as tags.',
      ...(ids.length ? ['Identificadores de referência: '+[...new Set(ids)].join(', ')+'. Você pode renomeá-los se mantiver as associações e os destinos funcionando.'] : []),
      'Atributos de referência: '+[...new Set(attributes)].join(' · ')+'. Nomes de campos podem variar; preserve os tipos, restrições, grupos e associações.',
      'Escreva textos úteis. A avaliação não exige copiar as frases da solução de referência.',
    ];
    result.starter = '<!-- Construa o componente completo descrito no desafio. -->';
    result.hints = ['Comece pela hierarquia das regiões e depois associe os controles e seus nomes.', 'Use os identificadores dos critérios para conectar labels, links e regiões acessíveis.', 'Teste a navegação por teclado e verifique se as informações têm estrutura semântica.'];
  } else if (lesson.area === 'JavaScript') {
    result.starter = result.solution.slice(0,result.solution.indexOf('{')+1)+'\n  // Implemente a regra e trate os casos de borda.\n}';
    result.previewCases = javascriptPreviewCases(result);
    result.functionName = result.contract.functionName;
    result.requirements = ['Respeite a assinatura da função fornecida no editor.', 'Retorne o resultado; console.log não substitui return.', 'Trate entradas vazias e os limites descritos no enunciado.', 'Preserve os argumentos recebidos. A correção usa diferentes entradas, incluindo casos não mostrados na prévia.'];
    result.hints = ['Separe os casos inválidos da transformação principal.', 'Teste a menor entrada possível e um caso normal antes de combinar as regras.', 'Faça cópias antes de ordenar ou atualizar objetos e listas recebidos.'];
  } else {
    result.hints = ['Leia o componente e agrupe as regras por responsabilidade: estrutura, conteúdo e interação.', 'Teste a mesma solução em tela estreita e larga; confirme o estado de foco com Tab.', 'A ordem dos seletores e das propriedades pode variar. Preserve as restrições do componente.'];
  }
  if (result.title === 'Feedback de envio acessível') {
    result.assessment = 'html-accessible-feedback';
    result.requirements = ['Formulário com h2 preenchido.', 'Textarea obrigatória (required) com label associado por for/id ou envolvendo o campo.', 'Botão de envio com texto.', 'Região separada com role="status", aria-live="polite" e aria-atomic="true". Pode começar vazia e usar div, p ou outra tag adequada.', 'Textos e identificadores podem ser escolhidos por você. Aceita componente isolado ou documento completo.'];
  }
  if (result.title === 'Resultado de busca identificável') {
    result.assessment = 'html-search-document';
    result.description = 'Monte um documento completo em português brasileiro (lang pt-BR), com título da aba e meta description preenchidos no head. No body, crie main com h1 e, dentro dele, formulário com role search, campo type search com name e label associado e botão de envio. Os textos e nomes do campo podem ser de sua escolha.';
    result.requirements = ['Documento completo: html lang="pt-BR", head e body.', 'No head, title e meta name="description" com content preenchido; a ordem é livre.', 'No main, h1 e form role="search".', 'No formulário, input type="search" com name; associe um label pelo par for/id ou envolvendo o campo.', 'Botão de envio com texto. Não há obrigação de usar id="busca" ou name="q".'];
    result.hints = ['Metadados ficam no head; a interface de busca fica no main, dentro do body.', 'O valor de for deve corresponder ao id do campo. Outra opção é envolver o input com o label.', 'O name identifica o valor enviado pelo formulário e pode ser escolhido por você.'];
  }
  result.lesson = {...lesson.lesson,
    title:'Prepare-se: '+result.title,
    introduction:'Este é um desafio independente. Use o conceito estudado com outras habilidades para construir uma solução completa.',
    explanation:lesson.lesson.explanation+' Neste exercício, o objetivo é '+result.title.toLowerCase()+'. Leia as restrições antes de escolher sua implementação.',
    observation:lesson.area==='JavaScript'?'Uma implementação deve funcionar com entradas diferentes. Confira listas vazias, limites e preservação dos dados; a avaliação compara comportamento, não uma cópia exata do código.':lesson.area==='HTML'?'O texto pode ser autoral, mas a estrutura e as associações precisam funcionar. Atributos podem aparecer em outra ordem. Teste o resultado com teclado.':'A solução deve compor todas as regras. A ordem das declarações pode variar, mas confira a cascata e teste as condições especiais.',
    steps:['Leia o cenário e liste as condições que sua solução precisa cumprir.', 'Implemente por partes e teste na prévia a cada mudança.', 'Revise casos de borda e entregue quando todos os critérios estiverem atendidos.'],
  };
  if (lesson.area === 'JavaScript') Object.assign(result.lesson, javascriptChallengeNotes(result));
  return result;
}
