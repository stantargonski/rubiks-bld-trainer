import { useState } from 'react'
import { useTimer } from './useTimer'
import { formatTime } from './format'
import { randomScramble } from './scramble'
import ScrambleBanner from './ScrambleBanner'
import SessionPicker from './SessionPicker'
import SolveList from './SolveList'
import StatsPanel from './StatsPanel'
import CubeNet from './CubeNet'
import CompBar from './CompBar'
import type { Dispatch, SetStateAction } from 'react'
import type { TimerSettings } from './settings'
import { average } from './stats'
import { defaultFormat, resultOf, suggestTarget } from './comp'
import { downloadText, sessionCsv, slug, stamp } from '../data/backup'
import {
  activeSession, effectiveMs, emptyTimerStore, newSession, newSolve,
  type Penalty, type PuzzleMode, type Session, type TimerStore,
} from './types'

const MODES: PuzzleMode[] = ['333', '3bld']

/** Where a comp round started, and what it started in. */
interface Round {
  sessionId: string
  mode: PuzzleMode
  start: number
}

interface TimerPanelProps {
  store: TimerStore
  setStore: Dispatch<SetStateAction<TimerStore>>
  settings: TimerSettings
  /** Takes you to the settings section — the gear no longer opens a dialog. */
  onSettings: () => void
}

export default function TimerPanel({ store, setStore, settings, onSettings }: TimerPanelProps) {

  // A comp round is a slice of the session's own solves rather than a mode of
  // its own: nothing about timing changes, so nothing about a solve needs to
  // record that it happened during one.
  //
  // It remembers which session and discipline it belongs to so that leaving
  // either one retires it on the spot — a half-finished average shouldn't
  // follow you to another session, and checking that here is a derivation
  // rather than an effect racing the render that caused it.
  const [round, setRound] = useState<Round | null>(null)
  const [compTarget, setCompTarget] = useState('')

  // Derived every render — never mirrored into state of its own.
  const session = activeSession(store)
  const solves = session.solves

  const [scrambles, setScrambles] = useState<string[][]>(() => [
    randomScramble(settings.scrambleLength, session.mode === '3bld'),
  ])
  const [index, setIndex] = useState(0)

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

  function setMode(mode: PuzzleMode) {
    updateActive((item) => ({ ...item, mode }))
    // A 3x3 scramble carries no orientation suffix, so the queued ones are
    // wrong for BLD (and vice versa). Start the queue over.
    setScrambles([randomScramble(settings.scrambleLength, mode === '3bld')])
    setIndex(0)
  }

  function createSession() {
    const created = newSession(`Session ${store.sessions.length + 1}`, session.mode)
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

  const format = defaultFormat(session.mode)
  const openRound =
    round && round.sessionId === session.id && round.mode === session.mode ? round : null
  const roundTimes = openRound ? solves.slice(openRound.start).map(effectiveMs) : []
  // What you're averaging now, as the basis for a goal slightly under it.
  const recent = resultOf(format, solves.slice(-format.size).map(effectiveMs))

  function startRound() {
    setRound({ sessionId: session.id, mode: session.mode, start: solves.length })
  }

  function exportSession() {
    downloadText(`${slug(session.name)}-${stamp()}.csv`, sessionCsv(session), 'text/csv')
  }

  function goNext() {
    if (index + 1 < scrambles.length) {
      setIndex(index + 1)
      return
    }
    setScrambles([...scrambles, randomScramble(settings.scrambleLength, session.mode === '3bld')])
    setIndex(scrambles.length)
  }

  const { phase, ms, memoMs } = useTimer(
    (finished, memo) => {
      const solve = newSolve(finished, memo, scrambles[index].join(' '))
      updateActive((item) => ({ ...item, solves: [...item.solves, solve] }))
      goNext()
    },
    settings.holdMs,
    session.mode === '3bld',
  )


  const solving = (phase === 'running' || phase === 'memo') && settings.hideUiWhileRunning

  return (
    <div className={solving ? 'timer-frame solving' : 'timer-frame'}>
      {settings.showSolveList && (
        <aside className="timer-rail">
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

          <div className="rail-mode">
            {MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                aria-current={session.mode === mode}
                onClick={() => setMode(mode)}
              >
                {mode === '333' ? '3x3' : '3BLD'}
              </button>
            ))}
          </div>

          <div className="rail-list">
            <SolveList
              solves={solves}
              decimals={settings.decimals}
              onPenalty={setPenalty}
              onDelete={deleteSolve}
            />
          </div>

          {settings.showStats && (
            <div className="rail-stats">
              <StatsPanel solves={solves} decimals={settings.decimals} mode={session.mode} />
            </div>
          )}
        </aside>
      )}

      <div className="timer-main">
        {settings.showScramble && (
          <ScrambleBanner
            moves={scrambles[index]}
            canGoBack={index > 0}
            onLast={() => setIndex(index - 1)}
            onNext={goNext}
          />
        )}

        {openRound && (
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
        )}

        <div className="timer-stage">
          <div className={`clock ${phase}`}>{formatTime(ms, settings.decimals)}</div>

          {/* memoMs is only ever non-null on a split solve, so no mode check. */}
          {memoMs !== null && (
            <div className="split">
              <span>memo <b>{formatTime(memoMs, settings.decimals)}</b></span>
              <span>exec {formatTime(ms - memoMs, settings.decimals)}</span>
            </div>
          )}

          {settings.showAverages && (
            <div className="averages">
              <span>ao5 <b>{formatTime(average(solves, 5), settings.decimals)}</b></span>
              <span>ao12 <b>{formatTime(average(solves, 12), settings.decimals)}</b></span>
            </div>
          )}
        </div>

        {/* The gear sits outside the showCubeNet check — inside it, turning the
            preview off would leave no way to turn it back on. */}
        <div className="timer-dock">
          <button
            type="button"
            className="dock-gear"
            title="timer settings"
            aria-label="timer settings"
            onClick={onSettings}
          >
            ⚙
          </button>
          <button
            type="button"
            className="dock-gear"
            title="competition round"
            aria-label="competition round"
            aria-pressed={openRound !== null}
            onClick={openRound ? () => setRound(null) : startRound}
          >
            🏁
          </button>
          {settings.showCubeNet && <CubeNet moves={scrambles[index]} />}
        </div>
      </div>
    </div>
  )
}
