import { useEffect, useState } from 'react'
import { useTimer } from './useTimer'
import { clockPhase, clockText } from './display'
import { formatTime } from './format'
import { eventOf, type EventId, type WcaEvent } from './events'
import { prepare, scrambleFor, scrambleText, type Scramble } from './scramble'
import EventPicker from './EventPicker'
import MbldCount from './MbldCount'
import ScrambleBanner from './ScrambleBanner'
import ScramblePreview from './ScramblePreview'
import SessionPicker from './SessionPicker'
import SolveList from './SolveList'
import StatsPanel from './StatsPanel'
import CompBar from './CompBar'
import type { Dispatch, SetStateAction } from 'react'
import { DEFAULT_TIMER_SETTINGS, type TimerSettings } from './settings'
import { average } from './stats'
import { formatOf, resultOf, suggestTarget } from './comp'
import { downloadText, sessionCsv, slug, stamp } from '../data/backup'
import {
  activeSession, effectiveMs, emptyTimerStore, newSession, newSolve,
  type Penalty, type Session, type TimerStore,
} from './types'

/** Where a comp round started, and what it started in. */
interface Round {
  sessionId: string
  event: EventId
  start: number
}

interface TimerPanelProps {
  store: TimerStore
  setStore: Dispatch<SetStateAction<TimerStore>>
  settings: TimerSettings
  onSettings: (next: TimerSettings) => void
}

