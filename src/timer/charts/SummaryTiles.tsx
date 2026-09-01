import { formatTime } from '../format'
import {
  average, best, bestAverage, mean, meanExec, meanMemo, stdev, totalTime,
} from '../stats'
import type { PuzzleMode, Solve } from '../types'

/** Minutes and hours, for a figure nobody wants read out in seconds. */
function duration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—'

  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="tile">
      <span className="tile-label">{label}</span>
      <strong className="tile-value">{value}</strong>
      {note && <span className="tile-note">{note}</span>}
    </div>
  )
}

interface SummaryTilesProps {
  solves: Solve[]
  decimals: 2 | 3
  mode: PuzzleMode
}

export default function SummaryTiles({ solves, decimals, mode }: SummaryTilesProps) {
  const time = (ms: number) => formatTime(ms, decimals)

  return (
    <div className="tiles">
      <Tile label="solves" value={String(solves.length)} />
      <Tile label="time spent" value={duration(totalTime(solves))} />
      <Tile label="best" value={time(best(solves))} />
      <Tile label="mean" value={time(mean(solves))} />
      <Tile
        label="deviation"
        value={time(stdev(solves))}
        note="how far a typical solve lands from the mean"
      />
      <Tile label="ao5" value={time(average(solves, 5))} note={`best ${time(bestAverage(solves, 5))}`} />
      <Tile
        label="ao12"
        value={time(average(solves, 12))}
        note={`best ${time(bestAverage(solves, 12))}`}
      />

      {mode === '3bld' && (
        <>
          <Tile label="memo" value={time(meanMemo(solves))} note="mean over split solves" />
          <Tile label="exec" value={time(meanExec(solves))} note="mean over split solves" />
        </>
      )}
    </div>
  )
}
