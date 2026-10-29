// Client-safe: no Prisma imports. Used by validation, forms and pages (#12),
// and by score formatting later (#17).

/**
 * "12:00" → 720, "1:05:00" → 3900. Minutes may exceed 59 without hours
 * ("90:00"). Returns null for anything else, including bare numbers:
 * "12" is ambiguous (minutes or seconds?), so it's rejected.
 */
export function parseClock(input: string): number | null {
  const parts = input.trim().split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  if (!parts.every((p) => /^\d+$/.test(p))) return null;

  const [s, m, h = 0] = parts.map(Number).reverse();
  if (parts[parts.length - 1].length !== 2 || s > 59) return null;
  if (parts.length === 3 && (parts[1].length !== 2 || m > 59)) return null;
  return h * 3600 + m * 60 + s;
}

/** 720 → "12:00", 3900 → "1:05:00". Expects a non-negative integer. */
export function formatClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
