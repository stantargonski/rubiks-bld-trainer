import { LETTERS } from '../../cube/speffz';

function isSpeffzCode(code: string): boolean {
  return code.split('').every((ch) => (LETTERS as readonly string[]).includes(ch));
}

/**
 * Parses a pasted word list into `{ "AB": ["Abacus", "Ali Baba"] }`.
 *
 * Handles two layouts:
 *   1. The speedsolving wiki, which puts the code alone on a line followed by
 *      one item per line until the next code.
 *   2. "AB - Abacus, Ali Baba" or "AB: Abacus" all on one line.
 *
 * Anything it can't place is skipped, so a whole page can be pasted unedited.
 */
export function parseSuggestionList(text: string): Record<string, string[]> {
  const words: Record<string, string[]> = {};
  let code: string | null = null;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (line === '' || line === '...') continue;

    // A dash must have spaces around it, or "AK-47" would read as code AK.
    const inline = /^([A-Z]{2})(?:\s*:\s*|\s+[-–—]\s+)(.+)$/.exec(line);
    if (inline) {
      code = isSpeffzCode(inline[1]) ? inline[1] : null;
      if (code) {
        words[code] ??= [];
        for (const item of inline[2].split(/[,;]/).map((s) => s.trim()).filter(Boolean)) {
          words[code].push(item);
        }
      }
      continue;
    }

    // "A", "B" … section headers. Park until the next real code.
    if (/^[A-Z]$/.test(line)) {
      code = null;
      continue;
    }

    // A bare code line. Both letters must be capitals, so items like "To",
    // "Ox", "Us" and "pH" stay items rather than being read as codes.
    if (/^[A-Z]{2}$/.test(line)) {
      code = isSpeffzCode(line) ? line : null;   // null parks the Y* and Z* rows
      if (code) words[code] ??= [];
      continue;
    }

    if (!code) continue;
    words[code].push(line);   // push, not assign — "MC" heads two blocks on the page
  }

  for (const key of Object.keys(words)) {
    words[key] = [...new Set(words[key])];
    if (words[key].length === 0) delete words[key];
  }

  return words;
}

export function suggestFor(code: string, words: Record<string, string[]>): string[] {
  return words[code] ?? [];
}
