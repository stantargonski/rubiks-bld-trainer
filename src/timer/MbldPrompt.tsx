import { useState } from 'react'
import { formatTime } from './format'
import { MBLD_MAX, MBLD_MIN } from './settings'
import { mbldIsDnf, mbldPoints, type MbldResult } from './types'

interface MbldPromptProps {
  /** The time the clock recorded, already stopped. */
  ms: number
  /** How many cubes the scramble was for — the obvious first answer. */
  attempted: number
  decimals: 2 | 3
  onRecord: (result: MbldResult) => void
  onDiscard: () => void
}

/** A stepper that stays inside its bounds. */
function Count({ label, value, min, max, onChange }: {
  label: string
  value: number
  min: number
  max: number
  onChange: (next: number) => void
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next))

  return (
    <label className="mbld-field">
      <span>{label}</span>
      <span className="mbld-stepper">
        <button type="button" onClick={() => onChange(clamp(value - 1))}>−</button>
        <input
          type="text"
          inputMode="numeric"
          value={String(value)}
          onChange={(change) => {
            const digits = change.target.value.replace(/\D/g, '')
            if (digits !== '') onChange(clamp(Number.parseInt(digits, 10)))
          }}
        />
        <button type="button" onClick={() => onChange(clamp(value + 1))}>+</button>
      </span>
    </label>
  )
}

/**
 * What the clock cannot know about a multi-blind attempt.
 *
 * Multi-blind is the one event where the time is the smaller half of the
 * result: an hour is a triumph over fourteen cubes and a failure over two, and
 * whether the attempt counts at all is a scoring rule rather than a stopwatch
 * reading. So the timer runs exactly as it does everywhere else, and then asks.
 */
export default function MbldPrompt(
  { ms, attempted: cubes, decimals, onRecord, onDiscard }: MbldPromptProps,
) {
  const [attempted, setAttempted] = useState(cubes)
  const [solved, setSolved] = useState(cubes)

  // Solving more cubes than you attempted is not a result, so the ceiling
  // follows the count down rather than waiting to reject it on submit.
  const capped = Math.min(solved, attempted)
  const result: MbldResult = { solved: capped, attempted }
  const points = mbldPoints(result)
  const failed = mbldIsDnf(result)

  return (
    <div className="modal-back">
      <div
        className="modal mbld-modal"
        role="dialog"
        aria-modal="true"
        aria-label="how the multi-blind attempt went"
        onKeyDown={(press) => {
          if (press.key === 'Enter') {
            press.preventDefault()
            onRecord(result)
          }
        }}
      >
        <h2 className="modal-title">
          multi-blind
          <b>{formatTime(ms, decimals)}</b>
        </h2>

        <div className="mbld-fields">
          <Count
            label="attempted"
            value={attempted}
            min={MBLD_MIN}
            max={MBLD_MAX}
            onChange={(next) => {
              setAttempted(next)
              if (solved > next) setSolved(next)
            }}
          />
          <Count
            label="solved"
            value={capped}
            min={0}
            max={attempted}
            onChange={setSolved}
          />
        </div>

        <p className={failed ? 'mbld-score failed' : 'mbld-score'}>
          {capped}/{attempted} — {points} {Math.abs(points) === 1 ? 'point' : 'points'}
          {failed && ' · under one point, so this records as a DNF'}
        </p>

        <div className="modal-actions">
          <button type="button" autoFocus onClick={() => onRecord(result)}>record</button>
          {/* Last, and not the default: it throws away an attempt that actually
              happened, which is the one thing here you cannot get back. */}
          <button type="button" className="danger" onClick={onDiscard}>discard</button>
        </div>
      </div>
    </div>
  )
}
