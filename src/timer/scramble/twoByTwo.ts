/**
 * Genuine random-state 2x2 scrambles.
 *
 * A random-move 2x2 scramble is a bad scramble: eleven random turns on a puzzle
 * whose whole state space is 3.6 million positions lands on an easy case often
 * enough to notice, and a competition scramble never does. So this does what the
 * WCA's scrambler does — pick a position uniformly at random, solve it
 * optimally, and hand back the inverse.
 *
 * "Optimally" is affordable here because the puzzle is small. Fixing the DBL
 * corner leaves 7 corners: 7! orderings by 3^6 twists (the seventh twist is
 * forced, since they have to sum to zero) is 3,674,160 states. That is small
 * enough to hold a breadth-first distance from solved for *every* state in one
 * byte each — 3.6MB — after which solving is not a search at all, just walking
 * downhill.
 *
 * The table takes about a second to build, so it is built off the main thread's
 * critical path and the caller falls back to random moves until it is ready.
 * Nothing ever waits on it.
 */

const CORNERS = 7;             // URF UFL ULB UBR DFR DLF DRB — DBL never moves
const PERMS = 5040;            // 7!
const TWISTS = 729;            // 3^6; the last corner's twist is forced
const STATES = PERMS * TWISTS; // 3,674,160
const UNSEEN = 255;

/** U, R and F are a generating set for the 2x2 — the other three faces are the same turns. */
export const MOVE_NAMES = ['U', 'U2', "U'", 'R', 'R2', "R'", 'F', 'F2', "F'"];

/**
 * Where each position's piece comes from, and how much it twists on the way.
 *
 * Read as: after this move, the corner at position `i` is the one that was at
 * `from[i]`, turned `twist[i]` thirds further from home. Indices are
 * 0=URF 1=UFL 2=ULB 3=UBR 4=DFR 5=DLF 6=DRB.
 *
 * U leaves orientation alone — it turns about the axis orientation is measured
 * against. R and F do not, which is the entire reason a 2x2 is not trivial.
 */
interface Turn { from: number[]; twist: number[] }


const U: Turn = {
  from: [3, 0, 1, 2, 4, 5, 6],
  twist: [0, 0, 0, 0, 0, 0, 0],
};
const R: Turn = {
  from: [4, 1, 2, 0, 6, 5, 3],
  twist: [2, 0, 0, 1, 1, 0, 2],
};
const F: Turn = {
  from: [1, 5, 2, 3, 0, 4, 6],
  twist: [1, 2, 0, 0, 2, 1, 0],
};

/** Applying a turn to a raw (permutation, orientation) pair. */
function turnPerm(cp: number[], turn: Turn): number[] {
  return turn.from.map((source) => cp[source]);
}

function turnTwist(co: number[], turn: Turn): number[] {
  return turn.from.map((source, target) => (co[source] + turn.twist[target]) % 3);
}

// ---- coordinates ----

/** Lehmer code: a permutation of 7 as a number in [0, 5040). */
function permToIndex(cp: number[]): number {
  let index = 0;
  for (let i = 0; i < CORNERS; i += 1) {
    let smaller = 0;
    for (let j = i + 1; j < CORNERS; j += 1) if (cp[j] < cp[i]) smaller += 1;
    index = index * (CORNERS - i) + smaller;
  }
  return index;
}

function indexToPerm(index: number): number[] {
  const digits = Array<number>(CORNERS);
  let rest = index;

  for (let i = CORNERS - 1; i >= 0; i -= 1) {
    digits[i] = rest % (CORNERS - i);
    rest = Math.floor(rest / (CORNERS - i));
  }

  const available = [0, 1, 2, 3, 4, 5, 6];
  return digits.map((digit) => available.splice(digit, 1)[0]);
}

/** Six twists base 3; the seventh is whatever makes the total a multiple of 3. */
function twistToIndex(co: number[]): number {
  let index = 0;
  for (let i = 0; i < CORNERS - 1; i += 1) index = index * 3 + co[i];
  return index;
}

function indexToTwist(index: number): number[] {
  const co = Array<number>(CORNERS);
  let rest = index;
  let total = 0;

  for (let i = CORNERS - 2; i >= 0; i -= 1) {
    co[i] = rest % 3;
    total += co[i];
    rest = Math.floor(rest / 3);
  }
  co[CORNERS - 1] = (3 - (total % 3)) % 3;
  return co;
}

// ---- move tables ----

