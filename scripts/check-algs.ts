/**
 * Asserts that every shipped algorithm is the case it claims to be.
 *
 * Run with `npm run check:algs`. No build step: node strips the types.
 *
 * An alg is a PLL if, applied to a solved cube, it leaves the U face one colour
 * and everything below the top layer untouched — which is exactly the state you
 * would be looking at when the case comes up. Anything else (a missing closing
 * rotation, a mistyped move, a wrong alg copied off a sheet) fails one of those
 * two tests. The distinctness pass then catches the subtler error: two entries
 * that are both valid PLLs but are secretly the same case under a different
 * name.
 */
import {
  alignLastLayer, applyAlg, applyPerm, faceOf, invertAlg, MOVES, solvedCube,
  type CubeState,
} from '../src/cube/moves.ts';
import { PLL_CASES, PLL_GROUPS } from '../src/cfop/pll.ts';

const failures: string[] = [];

function check(ok: boolean, message: string): void {
  if (!ok) failures.push(message);
}

const SOLVED = solvedCube();

/**
 * The top layer: the U face, plus the top row of each side face. Everything
 * else has to come back exactly as it started.
 */
const TOP_LAYER = new Set([
  0, 1, 2, 3, 4, 5, 6, 7, 8,   // U
  9, 10, 11,                   // R top row
  18, 19, 20,                  // F top row
  36, 37, 38,                  // L top row
  45, 46, 47,                  // B top row
]);

/**
 * The renderer maps cell `i` of face `X` to facelet `FACE_ORDER.indexOf(X) * 9 + i`,
 * which is only right if both it and the engine mean the same thing by
 * "row-major as seen looking straight at that face". A quarter turn of R must
 * therefore move F's right *column* to U — if the convention ever drifts it
 * shows up here as a row, long before anyone notices a wrong-looking net.
 */
function checkEngineConvention(): void {
  const afterR = applyAlg(SOLVED, 'R');
  const front = faceOf(afterR, 'F');

  check(
    front[2] === 'D' && front[5] === 'D' && front[8] === 'D',
    `R should pull D into F's right column, got ${front.join('')}`,
  );
  check(
    front[0] === 'F' && front[3] === 'F' && front[6] === 'F',
    `R should leave F's left column alone, got ${front.join('')}`,
  );
}

/** The same state seen after each of the four AUFs, reduced to one key. */
function canonical(state: CubeState): string {
  let best: string | null = null;
  let turned = state;

  for (let i = 0; i < 4; i += 1) {
    const key = turned.join('');
    if (best === null || key < best) best = key;
    turned = applyPerm(turned, MOVES.U);
  }
  return best as string;
}

function checkCases(): void {
  const seen = new Map<string, string>();
  const ids = new Set<string>();

  for (const item of PLL_CASES) {
    check(!ids.has(item.id), `duplicate id ${item.id}`);
    ids.add(item.id);

    check(
      (PLL_GROUPS as readonly string[]).includes(item.group),
      `${item.name}: unknown group "${item.group}"`,
    );

    let state: CubeState;
    try {
      state = applyAlg(SOLVED, item.alg);
    } catch (error) {
      failures.push(`${item.name}: ${(error as Error).message}`);
      continue;
    }

    const uniform = faceOf(state, 'U').every((face) => face === 'U');
    check(uniform, `${item.name}: U face is not one colour — check for a missing rotation`);

    let intact = true;
    for (let i = 9; i < 54; i += 1) {
      if (TOP_LAYER.has(i)) continue;
      if (state[i] !== SOLVED[i]) { intact = false; break; }
    }
    check(intact, `${item.name}: disturbs the bottom two layers — not a PLL`);

    if (!uniform || !intact) continue;

    const key = canonical(state);
    const twin = seen.get(key);
    check(twin === undefined, `${item.name}: same case as ${twin} (differs only by AUF)`);
    if (twin === undefined) seen.set(key, item.name);
  }

  check(
    PLL_CASES.length === 21,
    `expected 21 PLL cases, found ${PLL_CASES.length}`,
  );
}

/**
 * The case diagrams are drawn by inverting the alg, so a bug in invertAlg would
 * quietly mislabel all 21 pictures rather than crash anything.
 */
function checkInverses(): void {
  for (const item of PLL_CASES) {
    const there = applyAlg(SOLVED, item.alg);

    let back: CubeState;
    try {
      back = applyAlg(there, invertAlg(item.alg));
    } catch (error) {
      failures.push(`${item.name}: inverse does not parse — ${(error as Error).message}`);
      continue;
    }
    check(back.join('') === SOLVED.join(''), `${item.name}: invertAlg does not undo the alg`);

    // A diagram with nothing lined up is a diagram nobody can recognise, and
    // it's what a broken alignment would produce. Every PLL leaves at least a
    // few side stickers home once it's turned to the right angle.
    const aligned = alignLastLayer(applyAlg(SOLVED, invertAlg(item.alg)));
    let home = 0;
    for (const facelet of [9, 10, 11, 18, 19, 20, 36, 37, 38, 45, 46, 47]) {
      if (aligned[facelet] === SOLVED[facelet]) home += 1;
    }
    check(home >= 3, `${item.name}: only ${home} side stickers line up — check alignLastLayer`);
  }
}

checkEngineConvention();
checkCases();
checkInverses();

if (failures.length > 0) {
  console.error(`✗ ${failures.length} problem${failures.length === 1 ? '' : 's'}:`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`✓ ${PLL_CASES.length} PLL algs valid and distinct, engine convention holds`);
}
