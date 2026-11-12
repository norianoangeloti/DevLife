const status = document.querySelector('#status');
const version = document.querySelector('#version');
const enter = document.querySelector('#enter');
const login = new URL(location.href);
login.searchParams.set('entrar','1');
enter.href = login.href;
const start = Date.now();
const previewImage = document.querySelector('#preview-image');
const previewCaption = document.querySelector('#preview-caption');
const previewDetail = document.querySelector('#preview-detail');
const previewButtons = [...document.querySelectorAll('[data-preview]')];
const previews = [
  ['cidade.png', 'Ruas e prédios da cidade no DevLife', 'Explore a cidade', 'Descubra novas regiões e encontre outros personagens.'],
  ['carreira.png', 'Laboratório de informática no DevLife', 'Aprenda na prática', 'Visite a escola, pratique programação e desenvolva projetos.'],
  ['casa.png', 'Veículo do personagem no DevLife', 'Circule pelo mapa', 'Use veículos para explorar outras partes da cidade.'],
];
let previewIndex = 0;
for (const [file] of previews.slice(1)) new Image().src = './startup-previews/' + file;
function showPreview(index) {
  previewIndex = index;
  const [file, alt, caption, detail] = previews[index];
  previewImage.src = './startup-previews/' + file;
  previewImage.alt = alt;
  previewCaption.textContent = caption;
  previewDetail.textContent = detail;
  previewButtons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
}
const rotation=matchMedia('(prefers-reduced-motion: reduce)').matches ? null :
  setInterval(()=>showPreview((previewIndex+1)%previews.length),3000);
previewButtons.forEach((button,index)=>button.addEventListener('click',()=>{
  clearInterval(rotation);
  showPreview(index);
}));
const messages = {
  checking: 'Procurando atualização…',
  downloading: 'Atualizando DevLife…',
  starting: 'Iniciando DevLife…',
  current: 'DevLife já está na última versão.',
  updated: 'DevLife atualizado com sucesso',
  local: 'DevLife pronto para jogar.',
  offline: 'Não foi possível verificar online. Abrindo a versão instalada.',
};

async function poll() {
  try {
    const response = await fetch('./__devlife/startup', { cache:'no-store', signal:AbortSignal.timeout(3000) });
    if (!response.ok) throw Error('Status indisponível');
    const result = await response.json();
    if (result.ready) {
      if (result.state === 'updated') {
        status.textContent = 'Atualizando DevLife…';
        document.body.classList.add('finishing-update');
        await new Promise(resolve => setTimeout(resolve, 5000));
        document.body.classList.remove('finishing-update');
      }
      status.textContent = messages[result.state] || messages.checking;
      version.textContent = result.edition ? 'Versão ' + result.edition : 'Versão instalada ' + result.version;
      version.hidden = false;
      enter.hidden = false;
      document.body.classList.add('ready');
      const delay = result.state === 'local' ? 1200 : Math.max(2400, 9600 - (Date.now() - start));
      setTimeout(() => location.replace(enter.href), delay);
      return;
    }
    status.textContent = messages[result.state] || messages.checking;
  } catch {
    // A porta fica momentaneamente indisponível na troca para o jogo.
  }
  if (Date.now() - start > 90000) {
    status.textContent = 'O DevLife ainda está iniciando. Recarregue esta página para verificar novamente.';
    enter.hidden = false;
    return;
  }
  setTimeout(poll, 350);
}
setTimeout(poll, 450);
