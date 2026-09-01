import { useState } from 'react'
import { formatTime } from './format'
import { average, best, bestAverage, mean, totalTime } from './stats'
import { activeSession, type TimerStore } from './types'
import TimeChart from './charts/TimeChart'
import Histogram from './charts/Histogram'
import SummaryTiles from './charts/SummaryTiles'

/** Minutes and hours — the same shorthand the tiles use. */
function duration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—'

  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

interface StatsPageProps {
  store: TimerStore
  decimals: 2 | 3
}

export default function StatsPage({ store, decimals }: StatsPageProps) {
  // Opens on whatever you were just timing, which is nearly always what you
  // came here to look at.
  const [sessionId, setSessionId] = useState(() => activeSession(store).id)

  const session = store.sessions.find((item) => item.id === sessionId) ?? activeSession(store)
  const everySolve = store.sessions.flatMap((item) => item.solves)

  // Best-of across sessions rather than an average over all of them: an ao5
  // that spanned two sessions would be five solves that never happened together.
  const bestEver = Math.min(...store.sessions.map((item) => best(item.solves)))
  const bestAo5 = Math.min(...store.sessions.map((item) => bestAverage(item.solves, 5)))

  return (
    <div className="stats-page">
      <section className="settings-group">
        <h2 className="panel-title">all time</h2>
        <div className="tiles">
          <div className="tile">
            <span className="tile-label">solves</span>
            <strong className="tile-value">{everySolve.length}</strong>
          </div>
          <div className="tile">
            <span className="tile-label">time spent</span>
            <strong className="tile-value">{duration(totalTime(everySolve))}</strong>
          </div>
          <div className="tile">
            <span className="tile-label">sessions</span>
            <strong className="tile-value">{store.sessions.length}</strong>
          </div>
          <div className="tile">
            <span className="tile-label">best single</span>
            <strong className="tile-value">{formatTime(bestEver, decimals)}</strong>
          </div>
          <div className="tile">
            <span className="tile-label">best ao5</span>
            <strong className="tile-value">{formatTime(bestAo5, decimals)}</strong>
          </div>
        </div>

        <table className="stats session-table">
          <thead>
            <tr>
              <th scope="col">session</th>
              <th scope="col">solves</th>
              <th scope="col">best</th>
              <th scope="col">ao5</th>
              <th scope="col">mean</th>
            </tr>
          </thead>
          <tbody>
            {store.sessions.map((item) => (
              <tr
                key={item.id}
                className={item.id === session.id ? 'current' : undefined}
                onClick={() => setSessionId(item.id)}
              >
                <th scope="row">
                  {item.name} <span className="mode-tag">{item.mode === '3bld' ? '3BLD' : '3x3'}</span>
                </th>
                <td>{item.solves.length}</td>
                <td>{formatTime(best(item.solves), decimals)}</td>
                <td>{formatTime(bestAverage(item.solves, 5), decimals)}</td>
                <td>{formatTime(mean(item.solves), decimals)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="settings-group">
        <div className="stats-head">
          <h2 className="panel-title">{session.name}</h2>
          <select
            className="session-select"
            value={session.id}
            onChange={(event) => setSessionId(event.target.value)}
          >
            {store.sessions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.solves.length})
              </option>
            ))}
          </select>
        </div>

        <SummaryTiles solves={session.solves} decimals={decimals} mode={session.mode} />

        <h3 className="chart-title">
          every solve
          <span>
            <i className="key ao5" /> ao5
            <i className="key ao12" /> ao12
            <i className="key pb" /> personal best
          </span>
        </h3>
        <TimeChart solves={session.solves} decimals={decimals} />

        <h3 className="chart-title">
          where they land
          <span>ao5 now {formatTime(average(session.solves, 5), decimals)}</span>
        </h3>
        <Histogram solves={session.solves} decimals={decimals} />
      </section>
    </div>
  )
}
