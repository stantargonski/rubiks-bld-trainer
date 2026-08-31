import { useEffect, useState } from 'react'

interface ScrambleBannerProps {
    moves: string[]
    canGoBack: boolean
    onLast: () => void
    onNext: () => void
}

export default function ScrambleBanner({ moves, canGoBack, onLast, onNext }: ScrambleBannerProps) {
    const [copied, setCopied] = useState(false)
    useEffect(() => {
        if (!copied) return
        const id = setTimeout(() => setCopied(false), 1200)
        return () => clearTimeout(id)
  }, [copied])

    async function copy() {
        try {
            await navigator.clipboard.writeText(moves.join(' '))
            setCopied(true)
        } catch {
            setCopied(false)
    }
  }

  return (
    <div className="scramble-bar">
      <button
        type="button"
        className={copied ? 'scramble-text copied' : 'scramble-text'}
        title="click to copy"
        onClick={() => { void copy() }}
      >
        {moves.map((move, index) => (
          <span key={index}>{move}</span>
        ))}
      </button>

      <div className="scramble-nav">
        <button type="button" onClick={onLast} disabled={!canGoBack}>‹ last</button>
        <button type="button" onClick={onNext}>next ›</button>
      </div>
    </div>
  )
}
