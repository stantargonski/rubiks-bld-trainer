import { useMemo } from 'react'
import { formatTime } from '../format'
import {
  average, best, bestAverage, durationText, mean, meanExec, meanMemo, stdev, totalTime,
} from '../stats'
import type { Solve } from '../types'
import type { WcaEvent } from '../events'

function Tile({ label, value, note, onOpen }: {
  label: string
  value: string
  note?: string
  onOpen?: () => void
}) {
  return (
    <div className="tile">
      <span className="tile-label">{label}</span>
      <strong className="tile-value">
        {onOpen ? (
          <button type="button" className="ao-open" onClick={onOpen}>{value}</button>
        ) : value}
      </strong>
      {note && <span className="tile-note">{note}</span>}
    </div>
  )
}

interface SummaryTilesProps {
  solves: Solve[]
  decimals: 2 | 3
  event: WcaEvent
  /** Opens the solves behind one of the average tiles. */
  onOpenAverage?: (label: string, solves: Solve[]) => void
}

export default function SummaryTiles({
  solves, decimals, event, onOpenAverage,
}: SummaryTilesProps) {
  const time = (ms: number) => formatTime(ms, decimals)

  // One list rather than a tile each: the three differ only in their window,
  // and `bestAverage` is expensive enough at a hundred to be worth computing
  // once per solve list rather than once per render.
  const averages = useMemo(() => [5, 12, 100].map((size) => ({
    size,
    current: average(solves, size),
    record: bestAverage(solves, size),
  })), [solves])

  return (
    <div className="tiles">
      <Tile label="solves" value={String(solves.length)} />
      <Tile label="time solving" value={durationText(totalTime(solves))} />
      <Tile label="best" value={time(best(solves))} />
      <Tile label="mean" value={time(mean(solves))} />
      <Tile
        label="deviation"
        value={time(stdev(solves))}
        note="how far a typical solve lands from the mean"
      />
      {averages.map((item) => (
        <Tile
          key={item.size}
          label={`ao${item.size}`}
          value={time(item.current)}
          note={`best ${time(item.record)}`}
          onOpen={onOpenAverage && !Number.isNaN(item.current)
            ? () => onOpenAverage(`ao${item.size}`, solves.slice(-item.size))
            : undefined}
        />
      ))}

      {event.split && (
        <>
          <Tile label="memo" value={time(meanMemo(solves))} note="mean over split solves" />
          <Tile label="exec" value={time(meanExec(solves))} note="mean over split solves" />
        </>
      )}
    </div>
  )
}
