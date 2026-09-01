/**
 * The time windows the stats page offers, in one place.
 *
 * Separate from the components that use them so those files export nothing but
 * components — which is what keeps fast refresh working during development.
 */

export const DAY = 86_400_000;

/** How far back the activity heatmap looks. 0 means everything. */
export type Range = 90 | 180 | 365 | 0;

export const RANGES: { id: Range; name: string }[] = [
  { id: 90, name: 'last 3 months' },
  { id: 180, name: 'last 6 months' },
  { id: 365, name: 'last 12 months' },
  { id: 0, name: 'all time' },
];

/** How far back the solve graph looks. 0 means everything. */
export const SPANS: { id: number; name: string }[] = [
  { id: 1, name: 'day' },
  { id: 7, name: 'week' },
  { id: 30, name: 'month' },
  { id: 90, name: '3 months' },
  { id: 0, name: 'all time' },
];
