/**
 * The colour maths behind the palette editor.
 *
 * Kept out of the editor itself for the same reason `seedCustomTheme` is: that
 * file exports a component, and a module exporting anything else beside one
 * loses fast refresh. It is also the half worth checking without a browser.
 *
 * Everything here speaks hex on the way out. A palette is written straight onto
 * the root element and then fed to twenty-odd `color-mix()` calls that assume
 * plain sRGB, and `readAppearance` refuses anything that is not hex on the way
 * back in — so a colour that arrives as `rgb(240 228 218)` is normalised here
 * rather than stored as typed and quietly dropped on the next reload.
 */
import { parseHex } from './theme';

export interface Hsv {
  /** Degrees, 0–360. */
  h: number;
  /** 0–1. */
  s: number;
  /** 0–1. */
  v: number;
}

/** `#rgb` to `#rrggbb`; anything else is handed back untouched. */
export function expandHex(value: string): string {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
  if (!short) return value;

  const [, red, green, blue] = short;
  return `#${red}${red}${green}${green}${blue}${blue}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Three channels, each 0–255, as `#rrggbb`. */
export function toHex(red: number, green: number, blue: number): string {
  const part = (value: number) =>
    Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0');
  return `#${part(red)}${part(green)}${part(blue)}`;
}

/** One `rgb()` channel: `240`, `94%`, or neither. */
function channel(text: string, scale: number): number | null {
  const percent = text.endsWith('%');
  const value = Number(percent ? text.slice(0, -1) : text);
  if (!Number.isFinite(value)) return null;
  return percent ? (value / 100) * scale : value;
}

const RGB = /^rgba?\(([^)]*)\)$/i;

/**
 * A colour someone typed, as `#rrggbb`, or null if it is not one yet.
 *
 * Deliberately generous about the form and strict about the result: `#f0e4da`,
 * `#fed`, a bare `f0e4da`, `rgb(240, 228, 218)` and `rgb(240 228 218)` are all
 * the same colour and all worth pasting in. Transparency is the one thing
 * refused outright — the stylesheet has nowhere to put it, so a half-visible
 * background would read as a rendering bug rather than as the colour asked for.
 */
export function parseColor(text: string): string | null {
  const clean = text.trim().toLowerCase();
  if (clean === '') return null;

  // A hex code with the hash left off is still a hex code, and pasting one out
  // of a design tool that omits it is common enough to be worth catching.
  const hashed = /^[0-9a-f]{3}$|^[0-9a-f]{6}$/.test(clean) ? `#${clean}` : clean;
  const hex = parseHex(hashed);
  if (hex) return toHex(...hex);

  const match = RGB.exec(clean);
  if (!match) return null;

  // Commas, spaces and the slash before an alpha are all separators here: the
  // legacy and the modern syntax differ only in punctuation.
  const parts = match[1].split(/[\s,/]+/).filter((part) => part !== '');
  if (parts.length < 3 || parts.length > 4) return null;

  const red = channel(parts[0], 255);
  const green = channel(parts[1], 255);
  const blue = channel(parts[2], 255);
  if (red === null || green === null || blue === null) return null;

  if (parts.length === 4) {
    const alpha = channel(parts[3], 1);
    if (alpha === null || alpha < 1) return null;
  }
  return toHex(red, green, blue);
}

/**
 * A hex colour on the wheel the picker draws.
 *
 * Grey has no hue to report, so it comes back as zero — which is why the picker
 * keeps the hue it was last dragged to rather than reading it back out of the
 * colour every render: sliding the saturation to nothing would otherwise snap
 * the wheel round to red.
 */
export function hexToHsv(value: string): Hsv | null {
  const rgb = parseHex(expandHex(value));
  if (!rgb) return null;

  const [red, green, blue] = rgb.map((part) => part / 255);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const span = max - min;

  let hue = 0;
  if (span > 0) {
    if (max === red) hue = ((green - blue) / span) % 6;
    else if (max === green) hue = (blue - red) / span + 2;
    else hue = (red - green) / span + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  return { h: hue, s: max === 0 ? 0 : span / max, v: max };
}

export function hsvToHex({ h, s, v }: Hsv): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s, 0, 1);
  const val = clamp(v, 0, 1);

  const chroma = val * sat;
  const second = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const base = val - chroma;

  const sextant = Math.floor(hue / 60) % 6;
  const table: [number, number, number][] = [
    [chroma, second, 0],
    [second, chroma, 0],
    [0, chroma, second],
    [0, second, chroma],
    [second, 0, chroma],
    [chroma, 0, second],
  ];

  const [red, green, blue] = table[sextant];
  return toHex((red + base) * 255, (green + base) * 255, (blue + base) * 255);
}
