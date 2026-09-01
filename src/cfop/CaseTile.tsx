import { useMemo } from 'react'
import { alignLastLayer, applyAlg, invertAlg, solvedCube } from '../cube/moves'
import { CubeTopView } from '../cube/CubeView'
import { activeAlg, caseLevel, type AlgCase, type CaseEntry } from './types'

interface CaseTileProps {
  item: AlgCase
  entry: CaseEntry | undefined
  selected: boolean
  onSelect: () => void
}

export default function CaseTile({ item, entry, selected, onSelect }: CaseTileProps) {
  const alg = activeAlg(item, entry)

  // The picture is the alg *undone* — the position you'd be staring at when the
  // case comes up, not the one executing it would produce — turned to the angle
  // the case is normally drawn at, since plenty of good algs leave an AUF.
  // Falling back to the shipped alg keeps the diagram steady while a
  // replacement is half-typed.
  const state = useMemo(() => {
    for (const candidate of [alg, item.alg]) {
      try {
        return alignLastLayer(applyAlg(solvedCube(), invertAlg(candidate)))
      } catch {
        // unparseable — try the shipped alg, then give up and show a solved cube
      }
    }
    return solvedCube()
  }, [alg, item.alg])

  return (
    <button
      type="button"
      className={`case-tile f${caseLevel(entry)}${selected ? ' selected' : ''}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <CubeTopView state={state} label={`${item.name} permutation`} />
      <span className="case-name">{item.name}</span>
    </button>
  )
}
