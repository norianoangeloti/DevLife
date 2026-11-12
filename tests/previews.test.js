import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { lessons, practices, works } from '../content.js';
import { schoolLessons } from '../school-content.js';
import { cssScenes, exercisePreview, renderProjectPreview } from '../public/exercise-preview.js';
import { resolveLearningImages } from '../public/learning-images.js';

test('Todas as aulas de JS oferecem demo executável com entradas editáveis', () => {
  const exercises = schoolLessons.filter(lesson => lesson.area === 'JavaScript');
  assert.equal(exercises.length, 70);
  for (const exercise of exercises) {
    const page = exercisePreview(exercise, exercise.solution);
    if (exercise.challengeKind === 'javascript-contract') {
      assert.match(page, /id="challengeRun"/, exercise.id);
      assert.match(page, /id="challengeCase"/, exercise.id);
      assert.match(page, /id="challengeOutput"/, exercise.id);
    } else {
      assert.match(page, /id="devlifeDemoRun"/, exercise.id);
      assert.match(page, /id="devlifeDemoData"/, exercise.id);
      assert.match(page, /id="devlifeDemoArgs"/, exercise.id);
    }
    for (const script of page.matchAll(/<script type="module">([\s\S]*?)<\/script>/g))
      assert.doesNotThrow(() => new vm.Script(`(async()=>{${script[1]}\n})()`), exercise.id);
  }
});

test('Prévia de JS mostra variáveis, chamadas de função e console, inclusive após editar', async () => {
  const output = { textContent: '', dataset: { empty: 'true' } };
  const context = vm.createContext({
    document: { querySelector: () => output, createElement: () => ({}) },
    console: {},
  });
  vm.runInContext('window = globalThis; window.addEventListener = () => {};', context);
  const run = async (code) => {
    output.textContent = '';
    output.dataset.empty = 'true';
    const page = exercisePreview({ area: 'JavaScript', previewHtml: '<p>Teste</p>' }, code);
    const scripts = [...page.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)];
    assert.equal(scripts.length, 2);
    for (const script of scripts) await vm.runInContext(`(async()=>{${script[1]}\n})()`, context);
    return output.textContent;
  };
  assert.equal(await run('const mensagem = "Primeiro teste";'), 'Primeiro teste\n');
  assert.equal(await run('const mensagem = "Segundo teste";'), 'Segundo teste\n');
  assert.equal(await run('function somar(a,b){return a+b;}'), 'somar(3, 3) → 6\n');
  assert.match(await run('console.log("Mensagem visível");'), /Mensagem visível/);
  assert.equal(await run('const dobro = n => n * 2;'), 'dobro(3) → 6\n');
  assert.equal(await run('function saudar(nome = "Dev") { return "Olá, " + nome; }'), 'saudar() → Olá, Dev\n');
  assert.equal(await run('function saudar(nome) { return "Olá, " + nome; }'), 'saudar("Dev") → Olá, Dev\n');
  assert.equal(await run('const saudar = nome => "Olá, " + nome;'), 'saudar("Dev") → Olá, Dev\n');
  assert.equal(await run('const unicos = new Set([1, 1, 2]);'), '[\n  1,\n  2\n]\n');
});

test('Prévia de JS só inclui elementos de página usados pelo exercício', () => {
  const exercise = { area: 'JavaScript', previewHtml: '<h1>DevLife</h1><button>Testar</button><p>Aguardando</p>' };
  const variable = exercisePreview(exercise, 'const mensagem = "Hello World";');
  assert.ok(!variable.includes('<h1>DevLife</h1>'));
  assert.ok(!variable.includes('<button'));
  assert.ok(!variable.includes('mensagem →'));
  const click = exercisePreview(exercise, 'document.querySelector("#acao").addEventListener("click",()=>{document.querySelector("#status").textContent="Pronto";});');
  assert.ok(click.includes('<button id="acao"'));
  assert.ok(click.includes('<p id="status"'));
  assert.ok(!click.includes('<article'));
});

test('A prévia envia o rascunho uma vez ao carregar e mantém as atualizações seguintes', () => {
  const attributes = new Map();
  const messages = [];
  const frame = {
    setAttribute: (key, value) => attributes.set(key, value),
    getAttribute: (key) => (key === 'src' ? frame.src : attributes.get(key)),
    removeAttribute: (key) => attributes.delete(key),
    contentWindow: { postMessage: (source) => messages.push(source) },
  };
  renderProjectPreview(frame, 'primeiro rascunho');
  assert.equal(frame.src, './sandbox-preview.html');
  frame.onload();
  assert.equal(frame.onload, null);
  assert.deepEqual(messages, ['primeiro rascunho']);
  renderProjectPreview(frame, 'rascunho atualizado');
  assert.deepEqual(messages, ['primeiro rascunho', 'rascunho atualizado']);
});

test('Todo exercício de CSS tem os elementos que seu seletor precisa na prévia', () => {
  const exercises = [...lessons, ...practices, ...works].filter(
    (exercise) => exercise.area === 'CSS',
  );
  assert.ok(exercises.length > 30);
  for (const exercise of exercises) {
    if (exercise.previewHtml) {
      const preview = exercisePreview(exercise, exercise.solution);
      assert.ok(preview.includes(resolveLearningImages(exercise.previewHtml)), exercise.id);
      assert.ok(preview.includes(exercise.solution));
      continue;
    }
    const scene = cssScenes[exercise.id];
    assert.ok(scene, exercise.id);
    const selector = exercise.solution.match(/\.[a-z-]+/)[0];
    assert.equal(scene.selector, selector, exercise.id);
    const classes = [...scene.html.matchAll(/class="([^"]+)"/g)].flatMap((match) =>
      match[1].split(' '),
    );
    assert.ok(classes.includes(selector.slice(1)), exercise.id);
    const preview = exercisePreview(exercise, exercise.solution);
    assert.ok(preview.includes(exercise.solution), exercise.id);
    assert.ok(preview.indexOf(scene.html) < preview.indexOf(exercise.solution), exercise.id);
    if (exercise.solution.includes('@media')) {
      assert.equal(scene.width, 375);
      assert.ok(scene.css.includes('display:grid'));
    }
  }
});

test('JavaScript continua sendo texto, e CSS não consegue encerrar o bloco de estilo', () => {
  assert.ok(
    !exercisePreview({ area: 'JavaScript' }, '<script>alert(1)</script>').includes('<script>'),
  );
  assert.ok(
    !exercisePreview(
      { area: 'CSS', id: 'css-color' },
      '</style><script>alert(1)</script>',
    ).includes('</style><script>'),
  );
});
