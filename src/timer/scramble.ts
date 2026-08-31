const FACES = ['U', 'D', 'L', 'R', 'F', 'B'] as const 
const SUFFIXES = ['', "'", '2'] as const

type Face = (typeof FACES)[number]

const AXIS: Record<Face, number> = {U:0,D:0,L:1,R:1,F:2,B:2}


// TODO gotta be able to do other scramble types 
export const SCRAMBLE_LENGTH = 20

function pick<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)]
}

export function randomScramble(length = SCRAMBLE_LENGTH): string[] {
    const moves: string[] = []
    let prev: Face | null = null
    let prev2: Face | null = null

    for (let i = 0; i < length; i+=1) {
        const legal = FACES.filter((face) => {
            if (face === prev) return false
            if (prev && prev2 && AXIS[face] === AXIS[prev] && AXIS[face] === AXIS[prev2]) return false
            return true
        })
    const face = pick(legal)
    moves.push(face + pick(SUFFIXES))
    
    prev2 = prev
    prev = face
    }
    return moves
}
