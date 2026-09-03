import { useEffect, useMemo, useRef, useState } from 'react'
import { formatTime } from './format'
import { rollingAverages } from './stats'
import { effectiveMs, mbldPoints, type Penalty, type Solve } from './types'
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
    /** Which session these are. Only used to drop a selection when you leave it —
        the list used to have a mode you pressed 'done' on, which is where that
        used to happen. */
    sessionId: string
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
    solves, sessionId, decimals, onPenalty, onDelete, onDeleteMany, onOpenAverage,
}: SolveListProps) {
    const [openId, setOpenId] = useState<number | null>(null)
    const [sort, setSort] = useState<Sort | null>(null)
    /** The row whose delete button has been pressed once already. */
    const [confirming, setConfirming] = useState<number | null>(null)
    const [picked, setPicked] = useState<Set<number>>(() => new Set())
    /** Where the last pick landed, so shift can select a run from there. */
    const lastPos = useRef<number | null>(null)
    /**
     * The row a ctrl-drag started on, or null when no drag is running.
     *
     * State rather than a ref because the list has to know it is dragging in
     * order to stop selecting text while the pointer sweeps.
     */
    const [dragFrom, setDragFrom] = useState<number | null>(null)

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

    function clearPicked() {
        setPicked(new Set())
        lastPos.current = null
    }

    /**
     * A selection belongs to the session it was made in.
     *
     * Switching sessions used to mean pressing 'done', which cleared it. With the
     * mode gone the ids would otherwise follow you to a list that does not contain
     * them, leaving a count describing solves you can no longer see.
     *
     * Adjusted during the render that brings the new session in rather than in an
     * effect, so the list never paints once with the old session's selection.
     */
    const [lastSession, setLastSession] = useState(sessionId)
    if (lastSession !== sessionId) {
        setLastSession(sessionId)
        setPicked(new Set())
        setOpenId(null)
        setConfirming(null)
    }
    // The shift anchor is a ref, and a ref cannot be written during a render.
    // It only matters on the next shift-click, which cannot happen before this
    // has run, so clearing it a beat later is soon enough.
    useEffect(() => { lastPos.current = null }, [sessionId])

    // The drag ends wherever the button comes up, which is very often not over a
    // row — off the end of the list, or outside the rail entirely. Listening on
    // the window is what stops a drag from getting stuck on when it does.
    useEffect(() => {
        if (dragFrom === null) return
        const stop = () => setDragFrom(null)
        window.addEventListener('pointerup', stop)
        window.addEventListener('pointercancel', stop)
        return () => {
            window.removeEventListener('pointerup', stop)
            window.removeEventListener('pointercancel', stop)
        }
    }, [dragFrom])

    /** Adds the run between the row a drag started on and the one under the pointer. */
    function sweepTo(pos: number) {
        if (dragFrom === null) return
        const lo = Math.min(dragFrom, pos)
        const hi = Math.max(dragFrom, pos)

        setPicked((prev) => {
            const next = new Set(prev)
            for (let at = lo; at <= hi; at += 1) next.add(rows[at].solve.id)
            return next
        })
        lastPos.current = pos
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
        clearPicked()
    }

    if (solves.length ===0) {
        return <p className="rail-empty">no solves yet</p>
    }

  return (
    <>
      {/* Only there once something is picked. There is no mode to enter any
          more — ctrl is the mode — so a bar sitting empty above the list would
          be a permanent reminder of a feature you weren't using. Sticky, because
          the count and the way out are what you keep coming back to. */}
      {pickedSolves.length > 0 && (
        <div className="solve-tools">
          <span className="solve-count">{pickedSolves.length} picked</span>
          <button
            type="button"
            disabled={!onOpenAverage}
            onClick={() => onOpenAverage?.({
              label: `${pickedSolves.length} solves`,
              solves: pickedSolves,
            })}
          >
            copy / csv
          </button>
          <button type="button" className="danger" onClick={deletePicked}>delete</button>
          <button type="button" onClick={clearPicked}>clear</button>
        </div>
      )}

      <ol className={dragFrom === null ? 'solve-list' : 'solve-list sweeping'}>
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
        <li key={solve.id} onPointerEnter={() => sweepTo(pos)}>
          {/* Ctrl is handled here, on the row, rather than on the button inside
              it — so it picks the row wherever on it you press, including the
              two average columns, which are their own buttons. Caught on
              pointerdown and stopped there, so the click that would have
              followed never reaches whichever control is underneath.

              Without ctrl this does nothing at all, which is what keeps every
              existing click behaving exactly as it did. */}
          <div
            className={`solve-row ${solve.penalty}${on ? ' picked' : ''}`}
            onPointerDown={(event) => {
              if (!event.ctrlKey && !event.metaKey) return
              event.preventDefault()
              event.stopPropagation()
              // Shift still means "the run from the last one"; ctrl-dragging
              // from here means the same thing, drawn with the pointer.
              pick(pos, event.shiftKey)
              setDragFrom(pos)
              setOpenId(null)
              setConfirming(null)
            }}
          >
            <button
              type="button"
              className="solve-open"
              aria-pressed={on}
              onClick={() => {
                setOpenId(openId === solve.id ? null : solve.id)
                setConfirming(null)
              }}
            >
              <span className="solve-n">{index + 1}</span>
              <span className="solve-t">
                {formatTime(effectiveMs(solve), decimals)}
                {/* Only +2 needs a tag: a DNF already reads DNF in the time column. */}
                {solve.penalty === 'plus2' && <i className="solve-tag">+2</i>}
                {/* For multi-blind the cube count is the result and the time is
                    the tiebreak, so it travels with the time rather than
                    waiting in the drawer. */}
                {solve.mbld && (
                  <i className="solve-tag cubes">
                    {solve.mbld.solved}/{solve.mbld.attempted}
                  </i>
                )}
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
              {/* Asks once. A solve takes one keypress to record and there is no
                  undo behind this, so the second press is the whole safety net —
                  and it stays a button rather than a dialog because the cost of
                  changing your mind should be moving the mouse away.

                  Both labels are always in the button, stacked, with the longer
                  one holding the space open and hidden. Otherwise arming it
                  wraps "really delete" onto a second line and the row you are
                  aiming at grows under the pointer — which is the one moment on
                  this list where nothing should move. */}
              <button
                type="button"
                className={confirming === solve.id ? 'danger confirm armed' : 'danger confirm'}
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
                <span>{confirming === solve.id ? 'really delete' : 'delete'}</span>
                <span className="confirm-sizer" aria-hidden="true">really delete</span>
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

          {solve.mbld && openId === solve.id && (
            <p className="solve-split">
              {mbldPoints(solve.mbld)}{' '}
              {Math.abs(mbldPoints(solve.mbld)) === 1 ? 'point' : 'points'}
            </p>
          )}
        </li>
        )
      })}
      </ol>
    </>
  )
}
