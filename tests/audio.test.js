import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGameAudio,mapSoundtracks,audioRegion } from '../public/game-audio.js';

function player() {
  return {
    paused: true,
    currentTime: 0,
    volume: 1,
    loop: false,
    starts: 0,
    play() {
      this.paused = false;
      this.starts++;
      return Promise.resolve();
    },
    pause() {
      this.paused = true;
    },
  };
}
function fixture(saved = {}) {
  const music = player(),
    bed = player();
  const storage = {
    getItem: (key) => saved[key] ?? null,
    setItem: (key, value) => {
      saved[key] = value;
    },
  };
  const sound = createGameAudio({ music, bed, storage });
  return { sound, music, bed, saved, storage };
}

test('Música inicia automaticamente, pausa para a cama e retoma o ponto anterior ao despertar', () => {
  const { sound, music, bed } = fixture();
  sound.setGame(true);
  assert.equal(music.paused, false);
  assert.equal(bed.paused, true);
  music.currentTime = 12;
  sound.setGame(true, true);
  assert.equal(music.paused, true);
  assert.equal(bed.paused, false);
  bed.currentTime = 3;
  sound.setGame(true, false);
  assert.equal(bed.paused, true);
  assert.equal(bed.currentTime, 0);
  assert.equal(music.paused, false);
  assert.equal(music.currentTime, 12);
  sound.setGame(false);
  assert.equal(music.paused, true);
  assert.equal(bed.paused, true);
});

test('Mute e volume persistem e nenhum som toca em segundo plano ou com volume zero', () => {
  const { sound, music, bed, storage } = fixture();
  sound.unlock();
  sound.setGame(true);
  sound.setVolume(0.6);
  assert.equal(music.volume, 0.6);
  sound.setVisible(false);
  assert.equal(music.paused, true);
  sound.setVisible(true);
  assert.equal(music.paused, false);
  sound.setMuted(true);
  sound.setGame(true, true);
  assert.equal(music.paused, true);
  assert.equal(bed.paused, true);
  const restored = createGameAudio({ music: player(), bed: player(), storage });
  assert.equal(restored.snapshot().volume, 0.6);
  assert.equal(restored.snapshot().muted, true);
  sound.setMuted(false);
  assert.equal(bed.paused, false);
  sound.setVolume(0);
  assert.equal(bed.paused, true);
});

test('Bloqueio de autoplay permite tentar novamente sem afetar o jogo', async () => {
  const { sound, music, bed } = fixture();
  music.play = () => Promise.reject(new Error('Autoplay bloqueado'));
  sound.setGame(true);
  await Promise.resolve();
  assert.equal(sound.snapshot().ready, false);
  assert.equal(bed.paused, true);
  music.play = function () {
    this.paused = false;
    return Promise.resolve();
  };
  sound.unlock();
  assert.equal(music.paused, false);
});

test('Botão ativa som bloqueado no primeiro toque e depois alterna silenciar',async()=>{
  const {sound,music}=fixture();
  music.play=()=>Promise.reject(new Error('NotAllowedError'));
  sound.setGame(true);await Promise.resolve();
  assert.equal(sound.snapshot().ready,false);
  music.play=function(){this.paused=false;return Promise.resolve();};
  sound.toggle();assert.equal(sound.snapshot().muted,false);assert.equal(music.paused,false);
  sound.toggle();assert.equal(sound.snapshot().muted,true);assert.equal(music.paused,true);
  sound.toggle();assert.equal(sound.snapshot().muted,false);assert.equal(music.paused,false);
  sound.setVolume(0);sound.toggle();assert.equal(sound.snapshot().volume,.28);assert.equal(music.paused,false);
});

test('Rejeição atrasada do autoplay não cancela reprodução autorizada pelo toque',async()=>{
  const {sound,music}=fixture();let reject;
  music.play=()=>new Promise((_,fail)=>{reject=fail;});sound.setGame(true);
  music.play=function(){this.paused=false;return Promise.resolve();};sound.unlock();
  reject(new Error('Bloqueio anterior'));await Promise.resolve();
  assert.equal(sound.snapshot().ready,true);assert.equal(music.paused,false);
});

test('Arquivos da trilha e cama são WAV estéreo completos, com durações próprias', () => {
  for (const [name, duration] of [
    ['devcity-fim-de-tarde.wav', 43.64],
    ['descanso.wav', 8],
    ['praca-natureza.wav',32],
    ['centro-urbano.wav',40],
    ['usa-estrada.wav',35.56],
  ]) {
    const wav = readFileSync(new URL('../public/audio/' + name, import.meta.url));
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
    assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
    assert.equal(wav.readUInt16LE(22), 2);
    assert.equal(wav.readUInt32LE(24), 22050);
    assert.ok(Math.abs(wav.readUInt32LE(40) / (22050 * 4) - duration) < 0.05);
  }
});
test('Cada região e seus interiores usam a trilha correta sem reiniciar ao atualizar o mesmo mapa',()=>{
 const {sound,music,bed}=fixture();
 for(const [scene,region] of [['city','city'],['house','city'],['plaza','plaza'],['library','plaza'],['downtown','downtown'],['devclub','downtown'],['city-shop','downtown'],['usa','usa'],['us-office','usa']]){
  sound.setGame(true,false,scene);
  assert.equal(audioRegion(scene),region);assert.equal(music.src,mapSoundtracks[region]);
  assert.equal(bed.paused,true);assert.equal(music.paused,false);
  music.currentTime=7;sound.setGame(true,false,scene);assert.equal(music.currentTime,7);
 }
 sound.setGame(true,true,'usa');assert.equal(bed.paused,false);assert.equal(music.paused,true);
 sound.setGame(true,false,'usa');assert.equal(music.currentTime,7);
 sound.setMuted(true);sound.setGame(true,false,'plaza');assert.equal(music.paused,true);
 sound.setMuted(false);assert.equal(music.src,mapSoundtracks.plaza);assert.equal(music.paused,false);
});
