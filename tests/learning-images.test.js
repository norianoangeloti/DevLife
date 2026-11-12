import test from 'node:test';
import assert from 'node:assert/strict';
import { learningImages, resolveLearningImages } from '../public/learning-images.js';
import { exercisePreview, projectDocument } from '../public/exercise-preview.js';
import { schoolLessons, validateSchool } from '../school-content.js';

test('Atividades com imagens têm modelos incorporados e preservam a resposta original', () => {
  const lessons = schoolLessons.filter((lesson) => lesson.area === 'HTML' && lesson.solution.includes('<img'));
  assert.equal(lessons.length, 4);
  for (const lesson of lessons) {
    const original = lesson.solution;
    const page = exercisePreview(lesson, original);
    assert.ok(page.includes('data:image/svg+xml,'), lesson.id);
    assert.ok(!/\b(?:src|srcset)="(?:avatar|cidade|projeto|grande|pequena)\.png"/.test(page), lesson.id);
    assert.equal(lesson.solution, original);
    assert.ok(validateSchool(lesson.id, original));
    assert.ok(page.includes("img-src data:"));
  }
});

test('Modelos têm tamanhos próprios e srcset mantém condições e descritores', () => {
  for (const image of Object.values(learningImages)) {
    const xml = decodeURIComponent(image.slice('data:image/svg+xml,'.length));
    assert.match(xml, /<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    assert.ok(!xml.includes('<script'));
  }
  assert.notEqual(learningImages['grande.png'], learningImages['pequena.png']);
  const picture = resolveLearningImages('<picture><source media="(min-width: 800px)" srcset="grande.png 640w, pequena.png 320w"><img src=avatar.png alt="Foto"></picture>');
  assert.ok(picture.includes('media="(min-width: 800px)"'));
  assert.ok(picture.includes(`${learningImages['grande.png']} 640w, ${learningImages['pequena.png']} 320w`));
  assert.ok(picture.includes(`src="${learningImages['avatar.png']}" alt="Foto"`));
});

test('Resolução não inventa imagens para caminhos errados ou troca fontes externas e dados existentes', () => {
  for (const html of ['<img src="avatr.png" alt="Teste">', '<img src="https://example.com/avatar.png">', '<img src="data:image/png;base64,AAAA">']) {
    assert.equal(resolveLearningImages(html), html);
  }
  const preview = projectDocument({ html: '<img src="./projeto.png" width="320" height="180">' });
  assert.ok(preview.includes(learningImages['projeto.png']));
  assert.ok(preview.includes('width="320" height="180"'));
});
