/**
 * Asserts the clock says the right thing in every state it can be in.
 *
 * Run with `npm run check:timer`.
 *
 * The timer's moving parts are requestAnimationFrame loops and key handlers,
 * which need a browser. What the clock *reads* given a state does not, and it is
 * where the branching lives: inspection counting down, turning into a penalty,
 * the three running-display modes, and the rule that the previous solve stays on
 * screen until the next one starts.
 */
import { clockPhase, clockText, isInspecting, penaltyFor } from '../src/timer/display';
import { INSPECT_DNF_MS, INSPECT_MS } from '../src/timer/useTimer';
import { formatTime } from '../src/timer/format';
import { averageText } from '../src/timer/averageText';
import { sessionCsv, solvesCsv } from '../src/data/backup';
import { newSession, type Solve } from '../src/timer/types';

const failures: string[] = [];

function check(ok: boolean, message: string): void {
  if (!ok) failures.push(message);
}

function reads(input: Partial<Parameters<typeof clockText>[0]>, expected: string, why: string): void {
  const actual = clockText({
    phase: 'idle', ms: 0, inspectMs: 0, decimals: 2, runningDisplay: 'tenths', ...input,
  });
  check(actual === expected, `${why}: expected "${expected}", got "${actual}"`);
}

// ---- the previous time survives until the next solve begins ----

const PREVIOUS = 12_345;
for (const phase of ['idle', 'holding', 'ready'] as const) {
  reads(
    { phase, ms: PREVIOUS },
    formatTime(PREVIOUS, 2),
    `${phase} should still show the last solve`,
  );
}
// ...and is gone the instant it starts, because the hook zeroes ms there.
reads({ phase: 'running', ms: 0 }, '0.0', 'a running solve starts from zero');

// ---- running display modes ----

reads({ phase: 'running', ms: 12_345, runningDisplay: 'tenths' }, '12.3', 'tenths');
reads({ phase: 'running', ms: 12_345, runningDisplay: 'seconds' }, '12', 'seconds');
reads({ phase: 'running', ms: 12_345, runningDisplay: 'hidden' }, 'solve', 'hidden');
reads({ phase: 'memo', ms: 12_345, runningDisplay: 'hidden' }, 'solve', 'hidden during memo');
// The setting is about the live readout only — a finished solve is always full.
reads({ phase: 'idle', ms: 12_345, runningDisplay: 'hidden' }, '12.34', 'a finished solve is never hidden');
reads({ phase: 'idle', ms: 12_345, decimals: 3 }, '12.345', 'three decimals when asked');

// ---- inspection ----

reads({ phase: 'inspecting', inspectMs: 0 }, '15', 'inspection starts at 15');
reads({ phase: 'inspecting', inspectMs: 1 }, '15', 'a millisecond in is still 15');
reads({ phase: 'inspecting', inspectMs: 1000 }, '14', 'one second in reads 14');
reads({ phase: 'inspecting', inspectMs: 14_999 }, '1', 'the last second reads 1');
reads({ phase: 'inspecting', inspectMs: INSPECT_MS }, '+2', 'fifteen seconds exactly is +2');
reads({ phase: 'inspecting', inspectMs: 16_500 }, '+2', 'still +2 before seventeen');
reads({ phase: 'inspecting', inspectMs: INSPECT_DNF_MS }, 'DNF', 'seventeen seconds is a DNF');
reads({ phase: 'inspecting', inspectMs: 30_000 }, 'DNF', 'and stays a DNF');

// The countdown carries through the hold that ends inspection, and through the
// armed pause after it — getting ready is part of your fifteen seconds, not a
// pause in them. 'ready' is the case that used to drop back to the last solve's
// time a moment before the next one started.
reads({ phase: 'holding', inspectMs: 3000, ms: PREVIOUS }, '12', 'the hold keeps counting down');
reads({ phase: 'ready', inspectMs: 3000, ms: PREVIOUS }, '12', 'an armed timer keeps counting down');
reads({ phase: 'ready', inspectMs: INSPECT_MS }, '+2', 'and still names the penalty it earned');
// But a hold or an arm with no inspection behind it shows the last solve.
reads({ phase: 'holding', inspectMs: 0, ms: PREVIOUS }, formatTime(PREVIOUS, 2), 'no inspection, no countdown');
reads({ phase: 'ready', inspectMs: 0, ms: PREVIOUS }, formatTime(PREVIOUS, 2), 'nor when armed without it');

