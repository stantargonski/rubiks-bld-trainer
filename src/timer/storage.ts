import { emptyTimerStore, type Session, type Solve, type TimerStore } from './types';

export const TIMER_KEY = 'timer.store.v1';   // storage slot; the version lives inside the JSON

export function loadTimerStore(): TimerStore {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    if (!raw) return emptyTimerStore();
    return migrate(JSON.parse(raw));
  } catch {
    return emptyTimerStore();
  }
}

export function saveTimerStore(store: TimerStore): void {
  localStorage.setItem(TIMER_KEY, JSON.stringify(store));
}

/**
 * v1 → v2: sessions gain `mode` and solves gain `memoMs`. Both are pure
 * additions, so every existing solve survives — it just becomes a '333' solve
 * with no memo split, which is exactly what it was.
 *
 * This runs on every load, so it has to be idempotent: a v2 store passes
 * through unchanged. It also doubles as the integrity pass — a session of
 * solves is the one thing in this app you cannot retype, and one bad record
 * from a hand-edit shouldn't blank the history. Unreadable entries are dropped;
 * everything valid survives.
 */
export function migrate(input: unknown): TimerStore {
  if (!input || typeof input !== 'object') return emptyTimerStore();

  // Deliberately not Partial<TimerStore>: that types schemaVersion as the
  // literal 2, which makes the v1 check unreachable. Incoming JSON can be any
  // version, so it has to be read as a plain number.
  const raw = input as { schemaVersion?: number; sessions?: unknown; activeId?: unknown };
  if (raw.schemaVersion !== 1 && raw.schemaVersion !== 2) return emptyTimerStore();
  if (!Array.isArray(raw.sessions)) return emptyTimerStore();

  const sessions: Session[] = raw.sessions
    .filter((session): session is Session => !!session && typeof session.id === 'string')
    .map((session) => ({
      id: session.id,
      name: typeof session.name === 'string' && session.name !== '' ? session.name : 'Session',
      mode: session.mode === '3bld' ? '3bld' : '333',
      createdAt: typeof session.createdAt === 'number' ? session.createdAt : 0,
      solves: Array.isArray(session.solves) ? session.solves.map(readSolve).filter(isSolve) : [],
    }));

  if (sessions.length === 0) return emptyTimerStore();

  // A dangling activeId would leave the UI with no session to render.
  const active = sessions.find((session) => session.id === raw.activeId);
  return { schemaVersion: 2, sessions, activeId: (active ?? sessions[0]).id };
}

/** Fills in the v2 field. A v1 solve has no memoMs at all; null is correct. */
function readSolve(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const solve = value as Partial<Solve>;
  return {
    ...solve,
    memoMs:
      typeof solve.memoMs === 'number' && Number.isFinite(solve.memoMs) ? solve.memoMs : null,
  };
}

function isSolve(value: unknown): value is Solve {
  const solve = value as Partial<Solve> | null;
  return (
    !!solve &&
    typeof solve.id === 'number' &&
    typeof solve.ms === 'number' &&
    Number.isFinite(solve.ms) &&
    (solve.memoMs === null || typeof solve.memoMs === 'number') &&
    (solve.penalty === 'none' || solve.penalty === 'plus2' || solve.penalty === 'dnf') &&
    typeof solve.scramble === 'string'
  );
}
