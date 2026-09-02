import { hasArrows } from './pll'
import { CONFIDENCE_LABELS, type AlgCase, type CaseEntry, type Confidence } from './types'

const LEVELS: Confidence[] = [0, 1, 2, 3]

interface CaseEditorProps {
  item: AlgCase
  entry: CaseEntry
  onChange: (entry: CaseEntry) => void
}

/**
 * One case: the alg for it, and what you make of it.
 *
 * The alg is shown rather than typed. Every alg here is checked by
 * `npm run check:algs` against the engine that draws the diagram beside it, and
 * a field you can type into is a field that can hold something those two
 * disagree with — a picture drawn from an alg with a typo in it is worse than
 * no picture. Notes and confidence are yours; the algorithm is the site's.
 */
export default function CaseEditor({ item, entry, onChange }: CaseEditorProps) {
  return (
    <div className="editor">
      <p className="code">{item.name}</p>
      <p className="kind">{item.group}</p>

      <p className="case-alg selectable">{item.alg}</p>

      <div className="fields">
        <label className="field">
          <span>notes</span>
          <input
            value={entry.notes}
            placeholder="what you look for"
            onChange={(event) => onChange({ ...entry, notes: event.target.value })}
          />
        </label>
      </div>

      <div className="chips">
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            className={`chip c${level}`}
            aria-pressed={entry.confidence === level}
            onClick={() => onChange({ ...entry, confidence: level })}
          >
            {CONFIDENCE_LABELS[level]}
          </button>
        ))}
      </div>

      {hasArrows(item) ? (
        <p className="hint">The arrows on the diagram show where each piece goes.</p>
      ) : (
        <p className="hint">
          No arrows on the G perms — six crossing lines say less than the colours do.
        </p>
      )}
    </div>
  )
}
