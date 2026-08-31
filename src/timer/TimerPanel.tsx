import { useEffect, useState } from 'react'
import { useTimer } from './useTimer'
import { formatTime } from './format'
import { randomScramble } from './scramble'
import ScrambleBanner from './ScrambleBanner'
import { loadTimerStore, saveTimerStore } from './storage'
import { loadTimerSettings } from './settings'
import { activeSession, effectiveMs, newSolve } from './types'
import { average, best, mean } from './stats'

export default function TimerPanel() {
  const [store, setStore] = useState(loadTimerStore)
  const [settings] = useState(loadTimerSettings)   // the gear modal lands next slice

  const [scrambles, setScrambles] = useState<string[][]>(() => [
    randomScramble(settings.scrambleLength),
  ])
  const [index, setIndex] = useState(0)

  // Derived every render — never mirrored into state of its own.
  const session = activeSession(store)
  const solves = session.solves

  function goNext() {
    if (index + 1 < scrambles.length) {
      setIndex(index + 1)
      return
    }
    setScrambles([...scrambles, randomScramble(settings.scrambleLength)])
    setIndex(scrambles.length)
  }

  const { phase, ms } = useTimer((finished) => {
    const solve = newSolve(finished, scrambles[index].join(' '))
    setStore((prev) => ({
      ...prev,
      sessions: prev.sessions.map((item) =>
        item.id === prev.activeId ? { ...item, solves: [...item.solves, solve] } : item,
      ),
    }))
    goNext()
  }, settings.holdMs)

  // Same debounce as the pair store: typing-speed changes don't hit disk.
  useEffect(() => {
    const id = setTimeout(() => saveTimerStore(store), 400)
    return () => clearTimeout(id)
  }, [store])

  const solving = phase === 'running' && settings.hideUiWhileRunning

  return (
    <div className={solving ? 'timer-frame solving' : 'timer-frame'}>
      {settings.showSolveList && (
        <aside className="timer-rail">
          <div className="rail-head">
            <strong>{session.name}</strong>
            <span className="solve-n">{solves.length}</span>
          </div>

          <div className="rail-list">
            {solves.length === 0 ? (
              <p className="rail-empty">no solves yet — hold space to start</p>
            ) : (
              <ol className="solve-list">
                {[...solves].reverse().map((solve, position) => (
                  <li key={solve.id} className={`solve-row ${solve.penalty}`}>
                    <span className="solve-n">{solves.length - position}</span>
                    <span className="solve-t">
                      {formatTime(effectiveMs(solve), settings.decimals)}
                    </span>
                    {solve.penalty !== 'none' && (
                      <span className="solve-tag">
                        {solve.penalty === 'plus2' ? '+2' : 'DNF'}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>

          {settings.showStats && (
            <dl className="rail-stats">
              <div className="stat-row">
                <dt>best</dt><dd>{formatTime(best(solves), settings.decimals)}</dd>
              </div>
              <div className="stat-row">
                <dt>mean</dt><dd>{formatTime(mean(solves), settings.decimals)}</dd>
              </div>
            </dl>
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

        <div className="timer-stage">
          <div className={`clock ${phase}`}>{formatTime(ms, settings.decimals)}</div>

          {settings.showAverages && (
            <div className="averages">
              <span>ao5 <b>{formatTime(average(solves, 5), settings.decimals)}</b></span>
              <span>ao12 <b>{formatTime(average(solves, 12), settings.decimals)}</b></span>
            </div>
          )}
        </div>

        {settings.showCubeNet && (
          <div className="timer-dock">
            <div className="cube-net">
              <strong>{scrambles[index].length} moves</strong>
              <span>cube preview lands with the move engine</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}