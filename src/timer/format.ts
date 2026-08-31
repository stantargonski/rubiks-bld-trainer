export function formatTime(ms: number): string {
    const centis = Math.floor(ms/10)
    const cs = centis % 100
    const seconds = Math.floor(centis / 100) % 60
    const minutes = Math.floor(centis / 6000)

    const pad = minutes > 0 && seconds < 10 ? '0' : ''
    const tail = `${pad}${seconds}.${String(cs).padStart(2, '0')}`
    return minutes > 0 ? `${minutes}:${tail}` : tail 
}