import { useMemo } from 'react'
import { formatTime } from '../format'
import {
  bestAverageWindow, bestSingleIndex, durationText, mean, meanExec, meanMemo, stdev, totalTime,
} from '../stats'
import { effectiveMs, type Solve } from '../types'
import type { AverageView } from '../averageText'
import type { WcaEvent } from '../events'
import { tileSpec } from './tiles'

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
  /** Every solve of this event, across every session, for the all-time boxes. */
  allTime: Solve[]
  decimals: 2 | 3
  event: WcaEvent
  /** The boxes to draw, in order. */
  order: string[]
  /** Which of them are switched off. */
  hidden: string[]
  /** Opens the solves behind one of the boxes. */
  onOpenAverage?: (view: AverageView) => void
}

export default function SummaryTiles({
  solves, allTime, decimals, event, order, hidden, onOpenAverage,
}: SummaryTilesProps) {
  const time = (ms: number) => formatTime(ms, decimals)

  // Computed once for the whole set: the best-window search walks the session
  // per size, and at a hundred that is not something to do per render.
  const figures = useMemo(() => ({
    bestFive: bestAverageWindow(solves, 5),
    bestTwelve: bestAverageWindow(solves, 12),
    bestHundred: bestAverageWindow(solves, 100),
    singleAt: bestSingleIndex(solves),
    allTimeFive: bestAverageWindow(allTime, 5),
  }), [solves, allTime])

  const off = new Set(hidden)

  /** A box that opens the solves behind it, when there are any to open. */
  function opener(label: string, window: Solve[] | null, value: number) {
    if (!onOpenAverage || !window || window.length === 0 || Number.isNaN(value)) return undefined
    return () => onOpenAverage({ label, solves: window, value })
  }

  function render(id: string) {
    switch (id) {
      case 'solves':
        return <Tile key={id} label="solves" value={String(solves.length)} />
      case 'time':
        return <Tile key={id} label="time solving" value={durationText(totalTime(solves))} />
      case 'best': {
        const at = figures.singleAt
        const value = at >= 0 ? effectiveMs(solves[at]) : NaN
        return (
          <Tile
            key={id}
            label="best single"
            value={time(value)}
            onOpen={opener('best single', at >= 0 ? solves.slice(at, at + 1) : null, value)}
          />
        )
      }
      case 'allTimeBestAo5': {
        const { value, start } = figures.allTimeFive
        return (
          <Tile
            key={id}
            label="all-time best ao5"
            value={time(value)}
            note="every session, this event"
            onOpen={opener(
              'all-time best ao5',
              start >= 0 ? allTime.slice(start, start + 5) : null,
              value,
            )}
          />
        )
      }
      case 'mean':
        return <Tile key={id} label="mean" value={time(mean(solves))} />
      case 'deviation':
        return <Tile key={id} label="deviation" value={time(stdev(solves))} />
      case 'bestAo5':
      case 'bestAo12':
      case 'bestAo100': {
        const size = id === 'bestAo5' ? 5 : id === 'bestAo12' ? 12 : 100
        const found = size === 5
          ? figures.bestFive
          : size === 12 ? figures.bestTwelve : figures.bestHundred
        const label = `best ao${size}`
        return (
          <Tile
            key={id}
            label={label}
            value={time(found.value)}
            onOpen={opener(
              label,
              found.start >= 0 ? solves.slice(found.start, found.start + size) : null,
              found.value,
            )}
          />
        )
      }
      case 'memo':
        return <Tile key={id} label="memo" value={time(meanMemo(solves))} note="mean over split solves" />
      case 'exec':
        return <Tile key={id} label="exec" value={time(meanExec(solves))} note="mean over split solves" />
      default:
        return null
    }
  }

  return (
    <div className="tiles">
      {order
        .filter((id) => !off.has(id))
        .filter((id) => event.split || !tileSpec(id)?.splitOnly)
        .map(render)}
    </div>
  )
}
