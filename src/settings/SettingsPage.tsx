import { useRef, type ReactNode } from 'react'
import DataSection from './DataSection'
import { FONTS, THEMES, type Appearance } from '../theme/theme'
import { clearBackground, downscale, putBackground } from '../theme/imageStore'
import type { TimerSettings } from '../timer/settings'

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

function Toggle({ value, onChange }: { value: boolean; onChange: (next: boolean) => void }) {
  return (
    <div className="choice">
      <button type="button" aria-pressed={value} onClick={() => onChange(true)}>on</button>
      <button type="button" aria-pressed={!value} onClick={() => onChange(false)}>off</button>
    </div>
  )
}

function Slider({ value, min, max, step, format, onChange }: {
  value: number
  min: number
  max: number
  step: number
  format: (value: number) => string
  onChange: (value: number) => void
}) {
  return (
    <div className="slider">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <b>{format(value)}</b>
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
}

export default function SettingsPage({
  appearance, onAppearance, onBackgroundChanged, timer, onTimer,
}: SettingsPageProps) {
  const picker = useRef<HTMLInputElement>(null)

  function setAppearance<K extends keyof Appearance>(key: K, value: Appearance[K]) {
    onAppearance({ ...appearance, [key]: value })
  }

  function setTimer<K extends keyof TimerSettings>(key: K, value: TimerSettings[K]) {
    onTimer({ ...timer, [key]: value })
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

  const percent = (value: number) => `${Math.round(value * 100)}%`
  const pixels = (value: number) => `${value}px`

  return (
    <div className="settings-page">
      <section className="settings-group">
        <h2 className="panel-title">appearance</h2>

        <Row label="theme" description="Colours for the whole app, timer included.">
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
          </div>
        </Row>

        <Row label="interface font">
          <Choice
            options={FONTS}
            value={appearance.uiFont}
            onChange={(id) => setAppearance('uiFont', id)}
          />
        </Row>

        <Row label="timer font" description="Only the clock. A monospaced face stops the digits dancing.">
          <Choice
            options={FONTS}
            value={appearance.timerFont}
            onChange={(id) => setAppearance('timerFont', id)}
          />
        </Row>

        <Row label="text size">
          <Slider
            value={appearance.fontScale} min={0.85} max={1.4} step={0.05}
            format={percent}
            onChange={(value) => setAppearance('fontScale', value)}
          />
        </Row>

        <Row
          label="background picture"
          description="Yours, from this device. Kept out of the way of your solve history."
        >
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
          <Slider
            value={appearance.bgBlur} min={0} max={24} step={1}
            format={pixels}
            onChange={(value) => setAppearance('bgBlur', value)}
          />
        </Row>

        <Row label="background dim" description="How far the picture fades back so text stays readable.">
          <Slider
            value={appearance.bgDim} min={0} max={0.9} step={0.05}
            format={percent}
            onChange={(value) => setAppearance('bgDim', value)}
          />
        </Row>

        <Row label="panel opacity" description="How much of the picture shows through the panels.">
          <Slider
            value={appearance.panelOpacity} min={0.25} max={1} step={0.05}
            format={percent}
            onChange={(value) => setAppearance('panelOpacity', value)}
          />
        </Row>

        <Row label="panel blur" description="Frosts whatever is behind a see-through panel.">
          <Slider
            value={appearance.panelBlur} min={0} max={24} step={1}
            format={pixels}
            onChange={(value) => setAppearance('panelBlur', value)}
          />
        </Row>
      </section>

      <section className="settings-group">
        <h2 className="panel-title">timer</h2>

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
        <Row label="cube preview" description="The scramble drawn as a cube, next to the gear.">
          <Toggle value={timer.showCubeNet} onChange={(v) => setTimer('showCubeNet', v)} />
        </Row>
        <Row
          label="hide everything while solving"
          description="Fades the rail and the scramble the moment the clock starts."
        >
          <Toggle
            value={timer.hideUiWhileRunning}
            onChange={(v) => setTimer('hideUiWhileRunning', v)}
          />
        </Row>

        <Row label="hold to arm" description="How long space is held before the timer will start.">
          <Slider
            value={timer.holdMs} min={0} max={1000} step={50}
            format={(value) => `${value}ms`}
            onChange={(value) => setTimer('holdMs', value)}
          />
        </Row>

        <Row label="scramble length">
          <Slider
            value={timer.scrambleLength} min={1} max={50} step={1}
            format={(value) => `${value} moves`}
            onChange={(value) => setTimer('scrambleLength', value)}
          />
        </Row>

        <Row label="decimals">
          <Choice
            options={[{ id: '2', name: '12.34' }, { id: '3', name: '12.345' }]}
            value={timer.decimals === 3 ? '3' : '2'}
            onChange={(id) => setTimer('decimals', id === '3' ? 3 : 2)}
          />
        </Row>
      </section>

      <section className="settings-group">
        <h2 className="panel-title">data</h2>
        <DataSection />
      </section>
    </div>
  )
}