export default function TimerPanel({ store, setStore, settings, onSettings }: TimerPanelProps) {

  // A comp round is a slice of the session's own solves rather than a mode of
  // its own: nothing about timing changes, so nothing about a solve needs to
  // record that it happened during one.
  //
  // It remembers which session and event it belongs to so that leaving either
  // one retires it on the spot — a half-finished average shouldn't follow you
  // to another session, and checking that here is a derivation rather than an
  // effect racing the render that caused it.
  const [round, setRound] = useState<Round | null>(null)
  const [compTarget, setCompTarget] = useState('')

  // Derived every render — never mirrored into state of its own.
  const session = activeSession(store)
  const solves = session.solves
  const event = eventOf(session.event)

  const options = { mbldCount: settings.mbldCount }
  const [scrambles, setScrambles] = useState<Scramble[]>(() => [scrambleFor(event, options)])
  const [index, setIndex] = useState(0)
  /** The event the queue in `scrambles` was built for. */
  const [builtFor, setBuiltFor] = useState(session.event)

  // The session owns the event, so switching sessions switches the puzzle out
  // from under the queue — and a 4x4 scramble left over from the last session is
  // not a scramble, it is a wrong answer. Rebuilt during the render that noticed
  // rather than from an effect a frame later, which would paint the old puzzle's
  // scramble first. This is also the only path the event picker needs: it writes
  // the session's event and the queue follows.
  if (builtFor !== session.event) {
    setBuiltFor(session.event)
    setScrambles([scrambleFor(event, options)])
    setIndex(0)
  }

  const scramble = scrambles[index]

  // The 2x2 needs a table built before it can give real random-state scrambles.
  // Asking as soon as the event is picked means it is nearly always ready by
  // the time the first solve ends.
  useEffect(() => { prepare(event) }, [event])

  /** Every change to the current session goes through here, so the nested
      spread is written once instead of six times. */
  function updateActive(change: (session: Session) => Session) {
    setStore((prev) => ({
      ...prev,
      sessions: prev.sessions.map((item) => (item.id === prev.activeId ? change(item) : item)),
    }))
  }

  function setPenalty(id: number, penalty: Penalty) {
    updateActive((item) => ({
      ...item,
      solves: item.solves.map((solve) => (solve.id === id ? { ...solve, penalty } : solve)),
    }))
  }

  function deleteSolve(id: number) {
    updateActive((item) => ({
      ...item,
      solves: item.solves.filter((solve) => solve.id !== id),
    }))
  }

  function setEvent(id: EventId) {
    // The queue is not touched here: writing the session's event is what starts
    // it over, above, and that is the same path a session switch takes. Which
    // also means the choice is remembered — it is stored on the session.
    updateActive((item) => ({ ...item, event: id }))
  }

  /** Throws away the queue and starts a fresh one for `next`. */
  function restart(next: WcaEvent, mbldCount = settings.mbldCount) {
    setScrambles([scrambleFor(next, { mbldCount })])
    setIndex(0)
  }

  function setMbldCount(mbldCount: number) {
    onSettings({ ...settings, mbldCount })
    // A queued five-cube scramble is the wrong scramble the moment you ask for
    // eight, so the queue goes with the setting.
    restart(event, mbldCount)
  }

  function createSession() {
    const created = newSession(`Session ${store.sessions.length + 1}`, session.event)
    setStore((prev) => ({
      ...prev,
      sessions: [...prev.sessions, created],
      activeId: created.id,
    }))
  }

  function deleteSession() {
    const count = solves.length
    if (count > 0 && !window.confirm(`Delete "${session.name}" and its ${count} solves?`)) return

    setStore((prev) => {
      const remaining = prev.sessions.filter((item) => item.id !== prev.activeId)
      // Never leave the store with nothing to render.
      if (remaining.length === 0) return emptyTimerStore()
      return { ...prev, sessions: remaining, activeId: remaining[0].id }
    })
  }

  const format = formatOf(event)
  const openRound =
    round && round.sessionId === session.id && round.event === session.event ? round : null
  const roundTimes = openRound ? solves.slice(openRound.start).map(effectiveMs) : []
  // What you're averaging now, as the basis for a goal slightly under it.
  const recent = resultOf(format, solves.slice(-format.size).map(effectiveMs))

  function startRound() {
    setRound({ sessionId: session.id, event: session.event, start: solves.length })
  }

  function exportSession() {
    downloadText(`${slug(session.name)}-${stamp()}.csv`, sessionCsv(session), 'text/csv')
  }

  function goNext() {
    if (index + 1 < scrambles.length) {
      setIndex(index + 1)
      return
    }
    setScrambles([...scrambles, scrambleFor(event, options)])
    setIndex(scrambles.length)
  }

  const { phase, ms, memoMs, inspectMs } = useTimer(
    (finished, memo, penalty) => {
      const solve = newSolve(finished, memo, scrambleText(scramble), session.event, penalty)
      updateActive((item) => ({ ...item, solves: [...item.solves, solve] }))
      goNext()
    },
    {
      holdMs: settings.holdMs,
      split: event.split,
      inspection: settings.inspection && event.inspection,
    },
  )

  const timing = phase === 'running' || phase === 'memo'
  const solving = timing && settings.hideUiWhileRunning

  /**
   * What the clock reads when it is not running.
   *
   * The session's own last solve rather than the hook's `ms`, which starts at
   * zero on a fresh page load. The two agree the instant a solve ends — the
   * solve just timed IS the session's last one — so this only changes what you
   * see after a reload or a switch of sessions, which is exactly where a bare
   * 0.00 was telling you nothing.
   */
  const restingMs = solves.length > 0 ? effectiveMs(solves[solves.length - 1]) : 0

  // Both of these are pure functions of the timer's state, over in ./display.ts
  // where they can be checked without a browser.
  const face = clockText({
    phase,
    ms: timing ? ms : restingMs,
    inspectMs,
    decimals: settings.decimals,
    runningDisplay: settings.runningDisplay,
  })

  return (
    <div className={solving ? 'timer-frame solving' : 'timer-frame'}>
      {/* The rail carries the tools now, so it stands as long as anything in
          it does rather than only as long as the solve list. */}
      {(settings.showSolveList || settings.showStats) && (
        <aside className="timer-rail">
          {settings.showStats && (
            <div className="rail-stats">
              <StatsPanel solves={solves} decimals={settings.decimals} event={event} />
            </div>
          )}

          <div className="rail-head">
            <SessionPicker
              sessions={store.sessions}
              activeId={store.activeId}
              onSelect={(id) => setStore((prev) => ({ ...prev, activeId: id }))}
              onCreate={createSession}
              onRename={(name) => updateActive((item) => ({ ...item, name }))}
              onDelete={deleteSession}
              onExport={exportSession}
            />
          </div>

          {settings.showSolveList && (
            <div className="rail-list">
              <SolveList
                solves={solves}
                decimals={settings.decimals}
                onPenalty={setPenalty}
                onDelete={deleteSolve}
              />
            </div>
          )}

          {/* Pinned to the foot of the rail: both are switches for the whole
              timer, and putting them here keeps them still while the list
              above them grows. */}
          <div className="rail-tools">
            {/* Neither carries a pressed state. Both act on the thing they name
                and the thing they name is already on screen saying so — a lit
                button is a second, slower answer to a question the stage has
                already answered. Comp sim starts a round; the round's own × is
                what ends it. */}
            <button type="button" className="rail-tool" onClick={startRound}>
              🏁 comp sim
            </button>
            <button
              type="button"
              className="rail-tool"
              onClick={() => onSettings({ ...settings, showCubeNet: !settings.showCubeNet })}
            >
              🧊 preview
            </button>
          </div>
        </aside>
      )}

      <div className="timer-main">
        {settings.showScramble && (
          <ScrambleBanner
            scramble={scramble}
            canGoBack={index > 0}
            onLast={() => setIndex(index - 1)}
            onNext={goNext}
            action={settings.scrambleClick}
          >
            <EventPicker value={session.event} onChange={setEvent} />
            {event.scramble.kind === 'mbf' && (
              <MbldCount value={settings.mbldCount} onChange={setMbldCount} />
            )}
          </ScrambleBanner>
        )}

        {/* Docked under the scramble, in this column's flow. It used to sit above
            the clock inside the stage, which meant opening a round pushed the
            clock down the screen — the one element on the page whose position
            should never depend on what else is showing. */}
        {openRound && (
          <div className="comp-dock">
            <CompBar
              format={format}
              times={roundTimes}
              targetText={compTarget}
              onTargetText={setCompTarget}
              suggestion={suggestTarget(recent)}
              decimals={settings.decimals}
              onRestart={startRound}
              onClose={() => setRound(null)}
            />
          </div>
        )}

        {/* The clock lives in the stage rather than in this column, so it centres
            on the window rather than on the space the rail leaves. */}
        <div className="timer-stage">
          <div className="stage-clock">
            <div className={`clock ${clockPhase(phase, inspectMs)}`}>{face}</div>

            {/* memoMs is only ever non-null on a split solve, so no mode check. */}
            {memoMs !== null && !timing && (
              <div className="split">
                <span>memo <b>{formatTime(memoMs, settings.decimals)}</b></span>
                <span>exec {formatTime(ms - memoMs, settings.decimals)}</span>
              </div>
            )}

            {/* Hidden while the clock is running whatever else is on screen —
                an average you can't change yet is the definition of a distraction. */}
            {settings.showAverages && !timing && (
              <div className="averages">
                <span>ao5 <b>{formatTime(average(solves, 5), settings.decimals)}</b></span>
                <span>ao12 <b>{formatTime(average(solves, 12), settings.decimals)}</b></span>
              </div>
            )}
          </div>
        </div>

        {/* Not pinned to a corner — it sits wherever it was last dragged, over
            the whole frame. */}
        {settings.showCubeNet && (
          <ScramblePreview
            event={event}
            scramble={scramble}
            width={settings.previewWidth}
            height={settings.previewHeight}
            right={settings.previewRight}
            bottom={settings.previewBottom}
            onResize={(previewWidth, previewHeight) =>
              onSettings({ ...settings, previewWidth, previewHeight })}
            onMove={(previewRight, previewBottom) =>
              onSettings({ ...settings, previewRight, previewBottom })}
            onReset={() => onSettings({
              ...settings,
              previewWidth: DEFAULT_TIMER_SETTINGS.previewWidth,
              previewHeight: DEFAULT_TIMER_SETTINGS.previewHeight,
              previewRight: DEFAULT_TIMER_SETTINGS.previewRight,
              previewBottom: DEFAULT_TIMER_SETTINGS.previewBottom,
            })}
          />
        )}
      </div>
    </div>
  )
}
