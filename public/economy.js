export const CHARACTER_EDIT_COST = 1000; // Centavos de dólar por abertura.
// Cada nível pede dez XP a mais que o anterior: 150, 160, 170...
export function xpForLevel(level) {
  const steps = Math.max(0, level - 1);
  return 150 * steps + 5 * steps * (steps - 1);
}
export function levelForXp(xp) {
  return Math.min(100, 1 + Math.floor((Math.sqrt(21025 + 20 * Math.max(0, xp)) - 145) / 10));
}
export function levelProgress(xp) {
  const level = levelForXp(xp);
  if (level === 100)
    return {
      level,
      start: xpForLevel(100),
      next: xpForLevel(100),
      value: 1,
      required: 1,
      maxed: true,
    };
  const start = xpForLevel(level),
    next = xpForLevel(level + 1);
  return { level, start, next, value: xp - start, required: next - start };
}
