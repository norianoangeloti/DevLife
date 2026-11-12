export const PHASE_MS = 6 * 60 * 1000;
export const SLEEP_MS = 8000;
// UTC evita que mudanças de fuso alterem a duração dos dias do calendário.
export function calendarAt(clockMs, startDate) {
  const [year, month, day] = startDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + Math.floor(Math.max(0, clockMs) / (2 * PHASE_MS)));
  return { day: date.getUTCDate(), month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
}
export function cycleAt(clockMs) {
  const phase = Math.floor(clockMs / PHASE_MS);
  const elapsedMs = clockMs % PHASE_MS;
  return {
    night: phase % 2 === 1,
    day: Math.floor(phase / 2) + 1,
    remainingMs: PHASE_MS - elapsedMs,
  };
}
export function ensureWorld(state, now = Date.now()) {
  state.worldTime ??= { originAt: now, offsetMs: 0, sleep: null };
}
export function worldClock(state, now = Date.now()) {
  ensureWorld(state, now);
  const world = state.worldTime;
  if (world.sleep) {
    const sleep = world.sleep;
    const fraction = Math.max(
      0,
      Math.min(1, (now - sleep.startedAt) / (sleep.endsAt - sleep.startedAt)),
    );
    return (
      sleep.fromClockMs +
      (sleep.targetClockMs - sleep.fromClockMs) * fraction +
      Math.max(0, now - sleep.endsAt)
    );
  }
  return Math.max(0, now - world.originAt + world.offsetMs);
}
// Acordar é idempotente: recarregar a página não desconta o intervalo duas vezes.
export function settleSleep(state, now = Date.now()) {
  ensureWorld(state, now);
  const sleep = state.worldTime.sleep;
  if (!sleep || now < sleep.endsAt) return false;
  state.worldTime.offsetMs = sleep.targetClockMs - (sleep.endsAt - state.worldTime.originAt);
  if (state.work?.nextWorkAt > 0)
    state.work.nextWorkAt = Math.max(sleep.endsAt, state.work.nextWorkAt - sleep.skippedMs);
  // O descanso exige um ciclo completo após acordar, inclusive ao atravessar a virada do dia.
  state.worldTime.nextSleepClockMs = sleep.targetClockMs + 2 * PHASE_MS;
  state.worldTime.sleep = null;
  return true;
}
export function beginSleep(state, now = Date.now()) {
  ensureWorld(state, now);
  settleSleep(state, now);
  if (state.worldTime.sleep) return { status: 409, error: 'Você já está dormindo.' };
  const clockMs = worldClock(state, now);
  const waitMs = Math.max(0, (state.worldTime.nextSleepClockMs || 0) - clockMs);
  if (waitMs > 0) {
    const seconds = Math.ceil(waitMs / 1000);
    const countdown = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    return {
      status: 409,
      error: `Você já descansou. Aguarde um dia completo do jogo para dormir novamente: ${countdown}.`,
      remainingMs: waitMs,
    };
  }
  const remainingMs = cycleAt(clockMs).remainingMs;
  const durationMs = Math.min(SLEEP_MS, remainingMs);
  state.worldTime.sleep = {
    startedAt: now,
    endsAt: now + durationMs,
    fromClockMs: clockMs,
    targetClockMs: clockMs + remainingMs,
    skippedMs: remainingMs - durationMs,
  };
  return { status: 200, durationMs, skippedMs: remainingMs - durationMs };
}
export function worldSnapshot(state, now = Date.now()) {
  const clockMs = worldClock(state, now);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(state.worldTime.originAt));
  const part = (type) => parts.find((value) => value.type === type).value;
  const startDate = `${part('year')}-${part('month')}-${part('day')}`;
  return {
    ...cycleAt(clockMs),
    calendar: calendarAt(clockMs, startDate),
    startDate,
    clockMs,
    serverNow: now,
    sleep: state.worldTime.sleep,
    nextSleepClockMs: state.worldTime.nextSleepClockMs || 0,
    sleepRemainingMs: Math.max(0, (state.worldTime.nextSleepClockMs || 0) - clockMs),
  };
}
