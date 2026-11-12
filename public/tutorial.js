export function tutorialHTML(access) {
  const regions = [
    {key:'plaza',icon:'🌳',name:'Praça',from:'DevCity',color:'green',goal:'Passe na prova de JavaScript iniciante.',path:'Siga a rua à direita de DevCity.'},
    {key:'downtown',icon:'🏙️',name:'Centro',from:'Praça',color:'blue',goal:'Na Praça, complete as três leituras da Biblioteca. Depois, passe nas provas intermediárias de HTML, CSS e JavaScript para liberar o Centro.',path:'Na Praça, siga a rua ao sul do jardim até a saída da direita.'},
    {key:'usa',icon:'🌎',name:'USA',from:'Centro',color:'purple',goal:'Depois de liberar o Centro, envie um projeto no Estádio de Competição. Em seguida, passe nas três provas avançadas da Escola DEV e nas quatro provas do DevClub: Node.js, React, TypeScript Front-end e TypeScript Back-end. A última aprovação libera os EUA.',path:'No Centro, siga a pista à direita até a passagem USA.'},
  ];
  const unlocked = regions.filter(region => access[region.key]).length;
  const next = regions.find(region => !access[region.key]);
  const shortcuts = [['WASD / ↑↓←→','Mover'],['E','Interagir'],['I','Inventário'],['V','Entrar / sair do veículo'],['B','Equipar / guardar notebook'],['N','Abrir sistema do notebook']];
  return `<div class="tutorial-guide">
    <section class="tutorial-hero">
      <span class="tutorial-kicker">SEU GUIA DE DEVCITY</span>
      <h2>Seu código abre<br><em>novos caminhos.</em></h2>
      <p>Comece em DevCity, passe pela Praça, libere o Centro e chegue aos EUA na última etapa.</p>
      <div class="tutorial-worlds" aria-label="Progresso das regiões">
        <span class="is-open">🏡 <b>DevCity</b></span>${regions.map(region=>`<i aria-hidden="true">→</i><span class="${access[region.key]?'is-open':''}">${region.icon} <b>${region.name}</b><small>${access[region.key]?'✓':'🔒'}</small></span>`).join('')}
      </div>
      <div class="tutorial-progress"><span>${unlocked} de 3 passagens liberadas</span><div role="progressbar" aria-label="Passagens liberadas" aria-valuemin="0" aria-valuemax="3" aria-valuenow="${unlocked}"><i style="width:${unlocked/3*100}%"></i></div></div>
    </section>
    <aside class="tutorial-next"><span aria-hidden="true">${next?'↗':'✦'}</span><div><small>${next?'SEU PRÓXIMO DESTINO':'MUNDO LIBERADO'}</small><strong>${next?next.name:'Continue construindo sua história'}</strong><p>${next?next.goal:'Evolua na carreira, monte seu setup e dispute o título de Rei dos Projetos.'}</p></div></aside>
    <div class="tutorial-section-title"><h3>Ordem de liberação</h3><span>SUAS ROTAS</span></div>
    <div class="tutorial-routes">${regions.map((region,index)=>`<article class="tutorial-route tutorial-${region.color} ${access[region.key]?'is-open':''}"><div class="tutorial-route-marker" aria-hidden="true">${region.icon}</div><div class="tutorial-route-copy"><small>0${index+1} · ${region.from} → ${region.name}</small><h4>${region.name}<span class="tutorial-status">${access[region.key]?'✓ Liberado':'🔒 Fechado'}</span></h4><p>${region.goal}</p><div class="tutorial-directions">↳ ${region.path}</div></div></article>`).join('')}</div>
    <p class="tutorial-crossing">As passagens funcionam pela pista e pela calçada. Basta caminhar até a saída.</p>
    <div class="tutorial-pillars">
      <article><span class="tutorial-icon">〈/〉</span><small>01 · APRENDA</small><h3>Pratique de verdade</h3><p>Na Escola DEV, leia a aula, escreva seu código e entregue o desafio. Ganhe XP e conhecimento até chegar às provas.</p><span class="tutorial-chip">Escola DEV → Biblioteca → DevClub</span></article>
      <article><span class="tutorial-icon">↗</span><small>02 · TRABALHE</small><h3>Construa sua carreira</h3><p>Comece na TechSoft. Resolva tickets e faça as avaliações para progredir. Após liberar os EUA, faça projetos Full Stack e desafios de TypeScript por US$ 1 por entrega, com intervalo de 12 horas.</p><div class="tutorial-currencies"><span>🪙 DevCity</span><span>💵 Centro · R$</span><span>💵 USA · US$</span></div></article>
    </div>
    <section class="tutorial-competition"><span aria-hidden="true">🏆</span><div><small>UM NOVO DESAFIO A CADA MÊS</small><h3>Seu projeto pode virar destaque.</h3><p>No Centro, aprenda Node.js, React, TypeScript Front-end e TypeScript Back-end nos computadores do DevClub e envie seu projeto no Estádio de Competição.</p></div><div class="tutorial-prize"><strong>US$ 50</strong><span>para o campeão do mês</span><b>+ Rei dos Projetos</b></div></section>
    <div class="tutorial-section-title"><h3>Tenha tudo à mão</h3><span>ATALHOS</span></div>
    <div class="tutorial-shortcuts">${shortcuts.map(([key,label])=>`<div><kbd>${key}</kbd><span>${label}</span></div>`).join('')}</div>
    <p class="tutorial-footnote">Encontre a coleção DevClub na Loja do Centro e equipe seus itens pelo inventário. Para usar B e N, você precisa ter um notebook.</p>
  </div>`;
}
