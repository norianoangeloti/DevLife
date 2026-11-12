// Controles de toque compartilham o mesmo movimento e as mesmas ações do teclado.
export function createMobileControls({canMove,onMoveStart,interact,inventory,vehicle,laptop,notebook}) {
  const media=matchMedia('(pointer: coarse) and (max-width: 1100px)');
  const body=document.body,wrap=document.querySelector('.canvas-wrap'),profile=document.querySelector('.profile');
  let vector={x:0,y:0},pointer=null;
  const controls=document.createElement('div');controls.className='touch-controls';
  controls.innerHTML='<div id="touchJoystick" class="touch-joystick" role="group" aria-label="Analógico de movimento: arraste para andar"><span class="touch-joystick-ring"></span><span class="touch-stick"></span></div><div class="touch-actions"><button type="button" data-touch="inventory" aria-label="Abrir inventário">🎒<small>Itens</small></button><button type="button" data-touch="vehicle" aria-label="Entrar ou sair do veículo">V<small>Veículo</small></button><button type="button" data-touch="laptop" aria-label="Equipar ou guardar notebook">B<small>Equipar</small></button><button type="button" data-touch="notebook" aria-label="Abrir sistema do notebook equipado">N<small>Notebook</small></button></div>';
  wrap.append(controls);
  const joystick=controls.querySelector('.touch-joystick'),stick=controls.querySelector('.touch-stick');
  const reset=()=>{vector={x:0,y:0};pointer=null;stick.style.transform='translate(0,0)';joystick.classList.remove('is-active');};
  const update=event=>{
    if(event.pointerId!==pointer)return;
    if(!canMove()){reset();return;}
    const box=joystick.getBoundingClientRect(),radius=box.width*.32;
    const dx=event.clientX-box.left-box.width/2,dy=event.clientY-box.top-box.height/2;
    const distance=Math.hypot(dx,dy),clamp=Math.min(1,radius/(distance||1));
    stick.style.transform=`translate(${dx*clamp}px,${dy*clamp}px)`;
    const strength=Math.min(1,Math.max(0,(distance/radius-.14)/.86));
    vector={x:distance?dx/distance*strength:0,y:distance?dy/distance*strength:0};
  };
  joystick.addEventListener('pointerdown',event=>{
    if(pointer!==null||!canMove())return;
    event.preventDefault();pointer=event.pointerId;joystick.setPointerCapture(pointer);
    onMoveStart();joystick.classList.add('is-active');update(event);
  });
  joystick.addEventListener('pointermove',update);
  for(const name of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(name,event=>{if(event.pointerId===pointer)reset();});
  const actions={inventory,vehicle,laptop,notebook};
  controls.querySelectorAll('button').forEach(button=>button.onclick=()=>{reset();if(canMove())actions[button.dataset.touch]();});
  const menu=document.createElement('button');menu.id='mobileMenu';menu.type='button';menu.className='quiet';menu.textContent='☰ Perfil';menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-controls','mobileProfile');profile.id='mobileProfile';
  const shade=document.createElement('button');shade.className='touch-menu-shade';shade.type='button';shade.setAttribute('aria-label','Fechar menu do personagem');
  const close=document.createElement('button');close.className='touch-profile-close secondary';close.textContent='✕ Fechar perfil';close.type='button';profile.prepend(close);
  function closeMenu(){body.classList.remove('touch-menu-open');menu.setAttribute('aria-expanded','false');reset();}
  menu.onclick=()=>{reset();const open=body.classList.toggle('touch-menu-open');menu.setAttribute('aria-expanded',String(open));if(open){onMoveStart();close.focus();}};
  close.onclick=()=>{closeMenu();menu.focus();};shade.onclick=closeMenu;
  profile.addEventListener('click',event=>{if(event.target.closest('button')!==close&&event.target.closest('button'))closeMenu();});
  document.querySelector('#game header').prepend(menu);body.append(shade);
  const rotate=document.createElement('div');rotate.className='touch-rotate';rotate.innerHTML='<span aria-hidden="true">↻</span><p><b>Mais espaço na horizontal</b><small>Gire o celular. Se não virar, desative o bloqueio de rotação.</small></p><button type="button" aria-label="Dispensar dica de rotação">✕</button>';
  document.querySelector('.world').prepend(rotate);rotate.querySelector('button').onclick=()=>{rotate.hidden=true;};
  const fullscreen=document.createElement('button');fullscreen.className='quiet touch-fullscreen';fullscreen.type='button';fullscreen.textContent='⛶ Tela cheia';
  const lock=async()=>{try{await screen.orientation?.lock?.('landscape');}catch{/* Safari pode exigir rotação física. */}};
  fullscreen.onclick=async()=>{reset();try{if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();}catch{}await lock();if(innerHeight>innerWidth)rotate.hidden=false;};
  document.querySelector('.header-actions').prepend(fullscreen);
  const viewport=()=>{body.classList.toggle('touch-game',media.matches);body.style.setProperty('--touch-height',`${window.visualViewport?.height||innerHeight}px`);document.querySelector('#interactBtn').textContent=media.matches?'Interagir':'E · Interagir';if(!media.matches)closeMenu();reset();};
  media.addEventListener('change',viewport);window.addEventListener('resize',viewport);window.visualViewport?.addEventListener('resize',viewport);
  window.addEventListener('blur',reset);document.addEventListener('visibilitychange',reset);
  new MutationObserver(()=>{if(document.querySelector('dialog[open]')){reset();closeMenu();}}).observe(body,{subtree:true,attributes:true,attributeFilter:['open']});
  viewport();
  return {vector:()=>media.matches&&canMove()?vector:{x:0,y:0},reset,enter:()=>{if(media.matches)lock();}};
}
