import type { Letter } from '../cube/speffz';

export type Scope = 'shared' | 'corners' | 'edges';

export interface Settings {
    schemaVersion: 1;
    cornerBuffer: Letter;
    edgeBuffer: Letter;
}

export const DEFAULT_SETTINGS: Settings = {
    schemaVersion: 1,
    cornerBuffer: 'E',
    edgeBuffer: 'U',
}

export const SETTINGS_KEY = 'bld.settings.v1';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? readSettings(JSON.parse(raw)) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Settings out of an untrusted blob — a saved one, or one from a backup file. */
export function readSettings(input: unknown): Settings {
  const parsed = input as Partial<Settings> | null;
  if (!parsed || parsed.schemaVersion !== 1) return DEFAULT_SETTINGS;
  return {
    schemaVersion: 1,
    cornerBuffer: parsed.cornerBuffer ?? DEFAULT_SETTINGS.cornerBuffer,
    edgeBuffer: parsed.edgeBuffer ?? DEFAULT_SETTINGS.edgeBuffer,
  };
}

export function saveSettings(settings: Settings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