check(isInspecting('inspecting', 0), 'inspecting is inspecting even at zero elapsed');
check(isInspecting('holding', 1), 'a hold during inspection still counts as inspecting');
check(isInspecting('ready', 1), 'and so does the arm that follows it');
check(!isInspecting('holding', 0), 'a plain hold is not inspection');
check(!isInspecting('ready', 0), 'nor is a plain arm');
check(!isInspecting('running', 5000), 'a running solve is not inspection');

// ---- penalties ----

check(penaltyFor(0) === 'none', 'no penalty at the start');
check(penaltyFor(INSPECT_MS - 1) === 'none', 'no penalty just under fifteen');
check(penaltyFor(INSPECT_MS) === 'plus2', '+2 at fifteen');
check(penaltyFor(INSPECT_DNF_MS - 1) === 'plus2', '+2 just under seventeen');
check(penaltyFor(INSPECT_DNF_MS) === 'dnf', 'DNF at seventeen');

// ---- the colour the clock wears ----

check(clockPhase('idle', 0) === 'idle', 'idle looks idle');
check(clockPhase('holding', 0) === 'holding', 'holding looks holding');
check(clockPhase('inspecting', 1000) === 'inspecting', 'a healthy countdown looks normal');
check(clockPhase('inspecting', INSPECT_MS) === 'over', 'a countdown past fifteen looks wrong');
check(clockPhase('inspecting', INSPECT_DNF_MS) === 'over', 'and past seventeen too');

// ---- the CSV, and the block an average copies out as ----

/** A run of solves with known times, so the text they produce is known too. */
function solvesOf(times: number[]): Solve[] {
  return times.map((ms, index) => ({
    id: 1_700_000_000_000 + index * 60_000,
    ms,
    memoMs: null,
    penalty: 'none' as const,
    scramble: `R U R' scramble ${index + 1}`,
    event: '333' as const,
  }));
}

const sample = solvesOf([12_340, 15_010, 13_500, 11_020, 14_770]);
const session = { ...newSession('test'), solves: sample };

// sessionCsv delegates to solvesCsv now. The point of the split is that it
// changed nothing about what a session exports.
check(
  sessionCsv(session) === solvesCsv(sample),
  'a session exports exactly what its solves export',
);
check(
  sessionCsv(session).split('\n').length === sample.length + 1,
  'the CSV is a header plus one row per solve',
);
check(
  sessionCsv(session).startsWith('no,event,time,penalty,effective,memo,exec,date,scramble'),
  'the CSV columns are unchanged',
);

const block = averageText('ao5', sample, 2);
const lines = block.split('\n');

check(
  /^From tstimer, taken on \d{4}-\d{2}-\d{2}$/.test(lines[0]),
  `the block opens by saying where it came from and when, got "${lines[0]}"`,
);
check(lines[1] === 'ao5: 13.53', `the average comes next, got "${lines[1]}"`);
check(lines[2] === '', 'a blank line separates the average from its solves');
// Provenance, header, blank, one line per solve.
check(lines.length === sample.length + 3, 'one line per solve, in the order they happened');
check(
  averageText('ao5', sample, 2, undefined, new Date(2026, 0, 15))
    .startsWith('From tstimer, taken on 2026-01-15'),
  'the provenance line carries the date the block was taken',
);
check(
  block.split('From tstimer').length === 2,
  'and it is said once, not once at each end',
);
// The reason the headline can be pinned at all: a one-solve window trims away
// to nothing, so the average of it is not a number worth printing.
check(
  averageText('best single', [sample[0]], 2, 12340).split('\n')[1] === 'best single: 12.34',
  'an explicit headline overrides the trimmed average',
);
// An ao5 trims one from each end: the 11.02 and the 15.01, and nothing else.
check(
  lines.filter((line) => line.includes('(')).length === 2,
  'exactly the trimmed pair is bracketed',
);
// Provenance, headline, blank — so the first solve is line 3.
check(lines[6].includes('(11.02)'), 'the best of the five is bracketed as trimmed');
check(lines[4].includes('(15.01)'), 'the worst of the five is bracketed as trimmed');
check(lines[3].includes("R U R' scramble 1"), 'each line carries its own scramble');

if (failures.length > 0) {
  console.error(`✗ ${failures.length} failure(s):`);
  for (const message of failures) console.error(`  ${message}`);
  process.exit(1);
}

console.log('✓ the clock reads correctly in every state, inspection and penalties included');
