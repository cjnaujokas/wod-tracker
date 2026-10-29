// Client-safe. Storage is kg (loadKg); conversion happens on the server in
// validation, and on display. Never round the stored value: only display rounds.
// Part of #16 pulled forward by #12.

export const LOAD_UNITS = ["lb", "kg"] as const;
export type LoadUnit = (typeof LOAD_UNITS)[number];
/** Display unit until #16 adds a per-user preference. */
export const DISPLAY_UNIT: LoadUnit = "lb";

const KG_PER_LB = 0.45359237; // exact, by definition

export function toKg(value: number, unit: LoadUnit): number {
  return unit === "kg" ? value : value * KG_PER_LB;
}

export function isLoadUnit(value: unknown): value is LoadUnit {
  return (LOAD_UNITS as readonly unknown[]).includes(value);
}

export function fromKg(kg: number, unit: LoadUnit): number {
  return unit === "kg" ? kg : kg / KG_PER_LB;
}

/** 43.09127515 kg as lb → "95 lb"; 24 kg as lb → "52.9 lb". One decimal max. */
export function formatLoad(kg: number, unit: LoadUnit): string {
  const rounded = Math.round(fromKg(kg, unit) * 10) / 10;
  return `${rounded} ${unit}`;
}
