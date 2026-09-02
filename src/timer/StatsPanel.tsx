import { useMemo } from 'react'
import { formatTime } from './format'
import { average, best, bestAverage, mean, meanExec, meanMemo } from './stats'
import { effectiveMs, type Solve } from './types'
import type { WcaEvent } from './events'

interface StatsPanelProps {
    solves: Solve[]
    decimals: 2 | 3
    event: WcaEvent
    /** Opens the solves behind one of the averages. Absent means the figures are
        text rather than controls, which is what the settings-page mock wants. */
    onOpenAverage?: (label: string, solves: Solve[]) => void
}

export default function StatsPanel({ solves, decimals, event, onOpenAverage }: StatsPanelProps) {
    const latest = solves.length > 0 ? effectiveMs(solves[solves.length-1]) : NaN

    // Memoised because the rail redraws on every clock tick and `bestAverage`
    // walks the whole session once per window — at a hundred that is twenty
    // times the ao5 shift, which is enough to be felt through the space bar.
    // `size` is what makes the current figure openable: it is the window the
    // average was taken over, and the single has no window to show.
    const rows = useMemo(() => [
      { label: 'single', size: 0, current: latest, record: best(solves) },
      { label: 'ao5', size: 5, current: average(solves, 5), record: bestAverage(solves, 5) },
      { label: 'ao12', size: 12, current: average(solves, 12), record: bestAverage(solves, 12) },
      { label: 'ao100', size: 100, current: average(solves, 100), record: bestAverage(solves, 100) },
    ], [solves, latest])
  return (
    <>
      <table className="stats">
        <thead>
          <tr>
            <th />
            <th>current</th>
            <th>best</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>
                {onOpenAverage && row.size > 0 && !Number.isNaN(row.current) ? (
                  <button
                    type="button"
                    className="ao-open"
                    onClick={() => onOpenAverage(row.label, solves.slice(-row.size))}
                  >
                    {formatTime(row.current, decimals)}
                  </button>
                ) : formatTime(row.current, decimals)}
              </td>
              <td>{formatTime(row.record, decimals)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="stats-foot">
        <span>{solves.length} solves</span>
        <span>mean {formatTime(mean(solves), decimals)}</span>
      </p>

      {event.split && (
        <p className="stats-foot">
          <span>memo {formatTime(meanMemo(solves), decimals)}</span>
          <span>exec {formatTime(meanExec(solves), decimals)}</span>
        </p>
      )}
    </>
  )
}
