import { useState } from 'react'
import { useTimer } from './useTimer'
import { formatTime } from './format'
import { randomScramble } from './scramble'

interface Solve {
  id: number
  ms: number
  scramble: string[]
}

export default function TimerPanel() {
  const [solves , setSolves] = useState<Solve[]>([])
  const [scramble, setScramble] = useState(randomScramble)

  const { phase, ms } = useTimer((finished) => {
      setSolves((prev) => [{id: Date.now(),ms: finished, scramble}, ...prev])
      setScramble(randomScramble())
  })

  return (
  <section className="timer">
    <div className={phase === 'running' ? 'scramble dim' : 'scramble'}>
      {scramble.map((move, index) => (
        <span key={index}>{move}</span>
      ))}
    </div>
    <button type="button" className="reroll" onClick={() =>
      setScramble(randomScramble())}>
        new scramble
    </button>
    <div className={`clock ${phase}`}>{formatTime(ms)}</div>

    {solves.length > 0 && (
      <ol className="solves">
        {solves.map((solve, index) => (
          <li key={solve.id}>
            <span className="solve-n">{solves.length - index}</span>
            <span className="solve-t">{formatTime(solve.ms)}</span>
          </li>
        ))}
      </ol>
    )}
  </section>
  )

}