import { useState } from 'react'
import { PLL_CASES, PLL_GROUPS } from './pll'
import { blankEntry, type CaseEntry, type CfopStore } from './types'
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
        <aside className="panel editor-panel">
          {selected && entry ? (
            <CaseEditor key={selected.id} item={selected} entry={entry} onChange={onChangeEntry} />
          ) : (
            <p className="hint">Pick a case to see its algorithm.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
