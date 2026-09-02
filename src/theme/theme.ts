/**
 * Everything about how the app looks, and the one function that applies it.
 *
 * Nothing here reaches into components: a theme is a set of values written onto
 * the root element, and the stylesheet already reads all of them. That's why
 * adding a theme is nine colours rather than a stylesheet, and why the app can
 * be restyled without a single component knowing it happened.
 */

export interface ThemeColors {
  bg: string;
  panel: string;
  panel2: string;
  line: string;
  text: string;
  textDim: string;
  accent: string;
  accentInk: string;
  dead: string;
}

export interface Theme {
  id: string;
  name: string;
  /** Drives `color-scheme`, so form controls and scrollbars follow along. */
  dark: boolean;
  colors: ThemeColors;
}

export const THEMES: Theme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    dark: true,
    colors: {
      bg: '#101318', panel: '#191d24', panel2: '#212630', line: '#2c323d',
      text: '#dbe1ea', textDim: '#9aa4b2', accent: '#3987e5', accentInk: '#ffffff',
      dead: '#13161b',
    },
  },
  {
    id: 'carbon',
    name: 'Carbon',
    dark: true,
    colors: {
      bg: '#111111', panel: '#1a1a1a', panel2: '#232323', line: '#2e2e2e',
      text: '#e6e6e6', textDim: '#9b9b9b', accent: '#e2b714', accentInk: '#111111',
      dead: '#0d0d0d',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    dark: true,
    colors: {
      bg: '#2e3440', panel: '#3b4252', panel2: '#434c5e', line: '#4c566a',
      text: '#eceff4', textDim: '#a2aab8', accent: '#88c0d0', accentInk: '#2e3440',
      dead: '#272c36',
    },
  },
  {
    id: 'grape',
    name: 'Grape',
    dark: true,
    colors: {
      bg: '#282a36', panel: '#343746', panel2: '#3d4051', line: '#4a4d61',
      text: '#f8f8f2', textDim: '#a8abc4', accent: '#bd93f9', accentInk: '#282a36',
      dead: '#22242e',
    },
  },
  {
    id: 'botanical',
    name: 'Botanical',
    dark: true,
    colors: {
      bg: '#14261f', panel: '#1c3229', panel2: '#244034', line: '#2f5142',
      text: '#e4f0e8', textDim: '#9db8a9', accent: '#6fcf97', accentInk: '#10231a',
      dead: '#10201a',
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    dark: true,
    colors: {
      bg: '#17110d', panel: '#211913', panel2: '#2c211a', line: '#3a2c22',
      text: '#f0e4da', textDim: '#b09a8a', accent: '#ff8a3d', accentInk: '#1a0f07',
      dead: '#120c09',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    dark: true,
    colors: {
      bg: '#0f1416', panel: '#182024', panel2: '#212b30', line: '#2c383e',
      text: '#dbe6ea', textDim: '#93a5ad', accent: '#4dd0c7', accentInk: '#0d1a1c',
      dead: '#0c1113',
    },
  },
  {
    id: 'mono',
    name: 'Mono',
    dark: true,
    colors: {
      bg: '#121212', panel: '#0d0d0d', panel2: '#171717', line: '#2e2e2e',
      text: '#F9FAFB', textDim: '#a8a8a8', accent: '#F9FAFB', accentInk: '#121212',
      dead: '#050505',
    },
  },
  {
    id: 'paper',
    name: 'Paper',
    dark: false,
    colors: {
      bg: '#e1e1e3', panel: '#f3f3f4', panel2: '#e7e7e9', line: '#c9c9cd',
      text: '#323437', textDim: '#6f747c', accent: '#c39a08', accentInk: '#ffffff',
      dead: '#d7d7da',
    },
  },
  {
    id: 'sakura',
    name: 'Sakura',
    dark: false,
    colors: {
      bg: '#f2ecee', panel: '#fffafb', panel2: '#f8eef1', line: '#e0cdd4',
      text: '#3a2f34', textDim: '#7d6a72', accent: '#d6608f', accentInk: '#ffffff',
      dead: '#e9e0e3',
    },
  },
];

export interface FontChoice {
  id: string;
  name: string;
  stack: string;
}

/** Loaded by index.html in one request; keep the two lists in step. */
export const FONTS: FontChoice[] = [
  { id: 'manrope', name: 'Manrope', stack: "'Manrope', system-ui, sans-serif" },
  { id: 'inter', name: 'Inter', stack: "'Inter', system-ui, sans-serif" },
  { id: 'lexend', name: 'Lexend', stack: "'Lexend', system-ui, sans-serif" },
  { id: 'outfit', name: 'Outfit', stack: "'Outfit', system-ui, sans-serif" },
  { id: 'space-grotesk', name: 'Space Grotesk', stack: "'Space Grotesk', system-ui, sans-serif" },
  { id: 'jetbrains', name: 'JetBrains Mono', stack: "'JetBrains Mono', ui-monospace, monospace" },
  { id: 'roboto-mono', name: 'Roboto Mono', stack: "'Roboto Mono', ui-monospace, monospace" },
  { id: 'plex-mono', name: 'IBM Plex Mono', stack: "'IBM Plex Mono', ui-monospace, monospace" },
  { id: 'system', name: 'System', stack: 'system-ui, -apple-system, sans-serif' },
];

export interface Appearance {
  schemaVersion: 1;
  themeId: string;
  uiFont: string;
  /** Separate from the UI font: plenty of people want the clock monospaced and nothing else. */
  timerFont: string;
  fontScale: number;
  panelOpacity: number;
  panelBlur: number;
  bgBlur: number;
  bgDim: number;
  /** Whether a picture is waiting in IndexedDB. The picture itself never lives here. */
  hasBackground: boolean;
  /** Top bar collapsed to just the wordmark. Lives here rather than in the timer
      settings because the bar belongs to every section, not to the timer. */
  topBarStowed: boolean;
}

export const DEFAULT_APPEARANCE: Appearance = {
  schemaVersion: 1,
  themeId: 'midnight',
  uiFont: 'manrope',
  timerFont: 'manrope',
  fontScale: 1,
  panelOpacity: 1,
  panelBlur: 0,
  bgBlur: 0,
  bgDim: 0.45,
  hasBackground: false,
  topBarStowed: false,
};

export const APPEARANCE_KEY = 'app.appearance.v1';

/** Every appearance schema this build reads. See TIMER_STORE_VERSIONS on the rule. */
export const APPEARANCE_VERSIONS = [1];

export function themeOf(id: string): Theme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

export function fontOf(id: string): FontChoice {
  return FONTS.find((font) => font.id === id) ?? FONTS[0];
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function pick(value: unknown, allowed: string[], fallback: string): string {
  return typeof value === 'string' && allowed.includes(value) ? value : fallback;
}

/** Appearance out of an untrusted blob. Anything unreadable falls back. */
export function readAppearance(input: unknown): Appearance {
  const parsed = input as Partial<Appearance> | null;
  if (!parsed || !APPEARANCE_VERSIONS.includes(parsed.schemaVersion as number)) {
    return DEFAULT_APPEARANCE;
  }

  const themeIds = THEMES.map((theme) => theme.id);
  const fontIds = FONTS.map((font) => font.id);

  return {
    schemaVersion: 1,
    themeId: pick(parsed.themeId, themeIds, DEFAULT_APPEARANCE.themeId),
    uiFont: pick(parsed.uiFont, fontIds, DEFAULT_APPEARANCE.uiFont),
    timerFont: pick(parsed.timerFont, fontIds, DEFAULT_APPEARANCE.timerFont),
    fontScale: clamp(parsed.fontScale, 0.85, 1.4, DEFAULT_APPEARANCE.fontScale),
    // Never fully transparent: a panel you can't find is a panel you can't use.
    panelOpacity: clamp(parsed.panelOpacity, 0.25, 1, DEFAULT_APPEARANCE.panelOpacity),
    panelBlur: clamp(parsed.panelBlur, 0, 24, DEFAULT_APPEARANCE.panelBlur),
    bgBlur: clamp(parsed.bgBlur, 0, 24, DEFAULT_APPEARANCE.bgBlur),
    bgDim: clamp(parsed.bgDim, 0, 0.9, DEFAULT_APPEARANCE.bgDim),
    hasBackground: typeof parsed.hasBackground === 'boolean'
      ? parsed.hasBackground
      : DEFAULT_APPEARANCE.hasBackground,
    // New field, no schemaVersion bump: an older blob simply arrives without it
    // and takes the default. That is the whole reason these are read one at a
    // time instead of spread.
    topBarStowed: typeof parsed.topBarStowed === 'boolean'
      ? parsed.topBarStowed
      : DEFAULT_APPEARANCE.topBarStowed,
  };
}

export function loadAppearance(): Appearance {
  try {
    const raw = localStorage.getItem(APPEARANCE_KEY);
    return raw ? readAppearance(JSON.parse(raw)) : DEFAULT_APPEARANCE;
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function saveAppearance(appearance: Appearance): void {
  localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance));
}

/**
 * Writes the whole appearance onto the root element as custom properties.
 *
 * Called before the first render as well as on every change, so there's no
 * flash of the stock theme on load.
 */
export function applyAppearance(appearance: Appearance): void {
  const theme = themeOf(appearance.themeId);
  const root = document.documentElement;

  const values: Record<string, string> = {
    '--bg': theme.colors.bg,
    '--panel': theme.colors.panel,
    '--panel-2': theme.colors.panel2,
    '--line': theme.colors.line,
    '--text': theme.colors.text,
    '--text-dim': theme.colors.textDim,
    '--accent': theme.colors.accent,
    '--accent-ink': theme.colors.accentInk,
    '--dead': theme.colors.dead,
    '--font-ui': fontOf(appearance.uiFont).stack,
    '--font-timer': fontOf(appearance.timerFont).stack,
    '--font-scale': String(appearance.fontScale),
    '--panel-alpha': String(appearance.panelOpacity),
    '--panel-blur': `${appearance.panelBlur}px`,
    '--bg-blur': `${appearance.bgBlur}px`,
    '--bg-dim': String(appearance.bgDim),
  };

  for (const [name, value] of Object.entries(values)) root.style.setProperty(name, value);
  root.style.colorScheme = theme.dark ? 'dark' : 'light';
}

/** The background picture, once it has been read out of IndexedDB. */
export function applyBackground(url: string | null): void {
  const root = document.documentElement;

  if (url === null) root.style.removeProperty('--bg-image');
  else root.style.setProperty('--bg-image', `url("${url}")`);
}
