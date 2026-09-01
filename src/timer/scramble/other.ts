import { between, pick } from './random';

/**
 * The puzzles that aren't cubes.
 *
 * Each of these is random-move rather than random-state: the WCA generates
 * Pyraminx, Skewb and Square-1 scrambles from a solver, and these will
 * occasionally be easier than a competition scramble would be. The notation is
 * the official notation in every case, so a scramble here pastes cleanly into
 * any other timer or solver.
 */

/** Signed turn amounts, written the way each puzzle writes them. */
function signed(amount: number): string {
  return amount > 0 ? `${amount}+` : `${-amount}-`;
}

/**
 * Clock.
 *
 * Nine dial positions from the front, then the cube is flipped and four more
 * plus an all-dials turn, then the pin configuration. Every dial reads -5 to +6
 * because that is the full range of the twelve-hour face relative to zero.
 */
const CLOCK_FRONT = ['UR', 'DR', 'DL', 'UL', 'U', 'R', 'D', 'L', 'ALL'];
const CLOCK_BACK = ['U', 'R', 'D', 'L', 'ALL'];

export function scrambleClock(): string[] {
  const dial = () => {
    const amount = between(-5, 6);
    return amount === 0 ? '0+' : signed(amount);
  };

  const moves = CLOCK_FRONT.map((face) => `${face}${dial()}`);
  moves.push('y2');
  moves.push(...CLOCK_BACK.map((face) => `${face}${dial()}`));

  // Which pins are up going in. All four down is a legal state and does come up.
  const pins = Array.from({ length: 4 }, () => pick(['U', 'd'])).join('');
  moves.push(pins);
  return moves;
}

/**
 * Megaminx, in the Pochmann notation every scrambler uses.
 *
 * Seven lines of ten alternating R and D turns — which are always double turns
 * on a megaminx, hence the doubled sign — each finished with a U or U'. The
 * alternation is fixed, not random: it is what makes the scramble applicable
 * without regripping.
 */
export function scrambleMegaminx(): string[] {
  const lines: string[] = [];

  for (let line = 0; line < 7; line += 1) {
    const moves: string[] = [];
    for (let pair = 0; pair < 5; pair += 1) {
      moves.push(`R${pick(['++', '--'])}`);
      moves.push(`D${pick(['++', '--'])}`);
    }
    moves.push(pick(["U", "U'"]));
    lines.push(moves.join(' '));
  }
  return lines;
}

/**
 * Pyraminx: the four large turns, then the tips.
 *
 * Tips are listed last and each is optional, because a tip that is already
 * solved is not worth a move — which is exactly how the official scrambles
 * write them.
 */
const TRIANGLE = ['U', 'L', 'R', 'B'] as const;

export function scramblePyraminx(): string[] {
  const moves = randomFaces(TRIANGLE, 10);

  for (const tip of ['u', 'l', 'r', 'b']) {
    const turn = pick(['', "'", '2']);
    // '2' on a tip is the same as its inverse, so only two states are worth writing.
    if (turn !== '2') moves.push(`${tip}${turn}`);
  }
  return moves;
}

export function scrambleSkewb(): string[] {
  return randomFaces(TRIANGLE, 11);
}

/** `length` turns of the given axes, never twice on the same one in a row. */
function randomFaces(faces: readonly string[], length: number): string[] {
  const moves: string[] = [];
  let prev: string | null = null;

  for (let i = 0; i < length; i += 1) {
    const face = pick(faces.filter((item) => item !== prev));
    moves.push(`${face}${pick(['', "'"])}`);
    prev = face;
  }
  return moves;
}

/**
 * Square-1, in slash notation.
 *
 * `(a,b)` turns the top layer a twelfths and the bottom b twelfths; the slash
 * flips half the puzzle over. A scramble is a run of those, and it must not end
 * on a slash — a trailing flip is a move you would immediately undo.
 */
export function scrambleSquare1(): string[] {
  const twists = between(11, 13);
  const moves: string[] = [];

  for (let i = 0; i < twists; i += 1) {
    const top = between(-5, 6);
    const bottom = between(-6, 5);
    // The slash rides on the twist before it, the way the notation is written.
    moves.push(`(${top},${bottom})${i < twists - 1 ? '/' : ''}`);
  }
  return moves;
}
