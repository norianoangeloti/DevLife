import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PHASE_MS,
  SLEEP_MS,
  cycleAt,
  calendarAt,
  beginSleep,
  settleSleep,
  worldClock,
  worldSnapshot,
} from '../public/day-cycle.js';
import { stationAt, blocked } from '../public/navigation.js';

const player = () => ({
  worldTime: { originAt: 0, offsetMs: 0, sleep: null },
  work: { nextWorkAt: 700000 },
  xp: 123,
  money: 456,
});

test('Calendário respeita meses, virada de ano e fevereiro bissexto', () => {
  const days = (count) => count * 2 * PHASE_MS;
  assert.deepEqual(calendarAt(days(51), '2026-01-01'), { day: 21, month: 2, year: 2026 });
  assert.deepEqual(calendarAt(days(1), '2026-01-31'), { day: 1, month: 2, year: 2026 });
  assert.deepEqual(calendarAt(days(1), '2026-04-30'), { day: 1, month: 5, year: 2026 });
  assert.deepEqual(calendarAt(days(1), '2026-12-31'), { day: 1, month: 1, year: 2027 });
  assert.deepEqual(calendarAt(days(1), '2028-02-28'), { day: 29, month: 2, year: 2028 });
  assert.deepEqual(calendarAt(days(2), '2028-02-28'), { day: 1, month: 3, year: 2028 });
  assert.deepEqual(calendarAt(days(1), '2100-02-28'), { day: 1, month: 3, year: 2100 });
});
test('Ciclo alterna dia e noite, aumenta o dia e conta até a próxima mudança', () => {
  assert.deepEqual(cycleAt(0), { night: false, day: 1, remainingMs: PHASE_MS });
  assert.equal(cycleAt(PHASE_MS - 1).remainingMs, 1);
  assert.equal(cycleAt(PHASE_MS).night, true);
  assert.equal(cycleAt(2 * PHASE_MS).day, 2);
  assert.equal(cycleAt(2 * PHASE_MS).night, false);
});
test('Dormir acelera o tempo até trocar de período e desconta uma vez a espera', () => {
  const state = player();
  const result = beginSleep(state, 10000);
  assert.equal(result.durationMs, SLEEP_MS);
  assert.equal(result.skippedMs, PHASE_MS - 10000 - SLEEP_MS);
  assert.equal(beginSleep(state, 10001).status, 409);
  assert.equal(settleSleep(state, 17999), false);
  assert.equal(worldClock(state, 14000), (10000 + PHASE_MS) / 2);
  assert.equal(settleSleep(state, 18000), true);
  assert.equal(worldClock(state, 18000), PHASE_MS);
  assert.equal(worldSnapshot(state, 18000).night, true);
  assert.equal(state.work.nextWorkAt, 700000 - result.skippedMs);
  assert.equal(settleSleep(state, 18000), false);
  assert.equal(state.xp, 123);
  assert.equal(state.money, 456);
});
test('Sono persiste ao recarregar, acorda de noite para dia e libera trabalho sem saldo negativo', () => {
  const state = player();
  state.worldTime.offsetMs = PHASE_MS;
  state.work.nextWorkAt = 50000;
  beginSleep(state, 10000);
  const restored = JSON.parse(JSON.stringify(state));
  settleSleep(restored, 20000);
  assert.equal(worldSnapshot(restored, 20000).night, false);
  assert.equal(worldSnapshot(restored, 20000).day, 2);
  assert.equal(worldClock(restored, 20000), 2 * PHASE_MS + 2000);
  assert.equal(restored.work.nextWorkAt, 18000);
});
test('Dormir perto da mudança não atrasa o tempo e a cama tem acesso sem atravessar colchão', () => {
  const state = player();
  assert.equal(beginSleep(state, PHASE_MS - 500).durationMs, 500);
  assert.equal(settleSleep(state, PHASE_MS), true);
  assert.equal(worldClock(state, PHASE_MS), PHASE_MS);
  const position = { x: 308, y: 485 };
  assert.equal(blocked(position, 'house'), false);
  assert.equal(stationAt(position, 'house').id, 'bed');
});

test('Novo sono exige dia e noite completos após acordar e o limite persiste', () => {
  for (const offset of [0, PHASE_MS]) {
    const state = player();
    state.worldTime.offsetMs = offset;
    beginSleep(state, 10000);
    settleSleep(state, 18000);
    const restored = JSON.parse(JSON.stringify(state));
    const cooldown = 2 * PHASE_MS;
    const money = restored.money;
    const nextWorkAt = restored.work.nextWorkAt;
    assert.equal(worldSnapshot(restored, 18000).sleepRemainingMs, cooldown);
    assert.equal(beginSleep(restored, 18000).status, 409);
    assert.equal(beginSleep(restored, 18000 + cooldown - 1).status, 409);
    assert.equal(restored.money, money);
    assert.equal(restored.work.nextWorkAt, nextWorkAt);
    assert.equal(beginSleep(restored, 18000 + cooldown).status, 200);
  }
});
