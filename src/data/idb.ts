/**
 * The one IndexedDB database this app opens, and the three operations anything
 * needs from it.
 *
 * Split out of the background-picture store because it is no longer only the
 * picture that lives here: the pre-migration snapshot does too. Both share one
 * database, one object store and one version, so there is exactly one upgrade
 * path in the app and nothing has to agree with anything else about it.
 *
 * Adding a key is free. Never bump `VERSION` to add one — a new key needs no
 * schema change, and an upgrade that runs on a browser holding the only copy of
 * someone's data is a risk taken for nothing.
 */

const DB_NAME = 'rubiks-trainer';
const STORE = 'assets';
const VERSION = 1;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => { resolve(request.result); };
    request.onerror = () => { reject(request.error ?? new Error('IndexedDB unavailable')); };
  });
}

function run<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return open().then((db) => new Promise<T>((resolve, reject) => {
    const request = work(db.transaction(STORE, mode).objectStore(STORE));

    request.onsuccess = () => { resolve(request.result); };
    request.onerror = () => { reject(request.error ?? new Error('IndexedDB write failed')); };
  }));
}

/** The value at `key`, or null if it isn't there and if the database isn't either. */
export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    return (await run<T | undefined>('readonly', (store) => store.get(key))) ?? null;
  } catch {
    // A private window or a blocked database is a reason to have no stored
    // value, not a reason to fail to start.
    return null;
  }
}

/** Writes `value` at `key`. Throws, so callers that care can say what failed. */
export async function idbPut(key: string, value: unknown): Promise<void> {
  await run('readwrite', (store) => store.put(value, key));
}

export async function idbDelete(key: string): Promise<void> {
  try {
    await run('readwrite', (store) => store.delete(key));
  } catch {
    // Nothing to remove if the store was never reachable.
  }
}
