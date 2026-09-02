import { useMemo } from 'react'
import { caseLabels, labelsToState, lastLayerArrows, solvedLabels } from '../cube/moves'
import { CubeTopView } from '../cube/CubeView'
import { LAST_LAYER_COLOR } from '../cube/colors'
import { caseLevel, type AlgCase, type CaseEntry } from './types'

interface CaseTileProps {
  item: AlgCase
  entry: CaseEntry | undefined
  selected: boolean
  onSelect: () => void
}

export default function CaseTile({ item, entry, selected, onSelect }: CaseTileProps) {
  // The picture is the alg *undone* — the position you'd be staring at when the
  // case comes up, not the one executing it would produce — turned to the angle
  // the case is normally drawn at, since plenty of good algs leave an AUF.
  //
  // Tracked as labels rather than as colours so the arrows fall out of the same
  // computation as the stickers: `labels[i]` is where the piece at `i` belongs,
  // which is both what colour to paint it and where to point.
  const { state, arrows } = useMemo(() => {
    try {
      const labels = caseLabels(item.alg)
      return { state: labelsToState(labels), arrows: lastLayerArrows(labels) }
    } catch {
      // An unparseable alg is a bug `npm run check:algs` catches, not something
      // to blank the grid over: show a solved cube and no arrows.
      return { state: labelsToState(solvedLabels()), arrows: [] }
    }
  }, [item.alg])

  return (
    <button
      type="button"
      className={`case-tile f${caseLevel(entry)}${selected ? ' selected' : ''}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <CubeTopView
        state={state}
        arrows={arrows}
        palette={LAST_LAYER_COLOR}
        label={`${item.name} permutation`}
      />
      <span className="case-name">{item.name}</span>
    </button>
  )
}
