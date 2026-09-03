import { useState } from 'react'
import {
  dateInput, inputDate, MAX_LAST_N, MAX_WINDOW_DAYS, PRESETS, RANGE_ALL, windowBounds,
  type TimeWindow,
} from './filters'
import type { Solve } from '../types'

/**
 * How far back a chart is looking, as buttons plus a way out of them.
 *
 * The buttons are the spans people ask for by name, and they are still one
 * press each. `custom` is for everything else: the fortnight either side of a
 * competition, the month you were injured, the last fifty solves. Both charts
 * on the page take the same control, so "last 90 days" means the same thing to
 * the calendar as it does to the graph.
 *
 * Opening `custom` seeds its fields from whatever is currently shown, so the
 * first thing you do is adjust a real range rather than fill in a blank form.
 */
export default function RangePicker({ range, solves, now, onChange }: {
  range: TimeWindow
  /** What the chart is drawing, so `custom` can open on the dates in view. */
  solves: Solve[]
  now: number
  onChange: (next: TimeWindow) => void
}) {
  const custom = range.kind === 'dates' || range.kind === 'lastN'
  const [open, setOpen] = useState(custom)

  const bounds = windowBounds(range, solves, now)
  const seedFrom = range.kind === 'dates'
    ? range.from
    : bounds.from ?? (solves.length > 0 ? solves[0].id : now)
  const seedTo = range.kind === 'dates' ? range.to : Math.min(bounds.to, now)

  /** The `lastN` box always has a number in it, even while `dates` is chosen. */
  const lastN = range.kind === 'lastN' ? range.n : Math.min(solves.length || 50, MAX_LAST_N)

  function setDates(from: number, to: number) {
    // Dragged past each other rather than rejected: picking the far date first
    // is a normal way to use two date fields.
    onChange(from <= to ? { kind: 'dates', from, to } : { kind: 'dates', from: to, to: from })
  }

  return (
    <>
      <span className="chart-spans">
        <button
          type="button"
          aria-pressed={range.kind === 'all'}
          onClick={() => { onChange(RANGE_ALL); setOpen(false) }}
        >
          all time
        </button>
        {PRESETS.map((preset) => (
          <button
            key={preset.days}
            type="button"
            aria-pressed={range.kind === 'days' && range.days === preset.days}
            onClick={() => { onChange({ kind: 'days', days: preset.days }); setOpen(false) }}
          >
            {preset.name}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={custom}
          aria-expanded={open}
          onClick={() => {
            // Pressing it while it is already the answer closes the fields
            // rather than resetting them, so the range survives a stray click.
            if (open) setOpen(false)
            else {
              setOpen(true)
              if (!custom) setDates(seedFrom, seedTo)
            }
          }}
        >
          custom
        </button>
      </span>

      {open && (
        <div className="range-custom">
          <label>
            <span>from</span>
            <input
              type="date"
              value={dateInput(seedFrom)}
              max={dateInput(seedTo)}
              onChange={(change) => {
                const parsed = inputDate(change.target.value)
                if (parsed !== null) setDates(parsed, seedTo)
              }}
            />
          </label>
          <label>
            <span>to</span>
            <input
              type="date"
              value={dateInput(seedTo)}
              min={dateInput(seedFrom)}
              max={dateInput(now)}
              onChange={(change) => {
                const parsed = inputDate(change.target.value)
                if (parsed !== null) setDates(seedFrom, parsed)
              }}
            />
          </label>

          {/* The other way of saying "recently", for anyone who counts in solves
              rather than in days — which is most people, most of the time. */}
          <label>
            <span>or the last</span>
            <input
              type="number"
              min={1}
              max={MAX_LAST_N}
              step={1}
              value={lastN}
              onChange={(change) => {
                const parsed = Number.parseInt(change.target.value, 10)
                if (!Number.isFinite(parsed) || parsed < 1) return
                onChange({ kind: 'lastN', n: Math.min(parsed, MAX_LAST_N) })
              }}
            />
            <span>solves</span>
          </label>

          <span className="range-note">
            {range.kind === 'lastN'
              ? 'counting back from the most recent solve'
              : `${Math.min(
                Math.round((seedTo - seedFrom) / 86_400_000) + 1,
                MAX_WINDOW_DAYS,
              )} days`}
          </span>
        </div>
      )}
    </>
  )
}
