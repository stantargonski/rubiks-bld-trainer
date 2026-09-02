import { useMemo, useState } from 'react'
import { formatTime } from './format'
import { rollingAverages } from './stats'
import { effectiveMs, type Penalty, type Solve } from './types'
import { solveLine } from '../data/backup'

interface SolveListProps {
    solves: Solve[]
    decimals: 2 | 3
    onPenalty: (id:number,penalty: Penalty) => void
    onDelete: (id:number) => void
}

export default function SolveList({ solves, decimals, onPenalty, onDelete}: SolveListProps) {
    const [openId, setOpenId] = useState<number | null>(null)

    // The ao5 and ao12 as they stood after each solve, the way cstimer lists
    // them: what your average *was* at that point, not what it is now. Memoised
    // because the rail re-renders on every tick of the clock beside it.
    const ao5 = useMemo(() => rollingAverages(solves, 5), [solves])
    const ao12 = useMemo(() => rollingAverages(solves, 12), [solves])

    if (solves.length ===0) {
        return <p className="rail-empty">no solves yet</p>
    }

  return (
    <ol className="solve-list">
      <li className="solve-head" aria-hidden="true">
        <span className="solve-n">#</span>
        <span className="solve-t">time</span>
        <span className="solve-ao">ao5</span>
        <span className="solve-ao">ao12</span>
      </li>

      {[...solves].reverse().map((solve, position) => {
        // `position` counts back from the newest, so this is the index the solve
        // has in the chronological list the averages were computed over.
        const index = solves.length - 1 - position

        return (
        <li key={solve.id}>
          <button
            type="button"
            className={`solve-row ${solve.penalty}`}
            onClick={() => setOpenId(openId === solve.id ? null : solve.id)}
          >
            <span className="solve-n">{index + 1}</span>
            <span className="solve-t">
              {formatTime(effectiveMs(solve), decimals)}
              {/* Only +2 needs a tag: a DNF already reads DNF in the time column. */}
              {solve.penalty === 'plus2' && <i className="solve-tag">+2</i>}
            </span>
            <span className="solve-ao">{formatTime(ao5[index], decimals)}</span>
            <span className="solve-ao">{formatTime(ao12[index], decimals)}</span>
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
              {/* Time, when, puzzle and scramble together: on its own a time
                  isn't worth pasting anywhere, and the rest is what makes it a
                  claim someone could check. */}
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(solveLine(solve, decimals))}
              >
                copy
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

          {solve.memoMs !== null && openId === solve.id && (
            <p className="solve-split">
              memo {formatTime(solve.memoMs, decimals)}
              {' · '}
              exec {formatTime(solve.ms - solve.memoMs, decimals)}
            </p>
          )}
        </li>
        )
      })}
    </ol>
  )
}