/**
 * The two coordinates move independently, which is what makes the whole thing
 * fit: a turn permutes *positions*, so where a piece ends up depends only on the
 * permutation, and how twisted it ends up depends only on the twists. Neither
 * table needs to know about the other.
 */
let permMove: Int16Array | null = null;
let twistMove: Int16Array | null = null;

function buildMoveTables(): void {
  if (permMove && twistMove) return;

  const turns = [U, R, F];
  permMove = new Int16Array(MOVE_NAMES.length * PERMS);
  twistMove = new Int16Array(MOVE_NAMES.length * TWISTS);

  for (let t = 0; t < turns.length; t += 1) {
    for (let p = 0; p < PERMS; p += 1) {
      let cp = indexToPerm(p);
      for (let quarter = 0; quarter < 3; quarter += 1) {
        cp = turnPerm(cp, turns[t]);
        permMove[(t * 3 + quarter) * PERMS + p] = permToIndex(cp);
      }
    }
    for (let o = 0; o < TWISTS; o += 1) {
      let co = indexToTwist(o);
      for (let quarter = 0; quarter < 3; quarter += 1) {
        co = turnTwist(co, turns[t]);
        twistMove[(t * 3 + quarter) * TWISTS + o] = twistToIndex(co);
      }
    }
  }
}

// ---- the distance table ----

let distance: Uint8Array | null = null;
let building = false;

/**
 * Breadth-first from solved, one depth at a time.
 *
 * Written as repeated scans of the whole array rather than with a queue: a queue
 * of 3.6M 32-bit entries is four times the memory of the answer it is helping
 * compute, and God's number for the 2x2 is 11, so this scans a 3.6MB array
 * eleven times instead. That is the cheaper trade by a wide margin.
 */
function buildDistances(): Uint8Array {
  buildMoveTables();

  const dist = new Uint8Array(STATES).fill(UNSEEN);
  dist[0] = 0;

  let frontier = 1;
  for (let depth = 0; frontier > 0; depth += 1) {
    frontier = 0;

    for (let state = 0; state < STATES; state += 1) {
      if (dist[state] !== depth) continue;

      const p = Math.floor(state / TWISTS);
      const o = state % TWISTS;

      for (let move = 0; move < MOVE_NAMES.length; move += 1) {
        const next = permMove![move * PERMS + p] * TWISTS + twistMove![move * TWISTS + o];
        if (dist[next] === UNSEEN) {
          dist[next] = depth + 1;
          frontier += 1;
        }
      }
    }
  }
  return dist;
}

/**
 * Kicks the table off without blocking. Safe to call as often as you like — the
 * second call while one is in flight does nothing, and once it is built this is
 * free.
 */
export function warmUp(): void {
  if (distance || building) return;
  building = true;

  // A macrotask, so the click that asked for a 2x2 scramble finishes painting
  // first. The build itself is synchronous; there is no useful way to yield in
  // the middle of a breadth-first search without making it much slower.
  setTimeout(() => {
    try {
      distance = buildDistances();
    } finally {
      building = false;
    }
  }, 0);
}

export function isReady(): boolean {
  return distance !== null;
}

function inverseOf(move: number): number {
  const quarter = move % 3;
  // 0 and 2 swap (a quarter turn and its reverse); 1 is a half turn, its own.
  return move - quarter + (quarter === 1 ? 1 : 2 - quarter);
}

/**
 * A scramble for a uniformly random position, or null if the table isn't built.
 *
 * The walk downhill is the solution; the scramble is that solution undone. Both
 * are optimal, because the table holds the true distance from solved rather than
 * an estimate.
 */
export function randomStateScramble(): string[] | null {
  if (!distance || !permMove || !twistMove) return null;

  let p = Math.floor(Math.random() * PERMS);
  let o = Math.floor(Math.random() * TWISTS);
  const solution: number[] = [];

  let steps = distance[p * TWISTS + o];
  while (steps > 0) {
    for (let move = 0; move < MOVE_NAMES.length; move += 1) {
      const nextP = permMove[move * PERMS + p];
      const nextO = twistMove[move * TWISTS + o];

      if (distance[nextP * TWISTS + nextO] === steps - 1) {
        solution.push(move);
        p = nextP;
        o = nextO;
        steps -= 1;
        break;
      }
    }
  }

  return solution.reverse().map((move) => MOVE_NAMES[inverseOf(move)]);
}

/** Exposed for the check script — nothing in the app needs the raw pieces. */
export const internals = {
  U, R, F, permToIndex, indexToPerm, twistToIndex, indexToTwist,
  buildDistances, STATES, PERMS, TWISTS,
};
