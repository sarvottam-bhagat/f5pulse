// Monotonic-ish ID generator for records created at runtime (not part of
// the seed). Uses a module-level counter seeded from a random start so IDs
// created in the same session don't collide, prefixed by record kind.

let counter = Math.floor(Math.random() * 1_000_000);

export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}_rt_${counter.toString(36)}`;
}
