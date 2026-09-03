import { useEffect, useRef, useState, type ReactNode } from 'react'
import CsTimerImport from './CsTimerImport'
import DataSection from './DataSection'
import TimerPreview from './TimerPreview'
import ThemeEditor from './ThemeEditor'
import {
  CUSTOM_THEME_ID, FONTS, paletteOf, seedCustomTheme, THEMES, type Appearance,
} from '../theme/theme'
import { clearBackground, downscale, putBackground } from '../theme/imageStore'
import { SCALE_MAX, SCALE_MIN, type TimerSettings } from '../timer/settings'
import type { TimerStore } from '../timer/types'

/** The jump targets down the left, in the order the page runs. */
const SECTIONS = [
  { id: 'appearance', name: 'appearance' },
  { id: 'timer', name: 'timer' },
  { id: 'data', name: 'data' },
]

/**
 * One row: what the setting is on the left, the control on the right.
 *
 * The description isn't decoration — most of these settings are only obvious
 * once you know what they change, and a page of bare labels makes you toggle
 * things to find out.
 */
function Row({ label, description, children }: {
  label: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="setting-row">
      <div className="setting-label">
        <strong>{label}</strong>
        {description && <span>{description}</span>}
      </div>
      <div className="setting-control">{children}</div>
    </div>
  )
}

function Choice<T extends string>({ options, value, onChange }: {
  options: { id: T; name: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div className="choice">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
        >
          {option.name}
        </button>
      ))}
    </div>
  )
}

/**
 * One button that says where the setting stands and flips it.
 *
 * It used to be two, on and off, with the current one lit. That is the right
 * shape for a choice between things — which is what `Choice` above is for — but
 * a boolean has no second option worth drawing: half the control was always
 * dead, and reading it meant working out which half was the answer rather than
 * just reading the answer.
 */
function Toggle({ value, onChange }: { value: boolean; onChange: (next: boolean) => void }) {
  return (
    <div className="choice toggle">
      <button type="button" aria-pressed={value} onClick={() => onChange(!value)}>
        {value ? 'on' : 'off'}
      </button>
    </div>
  )
}

/**
 * A number you nudge or type, in place of a slider.
 *
 * A slider is the wrong control for every setting on this page: they all have a
 * value worth knowing exactly, and none of them wants to be dragged past
 * fourteen wrong values on the way to the right one. Buttons step, and the field
 * takes a number straight if you already know which one you want.
 */
function Stepper({ value, min, max, step, format, onChange }: {
  value: number
  min: number
  max: number
  step: number
  format: (value: number) => string
  onChange: (value: number) => void
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next))
  // Steps land on multiples of `step` even if the stored value isn't one.
  const nudge = (direction: number) =>
    onChange(clamp(Math.round((value + direction * step) / step) * step))

  return (
    <div className="stepper">
      <button type="button" onClick={() => nudge(-1)} disabled={value <= min} aria-label="less">−</button>
      <input
        type="text"
        inputMode="numeric"
        value={format(value)}
        onChange={(change) => {
          const parsed = Number.parseFloat(change.target.value.replace(/[^\d.-]/g, ''))
          if (Number.isFinite(parsed)) onChange(clamp(parsed))
        }}
      />
      <button type="button" onClick={() => nudge(1)} disabled={value >= max} aria-label="more">+</button>
    </div>
  )
}

interface SettingsPageProps {
  appearance: Appearance
  onAppearance: (next: Appearance) => void
  /** Reloads the picture from IndexedDB after it changes. */
  onBackgroundChanged: () => void
  timer: TimerSettings
  onTimer: (next: TimerSettings) => void
  /** The whole solve history, for the csTimer importer to add to. */
  timerStore: TimerStore
  onTimerStore: (next: TimerStore) => void
  /** Leaves for the timer, so an import ends where the solves are. */
  onOpenTimer: () => void
  /** Puts every setting back to stock. Owned by App, which holds all three. */
  onRestoreDefaults: () => void
}

