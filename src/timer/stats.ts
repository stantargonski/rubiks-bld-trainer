import { effectiveMs, execMs, type Solve } from './types';

/**
 * Three return values everything downstream agrees on:
 *   a number   — a real time in ms
 *   Infinity   — DNF
 *   NaN        — no result yet (not enough solves)
 * formatTime branches on exactly these, so no caller needs a null check.
 */

export function best(solves: Solve[]): number {
  if (solves.length === 0) return NaN;

  let lowest = Infinity;
  for (const solve of solves) lowest = Math.min(lowest, effectiveMs(solve));
  return lowest;   // stays Infinity — correctly a DNF — if every solve was one
}

export function worst(solves: Solve[]): number {
  if (solves.length === 0) return NaN;

  let highest = 0;
  for (const solve of solves) highest = Math.max(highest, effectiveMs(solve));
  return highest;
}

/** Untrimmed mean of every solve. A single DNF makes the whole session mean a DNF. */
export function mean(solves: Solve[]): number {
  if (solves.length === 0) return NaN;

  let total = 0;
  for (const solve of solves) {
    const value = effectiveMs(solve);
    if (!Number.isFinite(value)) return Infinity;
    total += value;
  }
  return total / solves.length;
}

/**
 * WCA trimmed average over the most recent `size` solves: drop the single best
 * and the single worst, mean what's left.
 *
 * DNFs need no branch of their own because effectiveMs makes them Infinity, so
 * they sort to the end. One DNF lands in the trimmed-worst slot and disappears.
 * Two or more means a DNF survives the trim, and the whole average is a DNF —
 * which is what the second-highest entry being non-finite tells us.
 */
export function average(solves: Solve[], size: number): number {
  if (size < 3 || solves.length < size) return NaN;

  const window = solves.slice(-size).map(effectiveMs).sort((a, b) => a - b);
  if (!Number.isFinite(window[size - 2])) return Infinity;

  let total = 0;
  for (let i = 1; i < size - 1; i += 1) total += window[i];
  return total / (size - 2);
}

/**
 * Mean memo and mean execution over every split solve. DNFs are included:
 * memorising and executing still happened, and in BLD a DNF is usually an exec
 * failure — dropping them would flatter the memo figure you're trying to
 * improve. Solves that were never split are skipped entirely.
 */
export function meanMemo(solves: Solve[]): number {
  return meanOf(solves, (solve) => solve.memoMs);
}

export function meanExec(solves: Solve[]): number {
  return meanOf(solves, execMs);
}

function meanOf(solves: Solve[], value: (solve: Solve) => number | null): number {
  let total = 0;
  let count = 0;

  for (const solve of solves) {
    const part = value(solve);
    if (part === null) continue;
    total += part;
    count += 1;
  }
  return count === 0 ? NaN : total / count;
}

/** The best rolling average of `size` anywhere in the session. */
export function bestAverage(solves: Solve[], size: number): number {
  if (solves.length < size) return NaN;

  let lowest = Infinity;
  for (let start = 0; start + size <= solves.length; start += 1) {
    const value = average(solves.slice(start, start + size), size);
    if (value < lowest) lowest = value;
  }
  return lowest;
}
