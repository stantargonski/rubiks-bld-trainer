import { useEffect, useRef, useState } from 'react'
import { expandHex, hexToHsv, hsvToHex, parseColor, type Hsv } from '../theme/color'

/**
 * One colour of the palette: a swatch, and the picker behind it.
 *
 * The editor used to show a swatch and a hex field side by side for every
 * colour, which at eighteen colours was a form long enough that finding the one
 * you meant to change was the hard part. The picker only exists while it is
 * open, so the grid is back to being a list of colours.
 *
 * Both ways in are kept, because they answer different questions. The wheel is
 * for "a bit warmer than that", which no amount of typing gets you to. The
 * field is for a palette that arrived from somewhere else as six codes — and it
 * takes them however they were written, hash or no hash, hex or rgb.
 */

interface ColorFieldProps {
  value: string
  /** What this colour is called, for the swatch's own label. */
  label: string
  open: boolean
  /** The editor holds this, so opening one picker shuts the last. */
  onOpen: (open: boolean) => void
  onChange: (next: string) => void
}

/** Two hex codes are the same colour whatever case and length they were typed in. */
function same(a: string, b: string): boolean {
  return expandHex(a).toLowerCase() === expandHex(b).toLowerCase()
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export default function ColorField({ value, label, open, onOpen, onChange }: ColorFieldProps) {
  const wrap = useRef<HTMLSpanElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  // Hue, saturation and value are the picker's own state rather than something
  // read back out of the colour each render, and they have to be: black and
  // white have no hue to read, so dragging into either corner would swing the
  // wheel round to red and take the colour with it on the way out.
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value) ?? { h: 0, s: 0, v: 0 })
  const [text, setText] = useState(value)
  /** The last colour this control sent out, so it can tell its own echo from a
      change that came from somewhere else — pressing "start from Paper" moves
      eighteen colours at once and every picker has to follow. */
  const [mine, setMine] = useState(value)

  // Adjusted during the render that brings the new colour in rather than in an
  // effect afterwards, which would paint the stale one first and correct it a
  // frame later.
  if (!same(value, mine)) {
    setMine(value)
    setText(value)
    const next = hexToHsv(value)
    if (next) setHsv(next)
  }

  /** Sends a colour out, and remembers that this control is where it came from. */
  function emit(hex: string) {
    setMine(hex)
    onChange(hex)
  }

  function apply(next: Hsv) {
    setHsv(next)
    const hex = hsvToHex(next)
    setText(hex)
    emit(hex)
  }

  useEffect(() => {
    if (!open) return

    function onDown(event: MouseEvent) {
      if (!wrap.current?.contains(event.target as Node)) onOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      onOpen(false)
      // Back to the swatch rather than to the top of the page: escape is for
      // changing your mind, and where you were is beside the colour you left.
      trigger.current?.focus()
    }

    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onOpen])

  /** Where in a box a pointer landed, as a fraction of it either way. */
  function at(event: React.PointerEvent<HTMLElement>): { x: number; y: number } {
    const box = event.currentTarget.getBoundingClientRect()
    return {
      x: clamp01((event.clientX - box.left) / box.width),
      y: clamp01((event.clientY - box.top) / box.height),
    }
  }

  function dragArea(event: React.PointerEvent<HTMLDivElement>) {
    const { x, y } = at(event)
    apply({ ...hsv, s: x, v: 1 - y })
  }

  function dragHue(event: React.PointerEvent<HTMLDivElement>) {
    apply({ ...hsv, h: at(event).x * 360 })
  }

  /** Arrow keys, so neither control is pointer-only. Shift takes bigger steps. */
  function nudge(event: React.KeyboardEvent, step: (by: number, vertical: boolean) => void) {
    const by = event.shiftKey ? 10 : 1
    if (event.key === 'ArrowLeft') step(-by, false)
    else if (event.key === 'ArrowRight') step(by, false)
    else if (event.key === 'ArrowUp') step(by, true)
    else if (event.key === 'ArrowDown') step(-by, true)
    else return
    event.preventDefault()
  }

  const swatch = expandHex(value)

  return (
    <span className="swatch-wrap" ref={wrap}>
      <button
        ref={trigger}
        type="button"
        className="swatch-open"
        style={{ background: swatch }}
        aria-expanded={open}
        aria-label={`${label}, ${value}`}
        onClick={() => onOpen(!open)}
      />

      {open && (
        <div className="color-pop">
          {/* Saturation across, brightness up: the hue is a backdrop and the two
              gradients over it are what make the corners black and white. */}
          <div
            className="color-area"
            // The colour only, never the shorthand: an inline `background`
            // would beat the stylesheet's two gradients and wipe them out, and
            // those gradients are what make the corners black and white.
            style={{ backgroundColor: hsvToHex({ h: hsv.h, s: 1, v: 1 }) }}
            role="application"
            aria-label={`${label} saturation and brightness`}
            tabIndex={0}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              dragArea(event)
            }}
            onPointerMove={(event) => {
              // Only while held. Pointer capture keeps the events coming here
              // even once the pointer has left the square, which is what lets a
              // drag run off the edge and pin to it rather than stopping dead.
              if (event.buttons === 1) dragArea(event)
            }}
            onKeyDown={(event) => nudge(event, (by, vertical) => apply({
              ...hsv,
              s: vertical ? hsv.s : clamp01(hsv.s + by / 100),
              v: vertical ? clamp01(hsv.v + by / 100) : hsv.v,
            }))}
          >
            <span
              className="color-dot"
              style={{ left: `${hsv.s * 100}%`, bottom: `${hsv.v * 100}%` }}
            />
          </div>

          <div
            className="color-hue"
            role="slider"
            aria-label={`${label} hue`}
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(hsv.h)}
            tabIndex={0}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              dragHue(event)
            }}
            onPointerMove={(event) => {
              if (event.buttons === 1) dragHue(event)
            }}
            onKeyDown={(event) => nudge(event, (by) => apply({ ...hsv, h: hsv.h + by }))}
          >
            <span className="color-dot" style={{ left: `${(hsv.h / 360) * 100}%` }} />
          </div>

          {/* Local text, not the palette's: a controlled field would erase every
              half-typed colour, because `#e0` is not a colour, so nothing would
              be stored and the box would snap back before the third character
              landed. What is typed is only sent on once it reads as a colour. */}
          <input
            className="color-text"
            type="text"
            spellCheck={false}
            autoFocus
            aria-label={`${label} as hex or rgb`}
            placeholder="#f0e4da"
            value={text}
            onChange={(change) => {
              const typed = change.target.value
              setText(typed)

              const hex = parseColor(typed)
              if (!hex) return
              // Stored as hex however it was typed: these go straight into the
              // stylesheet's colour-mix calls, and are read back with a hex-only
              // parser that would drop an rgb string on the next reload.
              const next = hexToHsv(hex)
              if (next) setHsv(next)
              emit(hex)
            }}
          />
        </div>
      )}
    </span>
  )
}
