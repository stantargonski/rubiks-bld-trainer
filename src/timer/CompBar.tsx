import type { ReactNode } from 'react'
import { formatTime, parseTime } from './format'
import { needForTarget, resultOf, type CompFormat } from './comp'

interface CompBarProps {
  format: CompFormat
  /** Effective times of the round so far, oldest first. */
  times: number[]
  targetText: string
  onTargetText: (text: string) => void
  /** A goal worth chasing based on recent solves, or NaN if there aren't enough. */
  suggestion: number
  decimals: 2 | 3
  onRestart: () => void
  onClose: () => void
}

export default function CompBar({
  format, times, targetText, onTargetText, suggestion, decimals, onRestart, onClose,
}: CompBarProps) {
  const target = parseTime(targetText)
  const done = times.slice(0, format.size)
  const complete = done.length >= format.size
  const result = resultOf(format, done)

  let tone = ''
  let message: ReactNode

  if (!Number.isFinite(target)) {
    message = 'Set a goal and the last solve of the round gets a number to beat.'
  } else if (complete) {
    if (!Number.isFinite(result)) {
      tone = 'bad'
      message = <>DNF {format.id} — goal missed</>
    } else {
      const hit = result <= target
      tone = hit ? 'good' : 'bad'
      message = hit
        ? <>{format.id} <b>{formatTime(result, decimals)}</b> — goal met</>
        : <>{format.id} <b>{formatTime(result, decimals)}</b> — missed by {formatTime(result - target, decimals)}</>
    }
  } else if (done.length === format.size - 1) {
    const need = needForTarget(done, format, target)

    if (need === Infinity) {
      tone = 'good'
      message = <>Already there — even a DNF keeps the {format.id} under {formatTime(target, decimals)}.</>
    } else if (Number.isNaN(need)) {
      tone = 'bad'
      message = <>Out of reach — no last solve gets this {format.id} under {formatTime(target, decimals)}.</>
    } else {
      message = <>Last solve: <b>{formatTime(need, decimals)}</b> or better for a {formatTime(target, decimals)} {format.id}.</>
    }
  } else {
    message = <>{done.length} of {format.size} — the number to beat appears on the last solve.</>
  }

  return (
    <div className="comp-bar">
      <div className="comp-head">
        <strong className="comp-format">{format.id}</strong>

        <label className="comp-goal">
          <span>goal</span>
          <input
            value={targetText}
            placeholder="20.00"
            inputMode="decimal"
            autoComplete="off"
            onChange={(event) => onTargetText(event.target.value)}
          />
        </label>

        {/* Only offered while the field is empty — once you've typed a goal,
            overwriting it is the last thing a button here should do. */}
        {targetText.trim() === '' && Number.isFinite(suggestion) && (
          <button
            type="button"
            className="ghost"
            onClick={() => onTargetText(formatTime(suggestion, decimals))}
          >
            try {formatTime(suggestion, decimals)}
          </button>
        )}

        <div className="comp-slots">
          {Array.from({ length: format.size }, (_, slot) => (
            <span key={slot} className={slot < done.length ? 'comp-slot filled' : 'comp-slot'}>
              {slot < done.length ? formatTime(done[slot], decimals) : '·'}
            </span>
          ))}
        </div>

        <button type="button" className="ghost" onClick={onRestart}>
          {complete ? 'new round' : 'restart'}
        </button>
        <button type="button" className="ghost" title="close" aria-label="close" onClick={onClose}>
          ×
        </button>
      </div>

      <p className={tone ? `comp-line ${tone}` : 'comp-line'}>{message}</p>
    </div>
  )
}
