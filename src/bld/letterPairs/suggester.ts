import { LETTERS } from '../../cube/speffz';

function isSpeffzCode(code: string): boolean {
  return code.split('').every((ch) => (LETTERS as readonly string[]).includes(ch));
}

/**
 * Parses pasted lines of the form "AB - Abacus, Ali Baba, ABBA".
 * Tolerates bullets, colons and en/em dashes; ignores anything else.
 */
export function parseSuggestionList(text: string): Record<string, string[]> {
  const words: Record<string, string[]> = {};

  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/^[\s*\u2022-]+/, '').trim();
    const match = /^([A-Za-z]{2})\s*[-–—:]\s*(.+)$/.exec(line);
    if (!match) continue;

    const code = match[1].toUpperCase();
    if (!isSpeffzCode(code)) continue;   // drops Y and Z rows

    const items = match[2]
      .split(/[,;/]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (items.length > 0) words[code] = items;
  }

  return words;
}

export function suggestFor(code: string, words: Record<string, string[]>): string[] {
  return words[code] ?? [];
}