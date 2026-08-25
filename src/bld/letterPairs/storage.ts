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

export function exportJSON(text: string): PairStore {
    return migrate(JSON.parse(text) as PairStore);
}

