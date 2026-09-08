// Date helpers. All dates are treated as UTC-midnight YYYY-MM-DD strings to
// avoid timezone drift between the seed generator, the rules engine, and the
// browser. The "today" of the demo is fixed and configurable via env var so
// deadlines in seed data stay predictable regardless of when it's opened.

export const DEFAULT_DEMO_DATE = "2026-09-08";

export function getDemoToday(): string {
  const fromEnv =
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_DEMO_DATE) ||
    undefined;
  return fromEnv || DEFAULT_DEMO_DATE;
}

export function parseISODate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number): string {
  const date = parseISODate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return toISODate(date);
}

export function addHours(value: string, hours: number): string {
  const date = new Date(value);
  date.setUTCHours(date.getUTCHours() + hours);
  return date.toISOString();
}

export function daysBetween(fromISO: string, toISO: string): number {
  const from = parseISODate(fromISO);
  const to = parseISODate(toISO);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / msPerDay);
}

export function isPast(dateISO: string, asOfISO: string): boolean {
  return daysBetween(dateISO, asOfISO) > 0;
}

export function isTodayOrPast(dateISO: string, asOfISO: string): boolean {
  return daysBetween(dateISO, asOfISO) >= 0;
}

export function formatHuman(dateISO: string): string {
  const date = parseISODate(dateISO);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
