import { useEffect, useRef, useState } from 'react'
import { downloadText, exportAll, importAll, stamp, type ImportReport } from '../data/backup'
import { describeBytes, MAX_FILE_BYTES, tooBig } from '../data/limits'
import { eraseEverything, getSnapshot, restoreSnapshot, type Snapshot } from '../data/snapshot'

/**
 * Backup and restore for everything the app has stored.
 *
 * Lives on its own rather than inside whichever screen currently hosts the
 * settings, because what it does spans all of them.
 */
export default function DataSection() {
  const picker = useRef<HTMLInputElement>(null)
  const [report, setReport] = useState<ImportReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  /** How far through the two-step delete we are: 0 idle, 1 warned, 2 typing. */
  const [step, setStep] = useState(0)
  const [typed, setTyped] = useState('')

  // The copy taken automatically the first time this build ran. Absent on a
  // fresh install, and absent where IndexedDB isn't available — both of which
  // simply mean there is nothing to offer, not that something went wrong.
  useEffect(() => {
    let live = true
    void getSnapshot().then((found) => { if (live) setSnapshot(found) })
    return () => { live = false }
  }, [])

  function cancelWipe() {
    setStep(0)
    setTyped('')
  }

  async function wipe() {
    if (typed.trim().toLowerCase() !== 'delete') return
    await eraseEverything()
    // Reloaded rather than cleared in place: half this app's state is already in
    // React, and a page still holding it would write some of it straight back.
    window.location.reload()
  }

  async function rollBack() {
    if (!snapshot) return
    if (!window.confirm(
      'This replaces everything stored now with the copy taken before this ' +
      'version first ran. Continue?',
    )) return

    if (await restoreSnapshot()) window.location.reload()
    else setError('That copy could not be written back.')
  }

  async function save() {
    setError(null)
    try {
      downloadText(`rubiks-trainer-${stamp()}.json`, await exportAll())
    } catch (problem) {
      setError((problem as Error).message)
    }
  }

  async function load(file: File) {
    setError(null)
    setReport(null)

    // Refused on the size alone, before a byte of it is read: a file this big
    // is not a backup, and reading it to find that out is the expensive way to
    // learn it.
    if (tooBig(file.size)) {
      setError(`That file is ${describeBytes(file.size)}, past the ${describeBytes(MAX_FILE_BYTES)} limit for a backup.`)
      return
    }

    try {
      setReport(await importAll(await file.text()))
    } catch (problem) {
      setError((problem as Error).message)
    }
  }

  return (
    <div className="data-section">
      <div className="actions">
        <button type="button" onClick={() => void save()}>export data</button>
        <button
          type="button"
          onClick={() => {
            // Asked before the file dialog, not after: the point of no return is
            // choosing a file, and a confirm that appears once it's already open
            // is a confirm nobody reads.
            if (window.confirm('Importing replaces what is stored now. Continue?')) {
              picker.current?.click()
            }
          }}
        >
          import data
        </button>
      </div>

      <input
        ref={picker}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          // Cleared so choosing the same file twice still fires a change event.
          event.target.value = ''
          if (file) void load(file)
        }}
      />

      {error && <p className="data-error">{error}</p>}

      {report && (
        <div className="data-report">
          <ul>
            {report.results.map((result) => (
              <li key={result.key} className={`data-${result.outcome}`}>
                {result.label} — {result.outcome}
              </li>
            ))}
          </ul>
          {report.restored > 0 && (
            <button type="button" onClick={() => window.location.reload()}>
              reload to use them
            </button>
          )}
        </div>
      )}

      <p className="hint">
        One file holds pairs, solves, algs and settings.
      </p>

      {snapshot && (
        <div className="data-snapshot">
          <h3>If settings are bugged on update</h3>
          <p className="hint">
            A copy of everything was taken automatically on{' '}
            {new Date(snapshot.takenAt).toLocaleString()}.
          </p>
          <div className="actions">
            <button type="button" onClick={() => void rollBack()}>
              restore previous version settings
            </button>
          </div>
        </div>
      )}

      {/* Two steps, and the second one asks you to type the word. A single
          confirm is a reflex you can get through without reading; typing is the
          cheapest thing that cannot be done by accident, and this is the one
          control here with nothing behind it. */}
      <div className="data-danger">
        <h3>delete everything</h3>

        {step === 0 && (
          <>
            <p className="hint">
              Erases every solve, session, alg, letter pair and setting stored in
              this browser, along with the automatic copy below. There is no undo.
              Export a backup first if you might want any of it.
            </p>
            <div className="actions">
              <button type="button" className="danger" onClick={() => setStep(1)}>
                delete everything
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="data-danger-warn">
              This cannot be undone, and it removes the restore copy too.
            </p>
            <div className="actions">
              <button type="button" className="danger" onClick={() => setStep(2)}>
                I understand, continue
              </button>
              <button type="button" onClick={cancelWipe}>cancel</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="data-danger-warn">
              Type <b>delete</b> to confirm.
            </p>
            <input
              className="data-danger-field"
              type="text"
              value={typed}
              autoFocus
              spellCheck={false}
              aria-label="type delete to confirm"
              onChange={(change) => setTyped(change.target.value)}
              onKeyDown={(press) => { if (press.key === 'Enter') void wipe() }}
            />
            <div className="actions">
              <button
                type="button"
                className="danger"
                disabled={typed.trim().toLowerCase() !== 'delete'}
                onClick={() => void wipe()}
              >
                erase everything
              </button>
              <button type="button" onClick={cancelWipe}>cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
