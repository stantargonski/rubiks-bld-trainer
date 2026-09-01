/**
 * The one source of randomness the scramblers share.
 *
 * Pulled out so every generator draws from the same place: it is the piece most
 * worth being able to swap for a seeded sequence when something needs
 * reproducing, and the least worth reimplementing five times.
 */
export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** An integer in [min, max], both ends included. */
export function between(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}
