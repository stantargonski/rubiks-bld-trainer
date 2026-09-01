/**
 * The WCA event list, and everything the rest of the app needs to know about an
 * event in one place.
 *
 * This replaces the old `PuzzleMode = '333' | '3bld'`. Every question that used
 * to be answered by `mode === '3bld'` — does the timer split memo from
 * execution, is there an inspection period, is the round a mean of three — is
 * now a field here, so adding an event is one entry in this table rather than a
 * new branch in five components.
 */

export type EventId =
  | '222' | '333' | '444' | '555' | '666' | '777'
  | '333bf' | '333oh' | '333fm'
  | 'clock' | 'minx' | 'pyram' | 'skewb' | 'sq1'
  | '444bf' | '555bf' | '333mbf';

/**
 * How a scramble is built. The generator switches on this rather than on the
 * event id, so 3x3, OH and FMC share one branch instead of three identical ones.
 */
export type ScrambleKind =
  | { kind: 'nxn'; size: number; length: number }
  /** An NxN scramble that ends held at a random angle — every blindfolded event. */
  | { kind: 'nxnbf'; size: number; length: number }
  | { kind: 'fmc' }
  | { kind: 'mbf'; count: number }
  | { kind: 'clock' }
  | { kind: 'minx' }
  | { kind: 'pyram' }
  | { kind: 'skewb' }
  | { kind: 'sq1' };

export interface WcaEvent {
  id: EventId;
  /** Full name, for the picker. */
  name: string;
  /** Two to five characters, for tags and table rows. */
  short: string;
  scramble: ScrambleKind;
  /** Whether the scramble preview can draw this puzzle at all. */
  preview: 'nxn' | 'none';
  /** Cube width, when there is one. Drives the preview and the scramble. */
  size?: number;
  /** Memo and execution are timed separately — true for every blindfolded event. */
  split: boolean;
  /** WCA inspection applies. False for blindfolded events and FMC. */
  inspection: boolean;
  /** How a competition round of this event is scored. */
  format: 'ao5' | 'mo3';
}

/**
 * Move counts are the WCA's own: 3x3 is 20 because that is what the regulations
 * ask a random-state scrambler to emit, and the bigger cubes are the published
 * random-move lengths.
 */
export const EVENTS: WcaEvent[] = [
  { id: '333', name: '3x3x3', short: '3x3', size: 3, preview: 'nxn', split: false, inspection: true, format: 'ao5', scramble: { kind: 'nxn', size: 3, length: 20 } },
  { id: '222', name: '2x2x2', short: '2x2', size: 2, preview: 'nxn', split: false, inspection: true, format: 'ao5', scramble: { kind: 'nxn', size: 2, length: 11 } },
  { id: '444', name: '4x4x4', short: '4x4', size: 4, preview: 'nxn', split: false, inspection: true, format: 'ao5', scramble: { kind: 'nxn', size: 4, length: 45 } },
  { id: '555', name: '5x5x5', short: '5x5', size: 5, preview: 'nxn', split: false, inspection: true, format: 'ao5', scramble: { kind: 'nxn', size: 5, length: 60 } },
  { id: '666', name: '6x6x6', short: '6x6', size: 6, preview: 'nxn', split: false, inspection: true, format: 'mo3', scramble: { kind: 'nxn', size: 6, length: 80 } },
  { id: '777', name: '7x7x7', short: '7x7', size: 7, preview: 'nxn', split: false, inspection: true, format: 'mo3', scramble: { kind: 'nxn', size: 7, length: 100 } },
  { id: '333bf', name: '3x3x3 Blindfolded', short: '3BLD', size: 3, preview: 'nxn', split: true, inspection: false, format: 'mo3', scramble: { kind: 'nxnbf', size: 3, length: 20 } },
  { id: '333oh', name: '3x3x3 One-Handed', short: 'OH', size: 3, preview: 'nxn', split: false, inspection: true, format: 'ao5', scramble: { kind: 'nxn', size: 3, length: 20 } },
  { id: '333fm', name: '3x3x3 Fewest Moves', short: 'FMC', size: 3, preview: 'nxn', split: false, inspection: false, format: 'mo3', scramble: { kind: 'fmc' } },
  { id: 'clock', name: 'Clock', short: 'Clock', preview: 'none', split: false, inspection: true, format: 'ao5', scramble: { kind: 'clock' } },
  { id: 'minx', name: 'Megaminx', short: 'Minx', preview: 'none', split: false, inspection: true, format: 'ao5', scramble: { kind: 'minx' } },
  { id: 'pyram', name: 'Pyraminx', short: 'Pyra', preview: 'none', split: false, inspection: true, format: 'ao5', scramble: { kind: 'pyram' } },
  { id: 'skewb', name: 'Skewb', short: 'Skewb', preview: 'none', split: false, inspection: true, format: 'ao5', scramble: { kind: 'skewb' } },
  { id: 'sq1', name: 'Square-1', short: 'Sq-1', preview: 'none', split: false, inspection: true, format: 'ao5', scramble: { kind: 'sq1' } },
  { id: '444bf', name: '4x4x4 Blindfolded', short: '4BLD', size: 4, preview: 'nxn', split: true, inspection: false, format: 'mo3', scramble: { kind: 'nxnbf', size: 4, length: 40 } },
  { id: '555bf', name: '5x5x5 Blindfolded', short: '5BLD', size: 5, preview: 'nxn', split: true, inspection: false, format: 'mo3', scramble: { kind: 'nxnbf', size: 5, length: 60 } },
  { id: '333mbf', name: '3x3x3 Multi-Blind', short: 'MBLD', size: 3, preview: 'none', split: true, inspection: false, format: 'mo3', scramble: { kind: 'mbf', count: 3 } },
];

const BY_ID = new Map(EVENTS.map((event) => [event.id, event]));

export const DEFAULT_EVENT: EventId = '333';

/** Never throws: an id out of an old store or a hand-edited backup falls back. */
export function eventOf(id: string | undefined): WcaEvent {
  return BY_ID.get(id as EventId) ?? BY_ID.get(DEFAULT_EVENT)!;
}

export function isEventId(value: unknown): value is EventId {
  return typeof value === 'string' && BY_ID.has(value as EventId);
}

/**
 * The ten a new install opens with — one session each, so the first thing you
 * time is a choice rather than a setup step.
 */
export const STARTER_EVENTS: EventId[] = [
  '333', '222', '444', '555', '333bf', '333oh', 'pyram', 'skewb', 'minx', 'sq1',
];
