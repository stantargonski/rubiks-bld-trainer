import { MBLD_MAX, MBLD_MIN } from './settings'

interface MbldCountProps {
  value: number
  onChange: (value: number) => void
}

/**
 * How many cubes a multi-blind attempt is for.
 *
 * Lives beside the event picker rather than in settings for the same reason the
 * event picker does: it changes what the scramble says, and a control that
 * rewrites what is on screen belongs next to it. Only rendered for multi-blind,
 * so it costs nothing on the other sixteen events.
 */
export default function MbldCount({ value, onChange }: MbldCountProps) {
  const clamp = (next: number) => Math.min(MBLD_MAX, Math.max(MBLD_MIN, next))

  return (
    <div className="mbld-count">
      <span>cubes</span>
      <button
        type="button"
        aria-label="one cube fewer"
        disabled={value <= MBLD_MIN}
        onClick={() => onChange(clamp(value - 1))}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label="cubes to attempt"
        value={String(value)}
        onChange={(change) => {
          const parsed = Number.parseInt(change.target.value.replace(/\D/g, ''), 10)
          if (Number.isFinite(parsed)) onChange(clamp(parsed))
        }}
      />
      <button
        type="button"
        aria-label="one cube more"
        disabled={value >= MBLD_MAX}
        onClick={() => onChange(clamp(value + 1))}
      >
        +
      </button>
    </div>
  )
}
