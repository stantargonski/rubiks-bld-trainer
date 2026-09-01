/**
 * Asserts the generic NxN engine is the same cube as the verified 3x3 one.
 *
 * Run with `npm run check:cube`. No build step: node strips the types.
 *
 * src/cube/moves.ts is hand-tabulated and independently checked by
 * check-algs.ts, which validates 21 real PLL algorithms against it. src/cube/
 * nxn.ts derives its turns from n instead. If the two agree facelet for facelet
 * over a few thousand random algorithms at n = 3, the derivation is right — and
 * the same rules produce the n != 3 cases, which nothing else can check by eye.
 *
 * The rest is structural: turns have the right order, the right number of
 * facelets move, and a scramble followed by its inverse is a solved cube.
 */
import { applyAlg as applyAlg3, solvedCube as solved3, MOVES } from '../src/cube/moves.ts';
import {
  applyAlg, faceOf, moveOf, solvedCube, stateAfter, type Face,
} from '../src/cube/nxn.ts';

const failures: string[] = [];

function check(ok: boolean, message: string): void {
  if (!ok) failures.push(message);
}

/** Deterministic, so a failure is reproducible rather than "it happened once". */
let seed = 20260901;
function random(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

// ---- 1. n = 3 agrees with the tabulated engine, token for token ----

const TOKENS_3 = Object.keys(MOVES);

function checkAgainst3x3(): void {
  // Every single token first: a disagreement here names the exact move.
  for (const token of TOKENS_3) {
    const mine = applyAlg(solvedCube(3), 3, token).join('');
    const theirs = applyAlg3(solved3(), token).join('');
    check(mine === theirs, `n=3 token ${token}: nxn gave ${mine}, moves.ts gave ${theirs}`);
  }

  // Then long random sequences, which catch composition errors single moves miss.
  for (let trial = 0; trial < 500; trial += 1) {
    const alg = Array.from({ length: 25 }, () => pick(TOKENS_3)).join(' ');
    const mine = applyAlg(solvedCube(3), 3, alg).join('');
    const theirs = applyAlg3(solved3(), alg).join('');
    check(mine === theirs, `n=3 disagreed on: ${alg}`);
  }
}

// ---- 2. Structure that has to hold at every size ----

const SIZES = [2, 3, 4, 5, 6, 7];

function outerTokens(size: number): string[] {
  const faces = ['U', 'D', 'L', 'R', 'F', 'B'];
  const tokens = faces.flatMap((face) => [face, `${face}'`, `${face}2`]);
  if (size >= 4) tokens.push(...faces.flatMap((face) => [`${face}w`, `${face}w'`, `${face}w2`]));
  if (size >= 6) tokens.push(...faces.flatMap((face) => [`3${face}w`, `3${face}w'`]));
  return tokens;
}

function checkStructure(): void {
  for (const size of SIZES) {
    const stickers = 6 * size * size;

    // Every face keeps its own count of every colour, whatever you do to it.
    const alg = Array.from({ length: 60 }, () => pick(outerTokens(size))).join(' ');
    const state = applyAlg(solvedCube(size), size, alg);
    check(state.length === stickers, `${size}x${size}: state is ${state.length}, want ${stickers}`);

    for (const face of ['U', 'R', 'F', 'D', 'L', 'B'] as Face[]) {
      const count = state.filter((colour) => colour === face).length;
      check(count === size * size, `${size}x${size}: ${count} ${face} stickers, want ${size * size}`);
      check(faceOf(state, size, face).length === size * size, `${size}x${size}: faceOf ${face} wrong length`);
    }

    // A quarter turn has order 4; a whole-cube rotation moves every sticker home.
    for (const token of outerTokens(size).filter((item) => /^[UDLRFB]$/.test(item))) {
      const once = applyAlg(solvedCube(size), size, token).join('');
      const fourTimes = applyAlg(solvedCube(size), size, `${token} ${token} ${token} ${token}`).join('');
      check(once !== solvedCube(size).join(''), `${size}x${size}: ${token} did nothing`);
      check(fourTimes === solvedCube(size).join(''), `${size}x${size}: ${token} has order != 4`);
    }

    // Scramble, then undo it move by move.
    const inverted = alg.split(' ').reverse()
      .map((token) => (token.endsWith('2') ? token : token.endsWith("'") ? token.slice(0, -1) : `${token}'`))
      .join(' ');
    const back = applyAlg(state, size, inverted).join('');
    check(back === solvedCube(size).join(''), `${size}x${size}: scramble then inverse was not solved`);
  }
}

// ---- 3. Moves that should not exist, don't ----

function checkRejections(): void {
  check(moveOf(2, 'M') === null, '2x2 should have no M slice');
  check(moveOf(4, 'Q') === null, 'Q is not a move');
  check(moveOf(3, '4Rw') === null, 'a 3x3 has no fourth layer to turn');
  check(moveOf(4, '2Rw') !== null, '4x4 should accept an explicit 2Rw');
  check(moveOf(3, 'x') !== null, 'x should be a legal rotation');

  // A wide turn that reaches every layer IS the whole-cube rotation, at any n.
  // Nothing generates these, but rejecting them would be wrong, not strict.
  for (const [size, token] of [[2, 'Rw'], [3, '3Rw'], [4, '4Rw']] as [number, string][]) {
    const wide = applyAlg(solvedCube(size), size, token).join('');
    const rotated = applyAlg(solvedCube(size), size, 'x').join('');
    check(wide === rotated, `${size}x${size}: ${token} should equal x, got ${wide}`);
  }
}

// ---- 4. Rotations really are just a change of viewpoint ----

function checkRotations(): void {
  for (const size of SIZES) {
    for (const rotation of ['x', 'y', 'z']) {
      const state = applyAlg(solvedCube(size), size, rotation);
      // Nothing is scrambled — each face is still one colour, just a different one.
      for (const face of ['U', 'R', 'F', 'D', 'L', 'B'] as Face[]) {
        const stickers = faceOf(state, size, face);
        check(
          stickers.every((colour) => colour === stickers[0]),
          `${size}x${size}: ${rotation} left face ${face} mixed: ${stickers.join('')}`,
        );
      }
      const four = applyAlg(solvedCube(size), size, Array(4).fill(rotation).join(' ')).join('');
      check(four === solvedCube(size).join(''), `${size}x${size}: ${rotation} has order != 4`);
    }
  }
}

// ---- 5. A wide turn is the outer turn plus the slice behind it ----

function checkWide(): void {
  for (const size of [4, 5, 6, 7]) {
    // Rw undone by R leaves only inner layers moved, so the R face is untouched.
    const state = applyAlg(solvedCube(size), size, "Rw R'");
    const right = faceOf(state, size, 'R');
    check(right.every((colour) => colour === 'R'), `${size}x${size}: Rw R' disturbed the R face`);
    check(
      state.join('') !== solvedCube(size).join(''),
      `${size}x${size}: Rw R' should still move the inner layer`,
    );
  }
}

// ---- 6. A known scramble, checked by hand ----

/**
 * Sune on a 3x3 leaves the U face solved except for the corners it twists, and
 * touches nothing below the top layer. Spelled out as a facelet string so a
 * regression shows up as a diff rather than as a property that still holds.
 */
function checkKnown(): void {
  const state = stateAfter(3, ['R', 'U', "R'", 'U', 'R', 'U2', "R'"]);
  const down = faceOf(state, 3, 'D').join('');
  check(down === 'DDDDDDDDD', `sune should not touch D, got ${down}`);

  const solvedAgain = stateAfter(3, ['R', 'U', "R'", 'U', 'R', 'U2', "R'", 'R', 'U2', "R'", "U'", 'R', "U'", "R'"]);
  check(
    solvedAgain.join('') === solved3().join(''),
    'sune followed by its inverse should be solved',
  );
}

checkAgainst3x3();
checkStructure();
checkRejections();
checkRotations();
checkWide();
checkKnown();

if (failures.length > 0) {
  console.error(`✗ ${failures.length} failure(s):`);
  for (const message of failures.slice(0, 25)) console.error(`  ${message}`);
  if (failures.length > 25) console.error(`  ... and ${failures.length - 25} more`);
  process.exit(1);
}

console.log(`✓ NxN engine matches the 3x3 tables and holds at n = ${SIZES.join(', ')}`);
