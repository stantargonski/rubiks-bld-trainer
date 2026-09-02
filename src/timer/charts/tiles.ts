/**
 * Which boxes the stats page can show, and in what order they ship.
 *
 * A plain module rather than part of the component: the settings reader needs
 * this list to validate a saved layout, and a component file that also exports
 * data is a component file fast refresh stops being able to reload.
 *
 * Storing ids and nothing else is deliberate. A saved layout that described the
 * boxes themselves could disagree with the build about what a box is; a list of
 * ids can only ever be right, out of date, or unknown — and unknown is dropped.
 */
export interface TileSpec {
  id: string;
  /** How settings names it, where there is no session in front of you. */
  name: string;
  /** Only meaningful where memo and execution are timed apart. */
  splitOnly?: boolean;
}

export const TILES: TileSpec[] = [
  { id: 'solves', name: 'solves' },
  { id: 'time', name: 'time solving' },
  { id: 'best', name: 'best single' },
  // Directly after the session best, which is the figure it puts in context.
  { id: 'allTimeBestAo5', name: 'all-time best ao5' },
  { id: 'mean', name: 'mean' },
  { id: 'deviation', name: 'deviation' },
  { id: 'bestAo5', name: 'best ao5' },
  { id: 'bestAo12', name: 'best ao12' },
  { id: 'bestAo100', name: 'best ao100' },
  { id: 'memo', name: 'memo', splitOnly: true },
  { id: 'exec', name: 'exec', splitOnly: true },
];

/** Every box, in the order they ship in. */
export const DEFAULT_STAT_TILES: string[] = TILES.map((tile) => tile.id);

export function tileSpec(id: string): TileSpec | undefined {
  return TILES.find((tile) => tile.id === id);
}
