import { useState, useEffect } from 'react';
import PairGrid from './bld/letterPairs/PairGrid';
import FillMode from './bld/letterPairs/FillMode';
import { loadStore, saveStore } from './bld/letterPairs/storage';
import { isBlankEntry, type PairEntry } from './bld/letterPairs/types';
import { loadSettings, saveSettings, type Settings } from './settings/defaults';
import TimerPanel from './timer/TimerPanel'
import CfopPanel from './cfop/CfopPanel';
import { loadCfopStore, saveCfopStore } from './cfop/storage';
import { isBlankEntry as isBlankCase, type CaseEntry } from './cfop/types';
import SettingsPage from './settings/SettingsPage';
import {
  applyAppearance, applyBackground, loadAppearance, saveAppearance, type Appearance,
} from './theme/theme';
import { getBackground } from './theme/imageStore';
import {
  loadTimerSettings, saveTimerSettings, type TimerSettings,
} from './timer/settings';
import { loadTimerStore, saveTimerStore } from './timer/storage';
import StatsPage from './timer/StatsPage';

type Section = 'timer' | 'stats' | 'bld' | 'cfop' | 'settings'

// The timer is first because it is what the app is for; everything else is
// something you go and look at between solves.
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'timer', label: 'Timer' },
  { id: 'stats', label: 'Stats' },
  { id: 'bld', label: '3BLD' },
  { id: 'cfop', label: 'CFOP'},
  { id: 'settings', label: 'Settings' },
];

export default function App() {
  const [section, setSection] = useState<Section>('timer');

  const [store, setStore] = useState(loadStore);
  const [settings, setSettings] = useState(loadSettings);
  const [selected, setSelected] = useState<string | null>(null);
  const [filling, setFilling] = useState(false);
  const [cases, setCases] = useState(loadCfopStore);

  // Timer settings live up here rather than in TimerPanel: the settings page
  // and the timer both read them, and two copies of a toggle is one copy too
  // many. Appearance is the same story writ larger — it styles every section.
  const [timerSettings, setTimerSettings] = useState(loadTimerSettings);
  const [appearance, setAppearance] = useState(loadAppearance);
  const [timerStore, setTimerStore] = useState(loadTimerStore);
  const [backgroundNonce, setBackgroundNonce] = useState(0);

  function updateSettings(next: Settings) {
    setSettings(next);
    saveSettings(next);
  }

  function updateTimerSettings(next: TimerSettings) {
    setTimerSettings(next);
    saveTimerSettings(next);
  }

  // Written straight through rather than debounced: dragging a slider is a
  // handful of writes, and losing the last one on a reload is worse than the
  // writes are expensive.
  function updateAppearance(next: Appearance) {
    setAppearance(next);
    saveAppearance(next);
    applyAppearance(next);
  }

  useEffect(() => {
    const timer = setTimeout(() => saveStore(store), 400)
    return () => clearTimeout(timer)
  }, [store])

  // The picture is the one setting that can't be applied synchronously, so it
  // arrives a frame late over an already-correct theme rather than as a flash.
  // The object URL is revoked on the way out — the browser holds the whole
  // image alive for as long as one is outstanding.
  useEffect(() => {
    let url: string | null = null
    let stale = false

    void getBackground().then((blob) => {
      if (stale) return
      url = blob ? URL.createObjectURL(blob) : null
      applyBackground(url)
    })

    return () => {
      stale = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [backgroundNonce])

  // Same debounce as the pair store, for the same reason: an alg is typed a
  // character at a time and none of those keystrokes need to hit disk.
  useEffect(() => {
    const timer = setTimeout(() => saveCfopStore(cases), 400)
    return () => clearTimeout(timer)
  }, [cases])

  useEffect(() => {
    const timer = setTimeout(() => saveTimerStore(timerStore), 400)
    return () => clearTimeout(timer)
  }, [timerStore])

  function saveEntry(entry: PairEntry) {
    setStore((prev) => {
      const pairs = {...prev.pairs}
      if (isBlankEntry(entry)) delete pairs[entry.code]
      else pairs[entry.code] = {...entry, updatedAt: Date.now() }
      return { ...prev, pairs }
    })
  }

  /** Mirrors saveEntry: a case edited back to blank leaves storage entirely. */
  function saveCase(entry: CaseEntry) {
    setCases((prev) => {
      const next = { ...prev.cases }
      if (isBlankCase(entry)) delete next[entry.id]
      else next[entry.id] = { ...entry, updatedAt: Date.now() }
      return { ...prev, cases: next }
    })
  }

  return (
    <div className="app">
      <div className="app-bg" />

      <header className="topbar">
       <span className="brand">tstimer</span>
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
       <div className="content-inner">
        {section === 'bld' && (filling ? (
          <FillMode
            store={store}
            settings={settings}
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
            onChangeEntry={saveEntry}
            onFill={() => setFilling(true)}
          />
        ))}
        {section === 'cfop' && <CfopPanel store={cases} onChangeEntry={saveCase} />}
        {section === 'timer' && (
          <TimerPanel
            store={timerStore}
            setStore={setTimerStore}
            settings={timerSettings}
            onSettings={updateTimerSettings}
          />
        )}
        {section === 'stats' && (
          <StatsPage
            store={timerStore}
            settings={timerSettings}
            onSettings={updateTimerSettings}
          />
        )}
        {section === 'settings' && (
          <SettingsPage
            appearance={appearance}
            onAppearance={updateAppearance}
            onBackgroundChanged={() => setBackgroundNonce((count) => count + 1)}
            timer={timerSettings}
            onTimer={updateTimerSettings}
            timerStore={timerStore}
            onTimerStore={setTimerStore}
            onOpenTimer={() => setSection('timer')}
          />
        )}
       </div>
      </main>
    </div>
  );
}