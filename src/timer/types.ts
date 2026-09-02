import { DEFAULT_EVENT, eventOf, STARTER_EVENTS, type EventId } from './events';

export type Penalty = 'none' | 'plus2' | 'dnf';

export interface Solve {
  id: number;        // Date.now() at the moment the solve stopped — also its timestamp
  ms: number;        // the raw total, never adjusted
  /** Time from start to the memo split, or null for a solve that wasn't split.
      Execution is always `ms - memoMs`, so it's never stored twice. */
  memoMs: number | null;
  penalty: Penalty;
  scramble: string;
  /** Which event this was timed under. Stored per solve rather than read off the
      session, so switching a session's event never re-files the history behind it
      and an all-time best can be asked of the solves themselves. */
  event: EventId;
}

export interface Session {
  id: string;
  name: string;
  /** What this session is timing. Drives the scramble, the phase machine and
      the stats — a blindfolded session splits memo from execution and skips
      inspection, a 3x3 one does neither. */
  event: EventId;
  createdAt: number;
  /** Chronological, oldest first. The list UI reverses for display; the stats
      helpers rely on this order so `slice(-n)` means "the most recent n". */
  solves: Solve[];
}

export interface TimerStore {
  schemaVersion: 4;
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

export function newSolve(
  ms: number,
  memoMs: number | null,
  scramble: string,
  event: EventId,
  penalty: Penalty = 'none',
): Solve {
  return { id: Date.now(), ms, memoMs, penalty, scramble, event };
}

/**
 * `seed` disambiguates sessions created in the same millisecond — ten starter
 * sessions built in one tick would otherwise all share an id, and the active
 * one would be whichever the lookup happened to find first.
 */
export function newSession(name: string, event: EventId = DEFAULT_EVENT, seed = 0): Session {
  const createdAt = Date.now();
  return {
    id: `s${createdAt.toString(36)}${seed > 0 ? `-${seed}` : ''}`,
    name,
    event,
    createdAt,
    solves: [],
  };
}

/** Ten empty sessions, one per common event, with 3x3 open. */
export function emptyTimerStore(): TimerStore {
  const sessions = STARTER_EVENTS.map((id, index) => newSession(eventOf(id).name, id, index));
  return { schemaVersion: 4, sessions, activeId: sessions[0].id };
}

/** Storage guarantees at least one session, so this always returns one. */
export function activeSession(store: TimerStore): Session {
  return store.sessions.find((session) => session.id === store.activeId) ?? store.sessions[0];
}
