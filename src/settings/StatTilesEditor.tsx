import { TILES, tileSpec } from '../timer/charts/tiles'

interface StatTilesEditorProps {
  /** Every box, in the order they are drawn. */
  order: string[]
  /** Which of them are switched off. */
  hidden: string[]
  onChange: (order: string[], hidden: string[]) => void
}

/**
 * Rearranges the stats page's boxes.
 *
 * Buttons rather than drag-and-drop. A list of eleven items that mostly moves
 * one place at a time does not need a drag surface, and a drag surface needs a
 * keyboard equivalent anyway — so this is the keyboard equivalent, and there is
 * nothing left for the drag to add.
 */
export default function StatTilesEditor({ order, hidden, onChange }: StatTilesEditorProps) {
  const off = new Set(hidden)

  function move(from: number, by: number) {
    const to = from + by
    if (to < 0 || to >= order.length) return

    const next = [...order]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next, hidden)
  }

  function toggle(id: string) {
    onChange(order, off.has(id) ? hidden.filter((one) => one !== id) : [...hidden, id])
  }

  function reset() {
    onChange(TILES.map((tile) => tile.id), [])
  }

  return (
    <div className="tile-editor">
      <ol className="tile-list">
        {order.map((id, at) => {
          const spec = tileSpec(id)
          if (!spec) return null
          const on = !off.has(id)

          return (
            <li key={id} className={on ? 'tile-item' : 'tile-item off'}>
              <span className="tile-name">
                {spec.name}
                {/* Worth saying, because it will not appear on most events and
                    its absence would otherwise look like this list lying. */}
                {spec.splitOnly && <i>blindfolded only</i>}
              </span>

              <span className="tile-item-tools">
                <button
                  type="button"
                  aria-label={`move ${spec.name} up`}
                  disabled={at === 0}
                  onClick={() => move(at, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`move ${spec.name} down`}
                  disabled={at === order.length - 1}
                  onClick={() => move(at, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="tile-toggle"
                  aria-pressed={on}
                  onClick={() => toggle(id)}
                >
                  {on ? 'shown' : 'hidden'}
                </button>
              </span>
            </li>
          )
        })}
      </ol>

      <div className="actions">
        <button type="button" onClick={reset}>back to the default order</button>
      </div>
    </div>
  )
}
