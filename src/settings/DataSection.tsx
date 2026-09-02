import { useRef, useState } from 'react'
import { downloadText, exportAll, importAll, stamp, type ImportReport } from '../data/backup'
import { describeBytes, MAX_FILE_BYTES, tooBig } from '../data/limits'

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
        <button type="button" onClick={() => void save()}>export everything</button>
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
          import backup
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
        One file holds pairs, solves, algs and settings. Nothing leaves your browser.
      </p>
    </div>
  )
}
