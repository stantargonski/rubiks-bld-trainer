import { useEffect, useMemo, useRef } from 'react'
import { solvedCube, stateAfter } from '../cube/nxn'
import { NetView } from '../cube/CubeView'
import type { WcaEvent } from './events'
import type { Scramble } from './scramble'
import { PREVIEW_MARGIN, PREVIEW_MAX, PREVIEW_MIN } from './settings'

interface ScramblePreviewProps {
  event: WcaEvent
  scramble: Scramble
  width: number
  height: number
  right: number
  bottom: number
  onResize: (width: number, height: number) => void
  onMove: (right: number, bottom: number) => void
}

/**
 * The scramble drawn as a cube.
 *
 * Every token is applied, the blindfolded events' trailing wide moves included:
 * those are turns rather than a way of holding the cube, so the picture is the
 * position you will actually pick up. A 3BLD preview with mixed colours on top
 * is correct, not broken.
 *
 * Position is a gap from the right and bottom edges rather than a top-left
 * coordinate, so the panel keeps its relationship to the corner it started in
 * when the window changes size. It resizes from its top-left corner for the
 * same reason CSS `resize: both` is no use here: the dragged corner can't be
 * the pinned one, or the panel grows off the screen.
 */
export default function ScramblePreview({
  event, scramble, width, height, right, bottom, onResize, onMove,
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

  const resizing = useRef<{ x: number; y: number; width: number; height: number } | null>(null)
  const moving = useRef<{ x: number; y: number; right: number; bottom: number } | null>(null)

  /** The furthest the panel may be pushed and still be grabbable by its title. */
  function limits() {
    return {
      maxRight: Math.max(0, window.innerWidth - width - PREVIEW_MARGIN),
      maxBottom: Math.max(0, window.innerHeight - height - PREVIEW_MARGIN),
    }
  }

  function place(nextRight: number, nextBottom: number) {
    const { maxRight, maxBottom } = limits()
    onMove(
      Math.round(Math.min(maxRight, Math.max(PREVIEW_MARGIN, nextRight))),
      Math.round(Math.min(maxBottom, Math.max(PREVIEW_MARGIN, nextBottom))),
    )
  }

  // A window that shrinks under the panel would otherwise leave it stranded
  // off-screen with nothing left to grab.
  //
  // The handler is read out of a ref rather than being the dependency of the
  // effect: this component re-renders on every frame of a running solve, and
  // re-subscribing to `resize` sixty times a second to pick up a number that
  // almost never changes is a lot of work to do for nothing.
  const reclamp = useRef(() => {})
  useEffect(() => {
    reclamp.current = () => place(right, bottom)
  })

  useEffect(() => {
    function onWindowResize() {
      reclamp.current()
    }
    window.addEventListener('resize', onWindowResize)
    return () => window.removeEventListener('resize', onWindowResize)
  }, [])

  function startResize(down: React.PointerEvent<HTMLElement>) {
    down.preventDefault()
    down.currentTarget.setPointerCapture(down.pointerId)
    resizing.current = { x: down.clientX, y: down.clientY, width, height }
  }

  function startMove(down: React.PointerEvent<HTMLElement>) {
    down.preventDefault()
    down.currentTarget.setPointerCapture(down.pointerId)
    moving.current = { x: down.clientX, y: down.clientY, right, bottom }
  }

  function onPointerMove(move: React.PointerEvent<HTMLElement>) {
    const size = resizing.current
    if (size) {
      // Dragging up and left makes it bigger, because the opposite corner is
      // the one that's pinned.
      const clamp = (value: number) =>
        Math.min(PREVIEW_MAX, Math.max(PREVIEW_MIN, Math.round(value)))
      onResize(
        clamp(size.width - (move.clientX - size.x)),
        clamp(size.height - (move.clientY - size.y)),
      )
      return
    }

    const from = moving.current
    if (!from) return
    // Right and bottom count inwards, so a drag right or down shrinks them.
    place(from.right - (move.clientX - from.x), from.bottom - (move.clientY - from.y))
  }

  function onPointerUp(up: React.PointerEvent<HTMLElement>) {
    resizing.current = null
    moving.current = null
    up.currentTarget.releasePointerCapture(up.pointerId)
  }

  return (
    <div className="scramble-preview" style={{ width, height, right, bottom }}>
      <button
        type="button"
        className="preview-grip"
        title="drag to resize"
        aria-label="resize the scramble preview"
        onPointerDown={startResize}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      <span
        className="preview-title"
        title="drag to move"
        onPointerDown={startMove}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {event.short} scramble
      </span>

      <div className="preview-body">
        {state
          ? <NetView state={state} size={size} label={`${event.name} scramble`} />
          : <p className="preview-none">No preview for {event.name} yet — the scramble above is the whole of it.</p>}
      </div>
    </div>
  )
}
