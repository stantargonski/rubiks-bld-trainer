import { useId } from 'react'
import { faceOf, type Arrow, type CubeState, type Face } from './moves'
import { faceOf as faceOfNxN, type CubeState as NxNState } from './nxn'
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

function Sticker({ color, col, row, palette = FACE_COLOR }: {
  color: Face
  col: number
  row: number
  palette?: Record<Face, string>
}) {
  return (
    <rect
      x={col + 0.06}
      y={row + 0.06}
      width={0.88}
      height={0.88}
      rx={0.12}
      fill={palette[color]}
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
 *
 * `palette` recolours the faces — CFOP passes the yellow-top view. `arrows` are
 * drawn over the top: which piece goes where, which is the half of a case the
 * colours can't tell you, because four yellow stickers are the same yellow.
 */
export function CubeTopView({ state, arrows = [], palette = FACE_COLOR, label }: {
  state: CubeState
  arrows?: Arrow[]
  palette?: Record<Face, string>
  label?: string
}) {
  // Marker ids are document-global, so two diagrams sharing one would have the
  // second silently steal the first's arrowheads.
  const head = `arrow-${useId()}`

  const up = faceOf(state, 'U')
  const front = faceOf(state, 'F')
  const back = faceOf(state, 'B')
  const left = faceOf(state, 'L')
  const right = faceOf(state, 'R')

  /** The centre of U cell 0-8, in the 5x5 grid this is drawn on. */
  function centre(cell: number): [number, number] {
    return [1.5 + (cell % 3), 1.5 + Math.floor(cell / 3)]
  }

  return (
    <svg
      className="case-grid"
      viewBox="0 0 5 5"
      role="img"
      aria-label={label ?? 'last layer'}
    >
      <defs>
        <marker
          id={head}
          viewBox="0 0 4 4"
          markerUnits="userSpaceOnUse"
          markerWidth={0.56}
          markerHeight={0.56}
          refX={3.2}
          refY={2}
          orient="auto"
        >
          <path d="M 0 0.5 L 3.4 2 L 0 3.5 z" className="arrow-head" />
        </marker>
      </defs>

      {up.map((color, cell) => (
        <Sticker key={`u${cell}`} color={color} palette={palette} col={1 + (cell % 3)} row={1 + Math.floor(cell / 3)} />
      ))}

      {[0, 1, 2].map((i) => (
        <Sticker key={`b${i}`} color={back[2 - i]} palette={palette} col={1 + i} row={0} />
      ))}
      {[0, 1, 2].map((i) => (
        <Sticker key={`f${i}`} color={front[i]} palette={palette} col={1 + i} row={4} />
      ))}
      {[0, 1, 2].map((i) => (
        <Sticker key={`l${i}`} color={left[i]} palette={palette} col={0} row={1 + i} />
      ))}
      {[0, 1, 2].map((i) => (
        <Sticker key={`r${i}`} color={right[2 - i]} palette={palette} col={4} row={1 + i} />
      ))}

      {arrows.map((arrow) => {
        const [x1, y1] = centre(arrow.from)
        const [x2, y2] = centre(arrow.to)
        return (
          <line
            key={`${arrow.from}-${arrow.to}`}
            className={`case-arrow ${arrow.kind}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            markerEnd={`url(#${head})`}
          />
        )
      })}
    </svg>
  )
}

/**
 * The same net at any cube size.
 *
 * The face origins are the 3x3 table scaled by `size`, because the layout is
 * the same shape whatever n is: U above F, D below it, and L F R B as a strip.
 * A 7x7 is a bigger grid of the same picture, not a different picture.
 */
export function NetView({ state, size, label }: {
  state: NxNState
  size: number
  label?: string
}) {
  const faces = Object.keys(FACE_ORIGIN) as Face[]

  return (
    <svg
      className="net-grid"
      viewBox={`0 0 ${size * 4} ${size * 3}`}
      role="img"
      aria-label={label ?? 'scrambled cube'}
    >
      {faces.map((face) => {
        const [originCol, originRow] = FACE_ORIGIN[face]
        // The 3x3 table counts in faces, not stickers, so it scales cleanly.
        const col0 = (originCol / 3) * size
        const row0 = (originRow / 3) * size

        return faceOfNxN(state, size, face).map((color, cell) => (
          <Sticker
            key={`${face}${cell}`}
            color={color}
            col={col0 + (cell % size)}
            row={row0 + Math.floor(cell / size)}
          />
        ))
      })}
    </svg>
  )
}
