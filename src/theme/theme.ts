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
    id: 'paper',
    name: 'Paper',
    dark: false,
    colors: {
      bg: '#e1e1e3', panel: '#f3f3f4', panel2: '#e7e7e9', line: '#c9c9cd',
      text: '#323437', textDim: '#6f747c', accent: '#c39a08', accentInk: '#ffffff',
      dead: '#d7d7da',
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
  { id: 'jetbrains', name: 'JetBrains Mono', stack: "'JetBrains Mono', ui-monospace, monospace" },
  { id: 'roboto-mono', name: 'Roboto Mono', stack: "'Roboto Mono', ui-monospace, monospace" },
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
};

export const APPEARANCE_KEY = 'app.appearance.v1';

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
  if (!parsed || parsed.schemaVersion !== 1) return DEFAULT_APPEARANCE;

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