export default function SettingsPage({
  appearance, onAppearance, onBackgroundChanged, timer, onTimer, timerStore, onTimerStore,
  onOpenTimer, onRestoreDefaults,
}: SettingsPageProps) {
  const picker = useRef<HTMLInputElement>(null)
  const [here, setHere] = useState(SECTIONS[0].id)
  /** Whether the palette is open for editing. */
  const [editingTheme, setEditingTheme] = useState(appearance.themeId === CUSTOM_THEME_ID)

  function setAppearance<K extends keyof Appearance>(key: K, value: Appearance[K]) {
    onAppearance({ ...appearance, [key]: value })
  }

  function setTimer<K extends keyof TimerSettings>(key: K, value: TimerSettings[K]) {
    onTimer({ ...timer, [key]: value })
  }

  // Which section the nav should light up. Watched rather than only set on
  // click, so scrolling past a heading moves the marker too — a nav that only
  // updated when pressed would be wrong the moment anyone used the wheel.
  useEffect(() => {
    const watcher = new IntersectionObserver(
      (entries) => {
        const showing = entries.filter((entry) => entry.isIntersecting)
        if (showing.length === 0) return

        // The one nearest the top of the viewport, not the largest: on a long
        // page the biggest visible section is often the one you have left.
        const top = showing.reduce((best, entry) =>
          entry.boundingClientRect.top < best.boundingClientRect.top ? entry : best)
        setHere(top.target.id.replace('settings-', ''))
      },
      { rootMargin: '-70px 0px -55% 0px', threshold: 0 },
    )

    for (const section of SECTIONS) {
      const node = document.getElementById(`settings-${section.id}`)
      if (node) watcher.observe(node)
    }
    return () => { watcher.disconnect() }
  }, [])

  // What the custom chip paints itself with: the palette if there is one, and
  // otherwise the theme it would be seeded from.
  const customColors = paletteOf(
    appearance.customTheme ?? seedCustomTheme(
      appearance.themeId === CUSTOM_THEME_ID ? THEMES[0].id : appearance.themeId,
    ),
  )
  const custom = {
    background: customColors.bg,
    color: customColors.text,
    borderColor: customColors.line,
  }

  function jump(id: string) {
    setHere(id)
    document.getElementById(`settings-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function chooseBackground(file: File) {
    await putBackground(await downscale(file))
    onAppearance({ ...appearance, hasBackground: true })
    onBackgroundChanged()
  }

  async function dropBackground() {
    await clearBackground()
    onAppearance({ ...appearance, hasBackground: false })
    onBackgroundChanged()
  }

  function restoreDefaults() {
    if (!window.confirm(
      'Put every setting back to its default? Your solves, sessions, algs and ' +
      'letter pairs are not touched.',
    )) return
    onRestoreDefaults()
  }

  // Every stepper on this page reads and writes a plain whole number; the
  // fraction-valued settings are converted at their own call sites.
  const plain = (value: number) => `${value}`

  return (
    <div className="settings-page">
      {/* The empty column down the left was the obvious place to put these, and
          a settings page long enough to need them is one you scroll past the
          heading you wanted. */}
      <nav className="settings-nav" aria-label="settings sections">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            aria-current={here === section.id}
            onClick={() => jump(section.id)}
          >
            {section.name}
          </button>
        ))}
      </nav>

      <div className="settings-body">
        {/* Appearance first and across the full width: it is the section people
            come here for, and the theme grid wants the room. */}
        <section className="settings-group" id="settings-appearance">
          <h2 className="panel-title">appearance</h2>

          <Row label="theme">
            <div className="theme-grid">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  className="theme-chip"
                  aria-pressed={theme.id === appearance.themeId}
                  style={{
                    background: theme.colors.bg,
                    color: theme.colors.text,
                    borderColor: theme.colors.line,
                  }}
                  onClick={() => setAppearance('themeId', theme.id)}
                >
                  <span>{theme.name}</span>
                  <i style={{ background: theme.colors.accent }} />
                </button>
              ))}

              {/* Drawn from the palette it selects, exactly like the ten before
                  it — a chip that showed stock colours would be the one chip on
                  the row not telling you what it does. */}
              <button
                type="button"
                className="theme-chip"
                aria-pressed={appearance.themeId === CUSTOM_THEME_ID}
                aria-expanded={editingTheme}
                style={custom}
                onClick={() => {
                  // First press builds a palette as well as opening the editor,
                  // seeded from the theme on screen, so pressing it changes
                  // nothing about how the app looks until you change something.
                  if (appearance.themeId !== CUSTOM_THEME_ID) {
                    onAppearance({
                      ...appearance,
                      themeId: CUSTOM_THEME_ID,
                      customTheme: appearance.customTheme ?? seedCustomTheme(appearance.themeId),
                    })
                    setEditingTheme(true)
                  } else {
                    setEditingTheme(!editingTheme)
                  }
                }}
              >
                <span>Custom</span>
                <i style={{ background: customColors.accent }} />
              </button>
            </div>
          </Row>

          {editingTheme && (
            <ThemeEditor appearance={appearance} onAppearance={onAppearance} />
          )}

          <Row label="interface font">
            <Choice
              options={FONTS}
              value={appearance.uiFont}
              onChange={(id) => setAppearance('uiFont', id)}
            />
          </Row>

          <Row label="timer font">
            <Choice
              options={FONTS}
              value={appearance.timerFont}
              onChange={(id) => setAppearance('timerFont', id)}
            />
          </Row>

          <Row label="text size">
            <Stepper
              value={Math.round(appearance.fontScale * 100)} min={85} max={140} step={5}
              format={plain}
              onChange={(value) => setAppearance('fontScale', value / 100)}
            />
          </Row>

          <Row
            label="menu bar"
            description="Stows the bar at the top down to the wordmark, which stays behind to bring it back. Pressing the wordmark does the same thing."
          >
            <Toggle
              value={!appearance.topBarStowed}
              onChange={(shown) => setAppearance('topBarStowed', !shown)}
            />
          </Row>

          <Row label="background picture">
            <div className="actions">
              <button type="button" onClick={() => picker.current?.click()}>
                {appearance.hasBackground ? 'replace' : 'choose'}
              </button>
              {appearance.hasBackground && (
                <button type="button" onClick={() => void dropBackground()}>remove</button>
              )}
            </div>
            <input
              ref={picker}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) void chooseBackground(file)
              }}
            />
          </Row>

          <Row label="background blur">
            <Stepper
              value={appearance.bgBlur} min={0} max={24} step={2}
              format={plain}
              onChange={(value) => setAppearance('bgBlur', value)}
            />
          </Row>

          <Row label="background dim">
            <Stepper
              value={Math.round(appearance.bgDim * 100)} min={0} max={90} step={5}
              format={plain}
              onChange={(value) => setAppearance('bgDim', value / 100)}
            />
          </Row>

          <Row label="panel opacity">
            <Stepper
              value={Math.round(appearance.panelOpacity * 100)} min={25} max={100} step={5}
              format={plain}
              onChange={(value) => setAppearance('panelOpacity', value / 100)}
            />
          </Row>

          <Row label="panel blur">
            <Stepper
              value={appearance.panelBlur} min={0} max={24} step={2}
              format={plain}
              onChange={(value) => setAppearance('panelBlur', value)}
            />
          </Row>
        </section>

        <section className="settings-group" id="settings-timer">
          <h2 className="panel-title">timer</h2>

          {/* Controls one side, the mock the other. The mock follows the scroll
              rather than sliding away at the first setting — the whole point of
              it is watching what a toggle does, and it can't do that from
              above the fold. */}
          <div className="settings-split">
            <div className="settings-fields">
              <Row label="scramble banner">
                <Toggle value={timer.showScramble} onChange={(v) => setTimer('showScramble', v)} />
              </Row>
              <Row label="solve list">
                <Toggle value={timer.showSolveList} onChange={(v) => setTimer('showSolveList', v)} />
              </Row>
              <Row label="session stats">
                <Toggle value={timer.showStats} onChange={(v) => setTimer('showStats', v)} />
              </Row>
              <Row label="ao5 / ao12 under the clock">
                <Toggle value={timer.showAverages} onChange={(v) => setTimer('showAverages', v)} />
              </Row>
              <Row
                label="difference from the last solve"
              >
                <Toggle value={timer.showDelta} onChange={(v) => setTimer('showDelta', v)} />
              </Row>
              <Row label="scramble preview">
                <Toggle value={timer.showCubeNet} onChange={(v) => setTimer('showCubeNet', v)} />
              </Row>
              <Row
                label="hide the preview for blindfolded events"
              >
                <Toggle
                  value={timer.hideBldPreview}
                  onChange={(v) => setTimer('hideBldPreview', v)}
                />
              </Row>

              {/* Percentages of the stock size rather than absolute sizes: both
                  still scale with the window and with the app-wide text size,
                  and this only says by how much more or less than usual. */}
              <Row
                label="clock text size"
              >
                <Stepper
                  value={timer.clockScale}
                  min={SCALE_MIN}
                  max={SCALE_MAX}
                  step={5}
                  format={plain}
                  onChange={(value) => setTimer('clockScale', value)}
                />
              </Row>
              <Row
                label="scramble text size"
              >
                <Stepper
                  value={timer.scrambleScale}
                  min={SCALE_MIN}
                  max={SCALE_MAX}
                  step={5}
                  format={plain}
                  onChange={(value) => setTimer('scrambleScale', value)}
                />
              </Row>
              <Row
                label="hide everything while solving"
                description="Will only show timer update while solving."
              >
                <Toggle
                  value={timer.hideUiWhileRunning}
                  onChange={(v) => setTimer('hideUiWhileRunning', v)}
                />
              </Row>

              <Row
                label="how a time is entered"
                description="Typed is for a stackmat: 1234 is is read as 12.34 and 12345 is 1:23.45."
              >
                <Choice
                  options={[
                    { id: 'timer', name: 'the clock' },
                    { id: 'typed', name: 'typed' },
                  ]}
                  value={timer.entryMode}
                  onChange={(id) => setTimer('entryMode', id)}
                />
              </Row>

              <Row
                label="timer update"
                description="What the clock shows while solving."
              >
                <Choice
                  options={[
                    { id: 'tenths', name: '0.1s' },
                    { id: 'seconds', name: 'seconds' },
                    { id: 'hidden', name: 'none' },
                  ]}
                  value={timer.runningDisplay}
                  onChange={(id) => setTimer('runningDisplay', id)}
                />
              </Row>

              <Row
                label="WCA inspection"
                description="15 second inpection, with automatic penalty."
              >
                <Toggle value={timer.inspection} onChange={(v) => setTimer('inspection', v)} />
              </Row>

              <Row
                label="flat scramble bar"
                description="Removes the background of the scramble panel."
              >
                <Toggle value={timer.flatScramble} onChange={(v) => setTimer('flatScramble', v)} />
              </Row>
              <Row
                label="flat sidebar"
                description="Removes the background of the side panel."
              >
                <Toggle value={timer.flatSidebar} onChange={(v) => setTimer('flatSidebar', v)} />
              </Row>
              <Row
                label="monospaced scramble"
              >
                <Toggle value={timer.monoScramble} onChange={(v) => setTimer('monoScramble', v)} />
              </Row>

              <Row label="action when clicking scramble">
                <Choice
                  options={[
                    { id: 'copy', name: 'copy' },
                    { id: 'next', name: 'next scramble' },
                    { id: 'none', name: 'none' },
                  ]}
                  value={timer.scrambleClick}
                  onChange={(id) => setTimer('scrambleClick', id)}
                />
              </Row>

              <Row label="hold to arm" description="How many milliseconds space is held in order to arm timer.">
                <Stepper
                  value={timer.holdMs} min={0} max={1000} step={50}
                  format={plain}
                  onChange={(value) => setTimer('holdMs', value)}
                />
              </Row>

              <Row label="decimal appearance">
                <Choice
                  options={[{ id: '2', name: '12.34' }, { id: '3', name: '12.345' }]}
                  value={timer.decimals === 3 ? '3' : '2'}
                  onChange={(id) => setTimer('decimals', id === '3' ? 3 : 2)}
                />
              </Row>
            </div>

            <div className="settings-preview">
              <TimerPreview settings={timer} />
            </div>
          </div>
        </section>

        <section className="settings-group" id="settings-data">
          <h2 className="panel-title">data</h2>
          <DataSection />

          {/* Importing from csTimer is one of the things you do with your data,
              not a subject of its own — under the same heading, so it reads as
              part of the same job rather than as another section to find. */}
          <CsTimerImport store={timerStore} onImport={onTimerStore} onOpenTimer={onOpenTimer} />

          <h2 className="panel-title">Restore Default Settings</h2>
          <Row
            label="restore the default settings"
            description="Only settings are affected. Solves, sessions, algs and letter pairs are not harmed."
          >
            <div className="actions">
              <button type="button" onClick={restoreDefaults}>restore defaults</button>
            </div>
          </Row>
        </section>
      </div>
    </div>
  )
}
