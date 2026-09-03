/**
 * Which boxes the stats page shows, and in what order.
 *
 * A plain module rather than part of the component: a component file that also
 * exports data is a component file fast refresh stops being able to reload.
 */
export interface TileSpec {
  id: string;
  name: string;
  /** Only meaningful where memo and execution are timed apart. */
  splitOnly?: boolean;
}

export const TILES: TileSpec[] = [
  { id: 'solves', name: 'solves' },
  { id: 'time', name: 'time solving' },
  { id: 'best', name: 'best single' },
  { id: 'mean', name: 'mean' },
  { id: 'deviation', name: 'deviation' },
  { id: 'bestAo5', name: 'best ao5' },
  { id: 'bestAo12', name: 'best ao12' },
  { id: 'bestAo100', name: 'best ao100' },
  { id: 'memo', name: 'memo', splitOnly: true },
  { id: 'exec', name: 'exec', splitOnly: true },
];
