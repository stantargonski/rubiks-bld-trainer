import { emptyStore, type PairStore } from './types';

export const PAIRS_KEY = 'bld.pairs.v1';

export function loadStore(): PairStore {
    try {
        const raw = localStorage.getItem(PAIRS_KEY);
        if (!raw) return emptyStore();
        const parsed = JSON.parse(raw) as PairStore;
        return migrate(parsed);
    } catch {
        return emptyStore();
    }
}

export function saveStore(store: PairStore): void {
    localStorage.setItem(PAIRS_KEY, JSON.stringify(store));
}

export function migrate(store: PairStore): PairStore {
    if (store?.schemaVersion !== 1) return emptyStore();
    return {
        schemaVersion: 1,
        pairs: store.pairs ?? {},
        reviews: store.reviews ?? {},
    };
}

export function exportJSON(store: PairStore): string {
  return JSON.stringify(store, null, 2);
}

export function importJSON(text: string): PairStore {
  const parsed = JSON.parse(text) as PairStore | null;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('That file is not a pair library.');
  }
  if (parsed.schemaVersion !== 1) {
    throw new Error(
      `That file is schema version ${parsed.schemaVersion}; this app reads version 1.`,
    );
  }
  return migrate(parsed);
}
export const SUGGESTIONS_KEY = 'bld.suggestions.v1';

export function loadSuggestions(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(SUGGESTIONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string[]> | null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveSuggestions(words: Record<string, string[]>): void {
  localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(words));
}