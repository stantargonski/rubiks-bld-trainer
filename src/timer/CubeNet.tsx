/** Top-left cell of each face in the unfolded 12 × 9 net:
 *        U
 *    L   F   R   B
 *        D
 *  The move engine will reuse this exact table to place real colours. */

const FACE_ORIGIN: Record<string, [number, number]> = {
  U: [3, 0],
  L: [0, 3],
  F: [3, 3],
  R: [6, 3],
  B: [9, 3],
  D: [3, 6],  
}

export default function CubeNet() {
    return (
        <div className="cube-net">
            <span className="net-title">scramble</span>
            <svg className="net-grid" viewBox="0 0 12 9" role="img" aria-label="cube preview placeholder">
                {Object.entries(FACE_ORIGIN).map(([face, [originCol, originRow]]) => Array.from({length:9}, (_, cell) => (
                    <rect
                    key={`${face}${cell}`}
                    x={originCol + (cell % 3) + 0.06}
                    y={originRow + Math.floor(cell / 3) + 0.06}
                    width={0.88}
                    height={0.88}
                    rx={0.12}
                    />
                )),
            )}
            </svg>
        </div>
    )
}