/**
 * The background picture, kept in IndexedDB rather than localStorage.
 *
 * Deliberately: localStorage is a ~5MB budget shared by everything, and the
 * solve history and pair library share it. A photo is the one thing here you
 * can always fetch again and the solves are the one thing you can never retype,
 * so the photo doesn't get to sit in the same drawer.
 */

import { idbDelete, idbGet, idbPut } from '../data/idb';

const KEY = 'background';

export async function putBackground(blob: Blob): Promise<void> {
  await idbPut(KEY, blob);
}

export async function getBackground(): Promise<Blob | null> {
  return await idbGet<Blob>(KEY);
}

export async function clearBackground(): Promise<void> {
  await idbDelete(KEY);
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
