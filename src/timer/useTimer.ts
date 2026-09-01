import { useEffect, useRef, useState } from 'react'

/**
 *  idle → holding → ready ─┬─→ running → idle          (3x3)
 *                          └─→ memo → running → idle   (3BLD)
 *
 * The BLD split is a phase rather than a `hasSplit` boolean beside `running`:
 * a boolean would make four combinations, two of which are nonsense, and every
 * branch would have to rule them out.
 */
export type Phase = 'idle' | 'holding' | 'ready' | 'memo' | 'running'

const MODIFIERS = ['Shift', 'Control', 'Meta', 'CapsLock']

export function useTimer(
    onStop: (ms: number, memoMs: number | null) => void,
    holdMs = 400,
    split = false,
) {
    const [phase , setPhase] = useState<Phase>('idle')
    const [ms, setMs] = useState(0)
    const [memoMs, setMemoMs] = useState<number | null>(null)

    // Timestamps are refs, durations are state: nothing renders an absolute
    // performance.now() reading, so changing one shouldn't cost a render.
    const startedAt = useRef(0)
    const memoAt = useRef(0)        // absolute split time; 0 means not split yet
    const stop = useRef(onStop)

    useEffect(() => {
        stop.current = onStop
    })

    useEffect(() => {
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
                stop.current(elapsed, memoAt.current > 0 ? memoAt.current - startedAt.current : null)
                return
            }

            // Starting is still space only, so stray typing can't arm the timer.
            if (event.code !== 'Space') return
            if (active instanceof HTMLButtonElement) active.blur()
            event.preventDefault()

            if (phase === 'idle') {
                setMs(0)
                setPhase('holding')
            }
        }
        function onKeyUp(event: KeyboardEvent) {
            if (event.code !== 'Space') return
            event.preventDefault()

            if (phase === 'ready') {
                startedAt.current = performance.now()
                memoAt.current = 0
                setMemoMs(null)
                setPhase(split ? 'memo' : 'running')
            } else if (phase === 'holding') {
                setPhase('idle')
            }
        }
        document.addEventListener('keydown', onKeyDown)
        document.addEventListener('keyup', onKeyUp)
        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.removeEventListener('keyup', onKeyUp)
        }
    }, [phase, split])

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

    return { phase, ms, memoMs }
}
