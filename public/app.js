import {tutorialHTML} from './tutorial.js';
import {createMobileControls} from './mobile-controls.js';
import {createIdleTracker} from './idle-session.js';
import {createNpcSimulation,nearbyNpc} from './npcs.js';
import {createOnline} from './online.js';
import {heldLaptop,chosenLaptop} from './laptop.js';
import {createCompetitionUI} from './competition-ui.js';
import {createTrafficSimulation} from './traffic.js';
import {newlyUnlockedRegions,regionTours,tourCamera} from './unlock-tour.js';
import {createNpcDialogue} from './npc-dialogue.js';
import {createExpansion} from './expansion-ui.js';
import {accessFor} from './expansion-rules.js';
import { createCelebration } from './achievements.js';
import { createCareer } from './career.js';
import { createSchool } from './school-ui.js';
import { createLearning } from './learning.js';
import { createInventory } from './inventory.js';
import {createPlayerInventory} from './player-inventory.js';
import {activeVehicle,movementDirection} from './vehicle-control.js';
import { createGameAudio } from './game-audio.js';
import { levelProgress,CHARACTER_EDIT_COST } from './economy.js';
import { createLibrary } from './library.js';
import { cycleAt, calendarAt, PHASE_MS } from './day-cycle.js';
import { drawLighting } from './lighting.js';
import { drawWorld, drawInterior, drawPortrait, drawPlaza, drawAvatar, drawRegionalWorld } from './world.js';
import {
  buildings,
  plazaBuildings,
  allBuildings,
  sceneBuildings,
  outdoor,
  onRoad,
  travelPassage,
  move,
  doorAt,
  stationAt,
  adminStation,
  seatAt,
  exitAt,
  safePosition,
  plazaReturn,
} from './navigation.js';
const $ = (id) => document.getElementById(id);
const sound = createGameAudio({
  music: $('gameMusic'),
  bed: $('bedSound'),
  onChange(audio) {
    const silent = audio.muted || audio.volume === 0;
    const blocked=audio.active&&!audio.ready&&!silent;
    $('audioToggle').textContent = blocked ? '🔊 Ativar som' : silent ? '🔇 Som' : audio.sleeping ? '☾ Descanso' : '♪ Música';
    $('audioToggle').setAttribute('aria-pressed', String(silent));
    $('audioToggle').title = blocked||silent ? 'Toque para ativar o som do jogo' : 'Silenciar o som do jogo';
    $('audioVolume').value = Math.round(audio.volume * 100);
    $('audioVolume').setAttribute('aria-valuetext', `${Math.round(audio.volume * 100)}%`);
    $('audioControls').dataset.track = audio.track || 'off';
  },
});
const unlockSound = (event) => {
  if (event.target.closest?.('#audioToggle, #audioVolume')) return;
  if (!sound.snapshot().ready) sound.unlock();
};
document.addEventListener('pointerdown', unlockSound, { capture: true });
document.addEventListener('touchend', unlockSound, { capture: true, passive: true });
document.addEventListener('click', unlockSound, { capture: true });
document.addEventListener('keydown', unlockSound, { capture: true });
$('audioToggle').onclick = () => {
  sound.toggle();
};
$('audioVolume').oninput = (event) => {
  const volume = Number(event.target.value) / 100;
  sound.setVolume(volume);
  sound.unlock();
  if (volume > 0) sound.setMuted(false);
};
let state,
  content,
  registering = false,
  keys = new Set(),
  lastFrame = 0,
  lastSaved = 0,
  moving = false,
  pending = false;
let worldOffset = 0,
  sleepSyncBusy = false,
  lastClockLabel = '';
