export type Penalty = 'none' | 'plus2' | 'dnf';

/** What a session is timing. Drives the scramble, the phase machine and the
    stats — a BLD session splits memo from execution, a 3x3 one doesn't. */
export type PuzzleMode = '333' | '3bld';

export interface Solve {
  id: number;        // Date.now() at the moment the solve stopped — also its timestamp
  ms: number;        // the raw total, never adjusted
  /** Time from start to the memo split, or null for a solve that wasn't split.
      Execution is always `ms - memoMs`, so it's never stored twice. */
  memoMs: number | null;
  penalty: Penalty;
  scramble: string;
}

export interface Session {
  id: string;
  name: string;
  mode: PuzzleMode;
  createdAt: number;
  /** Chronological, oldest first. The list UI reverses for display; the stats
      helpers rely on this order so `slice(-n)` means "the most recent n". */
  solves: Solve[];
}

export interface TimerStore {
  schemaVersion: 2;
  sessions: Session[];
  activeId: string;
}

/**
 * The one number every average and best is derived from. Penalties live beside
 * the raw time rather than baked into it, so toggling +2 off restores the
 * original reading exactly.
 *
 * DNF as Infinity is deliberate: it sorts and compares as the worst possible
 * time, which is precisely how WCA averages are supposed to treat it, so the
 * trimming code needs no special case.
 */
export function effectiveMs(solve: Solve): number {
  if (solve.penalty === 'dnf') return Infinity;
  return solve.penalty === 'plus2' ? solve.ms + 2000 : solve.ms;
}

/** Execution time, derived rather than stored so it can never disagree. */
export function execMs(solve: Solve): number | null {
  return solve.memoMs === null ? null : solve.ms - solve.memoMs;
}

export function newSolve(ms: number, memoMs: number | null, scramble: string): Solve {
  return { id: Date.now(), ms, memoMs, penalty: 'none', scramble };
}

export function newSession(name: string, mode: PuzzleMode = '333'): Session {
  const createdAt = Date.now();
  return { id: `s${createdAt.toString(36)}`, name, mode, createdAt, solves: [] };
}

export function emptyTimerStore(): TimerStore {
  const first = newSession('Session 1');
  return { schemaVersion: 2, sessions: [first], activeId: first.id };
}

/** Storage guarantees at least one session, so this always returns one. */
export function activeSession(store: TimerStore): Session {
  return store.sessions.find((session) => session.id === store.activeId) ?? store.sessions[0];
}
