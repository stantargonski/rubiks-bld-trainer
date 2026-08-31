import { useState, useEffect } from 'react';
import PairGrid from './bld/letterPairs/PairGrid';
import FillMode from './bld/letterPairs/FillMode';
import {
  loadStore, loadSuggestions, saveStore, saveSuggestions,
} from './bld/letterPairs/storage';
import GlobalNotes from './bld/GlobalNotes';
import { isBlankEntry, type PairEntry } from './bld/letterPairs/types';
import { loadSettings, saveSettings, type Settings } from './settings/defaults';
import TimerPanel from './timer/TimerPanel'

type Section = 'bld' | 'cfop' | 'timer' | 'notes'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'bld', label: '3BLD' },
  { id: 'cfop', label: 'CFOP'},
  { id: 'timer', label: 'Timer' },
  { id: 'notes', label: 'Notes' },
];

export default function App() {
  const [section, setSection] = useState<Section>('bld');

  const [store, setStore] = useState(loadStore);
  const [settings, setSettings] = useState(loadSettings);
  const [selected, setSelected] = useState<string | null>(null);
  const [filling, setFilling] = useState(false);
  const [suggestions, setSuggestions] = useState(loadSuggestions);

  function updateSettings(next: Settings) {
    setSettings(next);
    saveSettings(next);
  }

  function updateSuggestions(words: Record<string, string[]>) {
    setSuggestions(words);
    saveSuggestions(words);
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

  function saveGlobalNotes(globalNotes: string) {
    setStore((prev) => ({ ...prev, globalNotes }));
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

      <main className={section === 'timer' ? 'content flush' : 'content'}>
        {section === 'bld' && (filling ? (
          <FillMode
            store={store}
            settings={settings}
            words={suggestions}
            onChangeEntry={saveEntry}
            onExit={() => setFilling(false)}
          />
        ) : (
          <PairGrid
            store={store}
            settings={settings}
            onSettings={updateSettings}
            selected={selected}
            onSelect={setSelected}
            suggestions={suggestions}
            onSuggestions={updateSuggestions}
            onChangeEntry={saveEntry}
            onFill={() => setFilling(true)}
          />
        ))}
        {section === 'cfop' && (
          <p className="stub">CFOP trainer — F2L, OLL and PLL databases. Phase 4.</p>
        )}
        {section === 'timer' && <TimerPanel />}
        {section === 'notes' && (
          <GlobalNotes value={store.globalNotes} onChange={saveGlobalNotes} />
        )}
      </main>
    </div>
  );
}