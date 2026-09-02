import { useMemo } from 'react'
import { dayCounts, dayKey } from '../stats'
import type { Solve } from '../types'
import { DAY, type Range } from './ranges'

/**
 * When you actually practised, a square per day.
 *
 * Every other chart on this page answers "how fast"; this one answers "how
 * often", which is the question the others quietly depend on. A month-long gap
 * explains a flat average better than any statistic about the solves themselves.
 *
 * Laid out in columns of weeks running left to right, weekdays down — the shape
 * everyone already knows how to read.
 */

const WEEKDAYS = ['monday', 'wednesday', 'friday'];

const MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

/** One column of the grid: a week of days, and the month it opens if it opens one. */
interface Week {
  days: { key: string; count: number; date: Date }[];
  /** The month name to print above this column, or null to print nothing. */
  month: string | null;
}

interface ActivityHeatmapProps {
  solves: Solve[]
  range: Range
  /** Owned by the page, so nothing here has to read the clock during a render. */
  now: number
}

/** Midnight local time on the day `when` falls in. */
function startOfDay(when: number): Date {
  const date = new Date(when);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function ActivityHeatmap({ solves, range, now }: ActivityHeatmapProps) {
  const { weeks, total, busiest } = useMemo(() => {
    const counts = dayCounts(solves);

    const today = startOfDay(now);
    // All-time starts at the first solve, but never draws less than a month —
    // a single column of squares reads as a bug rather than as a new account.
    const earliest = solves.length > 0
      ? startOfDay(Math.min(...solves.map((solve) => solve.id)))
      : today;

    const from = range === 0
      ? new Date(Math.min(earliest.getTime(), today.getTime() - 27 * DAY))
      : new Date(today.getTime() - (range - 1) * DAY);

    // Back up to the Monday on or before the start, so every column is a full week.
    const start = startOfDay(from.getTime());
    const weekday = (start.getDay() + 6) % 7;          // 0 = Monday
    start.setDate(start.getDate() - weekday);

    const columns: Week[] = [];
    let running = 0;
    let peak = 0;
    /** The month the previous column opened in, so a change of it is a boundary. */
    let lastMonth = -1;

    for (let cursor = new Date(start); cursor <= today;) {
      const days: Week['days'] = [];

      for (let day = 0; day < 7; day += 1) {
        const date = new Date(cursor);
        const key = dayKey(date.getTime());
        // Days after today are drawn as gaps, not as zero-activity days.
        const count = date > today ? -1 : (counts.get(key) ?? 0);

        days.push({ key, count, date });
        if (count > 0) {
          running += count;
          peak = Math.max(peak, count);
        }
        cursor.setDate(cursor.getDate() + 1);
      }

      // Read off the Monday the column starts on: a month that begins midweek
      // belongs to the column that first shows a day of it, which is this one.
      // The first column is never a boundary — there is nothing before it to be
      // a boundary from, and a gap at the left edge reads as a missing week.
      const month = days[0].date.getMonth();
      columns.push({ days, month: month === lastMonth ? null : MONTHS[month] });
      lastMonth = month;
    }

    return { weeks: columns, total: running, busiest: peak };
  }, [solves, range, now]);

  /**
   * Which of the four fill steps a day earns. Split by share of the busiest day
   * rather than by fixed counts, so a 2x2 session of ninety solves and a 7x7
   * session of six both produce a readable chart.
   */
  function level(count: number): string {
    if (count <= 0) return 'a0';
    if (busiest <= 1) return 'a3';
    const share = count / busiest;
    if (share > 0.66) return 'a3';
    if (share > 0.33) return 'a2';
    return 'a1';
  }

  return (
    <div className="activity">
      <div className="activity-scroll">
        <div className="activity-days">
          {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
        </div>

        <div className="activity-grid">
          {weeks.map((week, index) => (
            <div
              // The gap goes before every month but the first: at the left edge
              // it would read as a missing week rather than as a divider.
              className={week.month && index > 0 ? 'activity-week month-start' : 'activity-week'}
              key={week.days[0].key}
            >
              {/* Inside the column and positioned over it, so the label is
                  aligned to its month by construction — a separate row of
                  labels would have to re-derive every column's width and would
                  drift the moment one of them changed. */}
              {week.month && <span className="activity-month">{week.month}</span>}

              {week.days.map((day) => (
                <i
                  key={day.key}
                  className={day.count < 0 ? 'activity-cell gap' : `activity-cell ${level(day.count)}`}
                  title={day.count < 0
                    ? undefined
                    : `${day.count} ${day.count === 1 ? 'solve' : 'solves'} on ${day.key}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <p className="activity-foot">
        <span>{total} {total === 1 ? 'solve' : 'solves'}</span>
        <span className="activity-key">
          less
          {['a0', 'a1', 'a2', 'a3'].map((step) => (
            <i key={step} className={`activity-cell ${step}`} />
          ))}
          more
        </span>
      </p>
    </div>
  );
}
