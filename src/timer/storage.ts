import { emptyTimerStore, type Session, type Solve, type TimerStore } from './types';

export const TIMER_KEY = 'timer.store.v1';   // storage slot; the version lives inside the JSON

export function loadTimerStore(): TimerStore {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    if (!raw) return emptyTimerStore();
    return normalize(JSON.parse(raw));
  } catch {
    return emptyTimerStore();
  }
}

export function saveTimerStore(store: TimerStore): void {
  localStorage.setItem(TIMER_KEY, JSON.stringify(store));
}

/**
 * There is nothing to migrate at v1, but this is still worth having: a session
 * of solves is the one thing in the app you cannot retype, and a single bad
 * record from a hand-edit or a half-written save shouldn't blank the whole
 * history. Anything unreadable is dropped; everything valid survives.
 */
function normalize(input: unknown): TimerStore {
  if (!input || typeof input !== 'object') return emptyTimerStore();

  const raw = input as Partial<TimerStore>;
  if (raw.schemaVersion !== 1 || !Array.isArray(raw.sessions)) return emptyTimerStore();

  const sessions: Session[] = raw.sessions
    .filter((session): session is Session => !!session && typeof session.id === 'string')
    .map((session) => ({
      id: session.id,
      name: typeof session.name === 'string' && session.name !== '' ? session.name : 'Session',
      createdAt: typeof session.createdAt === 'number' ? session.createdAt : 0,
      solves: Array.isArray(session.solves) ? session.solves.filter(isSolve) : [],
    }));

  if (sessions.length === 0) return emptyTimerStore();

  // A dangling activeId would leave the UI with no session to render.
  const active = sessions.find((session) => session.id === raw.activeId);
  return { schemaVersion: 1, sessions, activeId: (active ?? sessions[0]).id };
}

function isSolve(value: unknown): value is Solve {
  const solve = value as Partial<Solve> | null;
  return (
    !!solve &&
    typeof solve.id === 'number' &&
    typeof solve.ms === 'number' &&
    Number.isFinite(solve.ms) &&
    (solve.penalty === 'none' || solve.penalty === 'plus2' || solve.penalty === 'dnf') &&
    typeof solve.scramble === 'string'
  );
}
