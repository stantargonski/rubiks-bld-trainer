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
const HEIGHT = 200
// The top gap is a lane for the mean's label, which would otherwise land on
// top of the count printed above the tallest bar.
const PAD = { top: 26, right: 12, bottom: 30, left: 12 }
const TARGET_BINS = 14

/**
 * Bin widths worth reading, in milliseconds.
 *
 * Splitting the range into a fixed number of bins gives boundaries like
 * "18.29–20.41", which are meaningless numbers: nobody's target is 18.29. These
 * are the widths that leave every boundary on a whole or half second, so the
 * axis reads as times you might actually aim for.
 */
const NICE_WIDTHS = [
  500, 1000, 2000, 2500, 5000, 10_000, 15_000, 20_000, 30_000,
  60_000, 120_000, 300_000, 600_000,
]

/** The narrowest width that covers the spread without making too many bars. */
function binWidth(span: number): number {
  for (const width of NICE_WIDTHS) {
    if (span / width <= TARGET_BINS) return width
  }
  return NICE_WIDTHS[NICE_WIDTHS.length - 1]
}

interface HistogramProps {
  solves: Solve[]
  decimals: 2 | 3
  /** The vertical rule at the mean. */
  showMean?: boolean
}

export default function Histogram({ solves, decimals, showMean = true }: HistogramProps) {
  const times = solves.map(effectiveMs).filter((value) => Number.isFinite(value))

  if (times.length < 3) {
    return <p className="chart-empty">A few more solves and the shape shows up.</p>
  }

  const low = Math.min(...times)
  const high = Math.max(...times)
  const width = binWidth(high - low || 1000)

  // Snap the first edge down to a multiple of the width, so the boundaries are
  // 15.0, 17.5, 20.0 rather than wherever the fastest solve happened to fall.
  const first = Math.floor(low / width) * width
  const bins = Math.max(1, Math.ceil((high - first + 1) / width))

  const counts = Array<number>(bins).fill(0)
  for (const time of times) {
    counts[Math.min(bins - 1, Math.floor((time - first) / width))] += 1
  }

  const tallest = Math.max(...counts)
  const plotWidth = WIDTH - PAD.left - PAD.right
  const plotHeight = HEIGHT - PAD.top - PAD.bottom
  const barWidth = plotWidth / bins

  // A label under every bar gets unreadable past a handful, so they thin out.
  const labelEvery = Math.ceil(bins / 8)

  // The x axis runs linearly from `first` over `bins * width` of time, mapped
  // onto exactly `plotWidth`, so a time converts straight into a coordinate.
  const meanMs = times.reduce((sum, value) => sum + value, 0) / times.length
  const meanX = PAD.left + ((meanMs - first) / (bins * width)) * plotWidth

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="distribution of times"
    >
      {counts.map((count, index) => {
        const height = (count / tallest) * plotHeight
        const from = first + index * width

        return (
          <g key={index}>
            <rect
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

            {count > 0 && (
              <text
                className="axis bar-count"
                x={PAD.left + index * barWidth + barWidth / 2}
                y={PAD.top + plotHeight - height - 4}
                textAnchor="middle"
              >
                {count}
              </text>
            )}

            {index % labelEvery === 0 && (
              <text
                className="axis"
                x={PAD.left + index * barWidth}
                y={HEIGHT - 10}
                textAnchor="middle"
              >
                {formatTime(from, 1)}
              </text>
            )}
          </g>
        )
      })}

      {/* Over the bars rather than behind them: it is the one line on this
          chart you are meant to read a value off.

          The mean of `times`, which is what the bars were built from, and not
          stats.ts's mean — that one is DNF-poisoned and returns Infinity, which
          would put the line off the chart entirely on a single failed solve. */}
      {showMean && (
        <g className="mean-line">
          <line x1={meanX} x2={meanX} y1={PAD.top} y2={PAD.top + plotHeight} />
          <text
            className="axis"
            x={meanX}
            y={PAD.top - 10}
            textAnchor={meanX > WIDTH / 2 ? 'end' : 'start'}
            dx={meanX > WIDTH / 2 ? -5 : 5}
          >
            mean {formatTime(meanMs, decimals)}
          </text>
        </g>
      )}

      {/* The closing edge, so the last bar's span is readable too. */}
      <text className="axis" x={PAD.left + bins * barWidth} y={HEIGHT - 10} textAnchor="middle">
        {formatTime(first + bins * width, 1)}
      </text>
    </svg>
  )
}
