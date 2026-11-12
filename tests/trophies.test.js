import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { achievements, items, itemFits } from '../content.js';
test('Cada conquista tem um arquivo de troféu diferente e autossuficiente', () => {
  const drawings = achievements.map((a) => {
    const svg = readFileSync(new URL('../public' + a.image.split('?')[0], import.meta.url), 'utf8');
    assert.ok(svg.startsWith('<svg'));
    assert.ok(!/<text[^>]*>\d+<\/text>/.test(svg));
    assert.ok(!svg.includes('undefined'));
    assert.ok(!/(?:href|src)="https?:/i.test(svg));
    return svg;
  });
  assert.equal(new Set(drawings).size, achievements.length);
});
test('Loja mantém decoração compartilhada e modelos de roupa para cada personagem', () => {
  for (const gender of ['male', 'female']) {
    const catalog = items.filter((i) => !i.legacy && !i.region && itemFits(i, gender));
    assert.equal(catalog.length, 150);
    assert.equal(catalog.filter((i) => i.category === 'Roupas').length, 30);
    assert.ok(catalog.every((i) => i.gender === 'all' || i.gender === gender));
  }
});
