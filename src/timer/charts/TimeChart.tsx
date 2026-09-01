import { formatTime } from '../format'
import { rollingAverages } from '../stats'
import { effectiveMs, type Solve } from '../types'

/**
 * Every solve in the session, with the ao5 and ao12 drawn over the top.
 *
 * Hand-rolled SVG rather than a charting library: the app has no runtime
 * dependencies beyond React, and what's needed here is a polyline and some
 * circles. A library would be the heavier option, not the lighter one.
 */

const WIDTH = 720
const HEIGHT = 240
const PAD = { top: 14, right: 12, bottom: 22, left: 52 }

interface TimeChartProps {
  solves: Solve[]
  decimals: 2 | 3
}

/** Rounds a span out to a readable step, so gridlines land on numbers people use. */
function niceStep(span: number): number {
  const rough = span / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const steps = [1, 2, 2.5, 5, 10]

  for (const step of steps) {
    if (rough <= step * magnitude) return step * magnitude
  }
  return 10 * magnitude
}

export default function TimeChart({ solves, decimals }: TimeChartProps) {
  const times = solves.map(effectiveMs)
  const finite = times.filter((value) => Number.isFinite(value))

  if (finite.length < 2) {
    return <p className="chart-empty">Two solves and this fills in.</p>
  }

  const low = Math.min(...finite)
  const high = Math.max(...finite)
  // A flat session would otherwise divide by zero; give it a band to sit in.
  const span = high - low || Math.max(high * 0.1, 1000)
  const top = high + span * 0.12
  const bottom = Math.max(0, low - span * 0.12)

  const plotWidth = WIDTH - PAD.left - PAD.right
  const plotHeight = HEIGHT - PAD.top - PAD.bottom

  const x = (index: number) =>
    PAD.left + (solves.length === 1 ? plotWidth / 2 : (index / (solves.length - 1)) * plotWidth)
  const y = (ms: number) =>
    PAD.top + plotHeight - ((ms - bottom) / (top - bottom)) * plotHeight

  const ao5 = rollingAverages(solves, 5)
  const ao12 = rollingAverages(solves, 12)

  /** A line that simply stops wherever the average isn't defined or is a DNF. */
  function path(values: number[]): string {
    let out = ''
    let open = false

    values.forEach((value, index) => {
      if (!Number.isFinite(value)) { open = false; return }
      out += `${open ? 'L' : 'M'}${x(index).toFixed(1)} ${y(value).toFixed(1)} `
      open = true
    })
    return out.trim()
  }

  const step = niceStep(top - bottom)
  const lines: number[] = []
  for (let value = Math.ceil(bottom / step) * step; value <= top; value += step) lines.push(value)

  // A personal best is only a personal best against what came before it, so
  // this walks forward rather than comparing against the session's best.
  const isPb: boolean[] = []
  let running = Infinity
  for (const value of times) {
    const better = Number.isFinite(value) && value < running
    if (better) running = value
    isPb.push(better)
  }

  return (
    <svg className="chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="solve times">
      {lines.map((value) => (
        <g key={value}>
          <line className="grid" x1={PAD.left} x2={WIDTH - PAD.right} y1={y(value)} y2={y(value)} />
          <text className="axis" x={PAD.left - 8} y={y(value) + 3.5} textAnchor="end">
            {formatTime(value, decimals)}
          </text>
        </g>
      ))}

      <path className="line ao12" d={path(ao12)} fill="none" />
      <path className="line ao5" d={path(ao5)} fill="none" />

      {times.map((value, index) => {
        // DNFs have no height of their own, so they sit on the ceiling with a
        // shape of their own rather than dragging the scale up to infinity.
        const dnf = !Number.isFinite(value)
        const label = `#${index + 1} — ${formatTime(value, decimals)}`

        return dnf ? (
          <g key={solves[index].id}>
            <path
              className="point dnf"
              d={`M${x(index) - 3.5} ${PAD.top - 6} L${x(index) + 3.5} ${PAD.top - 6}
                  L${x(index)} ${PAD.top + 1} Z`}
            />
            <title>{label}</title>
          </g>
        ) : (
          <circle
            key={solves[index].id}
            className={isPb[index] ? 'point pb' : 'point'}
            cx={x(index)}
            cy={y(value)}
            r={isPb[index] ? 3.6 : 2.4}
          >
            <title>{label}</title>
          </circle>
        )
      })}

      <text className="axis" x={PAD.left} y={HEIGHT - 6}>1</text>
      <text className="axis" x={WIDTH - PAD.right} y={HEIGHT - 6} textAnchor="end">
        {solves.length}
      </text>
    </svg>
  )
}
