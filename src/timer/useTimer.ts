import { useEffect, useRef, useState } from 'react'

export type Phase = 'idle' | 'holding' | 'ready' | 'running'

// TODO make hold_ms configurable have different settings etc

const HOLD_MS = 400

export function useTimer(onStop: (ms: number) => void) { 
    const [phase , setPhase] = useState<Phase>('idle')
    const [ms, setMs] = useState(0)

    const startedAt = useRef(0)
    const stop = useRef(onStop)

    useEffect(() => {
        stop.current = onStop
    })

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.code !== 'Space' || event.repeat) return
            event.preventDefault()

            if (phase === 'running') {
                const elapsed = performance.now() - startedAt.current
                setMs(elapsed)
                setPhase('idle')
                stop.current(elapsed)
            } else if (phase === 'idle') {
                setMs(0)
                setPhase('holding')
            }
        }
        function onKeyUp(event: KeyboardEvent) {
            if (event.code !== 'Space') return
            event.preventDefault()

            if (phase === 'ready') {
                startedAt.current = performance.now()
                setPhase('running')
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
    }, [phase])

    useEffect(() => {
        if (phase !== 'holding') return
        const id = setTimeout(() => setPhase('ready'), HOLD_MS)
        return () => clearTimeout(id)
    }, [phase])

    useEffect (() => {
        if (phase !== 'running') return

        let id = 0
        function tick() {
            setMs(performance.now() - startedAt.current)
            id = requestAnimationFrame(tick)
        }
        id = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(id)
    }, [phase])

    return { phase, ms }
}