let sleepSyncAfter = 0;
let seated = null;
let mobileControls;
let leavingForIdle=false;
async function disconnectForIdle(){
  if(leavingForIdle)return;leavingForIdle=true;
  keys.clear();destination=null;mobileControls?.reset();
  try{await fetch('./api/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',keepalive:true,signal:AbortSignal.timeout(3000)});}catch{}
  location.replace('./?idle=1');
}
const idleTracker=createIdleTracker({
  onActivity:()=>fetch('./api/activity',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(async response=>{if(response.status===401)disconnectForIdle();}).catch(()=>{}),
  onIdle:disconnectForIdle,
});
for(const type of ['pointerdown','pointermove','keydown','input','wheel','touchstart','touchmove']){
  document.addEventListener(type,event=>{if(event.isTrusted)idleTracker.activity();},{capture:true,passive:true});
}
setInterval(()=>idleTracker.tick(),1000);
document.addEventListener('visibilitychange',()=>idleTracker.tick());
window.addEventListener('focus',()=>idleTracker.tick());
window.addEventListener('session-idle',disconnectForIdle);
const mobileRendering = matchMedia('(pointer: coarse)').matches;
let lastPanelDraw = 0;
let lastMapDraw = 0;
const isSleeping = () => !!state?.world?.sleep;
function currentCycle() {
  const now = Date.now() + worldOffset;
  const sleep = state.world?.sleep;
  const clockMs = sleep
    ? sleep.fromClockMs +
      (sleep.targetClockMs - sleep.fromClockMs) *
        Math.max(0, Math.min(1, (now - sleep.startedAt) / (sleep.endsAt - sleep.startedAt))) +
      Math.max(0, now - sleep.endsAt)
    : (state.world?.clockMs || 0) + Math.max(0, now - (state.world?.serverNow || now));
  return {
    ...cycleAt(clockMs),
    calendar: calendarAt(clockMs, state.world.startDate),
    clockMs,
    now,
  };
}
function updateWorldClock(cycle) {
  const seconds = Math.ceil(cycle.remainingMs / 1000);
  const countdown = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const label = `${cycle.night ? 'Amanhece' : 'Anoitece'} em ${countdown}`;
  if (label !== lastClockLabel) {
    $('periodCountdown').textContent = label;
    const date = cycle.calendar;
    $('periodName').textContent = `${cycle.night ? 'Noite' : 'Dia'} · ${date.day}`;
    $('periodIcon').textContent = cycle.night ? '☾' : '☀';
    $('worldClock').classList.toggle('night', cycle.night);
    lastClockLabel = label;
  }
  const sleep = state.world?.sleep;
  if($('sleepBanner').hidden!==!sleep)$('sleepBanner').hidden = !sleep;
  for (const id of ['interactBtn', 'editCharacter', 'achievementsBtn', 'sidebarTrophies'])
    if($(id).disabled!==!!sleep)$(id).disabled = !!sleep;
  const period=cycle.night?'night':'day';
  if(canvas.dataset.period!==period)canvas.dataset.period=period;
  if(canvas.dataset.sleeping!==String(!!sleep))canvas.dataset.sleeping=String(!!sleep);
  if (!sleep) return;
  const fraction = Math.min(
    1,
    Math.max(0, (cycle.now - sleep.startedAt) / (sleep.endsAt - sleep.startedAt)),
  );
  const wait = Math.max(
    0,
    (state.career?.nextWorkAt || 0) - cycle.now - sleep.skippedMs * fraction,
  );
  $('sleepBanner').textContent =
    `Zzz · Dormindo · ${label}${state.job ? ` · Trabalho: ${wait > 0 ? Math.ceil(wait / 1000) + 's de espera' : 'disponível ao acordar'}` : ''}`;
  $('interaction').textContent = 'Descansando… o tempo está acelerado.';
  if (cycle.now >= sleep.endsAt && !sleepSyncBusy && Date.now() >= sleepSyncAfter) {
    sleepSyncBusy = true;
    api('state')
      .then((result) => {
        applyState(result.state);
        lastClockLabel = '';
        toast(`Você acordou! Agora é ${result.state.world.night ? 'noite' : 'dia'}.`);
      })
      .catch((error) => toast(error.message))
      .finally(() => {
        sleepSyncBusy = false;
        sleepSyncAfter = Date.now() + 2000;
      });
  }
}
const canvas = $('map'),
  ctx = canvas.getContext('2d'),
  sceneCanvas = document.createElement('canvas');
sceneCanvas.width = 960;
sceneCanvas.height = 640;
const sceneCtx = sceneCanvas.getContext('2d');
const mobileBackground = document.createElement('canvas');
mobileBackground.width = 960;
mobileBackground.height = 640;
const mobileBackgroundCtx = mobileBackground.getContext('2d');
let backgroundKey = '';
let backgroundAt = 0;
let overview = false,
  camera = { x: 0, y: 0, w: 960, h: 640, left: 0, top: 0, width: 960, height: 640 };
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
async function api(route, data) {
  const res = await fetch('./api/' + route, {
    method: data ? 'POST' : 'GET',
    headers: data ? { 'Content-Type': 'application/json' } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await res.json();
  if (!res.ok) {
    const error = new Error(result.error);
    error.details = result;
    throw error;
  }
  return result;
}
function toast(message) {
  const target = $('panel').open ? $('dialogToast') : $('toast');
  target.textContent = message;
  target.classList.add('visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    target.classList.remove('visible');
  }, 4500);
}
async function action(route, data = {}) {
  if (pending) return;
  pending = true;
  try {
    const result = await api(route, data);
    if (result.state) {
      applyState(result.state);
    }
    toast(result.message || 'Pronto!');
    return result;
  } catch (e) {
    toast(e.message);
  } finally {
    pending = false;
  }
}
for(const id of ['password','confirmPassword']){
  const input=$(id),wrap=document.createElement('span'),toggle=document.createElement('button');
  wrap.className='password-field';input.before(wrap);wrap.append(input);
  toggle.type='button';toggle.className='password-toggle';toggle.dataset.passwordToggle=id;
  toggle.setAttribute('aria-controls',id);toggle.setAttribute('aria-pressed','false');
  toggle.setAttribute('aria-label',id==='password'?'Mostrar senha':'Mostrar confirmação de senha');
  toggle.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path class="eye-slash" d="m3 3 18 18"/></svg>';
  toggle.onclick=()=>{
    const visible=input.type==='password';input.type=visible?'text':'password';
    toggle.setAttribute('aria-pressed',String(visible));
    toggle.setAttribute('aria-label',`${visible?'Ocultar':'Mostrar'} ${id==='password'?'senha':'confirmação de senha'}`);
  };
  wrap.append(toggle);
}
function authMode(value) {
  document.querySelectorAll('[data-password-toggle]').forEach(button=>{
    $(button.dataset.passwordToggle).type='password';button.setAttribute('aria-pressed','false');
    button.setAttribute('aria-label',button.dataset.passwordToggle==='password'?'Mostrar senha':'Mostrar confirmação de senha');
  });
  registering = value;
  $('nameField').hidden = !value;
  $('confirmField').hidden = !value;
  $('authName').required = value;
  $('confirmPassword').required = value;
  $('authTitle').textContent = value ? 'Comece sua nova vida.' : 'Sua jornada espera.';
  $('authSubmit').textContent = value ? 'Criar personagem →' : 'Entrar em DevCity →';
  $('loginTab').classList.toggle('active', !value);
  $('registerTab').classList.toggle('active', value);
  $('password').autocomplete = value ? 'new-password' : 'current-password';
  $('authError').textContent = '';
}
$('loginTab').onclick = () => authMode(false);
$('registerTab').onclick = () => authMode(true);
let socialProviders = [];
function socialButtons(container, linking = false) {
  container.innerHTML = `<small>${linking ? 'Vincular à sua conta' : 'Ou continue com'}</small><div>${socialProviders.map((p) => `<button type="button" class="secondary" data-social="${p.id}" ${p.enabled ? '' : 'disabled'} title="${p.enabled ? 'Entrar com ' + p.name : 'Disponível após configurar as credenciais do provedor'}">${p.id === 'google' ? 'G' : p.id === 'facebook' ? 'f' : '●'} · ${p.name}</button>`).join('')}</div>${socialProviders.some((p) => !p.enabled) ? '<small>Os provedores ainda não configurados ficam indisponíveis.</small>' : ''}`;
  container
    .querySelectorAll('[data-social]')
    .forEach(
      (b) => (b.onclick = () => location.assign('./api/auth/' + b.dataset.social + '/start')),
    );
}
api('auth/providers')
  .then((providers) => {
    socialProviders = providers;
    socialButtons($('socialLogins'));
  })
  .catch(() => {});
const authNotice = new URLSearchParams(location.search).get('authError');
if (authNotice) {
  $('authError').textContent = authNotice;
  history.replaceState({}, '', location.pathname);
}
if(new URLSearchParams(location.search).get('idle')==='1'){
  $('authError').textContent='Você foi desconectado após 15 minutos sem atividade. Entre novamente para continuar.';
  history.replaceState({},'',location.pathname);
}
$('authForm').onsubmit = async (event) => {
  event.preventDefault();
  $('authError').textContent = '';
  if (registering && $('password').value !== $('confirmPassword').value) {
    $('authError').textContent = 'As senhas não coincidem.';
    return;
  }
  $('authSubmit').disabled = true;
  try {
    await api(registering ? 'register' : 'login', {
      name: $('authName').value,
      email: $('email').value,
      password: $('password').value,
    });
    await load();
    $('password').value = '';
    $('confirmPassword').value = '';
  } catch (e) {
    $('authError').textContent = e.message;
  } finally {
    $('authSubmit').disabled = false;
  }
};
// Carrega o progresso salvo antes de mostrar o mapa ou habilitar a interação.
async function load() {
  const result = await api('state');
  state = result.state;
  idleTracker.start();
  state.position = safePosition(
    state.position,
    state.completed.includes('exam-javascript-beginner'),
    state.equipped,
  );
  content = result;
  $('auth').hidden = true;
  $('game').hidden = false;
  document.body.classList.add('in-game');
  render();
  online.start();
  competitionUI.refresh();
  canvas.focus();
  mobileControls?.enter();
  if (state.characterSetupCompleted === false) await openCharacterEditor();
}
$('logout').onclick = async () => {
  try {
    await api('logout', {});
    sound.setGame(false);
    location.reload();
  } catch (e) {
    toast(e.message);
  }
};
function render() {
  sound.setGame(true, isSleeping(),state.position.map||'city');
  worldOffset = (state.serverNow || Date.now()) - Date.now();
  $('playerName').textContent = state.name;
  $('jobName').textContent = state.job || 'Futuro desenvolvedor';
  $('level').textContent = String(state.level).padStart(2, '0');
  $('editCharacter').textContent=state.characterSetupCompleted===false?'Criar personagem · Grátis':'Personalizar · US$ '+(CHARACTER_EDIT_COST/100);
  $('editCharacter').title=state.characterSetupCompleted===false?'Primeira configuração gratuita':'US$ 10 a cada abertura, mesmo se fechar sem salvar.';
  $('money').textContent = state.money.toLocaleString('pt-BR');
  $('brlBalance').textContent = 'R$ '+(state.wallets.brl/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  $('usdBalance').textContent = 'US$ '+(state.wallets.usd/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const formatXp = (value) => value.toLocaleString('pt-BR');
  const progress = levelProgress(state.xp);
  const nextLevelXp = progress.next;
  $('xpText').textContent = `${formatXp(state.xp)} XP`;
  $('xpNext').textContent = progress.maxed
    ? 'Nível máximo · 100'
    : `Próximo nível: ${formatXp(nextLevelXp)} XP · faltam ${formatXp(nextLevelXp - state.xp)}`;
  $('xpBar').max = progress.required;
  $('xpBar').value = progress.value;
  $('xpBar').setAttribute(
    'aria-valuetext',
    progress.maxed
      ? `${formatXp(state.xp)} XP acumulados. Nível máximo 100.`
      : `${formatXp(state.xp)} XP acumulados. Faltam ${nextLevelXp - state.xp} XP para o próximo nível.`,
  );
  $('streak').textContent = state.streak;
  drawPortrait($('playerPortrait').getContext('2d'), state);
  $('sidebarTrophies').innerHTML = state.achievements.length
    ? state.achievements
        .map((id) => {
          const a = content.achievements.find((a) => a.id === id);
          return `<img src="${a.image}" alt="${escape(a.title)}" title="${escape(a.title)}">`;
        })
        .join('')
    : '<small>Seus troféus aparecerão aqui</small>';
  $('skills').innerHTML = Object.entries(state.skills)
    .map(
      ([name, value]) =>
        `<div class="skill" data-area="${name}"><div><span>${name}</span><span>${value}/100</span></div><progress value="${value}" max="100"></progress></div>`,
    )
    .join('');
  $('nextStep').textContent =
    state.xp < 150 || state.skills.HTML < 3
      ? 'Estude HTML na escola para conquistar 150 XP e se candidatar ao estágio.'
      : !state.job
        ? 'Procure o recrutador da TechSoft e faça sua primeira avaliação.'
        : state.career.needsAssessment
          ? 'Trabalhos do cargo concluídos. Procure o recrutador para a próxima avaliação.'
          : state.career.completed === 150
            ? 'Carreira completa! Termine as provas da escola e personalize sua casa.'
            : 'Corrija bugs no terminal da empresa, estude durante os intervalos e avance na carreira.';
  if(state.access?.usa)$('nextStep').textContent='Estados Unidos liberados! Visite o Full Stack Lab e a loja premium.';
  else if(state.access?.downtown)$('nextStep').textContent='O centro está aberto pela rua da praça. Envie um projeto no Estádio de Competição antes de fazer as provas avançadas e as quatro provas do DevClub.';
  else if(state.access?.plaza)$('nextStep').textContent='Na praça, siga a rua até a passagem CENTRO. Leia os três livros da biblioteca antes das provas intermediárias. A última prova libera o acesso.';
  else if(state.completed.includes('school-javascript-beginner-10'))$('nextStep').textContent='Passe na prova de JavaScript iniciante para abrir a Praça.';
  draw();
}
// Abrir um menu interrompe a caminhada para o personagem não continuar andando atrás dele.
function panel(tag, html) {
  mobileControls?.reset();
  keys.clear();
  destination = null;
  walking = false;
  savePosition();
  if ($('panelTag').textContent !== tag) $('dialogToast').classList.remove('visible');
  $('panelTag').textContent = tag;
  $('panel').classList.toggle('reading-mode', tag === 'BIBLIOTECA · SALA DE LEITURA');
  $('panel').classList.toggle('npc-chat-dialog', tag.startsWith('CONVERSA · '));
  $('panel').classList.toggle('tutorial-dialog', tag === 'TUTORIAL · SUA JORNADA');
  $('panelBody').innerHTML = html;
  $('panel').scrollTop = 0;
  if (!$('panel').open) $('panel').showModal();
}
$('closePanel').onclick = () => {
  if (state?.characterSetupCompleted === false) return toast('Salve seu personagem para começar.');
  $('panel').close();
};
$('panel').addEventListener('cancel', event => {
  if (state?.characterSetupCompleted === false) event.preventDefault();
});
$('panel').addEventListener('close', () => canvas.focus());
function school(area, stage) {
  schoolUI.school(area, stage);
}

function mission(l) {
  learning.open(l);
}
function office(mode) {
  careerUI.office(mode);
}
function shop() {
  inventory.shop();
}
function house() {
  inventory.house();
}
function trophies() {
  const available = content.achievements.filter(
    (a) => !a.legacy || state.achievements.includes(a.id),
  );
  panel(
    'CONQUISTAS · CADA PASSO CONTA',
    `<h2>Seu mural de conquistas.</h2><p>${state.achievements.length} / ${available.length} conquistas desbloqueadas</p><div class="cards">${available.map((a) => `<article class="card trophy-card ${state.achievements.includes(a.id) ? 'unlocked' : 'locked'}"><img src="${a.image}" alt="Troféu ${escape(a.title)}"><small>${state.achievements.includes(a.id) ? '✓' + ' DESBLOQUEADA' : '🔒 EM PROGRESSO'}</small><h3>${a.title}</h3><p>${a.description}</p></article>`).join('')}</div>`,
  );
}
let characterOpening=false;
function confirmCharacterCost(){
  keys.clear();destination=null;walking=false;
  const dialog=document.createElement('dialog');
  dialog.id='characterCostDialog';dialog.className='character-cost-dialog';
  dialog.setAttribute('aria-labelledby','characterCostTitle');
  dialog.setAttribute('aria-describedby','characterCostDescription');
  dialog.innerHTML='<div class="eyebrow">PERSONALIZAÇÃO</div><h2 id="characterCostTitle">Deseja gastar US$ 10 para personalizar?</h2><p id="characterCostDescription">O valor será descontado ao abrir, mesmo se fechar sem salvar.</p><div class="character-cost-actions"><button class="secondary" data-choice="cancel">Cancelar</button><button class="primary" data-choice="confirm">Sim, gastar US$ 10</button></div>';
  document.body.append(dialog);
  return new Promise(resolve=>{
    dialog.addEventListener('close',()=>{const confirmed=dialog.returnValue==='confirm';dialog.remove();$('editCharacter').focus();resolve(confirmed)},{once:true});
    dialog.querySelectorAll('[data-choice]').forEach(button=>button.onclick=()=>dialog.close(button.dataset.choice));
    dialog.showModal();dialog.querySelector('[data-choice="cancel"]').focus();
  });
}
async function openCharacterEditor(){
  if(characterOpening||!state||isSleeping())return;
  characterOpening=true;
  try{
    if(state.characterSetupCompleted!==false&&!await confirmCharacterCost())return;
    await savePosition();const result=await action('character-open');if(result)character(result.editorToken,result.cost);
  }
  finally{characterOpening=false;}
}
function character(editorToken,cost) {
  let skin = state.skin,
    shirt = state.shirt,
    pants = state.pants || '#ffffff',
    hairstyle = state.hairstyle || 'short',
    gender = state.gender || 'male',
    hair = state.hair;
  panel(
    'SEU PERSONAGEM',
    `<h2>Quem vai explorar DevCity?</h2><p class="character-fee">${cost?'US$ 10 pagos nesta abertura. Salvar não cobra novamente.':'Configuração inicial gratuita. Próximas aberturas custam US$ 10.'}</p><div class="character-form"><canvas id="characterPreview" width="128" height="128"></canvas><label>Personagem<div class="gender-choices"><button id="genderMale" type="button" aria-label="Homem">Homem</button><button id="genderFemale" type="button" aria-label="Mulher">Mulher</button></div></label><label>Nome<input id="charName" maxlength="24" minlength="2" value="${escape(state.name)}"></label><label>Tom de pele<div id="skinColors" class="swatches"></div></label><label>Cor do cabelo<div id="hairColors" class="swatches hair-swatches"></div></label><label>Camiseta inicial<div id="shirtColors" class="swatches"></div></label><button id="saveCharacter" class="primary">Salvar e explorar →</button></div>`,
  );
  const preview = () => {
    drawPortrait($('characterPreview').getContext('2d'), {
      ...state,
      skin,
      shirt,
      pants,
      hairstyle,
      gender,
      hair,
      equipped: state.equipped.filter(
        (id) =>
          !['shirt', 'pants', 'hairstyle'].includes(content.items.find((i) => i.id === id)?.slot),
      ),
    });
    $('genderMale').classList.toggle('selected', gender === 'male');
    $('genderFemale').classList.toggle('selected', gender === 'female');
    $('genderMale').setAttribute('aria-pressed', gender === 'male');
    $('genderFemale').setAttribute('aria-pressed', gender === 'female');
  };
  $('genderMale').onclick = () => {
    gender = 'male';
    preview();
  };
  $('genderFemale').onclick = () => {
    gender = 'female';
    preview();
  };
  preview();
  const swatches = (id, colors, current, set) => {
    colors.forEach((color) => {
      const b = document.createElement('button');
      b.style.background = color;
      b.ariaLabel = color;
      b.classList.toggle('selected', color === current);
      b.onclick = () => {
        set(color);
        preview();
        for (const other of $(id).children) other.classList.remove('selected');
        b.classList.add('selected');
      };
      $(id).append(b);
    });
  };
  swatches(
    'hairColors',
    content.hairColors.map((h) => h.color),
    hair,
    (v) => (hair = v),
  );
  for (const b of $('hairColors').children) {
    const h = content.hairColors.find(
      (h) => h.color === b.style.background || h.color === b.getAttribute('aria-label'),
    );
    if (h) {
      b.ariaLabel = h.name;
      b.title = h.name;
    }
  }
  swatches('skinColors', ['#dba47b', '#8d5524', '#f1c6a8'], skin, (v) => (skin = v));
  swatches('shirtColors', ['#ffffff', '#18181b'], shirt, (v) => (shirt = v));
  const pantsLabel = document.createElement('label');
  pantsLabel.innerHTML = 'Calça inicial<div id="pantsColors" class="swatches"></div>';
  const hairLabel = document.createElement('label');
  hairLabel.innerHTML = `Penteado<select id="hairStyle">${content.hairstyles.map((h) => `<option value="${h.id}" ${h.id === hairstyle ? 'selected' : ''}>${h.name}</option>`).join('')}</select>`;
  $('saveCharacter').before(pantsLabel, hairLabel);
  const socialSection = document.createElement('div');
  socialSection.className = 'social-logins';
  $('saveCharacter').after(socialSection);
  socialButtons(socialSection, true);
  swatches('pantsColors', ['#ffffff', '#18181b'], pants, (v) => (pants = v));
  $('hairStyle').onchange = (e) => {
    hairstyle = e.target.value;
    preview();
  };
  $('saveCharacter').onclick = async () => {
    const name = $('charName').value.trim();
    if (name.length < 2) {
      toast('Escolha um nome com pelo menos 2 caracteres.');
      return;
    }
    if (await action('character', { name, skin, shirt, pants, hairstyle, gender, hair,editorToken }))
      $('panel').close();
  };
}
const celebration = createCelebration({ getContent: () => content, onView: trophies });
// Compara as conquistas antes de substituir o estado; só as novas entram na celebração.
function applyState(next) {
  const opened = newlyUnlockedRegions(state,next);
  const fresh = next.achievements.filter((id) => !state.achievements.includes(id));
  state = { ...next, position: state.position };
  render();
  if(opened.length)celebrateGate(opened,()=>celebration.enqueue(fresh));
  else if(fresh.length)celebration.enqueue(fresh);
  return opened.length>0;
}
function celebrateGate(regions,onDone) {
  const region=regions[0],route=regionTours[region];
  keys.clear();
  destination = null;
  walking = false;
  gateStarted = performance.now();
  $('panel').close();
  const dialog = document.createElement('dialog');
  dialog.id = 'gateCelebration';
  dialog.className = 'gate-celebration';
  dialog.innerHTML =
    `<div class="eyebrow">UM NOVO CAMINHO PARA EXPLORAR</div><h2>${route.title}</h2><canvas width="780" height="420" aria-label="Passeio pela estrada até a nova região"></canvas><button class="primary">Continuar explorando →</button>`;
  document.body.append(dialog);
  dialog.showModal();
  const art = dialog.querySelector('canvas'),
    buffer = document.createElement('canvas');
  buffer.width = 960;
  buffer.height = 640;
  const started = performance.now();
  function frame(now) {
    if (!dialog.open) return;
    const camera=tourCamera(region,now-started),tourState={...state,position:{map:camera.map,x:480,y:420}};
    const options={time:now,hidePlayer:true,npcs:npcSimulation.actors(camera.map,npcClock()),competitionWinner:competitionUI.winner()};
    if(camera.map==='city')drawWorld(buffer.getContext('2d'),tourState,buildings,options);
    else if(camera.map==='plaza')drawPlaza(buffer.getContext('2d'),tourState,options);
    else drawRegionalWorld(buffer.getContext('2d'),tourState,options);
    const context=art.getContext('2d');context.fillStyle='#102330';context.fillRect(0,0,780,420);context.globalAlpha=camera.alpha;
    context.drawImage(buffer,camera.x,camera.y,660,360,0,0,780,420);context.globalAlpha=1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  dialog.querySelector('button').onclick = () => dialog.close();
  dialog.addEventListener(
    'close',
    () => {
      gateStarted = 0;
      dialog.remove();
      if(regions.length>1)celebrateGate(regions.slice(1),onDone);
      else onDone();
    },
    { once: true },
  );
  setTimeout(() => {
    if (dialog.open) dialog.close();
  }, 5600);
}
const learning = createLearning({
  getState: () => state,
  getContent: () => content,
  api,
  applyState,
  showPanel: panel,
  school,
  office,
  openProject: (l) => schoolUI.openExam(l),
});
const schoolUI = createSchool({
  getState: () => state,
  getContent: () => content,
  showPanel: panel,
  openExercise: (l) => learning.open(l),
  api,
  applyState,
});
const expansion = createExpansion({getState:()=>state,getContent:()=>content,api,applyState,showPanel:panel,transition});
const routesButton=document.createElement('button');routesButton.id='travelRoutes';routesButton.className='secondary';routesButton.textContent='📖 Tutorial';document.getElementById('achievementsBtn').parentElement.append(routesButton);
routesButton.onclick=()=>{
  if(!state||isSleeping())return;
  const access=accessFor(state);
  panel('TUTORIAL · SUA JORNADA', tutorialHTML(access));
};
const dollarButton=document.createElement('button');dollarButton.id='dollarShop';dollarButton.className='secondary';dollarButton.textContent='💚 Doação';dollarButton.title='Apoie o aprendizado online';document.getElementById('achievementsBtn').parentElement.append(dollarButton);dollarButton.onclick=()=>{if(!isSleeping())expansion.packages()};
const library = createLibrary({
  getState: () => state,
  getContent: () => content,
  api,
  applyState,
  showPanel: panel,
});
const careerUI = createCareer({
  getState: () => state,
  getContent: () => content,
  showPanel: panel,
  action,
  openExercise: (l, mode) => learning.open(l, mode),
});
const inventory = createInventory({
  getState: () => state,
  getContent: () => content,
  action,
  showPanel: panel,
  notebook: () => learning.notebook(),
});
async function toggleVehicle(){
  keys.clear();destination=null;walking=false;seated=null;
  await savePosition();
  return action('vehicle',{active:!state.activeVehicle});
}
function toggleLaptop(){
 if(state.activeVehicle)return toast('Desça do veículo com V antes de pegar o notebook.');
 const laptop=chosenLaptop(state);if(!laptop)return toast('Compre um notebook na Loja Do Centro ou na loja de USA.');
 keys.clear();destination=null;walking=false;return action('equip',{id:laptop.id});
}
function openNotebook(){
 if(!state||isSleeping())return;
 if(state.activeVehicle)return toast('Desça do veículo para usar o notebook.');
 if(!heldLaptop(state))return toast('Pressione B para colocar seu notebook nas mãos.');
 keys.clear();destination=null;walking=false;learning.notebook();
}
const playerInventory=createPlayerInventory({getState:()=>state,getContent:()=>content,action,showPanel:panel,toggleVehicle,openHome:house,openNotebook});
const inventoryButton=document.createElement('button');inventoryButton.id='playerInventoryButton';inventoryButton.className='secondary';inventoryButton.textContent='🎒 Inventário · I';inventoryButton.onclick=()=>{if(state&&!isSleeping())playerInventory.open()};document.getElementById('editCharacter').after(inventoryButton);
$('editCharacter').onclick = openCharacterEditor;
$('achievementsBtn').onclick = trophies;
$('sidebarTrophies').onclick = trophies;

let walkPhase = 0,
  gateStarted = 0,
  facing = 'down',
  destination = null,
  transitionUntil = 0,
  walking = false;
const scene = () => state.position.map || 'city';
const npcSimulation=createNpcSimulation();
const online=createOnline({getState:()=>state,getMotion:()=>({direction:facing,walking,seated}),onOpen:()=>{keys.clear();destination=null;walking=false}});
const competitionUI=createCompetitionUI({getState:()=>state,getAccountId:()=>content?.accountId,api,showPanel:panel,refreshState:()=>api('state').then(result=>applyState(result.state)).catch(()=>{})});
const trafficSimulation=createTrafficSimulation();
const npcClock=()=>Math.max(0,Date.now()+worldOffset-(state?.npcWorldStartedAt||Date.now()));
const community=()=>outdoor(scene())?npcSimulation.actors(scene(),npcClock()):[];
const npcDialogue=createNpcDialogue({getState:()=>state,showPanel:panel,onEnd:id=>npcSimulation.resume(id,npcClock())});

// O cenário usa uma base de 960 × 640. A câmera recorta essa base sem esticar a arte.
function draw() {
  if (!state) return;
  competitionUI.tick();
  const heading = document.querySelector('.world-heading h1');
  const title =
    scene() === 'downtown' ? 'Centro · DevCity ✦' : scene()==='stadium'?'Estádio de Competição ✦':scene()==='usa' ? 'Estados Unidos · Full Stack ✦' : scene() === 'devclub' ? 'DevClub · Comunidade ✦' : scene() === 'plaza'
      ? 'Praça · Jardim do Saber ✦'
      : scene() === 'library'
        ? 'Biblioteca · Jardim do Saber ✦'
        : 'Bem-vindo a DevCity ✦';
  if (heading.textContent !== title) heading.textContent = title;
  const cycle = currentCycle();
  const nightStrength = cycle.night
    ? 0.6 + 0.4 * Math.min(1, (PHASE_MS - cycle.remainingMs) / 15000, cycle.remainingMs / 15000)
    : 0;
  const animation = {
    lowPower: mobileRendering,
    time: lastFrame,
    npcs:community(),
    players:online.actors(scene()),
    competitionWinner:competitionUI.winner(),
    walk: walking ? walkPhase : 0,
    direction: facing,
    sleeping: isSleeping(),
    seated,
  };
  animation.traffic=trafficSimulation.vehicles(scene(),lastFrame,[...animation.npcs,...animation.players.map(p=>p.position),{...state.position,vehicle:!!state.activeVehicle}]);
  const paintScene = (options) => {
    if (scene() === 'city') drawWorld(sceneCtx, state, buildings, options);
    else if (scene() === 'plaza') drawPlaza(sceneCtx, state, options);
    else if(['downtown','usa'].includes(scene()))drawRegionalWorld(sceneCtx,state,options);
    else drawInterior(sceneCtx, state, options);
  };
  if (mobileRendering && !outdoor(scene()) && !animation.sleeping && !gateStarted) {
    const key = `${scene()}|${state.equipped.join(',')}|${state.completed.join(',')}|${animation.competitionWinner?.entry_id??'no-champion'}`;
    if (key !== backgroundKey || lastFrame - backgroundAt > 1000) {
      paintScene({ ...animation, hidePlayer: true,hideNpcs:true });
      mobileBackgroundCtx.clearRect(0, 0, 960, 640);
      mobileBackgroundCtx.drawImage(sceneCanvas, 0, 0);
      backgroundKey = key;
      backgroundAt = lastFrame;
    }
    sceneCtx.clearRect(0, 0, 960, 640);
    sceneCtx.drawImage(mobileBackground, 0, 0);
    drawAvatar(sceneCtx, state, animation);
  } else paintScene(animation);
  drawLighting(sceneCtx, scene(), sceneBuildings(scene()), nightStrength, mobileRendering);
  updateWorldClock(cycle);
  const scale = overview
    ? Math.min(canvas.width / 960, canvas.height / 640)
    : Math.max(canvas.width / 960, canvas.height / 640);
  const w = Math.min(960, canvas.width / scale),
    h = Math.min(640, canvas.height / scale);
  const cameraPosition = animation.sleeping ? { x: 308, y: 415 } : state.position;
  const px = outdoor(scene()) ? cameraPosition.x : (cameraPosition.x - 480) * 1.3 + 480,
    py = outdoor(scene()) ? cameraPosition.y : (cameraPosition.y - 330) * 1.3 + 330;
  camera = {
    x: Math.max(0, Math.min(960 - w, px - w / 2)),
    y: Math.max(0, Math.min(640 - h, py - h / 2)),
    w,
    h,
    left: (canvas.width - w * scale) / 2,
    top: (canvas.height - h * scale) / 2,
    width: w * scale,
    height: h * scale,
  };
  ctx.fillStyle = '#142630';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    sceneCanvas,
    camera.x,
    camera.y,
    w,
    h,
    camera.left,
    camera.top,
    camera.width,
    camera.height,
  );
  const mapX = String(Math.round(state.position.x));
  const mapY = String(Math.round(state.position.y));
  if (canvas.dataset.x !== mapX) canvas.dataset.x = mapX;
  if (canvas.dataset.y !== mapY) canvas.dataset.y = mapY;
  if (canvas.dataset.scene !== scene()) {
    canvas.dataset.scene = scene();
    canvas.setAttribute('aria-label', `${outdoor(scene()) ? (scene() === 'city' ? 'Mapa de DevCity' : scene()==='downtown'?'Centro de DevCity':scene()==='usa'?'Estados Unidos':'Praça Jardim do Saber') : 'Interior: ' + allBuildings.find((b) => b.id === scene())?.name || scene()}. WASD ou setas para andar, E para interagir.`);
  }
  for(const [key,value] of Object.entries({direction:facing,vehicle:activeVehicle(state)?.id||'',laptop:heldLaptop(state)?.id||'',seated:String(!!seated),npcCount:String(animation.npcs.length),playerCount:String(animation.players.length)})){
    if(canvas.dataset[key]!==value)canvas.dataset[key]=value;
  }
}
async function savePosition() {
  if (!state) return;
  try {
    await api('position', state.position);
  } catch (e) {
    toast(e.message);
  }
}
function transition(position) {
  seated = null;
  keys.clear();
  destination = null;
  walking = false;
  state.position = position;
  online.publish();
  sound.setGame(true,isSleeping(),position.map||'city');
  if(!onRoad(position))state.activeVehicle=null;
  transitionUntil = performance.now() + 650;
  document.querySelector('.canvas-wrap').classList.remove('scene-enter');
  void canvas.offsetWidth;
  document.querySelector('.canvas-wrap').classList.add('scene-enter');
  savePosition();
  draw();
  canvas.focus();
}
function enter(b) {
  transition({ x: 480, y: 485, map: b.id });
  toast(`${b.name} · Aproxime-se de um objeto ou pessoa e pressione E.`);
}
function leave() {
  const b = allBuildings.find((b) => b.id === scene());
  transition({
    x: b.x + b.w / 2,
    y: b.entrance==='north'?b.y-15:Math.min(618, b.y + b.h + 34),
    map: b.id === 'library' ? 'plaza' : ['city-office','city-shop','devclub','stadium'].includes(b.id)?'downtown':['us-office','us-shop'].includes(b.id)?'usa':'city',
  });
}
function interact() {
  if (
    !state ||
    online.typing() ||
    isSleeping() ||
    $('panel').open ||
    $('gateCelebration')?.open ||
    $('achievementCelebration').open ||
    performance.now() < transitionUntil
  )
    return;
  if (seated) {
    seated = null;
    return;
  }
  const neighbor=nearbyNpc(community(),state.position);
  if(neighbor&&!doorAt(state.position,scene())&&!travelPassage(state.position)){
    if(state.activeVehicle){toast('Desça do veículo com V para conversar.');return;}
    npcSimulation.pause(neighbor.id,npcClock());npcDialogue.open(neighbor);return;
  }
  const seat = seatAt(state.position, scene());
  if (seat) {
    seated = seat;
    keys.clear();
    destination = null;
    walking = false;
    return;
  }
  if (outdoor(scene())) {
    const passage=travelPassage(state.position);
    if(passage){
      if(!passage.access||accessFor(state)[passage.access])transition(passage.destination);
      else toast(passage.access==='usa'?'Envie um projeto na competição antes de fazer as provas avançadas e as quatro provas do DevClub.':passage.access==='downtown'?'Conclua as leituras da biblioteca antes das provas intermediárias de HTML, CSS e JavaScript.':'Conclua a prova de JavaScript iniciante.');
      return;
    }
    const b = doorAt(state.position, scene());
    if (b) enter(b);
    return;
  }
  if (exitAt(state.position)) {
    leave();
    return;
  }
  const s = scene()==='house'&&state.isCompetitionAdmin&&Math.abs(state.position.x-452)<65&&state.position.y>=405&&state.position.y<=445?adminStation:stationAt(state.position, scene());
  if (!s) {
    toast('Aproxime-se do objeto ou da pessoa para interagir.');
    return;
  }
  destination = null;
  switch (s.id) {
    case 'competition-computer':savePosition().then(()=>competitionUI.open());break;
    case 'competition-admin':savePosition().then(()=>competitionUI.admin());break;
    case 'node-computer':expansion.club('node');break;
    case 'react-computer':expansion.club('react');break;
    case 'ts-front-computer':expansion.club('ts-front');break;
    case 'ts-back-computer':expansion.club('ts-back');break;
    case 'city-terminal':expansion.office('downtown');break;
    case 'us-terminal':expansion.office('usa');break;
    case 'city-counter':expansion.shop('downtown');break;
    case 'us-counter':expansion.shop('usa');break;
    case 'bed':
      keys.clear();
      destination = null;
      walking = false;
      savePosition().then(() => action('sleep'));
      break;
    case 'library-computer':
      library.open();
      break;
    case 'notebook':
      learning.notebook();
      break;
    case 'wardrobe':
      house();
      break;
    case 'teacher':
      school();
      break;
    case 'terminal':
      if (state.job) office('terminal');
      else toast('Fale com o recrutador antes de usar o terminal.');
      break;
    case 'recruiter':
      office('recruiter');
      break;
    case 'counter':
      shop();
      break;
  }
}
document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if(online.typing())return;
  if($('characterCostDialog')?.open)return;
  if(e.ctrlKey||e.metaKey||e.altKey||e.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
  if(key==='i'&&state&&!isSleeping()&&!$('achievementCelebration').open&&!$('gateCelebration')?.open){
    if(e.repeat)return;
    e.preventDefault();
    if($('panel').open){if($('panelTag').textContent==='INVENTÁRIO · PERSONAGEM')$('panel').close();}
    else playerInventory.open();
    return;
  }
  if (
    !state ||
    isSleeping() ||
    $('panel').open ||
    $('gateCelebration')?.open ||
    $('achievementCelebration').open ||
    ['INPUT', 'TEXTAREA'].includes(e.target.tagName)
  )
    return;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'e','v','b','n'].includes(key))
    e.preventDefault();
  if(key==='b'){if(!e.repeat)toggleLaptop();return;}
  if(key==='n'){if(!e.repeat)openNotebook();return;}
  if(key==='v'){if(!e.repeat)toggleVehicle();return;}
  if (key === 'e') {
    if (!e.repeat) interact();
    return;
  }
  keys.add(key);
  destination = null;
});
document.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => {
  keys.clear();
  destination = null;
});
// Converte o clique da tela para o recorte da câmera e depois para as coordenadas da sala.
canvas.addEventListener('click', (e) => {
  if (!state || isSleeping() || online.typing() || $('panel').open || $('gateCelebration')?.open) return;
  const box = canvas.getBoundingClientRect();
  const sx = ((e.clientX - box.left) * canvas.width) / box.width,
    sy = ((e.clientY - box.top) * canvas.height) / box.height;
  if (
    sx < camera.left ||
    sy < camera.top ||
    sx > camera.left + camera.width ||
    sy > camera.top + camera.height
  )
    return;
  let x = camera.x + ((sx - camera.left) * camera.w) / camera.width,
    y = camera.y + ((sy - camera.top) * camera.h) / camera.height;
  if (!outdoor(scene())) {
    x = (x - 480) / 1.3 + 480;
    y = (y - 330) / 1.3 + 330;
  }
  destination = { x, y };
  canvas.focus();
});
$('interactBtn').onclick = interact;
// Limita o passo de tempo para evitar saltos grandes ao voltar de uma aba em segundo plano.
function frame(time) {
  // Evita desenhar o cenário 60–120 vezes por segundo em telas de celular.
  if (document.hidden) {
    requestAnimationFrame(frame);
    return;
  }
  const dt = Math.min((time - lastFrame) / 1000, 0.25);
  lastFrame = time;
  if (
    state &&
    !isSleeping() &&
    !online.typing() &&
    !$('panel').open &&
    !$('gateCelebration')?.open &&
    !$('achievementCelebration').open &&
    time >= transitionUntil
  ) {
    let dx =
        (keys.has('d') || keys.has('arrowright') ? 1 : 0) -
        (keys.has('a') || keys.has('arrowleft') ? 1 : 0),
      dy =
        (keys.has('s') || keys.has('arrowdown') ? 1 : 0) -
        (keys.has('w') || keys.has('arrowup') ? 1 : 0);
    let speed = outdoor(scene()) ? 65 : 60;
    const touchVector=mobileControls?.vector();
    const usingTouch=touchVector&&(touchVector.x||touchVector.y);
    if(usingTouch){dx=touchVector.x;dy=touchVector.y;}
    const vehicle=activeVehicle(state);
    if(vehicle){
      const premium=vehicle.region==='usa';
      speed=vehicle.baseId==='car'?(premium?150:100):(premium?140:95);
    }
    if(usingTouch)speed*=Math.min(1,Math.hypot(dx,dy));
    if (seated && (dx || dy || destination)) seated = null;
    if (destination) {
      dx = destination.x - state.position.x;
      dy = destination.y - state.position.y;
      if (Math.hypot(dx, dy) < 4) {
        destination = null;
        dx = dy = 0;
      } else speed = Math.min(speed, Math.hypot(dx, dy) / Math.max(dt, 0.001));
    }
    walking = !!(dx || dy);
    if (walking) {
      idleTracker.activity();
      const norm = Math.hypot(dx, dy);
      const previous = state.position;
      state.position = move(
        previous,
        (dx / norm) * speed * dt,
        (dy / norm) * speed * dt,
        scene(),
        state.completed.includes('exam-javascript-beginner'),
        state.equipped,
        state.isCompetitionAdmin,
      );
      if(state.activeVehicle&&!onRoad(state.position))state.activeVehicle=null;
      if (
        destination &&
        Math.hypot(previous.x - state.position.x, previous.y - state.position.y) < 0.05
      )
        destination = null;
      moving = true;
      walkPhase += dt * 12;
      facing = movementDirection(state.position.x-previous.x,state.position.y-previous.y,facing);
      if (outdoor(scene())) {
        const passage=travelPassage(state.position);
        if(passage&&(state.position.x>930||state.position.x<28)){
          if(!passage.access||accessFor(state)[passage.access])transition(passage.destination);
          else {state.position.x=state.position.x>930?925:32;toast(passage.access==='usa'?'Conclua as provas avançadas e as quatro provas do DevClub. Envie um projeto na competição para poder fazer as provas.':'Conclua as provas intermediárias e todas as leituras da biblioteca.');}
        }else{
          const b=doorAt(state.position,scene());
          if(b&&b.id!=='house'&&b.entrance!=='north'&&dy<0&&state.position.y<b.y+b.h+16)enter(b);
        }
      } else if (exitAt(state.position) && dy > 0) leave();
    } else if (moving && time - lastSaved > 1000) {
      moving = false;
      walkPhase = 0;
      lastSaved = time;
      savePosition();
    }
    if(!document.body.classList.contains('touch-game')){
    const s = outdoor(scene())
      ? doorAt(state.position, scene())
      : scene()==='house'&&state.isCompetitionAdmin&&Math.abs(state.position.x-452)<65&&state.position.y>=405&&state.position.y<=445?adminStation:stationAt(state.position, scene());
    const sleepWait =
      s?.id === 'bed'
        ? Math.ceil(
            Math.max(0, (state.world.nextSleepClockMs || 0) - currentCycle().clockMs) / 1000,
          )
        : 0;
    const neighborHint=nearbyNpc(community(),state.position);
    const passageHint=travelPassage(state.position);
    $('interaction').textContent = neighborHint&&!state.activeVehicle&&!passageHint&&!(outdoor(scene())&&s)
      ? `E · Conversar com ${neighborHint.name}`
      : passageHint
      ? `${passageHint.label}${passageHint.access&&!accessFor(state)[passageHint.access]?' · Bloqueado':''}`
      : seated
      ? 'E · Levantar'
      : seatAt(state.position, scene())
        ? 'E · Sentar'
        : outdoor(scene())
          ? s
            ? `E · Entrar em ${s.name}`
            : state.activeVehicle?'V · Descer do veículo · I · Inventário':'WASD / setas · I · Inventário · V · Veículo · B · Equipar notebook · N · Abrir sistema do notebook'
          : exitAt(state.position)
            ? '↓ Voltar à cidade'
            : s
              ? sleepWait > 0
                ? `Você já descansou · Cama disponível em ${String(Math.floor(sleepWait / 60)).padStart(2, '0')}:${String(sleepWait % 60).padStart(2, '0')}`
                : s.label
              : state.activeVehicle?'V · Descer do veículo · I · Inventário':'WASD / setas · E · Interagir · I · Inventário · V · Veículo · B · Equipar notebook · N · Abrir sistema do notebook';
    }
  }
  if (state) {
    if ((!mobileRendering || time-lastMapDraw>=1000/30-1) && (!$('panel').open || time - lastPanelDraw >= 1000)) {
      draw();
      lastMapDraw = time;
      lastPanelDraw = time;
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.addEventListener('visibilitychange', () => {
  lastFrame = performance.now();
  sound.setVisible(!document.hidden);
  if (document.hidden && state) {
    keys.clear();
    destination = null;
    fetch('./api/position', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.position),
      keepalive: true,
    }).catch(() => {});
  }
});
window.addEventListener('pagehide', () => sound.setVisible(false));
window.addEventListener('pageshow', () => sound.setVisible(!document.hidden));
mobileControls=createMobileControls({
  canMove:()=>!!state&&!isSleeping()&&!online.typing()&&!document.querySelector('dialog[open]')&&!document.body.classList.contains('touch-menu-open'),
  onMoveStart:()=>{keys.clear();destination=null;},
  interact,inventory:()=>playerInventory.open(),vehicle:toggleVehicle,laptop:toggleLaptop,notebook:openNotebook,
});
load().catch(() => {});

// O canvas usa o espaço restante entre o título e o rodapé, respeitando a densidade da tela.
const fitMap = () => {
  const world = document.querySelector('.world'),
    heading = document.querySelector('.world-heading'),
    footer = document.querySelector('.world-footer'),
    wrap = document.querySelector('.canvas-wrap');
  if (!world.clientHeight) return;
  const rotate = document.querySelector('.touch-rotate');
  const height = Math.max(1, world.clientHeight - heading.offsetHeight - footer.offsetHeight - (rotate?.offsetHeight || 0) - 12);
  wrap.style.width = world.clientWidth + 'px';
  wrap.style.height = height + 'px';
  const ratio = Math.min(devicePixelRatio || 1, mobileRendering ? 1 : 2);
  canvas.width = Math.max(1, Math.round((world.clientWidth - 2) * ratio));
  canvas.height = Math.max(1, Math.round((height - 2) * ratio));
  draw();
};
new ResizeObserver(fitMap).observe(document.querySelector('.world'));
$('mapView').onclick = () => {
  overview = !overview;
  $('mapView').textContent = overview ? '◎ Acompanhar personagem' : '⊞ Ver mapa inteiro';
  $('mapView').setAttribute('aria-pressed', overview);
  draw();
};
