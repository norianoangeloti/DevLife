import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { recruitmentExams } from '../career-content.js';
import { works as oldWorks } from '../curriculum.js';
import {
  lessons,
  ticket,
  works,
  practices,
  items,
  equipItem,
  publicExercise,
  validate,
} from '../content.js';
test('Todas as soluções didáticas passam e respostas vazias falham', () => {
  for (const l of [...lessons, ...works]) {
    assert.equal(validate(l.id, l.solution), true, l.id);
    assert.equal(validate(l.id, ''), false, l.id);
  }
  assert.equal(validate('ticket-button', '<button id="enviar" disabled>Enviar</button>'), false);
  assert.equal(validate('js-door', 'function abrirPorta() { return false; }'), false);
});
test('Dicas não expõem soluções e práticas usam objetivos diferentes', () => {
  for (const l of [...lessons, ...works, ...practices]) {
    assert.equal('solution' in publicExercise(l), false);
    assert.ok(l.hints.length >= 2);
    assert.ok(!l.hints.includes(l.solution));
  }
  for (const p of practices) assert.equal(validate(p.id, p.solution), true, p.id);
  assert.equal(items.filter((i) => !i.legacy && !i.region).length, 160);
});
test('Equipamento substitui itens do mesmo tipo e guardar restaura o padrão', () => {
  const state = { equipped: ['plant', 'shirt', 'rug'] };
  equipItem(state, 'cactus');
  assert.deepEqual(state.equipped, ['shirt', 'rug', 'cactus']);
  equipItem(state, 'shirt-orange');
  assert.deepEqual(state.equipped, ['rug', 'cactus', 'shirt-orange']);
  equipItem(state, 'rug-coral');
  assert.deepEqual(state.equipped, ['cactus', 'shirt-orange', 'rug-coral']);
  equipItem(state, 'rug-coral');
  assert.deepEqual(state.equipped, ['cactus', 'shirt-orange']);
});
test('Jornada persistida com autenticação e recompensas controladas', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'devlife-test-'));
  const port = 3100 + Math.floor(Math.random() * 1000);
  const server = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, PORT: String(port), DEVLIFE_DB: path.join(dir, 'test.sqlite') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let cookie = '';
  const request = async (route, data, auth = true) => {
    if(route==='character'&&!data?.editorToken){const opened=await request('character-open',{});if(opened.status!==200)return opened;data={...data,editorToken:opened.body.editorToken};}
    const res = await fetch(`http://127.0.0.1:${port}/api/${route}`, {
      method: data ? 'POST' : 'GET',
      headers: {
        ...(data ? { 'Content-Type': 'application/json' } : {}),
        ...(auth ? { Cookie: cookie } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (res.headers.get('set-cookie')) cookie = res.headers.get('set-cookie').split(';')[0];
    return { status: res.status, body: await res.json() };
  };
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Servidor não iniciou')), 10000);
      server.stdout.once('data', () => {
        clearTimeout(timeout);
        resolve();
      });
      server.once('error', reject);
    });
    assert.equal((await request('state', null, false)).status, 401);
    const art = await fetch(`http://127.0.0.1:${port}/trophies/hello.svg`);
    assert.equal(art.status, 200);
    const favicon = await fetch(`http://127.0.0.1:${port}/favicon.svg`);
    assert.equal(favicon.status, 200);
    assert.equal(favicon.headers.get('content-type'), 'image/svg+xml');
    assert.equal(art.headers.get('content-type'), 'image/svg+xml');
    assert.ok((await art.text()).startsWith('<svg'));
    assert.equal((await fetch(`http://127.0.0.1:${port}/trophies/missing.svg`)).status, 404);
    assert.equal(
      (
        await request('register', {
          name: 'Teste',
          email: 'teste@example.com',
          password: 'senha12345',
        })
      ).status,
      200,
    );
    const first = (await request('state')).body.state;
    assert.equal(first.money, 0);
    assert.equal((await request('buy', { id: 'desk' })).status, 403);
    const catalog = (await request('state')).body;
    assert.equal(catalog.items.filter((i) => !i.legacy && !i.region).length, 160);
    const musicFile = await fetch(`http://127.0.0.1:${port}/audio/devcity-fim-de-tarde.wav`);
    assert.equal(musicFile.status, 200);
    assert.equal(musicFile.headers.get('content-type'), 'audio/wav');
    assert.equal(Buffer.from(await musicFile.arrayBuffer()).toString('ascii', 0, 4), 'RIFF');
    assert.equal((await fetch(`http://127.0.0.1:${port}/audio/descanso.wav`)).status, 200);
    assert.equal((await fetch(`http://127.0.0.1:${port}/game-audio.js`)).status, 200);
    assert.ok(catalog.lessons.every((l) => !('solution' in l)));
    assert.ok(catalog.practices.every((l) => !('solution' in l)));
    assert.equal(
      (await request('practice', { id: practices[0].id, code: practices[0].solution })).status,
      403,
    );
    assert.equal(
      (await request('submit', { id: 'js-door', code: lessons[6].solution })).status,
      403,
    );
    assert.equal(
      (await request('submit', { id: 'html-title', code: '<h2>Dev School</h2>' })).status,
      422,
    );
    assert.equal((await request('job', {})).status, 403);
    for (const lesson of lessons)
      assert.equal(
        (await request('submit', { id: lesson.id, code: lesson.solution })).status,
        200,
        lesson.id,
      );
    const submissions = (await request('state')).body.state.submissions;
    assert.equal(submissions['html-title'].code, lessons[0].solution);
    assert.equal(submissions['html-title'].attempts, 2);
    const rewardState = (await request('state')).body.state;
    assert.equal(rewardState.money, 0);
    const appearanceDb=new DatabaseSync(path.join(dir,'test.sqlite'));
    const appearanceRow=appearanceDb.prepare('SELECT user_id,state FROM characters').get();const appearanceState=JSON.parse(appearanceRow.state);appearanceState.wallets.usd=3000;appearanceDb.prepare('UPDATE characters SET state=? WHERE user_id=?').run(JSON.stringify(appearanceState),appearanceRow.user_id);appearanceDb.close();
    assert.equal(
      (await request('character', { gender: 'female', hair: '#ac593e' })).body.state.hair,
      '#ac593e',
    );
    assert.equal((await request('buy', { id: 'shirt' })).status, 403);
    assert.equal((await request('character', { gender: 'male' })).body.state.gender, 'male');
    const failedPractice = await request('practice', {
      id: practices[0].id,
      code: '<h1>Meu portfólio</h1>',
    });
    assert.equal(failedPractice.status, 422);
    assert.ok(failedPractice.body.feedback.length);
    for (let i = 0; i < 2; i++)
      assert.equal(
        (await request('practice', { id: practices[0].id, code: practices[0].solution })).status,
        200,
      );
    assert.equal(
      (await request('practice', { id: 'html-title', code: lessons[0].solution })).status,
      200,
    );
    const practiceState = (await request('state')).body.state;
    assert.equal(practiceState.xp, rewardState.xp);
    assert.equal(practiceState.money, rewardState.money);
    assert.equal(practiceState.practiceHistory.length, 4);
    assert.equal(practiceState.practiceHistory[0].passed, false);
    assert.equal(
      (await request('submit', { id: 'html-title', code: lessons[0].solution })).status,
      409,
    );
    assert.equal((await request('state')).body.state.money, rewardState.money);
    assert.equal((await request('job', {})).status, 403);
    assert.equal(
      (await request('recruit', { id: recruitmentExams[0].id, code: recruitmentExams[0].solution }))
        .status,
      200,
    );
    assert.equal((await request('submit', { id: ticket.id, code: ticket.solution })).status, 400);
    const firstWork = await request('work', { id: works[0].id, code: works[0].solution });
    assert.equal(firstWork.status, 200);
    assert.equal((await request('buy', { id: 'bed-aurora', minLevel: 1 })).status, 403);
    assert.equal(firstWork.body.cooldownMinutes, 2);
    assert.ok(firstWork.body.state.career.remainingMs > 119000);
    assert.equal((await request('work', { id: works[0].id, code: works[0].solution })).status, 409);
    assert.equal((await request('work', { id: works[1].id, code: works[1].solution })).status, 429);
    assert.equal((await request('salary', {})).status, 410);
    const testDb = new DatabaseSync(path.join(dir, 'test.sqlite'));
    for (const work of works.slice(1)) {
      if ([10, 30, 60, 100].includes(work.stage - 1)) {
        assert.equal((await request('work', { id: work.id, code: work.solution })).status, 403);
        const exam = recruitmentExams[work.tier];
        assert.equal((await request('recruit', { id: exam.id, code: exam.solution })).status, 200);
      }
      const row = testDb.prepare('SELECT user_id,state FROM characters').get();
      const state = JSON.parse(row.state);
      state.work.nextWorkAt = 0;
      testDb
        .prepare('UPDATE characters SET state=? WHERE user_id=?')
        .run(JSON.stringify(state), row.user_id);
      const res = await request('work', { id: work.id, code: work.solution });
      assert.equal(res.status, 200, work.id + JSON.stringify(res.body));
      assert.equal(res.body.state.career.completed, work.stage);
      assert.equal(res.body.cooldownMinutes, work.stage < 150 ? work.cooldownMinutes : 0);
    }
    testDb.close();
    assert.ok(Object.values((await request('state')).body.state.skills).every((n) => n <= 100));
    assert.equal(
      (await request('state')).body.state.money,
      works.reduce((n, w) => n + w.money, 0),
    );
    assert.equal(
      (await request('work', { id: works[49].id, code: works[49].solution })).status,
      409,
    );
    assert.equal((await request('buy', { id: 'shirt' })).status, 200);
    assert.equal((await request('book-read', { id: 'html-pt', page: 1 })).status, 403);
    const lockedLibrary=await request('position', { map: 'library', x: 644, y: 337 });
    assert.equal(lockedLibrary.body.state.position.map,'city');
    // A atividade antiga não libera a biblioteca; a prova iniciante libera.
    const gateDb=new DatabaseSync(path.join(dir,'test.sqlite'));
    const gateRow=gateDb.prepare('SELECT user_id,state FROM characters').get();
    const gateState=JSON.parse(gateRow.state);gateState.completed.push('exam-javascript-beginner');
    gateDb.prepare('UPDATE characters SET state=? WHERE user_id=?').run(JSON.stringify(gateState),gateRow.user_id);gateDb.close();
    assert.equal((await request('position', { map: 'library', x: 644, y: 337 })).body.state.position.map,'library');
    assert.equal((await request('book-read', { id: 'html-pt', page: 26 })).status, 409);
    const beforeBook = (await request('state')).body.state;
    for (let page = 1; page <= 26; page++) {
      const result = await request('book-read', { id: 'html-pt', page });
      assert.equal(result.status, 200);
      assert.equal(result.body.rewarded, page === 26);
    }
    const afterBook = (await request('state')).body.state;
    assert.ok(afterBook.achievements.includes('book-html'));
    assert.equal(afterBook.xp, beforeBook.xp + 200);
    assert.equal(afterBook.money, beforeBook.money);
    assert.equal((await request('book-read', { id: 'html-pt', page: 26 })).body.rewarded, false);
    const pdf = await fetch(`http://127.0.0.1:${port}/books/html.pdf`);
    assert.equal(pdf.status, 200);
    assert.equal(pdf.headers.get('content-type'), 'application/pdf');
    assert.equal(
      Buffer.from(await pdf.arrayBuffer())
        .subarray(0, 5)
        .toString(),
      '%PDF-',
    );
    assert.equal((await request('buy', { id: 'gamer-chair' })).status, 200);
    assert.ok((await request('state')).body.state.equipped.includes('gamer-chair'));
    assert.equal((await request('buy', { id: 'chair' })).status, 200);
    assert.ok(!(await request('state')).body.state.equipped.includes('gamer-chair'));
    // A campanha antiga não concede XP suficiente para o nível 100.
    assert.equal((await request('buy', { id: 'bed-master' })).status, 403);
    for (const bed of items.filter((item) => item.slot === 'bed' && !item.common && item.minLevel < 100)) {
      const bought = await request('buy', { id: bed.id });
      assert.equal(bought.status, 200, bed.id);
      assert.equal(bought.body.state.equipped.filter((id) => id.startsWith('bed-')).length, 1);
      assert.ok(bought.body.state.equipped.includes(bed.id));
    }
    const savedBed = (await request('state')).body.state;
    assert.equal((await request('buy', { id: 'bed-aurora' })).status, 409);
    assert.equal((await request('state')).body.state.money, savedBed.money);
    await request('equip', { id: 'bed-future' });
    assert.ok(!(await request('state')).body.state.equipped.includes('bed-future'));
    assert.equal(
      (await request('character', { gender: 'female' })).body.state.equipped.includes('shirt'),
      false,
    );
    assert.equal((await request('equip', { id: 'shirt' })).status, 403);
    assert.equal((await request('buy', { id: 'shirt-female' })).status, 200);
    assert.equal(
      (await request('character', { gender: 'male' })).body.state.equipped.includes('shirt-female'),
      false,
    );
    assert.equal((await request('buy', { id: 'desk' })).status, 200);
    assert.equal((await request('buy', { id: 'desk' })).status, 409);
    assert.equal((await request('equip', { id: 'missing' })).status, 400);
    assert.equal((await request('buy', { id: 'plant' })).status, 200);
    assert.equal((await request('buy', { id: 'cactus' })).status, 200);
    let inventoryState = (await request('state')).body.state;
    assert.ok(inventoryState.equipped.includes('cactus'));
    assert.ok(!inventoryState.equipped.includes('plant'));
    assert.equal((await request('equip', { id: 'plant' })).status, 200);
    inventoryState = (await request('state')).body.state;
    assert.ok(inventoryState.equipped.includes('plant'));
    assert.ok(!inventoryState.equipped.includes('cactus'));
    // Um pedido lento começou antes do equipamento e termina depois dele.
    // Ele deve salvar só a posição, preservando o inventário mais recente.
    const positionBody = JSON.stringify({ x: 515, y: 432, map: 'city' });
    let slowRequest;
    const slowPosition = new Promise((resolve, reject) => {
      slowRequest = http.request(
        `http://127.0.0.1:${port}/api/position`,
        {
          method: 'POST',
          headers: {
            Cookie: cookie,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(positionBody),
            Expect: '100-continue',
          },
        },
        (res) => {
          res.resume();
          res.on('end', () => resolve(res.statusCode));
        },
      );
      slowRequest.on('error', reject);
    });
    const ready = new Promise((resolve) => slowRequest.once('continue', resolve));
    slowRequest.flushHeaders();
    await ready;
    assert.equal((await request('equip', { id: 'desk' })).status, 200);
    slowRequest.end(positionBody);
    assert.equal(await slowPosition, 200);
    assert.ok(
      !(await request('state')).body.state.equipped.includes('desk'),
      'salvar posição não pode reativar o item guardado',
    );
    assert.equal((await request('position', { x: 510, y: 430 })).status, 200);
    const before = (await request('state')).body.state;
    assert.ok(before.achievements.includes('career-complete'));
    assert.equal((await request('logout', {})).status, 200);
    assert.equal((await request('state')).status, 401);
    assert.equal(
      (await request('login', { email: 'teste@example.com', password: 'errada123' })).status,
      401,
    );
    assert.equal(
      (await request('login', { email: 'teste@example.com', password: 'senha12345' })).status,
      200,
    );
    const after = (await request('state')).body.state;
    delete after.serverNow;
    delete before.serverNow;
    delete after.career.serverNow;
    delete before.career.serverNow;
    assert.equal(after.world.day, before.world.day);
    assert.deepEqual(after.worldTime, before.worldTime);
    delete after.world;
    delete before.world;
    assert.deepEqual(after, before);
    assert.equal((await request('sleep', {})).status, 403);
    await request('position', { map: 'house', x: 308, y: 485 });
    const sleepDb = new DatabaseSync(path.join(dir, 'test.sqlite'));
    const sleepRow = sleepDb.prepare('SELECT user_id,state FROM characters').get();
    const sleepState = JSON.parse(sleepRow.state);
    sleepState.worldTime = { originAt: Date.now() - 100000, offsetMs: 0, sleep: null };
    sleepState.work.nextWorkAt = Date.now() + 600000;
    sleepDb
      .prepare('UPDATE characters SET state=? WHERE user_id=?')
      .run(JSON.stringify(sleepState), sleepRow.user_id);
    const rest = await request('sleep', { skippedMs: 999999999 });
    assert.equal(rest.status, 200);
    assert.ok(rest.body.skippedMs > 250000 && rest.body.skippedMs < 260000);
    assert.equal((await request('sleep', {})).status, 409);
    assert.equal((await request('buy', { id: 'mug' })).status, 409);
    assert.equal(
      (await request('position', { map: 'city', x: 600, y: 420 })).body.state.position.map,
      'house',
    );
    const sleeping = (await request('state')).body.state;
    assert.ok(sleeping.world.sleep);
    const stored = JSON.parse(sleepDb.prepare('SELECT state FROM characters').get().state);
    stored.worldTime.sleep.startedAt = Date.now() - 9000;
    stored.worldTime.sleep.endsAt = Date.now() - 1000;
    sleepDb
      .prepare('UPDATE characters SET state=? WHERE user_id=?')
      .run(JSON.stringify(stored), sleepRow.user_id);
    const awake = (await request('state')).body.state;
    assert.equal(awake.world.sleep, null);
    assert.equal(awake.world.night, true);
    assert.equal(awake.money, sleepState.money);
    assert.equal(awake.xp, sleepState.xp);
    assert.equal(awake.work.nextWorkAt, sleepState.work.nextWorkAt - rest.body.skippedMs);
    assert.equal((await request('state')).body.state.work.nextWorkAt, awake.work.nextWorkAt);
    const legacy = JSON.parse(sleepDb.prepare('SELECT state FROM characters').get().state);
    legacy.work.completed = oldWorks.slice(0, 10).map((work) => work.id);
    legacy.money = 1234;
    delete legacy.economyVersion;
    sleepDb
      .prepare('UPDATE characters SET state=? WHERE user_id=?')
      .run(JSON.stringify(legacy), sleepRow.user_id);
    const migrated = (await request('state')).body.state;
    assert.equal(migrated.money, 1234 + 2450);
    assert.equal(migrated.xp, legacy.xp);
    assert.deepEqual(migrated.inventory, legacy.inventory);
    assert.equal((await request('state')).body.state.money, migrated.money);
    const persistedMigration = JSON.parse(
      sleepDb.prepare('SELECT state FROM characters').get().state,
    );
    assert.equal(persistedMigration.economyVersion, 3);
    assert.equal(persistedMigration.money, migrated.money);
    sleepDb.close();
    const evil = await fetch(`http://127.0.0.1:${port}/api/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
        Origin: 'https://outro-site.example',
      },
      body: JSON.stringify({ id: 'plant' }),
    });
    assert.equal(evil.status, 403);
  } finally {
    if(server.exitCode===null&&server.signalCode===null){const exited=new Promise(r=>server.once('exit',r));server.kill();await exited;}
    rmSync(dir, { recursive: true, force: true });
  }
});
