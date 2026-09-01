import { faceOf, type CubeState, type Face } from './moves'
import { FACE_COLOR } from './colors'

/** Top-left cell of each face in the unfolded 12 × 9 net:
 *        U
 *    L   F   R   B
 *        D
 *  Cell `i` of a face is `faceOf(state, face)[i]` — both this table and the
 *  engine read a face row-major as seen looking straight at it, which is what
 *  makes the mapping a plain index. check-algs.ts asserts that convention.
 */
const FACE_ORIGIN: Record<Face, [number, number]> = {
  U: [3, 0],
  L: [0, 3],
  F: [3, 3],
  R: [6, 3],
  B: [9, 3],
  D: [3, 6],
}

const FACES = Object.keys(FACE_ORIGIN) as Face[]

function Sticker({ color, col, row }: { color: Face; col: number; row: number }) {
  return (
    <rect
      x={col + 0.06}
      y={row + 0.06}
      width={0.88}
      height={0.88}
      rx={0.12}
      fill={FACE_COLOR[color]}
    />
  )
}

/** The whole cube unfolded — every sticker, for reading a scramble off. */
export function CubeNetView({ state, label }: { state: CubeState; label?: string }) {
  return (
    <svg
      className="net-grid"
      viewBox="0 0 12 9"
      role="img"
      aria-label={label ?? 'scrambled cube'}
    >
      {FACES.map((face) => {
        const [originCol, originRow] = FACE_ORIGIN[face]
        return faceOf(state, face).map((color, cell) => (
          <Sticker
            key={`${face}${cell}`}
            color={color}
            col={originCol + (cell % 3)}
            row={originRow + Math.floor(cell / 3)}
          />
        ))
      })}
    </svg>
  )
}

/**
 * The last-layer diagram: the U face seen from above with a strip of each side
 * around it, which is all you actually look at to recognise a PLL or OLL.
 *
 * Drawn with B at the top and F at the bottom, so the side strips have to be
 * read in the direction you'd see them from up here rather than in face order —
 * looking at B, its top row runs right-to-left across this view, and the same
 * goes for R down the side.
 */
export function CubeTopView({ state, label }: { state: CubeState; label?: string }) {
  const up = faceOf(state, 'U')
  const front = faceOf(state, 'F')
  const back = faceOf(state, 'B')
  const left = faceOf(state, 'L')
  const right = faceOf(state, 'R')

  return (
    <svg
      className="case-grid"
      viewBox="0 0 5 5"
      role="img"
      aria-label={label ?? 'last layer'}
    >
      {up.map((color, cell) => (
        <Sticker key={`u${cell}`} color={color} col={1 + (cell % 3)} row={1 + Math.floor(cell / 3)} />
      ))}

      {[0, 1, 2].map((i) => (
        <Sticker key={`b${i}`} color={back[2 - i]} col={1 + i} row={0} />
      ))}
      {[0, 1, 2].map((i) => (
        <Sticker key={`f${i}`} color={front[i]} col={1 + i} row={4} />
      ))}
      {[0, 1, 2].map((i) => (
        <Sticker key={`l${i}`} color={left[i]} col={0} row={1 + i} />
      ))}
      {[0, 1, 2].map((i) => (
        <Sticker key={`r${i}`} color={right[2 - i]} col={4} row={1 + i} />
      ))}
    </svg>
  )
}
