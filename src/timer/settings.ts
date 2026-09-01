export interface TimerSettings {
  schemaVersion: 1;
  /** How long space must be held before the timer arms. */
  holdMs: number;
  scrambleLength: number;
  decimals: 2 | 3;
  showScramble: boolean;
  showSolveList: boolean;
  showStats: boolean;
  showAverages: boolean;
  showCubeNet: boolean;
  hideUiWhileRunning: boolean;
}

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  schemaVersion: 1,
  holdMs: 400,
  scrambleLength: 20,
  decimals: 2,
  showScramble: true,
  showSolveList: true,
  showStats: true,
  showAverages: true,
  showCubeNet: true,
  hideUiWhileRunning: true,
};

export const TIMER_SETTINGS_KEY = 'timer.settings.v1';

export function loadTimerSettings(): TimerSettings {
  try {
    const raw = localStorage.getItem(TIMER_SETTINGS_KEY);
    return raw ? readTimerSettings(JSON.parse(raw)) : DEFAULT_TIMER_SETTINGS;
  } catch {
    return DEFAULT_TIMER_SETTINGS;
  }
}

/**
 * Settings out of an untrusted blob — a saved one, or one out of a backup file
 * someone hand-edited. Every field is clamped rather than trusted, and anything
 * unreadable falls back to its default, so this cannot fail: the worst case is
 * the stock settings, which is never worse than refusing to start.
 */
export function readTimerSettings(input: unknown): TimerSettings {
  try {
    const parsed = input as Partial<TimerSettings> | null;
    if (!parsed || parsed.schemaVersion !== 1) return DEFAULT_TIMER_SETTINGS;

    // Field by field rather than a spread, so a key added here later gets its
    // default instead of arriving undefined out of an older saved blob.
    return {
      schemaVersion: 1,
      holdMs: clamp(parsed.holdMs, 0, 2000, DEFAULT_TIMER_SETTINGS.holdMs),
      scrambleLength: clamp(parsed.scrambleLength, 1, 50, DEFAULT_TIMER_SETTINGS.scrambleLength),
      decimals: parsed.decimals === 3 ? 3 : 2,
      showScramble: bool(parsed.showScramble, true),
      showSolveList: bool(parsed.showSolveList, true),
      showStats: bool(parsed.showStats, true),
      showAverages: bool(parsed.showAverages, true),
      showCubeNet: bool(parsed.showCubeNet, true),
      hideUiWhileRunning: bool(parsed.hideUiWhileRunning, true),
    };
  } catch {
    return DEFAULT_TIMER_SETTINGS;
  }
}

export function saveTimerSettings(settings: TimerSettings): void {
  localStorage.setItem(TIMER_SETTINGS_KEY, JSON.stringify(settings));
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}
