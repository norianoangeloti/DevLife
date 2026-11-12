import {seedRegionalPrerequisites} from './helpers/expansion-access.js';
import { alternativeAnswer } from './helpers/school-alternatives.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  schoolLessons,
  schoolExams,
  schoolStages,
  availableLesson,
  validateSchool,
} from '../school-content.js';
import { checkProject, referenceProject } from '../project-exams.js';
import { works, careerTiers, recruitmentExams, validateWork } from '../career-content.js';
import { levelForXp, levelProgress, xpForLevel } from '../public/economy.js';

test('As três áreas têm 10, 20 e 40 aulas distintas e nove provas com critérios reais', () => {
  assert.equal(schoolLessons.length, 210);
  assert.equal(schoolExams.length, 9);
  for (const area of ['HTML', 'CSS', 'JavaScript'])
    for (const stage of schoolStages) {
      const lessons = schoolLessons.filter((l) => l.area === area && l.stage === stage.id);
      assert.equal(lessons.length, stage.count);
      assert.equal(new Set(lessons.map((l) => l.solution)).size, stage.count);
      for (const l of lessons) {
        assert.ok(validateSchool(l.id, l.solution), l.id);
        assert.ok(!validateSchool(l.id, l.starter), l.id);
      }
      assert.deepEqual(checkProject(area, stage.id, referenceProject(stage.id)), []);
      assert.ok(
        checkProject(area, stage.id, {
          html: '<!-- <main id="conteudo">fake</main> -->',
          css: '/* body { color:white } */',
          js: '// resposta ausente',
        }).length,
      );
    }
  const intermediate = schoolLessons.find((l) => l.area === 'HTML' && l.stage === 'intermediate');
  assert.equal(availableLesson({ completed: [] }, intermediate), false);
  assert.equal(availableLesson({ completed: ['exam-html-beginner'] }, intermediate), true);
  const advanced = referenceProject('advanced');
  assert.ok(
    checkProject('HTML', 'advanced', { ...advanced, html: advanced.html.replace('required', '') })
      .length,
  );
  assert.ok(
    checkProject('CSS', 'advanced', {
      ...advanced,
      css: advanced.css.replace('grid-template-columns: 1fr', 'grid-template-columns: 3fr'),
    }).length,
  );
  assert.ok(
    checkProject('JavaScript', 'advanced', {
      ...advanced,
      js: advanced.js.replace('evento.preventDefault();', ''),
    }).length,
  );
});
test('Os 150 tickets são bugs de arquivos completos com escopo de cada cargo', () => {
  assert.deepEqual(
    careerTiers.map((t) => t.count),
    [10, 20, 30, 40, 50],
  );
  for (const tier of careerTiers) {
    const group = works.filter((w) => w.tier === careerTiers.indexOf(tier));
    assert.equal(group.length, tier.count);
    assert.ok(group.every((w) => tier.areas.includes(w.area)));
  }
  for (const work of works) {
    assert.ok(validateWork(work.id, work.solution));
    assert.ok(!validateWork(work.id, work.starter), work.id);
    assert.ok(work.starter.length > 180, work.id);
  }
  assert.ok(works[149].starter.length > works[0].starter.length);
  assert.equal(levelForXp(xpForLevel(100) - 1), 99);
  assert.equal(levelForXp(xpForLevel(100)), 100);
  assert.equal(levelForXp(999999), 100);
  assert.equal(levelProgress(999999).maxed, true);
});

