import { formatTime, type Decimals } from './format';
import { INSPECT_DNF_MS, INSPECT_MS, type Phase } from './useTimer';
import type { Penalty } from './types';
import type { RunningDisplay } from './settings';

/**
 * What the big clock reads, as a function of the timer's state.
 *
 * Pulled out of the component because it is the one piece of the timer with
 * real branching in it, and a pure function of (phase, times, settings) can be
 * checked exhaustively without a browser — which the requestAnimationFrame
 * plumbing around it cannot.
 */

export interface ClockInput {
  phase: Phase;
  /** Elapsed solve time. Holds the *previous* solve's time while idle. */
  ms: number;
  /** Elapsed inspection time, or 0 when not inspecting. */
  inspectMs: number;
  decimals: Decimals;
  runningDisplay: RunningDisplay;
}

/** Inspection is still on screen through the hold that ends it. */
export function isInspecting(phase: Phase, inspectMs: number): boolean {
  return phase === 'inspecting' || (phase === 'holding' && inspectMs > 0);
}

/** What inspection has cost you so far. */
export function penaltyFor(inspectMs: number): Penalty {
  if (inspectMs >= INSPECT_DNF_MS) return 'dnf';
  return inspectMs >= INSPECT_MS ? 'plus2' : 'none';
}

export function clockText({
  phase, ms, inspectMs, decimals, runningDisplay,
}: ClockInput): string {
  // Counting down, then naming the penalty it has earned: "17.4" tells you
  // nothing you can act on, and "DNF" tells you everything.
  if (isInspecting(phase, inspectMs)) {
    const penalty = penaltyFor(inspectMs);
    if (penalty === 'dnf') return 'DNF';
    if (penalty === 'plus2') return '+2';
    return String(Math.max(0, Math.ceil((INSPECT_MS - inspectMs) / 1000)));
  }

  if (phase === 'running' || phase === 'memo') {
    if (runningDisplay === 'hidden') return 'solve';
    return formatTime(ms, runningDisplay === 'seconds' ? 0 : 1);
  }

  // Idle, holding and ready all show the last solve, at full precision. The
  // clock is not cleared until the next solve actually starts.
  return formatTime(ms, decimals);
}

/** The class the clock wears, which is its phase unless inspection has gone bad. */
export function clockPhase(phase: Phase, inspectMs: number): string {
  if (isInspecting(phase, inspectMs) && penaltyFor(inspectMs) !== 'none') return 'over';
  return phase;
}
