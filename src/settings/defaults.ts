import type { Letter } from '../cube/speffz';

export type Scope = 'shared' | 'corners' | 'edges';

export interface Settings {
    schemaVersion: 1;
    cornerBuffer: Letter;
    edgeBuffer: Letter;
    scope: Scope;
}

export const DEFAULT_SETTINGS: Settings = {
    schemaVersion: 1,
    cornerBuffer: 'E',
    edgeBuffer: 'U',
    scope: 'shared',
}

export const SETTINGS_KEY = 'bld.settings.v1';

export function loadSettings(): Settings {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return DEFAULT_SETTINGS;
        const parsed = JSON.parse(raw) as Settings;
        if (parsed.schemaVersion !== 1) return DEFAULT_SETTINGS;
        return { ...DEFAULT_SETTINGS, ...parsed};
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function saveSettings(settings: Settings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

