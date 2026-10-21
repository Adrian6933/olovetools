/** Strict one-based syntax; preserve order and support descending ranges. */
export function parsePageRange(input: string, total: number): { pages: number[]; invalid: boolean } {
  if (!input.trim()) return { pages: [], invalid: false };
  const pages = new Set<number>();
  for (const part of input.split(/[,;]/)) {
    const match = /^\s*(\d+)\s*(?:[-–]\s*(\d+)\s*)?$/.exec(part);
    if (!match) return { pages: [], invalid: true };
    const start = Number(match[1]), end = match[2] ? Number(match[2]) : start;
    if (![start, end].every(n => Number.isSafeInteger(n) && n >= 1 && n <= total)) return { pages: [], invalid: true };
    const step = start <= end ? 1 : -1;
    // Bounds are checked BEFORE expansion, including enormous pasted ranges.
    for (let n = start; ; n += step) { pages.add(n - 1); if (n === end) break; }
  }
  return { pages: [...pages], invalid: false };
}
