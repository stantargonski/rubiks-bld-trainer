import { useMemo, useState } from 'react'
import { formatTime } from './format'
import { EVENTS, eventOf, type EventId } from './events'
import {
  ao5TrendPerHour, average, best, bestAverage, durationText, mean, totalTime,
} from './stats'
import { activeSession, type Solve, type TimerStore } from './types'
import TimeChart from './charts/TimeChart'
import Histogram from './charts/Histogram'
import SummaryTiles from './charts/SummaryTiles'
import ActivityHeatmap from './charts/ActivityHeatmap'
import AverageDetail from './AverageDetail'
import type { AverageView } from './averageText'
import { DAY, RANGES, SPANS, type Range } from './charts/ranges'
import { BENCH_MAX, type TimerSettings } from './settings'

interface StatsPageProps {
  store: TimerStore
  settings: TimerSettings
  onSettings: (next: TimerSettings) => void
}

export default function StatsPage({ store, settings, onSettings }: StatsPageProps) {
  const decimals = settings.decimals
  /** Whether the strip's event picker is open. */
  const [picking, setPicking] = useState(false)
  // Opens on whatever you were just timing, which is nearly always what you
  // came here to look at.
  const [sessionId, setSessionId] = useState(() => activeSession(store).id)
  const [range, setRange] = useState<Range>(365)
  /** `all`, an `e:<event>` or an `s:<session>` — one control over two kinds of thing. */
  const [filter, setFilter] = useState('all')
  const [span, setSpan] = useState(0)
  /** The average whose solves are open for reading, or null. */
  const [detail, setDetail] = useState<AverageView | null>(null)

  /**
   * "Now", read once when the page opens rather than on every render.
   *
   * A state initialiser is the right place for it: reading the clock during a
   * render would make what the heatmap draws depend on when React happened to
   * re-run the component, and "today" only needs to be decided once per visit.
   */
  const [now] = useState(() => Date.now())

  const session = store.sessions.find((item) => item.id === sessionId) ?? activeSession(store)
  const event = eventOf(session.event)
  const everySolve = useMemo(() => store.sessions.flatMap((item) => item.solves), [store])

  /** Every solve there is, filed by the event it was actually timed under. */
  const byEvent = useMemo(() => {
    const map = new Map<EventId, Solve[]>();
    for (const solve of everySolve) {
      const list = map.get(solve.event);
      if (list) list.push(solve);
      else map.set(solve.event, [solve]);
    }
    return map;
  }, [everySolve]);

  /** Which events have ever been practised, in the catalogue's order. */
  const practised = useMemo(
    () => EVENTS.filter((item) => (byEvent.get(item.id)?.length ?? 0) > 0),
    [byEvent],
  );

  /**
   * Best single across every solve of one event, wherever it was timed.
   *
   * Asked of the solves rather than of the sessions holding them: `best` of an
   * empty session is NaN, and one empty session — which is exactly what creating
   * a session gives you — used to poison the Math.min across all of them and
   * blank this figure for good.
   */
  function bestFor(id: EventId): number {
    return best(byEvent.get(id) ?? [])
  }

  const bench = settings.benchEvents

  /** Adds or removes one event from the strip, keeping the catalogue's order. */
  function toggleBench(id: EventId) {
    const next = bench.includes(id)
      ? bench.filter((item) => item !== id)
      : [...bench, id]
    if (next.length > BENCH_MAX) return
    onSettings({
      ...settings,
      benchEvents: EVENTS.map((item) => item.id).filter((item) => next.includes(item)),
    })
  }

  const activitySolves = useMemo<Solve[]>(() => {
    if (filter === 'all') return everySolve
    if (filter.startsWith('e:')) return byEvent.get(filter.slice(2) as EventId) ?? []
    return store.sessions.find((item) => item.id === filter.slice(2))?.solves ?? []
  }, [filter, store, everySolve, byEvent])

  /** The session's solves, cut down to the graph's window. */
  const windowed = useMemo(() => {
    if (span === 0) return session.solves
    const from = now - span * DAY
    return session.solves.filter((solve) => solve.id >= from)
  }, [session, span, now])

  const trend = ao5TrendPerHour(windowed)

  return (
    <div className="stats-page">
      {/* ---- who you are, in numbers ---- */}
      <section className="card stats-header">
        <div className="header-main">
          <strong className="header-count">{everySolve.length}</strong>
          <span className="header-label">solves</span>
        </div>

        {/* Ordered so the time reads last: it is the figure the row builds to,
            and the group is flush right, so last is also right-most. */}
        <div className="header-figures">
          <div>
            <span className="header-label">events practised</span>
            <strong className="header-figure">{practised.length}</strong>
          </div>
          <div>
            <span className="header-label">time spent solving</span>
            <strong className="header-figure">{durationText(totalTime(everySolve))}</strong>
          </div>
        </div>
      </section>

      {/* ---- the numbers you'd quote someone ---- */}
      <section className="card">
        <div className="bench-strip">
          <h2 className="bench-title">all-time best single</h2>
          {bench.map((id) => (
            <div className="bench" key={id}>
              <span className="bench-label">{eventOf(id).short}</span>
              <strong className="bench-value">{formatTime(bestFor(id), decimals)}</strong>
            </div>
          ))}
          <button
            type="button"
            className="bench-edit"
            aria-expanded={picking}
            onClick={() => setPicking(!picking)}
          >
            {picking ? 'done' : 'edit'}
          </button>
        </div>

        {picking && (
          <div className="bench-picker">
            <p>
              Up to {BENCH_MAX}, so the row stays one line and the figures stay
              the size you'd quote them at.
            </p>
            <div className="bench-options">
              {EVENTS.map((item) => {
                const on = bench.includes(item.id)
                return (
                  <label key={item.id} className={on ? 'bench-option on' : 'bench-option'}>
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={!on && bench.length >= BENCH_MAX}
                      onChange={() => toggleBench(item.id)}
                    />
                    {item.name}
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* ---- when you practised ---- */}
      <section className="card">
        <div className="card-head">
          <h2 className="panel-title">activity</h2>
          <div className="card-controls">
            <select value={filter} onChange={(change) => setFilter(change.target.value)}>
              <option value="all">everything</option>
              {practised.length > 0 && (
                <optgroup label="event">
                  {practised.map((item) => (
                    <option key={item.id} value={`e:${item.id}`}>{item.name}</option>
                  ))}
                </optgroup>
              )}
              <optgroup label="session">
                {store.sessions.map((item) => (
                  <option key={item.id} value={`s:${item.id}`}>{item.name}</option>
                ))}
              </optgroup>
            </select>

            <select
              value={String(range)}
              onChange={(change) => setRange(Number(change.target.value) as Range)}
            >
              {RANGES.map((item) => (
                <option key={item.id} value={String(item.id)}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>

        <ActivityHeatmap solves={activitySolves} range={range} now={now} />
      </section>

      {/* ---- every event you've touched ---- */}
      {practised.length > 0 && (
        <section className="card">
          <h2 className="panel-title">by event</h2>
          <table className="stats event-table">
            <thead>
              <tr>
                <th scope="col">event</th>
                <th scope="col">solves</th>
                <th scope="col">best</th>
                <th scope="col">best ao5</th>
                <th scope="col">mean</th>
              </tr>
            </thead>
            <tbody>
              {practised.map((item) => {
                const solves = byEvent.get(item.id) ?? []

                return (
                  <tr key={item.id}>
                    <th scope="row">{item.name}</th>
                    <td>{solves.length}</td>
                    <td>{formatTime(best(solves), decimals)}</td>
                    <td>{formatTime(bestAverage(solves, 5), decimals)}</td>
                    <td>{formatTime(mean(solves), decimals)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* ---- one session, in detail ---- */}
      <section className="card">
        <div className="card-head">
          <h2 className="panel-title">
            {session.name} <span className="mode-tag">{event.short}</span>
          </h2>
          <div className="card-controls">
            <select
              value={session.id}
              onChange={(change) => setSessionId(change.target.value)}
            >
              {store.sessions.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>

        <SummaryTiles
          solves={session.solves}
          // Every solve of this event rather than this session's, which is what
          // "all-time" has to mean — the boxes that say so are asking about the
          // event, and sessions are how you chose to divide it up.
          allTime={byEvent.get(session.event) ?? []}
          decimals={decimals}
          event={event}
          order={settings.statTiles}
          hidden={settings.statTilesOff}
          onOpenAverage={setDetail}
        />

        <h3 className="chart-title">
          every solve
          <span>
            <i className="key ao5" /> ao5
            <i className="key ao12" /> ao12
            <i className="key ao100" /> ao100
            <i className="key pb" /> personal best
          </span>
          <span className="chart-spans">
            {SPANS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={span === item.id}
                onClick={() => setSpan(item.id)}
              >
                {item.name}
              </button>
            ))}
          </span>
        </h3>

        <TimeChart solves={windowed} decimals={decimals} />

        <p className="chart-note">
          ao5 change per hour spent solving:{' '}
          <b className={Number.isFinite(trend) ? (trend < 0 ? 'good' : 'bad') : undefined}>
            {Number.isFinite(trend) ? `${trend > 0 ? '+' : ''}${trend.toFixed(2)}s` : '—'}
          </b>
          {Number.isFinite(trend) && (
            <span> — {trend < 0 ? 'getting faster' : 'getting slower'}</span>
          )}
        </p>

        <h3 className="chart-title">
          where they land
          <span>ao5 now {formatTime(average(session.solves, 5), decimals)}</span>
          {/* Beside the chart it draws on, not buried in settings — it is the
              kind of thing you switch off for one look and back on after. */}
          <span className="chart-spans">
            <button
              type="button"
              aria-pressed={settings.showHistogramMean}
              onClick={() => onSettings({
                ...settings,
                showHistogramMean: !settings.showHistogramMean,
              })}
            >
              mean line
            </button>
          </span>
        </h3>
        <Histogram
          solves={windowed}
          decimals={decimals}
          showMean={settings.showHistogramMean}
        />
      </section>

      {detail && (
        <AverageDetail
          label={detail.label}
          solves={detail.solves}
          value={detail.value}
          decimals={decimals}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  )
}
