import { useMemo, useRef, useState } from 'react'
import { formatTime } from './format'
import { rollingAverages } from './stats'
import { effectiveMs, type Penalty, type Solve } from './types'
import { solveLine } from '../data/backup'
import type { AverageView } from './averageText'

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
    /** Removes a whole selection at once. Separate from `onDelete` so the store
        is rewritten once rather than once per solve. */
    onDeleteMany: (ids: number[]) => void
    /** Opens the solves behind one row's ao5 or ao12, or a hand-picked set. */
    onOpenAverage?: (view: AverageView) => void
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
    solves, decimals, onPenalty, onDelete, onDeleteMany, onOpenAverage,
}: SolveListProps) {
    const [openId, setOpenId] = useState<number | null>(null)
    const [sort, setSort] = useState<Sort | null>(null)
    /** The row whose delete button has been pressed once already. */
    const [confirming, setConfirming] = useState<number | null>(null)
    const [picking, setPicking] = useState(false)
    const [picked, setPicked] = useState<Set<number>>(() => new Set())
    /** Where the last pick landed, so shift can select a run from there. */
    const lastPos = useRef<number | null>(null)

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

    function leavePicking() {
        setPicking(false)
        setPicked(new Set())
        lastPos.current = null
    }

    /**
     * Picks one row, or — with shift — every row between it and the last one.
     *
     * The run is measured in displayed positions rather than solve numbers, so
     * dragging a selection down a list sorted by time picks what you can see
     * rather than a stretch of the session you cannot.
     */
    function pick(pos: number, shift: boolean) {
        // Read before the update, not inside it. The updater runs during the
        // next render, by which point `lastPos.current` would already hold this
        // click — so the run would always measure from the row just pressed to
        // itself, and shift would silently behave like an ordinary click.
        const from = lastPos.current
        lastPos.current = pos

        setPicked((prev) => {
            const next = new Set(prev)

            if (shift && from !== null) {
                const lo = Math.min(from, pos)
                const hi = Math.max(from, pos)
                for (let at = lo; at <= hi; at += 1) next.add(rows[at].solve.id)
                return next
            }

            const id = rows[pos].solve.id
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    // Chronological, because that is the order an average is read in. `solves`
    // is already in it, so filtering keeps the order without a sort.
    const pickedSolves = solves.filter((solve) => picked.has(solve.id))

    function deletePicked() {
        const count = pickedSolves.length
        if (count === 0) return
        if (!window.confirm(`Delete ${count} ${count === 1 ? 'solve' : 'solves'}?`)) return

        onDeleteMany(pickedSolves.map((solve) => solve.id))
        leavePicking()
    }

    if (solves.length ===0) {
        return <p className="rail-empty">no solves yet</p>
    }

  return (
    <>
      {/* Sticky rather than scrolling away with the list: while picking, the
          count and the way out are the two things you keep coming back to. */}
      <div className="solve-tools">
        {picking ? (
          <>
            <span className="solve-count">{picked.size} picked</span>
            <button
              type="button"
              disabled={picked.size === 0 || !onOpenAverage}
              onClick={() => onOpenAverage?.({
                label: `${pickedSolves.length} solves`,
                solves: pickedSolves,
              })}
            >
              copy / csv
            </button>
            <button
              type="button"
              className="danger"
              disabled={picked.size === 0}
              onClick={deletePicked}
            >
              delete
            </button>
            <button type="button" onClick={leavePicking}>done</button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => { setPicking(true); setOpenId(null); setConfirming(null) }}
          >
            select
          </button>
        )}
      </div>

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

      {rows.map(({ solve, index }, pos) => {
        /** The window one of this row's averages was taken over. */
        const windowOf = (size: number) => solves.slice(index + 1 - size, index + 1)
        const on = picked.has(solve.id)

        return (
        <li key={solve.id}>
          <div className={`solve-row ${solve.penalty}${on ? ' picked' : ''}`}>
            <button
              type="button"
              className="solve-open"
              aria-pressed={picking ? on : undefined}
              onClick={(event) => {
                if (picking) {
                  pick(pos, event.shiftKey)
                  return
                }
                setOpenId(openId === solve.id ? null : solve.id)
                setConfirming(null)
              }}
            >
              <span className="solve-n">
                {picking ? (on ? '☑' : '☐') : index + 1}
              </span>
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
                  {/* Inert while picking: every click in the list belongs to the
                      selection then, and one that opened a window instead would
                      be the only exception on the row. */}
                  {onOpenAverage && !picking && Number.isFinite(value) ? (
                    <button
                      type="button"
                      className="ao-open"
                      onClick={() => onOpenAverage({
                        label: `ao${size}`,
                        solves: windowOf(size),
                      })}
                    >
                      {text}
                    </button>
                  ) : text}
                </span>
              )
            })}
          </div>

          {openId === solve.id && !picking && (
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
              {/* Asks once. A solve takes one keypress to record and there is no
                  undo behind this, so the second press is the whole safety net —
                  and it stays a button rather than a dialog because the cost of
                  changing your mind should be moving the mouse away. */}
              <button
                type="button"
                className={confirming === solve.id ? 'danger armed' : 'danger'}
                onClick={() => {
                  if (confirming !== solve.id) {
                    setConfirming(solve.id)
                    return
                  }
                  onDelete(solve.id)
                  setConfirming(null)
                  setOpenId(null)
                }}
              >
                {confirming === solve.id ? 'really delete' : 'delete'}
              </button>
            </div>
          )}

          {solve.memoMs !== null && openId === solve.id && !picking && (
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
    </>
  )
}
