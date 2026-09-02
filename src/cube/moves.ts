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

/**
 * The two corner cycles here pair U with the *opposite* D corner: B carries the
 * top-back-right cubie to top-back-left, so U's back-right sticker (2) follows
 * the corner round to L, D's back-LEFT sticker (33) and R's back-bottom one
 * (17) — not D's back-right. Getting this pair crossed produces a cube that is
 * still a valid permutation and still passes any U-layer check, which is
 * exactly how it survived: PLL algs hardly use B, so nothing noticed until a
 * full scramble was drawn as a net.
 */
const B = permutation([
  [45, 47, 53, 51], [46, 50, 52, 48],
  [2, 36, 33, 17], [1, 39, 34, 14], [0, 42, 35, 11],
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

/**
 * The same moves undone, in reverse. Turns "the alg that solves this case"
 * into "the case you are looking at": applying an alg to a solved cube gives
 * the position it *creates*, which for anything but an involution is a
 * different case than the one it fixes.
 */
export function invertAlg(text: string): string {
  return parseAlg(text)
    .map((token) => {
      if (token.endsWith('2')) return token;   // a half turn is its own inverse
      return token.endsWith("'") ? token.slice(0, -1) : `${token}'`;
    })
    .reverse()
    .join(' ');
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

// ---- tracking where pieces came from, not just what colour they are ----

/**
 * A cube whose stickers are labelled by where they belong rather than by what
 * colour they are: `labels[i]` is the home facelet of the sticker currently
 * sitting at `i`.
 *
 * A colour can't answer "where does this piece go" — four stickers are yellow
 * and it is the same yellow. Labels can, and a state falls straight back out of
 * them (`labelsToState`), so one computation feeds both the diagram and the
 * arrows over it instead of two that can disagree.
 */
export type Labels = number[];

export function solvedLabels(): Labels {
  return Array.from({ length: 54 }, (_, i) => i);
}

export function applyAlgLabels(labels: Labels, text: string): Labels {
  let next = labels;
  for (const token of parseAlg(text)) next = MOVES[token].map((from) => next[from]);
  return next;
}

export function labelsToState(labels: Labels): CubeState {
  return labels.map((label) => FACE_ORDER[Math.floor(label / 9)]);
}

/** The U-layer cells, minus the centre, split by what kind of piece they carry. */
const U_CORNERS = [0, 2, 6, 8];
const U_EDGES = [1, 3, 5, 7];

/** The U-layer side stickers: the ring you actually recognise a case from. */
const RING = [9, 10, 11, 18, 19, 20, 36, 37, 38, 45, 46, 47];

/** The longest cycle `labels` puts these cells through. */
function longestCycle(labels: Labels, cells: number[]): number {
  let longest = 1;
  const seen = new Set<number>();

  for (const start of cells) {
    if (seen.has(start)) continue;
    let length = 0;
    for (let cell = start; !seen.has(cell); cell = labels[cell]) {
      seen.add(cell);
      length += 1;
      if (!cells.includes(labels[cell])) break;
    }
    longest = Math.max(longest, length);
  }
  return longest;
}

/**
 * The case as a diagram: the alg undone, turned to the angle it's drawn at.
 *
 * Two things are being fixed here. Plenty of good algs finish with the last
 * layer rotated — they solve the case and leave you an AUF, which costs nothing
 * on a real cube but means the position they *create* is the case seen from a
 * quarter turn off.
 *
 * And an AUF is not a neutral choice of angle. Turning U doesn't change which
 * case you're looking at, but it does change what the pieces appear to be
 * doing: a G perm framed one way is a corner 3-cycle and an edge 3-cycle, and
 * framed a quarter turn over it is a corner swap and an edge 4-cycle. Both are
 * the same case; only the first is how anyone draws or thinks about it. So the
 * angle chosen is the one where the longest cycle is shortest — the simplest
 * true description of the case — with the number of side stickers already home
 * breaking ties, which is the angle alg sheets settle on for everything else.
 */
export function caseLabels(alg: string): Labels {
  let turned = applyAlgLabels(solvedLabels(), invertAlg(alg));

  let best = turned;
  let bestScore: [number, number] = [Infinity, Infinity];

  for (let turn = 0; turn < 4; turn += 1) {
    const state = labelsToState(turned);
    const home = RING.filter((facelet, ) => state[facelet] === FACE_ORDER[Math.floor(facelet / 9)]).length;
    const score: [number, number] = [
      Math.max(longestCycle(turned, U_CORNERS), longestCycle(turned, U_EDGES)),
      -home,
    ];
    // Strictly better only, so a tie keeps the earliest angle and the picture
    // is the same every time it's drawn.
    if (score[0] < bestScore[0] || (score[0] === bestScore[0] && score[1] < bestScore[1])) {
      bestScore = score;
      best = turned;
    }
    turned = MOVES.U.map((from) => turned[from]);
  }
  return best;
}

/** One piece's journey when the alg is executed. */
export interface Arrow {
  /** U-face cell 0-8 it sits in now. */
  from: number;
  /** U-face cell 0-8 it ends up in. */
  to: number;
  kind: 'corner' | 'edge';
  /** True when the two swap, so one line with two heads says all of it. */
  both: boolean;
}

/**
 * Where each last-layer piece goes, as arrows over the U face.
 *
 * `labels[i]` is the home of the sticker at `i`, and executing the alg is
 * exactly the act of sending it home — so the arrow is `i → labels[i]`, with no
 * second pass over the cube needed to work it out.
 *
 * Mutual swaps collapse into one double-headed arrow rather than two arrows
 * drawn on top of each other, which is both how alg sheets draw them and the
 * difference between H perm reading as two lines and as four.
 */
export function lastLayerArrows(labels: Labels): Arrow[] {
  const arrows: Arrow[] = [];

  for (const [cells, kind] of [[U_CORNERS, 'corner'], [U_EDGES, 'edge']] as const) {
    for (const from of cells) {
      const to = labels[from];
      // A piece already home, or one whose sticker left the U face entirely —
      // which a PLL never does, but an OLL alg dropped in here would.
      if (to === from || !cells.includes(to)) continue;

      const both = labels[to] === from;
      // One of the pair is enough when they swap; take the lower cell so which
      // one is arbitrary but stable.
      if (both && to < from) continue;

      arrows.push({ from, to, kind, both });
    }
  }
  return arrows;
}
