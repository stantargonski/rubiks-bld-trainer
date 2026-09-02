import { useMemo, useState } from 'react'
import { formatTime } from './format'
import { rollingAverages } from './stats'
import { effectiveMs, type Penalty, type Solve } from './types'
import { solveLine } from '../data/backup'

/** Which column the list is ordered by. `null` is the default: newest first. */
type SortKey = 'time' | 'ao5' | 'ao12'
interface Sort { key: SortKey; dir: 'asc' | 'desc' }

/**
 * A heading you can sort by. Declared out here rather than inside the list: a
 * component built during a render is a new component every render, and React
 * throws its state away each time.
 */
function Head({ label, sortKey, sort, onCycle }: {
    label: string
    sortKey: SortKey
    sort: Sort | null
    onCycle: (key: SortKey) => void
}) {
    const active = sort?.key === sortKey
    return (
        <button
            type="button"
            className={active ? 'solve-sort on' : 'solve-sort'}
            onClick={() => onCycle(sortKey)}
        >
            {label}
            {active && <i>{sort.dir === 'asc' ? '▲' : '▼'}</i>}
        </button>
    )
}

interface SolveListProps {
    solves: Solve[]
    decimals: 2 | 3
    onPenalty: (id:number,penalty: Penalty) => void
    onDelete: (id:number) => void
    /** Opens the solves behind one row's ao5 or ao12. */
    onOpenAverage?: (label: string, solves: Solve[]) => void
}

/**
 * Times sort low to high, and everything that isn't a time sorts last.
 *
 * Infinity is a DNF and NaN is an average that didn't exist yet; neither is a
 * fast solve or a slow one, so neither belongs at either end of the order. They
 * stay at the bottom in both directions rather than flipping to the top when the
 * arrow does.
 */
function compare(a: number, b: number, dir: 'asc' | 'desc'): number {
    const aOk = Number.isFinite(a)
    const bOk = Number.isFinite(b)
    if (!aOk || !bOk) return aOk === bOk ? 0 : (aOk ? -1 : 1)
    return dir === 'asc' ? a - b : b - a
}

export default function SolveList({
    solves, decimals, onPenalty, onDelete, onOpenAverage,
}: SolveListProps) {
    const [openId, setOpenId] = useState<number | null>(null)
    const [sort, setSort] = useState<Sort | null>(null)

    // The ao5 and ao12 as they stood after each solve, the way cstimer lists
    // them: what your average *was* at that point, not what it is now. Memoised
    // because the rail re-renders on every tick of the clock beside it.
    const ao5 = useMemo(() => rollingAverages(solves, 5), [solves])
    const ao12 = useMemo(() => rollingAverages(solves, 12), [solves])

    // One record per solve, carrying the chronological index the averages were
    // computed against. Sorting the records rather than the solves is what keeps
    // the # column and both averages attached to the right solve once the order
    // stops being the order they happened in.
    const rows = useMemo(() => {
        const built = solves.map((solve, index) => ({
            solve, index, time: effectiveMs(solve), ao5: ao5[index], ao12: ao12[index],
        }))
        if (sort === null) return built.reverse()
        return built.sort((a, b) => compare(a[sort.key], b[sort.key], sort.dir))
    }, [solves, ao5, ao12, sort])

    /** none → low to high → high to low → none. */
    function cycle(key: SortKey) {
        setSort((prev) => {
            if (prev === null || prev.key !== key) return { key, dir: 'asc' }
            return prev.dir === 'asc' ? { key, dir: 'desc' } : null
        })
    }

    if (solves.length ===0) {
        return <p className="rail-empty">no solves yet</p>
    }

  return (
    <ol className="solve-list">
      {/* Three of the four headings are controls now, so the row is no longer
          decoration to be hidden from a screen reader. */}
      <li className="solve-head">
        <span className="solve-n">#</span>
        <span className="solve-t">
          <Head label="time" sortKey="time" sort={sort} onCycle={cycle} />
        </span>
        <span className="solve-ao">
          <Head label="ao5" sortKey="ao5" sort={sort} onCycle={cycle} />
        </span>
        <span className="solve-ao">
          <Head label="ao12" sortKey="ao12" sort={sort} onCycle={cycle} />
        </span>
      </li>

      {rows.map(({ solve, index }) => {
        /** The window one of this row's averages was taken over. */
        const windowOf = (size: number) => solves.slice(index + 1 - size, index + 1)

        return (
        <li key={solve.id}>
          <div className={`solve-row ${solve.penalty}`}>
            <button
              type="button"
              className="solve-open"
              onClick={() => setOpenId(openId === solve.id ? null : solve.id)}
            >
              <span className="solve-n">{index + 1}</span>
              <span className="solve-t">
                {formatTime(effectiveMs(solve), decimals)}
                {/* Only +2 needs a tag: a DNF already reads DNF in the time column. */}
                {solve.penalty === 'plus2' && <i className="solve-tag">+2</i>}
              </span>
            </button>

            {[5, 12].map((size) => {
              const value = size === 5 ? ao5[index] : ao12[index]
              const text = formatTime(value, decimals)

              return (
                <span className="solve-ao" key={size}>
                  {onOpenAverage && Number.isFinite(value) ? (
                    <button
                      type="button"
                      className="ao-open"
                      onClick={() => onOpenAverage(`ao${size}`, windowOf(size))}
                    >
                      {text}
                    </button>
                  ) : text}
                </span>
              )
            })}
          </div>

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
