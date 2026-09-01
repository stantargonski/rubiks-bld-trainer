import type { WcaEvent } from '../events';
import { randomNxN, randomOrientation } from './nxn';
import {
  scrambleClock, scrambleMegaminx, scramblePyraminx, scrambleSkewb, scrambleSquare1,
} from './other';
import { isReady, randomStateScramble, warmUp } from './twoByTwo';

/**
 * A scramble, as three separate things rather than one string.
 *
 * `rotation` is kept out of `moves` on purpose. Blindfolded scrambles end with a
 * random cube rotation, and folding it into the move list means the preview
 * draws a cube tipped onto some other face while you are holding yours white on
 * top — which reads as "the colours are wrong" rather than as "you are holding
 * it differently". Separated, the picture can show the cube square-on and the
 * rotation can be stated as the instruction it actually is.
 *
 * `lines` is for the puzzles whose scrambles are written as several rows —
 * megaminx, and multi-blind's one scramble per cube.
 */
export interface Scramble {
  /** The tokens to apply, without any trailing reorientation. */
  moves: string[];
  /** How to hold it afterwards. Empty for everything but blindfolded events. */
  rotation: string[];
  /** Pre-formatted rows, when a flat list of tokens isn't the right shape. */
  lines?: string[];
}

/** An empty scramble, for the moment before the first one is generated. */
export const NO_SCRAMBLE: Scramble = { moves: [], rotation: [] };

/**
 * The 2x2 needs a table built before it can give a real random-state scramble.
 * Asking early means it is usually ready by the time you finish reading the
 * first scramble, and asking twice costs nothing.
 */
export function prepare(event: WcaEvent): void {
  if (event.scramble.kind === 'nxn' && event.scramble.size === 2) warmUp();
}

export function scrambleFor(event: WcaEvent): Scramble {
  const spec = event.scramble;

  switch (spec.kind) {
    case 'nxn': {
      // The 2x2 gets a real random state when the table is up, and random moves
      // until then — never a wait.
      if (spec.size === 2) {
        warmUp();
        const state = isReady() ? randomStateScramble() : null;
        if (state) return { moves: state, rotation: [] };
      }
      return { moves: randomNxN(spec.size, spec.length), rotation: [] };
    }

    case 'nxnbf':
      return { moves: randomNxN(spec.size, spec.length), rotation: randomOrientation() };

    // FMC scrambles are bracketed by R' U' F at both ends, so nobody can start
    // from a position handed to them already partly solved. The core is told
    // what it sits between, so neither join leaves a redundant turn.
    case 'fmc': {
      const core = randomNxN(3, 20, { after: 'F', before: 'R' });
      return { moves: ["R'", "U'", 'F', ...core, "R'", "U'", 'F'], rotation: [] };
    }

    case 'mbf': {
      const lines = Array.from({ length: spec.count }, (_, index) => {
        const moves = randomNxN(3, 20);
        const rotation = randomOrientation();
        return `${index + 1}) ${[...moves, ...rotation].join(' ')}`;
      });
      return { moves: [], rotation: [], lines };
    }

    case 'clock':
      return { moves: scrambleClock(), rotation: [] };

    case 'minx':
      return { moves: [], rotation: [], lines: scrambleMegaminx() };

    case 'pyram':
      return { moves: scramblePyraminx(), rotation: [] };

    case 'skewb':
      return { moves: scrambleSkewb(), rotation: [] };

    case 'sq1':
      return { moves: scrambleSquare1(), rotation: [] };
  }
}

/** The whole thing as one line, for storing on a solve and for the clipboard. */
export function scrambleText(scramble: Scramble): string {
  if (scramble.lines) return scramble.lines.join('\n');
  return [...scramble.moves, ...scramble.rotation].join(' ');
}
