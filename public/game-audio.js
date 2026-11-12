export const mapSoundtracks={city:'./audio/devcity-fim-de-tarde.wav',plaza:'./audio/praca-natureza.wav',downtown:'./audio/centro-urbano.wav',usa:'./audio/usa-estrada.wav'};
export function audioRegion(scene){
 if(['plaza','library'].includes(scene))return 'plaza';
 if(['downtown','devclub','city-office','city-shop','stadium'].includes(scene))return 'downtown';
 if(['usa','us-office','us-shop'].includes(scene))return 'usa';
 return 'city';
}
// Um único canal fica ativo: a região atual ou o descanso.
export function createGameAudio({ music, bed, storage, onChange = () => {} }) {
  let preferences = storage;
  let volume = 0.28,
    muted = false;
  try {
    preferences ??= globalThis.localStorage;
    const saved = Number(preferences?.getItem('devlife.audio.volume') ?? volume);
    if (Number.isFinite(saved)) volume = Math.max(0, Math.min(1, saved));
    muted = preferences?.getItem('devlife.audio.muted') === '1';
  } catch {
    /* Som continua disponível se o navegador bloquear o armazenamento. */
  }
  let active = false,
    sleeping = false,
    visible = true,
    ready = true,
    current = null,
    revision = 0,region='city',loadedRegion=null;
  music.loop = true;
  bed.loop = true;
  function snapshot() {
    return { active, sleeping, visible, ready, muted, volume, track: current,region };
  }
  function save() {
    try {
      preferences?.setItem('devlife.audio.volume', String(volume));
      preferences?.setItem('devlife.audio.muted', muted ? '1' : '0');
    } catch {
      /* Não interrompe o jogo quando o armazenamento estiver cheio. */
    }
  }
  function sync() {
    music.volume = volume;
    bed.volume = Math.min(1, volume * 1.2);
    const next =
      active && visible && ready && !muted && volume > 0 ? (sleeping ? 'bed' : 'music') : null;
    if(next==='music'&&loadedRegion!==region){
      revision++;
      music.pause();
      music.src=mapSoundtracks[region];
      music.currentTime=0;
      loadedRegion=region;
    }
    if (next !== current) {
      revision++;
      music.pause();
      bed.pause();
      if (next === 'bed' || current === 'bed') bed.currentTime = 0;
      current = next;
    }
    onChange(snapshot());
    if (!current) return;
    const player = current === 'bed' ? bed : music;
    if (!player.paused) return;
    const attempt = revision;
    // Alguns navegadores exigem um clique mesmo ao restaurar uma sessão salva.
    player.play()?.catch(() => {
      if (attempt !== revision) return;
      ready = false;
      current = null;
      music.pause();
      bed.pause();
      onChange(snapshot());
    });
  }
  const controls = {
    snapshot,
    unlock() {
      revision++;
      ready = true;
      sync();
    },
    toggle() {
      // Um toque após bloqueio de autoplay deve iniciar o áudio, sem silenciá-lo.
      const enable=muted||volume===0||!ready||!current;
      muted=!enable;
      if(enable&&volume===0)volume=0.28;
      ready=true;
      revision++;
      save();
      sync();
    },
    setGame(value, asleep = false,scene='city') {
      active = value;
      sleeping = asleep;
      region=audioRegion(scene);
      sync();
    },
    setVisible(value) {
      visible = value;
      sync();
    },
    setMuted(value) {
      muted = value;
      save();
      sync();
    },
    setVolume(value) {
      if (!Number.isFinite(value)) return;
      volume = Math.max(0, Math.min(1, value));
      save();
      sync();
    },
  };
  sync();
  return controls;
}
