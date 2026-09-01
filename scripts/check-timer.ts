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

// The countdown carries through the hold that ends inspection — holding space
// to get ready is part of your fifteen seconds, not a pause.
reads({ phase: 'holding', inspectMs: 3000, ms: PREVIOUS }, '12', 'the hold keeps counting down');
// But a hold with no inspection behind it shows the last solve, not a countdown.
reads({ phase: 'holding', inspectMs: 0, ms: PREVIOUS }, formatTime(PREVIOUS, 2), 'no inspection, no countdown');

check(isInspecting('inspecting', 0), 'inspecting is inspecting even at zero elapsed');
check(isInspecting('holding', 1), 'a hold during inspection still counts as inspecting');
check(!isInspecting('holding', 0), 'a plain hold is not inspection');
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

if (failures.length > 0) {
  console.error(`✗ ${failures.length} failure(s):`);
  for (const message of failures) console.error(`  ${message}`);
  process.exit(1);
}

console.log('✓ the clock reads correctly in every state, inspection and penalties included');
