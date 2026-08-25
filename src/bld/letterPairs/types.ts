export type Confidence = 0 | 1 | 2 | 3; // unset / weak / ok / solid
export type Field = 'person' | 'action' | 'object';
export const FIELDS: Field[] = ['person', 'action', 'object'];
export interface PairEntry {
  code: string;        // 'AB'
  person: string;
  action: string;
  object: string;
  notes: string;
  tags: string[];
  confidence: Confidence;
  updatedAt: number;   // epoch ms
}
export interface ReviewCard {
  code: string;
  field: Field;        // each field is scheduled independently
  reps: number;
  lapses: number;
  ease: number;        // 2.5 default
  intervalDays: number;
  dueAt: number;       // epoch ms
}
export interface PairStore {
  schemaVersion: 1;
  pairs: Record<string, PairEntry>;     // keyed by code
  reviews: Record<string, ReviewCard>;  // keyed by `${code}:${field}`
}
export function emptyStore(): PairStore {
  return { schemaVersion: 1, pairs: {}, reviews: {} };
}
export function blankEntry(code: string): PairEntry {
  return {
    code,
    person: '',
    action: '',
    object: '',
    notes: '',
    tags: [],
    confidence: 0,
    updatedAt: 0,
  };
}
/** How many of person/action/object are filled in: 0, 1, 2 or 3. */
export function filledCount(entry: PairEntry | undefined): number {
  if (!entry) return 0;
  let n = 0;
  for (const field of FIELDS) {
    if (entry[field].trim() !== '') n++;
  }
  return n;
}

export function isBlankEntry(entry: PairEntry): boolean {
  return filledCount(entry) === 0
    && entry.notes.trim() === ''
    && entry.tags.length === 0
    && entry.confidence === 0;  
}