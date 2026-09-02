/** What the clock shows while a solve is actually running. */
export type RunningDisplay = 'tenths' | 'seconds' | 'hidden';

/** What clicking the scramble does. */
export type ScrambleClick = 'copy' | 'next' | 'none';

export interface TimerSettings {
  schemaVersion: 2;
  /** How long space must be held before the timer arms. */
  holdMs: number;
  decimals: 2 | 3;
  /**
   * Precision of the *live* readout only. The solve is always recorded at full
   * precision — this is about not watching the hundredths tick over mid-solve.
   */
  runningDisplay: RunningDisplay;
  /** WCA 15-second inspection. Blindfolded events and FMC ignore it regardless. */
  inspection: boolean;
  scrambleClick: ScrambleClick;
  showScramble: boolean;
  showSolveList: boolean;
  showStats: boolean;
  showAverages: boolean;
  showCubeNet: boolean;
  hideUiWhileRunning: boolean;
  /** The scramble preview panel's size, as the user last dragged it. */
  previewWidth: number;
  previewHeight: number;
  /**
   * Where the preview sits, as a gap from the right and bottom edges of the
   * timer. Measured from that corner rather than from the top-left because that
   * is where it starts and where it stays put when the window is resized.
   */
  previewRight: number;
  previewBottom: number;
  /** How many cubes a multi-blind attempt is for. */
  mbldCount: number;
}

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  schemaVersion: 2,
  holdMs: 400,
  decimals: 2,
  runningDisplay: 'tenths',
  inspection: false,
  scrambleClick: 'copy',
  showScramble: true,
  showSolveList: true,
  showStats: true,
  showAverages: true,
  showCubeNet: true,
  hideUiWhileRunning: true,
  previewWidth: 320,
  previewHeight: 268,
  previewRight: 16,
  previewBottom: 16,
  mbldCount: 3,
};

export const TIMER_SETTINGS_KEY = 'timer.settings.v1';

export const PREVIEW_MIN = 200;
export const PREVIEW_MAX = 680;

/** How far off the edge the preview may be dragged. Enough stays on screen to
    grab it again. */
export const PREVIEW_MARGIN = -40;

export const MBLD_MIN = 2;
export const MBLD_MAX = 60;

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
 *
 * v1 blobs are read too. Everything v1 had, v2 still has, except `scrambleLength`
 * — which is gone because the event decides how long a scramble is, and a slider
 * that could make a 4x4 scramble eleven moves long was never a setting so much as
 * a way to break your own scrambles.
 */
export function readTimerSettings(input: unknown): TimerSettings {
  try {
    // Deliberately not Partial<TimerSettings>: that types schemaVersion as the
    // literal 2, which makes the v1 check unreachable. Incoming JSON can be any
    // version, so it has to be read as a plain number.
    type Incoming = Omit<Partial<TimerSettings>, 'schemaVersion'> & { schemaVersion?: number };
    const parsed = input as Incoming | null;
    const version = parsed?.schemaVersion;
    if (!parsed || (version !== 1 && version !== 2)) return DEFAULT_TIMER_SETTINGS;

    // Field by field rather than a spread, so a key added here later gets its
    // default instead of arriving undefined out of an older saved blob.
    return {
      schemaVersion: 2,
      holdMs: clamp(parsed.holdMs, 0, 2000, DEFAULT_TIMER_SETTINGS.holdMs),
      decimals: parsed.decimals === 3 ? 3 : 2,
      runningDisplay: one(
        parsed.runningDisplay,
        ['tenths', 'seconds', 'hidden'],
        DEFAULT_TIMER_SETTINGS.runningDisplay,
      ),
      inspection: bool(parsed.inspection, false),
      scrambleClick: one(
        parsed.scrambleClick,
        ['copy', 'next', 'none'],
        DEFAULT_TIMER_SETTINGS.scrambleClick,
      ),
      showScramble: bool(parsed.showScramble, true),
      showSolveList: bool(parsed.showSolveList, true),
      showStats: bool(parsed.showStats, true),
      showAverages: bool(parsed.showAverages, true),
      showCubeNet: bool(parsed.showCubeNet, true),
      hideUiWhileRunning: bool(parsed.hideUiWhileRunning, true),
      previewWidth: clamp(
        parsed.previewWidth, PREVIEW_MIN, PREVIEW_MAX, DEFAULT_TIMER_SETTINGS.previewWidth,
      ),
      previewHeight: clamp(
        parsed.previewHeight, PREVIEW_MIN, PREVIEW_MAX, DEFAULT_TIMER_SETTINGS.previewHeight,
      ),
      // Clamped generously rather than to the window: this is read before there
      // is a window to measure, and the panel re-clamps itself once mounted.
      previewRight: clamp(parsed.previewRight, PREVIEW_MARGIN, 4000, 16),
      previewBottom: clamp(parsed.previewBottom, PREVIEW_MARGIN, 4000, 16),
      mbldCount: clamp(parsed.mbldCount, MBLD_MIN, MBLD_MAX, DEFAULT_TIMER_SETTINGS.mbldCount),
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

function one<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}
