import test from 'node:test';
import assert from 'node:assert/strict';
import { drawHomePreview, drawPortrait, drawItem, drawInterior, drawRegionalWorld } from '../public/world.js';
import { shopModels } from '../public/shop-models.js';
import { items } from '../content.js';
// Registra comandos de desenho: detecta itens que não afetam o renderer,
// sem depender de snapshots de aparência ou de bibliotecas de navegador.
function canvasRecorder() {
  const commands = [];
  const context = new Proxy(
    {},
    {
      set(target, key, value) {
        commands.push([key, value]);
        target[key] = value;
        return true;
      },
      get(target, key) {
        if (key === 'commands') return commands;
        if (key === 'createLinearGradient' || key === 'createRadialGradient')
          return (...args) => {
            const colors = [];
            commands.push([key, args, colors]);
            return { addColorStop: (...stop) => colors.push(stop) };
          };
        return (...args) => {
          commands.push([key, ...args]);
        };
      },
    },
  );
  return context;
}
const base = {
  name: 'Teste',
  skin: '#dba47b',
  shirt: '#60a5fa',
  completed: [],
  equipped: [],
  position: { x: 480, y: 485, map: 'house' },
};
function render(state) {
  const c = canvasRecorder();
  drawHomePreview(c, state);
  return JSON.stringify(c.commands);
}
test('Todos os itens alteram a prévia e guardar restaura o visual original', () => {
  const initial = render(base);
  for (const item of items.filter((i) => !i.common && i.slot!=="vehicle")) {
    const variant = render({ ...base, equipped: [item.id] });
    assert.notEqual(variant, initial, item.id + ' deve mudar o desenho');
    const thumb = canvasRecorder();
    drawItem(thumb, item);
    assert.ok(thumb.commands.length > 15, item.id + ' deve possuir arte própria');
  }
  assert.equal(render({ ...base, equipped: [] }), initial);
});
test('Roupas, boné e fones também alteram o retrato', () => {
  const c = canvasRecorder();
  drawPortrait(c, base);
  const initial = JSON.stringify(c.commands);
  for (const id of ['shirt', 'shirt-orange', 'shirt-mint', 'cap', 'headphones']) {
    const preview = canvasRecorder();
    drawPortrait(preview, { ...base, equipped: [id] });
    assert.notEqual(JSON.stringify(preview.commands), initial, id);
  }
});
test('Teclado mecânico substitui o teclado padrão da mesa', () => {
  const normal = canvasRecorder(),
    mechanical = canvasRecorder();
  drawHomePreview(normal, base);
  drawHomePreview(mechanical, { ...base, equipped: ['keyboard'] });
  const usesColor = (context, color) =>
    context.commands.some((command) => command[0] === 'fillStyle' && command[1] === color);
  assert.equal(usesColor(normal, '#e3ddc6'), true);
  assert.equal(usesColor(mechanical, '#e3ddc6'), false);
  assert.equal(usesColor(mechanical, '#8fcbbd'), true);
});

test('Escolha de homem e mulher altera o retrato e o personagem no ambiente', () => {
  const a = canvasRecorder(),
    b = canvasRecorder();
  drawPortrait(a, { ...base, gender: 'male' });
  drawPortrait(b, { ...base, gender: 'female' });
  assert.notEqual(JSON.stringify(a.commands), JSON.stringify(b.commands));
  assert.notEqual(render({ ...base, gender: 'male' }), render({ ...base, gender: 'female' }));
});

test('Cores do cabelo alteram retrato e avatar no cenário', () => {
  const a = canvasRecorder(),
    b = canvasRecorder();
  drawPortrait(a, { ...base, hair: '#252630' });
  drawPortrait(b, { ...base, hair: '#d6b56e' });
  assert.notEqual(JSON.stringify(a.commands), JSON.stringify(b.commands));
  assert.notEqual(render({ ...base, hair: '#252630' }), render({ ...base, hair: '#d6b56e' }));
});

test('Os seis modelos de cada tipo têm desenho distinto na miniatura e no ambiente', () => {
  for (const slot of new Set(shopModels.map((item) => item.slot))) {
    const models = shopModels.filter((item) => item.slot === slot);
    const homes = models.map((item) => render({ ...base, equipped: [item.id] }));
    const thumbs = models.map((item) => {
      const context = canvasRecorder();
      drawItem(context, item);
      return JSON.stringify(context.commands);
    });
    assert.equal(new Set(homes).size, 6, slot);
    assert.equal(new Set(thumbs).size, 6, slot);
  }
});

test('Setup combina acabamentos independentes e a cama conserva o acabamento durante o sono', () => {
  const context = canvasRecorder();
  drawHomePreview(context, {
    ...base,
    equipped: ['desk-specialist', 'monitor-professional', 'keyboard-dev'],
  });
  const colors = JSON.stringify(context.commands);
  for (const id of ['desk-specialist', 'monitor-professional', 'keyboard-dev'])
    assert.ok(colors.includes(shopModels.find((item) => item.id === id).color), id);
  const sleeping = canvasRecorder();
  drawInterior(sleeping, { ...base, equipped: ['bed-future'] }, { sleeping: true });
  assert.ok(JSON.stringify(sleeping.commands).includes('#121923'));
});

test('Carros e motos têm arte detalhada e só aparecem com uso manual na pista',()=>{
  const state={...base,position:{map:'downtown',x:480,y:420}};
  const normal=canvasRecorder();drawRegionalWorld(normal,state);
  for(const item of items.filter(x=>x.slot==='vehicle')){
    const selected={...state,inventory:[item.id],equipped:[item.id],activeVehicle:null};
    const foot=canvasRecorder();drawRegionalWorld(foot,selected);assert.equal(JSON.stringify(foot.commands),JSON.stringify(normal.commands),'Selecionar não pode ativar: '+item.id);
    const view=canvasRecorder();drawRegionalWorld(view,{...selected,activeVehicle:item.id});
    assert.notEqual(JSON.stringify(view.commands),JSON.stringify(normal.commands),item.id);
    const thumbnail=canvasRecorder();drawItem(thumbnail,item);
    assert.ok(thumbnail.commands.length>30,item.id);
    assert.ok(thumbnail.commands.some(c=>c[0]==='fillStyle'&&c[1]===item.color),item.id);
  }
});
