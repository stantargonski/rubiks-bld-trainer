/**
 * The window of time a chart is looking at, and the one place that applies it.
 *
 * The stats page used to cut its solves down in three unrelated spots — one for
 * the heatmap, one for the graph, and a third index behind the event table —
 * each with its own idea of what a range was. The heatmap could only be asked
 * for one of four fixed spans and the graph for one of five, and neither could
 * be asked for "between these two dates" or "the last fifty".
 *
 * So a window is a value here rather than a number of days scattered around the
 * page, and both charts resolve it the same way.
 */

import type { Solve } from '../types';

export const DAY = 86_400_000;

export type TimeWindow =
  | { kind: 'all' }
  /** The last `days` days, ending today. */
  | { kind: 'days'; days: number }
  /** Between two days, both included. */
  | { kind: 'dates'; from: number; to: number }
  /** The most recent `n` solves, however long they took to do. */
  | { kind: 'lastN'; n: number };

export const RANGE_ALL: TimeWindow = { kind: 'all' };

/** How far back the presets reach. Beyond this, use two dates. */
export const MAX_WINDOW_DAYS = 3650;

/** The most solves `lastN` will take. Past this the window is `all` in disguise. */
export const MAX_LAST_N = 100_000;

/** The spans offered as buttons, before you go and type your own. */
export const PRESETS: { days: number; name: string }[] = [
  { days: 1, name: 'day' },
  { days: 7, name: 'week' },
  { days: 30, name: 'month' },
  { days: 90, name: '3 months' },
  { days: 365, name: 'year' },
];

/** Midnight local time on the day `when` falls in. */
export function startOfDay(when: number): Date {
  const date = new Date(when);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** The last millisecond of the day `when` falls in, so a `to` date includes itself. */
export function endOfDay(when: number): number {
  const date = new Date(when);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

/**
 * The solves a window keeps, in the order they were given.
 *
 * `lastN` slices off the end because session solves are stored oldest first —
 * see the note on `Session.solves`. Nothing here drops a DNF: an average is
 * trimmed on the assumption that a DNF sorts last, so removing them up here
 * would quietly turn every ao5 on the page into something that is not an ao5.
 */
export function applyWindow(solves: Solve[], range: TimeWindow, now: number): Solve[] {
  switch (range.kind) {
    case 'all':
      return solves;
    // Whole days, ending with today — so "day" is today's solves and "week" is
    // the last seven dates, which is what the calendar beside it draws. The
    // graph used to count back a rolling 24 hours per day instead, so the two
    // charts disagreed about the same word by up to a day's solves.
    case 'days': {
      const from = startOfDay(now - (range.days - 1) * DAY).getTime();
      return solves.filter((solve) => solve.id >= from);
    }
    case 'dates': {
      const from = startOfDay(range.from).getTime();
      const to = endOfDay(range.to);
      return solves.filter((solve) => solve.id >= from && solve.id <= to);
    }
    case 'lastN':
      return range.n >= solves.length ? solves : solves.slice(-range.n);
  }
}

/**
 * The days a window covers, for the charts that draw a calendar rather than a
 * list. `from` of null means "as far back as there is anything", which only the
 * caller can decide — the heatmap, for one, never draws less than a month.
 */
export function windowBounds(
  range: TimeWindow,
  solves: Solve[],
  now: number,
): { from: number | null; to: number } {
  switch (range.kind) {
    case 'all':
      return { from: null, to: now };
    // `days - 1`, because a one-day window is today rather than today and
    // yesterday.
    case 'days':
      return { from: startOfDay(now - (range.days - 1) * DAY).getTime(), to: now };
    case 'dates':
      return { from: startOfDay(range.from).getTime(), to: endOfDay(range.to) };
    case 'lastN': {
      const kept = applyWindow(solves, range, now);
      // Fewer solves than asked for is not an empty window, it is all of them.
      if (kept.length === 0 || kept.length < range.n) return { from: null, to: now };
      return { from: startOfDay(kept[0].id).getTime(), to: now };
    }
  }
}

/** What the window is called, once it is no longer one of the buttons. */
export function windowLabel(range: TimeWindow): string {
  switch (range.kind) {
    case 'all':
      return 'all time';
    case 'days': {
      const preset = PRESETS.find((item) => item.days === range.days);
      return preset ? preset.name : `last ${range.days} days`;
    }
    case 'dates':
      return `${dateInput(range.from)} to ${dateInput(range.to)}`;
    case 'lastN':
      return `last ${range.n} solves`;
  }
}

/** A timestamp as `<input type="date">` wants it: local YYYY-MM-DD, not UTC. */
export function dateInput(when: number): string {
  const date = new Date(when);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * A `<input type="date">` value back to a timestamp, or null if it isn't one.
 *
 * Parsed by hand rather than by `new Date(value)`: that reads a bare
 * `YYYY-MM-DD` as UTC midnight, which lands on the day before for anyone west
 * of Greenwich — so picking today would quietly exclude today.
 */
export function inputDate(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}
