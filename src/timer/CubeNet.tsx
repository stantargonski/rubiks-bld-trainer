import { useMemo } from 'react'
import { applyAlg, solvedCube } from '../cube/moves'
import { CubeNetView } from '../cube/CubeView'

interface CubeNetProps {
  moves: string[]
}

export default function CubeNet({ moves }: CubeNetProps) {
  // The scramble generator only emits tokens the engine knows, but a hand-typed
  // or imported one might not — and a preview is never worth blanking the timer
  // over. Fall back to a solved cube and let the banner text stand as the
  // source of truth.
  const state = useMemo(() => {
    try {
      return applyAlg(solvedCube(), moves.join(' '))
    } catch {
      return solvedCube()
    }
  }, [moves])

  return (
    <div className="cube-net">
      <span className="net-title">scramble</span>
      <CubeNetView state={state} />
    </div>
  )
}
