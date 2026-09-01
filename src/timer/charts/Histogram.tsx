import { formatTime } from '../format'
import { effectiveMs, type Solve } from '../types'

/**
 * Where the times actually land.
 *
 * The average tells you the middle; this tells you the shape around it — one
 * hump means a settled solver, a long right tail means the good solves are
 * already there and the bad ones are what's left to fix.
 */

const WIDTH = 720
const HEIGHT = 160
const PAD = { top: 10, right: 12, bottom: 22, left: 12 }
const BUCKETS = 14

interface HistogramProps {
  solves: Solve[]
  decimals: 2 | 3
}

export default function Histogram({ solves, decimals }: HistogramProps) {
  const times = solves.map(effectiveMs).filter((value) => Number.isFinite(value))

  if (times.length < 3) {
    return <p className="chart-empty">A few more solves and the shape shows up.</p>
  }

  const low = Math.min(...times)
  const high = Math.max(...times)
  const span = high - low || 1000
  const width = span / BUCKETS

  const counts = Array<number>(BUCKETS).fill(0)
  for (const time of times) {
    // The slowest solve would land one past the end on its own.
    const bucket = Math.min(BUCKETS - 1, Math.floor((time - low) / width))
    counts[bucket] += 1
  }

  const tallest = Math.max(...counts)
  const plotWidth = WIDTH - PAD.left - PAD.right
  const plotHeight = HEIGHT - PAD.top - PAD.bottom
  const barWidth = plotWidth / BUCKETS

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="distribution of times"
    >
      {counts.map((count, index) => {
        const height = (count / tallest) * plotHeight
        const from = low + index * width

        return (
          <rect
            key={index}
            className="bar"
            x={PAD.left + index * barWidth + 1}
            y={PAD.top + plotHeight - height}
            width={barWidth - 2}
            height={height}
            rx={3}
          >
            <title>
              {`${formatTime(from, decimals)}–${formatTime(from + width, decimals)}: ${count}`}
            </title>
          </rect>
        )
      })}

      <text className="axis" x={PAD.left} y={HEIGHT - 6}>{formatTime(low, decimals)}</text>
      <text className="axis" x={WIDTH - PAD.right} y={HEIGHT - 6} textAnchor="end">
        {formatTime(high, decimals)}
      </text>
    </svg>
  )
}
