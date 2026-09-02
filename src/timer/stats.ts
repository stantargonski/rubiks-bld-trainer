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
 * Trimmed average over the most recent `size` solves: drop the best and worst
 * `trimCount(size)` of them, mean what's left.
 *
 * DNFs need no branch of their own because effectiveMs makes them Infinity, so
 * they sort to the end. A DNF inside the trimmed-worst slots disappears; one
 * that survives the trim makes the whole average a DNF.
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

  const trim = trimCount(size);
  const window = [...values].sort((a, b) => a - b);
  // The worst entry that still counts. Non-finite means a DNF outlived the
  // trim, and one surviving DNF is the whole average.
  if (!Number.isFinite(window[size - 1 - trim])) return Infinity;

  let total = 0;
  for (let i = trim; i < size - trim; i += 1) total += window[i];
  return total / (size - 2 * trim);
}

/**
 * How many times drop from each end of an average.
 *
 * One apiece up to ao19, which is the WCA rule and keeps ao5 and ao12 exactly
 * as they were, then 5% apiece — so an ao100 drops the best five and the worst
 * five, the convention every other timer uses. Trimming only one out of a
 * hundred would make a single unlucky DNF the whole figure, which over that
 * many solves is close to guaranteed.
 */
export function trimCount(size: number): number {
  return Math.max(1, Math.floor(size * 0.05));
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
 *
 * Only the trailing window is sliced, not the whole history to date: an average
 * of five never looked at the sixth-most-recent solve, and slicing from zero
 * made this quadratic in a list the solve rail now redraws on every keystroke.
 */
export function rollingAverages(solves: Solve[], size: number): number[] {
  return solves.map((_, index) => (
    index + 1 < size
      ? NaN
      : trimmedAverage(solves.slice(index + 1 - size, index + 1).map(effectiveMs))
  ));
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

  // Reduced to effective times once for the whole session rather than once per
  // window. Going through `average` sliced the solves, sliced the copy again,
  // then mapped it — three passes a window, which ao100 pays on every one of
  // them in a rail that redraws on every clock tick.
  const times = solves.map(effectiveMs);

  let lowest = Infinity;
  for (let start = 0; start + size <= times.length; start += 1) {
    const value = trimmedAverage(times.slice(start, start + size));
    if (value < lowest) lowest = value;
  }
  return lowest;
}

/**
 * Time spent solving, as hh:mm:ss.
 *
 * Hours are not capped at 24 and every field is zero-padded, so the figure
 * sorts and compares as text and reads the same width whether it is ten minutes
 * or two hundred hours.
 */
export function durationText(ms: number): string {
  const total = !Number.isFinite(ms) || ms <= 0 ? 0 : Math.round(ms / 1000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60].map(pad).join(':');
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
