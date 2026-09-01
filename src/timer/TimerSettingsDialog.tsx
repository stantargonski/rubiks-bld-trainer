import { useEffect, useRef } from 'react'
import type { TimerSettings } from './settings'

interface TimerSettingsDialogProps {
  settings: TimerSettings
  open: boolean
  onChange: (settings: TimerSettings) => void
  onClose: () => void
}

function Toggle({ label, checked, onChange }: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

export default function TimerSettingsDialog({
  settings, open, onChange, onClose,
}: TimerSettingsDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null)

  // showModal() is the only way to get the backdrop, Escape and the focus trap
  // — the `open` attribute alone gives a non-modal dialog. So React state is
  // mirrored onto the node rather than rendered as a prop.
  useEffect(() => {
    const node = dialog.current
    if (!node) return
    if (open && !node.open) node.showModal()
    if (!open && node.open) node.close()
  }, [open])

  function set<K extends keyof TimerSettings>(key: K, value: TimerSettings[K]) {
    onChange({ ...settings, [key]: value })
  }

  return (
    // onClose catches Escape and the backdrop, which close the dialog without
    // going through React. Without it `open` would stay true and the gear
    // would appear dead on the next click.
    <dialog ref={dialog} className="settings-dialog" onClose={onClose}>
      {/* method="dialog" makes the submit button close it natively. */}
      <form method="dialog" className="settings-body">
        <h2>Timer settings</h2>

        <fieldset>
          <legend>display</legend>
          <Toggle label="scramble banner" checked={settings.showScramble}
            onChange={(value) => set('showScramble', value)} />
          <Toggle label="solve list" checked={settings.showSolveList}
            onChange={(value) => set('showSolveList', value)} />
          <Toggle label="session stats" checked={settings.showStats}
            onChange={(value) => set('showStats', value)} />
          <Toggle label="ao5 / ao12 under the clock" checked={settings.showAverages}
            onChange={(value) => set('showAverages', value)} />
          <Toggle label="cube preview" checked={settings.showCubeNet}
            onChange={(value) => set('showCubeNet', value)} />
          <Toggle label="hide everything while solving" checked={settings.hideUiWhileRunning}
            onChange={(value) => set('hideUiWhileRunning', value)} />
        </fieldset>

        <fieldset>
          <legend>timing</legend>
          <label className="setting-row">
            <span>hold to arm</span>
            <input type="range" min={0} max={1000} step={50} value={settings.holdMs}
              onChange={(event) => set('holdMs', Number(event.target.value))} />
            <b>{settings.holdMs}ms</b>
          </label>
          <label className="setting-row">
            <span>scramble length</span>
            <input type="number" min={1} max={50} value={settings.scrambleLength}
              onChange={(event) => set('scrambleLength', Number(event.target.value))} />
          </label>
        </fieldset>

        <fieldset>
          <legend>format</legend>
          <label className="setting-row">
            <span>decimals</span>
            <select value={settings.decimals}
              onChange={(event) => set('decimals', event.target.value === '3' ? 3 : 2)}>
              <option value={2}>2 — 12.34</option>
              <option value={3}>3 — 12.345</option>
            </select>
          </label>
        </fieldset>

        <button type="submit" className="settings-done">done</button>
      </form>
    </dialog>
  )
}