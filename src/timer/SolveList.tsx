import {useState} from 'react'
import {formatTime} from './format'
import {effectiveMs, type Penalty, type Solve} from './types'

interface SolveListProps {
    solves: Solve[]
    decimals: 2 | 3
    onPenalty: (id:number,penalty: Penalty) => void
    onDelete: (id:number) => void
}

export default function SolveList({ solves, decimals, onPenalty, onDelete}: SolveListProps) {
    const [openId, setOpenId] = useState<number | null>(null)
    
    if (solves.length ===0) {
        return <p className="rail-empty">no solves yet</p>
    }

  return (
    <ol className="solve-list">
      {[...solves].reverse().map((solve, position) => (
        <li key={solve.id}>
          <button
            type="button"
            className={`solve-row ${solve.penalty}`}
            onClick={() => setOpenId(openId === solve.id ? null : solve.id)}
          >
            <span className="solve-n">{solves.length - position}</span>
            <span className="solve-t">{formatTime(effectiveMs(solve), decimals)}</span>
            {solve.memoMs !== null && (
              <span className="solve-memo">{formatTime(solve.memoMs, decimals)}</span>
            )}
            {solve.penalty !== 'none' && (
              <span className="solve-tag">{solve.penalty === 'plus2' ? '+2' : 'DNF'}</span>
            )}
          </button>

          {openId === solve.id && (
            <div className="solve-actions">
              {/* Both toggle back to 'none', so a mis-tap is one more tap to undo
                  and the two penalties can never stack. */}
              <button
                type="button"
                aria-pressed={solve.penalty === 'plus2'}
                onClick={() => onPenalty(solve.id, solve.penalty === 'plus2' ? 'none' : 'plus2')}
              >
                +2
              </button>
              <button
                type="button"
                aria-pressed={solve.penalty === 'dnf'}
                onClick={() => onPenalty(solve.id, solve.penalty === 'dnf' ? 'none' : 'dnf')}
              >
                DNF
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => { onDelete(solve.id); setOpenId(null) }}
              >
                delete
              </button>
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}