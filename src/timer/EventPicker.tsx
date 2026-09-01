import { EVENTS, type EventId } from './events'

interface EventPickerProps {
  value: EventId
  onChange: (id: EventId) => void
}

/**
 * Which puzzle you're timing, sitting directly above the scramble it produces.
 *
 * This lives here rather than in settings because it isn't a preference — it's
 * the single most-changed control on the page, and it belongs next to the thing
 * it changes.
 */
export default function EventPicker({ value, onChange }: EventPickerProps) {
  return (
    <label className="event-picker">
      <span className="visually-hidden">event</span>
      <select value={value} onChange={(event) => onChange(event.target.value as EventId)}>
        {EVENTS.map((event) => (
          <option key={event.id} value={event.id}>{event.name}</option>
        ))}
      </select>
    </label>
  )
}
