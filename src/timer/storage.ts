import { DEFAULT_EVENT, isEventId, type EventId } from './events';
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
 * v1 → v2: sessions gained `mode` and solves gained `memoMs`.
 * v2 → v3: `mode` becomes a full WCA `event`, so '3bld' reads as '333bf' and
 * everything else as '333'.
 * v3 → v4: a solve records its own `event`. Older solves inherit their session's,
 * which is the best answer available and the one the app was already assuming.
 * Every step is a pure widening — no solve is ever dropped for being older than
 * the schema.
 *
 * This runs on every load, so it has to be idempotent: a v4 store passes
 * through unchanged. It also doubles as the integrity pass — a session of
 * solves is the one thing in this app you cannot retype, and one bad record
 * from a hand-edit shouldn't blank the history. Unreadable entries are dropped;
 * everything valid survives.
 */
export function migrate(input: unknown): TimerStore {
  if (!input || typeof input !== 'object') return emptyTimerStore();

  // Deliberately not Partial<TimerStore>: that types schemaVersion as the
  // literal 4, which makes the older checks unreachable. Incoming JSON can be
  // any version, so it has to be read as a plain number.
  const raw = input as { schemaVersion?: number; sessions?: unknown; activeId?: unknown };
  if (![1, 2, 3, 4].includes(raw.schemaVersion as number)) return emptyTimerStore();
  if (!Array.isArray(raw.sessions)) return emptyTimerStore();

  const sessions: Session[] = raw.sessions
    .filter((session): session is Session & { mode?: unknown } =>
      !!session && typeof session.id === 'string')
    .map((session) => {
      const event = readEvent(session);
      return {
        id: session.id,
        name: typeof session.name === 'string' && session.name !== '' ? session.name : 'Session',
        event,
        createdAt: typeof session.createdAt === 'number' ? session.createdAt : 0,
        solves: Array.isArray(session.solves)
          ? session.solves.map((solve) => readSolve(solve, event)).filter(isSolve)
          : [],
      };
    });

  if (sessions.length === 0) return emptyTimerStore();

  // A dangling activeId would leave the UI with no session to render.
  const active = sessions.find((session) => session.id === raw.activeId);
  return { schemaVersion: 4, sessions, activeId: (active ?? sessions[0]).id };
}

/** v3's `event` if it's there and real, otherwise v2's `mode`, otherwise 3x3. */
function readEvent(session: { event?: unknown; mode?: unknown }): EventId {
  if (isEventId(session.event)) return session.event;
  return session.mode === '3bld' ? '333bf' : DEFAULT_EVENT;
}

/**
 * Fills in the fields older schemas didn't have. A v1 solve has no memoMs at
 * all; null is correct. Anything before v4 has no event of its own, so it takes
 * the session's — which is exactly what every reader used to assume.
 */
function readSolve(value: unknown, sessionEvent: EventId): unknown {
  if (!value || typeof value !== 'object') return value;
  const solve = value as Partial<Solve>;
  return {
    ...solve,
    memoMs:
      typeof solve.memoMs === 'number' && Number.isFinite(solve.memoMs) ? solve.memoMs : null,
    event: isEventId(solve.event) ? solve.event : sessionEvent,
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
    typeof solve.scramble === 'string' &&
    isEventId(solve.event)
  );
}
