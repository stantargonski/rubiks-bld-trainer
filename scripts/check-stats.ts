/**
 * Asserts the averages say what they should, and in particular that adding
 * ao100 left ao5, ao12 and the competition simulator exactly where they were.
 *
 * Run with `npm run check:stats`.
 *
 * The trim used to be a hardcoded one from each end. It is now `trimCount(size)`
 * so that an ao100 can drop five and five like every other timer, and the thing
 * most worth pinning down is that this rescaling is invisible at the sizes that
 * already existed — a silent shift in ao5 would rewrite every session's history
 * without touching a single stored solve.
 */
import { FORMATS, resultOf } from '../src/timer/comp';
import {
  average, best, bestAverage, mean, rollingAverages, stdev, trimCount, trimmedAverage,
} from '../src/timer/stats';
import type { Penalty, Solve } from '../src/timer/types';

const failures: string[] = [];

function check(ok: boolean, message: string): void {
  if (!ok) failures.push(message);
}

function eq(actual: number, expected: number, why: string): void {
  // NaN and Infinity are results here, not errors, so they compare by identity;
  // a real time divides, so it compares with room for the last bit.
  const same = Number.isNaN(expected) || !Number.isFinite(expected)
    ? Object.is(actual, expected)
    : Math.abs(actual - expected) < 1e-6;
  check(same, `${why}: expected ${expected}, got ${actual}`);
}

/** A solve list from raw times, with `dnf` written as a penalty rather than a time. */
function solvesOf(times: (number | 'dnf')[]): Solve[] {
  return times.map((time, index) => {
    const penalty: Penalty = time === 'dnf' ? 'dnf' : 'none';
    return {
      id: 1_700_000_000_000 + index * 60_000,
      ms: time === 'dnf' ? 30_000 : time,
      memoMs: null,
      penalty,
      scramble: '',
      event: '333',
    };
  });
}

// ---- how much comes off each end ----

eq(trimCount(3), 1, 'an ao3 trims one apiece');
eq(trimCount(5), 1, 'an ao5 trims one apiece — the WCA rule');
eq(trimCount(12), 1, 'an ao12 trims one apiece');
eq(trimCount(19), 1, 'still one at nineteen, just under the 5% threshold');
eq(trimCount(20), 1, 'exactly one at twenty');
eq(trimCount(100), 5, 'an ao100 trims five apiece');

// ---- ao5 and ao12 are untouched by the rescaling ----

// 9, 10, 11, 12, 13: drop 9 and 13, mean 10, 11, 12.
eq(trimmedAverage([9000, 10_000, 11_000, 12_000, 13_000]), 11_000, 'ao5 of a run of five');
eq(average(solvesOf([9000, 10_000, 11_000, 12_000, 13_000]), 5), 11_000, 'ao5 through average()');

// Order must not matter — the window is sorted before it is trimmed.
eq(trimmedAverage([13_000, 9000, 12_000, 10_000, 11_000]), 11_000, 'ao5 ignores the order it arrives in');

const TWELVE = [
  10_000, 11_000, 12_000, 13_000, 14_000, 15_000,
  16_000, 17_000, 18_000, 19_000, 20_000, 21_000,
];
// Drop 10 and 21, mean the ten between them: 11..20 averages 15.5.
eq(average(solvesOf(TWELVE), 12), 15_500, 'ao12 of a run of twelve');

// ---- the competition simulator scores rounds exactly as before ----

eq(resultOf(FORMATS.ao5, [9000, 10_000, 11_000, 12_000, 13_000]), 11_000, 'an ao5 round');
eq(resultOf(FORMATS.mo3, [10_000, 11_000, 12_000]), 11_000, 'an mo3 round trims nothing');
eq(resultOf(FORMATS.ao5, [10_000, 11_000, 12_000]), NaN, 'an unfinished round has no result');
eq(
  resultOf(FORMATS.ao5, [9000, 10_000, 11_000, 12_000, Infinity]),
  11_000,
  'one DNF in a round is the trimmed worst',
);
eq(
  resultOf(FORMATS.ao5, [9000, 10_000, 11_000, Infinity, Infinity]),
  Infinity,
  'two DNFs in a round is a DNF',
);

// ---- ao100 ----

/** A hundred solves of 10.000 to 19.900, with `dnfs` of them failed. */
function hundred(dnfs: number): Solve[] {
  const times: (number | 'dnf')[] = [];
  for (let i = 0; i < 100; i += 1) times.push(i < dnfs ? 'dnf' : 10_000 + i * 100);
  return solvesOf(times);
}

eq(average(solvesOf([10_000]), 100), NaN, 'no ao100 from one solve');
eq(average(hundred(0).slice(0, 99), 100), NaN, 'no ao100 from ninety-nine solves');
check(Number.isFinite(average(hundred(0), 100)), 'an ao100 lands the moment the hundredth solve does');
check(Number.isFinite(average(hundred(5), 100)), 'five DNFs are exactly absorbed by the trim');
eq(average(hundred(6), 100), Infinity, 'a sixth DNF outlives the trim and the average is a DNF');

// The five fastest and five slowest are gone, so the two ends cannot move it.
const clean = hundred(0);
const skewed = solvesOf([
  ...Array.from({ length: 5 }, () => 1),
  ...clean.slice(5, 95).map((solve) => solve.ms),
  ...Array.from({ length: 5 }, () => 600_000),
]);
eq(
  average(skewed, 100),
  average(clean, 100),
  'five absurd solves at each end are trimmed away entirely',
);

// ---- best-of and rolling, at the new size ----

const RUN = solvesOf([12_000, 11_000, 10_000, 11_000, 12_000, 30_000, 31_000, 32_000]);
eq(best(RUN), 10_000, 'best single');
eq(bestAverage(RUN, 5), average(solvesOf([12_000, 11_000, 10_000, 11_000, 12_000]), 5),
  'the best ao5 is the first window, not the last');
eq(bestAverage(RUN, 100), NaN, 'no best ao100 without a hundred solves');
eq(bestAverage(hundred(0), 100), average(hundred(0), 100), 'one window means best equals current');

const rolling = rollingAverages(hundred(0), 100);
eq(rolling.length, 100, 'a rolling series is aligned with the solves');
check(rolling.slice(0, 99).every(Number.isNaN), 'the rolling ao100 is blank until the hundredth');
eq(rolling[99], average(hundred(0), 100), 'and its last point is the current ao100');

// ---- the rest of the panel, guarded against collateral damage ----

eq(mean(solvesOf([10_000, 11_000, 12_000])), 11_000, 'the mean trims nothing');
eq(mean(solvesOf([10_000, 'dnf'])), Infinity, 'one DNF is the whole mean');
eq(best(solvesOf([])), NaN, 'no best without solves');
eq(stdev(solvesOf([11_000, 11_000, 11_000])), 0, 'no deviation in a flat run');

if (failures.length > 0) {
  console.error(`✗ ${failures.length} failure(s):`);
  for (const message of failures) console.error(`  ${message}`);
  process.exit(1);
}

console.log('✓ averages hold, ao5 and ao12 unchanged by the ao100 trim');
