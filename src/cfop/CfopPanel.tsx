import { useMemo, useState } from 'react'
import { PLL_CASES, PLL_GROUPS } from './pll'
import { blankEntry, caseLevel, type CaseEntry, type CfopStore } from './types'
import CaseTile from './CaseTile'
import CaseEditor from './CaseEditor'

interface CfopPanelProps {
  store: CfopStore
  onChangeEntry: (entry: CaseEntry) => void
}

export default function CfopPanel({ store, onChangeEntry }: CfopPanelProps) {
  // Selection is local: nothing outside this panel needs to know which case is
  // open, and it shouldn't survive leaving the section.
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const started = useMemo(
    () => PLL_CASES.filter((item) => caseLevel(store.cases[item.id]) > 0).length,
    [store],
  )
  const percent = Math.round((started / PLL_CASES.length) * 100)

  const selected = PLL_CASES.find((item) => item.id === selectedId) ?? null
  const entry = selected ? (store.cases[selected.id] ?? blankEntry(selected.id)) : null

  return (
    <div className="pairs-layout">
      <div className="grid-panel case-panel">
        <h2 className="panel-title">PLL — 21 cases, easiest family first</h2>

        {PLL_GROUPS.map((group) => (
          <section className="case-group" key={group}>
            <h3 className="case-group-title">{group}</h3>
            <div className="case-row">
              {PLL_CASES.filter((item) => item.group === group).map((item) => (
                <CaseTile
                  key={item.id}
                  item={item}
                  entry={store.cases[item.id]}
                  selected={item.id === selectedId}
                  onSelect={() => setSelectedId(item.id)}
                />
              ))}
            </div>
          </section>
        ))}

        <div className="legend">
          <span><i className="swatch" style={{ background: 'var(--fill-0)' }} /> untouched</span>
          <span><i className="swatch" style={{ background: 'var(--fill-1)' }} /> weak</span>
          <span><i className="swatch" style={{ background: 'var(--fill-2)' }} /> ok</span>
          <span><i className="swatch" style={{ background: 'var(--fill-3)' }} /> solid</span>
        </div>
      </div>

      <div className="side-stack">
        <aside className="panel method-panel">
          <h2 className="panel-title">Progress</h2>
          <div className="meter">
            <i style={{ width: `${percent}%` }} />
          </div>
          <div className="stat">
            <span>{started} / {PLL_CASES.length} cases</span>
            <span>{percent}%</span>
          </div>
          <p className="blind">
            Each diagram is that case as you'd see it, drawn from the alg in force — so
            replacing an alg redraws its picture.
          </p>
        </aside>

        <aside className="panel editor-panel">
          {selected && entry ? (
            <CaseEditor key={selected.id} item={selected} entry={entry} onChange={onChangeEntry} />
          ) : (
            <p className="hint">Pick a case to set your alg, notes and confidence.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
