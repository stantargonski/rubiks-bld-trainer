import { pick } from './random';

/**
 * Random-move scrambles for any cube from 2x2 to 7x7.
 *
 * This is the generalisation of the original 3x3 generator: the same axis
 * constraints, widened to cover the wide turns bigger cubes need.
 */

const FACES = ['U', 'D', 'L', 'R', 'F', 'B'] as const;
const SUFFIXES = ['', "'", '2'] as const;

type Face = (typeof FACES)[number];

const AXIS: Record<Face, number> = { U: 0, D: 0, L: 1, R: 1, F: 2, B: 2 };

/**
 * Position within an axis pair. A same-axis move may only follow a *lower* one,
 * so "U D" gets generated and "D U" never does — the same constraint min2phase's
 * move table enforces when cstimer solves a random state into a scramble.
 *
 * This also caps any axis run at two moves, which is why there is no prev2 /
 * "U D U" rule: that pattern is unreachable.
 */
const AXIS_ORDER: Record<Face, number> = { U: 0, D: 1, R: 0, L: 1, F: 0, B: 1 };

/**
 * How many layers a turn may take with it, by cube size.
 *
 * A 4x4 and 5x5 turn one or two layers; a 6x6 and 7x7 add the three-layer turn.
 * Anything smaller only ever turns its outer face — on a 3x3 a two-layer turn is
 * a slice move dressed up, and scramblers don't emit those.
 *
 * The count goes *before* the face and the w after it: three layers of U is
 * `3Uw`, never `U3w`.
 */
const OUTER = { prefix: '', wide: '' };
const TWO_LAYER = { prefix: '', wide: 'w' };
const THREE_LAYER = { prefix: '3', wide: 'w' };

function widthsFor(size: number): { prefix: string; wide: string }[] {
  if (size >= 6) return [OUTER, TWO_LAYER, THREE_LAYER];
  if (size >= 4) return [OUTER, TWO_LAYER];
  return [OUTER];
}

/** A 2x2 is scrambled on three faces only — the other three are the same turns. */
function facesFor(size: number): readonly Face[] {
  return size === 2 ? (['U', 'R', 'F'] as const) : FACES;
}

/** Whether `face` may legally come after `prev`. */
export function canFollow(prev: Face | null, face: Face): boolean {
  if (prev === null) return true;
  if (face === prev) return false;
  return !(AXIS[face] === AXIS[prev] && AXIS_ORDER[face] <= AXIS_ORDER[prev]);
}

export interface NxNOptions {
  /** A face the scramble is being appended after, so the join stays legal. */
  after?: Face;
  /** A face that will follow the scramble — the last move is picked to allow it. */
  before?: Face;
}

/**
 * `length` random moves' worth of scramble.
 *
 * The face is chosen first and the width second, so the axis rule stays a
 * statement about faces: "R Rw" is as redundant as "R R", and treating width as
 * part of the face would let it through.
 *
 * `after` and `before` exist for FMC, whose scramble is bracketed by a fixed
 * `R' U' F` at each end. Without them the join produces things like "... F | F2
 * ..." — still a legal cube state, but a scramble with a redundant turn in it,
 * which is exactly what the axis rules are there to prevent.
 */
export function randomNxN(size: number, length: number, options: NxNOptions = {}): string[] {
  const faces = facesFor(size);
  const widths = widthsFor(size);
  const moves: string[] = [];
  let prev: Face | null = options.after ?? null;

  for (let i = 0; i < length; i += 1) {
    const last = i === length - 1;
    let legal = faces.filter((face) => canFollow(prev, face));

    if (last && options.before) {
      const joins = legal.filter((face) => canFollow(face, options.before!));
      // Never narrow to nothing: with six faces this always has options, but a
      // 2x2's three faces plus a tight join could in principle empty it.
      if (joins.length > 0) legal = joins;
    }

    const face = pick(legal);
    const width = pick(widths);
    moves.push(`${width.prefix}${face}${width.wide}${pick(SUFFIXES)}`);
    prev = face;
  }
  return moves;
}

/**
 * WCA blindfolded scrambles end held at a random angle, so you can't assume
 * white on top and have to work your orientation out as part of the solve.
 *
 * Written as wide moves rather than as an `x y'` instruction to hold the cube
 * differently, which is what cstimer and TNoodle emit. Two reasons it's the
 * better form: it's part of the scramble, so it survives being copied, pasted
 * and read back by anything else; and a wide turn is something you *do* to the
 * cube, so the preview can draw the position you will actually be holding
 * instead of a picture you have to mentally rotate.
 *
 * Six choices of the first times four of the second covers all 24 orientations
 * once each. Two-layer wide turns are legal on every cube from 2x2 up, so the
 * one table serves 3BLD, 4BLD, 5BLD and multi-blind alike.
 */
const ORIENT_FIRST = ['', 'Rw', 'Rw2', "Rw'", 'Fw', "Fw'"] as const;
const ORIENT_SECOND = ['', 'Uw', 'Uw2', "Uw'"] as const;

export function randomOrientation(): string[] {
  return [pick(ORIENT_FIRST), pick(ORIENT_SECOND)].filter((move) => move !== '');
}

/**
 * The face the first of these tokens turns, or null if there are none.
 *
 * The orientation suffix is generated *before* the scramble it follows, so the
 * scramble can be told what it has to join onto — `randomNxN`'s `before` option,
 * the same one FMC uses for its `R' U' F` tail. Filtering the orientation to fit
 * the scramble instead would be the easier way round and the wrong one: it would
 * quietly stop the 24 orientations being equally likely, and which way up the
 * cube lands is part of a blindfolded solve rather than decoration on it.
 */
export function leadingFace(tokens: string[]): Face | null {
  const match = /[UDLRFB]/.exec(tokens[0] ?? '');
  return match ? (match[0] as Face) : null;
}
