import { useRef, type ReactNode } from 'react'
import DataSection from './DataSection'
import TimerPreview from './TimerPreview'
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

  // Every stepper on this page reads and writes a plain whole number; the
  // fraction-valued settings are converted at their own call sites.
  const plain = (value: number) => `${value}`

  return (
    <div className="settings-page">
      <section className="settings-group">
        <h2 className="panel-title">timer</h2>

        <TimerPreview settings={timer} />

        <Row label="scramble banner">
          <Toggle value={timer.showScramble} onChange={(v) => setTimer('showScramble', v)} />
        </Row>
        <Row label="solve list">
          <Toggle value={timer.showSolveList} onChange={(v) => setTimer('showSolveList', v)} />
        </Row>
        <Row label="session stats">
          <Toggle value={timer.showStats} onChange={(v) => setTimer('showStats', v)} />
        </Row>
        <Row label="ao5 / ao12 under the clock" description="Hidden while a solve is running either way.">
          <Toggle value={timer.showAverages} onChange={(v) => setTimer('showAverages', v)} />
        </Row>
        <Row label="scramble preview" description="The scramble drawn as a cube. Drag its title bar to move it, its top-left corner to resize.">
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

        <Row
          label="timer while solving"
          description="What the clock shows mid-solve. The solve is always recorded in full."
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
          description="15 seconds before the solve, +2 over 15 and DNF over 17. Blindfolded events and FMC never inspect."
        >
          <Toggle value={timer.inspection} onChange={(v) => setTimer('inspection', v)} />
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

        <Row label="hold to arm" description="Milliseconds space is held before the timer will start.">
          <Stepper
            value={timer.holdMs} min={0} max={1000} step={50}
            format={plain}
            onChange={(value) => setTimer('holdMs', value)}
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

        <Row label="text size" description="Percent of the standard size.">
          <Stepper
            value={Math.round(appearance.fontScale * 100)} min={85} max={140} step={5}
            format={plain}
            onChange={(value) => setAppearance('fontScale', value / 100)}
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

        <Row label="background blur" description="Pixels.">
          <Stepper
            value={appearance.bgBlur} min={0} max={24} step={2}
            format={plain}
            onChange={(value) => setAppearance('bgBlur', value)}
          />
        </Row>

        <Row label="background dim" description="How far the picture fades back so text stays readable, as a percent.">
          <Stepper
            value={Math.round(appearance.bgDim * 100)} min={0} max={90} step={5}
            format={plain}
            onChange={(value) => setAppearance('bgDim', value / 100)}
          />
        </Row>

        <Row label="panel opacity" description="How much of the picture shows through the panels, as a percent.">
          <Stepper
            value={Math.round(appearance.panelOpacity * 100)} min={25} max={100} step={5}
            format={plain}
            onChange={(value) => setAppearance('panelOpacity', value / 100)}
          />
        </Row>

        <Row label="panel blur" description="Frosts whatever is behind a see-through panel. Pixels.">
          <Stepper
            value={appearance.panelBlur} min={0} max={24} step={2}
            format={plain}
            onChange={(value) => setAppearance('panelBlur', value)}
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
