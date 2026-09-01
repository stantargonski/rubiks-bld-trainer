/**
 * An n x n x n facelet model, for any n from 2 to 7.
 *
 * Same conventions as the 3x3 engine in ./moves.ts, deliberately: faces in the
 * order U R F D L B, each stored row-major as seen looking straight at it, and
 * a state is just what colour sits on each facelet. `npm run check:cube`
 * asserts the two engines agree facelet-for-facelet at n = 3, which is what
 * lets the net renderer in ./CubeView.tsx draw either one.
 *
 * Where this differs from moves.ts is that nothing is tabulated. A 7x7 has 294
 * facelets and thirty-odd legal tokens; writing those cycles by hand is not a
 * thing anyone should do. Instead every turn is derived from n by one rule per
 * face, each of which reduces at n = 3 to exactly the cycles moves.ts lists —
 * which is the whole point of the cross-check.
 */
export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';
export type CubeState = Face[];

export const FACE_ORDER: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

const OPPOSITE: Record<Face, Face> = { U: 'D', D: 'U', L: 'R', R: 'L', F: 'B', B: 'F' };

export function solvedCube(size: number): CubeState {
  return FACE_ORDER.flatMap((face) => Array<Face>(size * size).fill(face));
}

/** The n*n facelets of one face, row-major. */
export function faceOf(state: CubeState, size: number, face: Face): Face[] {
  const start = FACE_ORDER.indexOf(face) * size * size;
  return state.slice(start, start + size * size);
}

/** Facelet index of row `r`, column `c` on `face`. */
function at(size: number, face: Face, row: number, col: number): number {
  return FACE_ORDER.indexOf(face) * size * size + row * size + col;
}

/**
 * The strips one layer of one face's turn moves, at `depth` counted in from
 * that face.
 *
 * Each rule below is the general form of the corresponding cycle list in
 * moves.ts. Substituting size = 3, depth = 0 reproduces those tables exactly,
 * which is the only reason to trust the n > 3 cases at all.
 */
function ring(size: number, face: Face, depth: number): number[][] {
  const last = size - 1;
  const back = last - depth;
  const cycles: number[][] = [];

  for (let i = 0; i < size; i += 1) {
    switch (face) {
      // U clockwise sends F -> L -> B -> R. All four side faces share an up
      // direction, so their rows line up index for index.
      case 'U':
        cycles.push([
          at(size, 'F', depth, i), at(size, 'L', depth, i),
          at(size, 'B', depth, i), at(size, 'R', depth, i),
        ]);
        break;

      // D is U's mirror: F -> R -> B -> L, counting rows up from the bottom.
      case 'D':
        cycles.push([
          at(size, 'F', back, i), at(size, 'R', back, i),
          at(size, 'B', back, i), at(size, 'L', back, i),
        ]);
        break;

      // R sends F -> U -> B -> D. B is stored as seen from behind, so its row
      // runs the other way and its column counts in from the opposite edge.
      case 'R':
        cycles.push([
          at(size, 'F', i, back), at(size, 'U', i, back),
          at(size, 'B', last - i, depth), at(size, 'D', i, back),
        ]);
        break;

      // L sends U -> F -> D -> B, with the same reversal on B.
      case 'L':
        cycles.push([
          at(size, 'U', i, depth), at(size, 'F', i, depth),
          at(size, 'D', i, depth), at(size, 'B', last - i, back),
        ]);
        break;

      // F sends U -> R -> D -> L, and every strip changes direction because
      // the four faces around it don't share an up direction.
      case 'F':
        cycles.push([
          at(size, 'U', back, i), at(size, 'R', i, depth),
          at(size, 'D', depth, last - i), at(size, 'L', last - i, back),
        ]);
        break;

      // B sends U -> L -> D -> R, F's mirror.
      case 'B':
        cycles.push([
          at(size, 'U', depth, last - i), at(size, 'L', i, depth),
          at(size, 'D', back, i), at(size, 'R', last - i, back),
        ]);
        break;
    }
  }
  return cycles;
}

/** A face's own stickers, turned a quarter clockwise as seen looking at it. */
function spin(size: number, face: Face): number[][] {
  const cycles: number[][] = [];

  for (let row = 0; row < Math.floor(size / 2); row += 1) {
    for (let col = row; col < size - 1 - row; col += 1) {
      cycles.push([
        at(size, face, row, col),
        at(size, face, col, size - 1 - row),
        at(size, face, size - 1 - row, size - 1 - col),
        at(size, face, size - 1 - col, row),
      ]);
    }
  }
  return cycles;
}

