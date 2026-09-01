import { useEffect, useRef } from 'react'
import { parseAlg } from '../cube/moves'
import { CONFIDENCE_LABELS, type AlgCase, type CaseEntry, type Confidence } from './types'

const LEVELS: Confidence[] = [0, 1, 2, 3]

/** The parser's complaint, or null while the field is empty or valid. */
function algError(alg: string): string | null {
  if (alg.trim() === '') return null
  try {
    parseAlg(alg)
    return null
  } catch (error) {
    return (error as Error).message
  }
}

interface CaseEditorProps {
  item: AlgCase
  entry: CaseEntry
  onChange: (entry: CaseEntry) => void
}

export default function CaseEditor({ item, entry, onChange }: CaseEditorProps) {
  const algInput = useRef<HTMLInputElement>(null)

  // Runs once per case: CfopPanel passes key={item.id}, so picking a different
  // tile remounts this component and the effect fires again.
  useEffect(() => {
    algInput.current?.focus()
  }, [])

  const error = algError(entry.alg)
  const overridden = entry.alg.trim() !== ''

  return (
    <div className="editor">
      <p className="code">{item.name}</p>
      <p className="kind">{item.group}</p>

      <div className="fields">
        <label className="field">
          <span>your alg</span>
          <input
            ref={algInput}
            value={entry.alg}
            placeholder={item.alg}
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => onChange({ ...entry, alg: event.target.value })}
          />
        </label>

        <label className="field">
          <span>notes</span>
          <input
            value={entry.notes}
            placeholder="what you look for"
            onChange={(event) => onChange({ ...entry, notes: event.target.value })}
          />
        </label>
      </div>

      {/* Typing is never blocked — a half-written alg is invalid for as long as
          it takes to finish it. The diagram holds its last good state. */}
      {error && <p className="case-error">{error}</p>}

      <p className="case-default">
        <span>shipped</span>
        <b className="selectable">{item.alg}</b>
        {overridden && (
          <button type="button" className="ghost" onClick={() => onChange({ ...entry, alg: '' })}>
            use it
          </button>
        )}
      </p>

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

      <p className="hint">
        An empty alg means the shipped one, so an alg you type is never quietly replaced.
      </p>
    </div>
  )
}
