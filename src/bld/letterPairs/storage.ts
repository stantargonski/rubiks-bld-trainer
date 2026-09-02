import { emptyStore, type Confidence, type PairEntry, type PairStore } from './types';

export const PAIRS_KEY = 'bld.pairs.v1';   // storage slot; the version lives inside the JSON

/** A v1 entry, when person/action/object were three separate fields. */
interface LegacyEntry {
  code?: string;
  image?: string;
  person?: string;
  action?: string;
  object?: string;
  notes?: string;
  tags?: string[];
  confidence?: Confidence;
  updatedAt?: number;
}

export function loadStore(): PairStore {
  try {
    const raw = localStorage.getItem(PAIRS_KEY);
    if (!raw) return emptyStore();
    return migrate(JSON.parse(raw));
  } catch {
    return emptyStore();
  }
}

export function saveStore(store: PairStore): void {
  localStorage.setItem(PAIRS_KEY, JSON.stringify(store));
}

/**
 * v1 → v2: three PAO fields collapse into one `image`. Person wins, then
 * object, then action. Whatever loses — plus any tags — is appended to `notes`
 * rather than dropped, so nothing typed is silently thrown away.
 */
export function migrate(input: unknown): PairStore {
  if (!input || typeof input !== 'object') return emptyStore();
  const store = input as {
    schemaVersion?: number;
    pairs?: Record<string, LegacyEntry>;
    reviews?: PairStore['reviews'];
    globalNotes?: unknown;
  };

  const pairs: Record<string, PairEntry> = {};

  for (const [code, raw] of Object.entries(store.pairs ?? {})) {
    const candidates = [raw.image, raw.person, raw.object, raw.action]
      .map((value) => (value ?? '').trim())
      .filter((value) => value !== '');

    const image = candidates[0] ?? '';
    const carried = candidates.slice(1).filter((value) => value !== image);
    const notes = [(raw.notes ?? '').trim(), ...carried, ...(raw.tags ?? [])]
      .filter((value) => value !== '')
      .join(' · ');
    const confidence = raw.confidence ?? 0;

    if (image === '' && notes === '' && confidence === 0) continue;
    pairs[code] = { code, image, notes, confidence, updatedAt: raw.updatedAt ?? 0 };
  }

  return {
    schemaVersion: 2,
    pairs,
    // v1 review keys embedded the field name, so they can't be carried over.
    // Nothing has written a review yet, so this only ever discards empties.
    reviews: store.schemaVersion === 2 ? (store.reviews ?? {}) : {},
    globalNotes: typeof store.globalNotes === 'string' ? store.globalNotes : '',
  };
}

export function exportJSON(store: PairStore): string {
  return JSON.stringify(store, null, 2);
}

export function importJSON(text: string): PairStore {
  const parsed = JSON.parse(text) as { schemaVersion?: number } | null;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('That file is not a pair library.');
  }
  if (parsed.schemaVersion !== 1 && parsed.schemaVersion !== 2) {
    throw new Error(
      `That file is schema version ${parsed.schemaVersion}; this app reads 1 and 2.`,
    );
  }
  return migrate(parsed);
}