function identity(size: number): number[] {
  return Array.from({ length: 6 * size * size }, (_, i) => i);
}

/** perm[destination] = source, so applying it is a plain map. */
function fromCycles(size: number, cycles: number[][]): number[] {
  const perm = identity(size);
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
  const out = Array<number>(perm.length);
  for (let i = 0; i < perm.length; i += 1) out[perm[i]] = i;
  return out;
}

/**
 * One layer, a quarter turn clockwise as seen from `face`.
 *
 * The outermost layer carries that face's own stickers around with it; the
 * innermost carries the *opposite* face's, turning the other way. Getting that
 * second case right is what makes a whole-cube rotation fall out of "every
 * layer at once" instead of needing a table of its own.
 */
function layer(size: number, face: Face, depth: number): number[] {
  const cycles = [...ring(size, face, depth)];
  if (depth === 0) cycles.push(...spin(size, face));

  let perm = fromCycles(size, cycles);
  if (depth === size - 1) {
    perm = compose(perm, inverse(fromCycles(size, spin(size, OPPOSITE[face]))));
  }
  return perm;
}

/** Layers `from` through `to` inclusive, all turned together. */
function block(size: number, face: Face, from: number, to: number): number[] {
  let perm = identity(size);
  for (let depth = from; depth <= to; depth += 1) perm = compose(perm, layer(size, face, depth));
  return perm;
}

/** M, E and S turn every layer between the two outer ones, in the named direction. */
const SLICE: Record<string, Face> = { M: 'L', E: 'D', S: 'F' };
const ROTATION: Record<string, Face> = { x: 'R', y: 'U', z: 'F' };

/** `3Rw'`, `Rw2`, `r`, `R`, `M2`, `y'` — every notation the generators emit. */
const TOKEN = /^(\d*)([UDLRFBudlrfbMESxyz])(w?)('|2)?$/;

const CACHES = new Map<number, Map<string, number[] | null>>();

/** The permutation for one quarter-turn base, or null if this puzzle has no such move. */
function quarterOf(size: number, prefix: string, letter: string, wide: boolean): number[] | null {
  let cache = CACHES.get(size);
  if (!cache) {
    cache = new Map();
    CACHES.set(size, cache);
  }

  const key = `${prefix}${letter}${wide ? 'w' : ''}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  // Every branch below assigns, so there is nothing useful to initialise this to.
  let perm: number[] | null;

  if (letter in ROTATION) {
    perm = block(size, ROTATION[letter], 0, size - 1);
  } else if (letter in SLICE) {
    // A 2x2 has no inner layer, so M/E/S simply do not exist on it.
    perm = size >= 3 ? block(size, SLICE[letter], 1, size - 2) : null;
  } else if (letter >= 'a' && letter <= 'z') {
    // Lowercase is the two-layer wide turn, so it needs a cube to be wide on.
    perm = size >= 2 ? block(size, letter.toUpperCase() as Face, 0, 1) : null;
  } else if (wide) {
    const depth = prefix === '' ? 2 : Number(prefix);
    perm = depth >= 1 && depth <= size ? block(size, letter as Face, 0, depth - 1) : null;
  } else {
    perm = layer(size, letter as Face, 0);
  }

  cache.set(key, perm);
  return perm;
}

/** The permutation for one token, or null if this puzzle has no such move. */
export function moveOf(size: number, token: string): number[] | null {
  const match = TOKEN.exec(token);
  if (!match) return null;

  const [, prefix, letter, wide, suffix] = match;
  // A numeric prefix only means anything on a wide turn.
  if (prefix !== '' && wide !== 'w') return null;

  const single = quarterOf(size, prefix, letter, wide === 'w');
  if (!single) return null;

  if (suffix === '2') return compose(single, single);
  if (suffix === "'") return inverse(single);
  return single;
}

export function parseAlg(size: number, text: string): string[] {
  const tokens = text.trim().split(/\s+/).filter((token) => token !== '');
  for (const token of tokens) {
    if (!moveOf(size, token)) throw new Error(`Unknown move for ${size}x${size}: ${token}`);
  }
  return tokens;
}

export function applyAlg(state: CubeState, size: number, text: string): CubeState {
  let next = state;
  for (const token of parseAlg(size, text)) next = applyPerm(next, moveOf(size, token)!);
  return next;
}

/** A scramble applied to a solved cube — what you should be holding. */
export function stateAfter(size: number, moves: string[]): CubeState {
  return applyAlg(solvedCube(size), size, moves.join(' '));
}
