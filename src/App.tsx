import { useState } from 'react'
import PairGrid from './bld/letterPairs/PairGrid';
import { loadStore } from './bld/letterPairs/storage';
import { loadSettings, saveSettings, type Settings } from './settings/defaults';

type Section = 'bld' | 'cfop' | 'timer'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'bld', label: 'BLD' },
  { id: 'cfop', label: 'CFOP'},
  { id: 'timer', label: 'Timer' },
];

export default function App() {
  const [section, setSection] = useState<Section>('bld');

  const [store] = useState(loadStore);
  const [settings, setSettings] = useState(loadSettings);
  const [selected, setSelected] = useState<string | null>(null);

  function updateSettings(next: Settings) {
    setSettings(next);
    saveSettings(next);
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