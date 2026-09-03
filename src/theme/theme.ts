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

  /**
   * The colours that mean something rather than merely place something, and
   * the six faces of a cube.
   *
   * Optional, and defaulted from `THEME_EXTRAS`, so adding a stock theme is
   * still the nine colours above rather than eighteen. A theme states one of
   * these only when the stock value is wrong for it — which for `go` and
   * `holding` is exactly what the two light themes were getting wrong: they
   * were built on the assumption of a dark background, and every theme was
   * quietly using them.
   */
  go?: string;
  holding?: string;
  flag?: string;
  cubeU?: string;
  cubeD?: string;
  cubeF?: string;
  cubeB?: string;
  cubeR?: string;
  cubeL?: string;
}

/** Every colour stated, with nothing left to a fallback. */
export type Palette = Required<ThemeColors>;

/**
 * What a theme gets for the colours it does not state.
 *
 * These are the values the stylesheet declares on `:root`, kept here as well
 * because that declaration is only the fallback for the moment before this file
 * runs. The two must agree; the stylesheet says so beside them.
 */
export const THEME_EXTRAS: Omit<Palette, keyof ThemeColors> & Pick<Palette,
  'go' | 'holding' | 'flag' | 'cubeU' | 'cubeD' | 'cubeF' | 'cubeB' | 'cubeR' | 'cubeL'
> = {
  go: '#3fbf6f',
  holding: '#ff2934',
  flag: '#ffc233',
  cubeU: '#eef2f8',
  cubeD: '#ffd23f',
  cubeF: '#35b866',
  cubeB: '#2f7bd6',
  cubeR: '#e04b41',
  cubeL: '#f08a24',
};

/** A theme's colours with every optional one filled in. */
export function paletteOf(colors: ThemeColors): Palette {
  const full = { ...THEME_EXTRAS, ...colors } as Palette;
  // A key present but undefined would have overwritten its default above; a
  // hand-edited backup is exactly where that arrives from.
  for (const [key, value] of Object.entries(THEME_EXTRAS)) {
    if (full[key as keyof Palette] === undefined) {
      (full as Record<string, string>)[key] = value;
    }
  }
  return full;
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
      go: '#1f8a4c', holding: '#c62828',
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
      go: '#2b7d55', holding: '#c22a41',
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
  /**
   * A palette of your own, or null if you have never opened the editor.
   *
   * Kept even while a stock theme is selected, so switching to Midnight to
   * check something and back again does not cost you the palette you built.
   * `themeId` is what says whether it is in use.
   */
  customTheme: CustomTheme | null;
  /** Whether a picture is waiting in IndexedDB. The picture itself never lives here. */
  hasBackground: boolean;
  /** Top bar collapsed to just the wordmark. Lives here rather than in the timer
      settings because the bar belongs to every section, not to the timer. */
  topBarStowed: boolean;
}

/**
 * A palette someone built, which is every colour stated rather than most of
 * them defaulted: an editor that silently left nine colours out is an editor
 * that cannot be used to change them.
 */
export interface CustomTheme extends Palette {
  /** Chosen, not inferred, once you disagree with the guess. */
  dark: boolean;
}

/** The id `themeId` carries while a custom palette is the one in use. */
export const CUSTOM_THEME_ID = 'custom';

