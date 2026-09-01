import { useEffect, useRef, useState } from 'react'
import type { Session } from './types'

interface SessionPickerProps {
  sessions: Session[]
  activeId: string
  onSelect: (id: string) => void
  onCreate: () => void
  onRename: (name: string) => void
  onDelete: () => void
  onExport: () => void
}

export default function SessionPicker({
  sessions, activeId, onSelect, onCreate, onRename, onDelete, onExport,
}: SessionPickerProps) {
  const [draft, setDraft] = useState<string | null>(null)   // null = not renaming
  const input = useRef<HTMLInputElement>(null)

  const renaming = draft !== null
  useEffect(() => {
    // select() focuses and highlights, so typing replaces the old name.
    if (renaming) input.current?.select()
  }, [renaming])

  function commit(value: string) {
    const name = value.trim()
    if (name !== '') onRename(name)
    setDraft(null)
  }

  // Checked directly rather than via `renaming`, because TypeScript narrows the
  // value it tests — inside this branch `draft` is a string, not string | null.
  if (draft !== null) {
    return (
      <input
        ref={input}
        className="session-name"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit(draft)
          if (event.key === 'Escape') setDraft(null)
        }}
      />
    )
  }

  const active = sessions.find((session) => session.id === activeId)

  return (
    <>
      <select
        className="session-select"
        value={activeId}
        onChange={(event) => onSelect(event.target.value)}
      >
        {sessions.map((session) => (
          <option key={session.id} value={session.id}>
            {session.name} ({session.solves.length})
          </option>
        ))}
      </select>
      <button type="button" className="rail-icon" title="rename"
        onClick={() => setDraft(active?.name ?? '')}>✎</button>
      <button type="button" className="rail-icon" title="new session"
        onClick={onCreate}>+</button>
      <button type="button" className="rail-icon" title="export session as CSV"
        onClick={onExport}>⤓</button>
      <button type="button" className="rail-icon" title="delete session"
        onClick={onDelete}>×</button>
    </>
  )
}