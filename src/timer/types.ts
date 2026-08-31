export type Penalty = 'none' | 'plus2' | 'dnf';

export interface Solve {
  id: number;        // Date.now() at the moment the solve stopped — also its timestamp
  ms: number;        // the raw reading, never adjusted
  penalty: Penalty;
  scramble: string;
}

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  /** Chronological, oldest first. The list UI reverses for display; the stats
      helpers rely on this order so `slice(-n)` means "the most recent n". */
  solves: Solve[];
}

export interface TimerStore {
  schemaVersion: 1;
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

export function newSolve(ms: number, scramble: string): Solve {
  return { id: Date.now(), ms, penalty: 'none', scramble };
}

export function newSession(name: string): Session {
  const createdAt = Date.now();
  return { id: `s${createdAt.toString(36)}`, name, createdAt, solves: [] };
}

export function emptyTimerStore(): TimerStore {
  const first = newSession('Session 1');
  return { schemaVersion: 1, sessions: [first], activeId: first.id };
}

/** Storage guarantees at least one session, so this always returns one. */
export function activeSession(store: TimerStore): Session {
  return store.sessions.find((session) => session.id === store.activeId) ?? store.sessions[0];
}
