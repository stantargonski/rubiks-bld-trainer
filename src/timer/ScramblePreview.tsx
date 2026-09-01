import { useMemo, useRef } from 'react'
import { solvedCube, stateAfter } from '../cube/nxn'
import { NetView } from '../cube/CubeView'
import type { WcaEvent } from './events'
import type { Scramble } from './scramble'
import { PREVIEW_MAX, PREVIEW_MIN } from './settings'

interface ScramblePreviewProps {
  event: WcaEvent
  scramble: Scramble
  width: number
  height: number
  onResize: (width: number, height: number) => void
}

/**
 * The scramble drawn as a cube, pinned to the bottom-right of the timer.
 *
 * Two things matter here beyond drawing it. First, the state shown is the
 * scramble *without* its trailing reorientation: a blindfolded scramble ends
 * with a random rotation, and applying that to the picture means showing you a
 * cube with yellow on top while you are holding white on top — which reads as
 * the preview being wrong rather than as you holding it differently. The
 * rotation is stated as an instruction on the scramble bar instead.
 *
 * Second, it resizes from its top-left corner. CSS `resize: both` only grows
 * down and to the right, which is the wrong direction entirely for something
 * anchored to the bottom-right of the window — it would grow off the screen.
 */
export default function ScramblePreview({
  event, scramble, width, height, onResize,
}: ScramblePreviewProps) {
  const size = event.size ?? 3

  // The generators only emit tokens the engine knows, but an imported or
  // hand-typed scramble might not — and a preview is never worth blanking the
  // timer over. Fall back to a solved cube and let the text stand as the
  // source of truth.
  const state = useMemo(() => {
    if (event.preview !== 'nxn') return null
    try {
      return stateAfter(size, scramble.moves)
    } catch {
      return solvedCube(size)
    }
  }, [event.preview, size, scramble])

  const drag = useRef<{ x: number; y: number; width: number; height: number } | null>(null)

  function onPointerDown(down: React.PointerEvent<HTMLButtonElement>) {
    down.preventDefault()
    down.currentTarget.setPointerCapture(down.pointerId)
    drag.current = { x: down.clientX, y: down.clientY, width, height }
  }

  function onPointerMove(move: React.PointerEvent<HTMLButtonElement>) {
    const from = drag.current
    if (!from) return

    // Dragging up and left makes it bigger, because the opposite corner is the
    // one that's pinned.
    const clamp = (value: number) => Math.min(PREVIEW_MAX, Math.max(PREVIEW_MIN, Math.round(value)))
    onResize(
      clamp(from.width - (move.clientX - from.x)),
      clamp(from.height - (move.clientY - from.y)),
    )
  }

  function onPointerUp(up: React.PointerEvent<HTMLButtonElement>) {
    drag.current = null
    up.currentTarget.releasePointerCapture(up.pointerId)
  }

  return (
    <div className="scramble-preview" style={{ width, height }}>
      <button
        type="button"
        className="preview-grip"
        title="drag to resize"
        aria-label="resize the scramble preview"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      <span className="preview-title">{event.short} scramble</span>

      <div className="preview-body">
        {state
          ? <NetView state={state} size={size} label={`${event.name} scramble`} />
          : <p className="preview-none">No preview for {event.name} yet — the scramble above is the whole of it.</p>}
      </div>
    </div>
  )
}
