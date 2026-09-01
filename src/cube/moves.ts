/**
 * A 54-facelet cube model.
 *
 * Facelets are numbered face by face, each row-major as seen looking straight
 * at that face, in the standard order U R F D L B:
 *
 *              U0 U1 U2
 *              U3 U4 U5
 *              U6 U7 U8
 *   L36..L44   F18..F26   R9..R17   B45..B53
 *              D27 D28 D29
 *              D30 D31 D32
 *              D33 D34 D35
 *
 * A state is just what colour sits on each facelet. Solved means every facelet
 * still shows its own face's colour, so the solved state doubles as the index.
 */
export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';
export type CubeState = Face[];

const FACE_ORDER: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

export function solvedCube(): CubeState {
  return FACE_ORDER.flatMap((face) => Array<Face>(9).fill(face));
}

/**
 * Builds a 54-entry lookup from cycles. A cycle [a, b, c, d] means the sticker
 * at a moves to b, b to c, and so on — so the *destination* reads from the
 * previous position, which is why the assignment looks backwards.
 *
 * Cycles are far less error-prone to write than a flat 54-entry table, and
 * they're checkable by eye against the diagram above.
 */
function permutation(cycles: number[][]): number[] {
  const perm = Array.from({ length: 54 }, (_, i) => i);
  for (const cycle of cycles) {
    for (let i = 0; i < cycle.length; i += 1) {
      perm[cycle[(i + 1) % cycle.length]] = cycle[i];
    }
  }
  return perm;
}

export function applyPerm(state: CubeState, perm: number[]): CubeState {
  return perm.map((from) => state[from]);
}

/** a then b. */
function compose(a: number[], b: number[]): number[] {
  return b.map((from) => a[from]);
}

function inverse(perm: number[]): number[] {
  const out = Array<number>(54);
  for (let i = 0; i < 54; i += 1) out[perm[i]] = i;
  return out;
}

function twice(perm: number[]): number[] {
  return compose(perm, perm);
}

// ---- the six faces and three slices, as quarter turns ----

const U = permutation([
  [0, 2, 8, 6], [1, 5, 7, 3],
  [18, 36, 45, 9], [19, 37, 46, 10], [20, 38, 47, 11],
]);

const D = permutation([
  [27, 29, 35, 33], [28, 32, 34, 30],
  [24, 15, 51, 42], [25, 16, 52, 43], [26, 17, 53, 44],
]);

const R = permutation([
  [9, 11, 17, 15], [10, 14, 16, 12],
  [20, 2, 51, 29], [23, 5, 48, 32], [26, 8, 45, 35],
]);

const L = permutation([
  [36, 38, 44, 42], [37, 41, 43, 39],
  [0, 18, 27, 53], [3, 21, 30, 50], [6, 24, 33, 47],
]);

const F = permutation([
  [18, 20, 26, 24], [19, 23, 25, 21],
  [6, 9, 29, 44], [7, 12, 28, 41], [8, 15, 27, 38],
]);

const B = permutation([
  [45, 47, 53, 51], [46, 50, 52, 48],
  [2, 36, 35, 11], [1, 39, 34, 14], [0, 42, 33, 17],
]);

// Slices follow the face they sit beside: M follows L, E follows D, S follows F.
const M = permutation([[1, 19, 28, 52], [4, 22, 31, 49], [7, 25, 34, 46]]);
const E = permutation([[21, 12, 48, 39], [22, 13, 49, 40], [23, 14, 50, 41]]);
const S = permutation([[3, 10, 32, 43], [4, 13, 31, 40], [5, 16, 30, 37]]);

// Whole-cube rotations are the face plus everything behind it, so they're
// composed rather than tabulated — one less table to get wrong.
const X = compose(R, compose(inverse(M), inverse(L)));
const Y = compose(U, compose(inverse(E), inverse(D)));
const Z = compose(F, compose(S, inverse(B)));

const QUARTER: Record<string, number[]> = {
  U, D, R, L, F, B, M, E, S, x: X, y: Y, z: Z,
};

/** Every legal token: the quarter turn, its inverse and its double. */
export const MOVES: Record<string, number[]> = Object.fromEntries(
  Object.entries(QUARTER).flatMap(([name, perm]) => [
    [name, perm],
    [`${name}'`, inverse(perm)],
    [`${name}2`, twice(perm)],
  ]),
);

export function parseAlg(text: string): string[] {
  const tokens = text.trim().split(/\s+/).filter((token) => token !== '');
  for (const token of tokens) {
    if (!(token in MOVES)) throw new Error(`Unknown move: ${token}`);
  }
  return tokens;
}

export function applyAlg(state: CubeState, text: string): CubeState {
  let next = state;
  for (const token of parseAlg(text)) next = applyPerm(next, MOVES[token]);
  return next;
}

export function isSolved(state: CubeState): boolean {
  const solved = solvedCube();
  return state.every((face, i) => face === solved[i]);
}

/** The 9 facelets of one face, row-major. */
export function faceOf(state: CubeState, face: Face): Face[] {
  const start = FACE_ORDER.indexOf(face) * 9;
  return state.slice(start, start + 9);
}
