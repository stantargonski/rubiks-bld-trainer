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

/**
 * Plain mean of times already reduced to their effective values. One DNF makes
 * the whole thing a DNF — there is nothing to trim it out of.
 */
export function simpleMean(values: number[]): number {
  if (values.length === 0) return NaN;

  let total = 0;
  for (const value of values) {
    if (!Number.isFinite(value)) return Infinity;
    total += value;
  }
  return total / values.length;
}

/** Untrimmed mean of every solve. A single DNF makes the whole session mean a DNF. */
export function mean(solves: Solve[]): number {
  return simpleMean(solves.map(effectiveMs));
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
  return trimmedAverage(solves.slice(-size).map(effectiveMs));
}

/**
 * The same trim over times already reduced to their effective values, so the
 * competition simulator can ask "what would this average be?" about times that
 * haven't been solved yet without inventing Solve records to hold them.
 */
export function trimmedAverage(values: number[]): number {
  const size = values.length;
  if (size < 3) return NaN;

  const window = [...values].sort((a, b) => a - b);
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

/**
 * How spread out the times are, over the finite ones. Two solvers with the same
 * average and different spreads are not the same solver: one is consistent and
 * one is lucky, and only this tells them apart.
 *
 * Population rather than sample: a session is the whole of what happened, not a
 * sample drawn from something larger.
 */
export function stdev(solves: Solve[]): number {
  const values = solves.map(effectiveMs).filter((value) => Number.isFinite(value));
  if (values.length < 2) return NaN;

  const average = values.reduce((total, value) => total + value, 0) / values.length;
  const variance = values
    .reduce((total, value) => total + (value - average) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * The ao`size` as it stood after each solve — one entry per solve, NaN for the
 * ones before there were enough. Aligned with the solves so a chart can draw it
 * straight over the singles without any index arithmetic at the call site.
 */
export function rollingAverages(solves: Solve[], size: number): number[] {
  return solves.map((_, index) => average(solves.slice(0, index + 1), size));
}

/**
 * Time spent solving. DNFs count at their raw time: the attempt happened, and
 * this is the one figure where a failed solve is not free.
 */
export function totalTime(solves: Solve[]): number {
  let total = 0;
  for (const solve of solves) total += solve.ms;
  return total;
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

/**
 * Time spent solving, as a plain count of seconds.
 *
 * No hours or minutes: this figure is read as "how much have I actually done",
 * and one number you can compare against last week beats a unit-juggling
 * "2h 45m" that you have to convert before it means anything.
 */
export function secondsSpent(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0';
  return String(Math.round(ms / 1000));
}

/** A solve's day, in the local timezone — the day you were actually solving. */
export function dayKey(when: number): string {
  const date = new Date(when);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** How many solves landed on each day. The heatmap's whole data model. */
export function dayCounts(solves: Solve[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const solve of solves) {
    const key = dayKey(solve.id);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * How fast you're improving, in seconds of ao5 per hour at the cube.
 *
 * Least-squares slope of the rolling ao5 against cumulative time spent solving,
 * rather than against solve number: an hour of 4x4 is fifty solves and an hour
 * of 2x2 is four hundred, and "per solve" would call the 2x2 session the more
 * productive one. Negative is improvement, because times go down.
 *
 * NaN until there are enough finite averages to fit a line through, which
 * formatTime already renders as an em dash.
 */
export function ao5TrendPerHour(solves: Solve[]): number {
  const averages = rollingAverages(solves, 5);

  let elapsed = 0;
  const points: { hours: number; value: number }[] = [];

  for (let i = 0; i < solves.length; i += 1) {
    elapsed += solves[i].ms;
    if (Number.isFinite(averages[i])) {
      points.push({ hours: elapsed / 3_600_000, value: averages[i] / 1000 });
    }
  }
  if (points.length < 5) return NaN;

  const n = points.length;
  const meanHours = points.reduce((total, point) => total + point.hours, 0) / n;
  const meanValue = points.reduce((total, point) => total + point.value, 0) / n;

  let covariance = 0;
  let variance = 0;
  for (const point of points) {
    const offset = point.hours - meanHours;
    covariance += offset * (point.value - meanValue);
    variance += offset * offset;
  }
  // Every solve in the same instant would divide by zero; there is no trend there.
  return variance === 0 ? NaN : covariance / variance;
}
