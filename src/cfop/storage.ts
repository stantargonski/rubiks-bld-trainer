import { emptyCfopStore, type CaseEntry, type CfopStore, type Confidence } from './types';

export const CFOP_KEY = 'cfop.cases.v1';   // storage slot; the version lives inside the JSON

/** Every CFOP schema this build reads. See TIMER_STORE_VERSIONS on the rule. */
export const CFOP_VERSIONS = [1];

export function loadCfopStore(): CfopStore {
  try {
    const raw = localStorage.getItem(CFOP_KEY);
    if (!raw) return emptyCfopStore();
    return normalizeCfopStore(JSON.parse(raw));
  } catch {
    return emptyCfopStore();
  }
}

export function saveCfopStore(store: CfopStore): void {
  localStorage.setItem(CFOP_KEY, JSON.stringify(store));
}

/**
 * Nothing to migrate at v1, but the same defensive read as the timer store:
 * a bad entry is dropped on its own rather than costing you the whole set.
 *
 * Note this stores only what you've *changed*. Cases you haven't touched have
 * no record at all, which is why an unknown id here is harmless — the case list
 * is the source of truth for what exists, and this is only the overlay.
 */
export function normalizeCfopStore(input: unknown): CfopStore {
  if (!input || typeof input !== 'object') return emptyCfopStore();

  const raw = input as { schemaVersion?: number; cases?: unknown };
  if (
    !CFOP_VERSIONS.includes(raw.schemaVersion as number) ||
    !raw.cases ||
    typeof raw.cases !== 'object'
  ) {
    return emptyCfopStore();
  }

  const cases: Record<string, CaseEntry> = {};
  for (const [id, value] of Object.entries(raw.cases as Record<string, unknown>)) {
    const entry = value as Partial<CaseEntry> | null;
    if (!entry || typeof entry !== 'object') continue;

    cases[id] = {
      id,
      alg: typeof entry.alg === 'string' ? entry.alg : '',
      notes: typeof entry.notes === 'string' ? entry.notes : '',
      confidence: readConfidence(entry.confidence),
      updatedAt: typeof entry.updatedAt === 'number' ? entry.updatedAt : 0,
    };
  }

  return { schemaVersion: 1, cases };
}

function readConfidence(value: unknown): Confidence {
  return value === 1 || value === 2 || value === 3 ? value : 0;
}
