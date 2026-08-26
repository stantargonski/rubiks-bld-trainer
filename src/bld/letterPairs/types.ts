export type Confidence = 0 | 1 | 2 | 3; // unset / weak / ok / solid

export const IMAGE_TIP =
  'Using objects or people in your memorisation is better for a memory palace — '
  + 'they are concrete, so they are easier to place somewhere and find again.';

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  0: 'unset',
  1: 'weak',
  2: 'ok',
  3: 'solid',
};

export interface PairEntry {
  code: string;        // 'AB'
  image: string;       // the one thing you picture for this pair
  notes: string;
  confidence: Confidence;
  updatedAt: number;   // epoch ms
}

export interface ReviewCard {
  code: string;
  reps: number;
  lapses: number;
  ease: number;        // 2.5 default
  intervalDays: number;
  dueAt: number;       // epoch ms
}

export interface PairStore {
  schemaVersion: 2;
  pairs: Record<string, PairEntry>;     // keyed by code
  reviews: Record<string, ReviewCard>;  // keyed by code
  globalNotes: string;
}

export function emptyStore(): PairStore {
  return { schemaVersion: 2, pairs: {}, reviews: {}, globalNotes: '' };
}

export function blankEntry(code: string): PairEntry {
  return { code, image: '', notes: '', confidence: 0, updatedAt: 0 };
}

export function hasImage(entry: PairEntry | undefined): boolean {
  return (entry?.image ?? '').trim() !== '';
}

/**
 * Heatmap level for a cell. 0 means no image yet; 1–3 is how solid the memory
 * is. An image you haven't rated counts as weak — an unrated image is not the
 * same as an empty cell, but it isn't a memory you can lean on either.
 */
export function cellLevel(entry: PairEntry | undefined): Confidence {
  if (!entry || entry.image.trim() === '') return 0;
  return entry.confidence === 0 ? 1 : entry.confidence;
}

export function isBlankEntry(entry: PairEntry): boolean {
  return entry.image.trim() === ''
    && entry.notes.trim() === ''
    && entry.confidence === 0;
}
