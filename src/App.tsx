import { useState, useEffect } from 'react';
import PairGrid from './bld/letterPairs/PairGrid';
import { loadStore, saveStore } from './bld/letterPairs/storage';
import { isBlankEntry, type PairEntry } from './bld/letterPairs/types';
import { loadSettings, saveSettings, type Settings } from './settings/defaults';

type Section = 'bld' | 'cfop' | 'timer'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'bld', label: 'BLD' },
  { id: 'cfop', label: 'CFOP'},
  { id: 'timer', label: 'Timer' },
];

export default function App() {
  const [section, setSection] = useState<Section>('bld');

  const [store, setStore] = useState(loadStore);
  const [settings, setSettings] = useState(loadSettings);
  const [selected, setSelected] = useState<string | null>(null);

  function updateSettings(next: Settings) {
    setSettings(next);
    saveSettings(next);
  }

  useEffect(() => {
    const timer = setTimeout(() => saveStore(store), 400)
    return () => clearTimeout(timer)
  }, [store])

  function saveEntry(entry: PairEntry) {
    setStore((prev) => {
      const pairs = {...prev.pairs}
      if (isBlankEntry(entry)) delete pairs[entry.code]
      else pairs[entry.code] = {...entry, updatedAt: Date.now() }
      return { ...prev, pairs }
    })
  }

  return (
    <div className="app">
      <header className="topbar">
       <span className="brand">Training Utils</span>
       <nav className="nav">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            aria-current={section === item.id}
            onClick={() => setSection(item.id)}
          >
            {item.label}
            </button>
        ))}
       </nav>
      </header>

      <main className="content">
        {section === 'bld' && (
          <PairGrid 
            store={store}
            settings={settings}
            onSettings={updateSettings}
            selected={selected}
            onSelect={setSelected}
            onChangeEntry={saveEntry}
          />
        )}
        {section === 'cfop' && (
          <p className="stub">CFOP trainer — F2L, OLL and PLL databases. Phase 4.</p>
        )}
        {section === 'timer' && (
          <p className="stub">Timer — with memo/exec split for BLD. Phase 5.</p>
        )}
      </main>
    </div>
  );
}