export const DEFAULT_APPEARANCE: Appearance = {
  schemaVersion: 1,
  themeId: 'midnight',
  customTheme: null,
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

/**
 * The theme an appearance actually means, stock or otherwise.
 *
 * `themeOf` alone cannot answer this: a custom palette is not in `THEMES` and
 * never will be, because it belongs to one person rather than to the app.
 */
export function resolveTheme(appearance: Appearance): Theme {
  if (appearance.themeId === CUSTOM_THEME_ID && appearance.customTheme) {
    const { dark, ...colors } = appearance.customTheme;
    return { id: CUSTOM_THEME_ID, name: 'Custom', dark, colors };
  }
  return themeOf(appearance.themeId);
}

/**
 * A stock theme as a palette you can edit — every colour stated, plus the
 * light/dark flag it shipped with.
 *
 * Lives here rather than in the editor so that file exports nothing but a
 * component, which is what keeps fast refresh working during development.
 */
export function seedCustomTheme(from: string): CustomTheme {
  const theme = themeOf(from);
  return { ...paletteOf(theme.colors), dark: theme.dark };
}

/**
 * Whether a background wants light text over it.
 *
 * Rec. 709 luma on the raw channels rather than proper relative luminance: the
 * question is only which side of the middle a colour sits on, and the two agree
 * about that everywhere it matters. Used to guess the `dark` flag for a palette
 * as it is built, which the editor then lets you overrule.
 */
export function isDark(hex: string): boolean {
  const rgb = parseHex(hex);
  if (!rgb) return true;

  const [red, green, blue] = rgb;
  return (0.2126 * red + 0.7152 * green + 0.0722 * blue) < 140;
}

/** `#rgb` or `#rrggbb` to channels, or null if it is neither. */
function parseHex(value: string): [number, number, number] | null {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
  if (short) {
    const [, red, green, blue] = short;
    return [red, green, blue].map((part) => parseInt(part + part, 16)) as [number, number, number];
  }

  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  if (!long) return null;

  const [, red, green, blue] = long;
  return [red, green, blue].map((part) => parseInt(part, 16)) as [number, number, number];
}

/**
 * A colour out of an untrusted blob.
 *
 * Hex only, deliberately. These strings are written straight onto the root
 * element and the stylesheet then feeds them to twenty-odd `color-mix()` calls
 * that assume plain sRGB — so anything that is not unambiguously a colour, and
 * anything carrying an alpha channel, is refused rather than passed along to
 * fail somewhere further down where it would look like a rendering bug.
 */
function colorOf(value: unknown, fallback: string): string {
  return typeof value === 'string' && parseHex(value) !== null ? value : fallback;
}

/** A whole palette out of an untrusted blob, one colour at a time. */
function paletteFrom(value: unknown, fallback: Palette): Palette {
  const parsed = (value ?? {}) as Partial<Palette>;
  const out = {} as Palette;

  for (const key of Object.keys(fallback) as (keyof Palette)[]) {
    out[key] = colorOf(parsed[key], fallback[key]);
  }
  return out;
}

/** A custom palette out of an untrusted blob, or null if there isn't one. */
function customThemeOf(value: unknown): CustomTheme | null {
  if (!value || typeof value !== 'object') return null;

  const colors = paletteFrom(value, paletteOf(THEMES[0].colors));
  const dark = (value as Partial<CustomTheme>).dark;

  return {
    ...colors,
    // An unreadable flag is guessed rather than defaulted: a palette built
    // around a white background with `dark: true` fights the scrollbars.
    dark: typeof dark === 'boolean' ? dark : isDark(colors.bg),
  };
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

  const fontIds = FONTS.map((font) => font.id);

  // Read first, because whether `custom` is a themeId anyone may hold depends
  // on whether there is a palette behind it.
  const customTheme = customThemeOf(parsed.customTheme);
  const themeIds = THEMES.map((theme) => theme.id);
  if (customTheme) themeIds.push(CUSTOM_THEME_ID);

  return {
    schemaVersion: 1,
    themeId: pick(parsed.themeId, themeIds, DEFAULT_APPEARANCE.themeId),
    customTheme,
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
  const theme = resolveTheme(appearance);
  const colors = paletteOf(theme.colors);
  const root = document.documentElement;

  const values: Record<string, string> = {
    '--bg': colors.bg,
    '--panel': colors.panel,
    '--panel-2': colors.panel2,
    '--line': colors.line,
    '--text': colors.text,
    '--text-dim': colors.textDim,
    '--accent': colors.accent,
    '--accent-ink': colors.accentInk,
    '--dead': colors.dead,
    // Written from here for the first time. These used to be declared once in
    // the stylesheet and left there, so the two light themes ran the same
    // dark-background green and red as every other theme.
    '--go': colors.go,
    '--holding': colors.holding,
    '--flag': colors.flag,
    '--cube-u': colors.cubeU,
    '--cube-d': colors.cubeD,
    '--cube-f': colors.cubeF,
    '--cube-b': colors.cubeB,
    '--cube-r': colors.cubeR,
    '--cube-l': colors.cubeL,
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
