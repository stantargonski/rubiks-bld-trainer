/**
 * The background picture, kept in IndexedDB rather than localStorage.
 *
 * Deliberately: localStorage is a ~5MB budget shared by everything, and the
 * solve history and pair library share it. A photo is the one thing here you
 * can always fetch again and the solves are the one thing you can never retype,
 * so the photo doesn't get to sit in the same drawer.
 */

const DB_NAME = 'rubiks-trainer';
const STORE = 'assets';
const KEY = 'background';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => { resolve(request.result); };
    request.onerror = () => { reject(request.error ?? new Error('IndexedDB unavailable')); };
  });
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then((db) => new Promise<T>((resolve, reject) => {
    const request = work(db.transaction(STORE, mode).objectStore(STORE));

    request.onsuccess = () => { resolve(request.result); };
    request.onerror = () => { reject(request.error ?? new Error('IndexedDB write failed')); };
  }));
}

export async function putBackground(blob: Blob): Promise<void> {
  await run('readwrite', (store) => store.put(blob, KEY));
}

export async function getBackground(): Promise<Blob | null> {
  try {
    return (await run<Blob | undefined>('readonly', (store) => store.get(KEY))) ?? null;
  } catch {
    // A private window or a blocked database is a reason to have no wallpaper,
    // not a reason to fail to start.
    return null;
  }
}

export async function clearBackground(): Promise<void> {
  try {
    await run('readwrite', (store) => store.delete(KEY));
  } catch {
    // Nothing to remove if the store was never reachable.
  }
}

/**
 * Shrinks a chosen picture to something worth storing. A phone photo is 4000px
 * of detail nobody sees behind a timer, and every byte of it would be read back
 * on every load.
 *
 * Returns the original if the browser can't decode it — better a large
 * background than none.
 */
export async function downscale(file: File, maxWidth = 2560): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width);

    if (scale === 1 && file.size < 1_500_000) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext('2d');
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.85);
    });
    return blob ?? file;
  } catch {
    return file;
  }
}

/** A data URL of the stored picture, for putting one in a backup file. */
export function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => { resolve(reader.result as string); };
    reader.onerror = () => { reject(reader.error ?? new Error('Could not read the image')); };
    reader.readAsDataURL(blob);
  });
}

/** The other direction, for restoring one. */
export async function fromDataUrl(url: string): Promise<Blob> {
  return await (await fetch(url)).blob();
}