test('Conta completa escola, encadeia seus projetos e progride nos cargos somente após prova', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'devlife-campaign-')),
    port = 5100 + Math.floor(Math.random() * 500);
  const child = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, PORT: String(port), DEVLIFE_DB: path.join(dir, 'test.sqlite') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let cookie = '',
    db;
  const request = async (route, data) => {
    if(route==='character'&&!data?.editorToken){const opened=await request('character-open',{});if(opened.status!==200)return opened;data={...data,editorToken:opened.body.editorToken};}
    const response = await fetch(`http://127.0.0.1:${port}/api/${route}`, {
      method: data ? 'POST' : 'GET',
      headers: { Cookie: cookie, ...(data ? { 'Content-Type': 'application/json' } : {}) },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (response.headers.get('set-cookie'))
      cookie = response.headers.get('set-cookie').split(';')[0];
    return { status: response.status, body: await response.json() };
  };
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Servidor não iniciou')), 10000);
      child.stdout.once('data', () => {
        clearTimeout(timer);
        resolve();
      });
      child.once('error', reject);
    });
    assert.equal(
      (
        await request('register', {
          name: 'Novo Dev',
          email: 'novo@example.com',
          password: 'senha12345',
        })
      ).status,
      200,
    );
    const first = (await request('state')).body;
    assert.equal(first.schoolLessons.length, 210);
    assert.equal(first.schoolExams.length, 9);
    assert.equal(first.works.length, 150);
    assert.equal(first.schoolLessons.length, 210);
    assert.ok(first.schoolLessons.every((lesson) => lesson.lesson?.explanation && lesson.lesson?.example));
    assert.equal(first.state.inventory.length, 25);
    assert.equal(first.state.money, 0);
    assert.ok(first.schoolLessons.every((l) => !('solution' in l)));
    assert.equal(
      (await request('exam', { id: 'exam-html-beginner', code: referenceProject('beginner').html }))
        .status,
      403,
    );
    const prerequisiteDb=new DatabaseSync(path.join(dir,'test.sqlite'));seedRegionalPrerequisites(prerequisiteDb,first.accountId);prerequisiteDb.close();
    for (const stage of schoolStages)
      for (const area of ['HTML', 'CSS', 'JavaScript']) {
        const lessons = schoolLessons.filter((l) => l.area === area && l.stage === stage.id);
        if (stage.id === 'beginner' && area === 'HTML') {
          assert.equal(
            (await request('school-submit', { id: lessons[1].id, code: lessons[1].solution }))
              .status,
            403,
          );
          assert.equal(
            (await request('school-submit', { id: lessons[0].id, code: '<h2>Dev School</h2>' }))
              .status,
            422,
          );
        }
        for (const lesson of lessons) {
          const delivered = await request('school-submit', {
            id: lesson.id,
            code: alternativeAnswer(lesson),
          });
          assert.equal(delivered.status, 200, lesson.id + JSON.stringify(delivered.body));
          assert.equal(delivered.body.reward.money, 0);
          if (lesson.opensGate) {
            assert.equal(delivered.body.gateOpened, true);
            assert.ok(delivered.body.state.completed.includes('js-door'));
          }
        }
        const exam = schoolExams.find((e) => e.area === area && e.stage === stage.id),
          field = { HTML: 'html', CSS: 'css', JavaScript: 'js' }[area];
        assert.equal(
          (await request('exam', { id: exam.id, code: 'resposta inválida' })).status,
          422,
        );
        const passed = await request('exam', {
          id: exam.id,
          code: referenceProject(stage.id)[field],
          html: 'não pode sobrescrever o HTML salvo',
        });
        assert.equal(passed.status, 200, exam.id + JSON.stringify(passed.body));
        assert.ok(passed.body.state.achievements.includes(exam.id));
        assert.equal(
          passed.body.state.schoolProjects[stage.id].html,
          referenceProject(stage.id).html,
        );
        assert.equal(
          (await request('exam', { id: exam.id, code: referenceProject(stage.id)[field] })).status,
          409,
        );
      }
    const educated = (await request('state')).body.state;
    assert.equal(educated.xp, 32100);
    assert.equal(educated.money, 0);
    const example = schoolLessons[0];
    assert.equal(
      (await request('practice', { id: example.id, code: example.solution })).status,
      200,
    );
    assert.equal((await request('state')).body.state.xp, educated.xp);
    assert.equal((await request('job', {})).status, 403);
    assert.equal((await request('recruit', { id: recruitmentExams[0].id, code: '' })).status, 422);
    assert.equal(
      (await request('recruit', { id: recruitmentExams[0].id, code: recruitmentExams[0].solution }))
        .status,
      200,
    );
    assert.equal(
      (await request('recruit', { id: recruitmentExams[1].id, code: recruitmentExams[1].solution }))
        .status,
      403,
    );
    db = new DatabaseSync(path.join(dir, 'test.sqlite'));
    for (const work of works) {
      const row = db.prepare('SELECT user_id,state FROM characters').get(),
        state = JSON.parse(row.state);
      state.work.nextWorkAt = 0;
      db.prepare('UPDATE characters SET state=? WHERE user_id=?').run(
        JSON.stringify(state),
        row.user_id,
      );
      if ([11, 31, 61, 101].includes(work.stage)) {
        assert.equal((await request('work', { id: work.id, code: work.solution })).status, 403);
        const exam = recruitmentExams[work.tier];
        assert.equal((await request('recruit', { id: exam.id, code: exam.solution })).status, 200);
      }
      assert.equal((await request('work', { id: work.id, code: work.starter })).status, 422);
      const passed = await request('work', { id: work.id, code: work.solution });
      assert.equal(passed.status, 200, work.id + JSON.stringify(passed.body));
      assert.equal(passed.body.state.career.completed, work.stage);
      if ([10, 30, 60, 100].includes(work.stage)) {
        assert.equal(passed.body.assessment, true);
        assert.equal(passed.body.state.career.tier, work.tier);
      }
    }
    const final = (await request('state')).body.state;
    assert.equal(final.level, 100);
    assert.equal(final.money, 193500);
    assert.equal(final.job, 'Tech Lead');
    assert.equal(final.work.nextWorkAt, 0);
    assert.ok(final.achievements.includes('level-100'));
    assert.ok(final.achievements.includes('career-complete'));
    assert.equal(final.completed.filter((id) => id.startsWith('exam-')).length, 9);
    const appearanceRow=db.prepare('SELECT user_id,state FROM characters').get();const appearanceState=JSON.parse(appearanceRow.state);appearanceState.wallets.usd=1000;db.prepare('UPDATE characters SET state=? WHERE user_id=?').run(JSON.stringify(appearanceState),appearanceRow.user_id);
    assert.equal(
      (await request('character', { pants: '#18181b', shirt: '#ffffff', hairstyle: 'curly' })).body
        .state.hairstyle,
      'curly',
    );
    const invalid = await request('character', { pants: '#ff0000', shirt: '#22c55e' });
    assert.equal(invalid.body.state.pants, '#18181b');
    assert.equal(invalid.body.state.shirt, '#ffffff');
    const sandbox = await fetch(`http://127.0.0.1:${port}/sandbox-preview.html`);
    assert.equal(sandbox.status, 200);
    assert.ok(sandbox.headers.get('content-security-policy').includes("connect-src 'none'"));
  } finally {
    db?.close();
    child.kill();
    await new Promise((resolve) => child.once('exit', resolve));
    rmSync(dir, { recursive: true, force: true });
  }
});
