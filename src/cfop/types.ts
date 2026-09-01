export type CaseSet = 'pll' | 'oll' | 'f2l';

/**
 * Deliberately the same 0–3 ramp as the letter-pair library, so the grid can
 * reuse the .f0 … .f3 fill classes and mean the same thing in both places.
 * Declared here rather than imported from bld/ — CFOP shouldn't depend on BLD.
 */
export type Confidence = 0 | 1 | 2 | 3;

/** The chip labels, same words as the pair library's for the same reason. */
export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  0: 'unset',
  1: 'weak',
  2: 'ok',
  3: 'solid',
};

/** A case as shipped: the fixed facts about it. Never written to storage. */
export interface AlgCase {
  id: string;        // 'pll-t'
  set: CaseSet;
  name: string;      // 'T'
  group: string;     // recognition family — what you look for before the alg
  alg: string;       // the widely-used default
}

/** What the user has done with a case. Only stored once it differs from stock. */
export interface CaseEntry {
  id: string;
  /** Their own algorithm. Empty means "use the shipped one" — storing the
      default would silently freeze it if the default ever improved. */
  alg: string;
  notes: string;
  confidence: Confidence;
  updatedAt: number;
}

export interface CfopStore {
  schemaVersion: 1;
  cases: Record<string, CaseEntry>;
}

export function emptyCfopStore(): CfopStore {
  return { schemaVersion: 1, cases: {} };
}

export function blankEntry(id: string): CaseEntry {
  return { id, alg: '', notes: '', confidence: 0, updatedAt: 0 };
}

export function isBlankEntry(entry: CaseEntry): boolean {
  return entry.alg.trim() === '' && entry.notes.trim() === '' && entry.confidence === 0;
}

/** The algorithm actually in force: theirs if they wrote one, else the default. */
export function activeAlg(item: AlgCase, entry: CaseEntry | undefined): string {
  const own = (entry?.alg ?? '').trim();
  return own === '' ? item.alg : own;
}

/**
 * Same shape as cellLevel in the pair library: an untouched case is 0, and a
 * case you've customised but not rated counts as 1 rather than vanishing from
 * the progress meter.
 */
export function caseLevel(entry: CaseEntry | undefined): Confidence {
  if (!entry || isBlankEntry(entry)) return 0;
  return entry.confidence === 0 ? 1 : entry.confidence;
}
