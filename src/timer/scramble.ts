const FACES = ['U', 'D', 'L', 'R', 'F', 'B'] as const 
const SUFFIXES = ['', "'", '2'] as const

type Face = (typeof FACES)[number]

const AXIS: Record<Face, number> = {U:0,D:0,L:1,R:1,F:2,B:2}

/**
 * Position within an axis pair. A same-axis move may only follow a *lower* one,
 * so "U D" gets generated and "D U" never does — the same constraint min2phase's
 * move table enforces when cstimer solves a random state into a scramble.
 *
 * This also caps any axis run at two moves, which is why there is no longer a
 * prev2 / "U D U" rule: that pattern is now unreachable.
 */
const AXIS_ORDER: Record<Face, number> = {U:0,D:1,R:0,L:1,F:0,B:1}


// TODO gotta be able to do other scramble types
export const SCRAMBLE_LENGTH = 20

function pick<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)]
}

/**
 * WCA 3BLD scrambles end with a random cube rotation, so you can't assume
 * white on top and have to work out your orientation as part of the solve.
 * Six choices about x/z times four about y is all 24 orientations, once each.
 */
const ORIENT_X = ['', 'x', 'x2', "x'", 'z', "z'"] as const
const ORIENT_Y = ['', 'y', 'y2', "y'"] as const

export function randomOrientation(): string[] {
    return [pick(ORIENT_X), pick(ORIENT_Y)].filter((move) => move !== '')
}

export function randomScramble(length = SCRAMBLE_LENGTH, orient = false): string[] {
    const moves: string[] = []
    let prev: Face | null = null

    for (let i = 0; i < length; i+=1) {
        const legal = FACES.filter((face) => {
            if (face === prev) return false
            if (prev && AXIS[face] === AXIS[prev] && AXIS_ORDER[face] <= AXIS_ORDER[prev]) return false
            return true
        })
    const face = pick(legal)
    moves.push(face + pick(SUFFIXES))

    prev = face
    }
    return orient ? [...moves, ...randomOrientation()] : moves
}
