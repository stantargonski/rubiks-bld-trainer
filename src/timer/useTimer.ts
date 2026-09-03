import { useEffect, useRef, useState } from 'react'
import type { Penalty } from './types'

/**
 *  idle → holding → ready ─┬─→ running → idle                     (3x3, no inspection)
 *                          ├─→ memo → running → idle              (blindfolded)
 *                          └─→ inspecting → holding → ready → …   (inspection on)
 *
 * The BLD split is a phase rather than a `hasSplit` boolean beside `running`:
 * a boolean would make four combinations, two of which are nonsense, and every
 * branch would have to rule them out. Inspection is a phase for the same reason
 * — it has its own clock, its own colour and its own key handling.
 */
export type Phase = 'idle' | 'inspecting' | 'holding' | 'ready' | 'memo' | 'running'

const MODIFIERS = ['Shift', 'Control', 'Meta', 'CapsLock']

/** WCA: over fifteen seconds is +2, over seventeen is a DNF. */
const INSPECT_MS = 15_000
const INSPECT_DNF_MS = 17_000

export interface TimerOptions {
    holdMs?: number
    /** Time memo separately from execution — every blindfolded event. */
    split?: boolean
    /** Run a 15-second inspection before the solve. */
    inspection?: boolean
    /**
     * Whether the space bar runs the clock at all.
     *
     * Off for typed entry, where there is no clock on screen to run: the phase
     * would still advance on a space pressed outside the entry box, hiding the
     * interface for a solve nobody can see is in progress and that no key can
     * end once focus lands back in the box.
     */
    enabled?: boolean
}

export function useTimer(
    onStop: (ms: number, memoMs: number | null, penalty: Penalty) => void,
    { holdMs = 400, split = false, inspection = false, enabled = true }: TimerOptions = {},
) {
    const [phase , setPhase] = useState<Phase>('idle')
    const [ms, setMs] = useState(0)
    const [memoMs, setMemoMs] = useState<number | null>(null)
    /** Counts up from zero while inspecting; only meaningful in that phase. */
    const [inspectMs, setInspectMs] = useState(0)

    // Timestamps are refs, durations are state: nothing renders an absolute
    // performance.now() reading, so changing one shouldn't cost a render.
    const startedAt = useRef(0)
    const memoAt = useRef(0)        // absolute split time; 0 means not split yet
    const inspectAt = useRef(0)
    const stop = useRef(onStop)

    useEffect(() => {
        stop.current = onStop
    })

    const penalty = useRef<Penalty>('none')

    useEffect(() => {
        /** Whatever inspection cost you, decided the moment the solve begins. */
        function inspectionPenalty(): Penalty {
            if (!inspection || inspectAt.current === 0) return 'none'
            const elapsed = performance.now() - inspectAt.current
            if (elapsed >= INSPECT_DNF_MS) return 'dnf'
            return elapsed >= INSPECT_MS ? 'plus2' : 'none'
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.repeat) return

            // Never hijack keys aimed at something you can type into.
            const active = document.activeElement
            if (
                active instanceof HTMLInputElement ||
                active instanceof HTMLTextAreaElement ||
                active instanceof HTMLSelectElement
            ) return

            // Ctrl/Cmd combos stay the browser's — reload, devtools, tab switching.
            if (event.ctrlKey || event.metaKey) return

            if (phase === 'memo') {
                if (MODIFIERS.includes(event.key)) return

                event.preventDefault()
                memoAt.current = performance.now()
                setMemoMs(memoAt.current - startedAt.current)
                setPhase('running')
                return
            }

            if (phase === 'running') {
                // Any key stops it. You've just put the cube down and your hands
                // aren't where they started; hunting for the space bar costs time.
                if (MODIFIERS.includes(event.key)) return

                event.preventDefault()
                const elapsed = performance.now() - startedAt.current
                setMs(elapsed)
                setPhase('idle')
                stop.current(
                    elapsed,
                    memoAt.current > 0 ? memoAt.current - startedAt.current : null,
                    penalty.current,
                )
                return
            }

            // Starting is still space only, so stray typing can't arm the timer.
            if (event.code !== 'Space') return
            if (active instanceof HTMLButtonElement) active.blur()
            event.preventDefault()

            // Space from idle either begins inspection or begins the hold. The
            // clock is deliberately NOT reset here: the time you just did stays
            // up until the next solve actually starts, so you can still read it
            // while you pick the cube up.
            if (phase === 'idle') {
                if (inspection) {
                    inspectAt.current = performance.now()
                    setInspectMs(0)
                    setPhase('inspecting')
                } else {
                    setPhase('holding')
                }
            } else if (phase === 'inspecting') {
                setPhase('holding')
            }
        }
        function onKeyUp(event: KeyboardEvent) {
            if (event.code !== 'Space') return
            event.preventDefault()

            if (phase === 'ready') {
                penalty.current = inspectionPenalty()
                inspectAt.current = 0
                startedAt.current = performance.now()
                memoAt.current = 0
                setMemoMs(null)
                setMs(0)
                setPhase(split ? 'memo' : 'running')
            } else if (phase === 'holding') {
                // Letting go early goes back where it came from, so an aborted
                // hold during inspection doesn't restart the fifteen seconds.
                setPhase(inspection && inspectAt.current > 0 ? 'inspecting' : 'idle')
            }
        }
        if (!enabled) return

        document.addEventListener('keydown', onKeyDown)
        document.addEventListener('keyup', onKeyUp)
        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.removeEventListener('keyup', onKeyUp)
        }
    }, [phase, split, inspection, enabled])

    useEffect(() => {
        if (phase !== 'holding') return
        const id = setTimeout(() => setPhase('ready'), holdMs)
        return () => clearTimeout(id)
    }, [phase, holdMs])

    // One clock across both timed phases — memo and exec are a split of a single
    // continuous run, not two separate timings.
    useEffect (() => {
        if (phase !== 'memo' && phase !== 'running') return

        let id = 0
        function tick() {
            setMs(performance.now() - startedAt.current)
            id = requestAnimationFrame(tick)
        }
        id = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(id)
    }, [phase])

    // Inspection runs on its own clock, and keeps running through the hold —
    // holding space to get ready is part of your fifteen seconds, not a pause.
    useEffect(() => {
        if (phase !== 'inspecting' && !(phase === 'holding' && inspectAt.current > 0)) return

        let id = 0
        function tick() {
            setInspectMs(performance.now() - inspectAt.current)
            id = requestAnimationFrame(tick)
        }
        id = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(id)
    }, [phase])

    return { phase, ms, memoMs, inspectMs }
}

export { INSPECT_MS, INSPECT_DNF_MS }
