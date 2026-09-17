/** Number of decimals needed to represent `n` exactly (capped at 6). */
export function decimalsOf(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const text = String(n);
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : Math.min(6, text.length - dot - 1);
}

/** The smallest distance between two values of a field, from the precision of the values seen. */
export function precisionOf(values: number[]): number {
  let decimals = 0;
  for (const v of values) decimals = Math.max(decimals, decimalsOf(v));
  return decimals === 0 ? 1 : Number((10 ** -decimals).toFixed(decimals));
}

/** Rounds away floating-point noise, e.g. 0.1 + 0.2 at one decimal. */
export function roundTo(n: number, step: number): number {
  return Number(n.toFixed(decimalsOf(step)));
}
